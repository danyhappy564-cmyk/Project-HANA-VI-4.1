using SPTarkov.Server.Core.Models.Spt.Mod;
using SemVerRange = SemanticVersioning.Range;
using SemVerVersion = SemanticVersioning.Version;

namespace HanaVi.Aio;

/// <summary>
/// SPT 4.1 은 3.x 의 package.json 대신 이 클래스를 읽는다.
/// (4.0 의 AbstractModMetadata record → 4.1 의 IModMetadata 인터페이스로 바뀌었다.)
/// </summary>
public class ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "com.hanavi.aio";
    public string Name { get; init; } = "HANA-VI's All In One";
    public string Author { get; init; } = "HANA-VI";
    public List<string>? Contributors { get; init; } = ["R_F (4.1 포팅)"];
    public SemVerVersion Version { get; init; } = new("4.1.0");
    public SemVerRange SptVersion { get; init; } = new("~4.1.0");

    /// <summary>프리패처(IL 패치)를 쓰지 않는다.</summary>
    public bool HasPrepatcher { get; init; } = false;

    public List<string>? Incompatibilities { get; init; }
    public Dictionary<string, SemVerRange>? ModDependencies { get; init; }
    public string? Url { get; init; } = "https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1";
    public string License { get; init; } = "MIT";
}
