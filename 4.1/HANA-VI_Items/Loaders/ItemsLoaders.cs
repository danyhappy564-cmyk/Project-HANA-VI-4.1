using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Server;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace HanaVi.Items.Loaders;

// HANA-VI_Items 는 두 가지 일을 한다.
//   (1) 아이템 팩 주입  — 무기/장비 묶음을 DB 에 새로 넣는다 (PackInjector)
//   (2) 설정 패치       — 토이건/전술키트/확장탄창 등 기존 아이템 수정 (PatchEngine)
// 둘 다 같은 로드 단계 규칙을 따른다: 아이템 추가는 Preload, 값 수정은 PostLoad,
// 상인 등록은 TraderRegistration.

internal static class ItemsMod
{
    public const string Name = "HANA-VI Items";
}

/// <summary>아이템 팩 주입 — 아이템/의류/프리셋/도감. 반드시 Preload 여야 한다.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 50)]
public class ItemsPackLoader(
    ISptLogger<ItemsPackLoader> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    ExtraPackInjector extra,
    TemplateTable templates,
    GlobalTable globals
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken = default)
    {
        loader.ModName = ItemsMod.Name;
        if (!loader.Config.Enabled) return Task.CompletedTask;

        var items = 0;
        var clothes = 0;
        var packs = 0;

        foreach (var pack in reader.Manifests)
        {
            if (!pack.Enabled) continue;

            // 팩마다 데이터 형식이 달라서 여기서 갈라 준다.
            // 형식을 통일하지 않은 이유는 팩 JSON 을 3.11 원본 그대로 두기 위해서다.
            var madeItems = pack.Format switch
            {
                "wtt" => extra.InjectWtt(pack, templates),
                "raw" => extra.InjectRaw(pack, templates),
                "mosin" => extra.InjectMosin(pack, templates),
                "nerv" => extra.InjectNerv(pack, templates),
                _ => injector.InjectItems(pack, templates, globals),
            };

            var madeClothes = pack.Format == "hanamod" ? injector.InjectClothing(pack, templates) : 0;

            items += madeItems;
            clothes += madeClothes;
            packs++;

            if (loader.Config.VerboseLogging)
            {
                logger.Info($"[{ItemsMod.Name}] {pack.Name} ({pack.Format}) — 아이템 {madeItems}개" +
                            (madeClothes > 0 ? $", 의류 {madeClothes}개" : ""));
            }
        }

        logger.Success($"[{ItemsMod.Name}] 팩 {packs}개 / 아이템 {items}개 / 의류 {clothes}개 등록");
        return Task.CompletedTask;
    }
}

/// <summary>
/// 설정 패치 중 새 아이템을 만드는 작업 (stage: preload) — 확장 탄창 74종, TT-33K, 전술키트 부품 등.
/// 팩(+50) 다음에 돌려서 팩 아이템을 복제 원본으로 써도 되게 한다.
/// (이 로더가 빠져 있어서 preload 작업이 통째로 안 돌고, 상인 판매만 없는 아이템으로 등록되던 문제가 있었다)
/// </summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 55)]
public class ItemsPreloadLoader(
    ISptLogger<PreloadLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PreloadLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => ItemsMod.Name;
}

/// <summary>팩 아이템의 이름·설명 + mod/db/locales/global/*.json.</summary>
[Injectable(TypePriority = OnLoadOrder.Preload + 60)]
public class ItemsLocaleLoader(
    ISptLogger<LocaleLoaderBase> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    ModHelper modHelper,
    LocaleTable locales
) : LocaleLoaderBase(logger, loader, modHelper, locales)
{
    protected override string ModName => ItemsMod.Name;

    protected override void Run()
    {
        var applied = 0;

        // 비활성화된 팩 폴더 이름 수집 (비활성 팩은 로케일도 로드하지 않음)
        var disabledFolders = new HashSet<string>(
            reader.Manifests.Where(p => !p.Enabled).Select(p => Path.GetFileName(reader.PackFolder(p))),
            StringComparer.OrdinalIgnoreCase
        );

        // 1) 모드 자체 기본 로케일 (db/locales/global)
        var modLocaleDirs = new[]
        {
            Path.Combine(ModFolder, "db", "locales", "global"),
            Path.Combine(ModFolder, "db", "locales"),
            Path.Combine(ModFolder, "locales", "global"),
            Path.Combine(ModFolder, "locales")
        };

        foreach (var dir in modLocaleDirs)
        {
            var modLocales = LoadLocaleFolder(dir);
            if (modLocales.Count > 0)
            {
                RegisterWithFallback(modLocales, ref applied);
                break;
            }
        }

        // 2) db/packs 아래의 모든 서브폴더 탐색 (tt33k처럼 매니페스트에 없는 폴더까지 전부 포함)
        var packsRoots = new[]
        {
            Path.Combine(ModFolder, "db", "packs"),
            Path.Combine(ModFolder, "mod", "db", "packs")
        };

        var scannedDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var packsRoot in packsRoots)
        {
            if (!Directory.Exists(packsRoot)) continue;

            foreach (var packDir in Directory.GetDirectories(packsRoot))
            {
                var folderName = Path.GetFileName(packDir);
                if (disabledFolders.Contains(folderName)) continue;
                if (!scannedDirs.Add(packDir)) continue;

                var candidateDirs = new[]
                {
                    Path.Combine(packDir, "locales", "global"),
                    Path.Combine(packDir, "locales"),
                    Path.Combine(packDir, "db", "locales", "global"),
                    Path.Combine(packDir, "db", "locales")
                };

                foreach (var dir in candidateDirs)
                {
                    var folderLocales = LoadLocaleFolder(dir);
                    if (folderLocales.Count > 0)
                    {
                        RegisterWithFallback(folderLocales, ref applied);
                        break;
                    }
                }
            }
        }

        // 3) 매니페스트 JSON 안에 정의된 인라인 locales 항목 병합
        foreach (var pack in reader.Manifests)
        {
            if (!pack.Enabled) continue;

            var inlineLocales = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var (lang, entries) in injector.CollectLocales(pack))
            {
                var l = lang.ToLowerInvariant();
                if (!inlineLocales.TryGetValue(l, out var langDict))
                {
                    langDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    inlineLocales[l] = langDict;
                }

                foreach (var (k, v) in entries) langDict[k] = v;
            }

            if (inlineLocales.Count > 0)
            {
                RegisterWithFallback(inlineLocales, ref applied);
            }
        }

        if (applied > 0) Logger.Info($"[{ModName}] 전체 로케일 {applied}줄 등록 완료 (Fallback 포함)");
    }

    /// <summary>
    /// 수집된 언어별 사전을 게임 언어 테이블에 영어 Fallback 기준으로 주입.
    /// </summary>
    private void RegisterWithFallback(Dictionary<string, Dictionary<string, string>> localeGroup, ref int appliedCount)
    {
        if (localeGroup.Count == 0) return;

        if (!localeGroup.TryGetValue("en", out var fallback))
        {
            fallback = localeGroup.Values.FirstOrDefault();
        }

        foreach (var (lang, lazy) in Locales.Global)
        {
            Dictionary<string, string> payload;

            if (localeGroup.TryGetValue(lang, out var specific))
            {
                // 타 언어가 존재해도 영어 fallback을 베이스로 깔아 누락된 키 보충
                if (fallback is not null && !string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase))
                {
                    payload = new Dictionary<string, string>(fallback, StringComparer.OrdinalIgnoreCase);
                    foreach (var (k, v) in specific) payload[k] = v;
                }
                else
                {
                    payload = specific;
                }
            }
            else
            {
                // 번역이 아예 없는 언어는 영어 fallback 전체 사용
                payload = fallback;
            }

            if (payload is null || payload.Count == 0) continue;

            lazy.AddTransformer(dict =>
            {
                if (dict is null) return dict;
                foreach (var (key, value) in payload) dict[key] = value;
                return dict;
            });

            appliedCount += payload.Count;
        }
    }

    /// <summary>
    /// 폴더 내 *.json 파일을 읽어 언어별 사전으로 변환.
    /// </summary>
    private Dictionary<string, Dictionary<string, string>> LoadLocaleFolder(string dir)
    {
        var result = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
        if (!Directory.Exists(dir)) return result;

        var files = Directory.GetFiles(dir, "*.json");
        foreach (var file in files)
        {
            var lang = Path.GetFileNameWithoutExtension(file).ToLowerInvariant();
            try
            {
                var entries = ParseLocaleFile(file);
                if (entries is null || entries.Count == 0) continue;

                if (!result.TryGetValue(lang, out var langDict))
                {
                    langDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    result[lang] = langDict;
                }

                foreach (var (k, v) in entries) langDict[k] = v;
            }
            catch (Exception ex)
            {
                Logger.Error($"[{ModName}] 로케일 파싱 실패 ({Path.GetFileName(file)}): {ex.Message}");
            }
        }

        return result;
    }

    /// <summary>
    /// JSON 평탄화 (평면형 및 itemids 중첩형 모두 지원).
    /// </summary>
    private static Dictionary<string, string>? ParseLocaleFile(string path)
    {
        if (!File.Exists(path)) return null;

        var node = JsonNode.Parse(File.ReadAllText(path),
            documentOptions: new JsonDocumentOptions
            {
                CommentHandling = JsonCommentHandling.Skip,
                AllowTrailingCommas = true,
            });

        if (node is not JsonObject root) return null;

        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

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
                    result[$"{id} Name"] = entry.ToString();
                }
            }
        }

        foreach (var (key, value) in root)
        {
            if (key.StartsWith('_') || key == "itemids") continue;
            if (value is not null) result[key] = value.ToString();
        }

        return result;
    }
}

/// <summary>설정 패치 — 토이건/전술키트/확장탄창 등 기존 아이템 수정.</summary>
[Injectable(TypePriority = OnLoadOrder.PostLoad + 30)]
public class ItemsPatchLoader(
    ISptLogger<PatchLoaderBase> logger, PatchLoader loader, PatchEngine engine, TemplateTable templates
) : PatchLoaderBase(logger, loader, engine, templates)
{
    protected override string ModName => ItemsMod.Name;
}

/// <summary>팩의 상인 판매 목록 + 설정 패치의 상인 등록.</summary>
[Injectable(InjectionType.Singleton, OnLoadOrder.TraderRegistration + 70)]
public class ItemsTraderLoader(
    ISptLogger<TraderLoaderBase> logger,
    PatchLoader loader,
    PackReader reader,
    PackInjector injector,
    ExtraPackInjector extra,
    TradersTable traders
) : TraderLoaderBase(logger, loader, traders)
{
    protected override string ModName => ItemsMod.Name;

    protected override void Run()
    {
        base.Run();

        var config = reader.ReadJson<ItemsConfig>(Path.Combine(reader.ModFolder, "config.json"))
                     ?? new ItemsConfig();

        var added = 0;
        foreach (var pack in reader.Manifests)
        {
            if (!pack.Enabled) continue;

            added += pack.Format switch
            {
                "wtt" => extra.InjectWttTraders(pack, Traders),
                "mosin" => extra.InjectMosinTraders(pack, Traders),
                "nerv" => extra.InjectNervTraders(pack, Traders),
                "raw" => 0,
                _ => injector.InjectTraders(pack, Traders, config.Lvl1Traders),
            };
        }

        if (added > 0) Logger.Info($"[{ItemsMod.Name}] 팩 상인 물품 {added}건 등록");
    }
}