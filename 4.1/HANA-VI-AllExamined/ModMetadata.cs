using SPTarkov.Server.Core.Models.Spt.Mod;
using SemVerRange = SemanticVersioning.Range;
using SemVerVersion = SemanticVersioning.Version;

namespace HanaVi.AllExamined;

public class ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "com.hanavi.allexamined";
    public string Name { get; init; } = "HANA-VI's All Examined";
    public string Author { get; init; } = "HANA-VI";
    public List<string>? Contributors { get; init; } = ["R_F (4.1 포팅)"];
    public SemVerVersion Version { get; init; } = new("4.1.0");
    public SemVerRange SptVersion { get; init; } = new("~4.1.0");
    public bool HasPrepatcher { get; init; } = false;
    public List<string>? Incompatibilities { get; init; }
    public Dictionary<string, SemVerRange>? ModDependencies { get; init; }
    public string? Url { get; init; } = "https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1";
    public string License { get; init; } = "MIT";
}
