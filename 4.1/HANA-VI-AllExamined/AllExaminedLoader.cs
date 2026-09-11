using System.Reflection;
using System.Text.Json;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.AllExamined;

/// <summary>
/// 모든 아이템을 '검사 완료' 상태로 만든다.
///
/// 3.11 원본은 postSptLoad 를 썼다. 이유가 있는데, 다른 모드가 비동기로 아이템을 넣는
/// 경우 postDBLoad 시점에는 그 아이템들이 아직 DB 에 없어서 놓치기 때문이다.
/// 4.1 에서 그 역할에 대응하는 가장 늦은 단계가 OnLoadOrder.PostLoad 다.
/// 여기서 다시 +1000 을 더해, 같은 PostLoad 단계인 AIO 패치보다도 뒤에 돌게 했다.
///
/// 새 아이템을 추가하는 게 아니라 기존 아이템의 값만 바꾸므로,
/// DatabaseModifiedAfterCutoffException 걱정 없이 늦은 단계에 둬도 된다.
/// </summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 1000)]
public class AllExaminedLoader(
    ISptLogger<AllExaminedLoader> logger,
    ModHelper modHelper,
    TemplateTable templates
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        var config = ReadConfig();
        if (!config.Enabled)
        {
            logger.Info("[HANA-VI AllExamined] config.json 에서 enabled=false 라 건너뛴다");
            return Task.CompletedTask;
        }

        var excludedItems = config.ExcludeItemIds.Select(id => new MongoId(id)).ToHashSet();
        var excludedParents = config.ExcludeParentIds.Select(id => new MongoId(id)).ToHashSet();

        var examined = 0;
        var skipped = 0;

        foreach (var (id, item) in templates.Items)
        {
            if (item.Properties is null) continue;

            if (excludedItems.Contains(id) || excludedParents.Contains(item.Parent))
            {
                skipped++;
                continue;
            }

            item.Properties.ExaminedByDefault = true;
            examined++;
        }

        logger.Success($"[HANA-VI AllExamined] 아이템 {examined}개 검사 완료 처리" +
                       (skipped > 0 ? $" (제외 {skipped}개)" : ""));
        return Task.CompletedTask;
    }

    private AllExaminedConfig ReadConfig()
    {
        var path = Path.Combine(
            modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly()),
            "config.json");

        if (!File.Exists(path)) return new AllExaminedConfig();

        try
        {
            return JsonSerializer.Deserialize<AllExaminedConfig>(
                       File.ReadAllText(path),
                       new JsonSerializerOptions
                       {
                           PropertyNameCaseInsensitive = true,
                           ReadCommentHandling = JsonCommentHandling.Skip,
                           AllowTrailingCommas = true,
                       })
                   ?? new AllExaminedConfig();
        }
        catch (Exception ex)
        {
            logger.Error($"[HANA-VI AllExamined] config.json 을 읽지 못해 기본값으로 진행한다: {ex.Message}");
            return new AllExaminedConfig();
        }
    }
}
