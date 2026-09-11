using System.Reflection;
using System.Text.Json;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Aio.Loaders;

/// <summary>
/// mod/db/locales/global/*.json 을 게임 로케일에 합친다.
///
/// 4.1 에서 구조가 바뀐 부분: LocaleTable.Global 은 3.x 처럼 그냥 딕셔너리가 아니라
/// Dictionary&lt;string, LazyLoad&lt;GlobalLocaleDictionary&gt;&gt; 다. 값을 직접 넣으면
/// 나중에 실제 로케일이 로드될 때 통째로 덮어써진다. 대신 AddTransformer 로
/// "읽힐 때 내 항목을 얹어라" 는 변환 함수를 등록해야 한다.
/// </summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 20)]
public class AioLocaleLoader(
    ISptLogger<AioLocaleLoader> logger,
    ModHelper modHelper,
    LocaleTable locales
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        var dir = Path.Combine(
            modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly()),
            "db", "locales", "global");

        if (!Directory.Exists(dir)) return Task.CompletedTask;

        var loaded = 0;
        foreach (var file in Directory.GetFiles(dir, "*.json"))
        {
            var code = Path.GetFileNameWithoutExtension(file);

            Dictionary<string, string>? entries;
            try
            {
                entries = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    File.ReadAllText(file),
                    new JsonSerializerOptions { ReadCommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true });
            }
            catch (Exception ex)
            {
                logger.Error($"[HANA-VI AIO] 로케일 파일을 읽지 못했다 {Path.GetFileName(file)}: {ex.Message}");
                continue;
            }

            if (entries is null or { Count: 0 }) continue;

            // '_' 로 시작하는 키는 파일 안 주석용이라 게임에 넣지 않는다.
            var payload = entries.Where(kv => !kv.Key.StartsWith('_'))
                                 .ToDictionary(kv => kv.Key, kv => kv.Value);
            if (payload.Count == 0) continue;

            if (!locales.Global.TryGetValue(code, out var lazy))
            {
                logger.Warning($"[HANA-VI AIO] 게임에 '{code}' 로케일이 없어 건너뛴다");
                continue;
            }

            lazy.AddTransformer(dict =>
            {
                foreach (var (key, value) in payload) dict[key] = value;
                return dict;
            });

            loaded++;
        }

        if (loaded > 0) logger.Info($"[HANA-VI AIO] 로케일 {loaded}개 언어 적용");
        return Task.CompletedTask;
    }
}
