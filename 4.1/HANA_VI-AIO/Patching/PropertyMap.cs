using System.Collections;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HanaVi.Aio.Patching;

/// <summary>
/// 게임 JSON 의 프로퍼티 이름("bFirerate", "durability", "ArmorType" …)을
/// SPT 의 C# 프로퍼티(BFirerate, Durability, ArmorType)로 연결해 주는 표.
///
/// 왜 필요한가: 타르코프 원본 JSON 은 케이싱이 제멋대로다(bFirerate 는 소문자 b 로 시작,
/// Durability 는 게임 JSON 에서 durability, ArmorType 은 대문자). SPT 는 [JsonPropertyName]
/// 으로 이 차이를 흡수하는데, 우리는 JSON 에 적힌 이름으로 값을 찾아야 하므로
/// [JsonPropertyName] 값과 C# 이름을 둘 다, 대소문자 무시로 등록해 둔다.
/// 덕분에 HANA_VI 는 SPT DB 덤프에서 본 이름을 그대로 패치 파일에 적으면 된다.
/// </summary>
internal static class PropertyMap
{
    private static readonly Dictionary<Type, Dictionary<string, PropertyInfo>> Cache = new();

    private static readonly JsonSerializerOptions ValueOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private static Dictionary<string, PropertyInfo> For(Type type)
    {
        lock (Cache)
        {
            if (Cache.TryGetValue(type, out var cached)) return cached;

            var map = new Dictionary<string, PropertyInfo>(StringComparer.OrdinalIgnoreCase);
            foreach (var p in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                var json = p.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
                if (json is not null) map[json] = p;
                // C# 이름은 [JsonPropertyName] 이 이미 잡은 자리를 덮어쓰지 않는다.
                if (!map.ContainsKey(p.Name)) map[p.Name] = p;
            }

            Cache[type] = map;
            return map;
        }
    }

    public static PropertyInfo? Find(Type type, string jsonName)
        => For(type).GetValueOrDefault(jsonName);

    /// <summary>JSON 값을 프로퍼티 타입으로 변환해서 대입한다.</summary>
    public static bool TrySet(object target, string jsonName, JsonElement value, out string error)
    {
        var prop = Find(target.GetType(), jsonName);
        if (prop is null)
        {
            error = $"'{jsonName}' 프로퍼티를 {target.GetType().Name} 에서 찾을 수 없다";
            return false;
        }

        if (!prop.CanWrite)
        {
            error = $"'{jsonName}' 은(는) 읽기 전용이다";
            return false;
        }

        try
        {
            var converted = value.Deserialize(prop.PropertyType, ValueOptions);
            prop.SetValue(target, converted);
            error = "";
            return true;
        }
        catch (Exception ex)
        {
            error = $"'{jsonName}' 에 {value} 를 넣을 수 없다 ({prop.PropertyType.Name}): {ex.Message}";
            return false;
        }
    }

    /// <summary>
    /// 리스트/HashSet 형태의 프로퍼티에 값을 덧붙인다 (weapFireType 에 "fullauto" 추가 등).
    /// 프로퍼티가 비어 있으면 새로 만들어 채운다.
    /// </summary>
    public static bool TryAppend(object target, string jsonName, JsonElement values, out string error)
    {
        var prop = Find(target.GetType(), jsonName);
        if (prop is null)
        {
            error = $"'{jsonName}' 프로퍼티를 {target.GetType().Name} 에서 찾을 수 없다";
            return false;
        }

        try
        {
            var current = prop.GetValue(target);
            if (current is null)
            {
                if (!prop.CanWrite)
                {
                    error = $"'{jsonName}' 이(가) 비어 있는데 새로 만들 수 없다";
                    return false;
                }

                current = Activator.CreateInstance(prop.PropertyType);
                prop.SetValue(target, current);
            }

            if (current is not IEnumerable)
            {
                error = $"'{jsonName}' 은(는) 목록이 아니라서 append 할 수 없다";
                return false;
            }

            // HashSet<T>.Add / List<T>.Add 를 리플렉션으로 호출한다.
            var add = current.GetType().GetMethod("Add");
            if (add is null)
            {
                error = $"'{jsonName}' 목록에 Add 메서드가 없다";
                return false;
            }

            var elementType = add.GetParameters()[0].ParameterType;
            foreach (var v in values.EnumerateArray())
            {
                add.Invoke(current, [v.Deserialize(elementType, ValueOptions)]);
            }

            error = "";
            return true;
        }
        catch (Exception ex)
        {
            error = $"'{jsonName}' 에 값을 추가할 수 없다: {ex.Message}";
            return false;
        }
    }
}
