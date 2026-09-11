using SPTarkov.Server.Core.Models.Spt.Mod;
using SemVerRange = SemanticVersioning.Range;
using SemVerVersion = SemanticVersioning.Version;

namespace HanaVi.SuperAmmo;

/// <summary>
/// 원본은 Rising Star (ElacoLR) 님의 zz_RS-Exploster 이고,
/// HANA_VI 님이 수정, GoRani 님이 번들을 제작했다. 크레딧을 그대로 옮긴다.
/// </summary>
public class ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "com.hanavi.superammo";
    public string Name { get; init; } = "HANA-VI SuperAmmo";
    public string Author { get; init; } = "Original by Rising Star, Modification by HANA'VI, Bundles by GoRani";
    public List<string>? Contributors { get; init; } = ["R_F (4.1 포팅)"];
    public SemVerVersion Version { get; init; } = new("4.1.0");
    public SemVerRange SptVersion { get; init; } = new("~4.1.0");
    public bool HasPrepatcher { get; init; } = false;
    public List<string>? Incompatibilities { get; init; }
    public Dictionary<string, SemVerRange>? ModDependencies { get; init; }
    public string? Url { get; init; } = "https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1";
    public string License { get; init; } = "MIT";
}
