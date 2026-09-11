using System.Text.Json;
using System.Text.Json.Serialization;

namespace HanaVi.Shared.Patching;

/// <summary>패치가 적용되는 서버 로드 단계.</summary>
public enum PatchStage
{
    /// <summary>DB 에 아이템 키를 새로 추가하는 작업. 반드시 여기여야 한다.</summary>
    Preload,

    /// <summary>기존 아이템의 값만 고치는 작업. 다른 모드가 추가한 아이템까지 잡으려면 여기.</summary>
    PostLoad,

    /// <summary>상인 어사트(판매 목록)에 올리는 작업.</summary>
    Trader,
}

/// <summary>db/patches/*.json 한 개에 대응.</summary>
public class PatchDocument
{
    [JsonPropertyName("key")] public string Key { get; set; } = "";
    [JsonPropertyName("title")] public string Title { get; set; } = "";
    [JsonPropertyName("enabled")] public bool Enabled { get; set; } = true;

    /// <summary>이 파일 안에서만 쓰는 ID 묶음. ops 에서 "@이름" 으로 참조한다.</summary>
    [JsonPropertyName("sets")] public Dictionary<string, List<string>> Sets { get; set; } = new();

    [JsonPropertyName("ops")] public List<PatchOp> Ops { get; set; } = new();

    /// <summary>패치 파일 이름 (로그/오류 메시지용). JSON 에는 없다.</summary>
    [JsonIgnore] public string SourceFile { get; set; } = "";

    /// <summary>로그에 찍히는 모드 이름. PatchLoader 가 채운다. JSON 에는 없다.</summary>
    [JsonIgnore] public string ModName { get; set; } = "";
}

/// <summary>패치 한 줄. op 종류에 따라 쓰는 필드가 다르다.</summary>
public class PatchOp
{
    [JsonPropertyName("op")] public string Op { get; set; } = "";

    /// <summary>이 op 만 다른 단계에서 돌려야 할 때 지정. 없으면 PostLoad.</summary>
    [JsonPropertyName("stage")] public string? Stage { get; set; }

    // ----- 대상 지정 (셋 중 하나) -----
    /// <summary>아이템 ID 목록. 문자열 하나("@세트이름")거나 배열이다.</summary>
    [JsonPropertyName("targets")] public JsonElement? Targets { get; set; }

    /// <summary>_parent 가 이 값인 아이템 전부.</summary>
    [JsonPropertyName("targetsByParent")] public List<string>? TargetsByParent { get; set; }

    /// <summary>DB 의 모든 아이템.</summary>
    [JsonPropertyName("targetsAll")] public bool TargetsAll { get; set; }

    /// <summary>
    /// 이 '베이스 클래스'에 속하는 아이템 전부.
    /// targetsByParent 는 직속 부모만 보지만, 이쪽은 부모의 부모까지 거슬러 올라간다.
    /// 예: 탄창(5448bc234bdc2d3c308b4569) 을 주면 모든 탄창이 잡힌다.
    /// </summary>
    [JsonPropertyName("targetsByBaseClass")] public List<string>? TargetsByBaseClass { get; set; }

    /// <summary>
    /// 위에서 고른 대상 중, 이 프로퍼티 값이 일치하는 것만 남긴다.
    /// 예: {"ammoCaliber": "Caliber9x39"} → 9x39 총기만.
    /// </summary>
    [JsonPropertyName("whenPropEquals")] public Dictionary<string, JsonElement>? WhenPropEquals { get; set; }

    // ----- setProps / appendProps -----
    /// <summary>게임 JSON 기준 프로퍼티 이름 → 값. (예: {"bFirerate": 700})</summary>
    [JsonPropertyName("props")] public Dictionary<string, JsonElement>? Props { get; set; }

    // ----- addFilter -----
    /// <summary>slot | chamber | cartridge | grid</summary>
    [JsonPropertyName("into")] public string? Into { get; set; }

    /// <summary>슬롯 이름 목록. ["*"] 이면 모든 슬롯.</summary>
    [JsonPropertyName("slots")] public List<string>? Slots { get; set; }

    /// <summary>슬롯을 이름이 아니라 순서(0부터)로 지정할 때.</summary>
    [JsonPropertyName("slotIndexes")] public List<int>? SlotIndexes { get; set; }

    /// <summary>기존 필터에 이 ID 들이 들어있는 슬롯에만 적용.</summary>
    [JsonPropertyName("whenFilterContains")] public List<string>? WhenFilterContains { get; set; }

    /// <summary>필터에 추가할 ID 목록.</summary>
    [JsonPropertyName("add")] public JsonElement? Add { get; set; }

    /// <summary>true 면 기존 허용 목록을 지우고 add 로 '교체'한다. 기본값은 추가.</summary>
    [JsonPropertyName("replace")] public bool Replace { get; set; }

    /// <summary>
    /// 찾아낸 슬롯 자체의 값을 바꾼다. 게임 JSON 이름을 쓴다.
    /// 예: {"_max_count": 40, "_parent": "$self"} — "$self" 는 대상 아이템 자신의 ID.
    /// </summary>
    [JsonPropertyName("slotProps")] public Dictionary<string, JsonElement>? SlotProps { get; set; }

    // ----- questWeapons / masteryTemplates -----
    /// <summary>questWeapons: 대상 퀘스트 ID. masteryTemplates: 숙련도 이름(예: "TT").</summary>
    [JsonPropertyName("questId")] public string? QuestId { get; set; }

    [JsonPropertyName("masteryName")] public string? MasteryName { get; set; }

    /// <summary>숙련도 Level2 / Level3 요구치를 함께 바꿀 때.</summary>
    [JsonPropertyName("level2")] public int? Level2 { get; set; }
    [JsonPropertyName("level3")] public int? Level3 { get; set; }

    // ----- addPreset -----
    /// <summary>무기 프리셋 정의 (globals.ItemPresets 에 들어간다).</summary>
    [JsonPropertyName("preset")] public JsonElement? Preset { get; set; }

    // ----- cloneItem -----
    [JsonPropertyName("from")] public string? From { get; set; }
    [JsonPropertyName("newId")] public string? NewId { get; set; }

    /// <summary>복제본의 _parent(아이템 분류)를 원본과 다르게 줄 때.</summary>
    [JsonPropertyName("newParentId")] public string? NewParentId { get; set; }

    /// <summary>복제본의 _name. 생략하면 newId 를 쓴다.</summary>
    [JsonPropertyName("newName")] public string? NewName { get; set; }

    // ----- handbookEntry -----
    [JsonPropertyName("id")] public string? Id { get; set; }
    [JsonPropertyName("parentId")] public string? ParentId { get; set; }
    [JsonPropertyName("price")] public double? Price { get; set; }
    [JsonPropertyName("canSellOnRagfair")] public bool? CanSellOnRagfair { get; set; }

    // ----- traderOffer -----
    [JsonPropertyName("traderId")] public string? TraderId { get; set; }
    [JsonPropertyName("count")] public int? Count { get; set; }
    [JsonPropertyName("currency")] public string? Currency { get; set; }
    [JsonPropertyName("loyaltyLevel")] public int? LoyaltyLevel { get; set; }

    public PatchStage ResolvedStage => Stage?.ToLowerInvariant() switch
    {
        "preload" => PatchStage.Preload,
        "trader" => PatchStage.Trader,
        _ => PatchStage.PostLoad,
    };
}
