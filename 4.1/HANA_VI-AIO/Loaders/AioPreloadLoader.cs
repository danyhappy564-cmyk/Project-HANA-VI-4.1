using HanaVi.Aio.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Aio.Loaders;

/// <summary>
/// 1단계 — DB 에 아이템 키를 '새로 추가'하는 작업 전용.
///
/// 4.1 에서 가장 많이 터지는 사고가 여기다. DatabaseIntegrityService 가 프로필을 읽는
/// 시점에 Templates.Items 의 키 목록을 스냅샷으로 떠 두고, 그 뒤에 키가 새로 생기면
/// DatabaseModifiedAfterCutoffException 으로 서버가 죽는다. 그래서 아이템 등록은
/// 반드시 Preload 단계여야 한다. 값만 고치는 작업은 이 단계일 필요가 없다.
/// </summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 10)]
public class AioPreloadLoader(
    ISptLogger<AioPreloadLoader> logger,
    PatchLoader loader,
    PatchEngine engine,
    TemplateTable templates
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        var patches = loader.EnabledPatches();
        if (patches.Count == 0) return Task.CompletedTask;

        var total = 0;
        foreach (var patch in patches)
        {
            total += engine.Apply(patch, PatchStage.Preload, templates);
        }

        if (total > 0) logger.Info($"[HANA-VI AIO] 아이템 등록 단계 완료 — {total}건 적용");
        return Task.CompletedTask;
    }
}
