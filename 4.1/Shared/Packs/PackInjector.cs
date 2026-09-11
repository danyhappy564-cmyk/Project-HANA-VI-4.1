using System.Text.Json;
using System.Text.Json.Nodes;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;
using HanaVi.Shared.Patching;

namespace HanaVi.Shared.Packs;

/// <summary>
/// 아이템 팩(무기·장비 묶음)을 DB 에 주입한다.
///
/// 3.11 원본은 팩마다 injectAtlasGear / injectCarlQhb / … 처럼 거의 같은 코드를
/// 복사해 두고 있었다(팩 5개 × 약 200줄). 데이터 모양이 전부 같으므로
/// 여기서는 하나의 엔진이 db/packs.json 의 설명서를 보고 처리한다.
///
/// 팩 데이터(JSON)는 3.11 원본 파일을 그대로 쓴다. 변환하지 않는다.
/// 변환하면 그 과정에서 값이 어긋날 위험이 있고, HANA_VI 가 익숙한 파일 구조도 깨진다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class PackInjector(
    ISptLogger<PackInjector> logger,
    PackReader reader,
    ICloner cloner,
    JsonUtil jsonUtil)
{
    /// <summary>이번 실행에서 이 모드가 새로 만든 아이템 ID. 필터 복사 때 제외하려고 모아 둔다.</summary>
    private readonly HashSet<MongoId> _created = new();

    // =====================================================================
    // 1단계 (Preload) — 아이템 / 의류 / 프리셋 / 숙련도
    // =====================================================================

    public int InjectItems(PackManifest pack, TemplateTable templates, GlobalTable globals)
    {
        var entries = reader.ReadEntries(pack, pack.ItemFiles);
        if (entries.Count == 0) return 0;

        var items = templates.Items;
        var made = 0;

        // (1) 아이템 생성 + 도감 등록
        foreach (var (id, entry) in entries)
        {
            if (!entry.Enable) continue;
            if (BuildItem(pack, id, entry, items)) made++;
        }

        // (2) 복제 원본이 허용/충돌하던 자리에 복제본도 넣는다 (3.11 copyToFilters)
        foreach (var (id, entry) in entries)
        {
            if (!entry.Enable || entry.Clone is null) continue;
            MirrorFilters(entry.Clone, id, entry, items, entries.Keys);
        }

        // (3) 수동으로 지정한 필터 (3.11 addToFilters)
        foreach (var (id, entry) in entries)
        {
            if (entry.Enable) ApplyManualFilters(pack, id, entry, items);
        }

        // (4) 도감
        foreach (var (id, entry) in entries)
        {
            if (entry.Enable) AddHandbook(pack, id, entry, templates);
        }

        if (pack.UseGlobals) InjectGlobals(pack, globals);
        return made;
    }

    private bool BuildItem(PackManifest pack, string id, PackEntry entry,
                           Dictionary<MongoId, TemplateItem> items)
    {
        var newId = new MongoId(id);
        if (items.ContainsKey(newId)) return false;   // 이미 있다 (다른 모드이거나 재실행)

        TemplateItem? built;

        if (entry.Clone is not null)
        {
            if (!items.TryGetValue(new MongoId(entry.Clone), out var source))
            {
                logger.Warning($"[{pack.Name}] {id}: 복제 원본 {entry.Clone} 이 DB 에 없어 건너뛴다");
                return false;
            }

            // 깊은 복사여야 한다. record 의 with 식은 얕은 복사라서 슬롯 목록이 원본과
            // 공유되고, 복제본 슬롯을 고치면 원본까지 바뀐다.
            built = cloner.Clone(source) with { Id = newId };
            built = ApplyOverrides(pack, id, built, entry.Item);
        }
        else
        {
            // clone 없이 item 을 통째로 정의한 경우
            if (entry.Item is not { } whole)
            {
                logger.Error($"[{pack.Name}] {id}: clone 도 item 도 없어 아이템을 만들 수 없다");
                return false;
            }

            try
            {
                built = jsonUtil.Deserialize<TemplateItem>(whole.GetRawText());
            }
            catch (Exception ex)
            {
                logger.Error($"[{pack.Name}] {id}: item 정의를 읽지 못했다 — {ex.Message}");
                return false;
            }

            if (built is null) return false;
            built = built with { Id = newId };
        }

        if (built is null) return false;

        items[newId] = built;
        _created.Add(newId);
        return true;
    }

    /// <summary>
    /// 3.11 의 compareAndReplace 에 대응. 덮어쓸 값이 게임 JSON 과 같은 중첩 구조라서,
    /// 리플렉션으로 한 단계씩 내려가는 대신 JSON 으로 바꿔 깊은 병합을 한 뒤 되돌린다.
    /// SPT 의 JsonUtil 을 쓰는 이유는 MongoId 같은 타입을 다룰 변환기가 필요하기 때문이다.
    /// </summary>
    private TemplateItem? ApplyOverrides(PackManifest pack, string id, TemplateItem item, JsonElement? overrides)
    {
        if (overrides is not { ValueKind: JsonValueKind.Object } patch) return item;

        try
        {
            var baseNode = JsonNode.Parse(jsonUtil.Serialize(item, false));
            var patchNode = JsonNode.Parse(patch.GetRawText());
            if (baseNode is null || patchNode is null) return item;

            DeepMerge(baseNode, patchNode);
            return jsonUtil.Deserialize<TemplateItem>(baseNode.ToJsonString()) ?? item;
        }
        catch (Exception ex)
        {
            logger.Error($"[{pack.Name}] {id}: item 덮어쓰기 실패 — {ex.Message}");
            return item;
        }
    }

    /// <summary>객체는 키 단위로 파고들고, 배열·숫자·문자열은 통째로 교체한다.</summary>
    private static void DeepMerge(JsonNode target, JsonNode patch)
    {
        if (target is not JsonObject to || patch is not JsonObject from) return;

        foreach (var (key, value) in from)
        {
            if (value is JsonObject && to[key] is JsonObject existing)
            {
                DeepMerge(existing, value);
            }
            else
            {
                to[key] = value?.DeepClone();
            }
        }
    }

    /// <summary>
    /// 3.11 의 copyToFilters. 복제 원본이 들어갈 수 있던 모든 슬롯에 복제본도 넣고,
    /// 원본과 충돌하던 아이템은 복제본과도 충돌시킨다.
    /// 이 팩이 방금 만든 아이템들은 대상에서 뺀다(원본과 같은 규칙).
    /// </summary>
    private void MirrorFilters(string sourceId, string newId, PackEntry entry,
                               Dictionary<MongoId, TemplateItem> items, IEnumerable<string> packIds)
    {
        var src = new MongoId(sourceId);
        var dst = new MongoId(newId);
        var skip = packIds.Select(p => new MongoId(p)).ToHashSet();

        foreach (var (id, item) in items)
        {
            if (skip.Contains(id)) continue;

            var props = item.Properties;
            if (props is null) continue;

            if (entry.EnableCloneCompats)
            {
                foreach (var slot in AllSlots(props))
                {
                    foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                    {
                        if (filter.Filter is not null && filter.Filter.Contains(src)) filter.Filter.Add(dst);
                    }
                }
            }

            if (entry.EnableCloneConflicts && props.ConflictingItems is not null
                && props.ConflictingItems.Contains(src))
            {
                props.ConflictingItems.Add(dst);
            }
        }
    }

    private static IEnumerable<Slot> AllSlots(TemplateItemProperties props)
    {
        foreach (var s in props.Slots ?? Array.Empty<Slot>()) yield return s;
        foreach (var s in props.Chambers ?? Array.Empty<Slot>()) yield return s;
        foreach (var s in props.Cartridges ?? Array.Empty<Slot>()) yield return s;
    }

    /// <summary>3.11 의 addToFilters. "conflicts" 키는 슬롯이 아니라 충돌 목록을 뜻한다.</summary>
    private void ApplyManualFilters(PackManifest pack, string id, PackEntry entry,
                                    Dictionary<MongoId, TemplateItem> items)
    {
        var self = new MongoId(id);

        if (entry.AddToThisItemsFilters is { Count: > 0 } mine
            && items.TryGetValue(self, out var item) && item.Properties is not null)
        {
            foreach (var (slotName, ids) in mine)
            {
                if (slotName == "conflicts")
                {
                    item.Properties.ConflictingItems ??= new HashSet<MongoId>();
                    foreach (var c in ids) item.Properties.ConflictingItems.Add(new MongoId(c));
                    continue;
                }

                foreach (var slot in AllSlots(item.Properties).Where(s => s.Name == slotName))
                {
                    foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                    {
                        filter.Filter ??= new HashSet<MongoId>();
                        foreach (var c in ids) filter.Filter.Add(new MongoId(c));
                    }
                }
            }
        }

        if (entry.AddToExistingItemFilters is not { Count: > 0 } others) return;

        foreach (var (slotName, targetIds) in others)
        {
            foreach (var targetId in targetIds)
            {
                if (!items.TryGetValue(new MongoId(targetId), out var target) || target.Properties is null)
                {
                    logger.Warning($"[{pack.Name}] {id}: 대상 아이템 {targetId} 를 찾을 수 없어 건너뛴다");
                    continue;
                }

                if (slotName == "conflicts")
                {
                    target.Properties.ConflictingItems ??= new HashSet<MongoId>();
                    target.Properties.ConflictingItems.Add(self);
                    continue;
                }

                foreach (var slot in AllSlots(target.Properties).Where(s => s.Name == slotName))
                {
                    foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                    {
                        filter.Filter ??= new HashSet<MongoId>();
                        filter.Filter.Add(self);
                    }
                }
            }
        }
    }

    private void AddHandbook(PackManifest pack, string id, PackEntry entry, TemplateTable templates)
    {
        if (entry.Handbook is null || string.IsNullOrEmpty(entry.Handbook.ParentId)) return;

        var itemId = new MongoId(id);
        templates.Handbook.Items ??= new List<HandbookItem>();
        if (templates.Handbook.Items.Any(h => h.Id == itemId)) return;

        templates.Handbook.Items.Add(new HandbookItem
        {
            Id = itemId,
            ParentId = new MongoId(entry.Handbook.ParentId),
            Price = entry.Handbook.Price,
        });
    }

    public int InjectClothing(PackManifest pack, TemplateTable templates)
    {
        var entries = reader.ReadEntries(pack, pack.ClothesFiles);
        if (entries.Count == 0) return 0;

        templates.Customization ??= new Dictionary<MongoId, CustomizationItem>();
        var made = 0;

        foreach (var (id, entry) in entries)
        {
            if (!entry.Enable) continue;

            var newId = new MongoId(id);
            if (templates.Customization.ContainsKey(newId)) continue;

            CustomizationItem? built = null;

            if (entry.Clone is not null
                && templates.Customization.TryGetValue(new MongoId(entry.Clone), out var source))
            {
                built = cloner.Clone(source) with { Id = newId };
                built = ApplyClothingOverrides(pack, id, built, entry.Item);
            }
            else if (entry.Item is { } whole)
            {
                try { built = jsonUtil.Deserialize<CustomizationItem>(whole.GetRawText()); }
                catch (Exception ex) { logger.Error($"[{pack.Name}] 의류 {id}: {ex.Message}"); }
                if (built is not null) built = built with { Id = newId };
            }

            if (built is null)
            {
                logger.Warning($"[{pack.Name}] 의류 {id} 를 만들지 못했다");
                continue;
            }

            templates.Customization[newId] = built;
            made++;
        }

        return made;
    }

    private CustomizationItem? ApplyClothingOverrides(PackManifest pack, string id,
                                                      CustomizationItem item, JsonElement? overrides)
    {
        if (overrides is not { ValueKind: JsonValueKind.Object } patch) return item;

        try
        {
            var baseNode = JsonNode.Parse(jsonUtil.Serialize(item, false));
            var patchNode = JsonNode.Parse(patch.GetRawText());
            if (baseNode is null || patchNode is null) return item;

            DeepMerge(baseNode, patchNode);
            return jsonUtil.Deserialize<CustomizationItem>(baseNode.ToJsonString()) ?? item;
        }
        catch (Exception ex)
        {
            logger.Error($"[{pack.Name}] 의류 {id}: 덮어쓰기 실패 — {ex.Message}");
            return item;
        }
    }

    private void InjectGlobals(PackManifest pack, GlobalTable globals)
    {
        var node = reader.ReadNode(Path.Combine(reader.PackFolder(pack), "globals.json"));
        if (node is not JsonObject root) return;

        // 무기 프리셋
        if (root["ItemPresets"] is JsonObject presets)
        {
            globals.ItemPresets ??= new Dictionary<MongoId, Preset>();
            foreach (var (presetId, value) in presets)
            {
                if (value is null) continue;

                try
                {
                    var preset = jsonUtil.Deserialize<Preset>(value.ToJsonString());
                    if (preset is not null) globals.ItemPresets[new MongoId(presetId)] = preset;
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 프리셋 {presetId} 를 읽지 못했다: {ex.Message}");
                }
            }
        }

        // 숙련도(Mastering). 4.1 에서는 List 가 아니라 배열이라 새 배열로 갈아 끼운다.
        if (root["config"]?["Mastering"] is JsonArray mastering && globals.Configuration is not null)
        {
            var current = globals.Configuration.Mastering?.ToList() ?? new List<Mastering>();

            foreach (var entry in mastering)
            {
                if (entry is null) continue;

                try
                {
                    var m = jsonUtil.Deserialize<Mastering>(entry.ToJsonString());
                    if (m is not null) current.Add(m);
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] Mastering 항목을 읽지 못했다: {ex.Message}");
                }
            }

            // 원본이 기존 숙련도 항목에 템플릿을 끼워 넣던 처리.
            // 4.1 의 Mastering.Templates 는 IEnumerable<MongoId> 라서 24자 16진수만 들어간다.
            if (pack.MasteryTemplates is { Count: > 0 })
            {
                foreach (var m in current)
                {
                    if (m.Name is null || !pack.MasteryTemplates.TryGetValue(m.Name, out var extra)) continue;

                    var list = m.Templates?.ToList() ?? new List<MongoId>();
                    foreach (var t in extra)
                    {
                        if (!MongoIds.TryParse(t, out var tid))
                        {
                            logger.Warning($"[{pack.Name}] 숙련도 '{m.Name}' 의 템플릿 '{t}' 는 " +
                                           $"24자 16진수 ID 가 아니라 건너뛴다");
                            continue;
                        }

                        if (!list.Contains(tid)) list.Add(tid);
                    }

                    m.Templates = list;
                }
            }

            globals.Configuration.Mastering = current.ToArray();
        }
    }

    // =====================================================================
    // 2단계 (TraderRegistration) — 상인 판매 목록 / 의상 판매
    // =====================================================================

    public int InjectTraders(PackManifest pack, TradersTable traders, bool forceLoyaltyLevel1)
    {
        if (!pack.UseTraders) return 0;

        var added = 0;

        foreach (var (traderId, folder) in reader.TraderFolders(pack))
        {
            var trader = traders.GetTrader(new MongoId(traderId));
            if (trader is null)
            {
                logger.Warning($"[{pack.Name}] 상인 {traderId} 를 찾을 수 없어 건너뛴다");
                continue;
            }

            added += AddAssort(pack, trader, Path.Combine(folder, "assort.json"), forceLoyaltyLevel1);
            added += AddSuits(pack, trader, Path.Combine(folder, "suits.json"));
        }

        return added;
    }

    private int AddAssort(PackManifest pack, Trader trader, string path, bool forceLoyaltyLevel1)
    {
        var src = reader.ReadJson<PackAssort>(path);
        if (src is null) return 0;

        var assort = trader.Assort;
        if (assort is null) return 0;

        assort.Items ??= new List<Item>();
        assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
        assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

        var added = 0;

        foreach (var raw in src.Items ?? new List<JsonElement>())
        {
            try
            {
                var item = jsonUtil.Deserialize<Item>(raw.GetRawText());
                if (item is null) continue;
                if (assort.Items.Any(i => i.Id == item.Id)) continue;

                assort.Items.Add(item);
                added++;
            }
            catch (Exception ex)
            {
                logger.Error($"[{pack.Name}] 어사트 항목을 읽지 못했다: {ex.Message}");
            }
        }

        foreach (var (id, raw) in src.BarterScheme ?? new Dictionary<string, JsonElement>())
        {
            try
            {
                var scheme = jsonUtil.Deserialize<List<List<BarterScheme>>>(raw.GetRawText());
                if (scheme is not null) assort.BarterScheme[new MongoId(id)] = scheme;
            }
            catch (Exception ex)
            {
                logger.Error($"[{pack.Name}] 가격표 {id} 를 읽지 못했다: {ex.Message}");
            }
        }

        foreach (var (id, level) in src.LoyalLevelItems ?? new Dictionary<string, int>())
        {
            // config 의 lvl1Traders 가 켜져 있으면 전부 충성도 1 로 내린다 (3.11 과 동일).
            assort.LoyalLevelItems[new MongoId(id)] = forceLoyaltyLevel1 ? 1 : level;
        }

        return added;
    }

    private int AddSuits(PackManifest pack, Trader trader, string path)
    {
        var suits = reader.ReadJson<List<JsonElement>>(path);
        if (suits is null or { Count: 0 }) return 0;

        if (trader.Base is not null) trader.Base.CustomizationSeller = true;
        trader.Suits ??= new List<Suit>();

        var added = 0;
        foreach (var raw in suits)
        {
            try
            {
                var suit = jsonUtil.Deserialize<Suit>(raw.GetRawText());
                if (suit is null) continue;
                if (trader.Suits.Any(s => s.Id == suit.Id)) continue;

                trader.Suits.Add(suit);
                added++;
            }
            catch (Exception ex)
            {
                logger.Error($"[{pack.Name}] 의상 항목을 읽지 못했다: {ex.Message}");
            }
        }

        return added;
    }

    // =====================================================================
    // 로케일
    // =====================================================================

    /// <summary>팩의 items/clothes 에 적힌 locales 를 "ID Name" 형식으로 펼친다.</summary>
    public Dictionary<string, Dictionary<string, string>> CollectLocales(PackManifest pack)
    {
        var byLang = new Dictionary<string, Dictionary<string, string>>();

        void Collect(Dictionary<string, PackEntry> entries)
        {
            foreach (var (id, entry) in entries)
            {
                if (!entry.Enable) continue;

                foreach (var (lang, loc) in entry.Locales ?? new Dictionary<string, PackLocale>())
                {
                    if (!byLang.TryGetValue(lang, out var dict))
                    {
                        dict = new Dictionary<string, string>();
                        byLang[lang] = dict;
                    }

                    if (loc.Name is not null) dict[$"{id} Name"] = loc.Name;
                    if (loc.ShortName is not null) dict[$"{id} ShortName"] = loc.ShortName;
                    if (loc.Description is not null) dict[$"{id} Description"] = loc.Description;
                }

                // 프리셋 이름은 프리셋 ID 를 키로 그대로 넣는다 (3.11 과 동일).
                foreach (var (presetId, presetName) in entry.Presets ?? new Dictionary<string, string>())
                {
                    foreach (var dict in byLang.Values) dict[presetId] = presetName;
                }
            }
        }

        Collect(reader.ReadEntries(pack, pack.ItemFiles));
        Collect(reader.ReadEntries(pack, pack.ClothesFiles));
        return byLang;
    }
}
