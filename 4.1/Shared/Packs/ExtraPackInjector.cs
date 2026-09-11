using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using HanaVi.Shared.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Services.Modding.Custom;
using SPTarkov.Server.Core.Utils;

namespace HanaVi.Shared.Packs;

/// <summary>
/// hanamod 형식이 아닌 팩들(WTT / mxlr / mosin / nerv_inv)을 주입한다.
///
/// 3.11 원본이 팩마다 다른 형식을 쓰고 있어서, 데이터를 통일하는 대신 형식별
/// 처리기를 둔다. 데이터 변환은 하지 않는다 — 원본 JSON 을 그대로 읽는다.
///
/// WTT / nerv 형식은 SPT 의 CustomItemService.CreateItemFromClone 을 그대로 쓴다.
/// 3.11 도 같은 서비스를 썼고, 이 서비스가 도감·로케일·플리 가격 등록까지 해 준다.
/// 게다가 아이템 추가 시점이 늦으면 SPT 가 스스로 막아 주므로 더 안전하다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class ExtraPackInjector(
    ISptLogger<ExtraPackInjector> logger,
    PackReader reader,
    CustomItemService customItems,
    JsonUtil jsonUtil)
{
    /// <summary>3.11 의 wttCurrencyIds. JSON 에 "ROUBLES" 처럼 이름으로 적혀 있다.</summary>
    private static readonly Dictionary<string, string> Currencies = new()
    {
        ["ROUBLES"] = "5449016a4bdc2d6f028b456f",
        ["EUROS"] = "569668774bdc2da2298b4568",
        ["DOLLARS"] = "5696686a4bdc2da3298b456a",
    };

    /// <summary>3.11 의 wttTraderIds. 상인을 ID 대신 이름으로 적을 수 있다.</summary>
    private static readonly Dictionary<string, string> Traders = new()
    {
        ["MECHANIC"] = "5a7c2eca46aef81a7ca2145d",
        ["SKIER"] = "58330581ace78e27b8b10cee",
        ["PEACEKEEPER"] = "5935c25fb3acc3127c3d8cd9",
        ["THERAPIST"] = "54cb57776803fa99248b456e",
        ["PRAPOR"] = "54cb50c76803fa8b248b4571",
        ["JAEGAR"] = "5c0647fdd443bc2504c2d371",
        ["RAGMAN"] = "5ac3b934156ae10c4430e83c",
        ["FENCE"] = "579dc571d53a0658a154fbec",
    };

    /// <summary>SPT 기본 인벤토리 템플릿. WTT 의 addtoInventorySlots 가 이걸 고친다.</summary>
    private const string DefaultInventoryTpl = "55d7217a4bdc2d86028b456d";

    private static string ResolveCurrency(string? token)
        => token is not null && Currencies.TryGetValue(token, out var id) ? id : token ?? Currencies["ROUBLES"];

    private static string ResolveTrader(string? token)
        => token is not null && Traders.TryGetValue(token, out var id) ? id : token ?? "";

    // =====================================================================
    // WTT 형식 (db/packs/Items/*.json)
    // =====================================================================

    public int InjectWtt(PackManifest pack, TemplateTable templates)
    {
        var folder = reader.PackFolder(pack);
        if (!Directory.Exists(folder)) return 0;

        var made = 0;

        foreach (var file in Directory.GetFiles(folder, "*.json").OrderBy(f => f, StringComparer.Ordinal))
        {
            if (reader.ReadNode(file) is not JsonObject root) continue;

            foreach (var (itemId, node) in root)
            {
                if (node is not JsonObject cfg) continue;
                if (cfg["itemTplToClone"]?.GetValue<string>() is not { } sourceTpl) continue;

                if (CreateFromClone(pack, itemId, sourceTpl, cfg,
                                    defaultPrefab: $"customItems/{itemId}.bundle",
                                    parentKey: "parentId", overrideKey: "overrideProperties"))
                {
                    made++;
                }

                AddToInventorySlots(pack, itemId, cfg, templates);
            }
        }

        return made;
    }

    /// <summary>WTT 의 addtoInventorySlots — 기본 인벤토리의 특정 칸에 이 아이템을 허용시킨다.</summary>
    private void AddToInventorySlots(PackManifest pack, string itemId, JsonObject cfg, TemplateTable templates)
    {
        if (cfg["addtoInventorySlots"] is not JsonArray allowedNode || allowedNode.Count == 0) return;

        var allowed = allowedNode.Select(n => n?.GetValue<string>())
                                 .Where(s => s is not null)
                                 .ToHashSet()!;

        if (!templates.Items.TryGetValue(new MongoId(DefaultInventoryTpl), out var inventory)) return;
        if (inventory.Properties?.Slots is null) return;
        if (!MongoIds.TryParse(itemId, out var id)) return;

        foreach (var slot in inventory.Properties.Slots)
        {
            // 슬롯 이름("FirstPrimaryWeapon")이나 슬롯 ID 중 아무거나 적어도 인식한다 (3.11 과 동일).
            if (!allowed.Contains(slot.Name) && !allowed.Contains(slot.Id?.ToString())) continue;

            foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
            {
                filter.Filter ??= new HashSet<MongoId>();
                filter.Filter.Add(id);
            }
        }
    }

    /// <summary>WTT 의 addtoTraders — 상인 판매 등록.</summary>
    public int InjectWttTraders(PackManifest pack, TradersTable traders)
    {
        var folder = reader.PackFolder(pack);
        if (!Directory.Exists(folder)) return 0;

        var added = 0;

        foreach (var file in Directory.GetFiles(folder, "*.json"))
        {
            if (reader.ReadNode(file) is not JsonObject root) continue;

            foreach (var (itemId, node) in root)
            {
                if (node is not JsonObject cfg) continue;
                if (cfg["addtoTraders"]?.GetValue<bool>() != true) continue;

                var traderId = ResolveTrader(cfg["traderId"]?.GetValue<string>());
                if (!MongoIds.TryParse(traderId, out var tid)) continue;

                var trader = traders.GetTrader(tid);
                if (trader?.Assort is null) continue;
                if (!MongoIds.TryParse(itemId, out var id)) continue;

                var assort = trader.Assort;
                assort.Items ??= new List<Item>();
                assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
                assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

                if (assort.Items.Any(i => i.Id == id)) continue;

                // traderItems[0] 에 재고 설정이 있으면 쓰고, 없으면 무한 재고가 기본이다.
                var first = (cfg["traderItems"] as JsonArray)?.FirstOrDefault() as JsonObject;
                var unlimited = first?["unlimitedCount"]?.GetValue<bool>() ?? true;
                var stack = first?["stackObjectsCount"]?.GetValue<double>() ?? 999999;

                assort.Items.Add(new Item
                {
                    Id = id,
                    Template = id,
                    ParentId = "hideout",
                    SlotId = "hideout",
                    Upd = new Upd { UnlimitedCount = unlimited, StackObjectsCount = stack },
                });

                var scheme = new List<List<BarterScheme>>();
                if (cfg["barterScheme"] is JsonArray barter && barter.Count > 0)
                {
                    foreach (var entry in barter.OfType<JsonObject>())
                    {
                        var tpl = ResolveCurrency(entry["_tpl"]?.GetValue<string>());
                        if (!MongoIds.TryParse(tpl, out var currency)) continue;

                        scheme.Add([new BarterScheme
                        {
                            Template = currency,
                            Count = entry["count"]?.GetValue<double>() ?? 1,
                        }]);
                    }
                }

                if (scheme.Count == 0)
                {
                    // 기본값: 도감 가격만큼 루블로 판다 (3.11 과 동일)
                    scheme.Add([new BarterScheme
                    {
                        Template = new MongoId(Currencies["ROUBLES"]),
                        Count = cfg["handbookPriceRoubles"]?.GetValue<double>() ?? 1,
                    }]);
                }

                assort.BarterScheme[id] = scheme;
                assort.LoyalLevelItems[id] = (int)(cfg["loyallevelitems"]?.GetValue<double>() ?? 1);
                added++;
            }
        }

        return added;
    }

    // =====================================================================
    // nerv_inv 형식 (g36, nervex)
    // =====================================================================

    public int InjectNerv(PackManifest pack, TemplateTable templates)
    {
        var dir = Path.Combine(reader.PackFolder(pack), "nerv_inv");
        if (!Directory.Exists(dir)) return 0;

        var made = 0;

        foreach (var file in Directory.GetFiles(dir, "*.json", SearchOption.AllDirectories)
                                      .OrderBy(f => f, StringComparer.Ordinal))
        {
            if (reader.ReadNode(file) is not JsonObject root) continue;
            if (root["overwriteProperties"] is not JsonObject cfg) continue;

            var itemId = cfg["newId"]?.GetValue<string>();
            var sourceTpl = cfg["itemTplToClone"]?.GetValue<string>();
            if (itemId is null || sourceTpl is null) continue;

            if (CreateFromClone(pack, itemId, sourceTpl, cfg,
                                defaultPrefab: null, parentKey: "parentId", overrideKey: "overrideProperties"))
            {
                made++;
            }

            AddNervSlots(pack, itemId, root, templates);
        }

        return made;
    }

    /// <summary>slotsToAdd — targetID 의 slotName 슬롯에 이 아이템을 허용시킨다.</summary>
    private void AddNervSlots(PackManifest pack, string itemId, JsonObject root, TemplateTable templates)
    {
        if (root["slotsToAdd"] is not JsonObject add) return;
        if (!MongoIds.TryParse(itemId, out var id)) return;

        var targets = (add["targetID"] as JsonArray)?.Select(n => n?.GetValue<string>()).Where(s => s is not null).ToList()
                      ?? new List<string?>();
        var slotNames = (add["slotName"] as JsonArray)?.Select(n => n?.GetValue<string>()).Where(s => s is not null).ToHashSet()
                        ?? new HashSet<string?>();

        foreach (var target in targets)
        {
            if (!MongoIds.TryParse(target, out var tid)
                || !templates.Items.TryGetValue(tid, out var item)
                || item.Properties?.Slots is null)
            {
                logger.Warning($"[{pack.Name}] {itemId}: 대상 아이템 {target} 을(를) 찾을 수 없어 건너뛴다");
                continue;
            }

            foreach (var slot in item.Properties.Slots.Where(s => slotNames.Contains(s.Name)))
            {
                foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                {
                    filter.Filter ??= new HashSet<MongoId>();
                    filter.Filter.Add(id);
                }
            }
        }
    }

    /// <summary>traderToAdd — nerv 형식의 상인 등록.</summary>
    public int InjectNervTraders(PackManifest pack, TradersTable traders)
    {
        var dir = Path.Combine(reader.PackFolder(pack), "nerv_inv");
        if (!Directory.Exists(dir)) return 0;

        var added = 0;

        foreach (var file in Directory.GetFiles(dir, "*.json", SearchOption.AllDirectories))
        {
            if (reader.ReadNode(file) is not JsonObject root) continue;
            if (root["traderToAdd"] is not JsonObject t) continue;
            if (root["overwriteProperties"]?["newId"]?.GetValue<string>() is not { } itemId) continue;

            if (!MongoIds.TryParse(ResolveTrader(t["traderID"]?.GetValue<string>()), out var tid)) continue;
            if (!MongoIds.TryParse(itemId, out var id)) continue;

            var trader = traders.GetTrader(tid);
            if (trader?.Assort is null) continue;

            var assort = trader.Assort;
            assort.Items ??= new List<Item>();
            assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
            assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

            if (assort.Items.Any(i => i.Id == id)) continue;

            var restriction = t["BuyRestrictionMax"]?.GetValue<double>();
            assort.Items.Add(new Item
            {
                Id = id,
                Template = id,
                ParentId = "hideout",
                SlotId = "hideout",
                Upd = new Upd
                {
                    UnlimitedCount = restriction is null,
                    StackObjectsCount = restriction ?? 999999,
                    BuyRestrictionMax = restriction,
                    BuyRestrictionCurrent = restriction is null ? null : 0,
                },
            });

            if (!MongoIds.TryParse(ResolveCurrency(t["barter_scheme"]?.GetValue<string>()), out var currency))
            {
                currency = new MongoId(Currencies["ROUBLES"]);
            }

            assort.BarterScheme[id] =
            [
                [new BarterScheme { Template = currency, Count = t["barter_scheme_value"]?.GetValue<double>() ?? 1 }]
            ];

            assort.LoyalLevelItems[id] = (int)(t["loyal_level_items"]?.GetValue<double>() ?? 1);
            added++;
        }

        return added;
    }

    // =====================================================================
    // raw 형식 (mxlr) — 이미 완성된 템플릿을 그대로 DB 에 얹는다
    // =====================================================================

    public int InjectRaw(PackManifest pack, TemplateTable templates)
    {
        var root = reader.PackFolder(pack);
        var made = 0;

        // 1) templates/items.json
        var itemsPath = Path.Combine(root, "templates", "items.json");
        if (reader.ReadNode(itemsPath) is JsonObject itemsRoot)
        {
            foreach (var (tplId, node) in itemsRoot)
            {
                if (node is null || !MongoIds.TryParse(tplId, out var id)) continue;

                try
                {
                    var item = jsonUtil.Deserialize<TemplateItem>(node.ToJsonString());
                    if (item is null) continue;

                    templates.Items[id] = item;
                    made++;
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 아이템 {tplId} 를 읽지 못했다: {ex.Message}");
                }
            }
        }

        // 2) templates/handbook.json — 도감 항목 + 플리 기준가
        var handbookPath = Path.Combine(root, "templates", "handbook.json");
        if (reader.ReadNode(handbookPath)?["Items"] is JsonArray hbItems)
        {
            templates.Handbook.Items ??= new List<HandbookItem>();
            templates.Prices ??= new Dictionary<MongoId, double>();

            foreach (var node in hbItems.OfType<JsonObject>())
            {
                try
                {
                    var entry = jsonUtil.Deserialize<HandbookItem>(node.ToJsonString());
                    if (entry is null) continue;
                    if (templates.Handbook.Items.Any(h => h.Id == entry.Id)) continue;

                    templates.Handbook.Items.Add(entry);
                    if (entry.Price is { } price) templates.Prices[entry.Id] = price;
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 도감 항목을 읽지 못했다: {ex.Message}");
                }
            }
        }

        return made;
    }

    // =====================================================================
    // mosin 형식 — newitems.json + modifyItem.json
    // =====================================================================

    public int InjectMosin(PackManifest pack, TemplateTable templates)
    {
        var root = reader.PackFolder(pack);
        var made = 0;

        // newitems.json: itemsSlot 배열이 완성된 아이템 템플릿들이다
        if (reader.ReadNode(Path.Combine(root, "newitems.json"))?["itemsSlot"] is JsonArray slots)
        {
            foreach (var node in slots.OfType<JsonObject>())
            {
                var tplId = node["_id"]?.GetValue<string>();
                if (tplId is null || !MongoIds.TryParse(tplId, out var id)) continue;

                try
                {
                    var item = jsonUtil.Deserialize<TemplateItem>(node.ToJsonString());
                    if (item is null) continue;

                    templates.Items[id] = item;
                    made++;
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 아이템 {tplId} 를 읽지 못했다: {ex.Message}");
                }
            }
        }

        // modifyItem.json
        if (reader.ReadNode(Path.Combine(root, "modifyItem.json")) is not JsonObject modify) return made;

        // itemsToAdd: 기존 아이템 슬롯에 끼워 넣기 + 도감 등록
        if (modify["itemsToAdd"] is JsonArray toAdd)
        {
            templates.Handbook.Items ??= new List<HandbookItem>();

            foreach (var entry in toAdd.OfType<JsonObject>())
            {
                if (!MongoIds.TryParse(entry["_id"]?.GetValue<string>(), out var id)) continue;

                // slotAdd 는 targetId / slotName 두 배열을 같은 순서로 짝지어 읽는다
                // (3.11 의 forEach(value, index) 구조 그대로다).
                if (entry["slotAdd"] is JsonObject slotAdd)
                {
                    var targetIds = slotAdd["targetId"] as JsonArray;
                    var slotNames = slotAdd["slotName"] as JsonArray;

                    for (var i = 0; targetIds is not null && i < targetIds.Count; i++)
                    {
                        if (!MongoIds.TryParse(targetIds[i]?.GetValue<string>(), out var tid)) continue;
                        if (!templates.Items.TryGetValue(tid, out var target) || target.Properties?.Slots is null) continue;

                        var slotName = slotNames is not null && i < slotNames.Count
                            ? slotNames[i]?.GetValue<string>()
                            : null;
                        if (slotName is null) continue;

                        // 3.11 은 find() 로 첫 번째 일치 슬롯 하나만 고친다.
                        var slot = target.Properties.Slots.FirstOrDefault(x => x.Name == slotName);
                        foreach (var filter in slot?.Properties?.Filters ?? Array.Empty<SlotFilter>())
                        {
                            filter.Filter ??= new HashSet<MongoId>();
                            filter.Filter.Add(id);
                        }
                    }
                }

                if (entry["handbook"] is JsonObject hb)
                {
                    try
                    {
                        var hbItem = jsonUtil.Deserialize<HandbookItem>(hb.ToJsonString());
                        if (hbItem is not null && templates.Handbook.Items.All(h => h.Id != hbItem.Id))
                        {
                            templates.Handbook.Items.Add(hbItem);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.Error($"[{pack.Name}] 도감 항목을 읽지 못했다: {ex.Message}");
                    }
                }
            }
        }

        // itemsToConflicts: 충돌 아이템 등록
        if (modify["itemsToConflicts"] is JsonArray conflicts)
        {
            foreach (var entry in conflicts.OfType<JsonObject>())
            {
                if (!MongoIds.TryParse(entry["_id"]?.GetValue<string>(), out var id)) continue;
                if (!templates.Items.TryGetValue(id, out var item) || item.Properties is null) continue;

                item.Properties.ConflictingItems ??= new HashSet<MongoId>();
                foreach (var c in (entry["ConflictingItems"] as JsonArray) ?? new JsonArray())
                {
                    if (MongoIds.TryParse(c?.GetValue<string>(), out var cid)) item.Properties.ConflictingItems.Add(cid);
                }
            }
        }

        return made;
    }

    /// <summary>
    /// mosin 의 modifyItem.json 에 들어 있는 상인 판매 등록.
    /// 아이템 등록과 단계가 달라야 해서 따로 뺐다.
    /// </summary>
    public int InjectMosinTraders(PackManifest pack, TradersTable traders)
    {
        var path = Path.Combine(reader.PackFolder(pack), "modifyItem.json");
        if (reader.ReadNode(path)?["itemsToAdd"] is not JsonArray toAdd) return 0;

        var added = 0;

        foreach (var entry in toAdd.OfType<JsonObject>())
        {
            if (entry["traderAssort"] is not JsonObject ta) continue;
            if (!MongoIds.TryParse(entry["_id"]?.GetValue<string>(), out var addId)) continue;
            if (!MongoIds.TryParse(ResolveTrader(ta["traderName"]?.GetValue<string>()), out var tid)) continue;

            var trader = traders.GetTrader(tid);
            if (trader?.Assort is null) continue;
            if (ta["itemList"] is not JsonObject itemList) continue;

            var assort = trader.Assort;
            assort.Items ??= new List<Item>();
            assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
            assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

            // items 는 배열이 아니라 객체 하나다 (3.11 도 push(itemList.items) 로 하나만 넣는다).
            if (itemList["items"] is JsonObject rawItem)
            {
                try
                {
                    var item = jsonUtil.Deserialize<Item>(rawItem.ToJsonString());
                    if (item is not null && assort.Items.All(i => i.Id != item.Id))
                    {
                        assort.Items.Add(item);
                        added++;
                    }
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 어사트 항목을 읽지 못했다: {ex.Message}");
                }
            }

            foreach (var (id, raw) in (itemList["barter_scheme"] as JsonObject) ?? new JsonObject())
            {
                if (raw is null || !MongoIds.TryParse(id, out var iid)) continue;

                try
                {
                    var scheme = jsonUtil.Deserialize<List<List<BarterScheme>>>(raw.ToJsonString());
                    if (scheme is not null) assort.BarterScheme[iid] = scheme;
                }
                catch (Exception ex)
                {
                    logger.Error($"[{pack.Name}] 가격표 {id} 를 읽지 못했다: {ex.Message}");
                }
            }

            // 3.11 은 loyal_level_items 의 '첫 번째 값'을 가져다 addId 에 붙인다.
            if ((itemList["loyal_level_items"] as JsonObject)?.FirstOrDefault().Value is { } level)
            {
                assort.LoyalLevelItems[addId] = (int)level.GetValue<double>();
            }
        }

        return added;
    }

    // =====================================================================
    // 공통: CustomItemService 로 복제 아이템 만들기
    // =====================================================================

    private bool CreateFromClone(PackManifest pack, string itemId, string sourceTpl, JsonObject cfg,
                                 string? defaultPrefab, string parentKey, string overrideKey)
    {
        if (!MongoIds.TryParse(itemId, out var newId) || !MongoIds.TryParse(sourceTpl, out var source))
        {
            logger.Error($"[{pack.Name}] {itemId}: ID 가 24자 16진수가 아니라 건너뛴다");
            return false;
        }

        TemplateItemProperties? overrides = null;
        if (cfg[overrideKey] is JsonObject over)
        {
            // 번들 경로가 비어 있으면 WTT 규칙대로 customItems/<id>.bundle 을 채워 넣는다.
            if (defaultPrefab is not null && over["Prefab"]?["path"]?.GetValue<string>() is null or "")
            {
                over["Prefab"] = new JsonObject { ["path"] = defaultPrefab, ["rcid"] = "" };
            }

            try
            {
                overrides = jsonUtil.Deserialize<TemplateItemProperties>(over.ToJsonString());
            }
            catch (Exception ex)
            {
                logger.Error($"[{pack.Name}] {itemId}: overrideProperties 를 읽지 못했다 — {ex.Message}");
            }
        }

        var locales = new Dictionary<string, LocaleDetails>();
        foreach (var (lang, node) in (cfg["locales"] as JsonObject) ?? new JsonObject())
        {
            if (node is not JsonObject l) continue;

            locales[lang] = new LocaleDetails
            {
                // 파일마다 Name/name 이 섞여 있어 둘 다 받는다.
                Name = l["Name"]?.GetValue<string>() ?? l["name"]?.GetValue<string>(),
                ShortName = l["ShortName"]?.GetValue<string>() ?? l["shortName"]?.GetValue<string>(),
                Description = l["Description"]?.GetValue<string>() ?? l["description"]?.GetValue<string>(),
            };
        }

        var details = new NewItemFromCloneDetails
        {
            ItemTplToClone = source,
            NewId = newId,
            ParentId = MongoIds.TryParse(cfg[parentKey]?.GetValue<string>(), out var parent) ? parent : default,
            OverrideProperties = overrides,
            HandbookParentId = cfg["handbookParentId"]?.GetValue<string>(),
            HandbookPriceRoubles = cfg["handbookPriceRoubles"]?.GetValue<double>(),
            FleaPriceRoubles = cfg["fleaPriceRoubles"]?.GetValue<double>(),
            Locales = locales,
        };

        try
        {
            var result = customItems.CreateItemFromClone(details, Assembly.GetExecutingAssembly());
            if (result is { Success: false })
            {
                logger.Error($"[{pack.Name}] {itemId} 생성 실패: {string.Join(", ", result.Errors ?? [])}");
                return false;
            }
        }
        catch (Exception ex)
        {
            logger.Error($"[{pack.Name}] {itemId} 생성 중 오류: {ex.Message}");
            return false;
        }

        return true;
    }
}
