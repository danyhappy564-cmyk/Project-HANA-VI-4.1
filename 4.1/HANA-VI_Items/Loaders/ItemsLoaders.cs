using HanaVi.Shared.Loaders;
using HanaVi.Shared.Packs;
using HanaVi.Shared.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Items.Loaders;

// HANA-VI_Items 는 두 가지 일을 한다.
//   (1) 아이템 팩 주입  — 무기/장비 묶음을 DB 에 새로 넣는다 (PackInjector)
//   (2) 설정 패치       — 토이건/전술키트/확장탄창 등 기존 아이템 수정 (PatchEngine)
// 둘 다 같은 로드 단계 규칙을 따른다: 아이템 추가는 Preload, 값 수정은 PostLoad,
// 상인 등록은 TraderRegistration.

internal static class ItemsMod
{
    public const string Name = "HANA-VI Items";
}

/// <summary>아이템 팩 주입 — 아이템/의류/프리셋/도감. 반드시 Preload 여야 한다.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 50)]
public class ItemsPackLoader(
    ISptLogger<ItemsPackLoader> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    TemplateTable templates,
    GlobalTable globals
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        loader.ModName = ItemsMod.Name;
        if (!loader.Config.Enabled) return Task.CompletedTask;

        var items = 0;
        var clothes = 0;
        var packs = 0;

        foreach (var pack in reader.Manifests)
        {
            if (!pack.Enabled) continue;

            var madeItems = injector.InjectItems(pack, templates, globals);
            var madeClothes = injector.InjectClothing(pack, templates);
            items += madeItems;
            clothes += madeClothes;
            packs++;

            if (loader.Config.VerboseLogging)
            {
                logger.Info($"[{ItemsMod.Name}] {pack.Name} — 아이템 {madeItems}개" +
                            (madeClothes > 0 ? $", 의류 {madeClothes}개" : ""));
            }
        }

        logger.Success($"[{ItemsMod.Name}] 팩 {packs}개 / 아이템 {items}개 / 의류 {clothes}개 등록");
        return Task.CompletedTask;
    }
}

/// <summary>팩 아이템의 이름·설명 + mod/db/locales/global/*.json.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 60)]
public class ItemsLocaleLoader(
    ISptLogger<LocaleLoaderBase> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    ModHelper modHelper,
    LocaleTable locales
) : LocaleLoaderBase(logger, loader, modHelper, locales)
{
    protected override string ModName => ItemsMod.Name;

    protected override void Run()
    {
        // 먼저 파일 기반 로케일(공통 처리)
        base.Run();

        // 그 다음, 팩 JSON 안에 들어 있는 locales 항목.
        // 3.11 은 이걸 곧바로 로케일 딕셔너리에 넣었지만, 4.1 은 LazyLoad 라서
        // 변환 함수를 등록해 둬야 나중에 로케일이 로드될 때 함께 얹힌다.
        var applied = 0;
        foreach (var pack in reader.Manifests)
        {
            if (!pack.Enabled) continue;

            foreach (var (lang, entries) in injector.CollectLocales(pack))
            {
                if (!locales.Global.TryGetValue(lang, out var lazy)) continue;

                var payload = entries;
                lazy.AddTransformer(dict =>
                {
                    foreach (var (key, value) in payload) dict[key] = value;
                    return dict;
                });

                applied += payload.Count;
            }
        }

        if (applied > 0) logger.Info($"[{ModName}] 팩 로케일 {applied}줄 적용");
    }
}

/// <summary>설정 패치 — 토이건/전술키트/확장탄창 등 기존 아이템 수정.</summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 30)]
public class ItemsPatchLoader(
    ISptLogger<PatchLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PatchLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => ItemsMod.Name;
}

/// <summary>팩의 상인 판매 목록 + 설정 패치의 상인 등록.</summary>
[Injectable(InjectionType.Singleton, OnLoadOrder.TraderRegistration + 70)]
public class ItemsTraderLoader(
    ISptLogger<TraderLoaderBase> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    TradersTable traders
) : TraderLoaderBase(logger, loader, traders)
{
    protected override string ModName => ItemsMod.Name;

    protected override void Run()
    {
        // 설정 패치 쪽 traderOffer 먼저
        base.Run();

        // 팩의 assort.json / suits.json
        var config = reader.ReadJson<ItemsConfig>(Path.Combine(reader.ModFolder, "config.json"))
                     ?? new ItemsConfig();

        var added = 0;
        foreach (var pack in reader.Manifests)
        {
            if (pack.Enabled) added += injector.InjectTraders(pack, traders, config.Lvl1Traders);
        }

        if (added > 0) logger.Info($"[{ItemsMod.Name}] 팩 상인 물품 {added}건 등록");
    }
}
