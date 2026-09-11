using HanaVi.Shared.Loaders;
using HanaVi.Shared.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Aio.Loaders;

// 실제 동작은 전부 Shared/Loaders/LoaderBases.cs 에 있다.
// 여기서는 '모드 이름' 과 '로드 순서' 만 정한다.
//
// 순서가 왜 이렇게 나뉘는지는 docs/PORTING-NOTES.md 3-4 절을 참고할 것.
// 요약: 아이템 추가는 Preload 가 아니면 서버가 죽고,
//       상인 등록은 TraderRegistration 이 아니면 조용히 실패한다.

/// <summary>아이템 복제 + 도감 등록.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 10)]
public class AioPreloadLoader(
    ISptLogger<PreloadLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PreloadLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => "HANA-VI AIO";
}

/// <summary>아이템 이름/설명.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 20)]
public class AioLocaleLoader(
    ISptLogger<LocaleLoaderBase> logger, PatchLoader loader, ModHelper modHelper, LocaleTable locales
) : LocaleLoaderBase(logger, loader, modHelper, locales)
{
    protected override string ModName => "HANA-VI AIO";
}

/// <summary>연사속도·슬롯 필터 등 값 수정 전부.</summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 10)]
public class AioPatchLoader(
    ISptLogger<PatchLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PatchLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => "HANA-VI AIO";
}

/// <summary>상인 판매 등록 (SVT-40 커스텀 마운트).</summary>
[Injectable(InjectionType.Singleton, OnLoadOrder.TraderRegistration + 50)]
public class AioTraderLoader(
    ISptLogger<TraderLoaderBase> logger, PatchLoader loader, TradersTable traders
) : TraderLoaderBase(logger, loader, traders)
{
    protected override string ModName => "HANA-VI AIO";
}
