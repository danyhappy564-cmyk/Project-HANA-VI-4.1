using HanaVi.Aio.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Aio.Loaders;

/// <summary>
/// 3단계 — 상인 판매 목록(어사트)에 올리는 작업.
///
/// Preload 시점에는 상인 데이터가 아직 완전히 붙지 않았을 수 있어서, 어사트 추가는
/// 예외도 없이 조용히 실패한다. 그래서 "아이템 등록(Preload)" 과 "상인에 올리기
/// (TraderRegistration)" 를 서로 다른 로더로 분리했다.
/// </summary>
[Injectable(InjectionType.Singleton, OnLoadOrder.TraderRegistration + 50)]
public class AioTraderLoader(
    ISptLogger<AioTraderLoader> logger,
    PatchLoader loader,
    TradersTable traders
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        var added = 0;

        foreach (var patch in loader.EnabledPatches())
        {
            foreach (var op in patch.Ops)
            {
                if (op.Op != "traderOffer" || op.ResolvedStage != PatchStage.Trader) continue;
                if (op.Id is null || op.TraderId is null || op.Currency is null) continue;

                if (AddOffer(patch, op)) added++;
            }
        }

        if (added > 0) logger.Info($"[HANA-VI AIO] 상인 판매 등록 {added}건 완료");
        return Task.CompletedTask;
    }

    private bool AddOffer(PatchDocument patch, PatchOp op)
    {
        var traderId = new MongoId(op.TraderId!);
        var trader = traders.GetTrader(traderId);
        if (trader?.Assort is null)
        {
            logger.Error($"[HANA-VI AIO] {patch.SourceFile}: 상인 {op.TraderId} 를 찾을 수 없다");
            return false;
        }

        var itemId = new MongoId(op.Id!);
        var assort = trader.Assort;
        assort.Items ??= new List<Item>();
        assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
        assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

        if (assort.Items.Any(i => i.Id == itemId)) return false;   // 이미 등록됨

        var count = op.Count ?? 1;
        assort.Items.Add(new Item
        {
            Id = itemId,
            Template = itemId,
            ParentId = "hideout",
            SlotId = "hideout",
            Upd = new Upd
            {
                UnlimitedCount = false,
                StackObjectsCount = count,
                BuyRestrictionMax = count,
                BuyRestrictionCurrent = 0,
            },
        });

        // 물물교환 구조: 아이템 1개당 [[가격 구성요소, …]] 형태의 이중 리스트다.
        assort.BarterScheme[itemId] = new List<List<BarterScheme>>
        {
            new() { new BarterScheme { Count = op.Price ?? 0, Template = new MongoId(op.Currency!) } }
        };

        assort.LoyalLevelItems[itemId] = op.LoyaltyLevel ?? 1;
        return true;
    }
}
