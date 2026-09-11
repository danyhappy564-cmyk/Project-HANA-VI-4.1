using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using HanaVi.Shared.Patching;
using SPTarkov.Common.Models.Logging;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Shared.Loaders;

/// <summary>
/// 모드 4개가 공유하는 로더 뼈대.
///
/// 이 폴더의 소스는 각 모드 프로젝트에 '링크'로 들어가 모드 DLL 안에서 따로 컴파일된다.
/// 별도 DLL 로 만들지 않는 이유는, SPT 가 user/mods 폴더의 DLL 을 전부 모드로 보려 하기
/// 때문이다. 공용 DLL 을 두면 모드가 아닌 파일을 모드로 읽으려다 문제가 생긴다.
///
/// 그래서 Assembly.GetExecutingAssembly() 는 언제나 '그 모드 자신의 DLL' 을 가리킨다.
/// ModHelper 가 올바른 모드 폴더를 찾아 준다.
/// </summary>
public abstract class HanaViLoaderBase(PatchLoader loader) : IOnLoad
{
    /// <summary>로그에 찍히는 이름. 각 모드가 지정한다.</summary>
    protected abstract string ModName { get; }

    protected PatchLoader Loader { get; } = loader;

    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        Loader.ModName = ModName;
        if (!Loader.Config.Enabled) return Task.CompletedTask;

        Run();
        return Task.CompletedTask;
    }

    protected abstract void Run();
}

/// <summary>
/// 1단계 — 아이템을 DB 에 '새로 추가'하는 작업 전용 (Preload).
///
/// 4.1 에서 가장 사고가 잦은 지점이다. DatabaseIntegrityService 가 프로필을 읽는
/// 시점에 아이템 키 목록을 스냅샷으로 떠 두고, 그 뒤에 키가 새로 생기면
/// DatabaseModifiedAfterCutoffException 으로 서버가 죽는다.
/// </summary>
public abstract class PreloadLoaderBase(
    ISptLogger<PreloadLoaderBase> logger,
    PatchLoader loader,
    PatchEngine engine,
    TemplateTable templates
) : HanaViLoaderBase(loader)
{
    protected override void Run()
    {
        var total = 0;
        foreach (var patch in Loader.EnabledPatches())
        {
            total += engine.Apply(patch, PatchStage.Preload, templates);
        }

        if (total > 0) logger.Info($"[{ModName}] 아이템 등록 단계 완료 — {total}건");
    }
}

/// <summary>
/// 2단계 — 기존 아이템의 값을 고치는 작업 전부 (PostLoad).
///
/// 3.11 원본은 postDBLoad(중간 단계)를 썼지만, 여기서 PostLoad(마지막 단계)를 쓰는
/// 이유는 DB 전체를 훑는 패치가 다른 모드가 추가한 아이템까지 잡아야 하기 때문이다.
/// </summary>
public abstract class PatchLoaderBase(
    ISptLogger<PatchLoaderBase> logger,
    PatchLoader loader,
    PatchEngine engine,
    TemplateTable templates
) : HanaViLoaderBase(loader)
{
    protected override void Run()
    {
        var config = Loader.Config;
        var patches = Loader.EnabledPatches();
        var applied = 0;

        foreach (var patch in patches)
        {
            var count = engine.Apply(patch, PatchStage.PostLoad, templates);
            applied += count;

            if (config.VerboseLogging && count > 0)
            {
                logger.Info($"[{ModName}] {patch.Key} — {patch.Title} ({count}건)");
            }
        }

        logger.Success($"[{ModName}] 패치 {patches.Count}개 / 작업 {applied}건 적용 완료");
    }
}

/// <summary>
/// 3단계 — 상인 판매 목록(어사트) 등록 (TraderRegistration).
///
/// Preload 시점에는 상인 데이터가 아직 붙지 않아 예외도 없이 조용히 실패한다.
/// 그래서 아이템 등록과 상인 등록을 다른 단계로 분리했다.
/// </summary>
public abstract class TraderLoaderBase(
    ISptLogger<TraderLoaderBase> logger,
    PatchLoader loader,
    TradersTable traders
) : HanaViLoaderBase(loader)
{
    protected override void Run()
    {
        var added = 0;

        foreach (var patch in Loader.EnabledPatches())
        {
            foreach (var op in patch.Ops)
            {
                if (op.Op != "traderOffer" || op.ResolvedStage != PatchStage.Trader) continue;
                if (op.Id is null || op.TraderId is null || op.Currency is null) continue;

                if (AddOffer(patch, op)) added++;
            }
        }

        if (added > 0) logger.Info($"[{ModName}] 상인 판매 등록 {added}건");
    }

    private bool AddOffer(PatchDocument patch, PatchOp op)
    {
        var trader = traders.GetTrader(new MongoId(op.TraderId!));
        if (trader?.Assort is null)
        {
            logger.Error($"[{ModName}] {patch.SourceFile}: 상인 {op.TraderId} 를 찾을 수 없다");
            return false;
        }

        var itemId = new MongoId(op.Id!);
        var assort = trader.Assort;
        assort.Items ??= new List<Item>();
        assort.BarterScheme ??= new Dictionary<MongoId, List<List<BarterScheme>>>();
        assort.LoyalLevelItems ??= new Dictionary<MongoId, int>();

        if (assort.Items.Any(i => i.Id == itemId)) return false;   // 이미 등록됨

        var count = op.Count ?? 1;
        assort.Items.Add(new Item
        {
            Id = itemId,
            Template = itemId,
            ParentId = "hideout",
            SlotId = "hideout",
            Upd = new Upd
            {
                UnlimitedCount = false,
                StackObjectsCount = count,
                BuyRestrictionMax = count,
                BuyRestrictionCurrent = 0,
            },
        });

        // 물물교환 구조: 아이템 1개당 [[가격 구성요소, …]] 형태의 이중 리스트다.
        assort.BarterScheme[itemId] = new List<List<BarterScheme>>
        {
            new() { new BarterScheme { Count = op.Price ?? 0, Template = new MongoId(op.Currency!) } }
        };

        assort.LoyalLevelItems[itemId] = op.LoyaltyLevel ?? 1;
        return true;
    }
}

/// <summary>
/// mod/db/locales/global/*.json 을 게임 로케일에 합친다 (Preload).
///
/// 4.1 에서 구조가 바뀐 부분: LocaleTable.Global 은 3.x 처럼 그냥 딕셔너리가 아니라
/// Dictionary&lt;string, LazyLoad&lt;GlobalLocaleDictionary&gt;&gt; 다. 값을 직접 넣으면
/// 나중에 실제 로케일이 로드될 때 통째로 덮어써지므로, AddTransformer 로
/// "읽힐 때 내 항목을 얹어라" 는 변환 함수를 등록해야 한다.
/// </summary>
public abstract class LocaleLoaderBase(
    ISptLogger<LocaleLoaderBase> logger,
    PatchLoader loader,
    ModHelper modHelper,
    LocaleTable locales
) : HanaViLoaderBase(loader)
{
    private static readonly JsonSerializerOptions Options = new()
    {
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    /// <summary>이 모드의 폴더 경로. 파생 클래스가 팩 로케일 폴더를 찾을 때 쓴다.</summary>
    protected string ModFolder => modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());

    protected override void Run()
    {
        LoadFolder(Path.Combine(ModFolder, "db", "locales", "global"));
    }

    /// <summary>지정한 폴더의 *.json 을 언어별로 읽어 로케일에 얹는다.</summary>
    protected int LoadFolder(string dir)
    {
        if (!Directory.Exists(dir)) return 0;

        var loaded = 0;
        foreach (var file in Directory.GetFiles(dir, "*.json"))
        {
            var code = Path.GetFileNameWithoutExtension(file);

            Dictionary<string, string>? payload;
            try
            {
                payload = ReadLocaleFile(file);
            }
            catch (Exception ex)
            {
                logger.Error($"[{ModName}] 로케일 파일을 읽지 못했다 {Path.GetFileName(file)}: {ex.Message}");
                continue;
            }

            if (payload is null or { Count: 0 }) continue;

            if (!locales.Global.TryGetValue(code, out var lazy))
            {
                logger.Warning($"[{ModName}] 게임에 '{code}' 로케일이 없어 건너뛴다");
                continue;
            }

            lazy.AddTransformer(dict =>
            {
                foreach (var (key, value) in payload) dict[key] = value;
                return dict;
            });

            loaded++;
        }

        if (loaded > 0) logger.Info($"[{ModName}] 로케일 {loaded}개 언어 적용 ({Path.GetFileName(Path.GetDirectoryName(dir))}/{Path.GetFileName(dir)})");
        return loaded;
    }

    /// <summary>
    /// 로케일 파일을 "키 → 값" 으로 평탄화한다. 원본이 두 가지 형식을 쓰고 있어 둘 다 받는다.
    ///
    ///   (A) 평면형  { "&lt;ID&gt; Name": "...", "&lt;ID&gt; ShortName": "..." }
    ///   (B) itemids { "itemids": { "&lt;ID&gt;": { "Name": "...", "ShortName": "..." } } }
    ///
    /// 게임이 실제로 쓰는 건 (A) 형식이라, (B) 는 읽으면서 (A) 로 펼친다.
    /// </summary>
    private static Dictionary<string, string>? ReadLocaleFile(string path)
    {
        var node = JsonNode.Parse(File.ReadAllText(path),
            documentOptions: new JsonDocumentOptions
            {
                CommentHandling = JsonCommentHandling.Skip,
                AllowTrailingCommas = true,
            });

        if (node is not JsonObject root) return null;

        var result = new Dictionary<string, string>();

        if (root["itemids"] is JsonObject itemids)
        {
            foreach (var (id, entry) in itemids)
            {
                if (entry is JsonObject fields)
                {
                    foreach (var (field, value) in fields)
                    {
                        if (value is not null) result[$"{id} {field}"] = value.ToString();
                    }
                }
                else if (entry is not null)
                {
                    // 값이 문자열 하나면 이름으로 본다 (3.11 이 그렇게 처리했다).
                    result[$"{id} Name"] = entry.ToString();
                }
            }
        }

        foreach (var (key, value) in root)
        {
            // '_' 로 시작하는 키는 파일 안 주석용이고, itemids 는 위에서 이미 처리했다.
            if (key.StartsWith('_') || key == "itemids") continue;
            if (value is not null) result[key] = value.ToString();
        }

        return result;
    }
}
