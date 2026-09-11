using SPTarkov.Server.Core.Models.Common;

namespace HanaVi.Shared.Patching;

/// <summary>
/// 아이템 ID 문자열을 MongoId 로 안전하게 바꾼다.
///
/// 3.x 에서는 아이템 ID 가 그냥 문자열이라 아무 값이나 들어갈 수 있었다. 실제로
/// HANA-VI_Items 에는 "0088_ATL_SR25_FDE_8800" 처럼 16진수가 아닌 값이 섞여 있다
/// (원본 ATLAS 모드에서 가져온 잔재로, 이 팩에는 그런 아이템이 없어 3.11 에서도 무효였다).
/// 4.1 의 MongoId 는 24자 16진수를 전제로 하므로, 잘못된 값으로 서버를 죽이지 않도록
/// 여기서 한 번 걸러 낸다.
/// </summary>
public static class MongoIds
{
    public static bool TryParse(string? text, out MongoId id)
    {
        id = default;
        if (string.IsNullOrWhiteSpace(text)) return false;
        if (!MongoId.IsValidMongoId(text)) return false;

        id = new MongoId(text);
        return true;
    }

    /// <summary>유효한 ID 만 골라서 변환한다. 잘못된 값은 조용히 버린다.</summary>
    public static IEnumerable<MongoId> ParseValid(IEnumerable<string>? source)
    {
        foreach (var text in source ?? [])
        {
            if (TryParse(text, out var id)) yield return id;
        }
    }
}
