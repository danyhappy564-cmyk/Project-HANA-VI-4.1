using System.Text.Json;
using System.Text.Json.Serialization;

namespace HanaVi.Shared.Packs;

/// <summary>
/// db/packs.json 한 줄. "이 폴더에 이런 이름의 파일들이 있다" 는 설명서다.
/// 3.11 에서는 팩마다 별도의 inject 메서드가 하드코딩돼 있었지만,
/// 데이터가 전부 같은 모양이라 설명서 한 줄로 대체할 수 있다.
/// </summary>
public class PackManifest
{
    [JsonPropertyName("key")] public string Key { get; set; } = "";
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("enabled")] public bool Enabled { get; set; } = true;

    /// <summary>mod/db/packs/ 기준 상대 경로. 예: "ATLAS-GEAR/database"</summary>
    [JsonPropertyName("folder")] public string Folder { get; set; } = "";

    /// <summary>아이템 정의 파일 이름(확장자 제외). 예: ["custom_items"]</summary>
    [JsonPropertyName("itemFiles")] public List<string> ItemFiles { get; set; } = new();

    /// <summary>의류 정의 파일 이름(확장자 제외).</summary>
    [JsonPropertyName("clothesFiles")] public List<string> ClothesFiles { get; set; } = new();

    /// <summary>globals.json 의 ItemPresets / config.Mastering 을 주입할지.</summary>
    [JsonPropertyName("useGlobals")] public bool UseGlobals { get; set; } = true;

    /// <summary>traders/&lt;상인ID&gt;/assort.json, suits.json 을 주입할지.</summary>
    [JsonPropertyName("useTraders")] public bool UseTraders { get; set; } = true;

    /// <summary>
    /// 원본이 특정 무기 숙련도(Mastering)에 템플릿을 끼워 넣던 처리.
    /// 예: {"SR25": ["0088_ATL_SR25_FDE_8800"]}
    /// </summary>
    [JsonPropertyName("masteryTemplates")]
    public Dictionary<string, List<string>>? MasteryTemplates { get; set; }
}

/// <summary>items.json / clothes.json 의 항목 하나.</summary>
public class PackEntry
{
    [JsonPropertyName("enable")] public bool Enable { get; set; }

    /// <summary>복제할 원본 템플릿 ID. 없으면 item 을 통째로 새 아이템으로 만든다.</summary>
    [JsonPropertyName("clone")] public string? Clone { get; set; }

    /// <summary>맵의 key 대신 이 값을 최종 템플릿 ID 로 쓴다 (ATLAS-GEAR 방식).</summary>
    [JsonPropertyName("sptID")] public string? SptId { get; set; }

    /// <summary>복제본에 덮어쓸 값. 게임 JSON 과 같은 중첩 구조 그대로다.</summary>
    [JsonPropertyName("item")] public JsonElement? Item { get; set; }

    [JsonPropertyName("handbook")] public PackHandbook? Handbook { get; set; }

    /// <summary>언어 코드 → 이름/짧은이름/설명.</summary>
    [JsonPropertyName("locales")] public Dictionary<string, PackLocale>? Locales { get; set; }

    /// <summary>프리셋 ID → 프리셋 표시 이름.</summary>
    [JsonPropertyName("presets")] public Dictionary<string, string>? Presets { get; set; }

    /// <summary>이 아이템의 슬롯에 다른 아이템을 허용시킨다. "conflicts" 키는 충돌 목록.</summary>
    [JsonPropertyName("addToThisItemsFilters")]
    public Dictionary<string, List<string>>? AddToThisItemsFilters { get; set; }

    /// <summary>기존 아이템들의 슬롯에 이 아이템을 허용시킨다.</summary>
    [JsonPropertyName("addToExistingItemFilters")]
    public Dictionary<string, List<string>>? AddToExistingItemFilters { get; set; }

    /// <summary>복제 원본이 허용되던 자리에 복제본도 허용할지. 기본 true.</summary>
    [JsonPropertyName("enableCloneCompats")] public bool EnableCloneCompats { get; set; } = true;

    /// <summary>복제 원본이 충돌하던 자리에 복제본도 충돌시킬지. 기본 true.</summary>
    [JsonPropertyName("enableCloneConflicts")] public bool EnableCloneConflicts { get; set; } = true;
}

public class PackHandbook
{
    [JsonPropertyName("ParentId")] public string ParentId { get; set; } = "";
    [JsonPropertyName("Price")] public double Price { get; set; }
}

public class PackLocale
{
    [JsonPropertyName("Name")] public string? Name { get; set; }
    [JsonPropertyName("ShortName")] public string? ShortName { get; set; }
    [JsonPropertyName("Description")] public string? Description { get; set; }
}

/// <summary>traders/&lt;상인ID&gt;/assort.json 의 모양 (3.11 형식 그대로).</summary>
public class PackAssort
{
    [JsonPropertyName("items")] public List<JsonElement>? Items { get; set; }
    [JsonPropertyName("barter_scheme")] public Dictionary<string, JsonElement>? BarterScheme { get; set; }
    [JsonPropertyName("loyal_level_items")] public Dictionary<string, int>? LoyalLevelItems { get; set; }
}
