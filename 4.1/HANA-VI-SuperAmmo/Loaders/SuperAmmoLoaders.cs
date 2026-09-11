using HanaVi.Shared.Loaders;
using HanaVi.Shared.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.SuperAmmo.Loaders;

// 동작은 Shared/Loaders/LoaderBases.cs 에 있다. 여기서는 이름과 순서만 정한다.
//
// SuperAmmo 는 AIO 보다 살짝 뒤에 돌아야 한다. AIO 가 약실/탄창 필터를 넓혀 두면
// 그 위에 특수탄을 얹는 쪽이 자연스럽기 때문이다. (두 모드는 서로 독립이지만
// 같은 아이템의 같은 필터를 건드릴 수 있어 순서를 명시해 둔다.)

/// <summary>특수탄 28종을 DB 에 등록하고 도감에 올린다.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 30)]
public class SuperAmmoPreloadLoader(
    ISptLogger<PreloadLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PreloadLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => "HANA-VI SuperAmmo";
}

/// <summary>탄약 이름/설명.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 40)]
public class SuperAmmoLocaleLoader(
    ISptLogger<LocaleLoaderBase> logger, PatchLoader loader, ModHelper modHelper, LocaleTable locales
) : LocaleLoaderBase(logger, loader, modHelper, locales)
{
    protected override string ModName => "HANA-VI SuperAmmo";
}

/// <summary>탄창·실린더·총기 약실 호환 등록.</summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 20)]
public class SuperAmmoPatchLoader(
    ISptLogger<PatchLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PatchLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => "HANA-VI SuperAmmo";
}

/// <summary>스키어 판매 등록 (충성도 4).</summary>
[Injectable(InjectionType.Singleton, OnLoadOrder.TraderRegistration + 60)]
public class SuperAmmoTraderLoader(
    ISptLogger<TraderLoaderBase> logger, PatchLoader loader, TradersTable traders
) : TraderLoaderBase(logger, loader, traders)
{
    protected override string ModName => "HANA-VI SuperAmmo";
}
