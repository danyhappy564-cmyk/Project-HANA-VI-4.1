using System.Text.Json.Serialization;
using HanaVi.Shared.Patching;

namespace HanaVi.Items;

/// <summary>
/// Items 전용 설정. 공통 ModConfig 에 3.11 에 있던 두 옵션을 더했다.
/// </summary>
public class ItemsConfig : ModConfig
{
    /// <summary>
    /// 3.11 의 oldLocales. 구형 로케일 구조(templates/preset 하위)에 넣던 옵션이다.
    /// 4.1 로케일은 "ID Name" 평면 구조뿐이라 이 옵션은 더 이상 쓰이지 않는다.
    /// 값은 남겨 두되 동작하지 않으며, true 로 두면 서버 로그에 안내가 나온다.
    /// </summary>
    [JsonPropertyName("oldLocales")]
    public bool OldLocales { get; set; }

    /// <summary>
    /// 3.11 의 lvl1Traders. 켜면 이 모드가 추가하는 상인 물품의 충성도 요구치를 전부 1 로 내린다.
    /// </summary>
    [JsonPropertyName("lvl1Traders")]
    public bool Lvl1Traders { get; set; }
}
