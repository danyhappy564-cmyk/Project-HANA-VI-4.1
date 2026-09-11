using System.Reflection;
using System.Text.Json;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Helpers.Server;

namespace HanaVi.Aio.Patching;

/// <summary>
/// mod/db/ammo.json 과 mod/db/patches/*.json 을 읽어서 메모리에 올린다.
/// 세 개의 로더(Preload / PostLoad / Trader)가 같은 결과를 공유하도록 싱글턴으로 캐싱한다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class PatchLoader(ModHelper modHelper)
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private readonly object _lock = new();
    private List<PatchDocument>? _patches;
    private Dictionary<string, List<string>>? _ammo;
    private AioConfig? _config;

    // 모드 폴더 = 이 DLL 이 놓인 user/mods/HANA_VI-AIO/ 폴더. payload(config.json, db/**)가 여기 있다.
    private string ModFolder => modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());
    private string DbFolder => Path.Combine(ModFolder, "db");

    public AioConfig Config
    {
        get
        {
            EnsureLoaded(null);
            return _config!;
        }
    }

    /// <summary>구경별 탄약 묶음 등 모든 패치가 공유하는 ID 세트.</summary>
    public Dictionary<string, List<string>> AmmoSets
    {
        get
        {
            EnsureLoaded(null);
            return _ammo!;
        }
    }

    /// <summary>config.json 과 패치 파일의 enabled 를 모두 통과한 패치만 돌려준다.</summary>
    public IReadOnlyList<PatchDocument> EnabledPatches(ISptLogger<PatchLoader>? logger = null)
    {
        EnsureLoaded(logger);
        if (!_config!.Enabled) return [];

        return _patches!
            .Where(p => _config.Patches.TryGetValue(p.Key, out var on) ? on : p.Enabled)
            .ToList();
    }

    private void EnsureLoaded(ISptLogger<PatchLoader>? logger)
    {
        lock (_lock)
        {
            if (_patches is not null) return;

            _config = ReadJson<AioConfig>(Path.Combine(ModFolder, "config.json")) ?? new AioConfig();

            var ammoPath = Path.Combine(DbFolder, "ammo.json");
            _ammo = ReadJson<Dictionary<string, JsonElement>>(ammoPath)?
                        .Where(kv => kv.Value.ValueKind == JsonValueKind.Array)
                        .ToDictionary(
                            kv => kv.Key,
                            kv => kv.Value.EnumerateArray().Select(e => e.GetString() ?? "").ToList())
                    ?? new Dictionary<string, List<string>>();

            _patches = [];
            var patchDir = Path.Combine(DbFolder, "patches");
            if (!Directory.Exists(patchDir))
            {
                logger?.Error($"[HANA-VI AIO] 패치 폴더가 없다: {patchDir}");
                return;
            }

            // 파일 이름 순서 = 적용 순서. 01_, 02_ … 접두사를 붙이는 이유다.
            foreach (var file in Directory.GetFiles(patchDir, "*.json").OrderBy(f => f, StringComparer.Ordinal))
            {
                try
                {
                    var doc = ReadJson<PatchDocument>(file);
                    if (doc is null || string.IsNullOrEmpty(doc.Key))
                    {
                        logger?.Warning($"[HANA-VI AIO] key 가 없는 패치 파일은 건너뛴다: {Path.GetFileName(file)}");
                        continue;
                    }

                    doc.SourceFile = Path.GetFileName(file);
                    _patches.Add(doc);
                }
                catch (Exception ex)
                {
                    logger?.Error($"[HANA-VI AIO] 패치 파일을 읽지 못했다 {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }
    }

    private static T? ReadJson<T>(string path)
        => File.Exists(path) ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), Options) : default;

    /// <summary>
    /// "@이름" 참조를 실제 ID 목록으로 펼친다.
    /// 문자열 하나("@m43"), 배열(["id", "@m43"]) 둘 다 받는다.
    /// 찾는 순서는 패치 파일의 sets → 공용 ammo.json.
    /// </summary>
    public List<string> Resolve(JsonElement? element, PatchDocument doc, ISptLogger<PatchLoader>? logger = null)
    {
        var result = new List<string>();
        if (element is not { } el) return result;

        switch (el.ValueKind)
        {
            case JsonValueKind.String:
                AddToken(el.GetString(), result, doc, logger);
                break;
            case JsonValueKind.Array:
                foreach (var item in el.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String) AddToken(item.GetString(), result, doc, logger);
                }
                break;
        }

        return result;
    }

    private void AddToken(string? token, List<string> into, PatchDocument doc, ISptLogger<PatchLoader>? logger)
    {
        if (string.IsNullOrWhiteSpace(token)) return;

        if (token[0] != '@')
        {
            into.Add(token);
            return;
        }

        var name = token[1..];
        if (doc.Sets.TryGetValue(name, out var local)) { into.AddRange(local); return; }
        if (AmmoSets.TryGetValue(name, out var shared)) { into.AddRange(shared); return; }

        logger?.Error($"[HANA-VI AIO] {doc.SourceFile}: '@{name}' 세트를 찾을 수 없다 " +
                      $"(패치 파일의 sets 나 db/ammo.json 에 정의돼 있어야 한다)");
    }
}
