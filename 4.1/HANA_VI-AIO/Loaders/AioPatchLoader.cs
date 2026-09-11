using HanaVi.Aio.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Aio.Loaders;

/// <summary>
/// 2단계 — 기존 아이템의 값을 고치는 작업 전부 (연사속도, 슬롯 필터, 방탄판 성능 …).
///
/// PostLoad 는 서버 로드의 마지막 단계다. 3.11 원본은 postDBLoad(중간 단계)를 썼지만
/// 여기서 PostLoad 를 쓰는 이유는, super_plates / no_mount_extrasize / pnv_57e_anywhere
/// 처럼 "DB 의 모든 아이템을 훑는" 패치가 다른 모드가 추가한 아이템까지 잡아야 하기
/// 때문이다. 3.11 에서는 잡히지 않던 모드 아이템도 이제 함께 적용된다.
/// </summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 10)]
public class AioPatchLoader(
    ISptLogger<AioPatchLoader> logger,
    PatchLoader loader,
    PatchEngine engine,
    TemplateTable templates
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        var config = loader.Config;
        if (!config.Enabled)
        {
            logger.Info("[HANA-VI AIO] config.json 에서 enabled=false 라 아무것도 적용하지 않는다");
            return Task.CompletedTask;
        }

        var patches = loader.EnabledPatches(null);
        var applied = 0;

        foreach (var patch in patches)
        {
            var count = engine.Apply(patch, PatchStage.PostLoad, templates);
            applied += count;

            if (config.VerboseLogging && count > 0)
            {
                logger.Info($"[HANA-VI AIO] {patch.Key} — {patch.Title} ({count}건)");
            }
        }

        logger.Success($"[HANA-VI AIO] 패치 {patches.Count}개 / 작업 {applied}건 적용 완료. UwU");
        return Task.CompletedTask;
    }
}
