using System.Text.Json;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Utils.Cloners;

namespace HanaVi.Aio.Patching;

/// <summary>
/// 패치 JSON 을 실제 DB 변경으로 옮기는 엔진.
/// 3.11 원본의 1865줄짜리 postDBLoad 가 하던 일이 전부 여기 op 6종으로 표현된다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class PatchEngine(ISptLogger<PatchEngine> logger, PatchLoader loader, ICloner cloner)
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
                    "appendProps" => AppendProps(doc, op, items),
                    "addFilter" => AddFilter(doc, op, items),
                    "cloneItem" => CloneItem(doc, op, items),
                    "handbookEntry" => HandbookEntry(op, templates, items),
                    _ => Unknown(doc, op),
                };

                if (did) applied++;
            }
            catch (Exception ex)
            {
                logger.Error($"[HANA-VI AIO] {doc.SourceFile} 의 '{op.Op}' 적용 중 오류: {ex.Message}");
            }
        }

        return applied;
    }

    private bool Unknown(PatchDocument doc, PatchOp op)
    {
        // traderOffer 는 AioTraderLoader 가 따로 처리하므로 여기서는 조용히 넘긴다.
        if (op.Op == "traderOffer") return false;

        logger.Error($"[HANA-VI AIO] {doc.SourceFile}: 모르는 op '{op.Op}'");
        return false;
    }

    // ---------------------------------------------------------------- 대상 고르기

    private IEnumerable<TemplateItem> Targets(PatchDocument doc, PatchOp op,
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
                logger.Warning($"[HANA-VI AIO] {doc.SourceFile}: 아이템 {id} 를 DB 에서 찾을 수 없어 건너뛴다");
                continue;
            }

            yield return item;
        }
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
                if (PropertyMap.TrySet(item.Properties!, name, value, out var error)) touched = true;
                else logger.Error($"[HANA-VI AIO] {doc.SourceFile} ({item.Id}): {error}");
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
                    logger.Error($"[HANA-VI AIO] {doc.SourceFile}: appendProps 의 '{name}' 은 배열이어야 한다");
                    continue;
                }

                if (PropertyMap.TryAppend(item.Properties!, name, value, out var error)) touched = true;
                else logger.Error($"[HANA-VI AIO] {doc.SourceFile} ({item.Id}): {error}");
            }
        }

        return touched;
    }

    private bool AddFilter(PatchDocument doc, PatchOp op, Dictionary<MongoId, TemplateItem> items)
    {
        var add = loader.Resolve(op.Add, doc, null).Select(id => new MongoId(id)).ToList();
        if (add.Count == 0) return false;

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

                foreach (var filter in slot.Properties?.Filters ?? Array.Empty<SlotFilter>())
                {
                    filter.Filter ??= new HashSet<MongoId>();
                    if (guard is not null && !guard.Any(filter.Filter.Contains)) continue;
                    foreach (var id in add) filter.Filter.Add(id);
                    touched = true;
                }
            }
        }

        return touched;
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
            logger.Error($"[HANA-VI AIO] {doc.SourceFile}: 복제할 원본 {op.From} 이 DB 에 없다");
            return false;
        }

        // 반드시 '깊은' 복사여야 한다. record 의 with 식은 얕은 복사라서 Slots 리스트가
        // 원본과 공유되고, 복제본 슬롯에 스코프를 추가하면 원본 마운트까지 같이 바뀐다.
        // 3.11 원본이 jsonUtil.clone() 을 쓴 것과 같은 이유다.
        var clone = cloner.Clone(source) with { Id = newId };

        if (op.Props is not null)
        {
            foreach (var (name, value) in op.Props)
            {
                if (!PropertyMap.TrySet(clone.Properties!, name, value, out var error))
                    logger.Error($"[HANA-VI AIO] {doc.SourceFile} (복제본 {newId}): {error}");
            }
        }

        items[newId] = clone;
        logger.Info($"[HANA-VI AIO] 새 아이템 등록: {newId} ({op.From} 복제)");
        return true;
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
