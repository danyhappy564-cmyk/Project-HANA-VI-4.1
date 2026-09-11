using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Helpers.Server;

namespace HanaVi.Shared.Packs;

/// <summary>
/// mod/db/packs/ 아래의 팩 데이터를 읽어 들인다.
/// 3.11 원본의 loadDir() 재귀 로더에 대응하며, 파일 구조를 그대로 유지하므로
/// HANA_VI 는 원본과 똑같은 JSON 파일을 그대로 고치면 된다.
/// </summary>
[Injectable(InjectionType.Singleton)]
public class PackReader(ISptLogger<PackReader> logger, ModHelper modHelper)
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private List<PackManifest>? _manifests;

    public string ModFolder => modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());
    public string PacksRoot => Path.Combine(ModFolder, "db", "packs");

    /// <summary>db/packs.json 에 적힌, 사용할 팩 목록.</summary>
    public IReadOnlyList<PackManifest> Manifests
    {
        get
        {
            if (_manifests is not null) return _manifests;

            var path = Path.Combine(ModFolder, "db", "packs.json");
            _manifests = ReadJson<List<PackManifest>>(path) ?? new List<PackManifest>();
            return _manifests;
        }
    }

    public string PackFolder(PackManifest pack) => Path.Combine(PacksRoot, pack.Folder.Replace('/', Path.DirectorySeparatorChar));

    public T? ReadJson<T>(string path)
    {
        if (!File.Exists(path)) return default;

        try
        {
            return JsonSerializer.Deserialize<T>(File.ReadAllText(path), Options);
        }
        catch (Exception ex)
        {
            logger.Error($"[HANA-VI Items] JSON 을 읽지 못했다 {path}: {ex.Message}");
            return default;
        }
    }

    public JsonNode? ReadNode(string path)
    {
        if (!File.Exists(path)) return null;

        try
        {
            return JsonNode.Parse(File.ReadAllText(path),
                documentOptions: new JsonDocumentOptions
                {
                    CommentHandling = JsonCommentHandling.Skip,
                    AllowTrailingCommas = true,
                });
        }
        catch (Exception ex)
        {
            logger.Error($"[HANA-VI Items] JSON 을 읽지 못했다 {path}: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// 팩의 아이템(또는 의류) 정의를 모아 "최종 템플릿 ID → 항목" 으로 돌려준다.
    /// 맵의 key 가 그대로 ID 인 팩도 있고, ATLAS-GEAR 처럼 sptID 를 따로 두는 팩도 있어서
    /// sptID 가 있으면 그쪽을 우선한다 (3.11 원본과 동일한 규칙).
    /// </summary>
    public Dictionary<string, PackEntry> ReadEntries(PackManifest pack, IEnumerable<string> fileNames)
    {
        var result = new Dictionary<string, PackEntry>();

        foreach (var name in fileNames)
        {
            var path = Path.Combine(PackFolder(pack), name + ".json");
            var raw = ReadJson<Dictionary<string, PackEntry>>(path);
            if (raw is null) continue;

            foreach (var (key, entry) in raw)
            {
                if (entry is null) continue;
                result[string.IsNullOrEmpty(entry.SptId) ? key : entry.SptId] = entry;
            }
        }

        return result;
    }

    /// <summary>팩 폴더 안의 traders/&lt;상인ID&gt; 하위 폴더 목록.</summary>
    public IEnumerable<(string TraderId, string Folder)> TraderFolders(PackManifest pack)
    {
        var dir = Path.Combine(PackFolder(pack), "traders");
        if (!Directory.Exists(dir)) yield break;

        foreach (var sub in Directory.GetDirectories(dir))
        {
            yield return (Path.GetFileName(sub), sub);
        }
    }
}
