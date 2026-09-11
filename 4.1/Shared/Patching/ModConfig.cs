using System.Text.Json.Serialization;

namespace HanaVi.Shared.Patching;

/// <summary>
/// 모드 공통 config.json 매핑.
/// 3.11 때는 토글 하나하나가 C# 프로퍼티여야 했지만, 4.1 포팅본은 패치 파일이 스스로
/// 자기 key 를 들고 있으므로 여기서는 "이름 → on/off" 딕셔너리 하나면 충분하다.
/// 즉 패치를 새로 추가해도 이 클래스는 건드릴 필요가 없다. AIO / SuperAmmo / Items
/// 가 전부 같은 형식을 쓴다.
/// </summary>
public class ModConfig
{
    /// <summary>전체 모드 on/off. false 면 패치를 하나도 적용하지 않는다.</summary>
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    /// <summary>적용한 패치 이름을 서버 로그에 한 줄씩 출력할지 여부.</summary>
    [JsonPropertyName("verboseLogging")]
    public bool VerboseLogging { get; set; } = true;

    /// <summary>
    /// 패치 key → 사용 여부. config.json 에 없는 key 는 패치 파일의 enabled 값을 따른다.
    /// </summary>
    [JsonPropertyName("patches")]
    public Dictionary<string, bool> Patches { get; set; } = new();
}
