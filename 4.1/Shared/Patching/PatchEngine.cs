using System.Text.Json;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;

namespace HanaVi.Shared.Patching;

/// <summary>
/// 패치 JSON 을 실제 DB 변경으로 옮기는 엔진.
/// 3.11 원본의 1865줄짜리 postDBLoad 가 하던 일이 전부 여기 op 6종으로 표현된다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class PatchEngine(
    ISptLogger<PatchEngine> logger,
    PatchLoader loader,
    ICloner cloner,
    JsonUtil jsonUtil,
    GlobalTable globals)
{
    /// <summary>한 단계(stage)에 해당하는 op 만 골라서 적용하고, 적용한 op 개수를 돌려준다.</summary>
    public int Apply(PatchDocument doc, PatchStage stage, TemplateTable templates)
    {
        var items = templates.Items;
        var applied = 0;

        foreach (var op in doc.Ops)
        {
            if (op.ResolvedStage != stage) continue;

            try
            {
                var did = op.Op switch
                {
                    "setProps" => SetProps(doc, op, items),
                    "adjustProps" => AdjustProps(doc, op, items),
                    "appendProps" => AppendProps(doc, op, items),
                    "addFilter" => AddFilter(doc, op, items),
                    "cloneItem" => CloneItem(doc, op, items),
                    "handbookEntry" => HandbookEntry(op, templates, items),
                    "addPreset" => AddPreset(doc, op),
                    "questWeapons" => QuestWeapons(doc, op, templates),
                    "masteryTemplates" => MasteryTemplates(doc, op),
                    _ => Unknown(doc, op),
                };

                if (did) applied++;
            }
            catch (Exception ex)
            {
                logger.Error($"[{doc.ModName}] {doc.SourceFile} 의 '{op.Op}' 적용 중 오류: {ex.Message}");
            }
        }

        return applied;
    }

    private bool Unknown(PatchDocument doc, PatchOp op)
    {
        // traderOffer 는 AioTraderLoader 가 따로 처리하므로 여기서는 조용히 넘긴다.
        if (op.Op == "traderOffer") return false;

        logger.Error($"[{doc.ModName}] {doc.SourceFile}: 모르는 op '{op.Op}'");
        return false;
    }

    // ---------------------------------------------------------------- 대상 고르기

    private IEnumerable<TemplateItem> Targets(PatchDocument doc, PatchOp op,
                                              Dictionary<MongoId, TemplateItem> items)
        => Narrow(op, RawTargets(doc, op, items));

    private IEnumerable<TemplateItem> RawTargets(PatchDocument doc, PatchOp op,
                                                 Dictionary<MongoId, TemplateItem> items)
    {
        if (op.TargetsAll)
        {
            foreach (var item in items.Values)
            {
                if (item.Properties is not null) yield return item;
            }

            yield break;
        }

        if (op.TargetsByBaseClass is { Count: > 0 })
        {
            var bases = op.TargetsByBaseClass.Select(p => new MongoId(p)).ToHashSet();
            foreach (var item in items.Values)
            {
                if (item.Properties is not null && IsOfBaseClass(item, bases, items)) yield return item;
            }

            yield break;
        }

        if (op.TargetsByParent is { Count: > 0 })
        {
            var parents = op.TargetsByParent.Select(p => new MongoId(p)).ToHashSet();
            foreach (var item in items.Values)
            {
                if (item.Properties is not null && parents.Contains(item.Parent)) yield return item;
            }

            yield break;
        }

        foreach (var id in loader.Resolve(op.Targets, doc))
        {
            if (!items.TryGetValue(new MongoId(id), out var item) || item.Properties is null)
            {
                // 다른 모드가 제공하는 아이템일 수 있다. 서버를 죽이지 않고 기록만 남긴다.
                logger.Warning($"[{doc.ModName}] {doc.SourceFile}: 아이템 {id} 를 DB 에서 찾을 수 없어 건너뛴다");
                continue;
            }

            yield return item;
        }
    }

    /// <summary>whenPropEquals 로 대상을 더 좁힌다 (예: 9x39 구경 총기만).</summary>
    private static IEnumerable<TemplateItem> Narrow(PatchOp op, IEnumerable<TemplateItem> source)
    {
        if (op.WhenPropEquals is null or { Count: 0 }) return source;

        return source.Where(item =>
            op.WhenPropEquals.All(kv =>
            {
                var prop = PropertyMap.Find(item.Properties!.GetType(), kv.Key);
                if (prop is null) return false;

                var actual = prop.GetValue(item.Properties);
                if (actual is null) return kv.Value.ValueKind == JsonValueKind.Null;

                // 열거형/숫자/문자열을 한 방식으로 비교하려고 문자열로 맞춘다.
                var expected = kv.Value.ValueKind == JsonValueKind.String
                    ? kv.Value.GetString()
                    : kv.Value.GetRawText();

                return string.Equals(actual.ToString(), expected, StringComparison.OrdinalIgnoreCase);
            }));
    }

    /// <summary>
    /// _parent 사슬을 거슬러 올라가며 baseClass 에 속하는지 본다.
    /// 3.11 의 ItemHelper.isOfBaseclass 에 대응한다. 순환 참조로 무한 루프에 빠지지
    /// 않도록 깊이를 제한한다.
    /// </summary>
    private static bool IsOfBaseClass(TemplateItem item, HashSet<MongoId> bases,
                                      Dictionary<MongoId, TemplateItem> items)
    {
        var current = item.Parent;
        for (var depth = 0; depth < 16; depth++)
        {
            if (bases.Contains(current)) return true;
            if (!items.TryGetValue(current, out var parent)) return false;
            if (parent.Parent == current) return false;
            current = parent.Parent;
        }

        return false;
    }

    // ---------------------------------------------------------------- op 구현

    private bool SetProps(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        if (op.Props is null or { Count: 0 }) return false;

        var touched = false;
        foreach (var item in Targets(doc, op, items))
        {
            foreach (var (name, value) in op.Props)
            {
                var resolved = loader.ResolveValue(value, doc);
                if (PropertyMap.TrySet(item.Properties!, name, resolved, out var error)) touched = true;
                else logger.Error($"[{doc.ModName}] {doc.SourceFile} ({item.Id}): {error}");
            }
        }

        return touched;
    }

    /// <summary>
    /// 값을 덮어쓰는 게 아니라 '더한다'. 3.11 의 `item._props.Recoil -= 2` 같은 코드에 대응한다.
    /// 원본 값에 상대적이라, 다른 모드가 먼저 값을 바꿔 놨어도 그 위에 얹힌다.
    /// </summary>
    private bool AdjustProps(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        if (op.Props is null or { Count: 0 }) return false;

        var touched = false;
        foreach (var item in Targets(doc, op, items))
        {
            foreach (var (name, raw) in op.Props)
            {
                var delta = loader.ResolveValue(raw, doc);
                if (delta.ValueKind != JsonValueKind.Number)
                {
                    logger.Error($"[{doc.ModName}] {doc.SourceFile}: adjustProps 의 '{name}' 은 숫자여야 한다");
                    continue;
                }

                var prop = PropertyMap.Find(item.Properties!.GetType(), name);
                if (prop is null)
                {
                    logger.Error($"[{doc.ModName}] {doc.SourceFile} ({item.Id}): '{name}' 프로퍼티가 없다");
                    continue;
                }

                var current = prop.GetValue(item.Properties);
                var baseValue = current is null ? 0d : Convert.ToDouble(current);
                var next = baseValue + delta.GetDouble();

                var element = JsonSerializer.SerializeToElement(next);
                if (PropertyMap.TrySet(item.Properties, name, element, out var error)) touched = true;
                else logger.Error($"[{doc.ModName}] {doc.SourceFile} ({item.Id}): {error}");
            }
        }

        return touched;
    }

    private bool AppendProps(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        if (op.Props is null or { Count: 0 }) return false;

        var touched = false;
        foreach (var item in Targets(doc, op, items))
        {
            foreach (var (name, value) in op.Props)
            {
                if (value.ValueKind != JsonValueKind.Array)
                {
                    logger.Error($"[{doc.ModName}] {doc.SourceFile}: appendProps 의 '{name}' 은 배열이어야 한다");
                    continue;
                }

                if (PropertyMap.TryAppend(item.Properties!, name, value, out var error)) touched = true;
                else logger.Error($"[{doc.ModName}] {doc.SourceFile} ({item.Id}): {error}");
            }
        }

        return touched;
    }

    private bool AddFilter(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        var add = loader.Resolve(op.Add, doc, null).Select(id => new MongoId(id)).ToList();
        // add 가 비어 있어도 slotProps 나 replace 만 쓰는 경우가 있어 그냥 진행한다.
        if (add.Count == 0 && op.SlotProps is null or { Count: 0 } && !op.Replace) return false;

        var guard = op.WhenFilterContains?.Select(id => new MongoId(id)).ToList();
        var touched = false;

        foreach (var item in Targets(doc, op, items))
        {
            var props = item.Properties!;
            var into = (op.Into ?? "slot").ToLowerInvariant();

            if (into == "grid")
            {
                foreach (var grid in props.Grids ?? Array.Empty<Grid>())
                {
                    foreach (var filter in grid.Properties?.Filters ?? Array.Empty<GridFilter>())
                    {
                        filter.Filter ??= new HashSet<MongoId>();
                        if (guard is not null && !guard.Any(filter.Filter.Contains)) continue;
                        if (op.Replace) filter.Filter.Clear();
                        foreach (var id in add) filter.Filter.Add(id);
                        touched = true;
                    }
                }

                continue;
            }

            // chamber / cartridge / slot 은 전부 Slot 목록이라 취급이 같다.
            var slots = into switch
            {
                "chamber" => props.Chambers,
                "cartridge" => props.Cartridges,
                _ => props.Slots,
            };

            if (slots is null) continue;

            var index = -1;
            foreach (var slot in slots)
            {
                index++;

                if (into == "slot" && !SlotMatches(op, slot, index)) continue;

                ApplySlotProps(doc, op, slot, item);

                foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                {
                    filter.Filter ??= new HashSet<MongoId>();
                    if (guard is not null && !guard.Any(filter.Filter.Contains)) continue;
                    if (op.Replace) filter.Filter.Clear();
                    foreach (var id in add) filter.Filter.Add(id);
                    touched = true;
                }
            }
        }

        return touched;
    }

    /// <summary>
    /// 슬롯 자체의 값을 바꾼다 (_max_count, _parent 등).
    /// "$self" 는 대상 아이템 자신의 ID 로 치환된다. 3.11 의
    /// `mag._props.Cartridges[0]._parent = magId` 같은 코드에 대응한다.
    /// </summary>
    private void ApplySlotProps(PatchDocument doc, PatchOp op, Slot slot, TemplateItem item)
    {
        if (op.SlotProps is null or { Count: 0 }) return;

        foreach (var (name, raw) in op.SlotProps)
        {
            var value = raw;
            if (raw.ValueKind == JsonValueKind.String && raw.GetString() == "$self")
            {
                value = JsonSerializer.SerializeToElement(item.Id.ToString());
            }

            if (!PropertyMap.TrySet(slot, name, value, out var error))
            {
                logger.Error($"[{doc.ModName}] {doc.SourceFile} ({item.Id}) 슬롯 '{slot.Name}': {error}");
            }
        }
    }

    private static bool SlotMatches(PatchOp op, Slot slot, int index)
    {
        if (op.SlotIndexes is { Count: > 0 }) return op.SlotIndexes.Contains(index);
        if (op.Slots is null or { Count: 0 }) return true;
        if (op.Slots.Contains("*")) return true;
        return slot.Name is not null && op.Slots.Contains(slot.Name);
    }

    private bool CloneItem(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        if (op.From is null || op.NewId is null) return false;

        var newId = new MongoId(op.NewId);
        if (items.ContainsKey(newId)) return false;   // 이미 만들어졌다 (서버 재시작 등)

        if (!items.TryGetValue(new MongoId(op.From), out var source))
        {
            logger.Error($"[{doc.ModName}] {doc.SourceFile}: 복제할 원본 {op.From} 이 DB 에 없다");
            return false;
        }

        // 반드시 '깊은' 복사여야 한다. record 의 with 식은 얕은 복사라서 Slots 리스트가
        // 원본과 공유되고, 복제본 슬롯에 스코프를 추가하면 원본 마운트까지 같이 바뀐다.
        // 3.11 원본이 jsonUtil.clone() 을 쓴 것과 같은 이유다.
        var clone = cloner.Clone(source) with
        {
            Id = newId,
            Name = op.NewName ?? op.NewId,
            Parent = op.NewParentId is null ? source.Parent : new MongoId(op.NewParentId),
        };

        if (op.Props is not null)
        {
            foreach (var (name, value) in op.Props)
            {
                var resolved = loader.ResolveValue(value, doc);
                if (!PropertyMap.TrySet(clone.Properties!, name, resolved, out var error))
                    logger.Error($"[{doc.ModName}] {doc.SourceFile} (복제본 {newId}): {error}");
            }
        }

        items[newId] = clone;
        logger.Info($"[{doc.ModName}] 새 아이템 등록: {newId} ({op.From} 복제)");
        return true;
    }

    /// <summary>
    /// 무기 프리셋을 globals.ItemPresets 에 등록한다 (기본 조립 상태로 진열되는 그 프리셋).
    /// 아이템이 먼저 있어야 하므로 stage 는 preload 다.
    /// </summary>
    private bool AddPreset(PatchDocument doc, PatchOp op)
    {
        if (op.Preset is not { ValueKind: JsonValueKind.Object } raw) return false;
        if (!MongoIds.TryParse(op.Id, out var presetId))
        {
            logger.Error($"[{doc.ModName}] {doc.SourceFile}: addPreset 의 id 가 24자 16진수가 아니다");
            return false;
        }

        globals.ItemPresets ??= new Dictionary<MongoId, Preset>();
        if (globals.ItemPresets.ContainsKey(presetId)) return false;

        try
        {
            var preset = jsonUtil.Deserialize<Preset>(raw.GetRawText());
            if (preset is null) return false;

            globals.ItemPresets[presetId] = preset;
            return true;
        }
        catch (Exception ex)
        {
            logger.Error($"[{doc.ModName}] {doc.SourceFile}: 프리셋 {presetId} 를 읽지 못했다 — {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// 퀘스트의 "이 무기로 처치" 조건에 무기를 더한다.
    /// 3.11 의 tt33k 가 TT 관련 퀘스트에 새 권총 3종을 넣던 처리에 대응한다.
    /// </summary>
    private bool QuestWeapons(PatchDocument doc, PatchOp op, TemplateTable templates)
    {
        if (!MongoIds.TryParse(op.QuestId, out var questId)) return false;

        var add = loader.Resolve(op.Add, doc);
        if (add.Count == 0) return false;

        if (templates.Quests is null || !templates.Quests.TryGetValue(questId, out var quest))
        {
            logger.Warning($"[{doc.ModName}] {doc.SourceFile}: 퀘스트 {op.QuestId} 를 찾을 수 없어 건너뛴다");
            return false;
        }

        var touched = false;
        foreach (var condition in quest.Conditions?.AvailableForFinish ?? [])
        {
            foreach (var counter in condition.Counter?.Conditions ?? [])
            {
                if (counter.Weapon is null) continue;

                foreach (var id in add) counter.Weapon.Add(id);
                touched = true;
            }
        }

        return touched;
    }

    /// <summary>무기 숙련도(Mastering)에 템플릿을 더하고, 필요하면 레벨 요구치도 바꾼다.</summary>
    private bool MasteryTemplates(PatchDocument doc, PatchOp op)
    {
        if (op.MasteryName is null || globals.Configuration?.Mastering is null) return false;

        var add = MongoIds.ParseValid(loader.Resolve(op.Add, doc)).ToList();
        var touched = false;

        foreach (var mastery in globals.Configuration.Mastering)
        {
            if (mastery.Name != op.MasteryName) continue;

            if (op.Level2 is { } l2) mastery.Level2 = l2;
            if (op.Level3 is { } l3) mastery.Level3 = l3;

            if (add.Count > 0)
            {
                var list = mastery.Templates?.ToList() ?? new List<MongoId>();
                foreach (var id in add)
                {
                    if (!list.Contains(id)) list.Add(id);
                }

                mastery.Templates = list;
            }

            touched = true;
        }

        if (!touched)
        {
            logger.Warning($"[{doc.ModName}] {doc.SourceFile}: 숙련도 '{op.MasteryName}' 을(를) 찾을 수 없다");
        }

        return touched;
    }

    private bool HandbookEntry(PatchOp op, TemplateTable templates, Dictionary<MongoId, TemplateItem> items)
    {
        if (op.Id is null || op.ParentId is null) return false;

        var id = new MongoId(op.Id);
        var handbook = templates.Handbook;
        handbook.Items ??= new List<HandbookItem>();

        if (handbook.Items.All(h => h.Id != id))
        {
            handbook.Items.Add(new HandbookItem
            {
                Id = id,
                ParentId = new MongoId(op.ParentId),
                Price = op.Price ?? 0,
            });
        }

        if (op.CanSellOnRagfair is { } sellable && items.TryGetValue(id, out var item) && item.Properties is not null)
        {
            item.Properties.CanSellOnRagfair = sellable;
        }

        return true;
    }
}
