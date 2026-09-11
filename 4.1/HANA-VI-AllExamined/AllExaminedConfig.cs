using System.Text.Json.Serialization;

namespace HanaVi.AllExamined;

public class AllExaminedConfig
{
    /// <summary>false 면 아무 아이템도 건드리지 않는다.</summary>
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 이 목록에 든 아이템 ID 는 검사 완료 처리에서 제외한다.
    /// "퀘스트용 아이템은 직접 찾게 두고 싶다" 같은 경우에 쓴다.
    /// </summary>
    [JsonPropertyName("excludeItemIds")]
    public List<string> ExcludeItemIds { get; set; } = new();

    /// <summary>
    /// 이 목록에 든 _parent(아이템 분류) 에 속하는 아이템 전체를 제외한다.
    /// </summary>
    [JsonPropertyName("excludeParentIds")]
    public List<string> ExcludeParentIds { get; set; } = new();
}
