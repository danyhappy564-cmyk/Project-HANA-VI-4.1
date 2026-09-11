"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const itemTemplate = require("../templates/item_template.json");
const articleTemplate = require("../templates/article_template.json");
const modConfig = require("../config.json");
const blacklist = require("../blacklist.json");
class Mod {
    mod;
    wttTraderIds = {
        MECHANIC: "5a7c2eca46aef81a7ca2145d",
        SKIER: "58330581ace78e27b8b10cee",
        PEACEKEEPER: "5935c25fb3acc3127c3d8cd9",
        THERAPIST: "54cb57776803fa99248b456e",
        PRAPOR: "54cb50c76803fa8b248b4571",
        JAEGAR: "5c0647fdd443bc2504c2d371",
        RAGMAN: "5ac3b934156ae10c4430e83c",
        FENCE: "579dc571d53a0658a154fbec",
        GOBLINKING: "GoblinKing"
    };
    wttCurrencyIds = {
        ROUBLES: "5449016a4bdc2d6f028b456f",
        EUROS: "569668774bdc2da2298b4568",
        DOLLARS: "5696686a4bdc2da3298b456a"
    };
    cfg = require("../config.json");
    db;
    mydb;
    logger;
    jsonUtil;
    constructor() {
        this.mod = "HANA-VI's Items";
    }
    // AUG 파츠 호환성 패치
    addAugCompatibility(tables) {
        const items = tables.templates.items;
        // 우리가 만든 새 파츠들의 MongoID
        const augHandguards = [
            "69376a83355605dac5ccf570", // fb20
            "69376a83a79652d4883cb666", // guerilla
            "69376a831ff9da1dc30e69b3" // turaco
        ];
        const augDrumMag = "69376a839be480fcc7656efb";
        // 기준이 되는 “원래 AUG 핸드가드 / 탄창” ID (원본 mod.js에서 쓰던 값 그대로)
        const baseAugHandguard = "634e61b0767cb15c4601a877";
        const baseAugMagazine = "630e1adbbd357927e4007c09";
        for (const parentItemId in items) {
            const parentItem = items[parentItemId];
            if (!parentItem || !parentItem._props || !parentItem._props.Slots) {
                continue;
            }
            for (const slot of parentItem._props.Slots) {
                if (!slot || !slot._props || !Array.isArray(slot._props.filters)) {
                    continue;
                }
                for (const f of slot._props.filters) {
                    if (!f || !Array.isArray(f.Filter)) {
                        continue;
                    }
                    // 1) 기존 AUG 핸드가드가 달리던 슬롯이면 → 새 핸드가드 3개 다 추가
                    if (f.Filter.includes(baseAugHandguard)) {
                        for (const newHg of augHandguards) {
                            if (!f.Filter.includes(newHg)) {
                                f.Filter.push(newHg);
                            }
                        }
                    }
                    // 2) 기존 AUG 탄창이 달리던 슬롯이면 → 60발 드럼탄창 추가
                    if (f.Filter.includes(baseAugMagazine)) {
                        if (!f.Filter.includes(augDrumMag)) {
                            f.Filter.push(augDrumMag);
                        }
                    }
                }
            }
        }
    }
    injectMxlr(tables, modPath) {
        // MXLR data is expected under: <mod>/db/mxlr/
        const mxlrBase = path.join(modPath, "mxlr");
        // Ensure locales structure exists
        if (!tables.locales) {
            tables.locales = { global: {} };
        }
        else if (!tables.locales.global) {
            tables.locales.global = {};
        }
        // 1) Items
        const itemsPath = path.join(mxlrBase, "templates", "items.json");
        if (fs.existsSync(itemsPath)) {
            const itemsStr = fs.readFileSync(itemsPath, "utf-8");
            const mxlrItems = JSON.parse(itemsStr);
            for (const [tplId, item] of Object.entries(mxlrItems)) {
                tables.templates.items[tplId] = item;
            }
        }
        // 2) Handbook + flea price
        const handbookPath = path.join(mxlrBase, "templates", "handbook.json");
        if (fs.existsSync(handbookPath)) {
            const handbookStr = fs.readFileSync(handbookPath, "utf-8");
            const mxlrHandbook = JSON.parse(handbookStr);
            if (Array.isArray(mxlrHandbook.Items)) {
                for (const hb of mxlrHandbook.Items) {
                    tables.templates.handbook.Items.push(hb);
                    if (hb?.Id && typeof hb.Price === "number") {
                        tables.templates.prices[hb.Id] = hb.Price;
                    }
                }
            }
        }
        // 3) Locales (global)
        const localesDir = path.join(mxlrBase, "locales", "global");
        if (fs.existsSync(localesDir)) {
            const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith(".json"));
            for (const file of localeFiles) {
                const lang = path.basename(file, ".json");
                const localePath = path.join(localesDir, file);
                const localeStr = fs.readFileSync(localePath, "utf-8");
                const locData = JSON.parse(localeStr);
                if (!tables.locales.global[lang]) {
                    tables.locales.global[lang] = {};
                }
                const gameLocale = tables.locales.global[lang];
                for (const [key, value] of Object.entries(locData)) {
                    gameLocale[key] = value;
                }
            }
        }
    }
    injectSdtacKits(container, tables, modPath) {
        // 공용 logger / jsonUtil
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        // HANA-VI_Items/db/SDTAC_KITS/database/ 에 원래 SDTAC 모드 database 폴더가 들어있다고 가정
        const dbRoot = path.join(modPath, "SDTAC_KITS", "database");
        // 다른 이식 코드들에서 쓰는 loadDir 패턴 그대로 사용
        const loadDir = (dir) => {
            const result = {};
            if (!fs.existsSync(dir)) {
                return result;
            }
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    result[entry.name] = loadDir(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith(".json")) {
                    const key = entry.name.replace(/\.json$/, "");
                    const raw = fs.readFileSync(fullPath, "utf8");
                    result[key] = JSON.parse(raw);
                }
            }
            return result;
        };
        // Mod Info
        const modFolderName = "SDTAC KITS";
        const modFullName = "Practical tac kits"; // 원본은 오타로 Pratical 이었음
        // Trader IDs (원본 mod.ts 기준: 스키어만 사용)
        const traders = {
            skier: this.wttTraderIds.SKIER
        };
        // Currency IDs
        const currencies = {
            roubles: this.wttCurrencyIds.ROUBLES,
            dollars: this.wttCurrencyIds.DOLLARS,
            euros: this.wttCurrencyIds.EUROS
        };
        // DB 로드
        if (!fs.existsSync(dbRoot)) {
            this.logger.warning(`[${modFullName}] database path not found: ${dbRoot} (건너뜀)`);
            return;
        }
        this.mydb = loadDir(dbRoot);
        this.db = tables;
        this.logger.info(`Loading: ${modFullName}`);
        // ───── SDtac_* → 공용 items / clothes alias ─────
        // hanamod의 유틸 함수(cloneItem, createItem, cloneClothing, createClothing 등)는
        // this.mydb.items / this.mydb.clothes 를 기준으로 동작하니까, 구조만 맞춰주면 됨.
        if (this.mydb.SDtac_items && !this.mydb.items) {
            this.mydb.items = this.mydb.SDtac_items;
        }
        if (this.mydb.SDtac_clothes && !this.mydb.clothes) {
            this.mydb.clothes = this.mydb.SDtac_clothes;
        }
        // ───── Scavcase / 아이템 블랙리스트 주입 (원래 mod.ts와 같은 패턴) ─────
        const configServer = container.resolve("ConfigServer");
        const serverScavcaseConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.SCAVCASE);
        const itemFilterService = container.resolve("ItemFilterService");
        const itemBlacklist = itemFilterService.getBlacklistedItems();
        // blacklist.json의 addtoconfigsitem / addtoconfigsscavcase 그대로 사용
        itemBlacklist.push(...blacklist.addtoconfigsitem.blacklist);
        const newBlacklist2 = serverScavcaseConfig.rewardItemBlacklist.concat(blacklist.addtoconfigsscavcase.rewardItemBlacklist);
        serverScavcaseConfig.rewardItemBlacklist = newBlacklist2;
        // ───── Items 주입 ─────
        if (this.mydb.items) {
            for (const [ID, Item] of Object.entries(this.mydb.items)) {
                if (!Item || !Item.enable) {
                    continue;
                }
                if ("clone" in Item) {
                    this.cloneItem(Item.clone, ID);
                    this.copyToFilters(Item.clone, ID, Item.enableCloneCompats, Item.enableCloneConflicts);
                }
                else {
                    this.createItem(ID);
                }
                // 다국어 로케일
                this.addLocales(ID, Item);
                // 거래까지 쓰고 싶으면 아래 주석 해제
                // this.addTrades(ID, Item, traders, currencies);
            }
            this.logger.debug(`${modFolderName} items and handbook finished`);
            // Item Filters (기존 아이템 필터에 새 템 추가 등)
            for (const ID in this.mydb.items) {
                const item = this.mydb.items[ID];
                if (item && item.enable) {
                    this.addToFilters(ID);
                }
            }
            this.logger.debug(`${modFolderName} item filters finished`);
        }
        // ───── Clothing (의류) 주입 ─────
        if (this.mydb.clothes) {
            for (const [ID, Article] of Object.entries(this.mydb.clothes)) {
                if (!Article) {
                    continue;
                }
                if ("clone" in Article) {
                    this.cloneClothing(Article.clone, ID);
                }
                else {
                    this.createClothing(ID);
                }
                // 의류 로케일
                this.addLocales(ID, undefined, Article);
            }
            this.logger.debug(`${modFolderName} clothing finished`);
        }
        // ───── Presets (globals.ItemPresets 주입) ─────
        // 3.11에서 프리셋 꼬이는 게 싫으면 통째로 주석 처리해도 됨
        if (this.mydb.globals && this.mydb.globals.ItemPresets) {
            for (const presetId in this.mydb.globals.ItemPresets) {
                tables.globals.ItemPresets[presetId] = this.mydb.globals.ItemPresets[presetId];
            }
            this.logger.debug(`${modFolderName} presets finished`);
        }
        // ───── Traders (스키어 상인에 어쏠트/스킨 추가) ─────
        for (const trader in traders) {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(`${modFolderName} traders finished`);
        // ───── Mastery (무기 숙련도 확장) ─────
        if (this.mydb.globals && this.mydb.globals.config && this.mydb.globals.config.Mastering) {
            const dbMastering = this.db.globals.config.Mastering;
            for (const key in this.mydb.globals.config.Mastering) {
                dbMastering.push(this.mydb.globals.config.Mastering[key]);
            }
            this.logger.debug(`${modFolderName} mastery finished`);
        }
    }
    injectSigMcxVirtus(container, tables, modPath) {
        // 공용 logger / jsonUtil은 hanamod.ts 나머지 코드와 동일한 방식으로 씀
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        // HANA-VI_Items/db/SIG_MCX_VIRTUS/database/ 이하에 원래 MCX mod의 database 폴더를 넣어둔다고 가정
        const dbRoot = path.join(modPath, "SIG_MCX_VIRTUS", "database");
        // mod.ts에서 ImporterUtil.loadRecursive 쓰던 부분을, hanamod.ts에서 이미 쓰는 loadDir 패턴으로 통일
        const loadDir = (dir) => {
            const result = {};
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    result[entry.name] = loadDir(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith(".json")) {
                    const key = entry.name.replace(/\.json$/, "");
                    const raw = fs.readFileSync(fullPath, "utf8");
                    result[key] = JSON.parse(raw);
                }
            }
            return result;
        };
        // mod.ts의 Mod Info / 트레이더 / 화폐 정의 그대로 사용
        const modFolderName = "SIG_MCX_VIRTUS";
        const modFullName = "SIG_MCX_VIRTUS";
        const traders = {
            skier: "58330581ace78e27b8b10cee"
        };
        const currencies = {
            roubles: "5449016a4bdc2d6f028b456f",
            dollars: "5696686a4bdc2da3298b456a",
            euros: "569668774bdc2da2298b4568"
        };
        // SPT DB 핸들, 커스텀 DB 로드
        this.db = tables;
        if (!fs.existsSync(dbRoot)) {
            this.logger.warning(`[${modFullName}] database path not found: ${dbRoot} (건너뜀)`);
            return;
        }
        this.mydb = loadDir(dbRoot);
        this.logger.info(`Loading: ${modFullName}`);
        // 원래는 this.mydb.VIR_items / VIR_clothes 구조였으므로,
        // hanamod.ts 유틸 함수들이 기대하는 this.mydb.items / clothes로 alias를 잡아줌
        if (this.mydb.VIR_items && !this.mydb.items) {
            this.mydb.items = this.mydb.VIR_items;
        }
        if (this.mydb.VIR_clothes && !this.mydb.clothes) {
            this.mydb.clothes = this.mydb.VIR_clothes;
        }
        // ───── Scavcase / 아이템 블랙리스트 주입 (mod.ts와 동일 패턴) ─────
        const configServer = container.resolve("ConfigServer");
        const serverScavcaseConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.SCAVCASE);
        const itemFilterService = container.resolve("ItemFilterService");
        const itemBlacklist = itemFilterService.getBlacklistedItems();
        // blacklist.json의 addtoconfigsitem / addtoconfigsscavcase 그대로 사용
        itemBlacklist.push(...blacklist.addtoconfigsitem.blacklist);
        const newBlacklist2 = serverScavcaseConfig.rewardItemBlacklist.concat(blacklist.addtoconfigsscavcase.rewardItemBlacklist);
        serverScavcaseConfig.rewardItemBlacklist = newBlacklist2;
        // ───── Items 주입 ─────
        if (this.mydb.items) {
            for (const [ID, Item] of Object.entries(this.mydb.items)) {
                if (!Item || !Item.enable) {
                    continue;
                }
                // clone 있으면 기존 아이템 복제, 아니면 새로 생성
                if ("clone" in Item) {
                    this.cloneItem(Item.clone, ID);
                    this.copyToFilters(Item.clone, ID, Item.enableCloneCompats, Item.enableCloneConflicts);
                }
                else {
                    this.createItem(ID);
                }
                // 다국어 로케일
                this.addLocales(ID, Item);
                // 거래(바터/판매)까지 쓰고 싶으면 아래 주석 풀어서 사용
                // this.addTrades(ID, Item, traders, currencies);
            }
            this.logger.debug(`${modFolderName} items and handbook finished`);
            // Item Filters (기존 아이템 필터에 새 템 추가 등)
            for (const ID in this.mydb.items) {
                const item = this.mydb.items[ID];
                if (item && item.enable) {
                    this.addToFilters(ID);
                }
            }
            this.logger.debug(`${modFolderName} item filters finished`);
        }
        // ───── Clothing 주입 ─────
        if (this.mydb.clothes) {
            for (const [ID, Article] of Object.entries(this.mydb.clothes)) {
                if ("clone" in Article) {
                    this.cloneClothing(Article.clone, ID);
                }
                else {
                    this.createClothing(ID);
                }
                // 의류 로케일
                this.addLocales(ID, undefined, Article);
            }
            this.logger.debug(`${modFolderName} clothing finished`);
        }
        // ───── Presets (원본 mod.ts처럼 globals.ItemPresets 주입) ─────
        // 3.11에서 커스텀 프리셋 꼬이는 걸 피하고 싶으면 전체 블록을 주석 처리해도 됨
        if (this.mydb.globals && this.mydb.globals.ItemPresets) {
            for (const presetId in this.mydb.globals.ItemPresets) {
                tables.globals.ItemPresets[presetId] = this.mydb.globals.ItemPresets[presetId];
            }
            this.logger.debug(`${modFolderName} presets finished`);
        }
        // ───── Traders (스키어 상인에 어쏠트/스킨 추가) ─────
        for (const trader in traders) {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(`${modFolderName} traders finished`);
        // ───── Mastery (무기 숙련도 확장) ─────
        // 원본 mod.ts는 여기서 this.mydb.globals.config.Mastering 내용을
        // this.db.globals.config.Mastering에 push하는 식이라, 구조만 맞춰 두면 그대로 사용 가능
        if (this.mydb.globals && this.mydb.globals.config && this.mydb.globals.config.Mastering) {
            const dbMastering = this.db.globals.config.Mastering;
            for (const key in this.mydb.globals.config.Mastering) {
                dbMastering.push(this.mydb.globals.config.Mastering[key]);
            }
            this.logger.debug(`${modFolderName} mastery finished`);
        }
    }
    // MCX 파츠 호환성 패치
    addMCXCompatibility(tables) {
        const items = tables.templates.items;
        // 우리가 만든 새 파츠들의 MongoID
        const MCXuppers = [
            "6937742e20afce84e5c8fb12", // MCX Virtus upper
        ];
        // 기준이 되는 “원래 MCX 상부 총몸” ID (원본 mod.js에서 쓰던 값 그대로)
        const baseMCXupper = "5fbcc3e4d6fa9c00c571bb58";
        for (const parentItemId in items) {
            const parentItem = items[parentItemId];
            if (!parentItem || !parentItem._props || !parentItem._props.Slots) {
                continue;
            }
            for (const slot of parentItem._props.Slots) {
                if (!slot || !slot._props || !Array.isArray(slot._props.filters)) {
                    continue;
                }
                for (const f of slot._props.filters) {
                    if (!f || !Array.isArray(f.Filter)) {
                        continue;
                    }
                    // 1) 기존 MCX 상부총몸이 달리던 슬롯이면 → 새 상부총몸 다 추가
                    if (f.Filter.includes(baseMCXupper)) {
                        for (const newuppers of MCXuppers) {
                            if (!f.Filter.includes(newuppers)) {
                                f.Filter.push(newuppers);
                            }
                        }
                    }
                }
            }
        }
    }
    injectCarlQhb(container, tables, modPath) {
        // 공용 logger / jsonUtil
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        // HANA-VI_Items/db/Carl-QHB/database/ 에 QHB 모드 database 폴더를 넣어둔다고 가정
        const dbRoot = path.join(modPath, "Carl-QHB", "database");
        // mod.ts 에서 ImporterUtil.loadRecursive 쓰던 부분을,
        // 이미 hanamod.ts에서 쓰는 loadDir 패턴으로 통일
        const loadDir = (dir) => {
            const result = {};
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    result[entry.name] = loadDir(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith(".json")) {
                    const key = entry.name.replace(/\.json$/, "");
                    const raw = fs.readFileSync(fullPath, "utf8");
                    result[key] = JSON.parse(raw);
                }
            }
            return result;
        };
        // Mod Info (mod.ts 그대로)
        const modFolderName = "Carl-QHB";
        const modFullName = "Carl-QHB";
        const traders = {
            prapor: "54cb50c76803fa8b248b4571",
            therapist: "54cb57776803fa99248b456e",
            skier: "58330581ace78e27b8b10cee",
            peacekeeper: "5935c25fb3acc3127c3d8cd9",
            mechanic: "5a7c2eca46aef81a7ca2145d",
            ragman: "5ac3b934156ae10c4430e83c",
            jaeger: "5c0647fdd443bc2504c2d371"
        };
        const currencies = {
            roubles: "5449016a4bdc2d6f028b456f",
            dollars: "5696686a4bdc2da3298b456a",
            euros: "569668774bdc2da2298b4568"
        };
        // DB 로드
        if (!fs.existsSync(dbRoot)) {
            this.logger.warning(`[${modFullName}] database path not found: ${dbRoot} (건너뜀)`);
            return;
        }
        this.db = tables;
        this.mydb = loadDir(dbRoot);
        this.logger.info(`Loading: ${modFullName}`);
        // 원본 구조: this.mydb.GW_items / GW_clothes
        // hanamod 유틸은 this.mydb.items / clothes 를 기대하므로 alias
        if (this.mydb.GW_items && !this.mydb.items) {
            this.mydb.items = this.mydb.GW_items;
        }
        if (this.mydb.GW_clothes && !this.mydb.clothes) {
            this.mydb.clothes = this.mydb.GW_clothes;
        }
        // ───── Scavcase / 아이템 블랙리스트 주입은 mod.ts 에 없으니까 건너뜀 ─────
        // 필요하면 SIG_MCX_VIRTUS 쪽 코드 참고해서 여기에도 넣으면 됨.
        // ───── Items 주입 (mod.ts 의 GW_items 루프) ─────
        if (this.mydb.items) {
            for (const [ID, Item] of Object.entries(this.mydb.items)) {
                if (!Item || !Item.enable) {
                    continue;
                }
                if ("clone" in Item) {
                    this.cloneItem(Item.clone, ID);
                    this.copyToFilters(Item.clone, ID, Item.enableCloneCompats, Item.enableCloneConflicts);
                }
                else {
                    this.createItem(ID);
                }
                // 로케일
                this.addLocales(ID, Item);
                // 거래도 쓰고 싶으면 주석 해제
                // this.addTrades(ID, Item, traders, currencies);
            }
            this.logger.debug(`${modFolderName} items and handbook finished`);
            // Item Filters
            for (const ID in this.mydb.items) {
                const item = this.mydb.items[ID];
                if (item && item.enable) {
                    this.addToFilters(ID);
                }
            }
            this.logger.debug(`${modFolderName} item filters finished`);
        }
        // ───── Clothing 주입 (mod.ts 의 GW_clothes 루프) ─────
        if (this.mydb.clothes) {
            for (const [ID, Article] of Object.entries(this.mydb.clothes)) {
                if ("clone" in Article) {
                    this.cloneClothing(Article.clone, ID);
                }
                else {
                    this.createClothing(ID);
                }
                // 의류 로케일
                this.addLocales(ID, undefined, Article);
            }
            this.logger.debug(`${modFolderName} clothing finished`);
        }
        // ───── Presets (원본 mod.ts: this.mydb.globals.ItemPresets → db.globals.ItemPresets) ─────
        if (this.mydb.globals && this.mydb.globals.ItemPresets) {
            for (const presetId in this.mydb.globals.ItemPresets) {
                tables.globals.ItemPresets[presetId] = this.mydb.globals.ItemPresets[presetId];
            }
            this.logger.debug(`${modFolderName} presets finished`);
        }
        // ───── Traders ─────
        for (const trader in traders) {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(`${modFolderName} traders finished`);
        // ───── Mastery (mod.ts 로직 이식) ─────
        //   const dbMastering = this.db.globals.config.Mastering
        //   for (const weapon in this.mydb.globals.config.Mastering) ...
        //   MCX 템플릿에 weapon_qhb_300blk 추가
        if (this.mydb.globals && this.mydb.globals.config && this.mydb.globals.config.Mastering) {
            const dbMastering = this.db.globals.config.Mastering;
            const srcMastering = this.mydb.globals.config.Mastering;
            // QHB가 추가하는 Mastering 엔트리들 push
            for (const key in srcMastering) {
                dbMastering.push(srcMastering[key]);
            }
            // MCX 엔트리에 QHB 무기 템플릿 추가
            for (const mastery of dbMastering) {
                if (!mastery || mastery.Name !== "MCX") {
                    continue;
                }
                const tplId = "weapon_qhb_300blk";
                if (!Array.isArray(mastery.Templates)) {
                    mastery.Templates = [];
                }
                if (!mastery.Templates.includes(tplId)) {
                    mastery.Templates.push(tplId);
                }
            }
            this.logger.debug(`${modFolderName} mastery finished`);
        }
    }
    injectAtlasGear(container, tables, modPath) {
        // 공용 logger / jsonUtil
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        // HANA-VI_Items/db/ATLAS-GEAR/database/ 에 ATLAS 모드 database 폴더를 넣어둔다고 가정
        const dbRoot = path.join(modPath, "ATLAS-GEAR", "database");
        // 기존 ImporterUtil.loadRecursive 를 hanamod 기준 loadDir 패턴으로 치환
        const loadDir = (dir) => {
            const result = {};
            if (!fs.existsSync(dir)) {
                return result;
            }
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    result[entry.name] = loadDir(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith(".json")) {
                    const key = entry.name.replace(/\.json$/, "");
                    const raw = fs.readFileSync(fullPath, "utf8");
                    result[key] = JSON.parse(raw);
                }
            }
            return result;
        };
        const modFolderName = "ATLAS-GEAR";
        const modFullName = "A T L A S Custom Weapons & Equipment";
        // Trader IDs (원본 atlasmod.ts 와 동일)
        const traders = {
            prapor: "54cb50c76803fa8b248b4571",
            therapist: "54cb57776803fa99248b456e",
            skier: "58330581ace78e27b8b10cee",
            peacekeeper: "5935c25fb3acc3127c3d8cd9",
            mechanic: "5a7c2eca46aef81a7ca2145d",
            ragman: "5ac3b934156ae10c4430e83c",
            jaeger: "5c0647fdd443bc2504c2d371"
        };
        // Currency IDs
        const currencies = {
            roubles: "5449016a4bdc2d6f028b456f",
            dollars: "5696686a4bdc2da3298b456a",
            euros: "569668774bdc2da2298b4568"
        };
        if (!fs.existsSync(dbRoot)) {
            this.logger.warning(`[${modFullName}] database path not found: ${dbRoot} (건너뜀)`);
            return;
        }
        // SPT DB / 커스텀 DB 핸들
        this.db = tables;
        this.mydb = loadDir(dbRoot);
        this.logger.info(`Loading: ${modFullName}`);
        // 원본 구조: custom_items / custom_clothes / globals ...
        // hanamod 유틸은 this.mydb.items / clothes 를 기대하므로 alias + ID 변환
        if (this.mydb.custom_items) {
            if (!this.mydb.items) {
                this.mydb.items = {};
            }
            for (const [customKey, customItem] of Object.entries(this.mydb.custom_items)) {
                if (!customItem) {
                    continue;
                }
                // atlasmod 에서는 customKey 와 별도의 sptID 를 쓰지만,
                // hanamod 쪽 유틸은 맵의 key 가 최종 템플릿 ID 라고 가정하므로
                // sptID 가 있으면 그걸 key 로 사용한다.
                const newId = customItem.sptID ?? customKey;
                this.mydb.items[newId] = customItem;
            }
        }
        if (this.mydb.custom_clothes) {
            if (!this.mydb.clothes) {
                this.mydb.clothes = {};
            }
            for (const [customKey, article] of Object.entries(this.mydb.custom_clothes)) {
                if (!article) {
                    continue;
                }
                // clothes 도 items 와 마찬가지로 sptID 를 실제 템플릿 ID 로 사용
                const newId = article.sptID ?? customKey;
                this.mydb.clothes[newId] = article;
            }
        }
        // ───── Items 주입 ─────
        if (this.mydb.items) {
            for (const [ID, Item] of Object.entries(this.mydb.items)) {
                if (!Item || !Item.enable) {
                    continue;
                }
                if ("clone" in Item) {
                    this.cloneItem(Item.clone, ID);
                    this.copyToFilters(Item.clone, ID, Item.enableCloneCompats, Item.enableCloneConflicts);
                }
                else {
                    this.createItem(ID);
                }
                // 다국어 로케일
                this.addLocales(ID, Item);
                // 거래까지 쓰고 싶으면 아래 주석을 해제
                // this.addTrades(ID, Item, traders, currencies);
            }
            this.logger.debug(`${modFolderName} items and handbook finished`);
            // Item Filters (기존 아이템 필터에 새 템 추가 등)
            for (const ID in this.mydb.items) {
                const item = this.mydb.items[ID];
                if (item && item.enable) {
                    this.addToFilters(ID);
                }
            }
            this.logger.debug(`${modFolderName} item filters finished`);
        }
        // ───── Clothing (의류) 주입 ─────
        if (this.mydb.clothes) {
            for (const [ID, Article] of Object.entries(this.mydb.clothes)) {
                if (!Article) {
                    continue;
                }
                if ("clone" in Article) {
                    this.cloneClothing(Article.clone, ID);
                }
                else {
                    this.createClothing(ID);
                }
                // 의류 로케일
                this.addLocales(ID, undefined, Article);
            }
            this.logger.debug(`${modFolderName} clothing finished`);
        }
        // ───── Presets (globals.ItemPresets 주입) ─────
        if (this.mydb.globals && this.mydb.globals.ItemPresets) {
            for (const presetId in this.mydb.globals.ItemPresets) {
                tables.globals.ItemPresets[presetId] = this.mydb.globals.ItemPresets[presetId];
            }
            this.logger.debug(`${modFolderName} presets finished`);
        }
        // ───── Traders (assort / 옷) 주입 ─────
        for (const trader in traders) {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(`${modFolderName} traders finished`);
        // ───── Mastery (원본 atlasmod.ts 로직) ─────
        if (this.mydb.globals && this.mydb.globals.config && this.mydb.globals.config.Mastering) {
            const dbMastering = this.db.globals.config.Mastering;
            const srcMastering = this.mydb.globals.config.Mastering;
            // atlas 가 추가하는 Mastering 엔트리들 push
            for (const key in srcMastering) {
                dbMastering.push(srcMastering[key]);
            }
            // SR25 엔트리에 ATLAS SR25 템플릿 추가 (원본: "0088_ATL_SR25_FDE_8800")
            for (const weapon of dbMastering) {
                if (weapon.Name === "SR25" && Array.isArray(weapon.Templates)) {
                    if (!weapon.Templates.includes("0088_ATL_SR25_FDE_8800")) {
                        weapon.Templates.push("0088_ATL_SR25_FDE_8800");
                    }
                }
            }
            this.logger.debug(`${modFolderName} mastery finished`);
        }
    }
    injectQbz191(container, tables, modPath) {
        this.logger = container.resolve("WinstonLogger");
        this.jsonUtil = container.resolve("JsonUtil");
        const dbRoot = path.join(modPath, "qbz191", "database");
        const loadDir = (dir) => {
            const result = {};
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    result[entry.name] = loadDir(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith(".json")) {
                    const key = entry.name.replace(/\.json$/, "");
                    const raw = fs.readFileSync(fullPath, "utf8");
                    result[key] = JSON.parse(raw);
                }
            }
            return result;
        };
        //Mod Info
        const modFolderName = "1SD-QBZ191";
        const modFullName = "NW-QBZ191";
        //Trader IDs
        const traders = {
            "mechanic": "5a7c2eca46aef81a7ca2145d"
        };
        //Currency IDs
        const currencies = {
            "roubles": "5449016a4bdc2d6f028b456f",
            "dollars": "5696686a4bdc2da3298b456a",
            "euros": "569668774bdc2da2298b4568"
        };
        //Get the server database and our custom database
        this.db = tables;
        this.mydb = loadDir(dbRoot);
        this.logger.info("Loading: " + modFullName + " Created by Saintdeeer ");
        //Blacklist Function
        const configServer = container.resolve("ConfigServer");
        const serverScavcaseConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.SCAVCASE);
        const itemFilterService = container.resolve("ItemFilterService");
        const itemBlacklist = itemFilterService.getBlacklistedItems();
        itemBlacklist.push(...blacklist.addtoconfigsitem.blacklist);
        const newBlacklist2 = serverScavcaseConfig.rewardItemBlacklist.concat(blacklist.addtoconfigsscavcase.rewardItemBlacklist);
        serverScavcaseConfig.rewardItemBlacklist = newBlacklist2;
        ///this.logger.info(serverScavcaseConfig.rewardItemBlacklist);
        //Items
        for (const [ID, Item] of Object.entries(this.mydb.items)) {
            //Items + Handbook
            if (Item.enable) {
                if ("clone" in Item) {
                    this.cloneItem(Item.clone, ID);
                    this.copyToFilters(Item.clone, ID, Item.enableCloneCompats, Item.enableCloneConflicts);
                }
                else
                    this.createItem(ID);
                //Locales (Languages)
                this.addLocales(ID, Item);
                //Trades
                //this.addTrades(ID, Item, traders, currencies);
            }
        }
        this.logger.debug(modFolderName + " items and handbook finished");
        //Item Filters
        for (const ID in this.mydb.items)
            if (this.mydb.items[ID].enable)
                this.addToFilters(ID);
        this.logger.debug(modFolderName + " item filters finished");
        //Clothing
        for (const [ID, Article] of Object.entries(this.mydb.clothes)) {
            //Articles + Handbook
            if ("clone" in Article) {
                this.cloneClothing(Article.clone, ID);
            }
            else {
                //Doesn't do anything yet...
                this.createClothing(ID);
            }
            //Locales (Languages)
            this.addLocales(ID, undefined, Article);
            //Trades
            //this.addTrades(ID, Item, traders, currencies);
        }
        this.logger.debug(modFolderName + " clothing finished");
        //Presets - disabled in 3.11 port (avoid broken custom presets)
        // if (this.mydb.globals && this.mydb.globals.ItemPresets)
        // {
        //     for (const preset in this.mydb.globals.ItemPresets)
        //     {
        //         this.db.globals.ItemPresets[preset] = this.mydb.globals.ItemPresets[preset];
        //     }
        // }
        this.logger.debug(modFolderName + " presets skipped (disabled)");
        //Traders
        for (const trader in traders) {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(modFolderName + " traders finished");
        //Stimulator Buffs
        //for (const buff in this.mydb.globals.config.Health.Effects.Stimulator.Buffs) this.db.globals.config.Health.Effects.Stimulator.Buffs[buff] = this.mydb.globals.config.Health.Effects.Stimulator.Buffs[buff];
        //this.logger.debug(modFolderName + " stimulator buffs finished");
        //Mastery
        const dbMastering = this.db.globals.config.Mastering;
        for (const weapon in this.mydb.globals.config.Mastering)
            dbMastering.push(this.mydb.globals.config.Mastering[weapon]);
        for (const weapon in dbMastering) {
            if (dbMastering[weapon].Name == "AK74")
                dbMastering[weapon].Templates.push("b6c589ec25350853408c15a0");
        }
        this.logger.debug(modFolderName + " mastery finished");
    }
    cloneItem(itemToClone, ID) {
        //If the item is enabled in the json
        if (this.mydb.items[ID].enable == true) {
            //Get a clone of the original item from the database
            let ItemOut = this.jsonUtil.clone(this.db.templates.items[itemToClone]);
            //Change the necessary item attributes using the info in our database file items.json
            ItemOut._id = ID;
            ItemOut = this.compareAndReplace(ItemOut, this.mydb.items[ID]["item"]);
            //Add the new item to the database
            this.db.templates.items[ID] = ItemOut;
            this.logger.debug("Item " + ID + " created as a clone of " + itemToClone + " and added to database.");
            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": ID,
                "ParentId": this.mydb.items[ID]["handbook"]["ParentId"],
                "Price": this.mydb.items[ID]["handbook"]["Price"]
            };
            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + ID + " added to handbook with price " + handbookEntry.Price);
        }
    }
    createItem(itemToCreate) {
        //Create an item from scratch instead of cloning it
        //Requires properly formatted entry in items.json with NO "clone" attribute
        //Get the new item object from the json
        const newItem = this.mydb.items[itemToCreate];
        //If the item is enabled in the json
        if (newItem.enable) {
            //Check the structure of the new item in items
            const [pass, checkedItem] = this.checkItem(newItem);
            if (!pass)
                return;
            //Add the new item to the database
            this.db.templates.items[itemToCreate] = checkedItem;
            this.logger.debug("Item " + itemToCreate + " created and added to database.");
            //Create the handbook entry for the items
            const handbookEntry = {
                "Id": itemToCreate,
                "ParentId": newItem["handbook"]["ParentId"],
                "Price": newItem["handbook"]["Price"]
            };
            //Add the handbook entry to the database
            this.db.templates.handbook.Items.push(handbookEntry);
            this.logger.debug("Item " + itemToCreate + " added to handbook with price " + handbookEntry.Price);
        }
    }
    checkItem(itemToCheck) {
        //A very basic top-level check of an item to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors
        let pass = true;
        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in itemTemplate) {
            if (!(level1 in itemToCheck.item)) {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your item entry!");
                pass = false;
            }
        }
        //Then make sure the attributes in _props exist in the item template, warn user if not.
        for (const prop in itemToCheck.item._props) {
            if (!(prop in itemTemplate._props))
                this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in item template!");
        }
        const itemOUT = {
            "_id": itemToCheck.item._id,
            "_name": itemToCheck.item._name,
            "_parent": itemToCheck.item._parent,
            "_props": itemToCheck.item._props,
            "_type": itemToCheck.item._type,
            "_proto": itemToCheck.item._proto
        };
        return [pass, itemOUT];
    }
    compareAndReplace(originalItem, attributesToChange) {
        //Recursive function to find attributes in the original item/clothing object and change them.
        //This is done so each attribute does not have to be manually changed and can instead be read from properly formatted json
        //Requires the attributes to be in the same nested object format as the item entry in order to work (see items.json and items.json in SPT install)
        for (const key in attributesToChange) {
            //If you've reached the end of a nested series, try to change the value in original to new
            if ((["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key])) {
                if (key in originalItem)
                    originalItem[key] = attributesToChange[key];
                //TO DO: Add check with item template here if someone wants to add new properties to a cloned item.
                else {
                    this.logger.warning("(Item: " + originalItem._id + ") WARNING: Could not find the attribute: \"" + key + "\" in the original item, make sure this is intended!");
                    originalItem[key] = attributesToChange[key];
                }
            }
            //Otherwise keep traveling down the nest
            else
                originalItem[key] = this.compareAndReplace(originalItem[key], attributesToChange[key]);
        }
        return originalItem;
    }
    getFilters(item) {
        //Get the slots, chambers, cartridges, and conflicting items objects and return them.
        const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined") ? [] : this.db.templates.items[item]._props.Slots;
        const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined") ? [] : this.db.templates.items[item]._props.Chambers;
        const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined") ? [] : this.db.templates.items[item]._props.Cartridges;
        const filters = slots.concat(chambers, cartridges);
        const conflictingItems = (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;
        return [filters, conflictingItems];
    }
    copyToFilters(itemClone, ID, enableCompats = true, enableConflicts = true) {
        //Find the original item in all compatible and conflict filters and add the clone to those filters as well
        //Will skip one or both depending on the enable parameters
        for (const item in this.db.templates.items) {
            if (item in this.mydb.items)
                continue;
            const [filters, conflictingItems] = this.getFilters(item);
            if (enableCompats) {
                for (const filter of filters) {
                    for (const id of filter._props.filters[0].Filter) {
                        if (id === itemClone)
                            filter._props.filters[0].Filter.push(ID);
                    }
                }
            }
            if (enableConflicts)
                for (const conflictID of conflictingItems)
                    if (conflictID === itemClone)
                        conflictingItems.push(ID);
        }
    }
    addToFilters(ID) {
        //Add a new item to compatibility & conflict filters of pre-existing items
        //Add additional compatible and conflicting items to new item filters (manually adding more than the ones that were cloned)
        const NewItem = this.mydb.items[ID];
        //If the item is enabled in the json
        if (NewItem.enable) {
            this.logger.debug("addToFilters: " + ID);
            //Manually add items into an THISMOD item's filters
            if ("addToThisItemsFilters" in NewItem) {
                const ItemFilters = this.getFilters(ID)[0];
                let ConflictingItems = this.getFilters(ID)[1];
                for (const modSlotName in NewItem.addToThisItemsFilters) {
                    if (modSlotName === "conflicts")
                        ConflictingItems = ConflictingItems.concat(NewItem.addToThisItemsFilters.conflicts);
                    else {
                        for (const filter in ItemFilters) {
                            if (modSlotName === ItemFilters[filter]._name) {
                                const slotFilter = ItemFilters[filter]._props.filters[0].Filter;
                                const newFilter = slotFilter.concat(NewItem.addToThisItemsFilters[modSlotName]);
                                ItemFilters[filter]._props.filters[0].Filter = newFilter;
                            }
                        }
                    }
                }
            }
            //Manually add THISMOD items to pre-existing item filters.
            if ("addToExistingItemFilters" in NewItem) {
                for (const modSlotName in NewItem.addToExistingItemFilters) {
                    if (modSlotName === "conflicts") {
                        for (const conflictingItem of NewItem.addToExistingItemFilters[modSlotName]) {
                            const conflictingItems = this.getFilters(conflictingItem)[1];
                            conflictingItems.push(ID);
                        }
                    }
                    else {
                        for (const compatibleItem of NewItem.addToExistingItemFilters[modSlotName]) {
                            const filters = this.getFilters(compatibleItem)[0];
                            for (const filter of filters) {
                                if (modSlotName === filter._name)
                                    filter._props.filters[0].Filter.push(ID);
                            }
                        }
                    }
                }
            }
        }
    }
    processWttInventorySlots(tables, itemId, itemConfig) {
        // 설정에 슬롯 정보가 없으면 스킵
        if (!itemConfig.addtoInventorySlots || itemConfig.addtoInventorySlots.length === 0) {
            return;
        }
        // 기본 인벤토리 템플릿 (WTT 원본도 이 ID를 사용함)
        const defaultInventory = tables.templates.items["55d7217a4bdc2d86028b456d"];
        if (!defaultInventory?._props?.Slots || !Array.isArray(defaultInventory._props.Slots)) {
            return;
        }
        const allowed = Array.isArray(itemConfig.addtoInventorySlots)
            ? itemConfig.addtoInventorySlots
            : [itemConfig.addtoInventorySlots];
        for (const slot of defaultInventory._props.Slots) {
            // 예: "FirstPrimaryWeapon", "SecondPrimaryWeapon"
            const slotName = slot._name;
            // 예: "55d729c64bdc2d89028b4570" 같은 슬롯 템플릿 ID
            const slotTplId = slot._id;
            // json에 슬롯 이름이나 ID 둘 중 하나를 넣어도 인식되게
            if (!allowed.includes(slotName) && !allowed.includes(slotTplId)) {
                continue;
            }
            const filters = slot._props?.filters;
            if (!filters || !Array.isArray(filters) || !filters[0]?.Filter) {
                continue;
            }
            const filterArray = filters[0].Filter;
            if (!filterArray.includes(itemId)) {
                filterArray.push(itemId);
            }
        }
    }
    cloneClothing(articleToClone, ID) {
        if (this.mydb.clothes[ID].enable || !("enable" in this.mydb.clothes[ID])) {
            //Get a clone of the original item from the database
            let ClothingOut = this.jsonUtil.clone(this.db.templates.customization[articleToClone]);
            //Change the necessary clothing item attributes using the info in our database file clothes.json
            ClothingOut._id = ID;
            ClothingOut._name = ID;
            ClothingOut = this.compareAndReplace(ClothingOut, this.mydb.clothes[ID]["customization"]);
            //Add the new item to the database
            this.db.templates.customization[ID] = ClothingOut;
            this.logger.debug("Clothing item " + ID + " created as a clone of " + articleToClone + " and added to database.");
        }
    }
    createClothing(articleToCreate) {
        //Create clothing from scratch instead of cloning it
        //Requires properly formatted entry in clothes.json with NO "clone" attribute
        //Get the new article object from the json
        const newArticle = this.mydb.clothes[articleToCreate];
        //If the article is enabled in the json
        if (newArticle.enable) {
            //Check the structure of the new article in clothes
            const [pass, checkedArticle] = this.checkArticle(newArticle);
            if (!pass)
                return;
            //Add the new item to the database
            this.db.templates.customization[articleToCreate] = checkedArticle;
            this.logger.debug("Article " + articleToCreate + " created and added to database.");
        }
    }
    checkArticle(articleToCheck) {
        //A very basic top-level check of an article to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors
        let pass = true;
        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in articleTemplate) {
            if (!(level1 in articleToCheck.customization)) {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your article entry!");
                pass = false;
            }
        }
        //Then make sure the attributes in _props exist in the article template, warn user if not.
        for (const prop in articleToCheck.customization._props) {
            if (!(prop in articleTemplate._props))
                this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in article template!");
        }
        const articleOUT = {
            "_id": articleToCheck.customization._id,
            "_name": articleToCheck.customization._name,
            "_parent": articleToCheck.customization._parent,
            "_props": articleToCheck.customization._props,
            "_type": articleToCheck.customization._type,
            "_proto": articleToCheck.customization._proto
        };
        return [pass, articleOUT];
    }
    addTraderAssort(trader) {
        //Items
        for (const item in this.mydb.traders[trader].assort.items) {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.items.push(this.mydb.traders[trader].assort.items[item]);
        }
        //Barter Scheme
        for (const item in this.mydb.traders[trader].assort.barter_scheme) {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.barter_scheme[item] = this.mydb.traders[trader].assort.barter_scheme[item];
        }
        //Loyalty Levels
        for (const item in this.mydb.traders[trader].assort.loyal_level_items) {
            //this.logger.debug(item + " added to " + trader);
            if (modConfig.lvl1Traders)
                this.db.traders[trader].assort.loyal_level_items[item] = 1;
            else
                this.db.traders[trader].assort.loyal_level_items[item] = this.mydb.traders[trader].assort.loyal_level_items[item];
        }
    }
    addTraderSuits(trader) {
        //Only do anything if a suits.json file is included for trader in this mod
        if (typeof this.mydb.traders[trader].suits !== "undefined") {
            //Enable customization for that trader
            this.db.traders[trader].base.customization_seller = true;
            //Create the suits array if it doesn't already exist in SPT database so we can push to it
            if (typeof this.db.traders[trader].suits === "undefined")
                this.db.traders[trader].suits = [];
            //Push all suits
            for (const suit of this.mydb.traders[trader].suits)
                this.db.traders[trader].suits.push(suit);
        }
    }
    /*
    private addTrades(ID: string, Item: any, traders: object, currencies: object): void
    {

        for (const [tradeID, trade] of Object.entries(Item.trades))
        {

        }
        
        const items = {
            "_id": "",
            "_tpl": "",
            "parentId": "",
            "slotId": "",
            "upd": {}
        };

        const barter_scheme = {

        };

        const loyal_level_items = {

        }
    }
    */
    addLocales(ID, Item, Article) {
        const name = ID + " Name";
        const shortname = ID + " ShortName";
        const description = ID + " Description";
        const isItem = typeof Item !== "undefined";
        const Entry = isItem ? Item : Article;
        for (const localeID in this.db.locales.global) //For each possible locale/language in SPT's database
         {
            let localeEntry;
            if (Entry.locales) {
                if (localeID in Entry.locales) //If the language is entered in items, use that
                 {
                    localeEntry = {
                        "Name": Entry.locales[localeID].Name,
                        "ShortName": Entry.locales[localeID].ShortName,
                        "Description": Entry.locales[localeID].Description
                    };
                }
                else //Otherwise use english as the default
                 {
                    localeEntry = {
                        "Name": Entry.locales.en.Name,
                        "ShortName": Entry.locales.en.ShortName,
                        "Description": Entry.locales.en.Description
                    };
                }
                //If you are using the old locales
                if (modConfig.oldLocales)
                    this.db.locales.global[localeID].templates[ID] = localeEntry;
                //Normal
                else {
                    this.db.locales.global[localeID][name] = localeEntry.Name;
                    this.db.locales.global[localeID][shortname] = localeEntry.ShortName;
                    this.db.locales.global[localeID][description] = localeEntry.Description;
                }
            }
            else {
                if (isItem)
                    this.logger.warning("WARNING: Missing locale entry for item: " + ID);
                else
                    this.logger.debug("No locale entries for item/clothing: " + ID);
            }
            //Also add the necessary preset locale entries if they exist
            if (isItem && Item.presets) {
                for (const preset in Item.presets) {
                    if (modConfig.oldLocales)
                        this.db.locales.global[localeID].preset[preset] = {
                            "Name": Item.presets[preset]
                        };
                    else {
                        this.db.locales.global[localeID][preset] = Item.presets[preset];
                    }
                }
            }
        }
    }
    loadWttCombinedConfig(modPath) {
        const itemsRoot = path.join(modPath, "Items");
        if (!fs.existsSync(itemsRoot)) {
            return {};
        }
        const configFiles = fs.readdirSync(itemsRoot).filter((file) => file.endsWith(".json"));
        const combined = {};
        for (const file of configFiles) {
            const fullPath = path.join(itemsRoot, file);
            const raw = fs.readFileSync(fullPath, "utf-8");
            try {
                const parsed = JSON.parse(raw);
                Object.assign(combined, parsed);
            }
            catch (e) {
                // Skip malformed files but don't crash the whole mod
                // (user can fix the json separately)
            }
        }
        return combined;
    }
    createWttCloneItem(itemConfig, itemId) {
        const itemPrefabPath = `customItems/${itemId}.bundle`;
        const overrideProps = itemConfig.overrideProperties
            ? {
                ...itemConfig.overrideProperties,
                Prefab: {
                    path: (itemConfig.overrideProperties.Prefab && itemConfig.overrideProperties.Prefab.path)
                        ? itemConfig.overrideProperties.Prefab.path
                        : itemPrefabPath,
                    rcid: ""
                }
            }
            : undefined;
        const cloneDetails = {
            itemTplToClone: itemConfig.itemTplToClone,
            newId: itemId,
            parentId: itemConfig.parentId,
            handbookParentId: itemConfig.handbookParentId,
            handbookPriceRoubles: itemConfig.handbookPriceRoubles,
            fleaPriceRoubles: itemConfig.fleaPriceRoubles,
            overrideProperties: overrideProps,
            locales: itemConfig.locales
        };
        return cloneDetails;
    }
    processWttTraders(tables, itemConfig, itemId) {
        if (!itemConfig.addtoTraders) {
            return;
        }
        const traderKey = itemConfig.traderId;
        const finalTraderId = this.wttTraderIds[traderKey] || traderKey;
        const trader = tables.traders[finalTraderId];
        if (!trader) {
            return;
        }
        const assort = trader.assort;
        // Basic item entry in assort.items
        const unlimited = Array.isArray(itemConfig.traderItems) && itemConfig.traderItems.length > 0
            ? !!itemConfig.traderItems[0].unlimitedCount
            : true;
        const stackCount = Array.isArray(itemConfig.traderItems) && itemConfig.traderItems.length > 0
            ? (itemConfig.traderItems[0].stackObjectsCount || 999999)
            : 999999;
        assort.items.push({
            _id: itemId,
            _tpl: itemId,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: unlimited,
                StackObjectsCount: stackCount
            }
        });
        // Barter scheme (price)
        const schemeArr = Array.isArray(itemConfig.barterScheme) ? itemConfig.barterScheme : [];
        if (schemeArr.length > 0) {
            assort.barter_scheme[itemId] = [];
            for (const scheme of schemeArr) {
                const tplFromCurrency = this.wttCurrencyIds[scheme._tpl];
                const finalTpl = tplFromCurrency || scheme._tpl;
                assort.barter_scheme[itemId].push([
                    {
                        _tpl: finalTpl,
                        count: scheme.count
                    }
                ]);
            }
        }
        else {
            // Default: buy for handbook price in roubles
            assort.barter_scheme[itemId] = [[
                    {
                        _tpl: this.wttCurrencyIds.ROUBLES,
                        count: itemConfig.handbookPriceRoubles || 1
                    }
                ]];
        }
        // Loyalty level
        assort.loyal_level_items[itemId] = itemConfig.loyallevelitems || 1;
    }
    injectWttCustomItems(container, tables, modPath) {
        const logger = container.resolve("WinstonLogger");
        const customItemService = container.resolve("CustomItemService");
        const configs = this.loadWttCombinedConfig(modPath);
        const itemIds = Object.keys(configs);
        if (itemIds.length === 0) {
            return;
        }
        let numAdded = 0;
        for (const itemId of itemIds) {
            const itemConfig = configs[itemId];
            if (!itemConfig || !itemConfig.itemTplToClone) {
                continue;
            }
            const cloneDetails = this.createWttCloneItem(itemConfig, itemId);
            customItemService.createItemFromClone(cloneDetails);
            numAdded++;
            // WTT 스타일 커스텀 아이템: 인벤토리 슬롯 필터에 tpl 추가
            this.processWttInventorySlots(tables, itemId, itemConfig);
            this.processWttTraders(tables, itemConfig, itemId);
        }
        if (numAdded > 0) {
            logger.info(`[HANA-VI_Items] Loaded ${numAdded} WTT-style custom items from db/Items.`);
        }
    }
    postDBLoad(container) {
        const jsonUtil = container.resolve("JsonUtil");
        const database = container.resolve("DatabaseServer");
        const tables = database.getTables();
        const items = tables.templates.items;
        const handbook = tables.templates.handbook;
        const modLoader = container.resolve("PreSptModLoader");
        const logger = container.resolve("WinstonLogger");
        // 🔻🔻🔻 여기부터 디버그용 코드 추가 🔻🔻🔻
        if (false) // 필요 없으면 나중에 false로 바꾸거나 통째로 지우면 됨
         {
            for (const tplId in items) {
                const itm = items[tplId];
                // 아예 없는 경우
                if (!itm || typeof itm !== "object") {
                    logger.error(`[HANA-DEBUG] templates.items[${tplId}] is not a valid object: ${itm}`);
                    continue;
                }
                // _props 자체가 없음 → 이게 AKResonant를 터트리는 진짜 범인 타입
                if (!("_props" in itm)) {
                    logger.error(`[HANA-DEBUG] Item ${tplId} has NO _props. full= ${JSON.stringify(itm)}`);
                    continue;
                }
                // _props는 있는데 Slots가 없는 애들은 참고용으로만 보고 싶으면:
                // if (!("_props" in itm) || !("Slots" in itm._props)) { ... } 이런 식으로 더 찍을 수도 있음
            }
        }
        // 🔺🔺🔺 디버그용 코드 끝 🔺🔺🔺
        const modPath = modLoader.getModPath("HANA-VI_Items") + "db/";
        // Inject generic WTT-style custom items from db/Items
        this.injectWttCustomItems(container, tables, modPath);
        // Inject NW-QBZ191 content
        this.injectQbz191(container, tables, modPath);
        // Inject Carl-QHB content (from 기존 mod.ts)
        this.injectCarlQhb(container, tables, modPath);
        // Inject SIG_MCX_VIRTUS content (from 기존 mod.ts)
        this.injectSigMcxVirtus(container, tables, modPath);
        // Inject SDTAC KITS (MFACitems) content
        this.injectSdtacKits(container, tables, modPath);
        // Inject ATLAS-GEAR content
        this.injectAtlasGear(container, tables, modPath);
        const modLocalesPath = path.join(modPath, "locales/global/");
        // Inject MXLR data from db/mxlr
        this.injectMxlr(tables, modPath);
        // MXLR AUG 파츠 호환성 패치
        this.addAugCompatibility(tables);
        // MCX 파츠 호환성 패치
        this.addMCXCompatibility(tables);
        if (!tables.locales || !tables.locales.global) {
            tables.locales = { global: {} };
        }
        const localesData = {};
        if (fs.existsSync(modLocalesPath)) {
            const localeFiles = fs.readdirSync(modLocalesPath).filter(file => file.endsWith(".json"));
            for (const file of localeFiles) {
                const localeID = path.basename(file, ".json");
                const localeFilePath = path.join(modLocalesPath, file);
                if (!fs.existsSync(localeFilePath)) {
                    continue;
                }
                const modLocale = JSON.parse(fs.readFileSync(localeFilePath, "utf-8"));
                localesData[localeID] = modLocale;
                if (!tables.locales.global[localeID]) {
                    tables.locales.global[localeID] = {};
                }
                const gameLocale = tables.locales.global[localeID];
                for (const key in modLocale) {
                    gameLocale[key] = modLocale[key];
                }
            }
        }
        this.cfg = require("../config.json");
        //ar
        const aks74ub = tables.templates.items["5839a40f24597726f856b511"];
        const aks74u = tables.templates.items["57dc2fa62459775949412633"];
        const aks74un = tables.templates.items["583990e32459771419544dd2"];
        const ak101 = tables.templates.items["5ac66cb05acfc40198510a10"];
        const ak102 = tables.templates.items["5ac66d015acfc400180ae6e4"];
        const ak103 = tables.templates.items["5ac66d2e5acfc43b321d4b53"];
        const ak104 = tables.templates.items["5ac66d725acfc43b321d4b60"];
        const ak105 = tables.templates.items["5ac66d9b5acfc4001633997a"];
        const ak74m = tables.templates.items["5ac4cd105acfc40016339859"];
        const rpk16 = tables.templates.items["5beed0f50db834001c062b12"];
        const ak12 = tables.templates.items["6499849fc93611967b034949"];
        const ak74 = tables.templates.items["5bf3e03b0db834001d2c4a9c"];
        const ak74n = tables.templates.items["5644bd2b4bdc2d3b4c8b4572"];
        const aks74 = tables.templates.items["5bf3e0490db83400196199af"];
        const aks74n = tables.templates.items["5ab8e9fcd8ce870019439434"];
        const vpo136 = tables.templates.items["59e6152586f77473dc057aa1"];
        const vpo209 = tables.templates.items["59e6687d86f77411d949b251"];
        const ak545long = tables.templates.items["628b5638ad252a16da6dd245"];
        const ak545short = tables.templates.items["628b9c37a733087d0d7fe84b"];
        const rd704 = tables.templates.items["628a60ae6b1d481ff772e9c8"];
        const mk47 = tables.templates.items["606587252535c57a13424cfd"];
        const scarl = tables.templates.items["6184055050224f204c1da540"];
        const scarlfde = tables.templates.items["618428466ef05c2ce828f218"];
        const mdr556 = tables.templates.items["5c488a752e221602b412af63"];
        const auga3 = tables.templates.items["63171672192e68c5460cebc5"];
        const adar215 = tables.templates.items["5c07c60e0db834002330051f"];
        const tx15 = tables.templates.items["5d43021ca4b9362eab4b5e25"];
        const vsk94 = tables.templates.items["645e0c6b3b381ede770e1cc9"];
        const x9a91 = tables.templates.items["644674a13d52156624001fbc"];
        const scarh = tables.templates.items["6183afd850224f204c1da514"];
        const scarhfde = tables.templates.items["6165ac306ef05c2ce828ef74"];
        const xm7 = tables.templates.items["65290f395ae2ae97b80fdf2d"];
        const sks = tables.templates.items["574d967124597745970e7c94"];
        const opsks = tables.templates.items["587e02ff24597743df3deaeb"];
        const mcx = tables.templates.items["5fbcc1d9016cce60e8341ab3"];
        const asval = tables.templates.items["57c44b372459772d2b39b8ce"];
        const sr3m = tables.templates.items["651450ce0e00edc794068371"];
        const velociraptor = tables.templates.items["674d6121c09f69dfb201a888"];
        //smg
        const vector919 = tables.templates.items["5fc3f2d5900b1d5091531e57"];
        const ump45 = tables.templates.items["5fc3e272f8b6a877a729eac5"];
        const stm9 = tables.templates.items["60339954d62c9b14ed777c06"];
        const pp1901 = tables.templates.items["59984ab886f7743e98271174"];
        const saiga9 = tables.templates.items["59f9cabd86f7743a10721f46"];
        const sr2 = tables.templates.items["62e14904c2699c0ec93adc47"];
        const mpx = tables.templates.items["58948c8e86f77409493f7266"];
        //dmr
        const vss = tables.templates.items["57838ad32459774a17445cd2"];
        const m1a = tables.templates.items["5aafa857e5b5b00018480968"];
        const sr25 = tables.templates.items["5df8ce05b11454561e39243b"];
        const g28 = tables.templates.items["6176aca650224f204c1da3fb"];
        const rsass = tables.templates.items["5a367e5dc4a282000e49738f"];
        //shotgun
        const saiga12 = tables.templates.items["576165642459773c7a400233"];
        //sr
        const vpo215 = tables.templates.items["5de652c31b7e3716273428be"];
        //pistol
        const toygun = tables.templates.items["66015072e9f84d5680039678"];
        //ammo
        //.366 TKM
        const x366tkm = [
            "59e655cb86f77411dc52a77b",
            "59e6542b86f77411dc52a77a",
            "59e6658b86f77411d949b250",
            "5f0596629e22f464da6bbdd9"
        ];
        //6.8x51mm (.277 Fury)
        const x68_51mm = [
            "6529243824cbe3c74a05e5c1",
            "6529302b8c26af6326029fb7"
        ];
        //.300 BLK (7.62x35mm)
        const x300blk = [
            "5fbe3ffdf8b6a877a729ea82",
            "5fd20ff893a8961fc660a954",
            "619636be6db0f2477964e710",
            "6196364158ef8c428c287d9f",
            "6196365d58ef8c428c287da1",
            "64b8725c4b75259c590fa899"
        ];
        //5.56x45mm (.223)
        const x223 = [
            "59e6920f86f77411d82aa167",
            "59e6927d86f77411da468256",
            "54527a984bdc2d4e668b4567",
            "54527ac44bdc2d36668b4567",
            "59e68f6f86f7746c9f75e846",
            "59e6906286f7746c9f75e847",
            "59e690b686f7746c9f75e848",
            "59e6918f86f7746c9f75e849",
            "60194943740c5d77f6705eea",
            "601949593ae8f707c4608daa",
            "5c0d5ae286f7741e46554302"
        ];
        //7.62x51mm (.308)
        const x308 = [
            "5a6086ea4f39f99cd479502f",
            "5a608bf24f39f98ffc77720e",
            "58dd3ad986f77403051cba8f",
            "5e023e53d4353e3302577c4c",
            "5efb0c1bd79ff02a1f5e68d9",
            "5e023e6e34d52a55c3304f71",
            "5e023e88277cce2b522ff2b1"
        ];
        //5.45x39mm (M74)
        const m74 = [
            "5c0d5e4486f77478390952fe",
            "61962b617c6c7b169525f168",
            "56dfef82d2720bbd668b4567",
            "56dff026d2720bb8668b4567",
            "56dff061d2720bb5668b4567",
            "56dff0bed2720bb0668b4567",
            "56dff216d2720bbd668b4568",
            "56dff2ced2720bb4668b4567",
            "56dff338d2720bbd668b4569",
            "56dff3afd2720bba668b4567",
            "56dff421d2720b5f5a8b4567",
            "56dff4a2d2720bbd668b456a",
            "56dff4ecd2720b5f5a8b4568"
        ];
        //7.62x39mm (M43)
        const m43 = [
            "59e0d99486f7744a32234762",
            "59e4d3d286f774176a36250a",
            "5656d7c34bdc2d9d198b4587",
            "59e4cf5286f7741778269d8a",
            "59e4d24686f7741776641ac7",
            "601aa3d2b2bcb34913271e6d",
            "64b7af5a8532cf95ee0a0dbd",
            "64b7af434b75259c590fa893",
            "64b7af734b75259c590fa895"
        ];
        //.45 ACP (1143x23ACP)
        const x45acp = [
            "5e81f423763d9f754677bf2e",
            "5efb0cabfb3e451d70735af5",
            "5efb0fc6aeb21837e749c801",
            "5efb0d4f4bc50b58e81710f3",
            "5ea2a8e200685063ec28c05a"
        ];
        //4.6x30mm HK
        const x46_30mm = [
            "5ba26812d4351e003201fef1",
            "5ba26835d4351e0035628ff5",
            "5ba2678ad4351e44f824b344",
            "5ba26844d4351e00334c9475",
            "64b6979341772715af0f9c39"
        ];
        //9x39mm
        const x9x39mm = [
            "5c0d688c86f77413ae3407b2",
            "61962d879bb3d20b0946d385",
            "57a0dfb82459774d3078b56c",
            "57a0e5022459774d1673f889",
            "5c0d668f86f7747ccb7f13b2",
            "6576f96220d53a5b8f3e395e"
        ];
        if (this.cfg.toygun_rework) {
            logger.info("HANAVI's Items [toygun_rework] Loading...");
            toygun._props.weapFireType.push("fullauto");
            toygun._props.bFirerate = 3000;
            const toygundisk = tables.templates.items["6601546f86889319850bd566"];
            toygundisk._props.StackMaxSize = 1000;
            const toyguntunediskid = "6a946d4865f77450561fAD69";
            const toyguntunedisk = jsonUtil.clone(items["6601546f86889319850bd566"]);
            toyguntunedisk._id = toyguntunediskid;
            items[toyguntunediskid] = toyguntunedisk;
            toyguntunedisk._props.InitialSpeed = 500;
            toyguntunedisk._props.PenetrationPower = 100;
            toyguntunedisk._props.Damage = 5;
            toyguntunedisk._props.ammoRec = -30;
            const addtoyguntunediskid = [
                "6a946d4865f77450561fAD69"
            ];
            const addtoygunmag = tables.templates.items["66015dc4aaad2f54cb04c56a"];
            toygun._props.Chambers[0]._props.filters[0].Filter.push(toyguntunediskid);
            addtoygunmag._props.Cartridges[0]._props.filters[0].Filter.push(...addtoyguntunediskid);
            const toygunmagid = "6a946d4786f77450561fAD69";
            const toygunmag = jsonUtil.clone(items["66015dc4aaad2f54cb04c56a"]);
            toygunmag._id = toygunmagid;
            items[toygunmagid] = toygunmag;
            toygunmag._props.Cartridges[0]._max_count = 1000;
            toygunmag._props.Recoil = -30;
            const addtoygun = [
                "66015072e9f84d5680039678"
            ];
            for (const i in addtoygun)
                for (const slot in items[addtoygun[i]]._props.Slots)
                    if (items[addtoygun[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[addtoygun[i]]._props.Slots[slot]._props.filters[0].Filter.push(toygunmagid);
            addidtot(toygunmagid, "58330581ace78e27b8b10cee", 5, 6974, "5449016a4bdc2d6f028b456f", 1, "5b5f754a86f774094242f19b", 8000, true);
            addidtot(toyguntunediskid, "58330581ace78e27b8b10cee", 500000, 10, "5449016a4bdc2d6f028b456f", 1, "5b47574386f77428ca22b33b", 500, true);
            logger.info("HANAVI's Items [toygun_rework] Loaded successfully.");
        }
        if (this.cfg.ppsh41_tacticalkit) {
            logger.info("HANAVI's Items [ppsh41_tacticalkit] Loading...");
            const ppsh41barrelid = "5a01ad4786f77450561fAD69";
            const ppsh41barrel = jsonUtil.clone(items["560835c74bdc2dc8488b456f"]);
            ppsh41barrel._id = ppsh41barrelid;
            items[ppsh41barrelid] = ppsh41barrel;
            ppsh41barrel._props.Accuracy = 75;
            const addppsh = [
                "5ea03f7400685063ec28bfa8"
            ];
            for (const i in addppsh)
                for (const slot in items[addppsh[i]]._props.Slots)
                    if (items[addppsh[i]]._props.Slots[slot]._name == "mod_barrel")
                        items[addppsh[i]]._props.Slots[slot]._props.filters[0].Filter.push(ppsh41barrelid);
            const ultimastock = [
                "606eef46232e5a31c233d500"
            ];
            for (const i in addppsh)
                for (const slot in items[addppsh[i]]._props.Slots)
                    if (items[addppsh[i]]._props.Slots[slot]._name == "mod_stock")
                        items[addppsh[i]]._props.Slots[slot]._props.filters[0].Filter.push(...ultimastock);
            const muzzleunits = [
                "5b86a0e586f7745b600ccb23",
                "58aeac1b86f77457c419f475",
                "5addbb825acfc408fb139400",
                "5f63407e1b231926f2329f15",
                "5926d33d86f77410de68ebc0",
                "56e05b06d2720bb2668b4586"
            ];
            const addbarrel = [
                ppsh41barrelid
            ];
            for (const i in addbarrel)
                for (const slot in items[addbarrel[i]]._props.Slots)
                    if (items[addbarrel[i]]._props.Slots[slot]._name == "mod_muzzle")
                        items[addbarrel[i]]._props.Slots[slot]._props.filters[0].Filter.push(...muzzleunits);
            const mountrails = [
                "5a966ec8a2750c00171b3f36",
                "5addbffe5acfc4001714dfac"
            ];
            for (const i in addbarrel)
                for (const slot in items[addbarrel[i]]._props.Slots)
                    if (items[addbarrel[i]]._props.Slots[slot]._name == "mod_mount")
                        items[addbarrel[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mountrails);
            addidtot(ppsh41barrelid, "58330581ace78e27b8b10cee", 3, 40000, "5449016a4bdc2d6f028b456f", 1, "5b5f75c686f774094242f19f", 45000, true);
            logger.info("HANAVI's Items [ppsh41_tacticalkit] Loaded successfully.");
        }
        if (this.cfg.ks23m_tacticalkit) {
            logger.info("HANAVI's Items [ks23m_tacticalkit] Loading...");
            const ks23barrelid = "5a01ad4786f774505619AD75";
            const ks23barrel = jsonUtil.clone(items["560835c74bdc2dc8488b456f"]);
            ks23barrel._id = ks23barrelid;
            items[ks23barrelid] = ks23barrel;
            ks23barrel._props.Accuracy = 60;
            const addks23 = [
                "5e848cc2988a8701445df1e8"
            ];
            for (const i in addks23)
                for (const slot in items[addks23[i]]._props.Slots)
                    if (items[addks23[i]]._props.Slots[slot]._name == "mod_barrel")
                        items[addks23[i]]._props.Slots[slot]._props.filters[0].Filter.push(ks23barrelid);
            const addksbarrel = [
                ks23barrelid
            ];
            const muzzleunits = [
                "5b86a0e586f7745b600ccb23",
                "58aeac1b86f77457c419f475",
                "5addbb825acfc408fb139400",
                "5f63407e1b231926f2329f15",
                "5926d33d86f77410de68ebc0",
                "56e05b06d2720bb2668b4586"
            ];
            for (const i in addksbarrel)
                for (const slot in items[addksbarrel[i]]._props.Slots)
                    if (items[addksbarrel[i]]._props.Slots[slot]._name == "mod_muzzle")
                        items[addksbarrel[i]]._props.Slots[slot]._props.filters[0].Filter.push(...muzzleunits);
            const mountrails = [
                "5a966ec8a2750c00171b3f36",
                "5addbffe5acfc4001714dfac"
            ];
            for (const i in addksbarrel)
                for (const slot in items[addksbarrel[i]]._props.Slots)
                    if (items[addksbarrel[i]]._props.Slots[slot]._name == "mod_mount")
                        items[addksbarrel[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mountrails);
            const stockunits = [
                "5bfe86a20db834001d23e8f7", //agr-870
                "5ef1b9f0c64c5d0dfc0571a1", //590-leo
                "5addc7005acfc4001669f275" //m14 alcs
            ];
            for (const i in addks23)
                for (const slot in items[addks23[i]]._props.Slots)
                    if (items[addks23[i]]._props.Slots[slot]._name == "mod_stock")
                        items[addks23[i]]._props.Slots[slot]._props.filters[0].Filter.push(...stockunits);
            const handguards = [
                "606ee5c81246154cad35d65e", //ultima
                "55d45f484bdc2d972f8b456d" //mp-133 custom
            ];
            for (const i in addks23)
                for (const slot in items[addks23[i]]._props.Slots)
                    if (items[addks23[i]]._props.Slots[slot]._name == "mod_handguard")
                        items[addks23[i]]._props.Slots[slot]._props.filters[0].Filter.push(...handguards);
            addidtot(ks23barrelid, "5935c25fb3acc3127c3d8cd9", 3, 400, "5696686a4bdc2da3298b456a", 1, "5b5f75c686f774094242f19f", 450, true);
            logger.info("HANAVI's Items [ks23m_tacticalkit] Loaded successfully.");
        }
        if (this.cfg.vssm_receiver) {
            logger.info("HANAVI's Items [VSSM_Receiver] Loading...");
            const vssm_receiverid = "AA01ad46a9f774505619AD75";
            const vssm_receiver = jsonUtil.clone(items["578395402459774a256959b5"]);
            vssm_receiver._id = vssm_receiverid;
            items[vssm_receiverid] = vssm_receiver;
            vssm_receiver._props.Prefab.path = "hanavi/receiver_vssm.bundle";
            vssm_receiver._props.Ergonomics = 5;
            const scopes = [
                "591c4efa86f7741030027726",
                "570fd79bd2720bc7458b4583",
                "570fd6c2d2720bc6458b457f",
                "558022b54bdc2dac148b458d",
                "58491f3324597764bc48fa02",
                "584924ec24597768f12ae244",
                "5b30b0dc5acfc400153b7124",
                "6165ac8c290d254f5e6b2f6c",
                "60a23797a37c940de7062d02",
                "5d2da1e948f035477b1ce2ba",
                "5c0505e00db834001b735073",
                "609a63b6e2ff132951242d09",
                "584984812459776a704a82a6",
                "59f9d81586f7744c7506ee62",
                "570fd721d2720bc5458b4596",
                "57ae0171245977343c27bfcf",
                "58d39d3d86f77445bb794ae7",
                "616554fe50224f204c1da2aa",
                "5c7d55f52e221644f31bff6a",
                "616584766ef05c2ce828ef57",
                "5b3b6dc75acfc47a8773fb1e",
                "615d8d878004cc50514c3233",
                "5b2389515acfc4771e1be0c0",
                "577d128124597739d65d0e56",
                "618b9643526131765025ab35",
                "618bab21526131765025ab3f",
                "5c86592b2e2216000e69e77c",
                "5a37ca54c4a282000d72296a",
                "5c064c400db834001d23f468",
                "58d2664f86f7747fec5834f6",
                "57c69dd424597774c03b7bbc",
                "5b3b99265acfc4704b4a1afb",
                "5aa66a9be5b5b0214e506e89",
                "5aa66c72e5b5b00016327c93",
                "5c1cdd302e221602b3137250",
                "61714b2467085e45ef140b2c",
                "6171407e50224f204c1da3c5",
                "61713cc4d8e3106d9806c109",
                "5b31163c5acfc400153b71cb",
                "5a33b652c4a28232996e407c",
                "5a33b2c9c4a282000c5a9511",
                "59db7eed86f77461f8380365",
                "5a1ead28fcdbcb001912fa9f",
                "62811f461d5df4475f46a332",
                "63fc449f5bd61c6cf3784a88",
                "6477772ea8a38bb2050ed4db",
                "64785e7c19d732620e045e15"
            ];
            const addmount = [
                vssm_receiverid
            ];
            for (const i in addmount)
                for (const slot in items[addmount[i]]._props.Slots)
                    if (items[addmount[i]]._props.Slots[slot]._name == "mod_scope")
                        items[addmount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...scopes);
            const vss_val = [
                "57838ad32459774a17445cd2", //vss
                "57c44b372459772d2b39b8ce", //as val
                "651450ce0e00edc794068371" //sr-3m
            ];
            for (const i in vss_val)
                for (const slot in items[vss_val[i]]._props.Slots)
                    if (items[vss_val[i]]._props.Slots[slot]._name == "mod_reciever")
                        items[vss_val[i]]._props.Slots[slot]._props.filters[0].Filter.push(...addmount);
            addidtot(vssm_receiverid, "58330581ace78e27b8b10cee", 5, 12460, "5449016a4bdc2d6f028b456f", 2, "5b5f764186f77447ec5d7714", 13250, true);
            logger.info("HANAVI's Items [VSSM_Receiver] Loaded successfully.");
        }
        if (this.cfg.vssm_stock) {
            logger.info("HANAVI's Items [VSSM_Stock] Loading...");
            const vssm_stockid = "AA01ad46a9f464905619AD75";
            const vssm_stock = jsonUtil.clone(items["578395e82459774a0e553c7b"]);
            vssm_stock._id = vssm_stockid;
            items[vssm_stockid] = vssm_stock;
            vssm_stock._props.Prefab.path = "hanavi/stock_vssm.bundle";
            vssm_stock._props.Recoil = -30;
            vssm_stock._props.Ergonomics = 10;
            const addstock = [
                vssm_stockid
            ];
            const adddtockvss = [
                "57838ad32459774a17445cd2", //vss
            ];
            for (const i in adddtockvss)
                for (const slot in items[adddtockvss[i]]._props.Slots)
                    if (items[adddtockvss[i]]._props.Slots[slot]._name == "mod_stock")
                        items[adddtockvss[i]]._props.Slots[slot]._props.filters[0].Filter.push(...addstock);
            addidtot(vssm_stockid, "58330581ace78e27b8b10cee", 5, 12460, "5449016a4bdc2d6f028b456f", 2, "5b5f757486f774093e6cb507", 13250, true);
            logger.info("HANAVI's Items [VSSM_Stock] Loaded successfully.");
        }
        if (this.cfg.Extended_mags) {
            logger.info("HANAVI's Items [Extended_mags] Loading...");
            const CHOPPED60id = "67932708c270d2b12d050355";
            const CHOPPED60 = jsonUtil.clone(items["544a37c44bdc2d25388b4567"]);
            CHOPPED60._id = CHOPPED60id;
            items[CHOPPED60id] = CHOPPED60;
            CHOPPED60._parent = "5448bc234bdc2d3c308b4569";
            CHOPPED60._props.ExaminedByDefault = true;
            CHOPPED60._props.Ergonomics = 2;
            CHOPPED60._props.Width = 1;
            CHOPPED60._props.Height = 2;
            CHOPPED60._props.Weight = 0.09;
            CHOPPED60._props.CheckOverride = 0;
            CHOPPED60._props.ReloadMagType = "ExternalMagazine";
            CHOPPED60._props.VisibleAmmoRangesString = "1-3";
            CHOPPED60._props.MalfunctionChance = 0.15;
            CHOPPED60._props.Prefab.path = "mags/CHOPPED60.bundle";
            CHOPPED60._props.Cartridges[0]._parent = CHOPPED60id;
            CHOPPED60._props.Cartridges[0]._max_count = 40;
            CHOPPED60._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const mp540id = "67932708c270d2b12d050356";
            const mp540 = jsonUtil.clone(items["5d2f213448f0355009199284"]);
            mp540._id = mp540id;
            items[mp540id] = mp540;
            mp540._parent = "5448bc234bdc2d3c308b4569";
            mp540._props.ExaminedByDefault = true;
            mp540._props.Ergonomics = 2;
            mp540._props.ExtraSizeDown = 1;
            mp540._props.Width = 1;
            mp540._props.Height = 2;
            mp540._props.Weight = 0.14;
            mp540._props.CheckOverride = 0;
            mp540._props.ReloadMagType = "ExternalMagazine";
            mp540._props.VisibleAmmoRangesString = "1-3";
            mp540._props.MalfunctionChance = 0.15;
            mp540._props.Prefab.path = "mags/mp540.bundle";
            mp540._props.Cartridges[0]._parent = mp540id;
            mp540._props.Cartridges[0]._max_count = 40;
            mp540._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const extended1911id = "67932708c270d2b12d050357";
            const extended1911 = jsonUtil.clone(items["5e81c4ca763d9f754677befa"]);
            extended1911._id = extended1911id;
            items[extended1911id] = extended1911;
            extended1911._parent = "5448bc234bdc2d3c308b4569";
            extended1911._props.ExaminedByDefault = true;
            extended1911._props.Ergonomics = 1;
            extended1911._props.Width = 1;
            extended1911._props.Height = 1;
            extended1911._props.Weight = 0.16;
            extended1911._props.CheckOverride = 0;
            extended1911._props.ReloadMagType = "ExternalMagazine";
            extended1911._props.VisibleAmmoRangesString = "1-3";
            extended1911._props.MalfunctionChance = 0.15;
            extended1911._props.Prefab.path = "mags/extended1911.bundle";
            extended1911._props.Cartridges[0]._parent = extended1911id;
            extended1911._props.Cartridges[0]._max_count = 10;
            extended1911._props.Cartridges[0]._props.filters[0].Filter = [
                "5e81f423763d9f754677bf2e",
                "5efb0cabfb3e451d70735af5",
                "5efb0fc6aeb21837e749c801",
                "5efb0d4f4bc50b58e81710f3",
                "5ea2a8e200685063ec28c05a"
            ];
            const ks23stendoid = "67932708c270d2b12d050358";
            const ks23stendo = jsonUtil.clone(items["5f647d9f8499b57dc40ddb93"]);
            ks23stendo._id = ks23stendoid;
            items[ks23stendoid] = ks23stendo;
            ks23stendo._parent = "5448bc234bdc2d3c308b4569";
            ks23stendo._props.ExaminedByDefault = true;
            ks23stendo._props.Ergonomics = 1;
            ks23stendo._props.Width = 1;
            ks23stendo._props.Height = 1;
            ks23stendo._props.Weight = 0.16;
            ks23stendo._props.CheckOverride = 0;
            ks23stendo._props.ReloadMagType = "ExternalMagazine";
            ks23stendo._props.VisibleAmmoRangesString = "";
            ks23stendo._props.MalfunctionChance = 0.05;
            ks23stendo._props.Prefab.path = "mags/ks23stendo.bundle";
            ks23stendo._props.Cartridges[0]._parent = ks23stendoid;
            ks23stendo._props.Cartridges[0]._max_count = 7;
            ks23stendo._props.Cartridges[0]._props.filters[0].Filter = [
                "5e85aa1a988a8701445df1f5",
                "5e85aac65505fa48730d8af2",
                "5e85a9a6eacf8c039e4e2ac1",
                "5f647f31b6238e5dd066e196",
                "5e85a9f4add9fe03027d9bf1",
                "5f647fd3f6e4ab66c82faed6"
            ];
            const aics5plusblkid = "67932708c270d2b12d050359";
            const aics5plusblk = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics5plusblk._id = aics5plusblkid;
            items[aics5plusblkid] = aics5plusblk;
            aics5plusblk._parent = "5448bc234bdc2d3c308b4569";
            aics5plusblk._props.ExaminedByDefault = true;
            aics5plusblk._props.Ergonomics = 1;
            aics5plusblk._props.Width = 1;
            aics5plusblk._props.Height = 1;
            aics5plusblk._props.Weight = 0.1;
            aics5plusblk._props.CheckOverride = 0;
            aics5plusblk._props.ReloadMagType = "ExternalMagazine";
            aics5plusblk._props.VisibleAmmoRangesString = "1-3";
            aics5plusblk._props.MalfunctionChance = 0.15;
            aics5plusblk._props.magAnimationIndex = 5;
            aics5plusblk._props.Prefab.path = "mags/aics5plusblk.bundle";
            aics5plusblk._props.Cartridges[0]._parent = aics5plusblkid;
            aics5plusblk._props.Cartridges[0]._max_count = 10;
            aics5plusblk._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics5plusgrnid = "67932708c270d2b12d05035a";
            const aics5plusgrn = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics5plusgrn._id = aics5plusgrnid;
            items[aics5plusgrnid] = aics5plusgrn;
            aics5plusgrn._parent = "5448bc234bdc2d3c308b4569";
            aics5plusgrn._props.ExaminedByDefault = true;
            aics5plusgrn._props.Ergonomics = 1;
            aics5plusgrn._props.Width = 1;
            aics5plusgrn._props.Height = 1;
            aics5plusgrn._props.Weight = 0.1;
            aics5plusgrn._props.CheckOverride = 0;
            aics5plusgrn._props.ReloadMagType = "ExternalMagazine";
            aics5plusgrn._props.VisibleAmmoRangesString = "1-3";
            aics5plusgrn._props.MalfunctionChance = 0.15;
            aics5plusgrn._props.magAnimationIndex = 5;
            aics5plusgrn._props.Prefab.path = "mags/aics5plusgrn.bundle";
            aics5plusgrn._props.Cartridges[0]._parent = aics5plusgrnid;
            aics5plusgrn._props.Cartridges[0]._max_count = 10;
            aics5plusgrn._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics5plusredid = "67932708c270d2b12d05035b";
            const aics5plusred = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics5plusred._id = aics5plusredid;
            items[aics5plusredid] = aics5plusred;
            aics5plusred._parent = "5448bc234bdc2d3c308b4569";
            aics5plusred._props.ExaminedByDefault = true;
            aics5plusred._props.Ergonomics = 2;
            aics5plusred._props.Recoil = -5;
            aics5plusred._props.Width = 1;
            aics5plusred._props.Height = 1;
            aics5plusred._props.Weight = 0.1;
            aics5plusred._props.CheckOverride = 0;
            aics5plusred._props.ReloadMagType = "ExternalMagazine";
            aics5plusred._props.VisibleAmmoRangesString = "1-3";
            aics5plusred._props.MalfunctionChance = 0.15;
            aics5plusred._props.magAnimationIndex = 5;
            aics5plusred._props.Prefab.path = "mags/aics5plusred.bundle";
            aics5plusred._props.Cartridges[0]._parent = aics5plusredid;
            aics5plusred._props.Cartridges[0]._max_count = 10;
            aics5plusred._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics5plustanid = "67932708c270d2b12d05035c";
            const aics5plustan = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics5plustan._id = aics5plustanid;
            items[aics5plustanid] = aics5plustan;
            aics5plustan._parent = "5448bc234bdc2d3c308b4569";
            aics5plustan._props.ExaminedByDefault = true;
            aics5plustan._props.Ergonomics = 1;
            aics5plustan._props.Width = 1;
            aics5plustan._props.Height = 1;
            aics5plustan._props.Weight = 0.1;
            aics5plustan._props.CheckOverride = 0;
            aics5plustan._props.ReloadMagType = "ExternalMagazine";
            aics5plustan._props.VisibleAmmoRangesString = "1-3";
            aics5plustan._props.MalfunctionChance = 0.15;
            aics5plustan._props.magAnimationIndex = 5;
            aics5plustan._props.Prefab.path = "mags/aics5plustan.bundle";
            aics5plustan._props.Cartridges[0]._parent = aics5plustanid;
            aics5plustan._props.Cartridges[0]._max_count = 10;
            aics5plustan._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics10plusblkid = "67932708c270d2b12d05035d";
            const aics10plusblk = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics10plusblk._id = aics10plusblkid;
            items[aics10plusblkid] = aics10plusblk;
            aics10plusblk._parent = "5448bc234bdc2d3c308b4569";
            aics10plusblk._props.ExaminedByDefault = true;
            aics10plusblk._props.Ergonomics = 1;
            aics10plusblk._props.Width = 1;
            aics10plusblk._props.Height = 1;
            aics10plusblk._props.Weight = 0.1;
            aics10plusblk._props.CheckOverride = 0;
            aics10plusblk._props.ReloadMagType = "ExternalMagazine";
            aics10plusblk._props.VisibleAmmoRangesString = "1-3";
            aics10plusblk._props.MalfunctionChance = 0.15;
            aics10plusblk._props.magAnimationIndex = 5;
            aics10plusblk._props.Prefab.path = "mags/aics10plusblk.bundle";
            aics10plusblk._props.Cartridges[0]._parent = aics10plusblkid;
            aics10plusblk._props.Cartridges[0]._max_count = 15;
            aics10plusblk._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics10plusgrnid = "67932708c270d2b12d05035e";
            const aics10plusgrn = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics10plusgrn._id = aics10plusgrnid;
            items[aics10plusgrnid] = aics10plusgrn;
            aics10plusgrn._parent = "5448bc234bdc2d3c308b4569";
            aics10plusgrn._props.ExaminedByDefault = true;
            aics10plusgrn._props.Ergonomics = 1;
            aics10plusgrn._props.Width = 1;
            aics10plusgrn._props.Height = 1;
            aics10plusgrn._props.Weight = 0.1;
            aics10plusgrn._props.CheckOverride = 0;
            aics10plusgrn._props.ReloadMagType = "ExternalMagazine";
            aics10plusgrn._props.VisibleAmmoRangesString = "1-3";
            aics10plusgrn._props.MalfunctionChance = 0.15;
            aics10plusgrn._props.magAnimationIndex = 5;
            aics10plusgrn._props.Prefab.path = "mags/aics10plusgrn.bundle";
            aics10plusgrn._props.Cartridges[0]._parent = aics10plusgrnid;
            aics10plusgrn._props.Cartridges[0]._max_count = 15;
            aics10plusgrn._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics10plusredid = "67932708c270d2b12d05035f";
            const aics10plusred = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics10plusred._id = aics10plusredid;
            items[aics10plusredid] = aics10plusred;
            aics10plusred._parent = "5448bc234bdc2d3c308b4569";
            aics10plusred._props.ExaminedByDefault = true;
            aics10plusred._props.Ergonomics = 2;
            aics10plusred._props.Recoil = -5;
            aics10plusred._props.Width = 1;
            aics10plusred._props.Height = 1;
            aics10plusred._props.Weight = 0.1;
            aics10plusred._props.CheckOverride = 0;
            aics10plusred._props.ReloadMagType = "ExternalMagazine";
            aics10plusred._props.VisibleAmmoRangesString = "1-3";
            aics10plusred._props.MalfunctionChance = 0.15;
            aics10plusred._props.magAnimationIndex = 5;
            aics10plusred._props.Prefab.path = "mags/aics10plusred.bundle";
            aics10plusred._props.Cartridges[0]._parent = aics10plusredid;
            aics10plusred._props.Cartridges[0]._max_count = 15;
            aics10plusred._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const aics10plustanid = "67932708c270d2b12d050360";
            const aics10plustan = jsonUtil.clone(items["5ce69cbad7f00c00b61c5098"]);
            aics10plustan._id = aics10plustanid;
            items[aics10plustanid] = aics10plustan;
            aics10plustan._parent = "5448bc234bdc2d3c308b4569";
            aics10plustan._props.ExaminedByDefault = true;
            aics10plustan._props.Ergonomics = 1;
            aics10plustan._props.Width = 1;
            aics10plustan._props.Height = 1;
            aics10plustan._props.Weight = 0.1;
            aics10plustan._props.CheckOverride = 0;
            aics10plustan._props.ReloadMagType = "ExternalMagazine";
            aics10plustan._props.VisibleAmmoRangesString = "1-3";
            aics10plustan._props.MalfunctionChance = 0.15;
            aics10plustan._props.magAnimationIndex = 5;
            aics10plustan._props.Prefab.path = "mags/aics10plustan.bundle";
            aics10plustan._props.Cartridges[0]._parent = aics10plustanid;
            aics10plustan._props.Cartridges[0]._max_count = 15;
            aics10plustan._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const sr25plusblkid = "67932708c270d2b12d050361";
            const sr25plusblk = jsonUtil.clone(items["5df8f541c41b2312ea3335e3"]);
            sr25plusblk._id = sr25plusblkid;
            items[sr25plusblkid] = sr25plusblk;
            sr25plusblk._parent = "5448bc234bdc2d3c308b4569";
            sr25plusblk._props.ExaminedByDefault = true;
            sr25plusblk._props.Ergonomics = 1;
            sr25plusblk._props.Width = 1;
            sr25plusblk._props.Height = 2;
            sr25plusblk._props.Weight = 0.53;
            sr25plusblk._props.CheckOverride = 0;
            sr25plusblk._props.ReloadMagType = "ExternalMagazine";
            sr25plusblk._props.VisibleAmmoRangesString = "1-3";
            sr25plusblk._props.MalfunctionChance = 0.15;
            sr25plusblk._props.magAnimationIndex = 2;
            sr25plusblk._props.Prefab.path = "mags/sr25plusblk.bundle";
            sr25plusblk._props.Cartridges[0]._parent = sr25plusblkid;
            sr25plusblk._props.Cartridges[0]._max_count = 25;
            sr25plusblk._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const sr25plusgrnid = "67932708c270d2b12d050362";
            const sr25plusgrn = jsonUtil.clone(items["5df8f541c41b2312ea3335e3"]);
            sr25plusgrn._id = sr25plusgrnid;
            items[sr25plusgrnid] = sr25plusgrn;
            sr25plusgrn._parent = "5448bc234bdc2d3c308b4569";
            sr25plusgrn._props.ExaminedByDefault = true;
            sr25plusgrn._props.Ergonomics = 1;
            sr25plusgrn._props.Width = 1;
            sr25plusgrn._props.Height = 2;
            sr25plusgrn._props.Weight = 0.53;
            sr25plusgrn._props.CheckOverride = 0;
            sr25plusgrn._props.ReloadMagType = "ExternalMagazine";
            sr25plusgrn._props.VisibleAmmoRangesString = "1-3";
            sr25plusgrn._props.MalfunctionChance = 0.15;
            sr25plusgrn._props.magAnimationIndex = 2;
            sr25plusgrn._props.Prefab.path = "mags/sr25plusgrn.bundle";
            sr25plusgrn._props.Cartridges[0]._parent = sr25plusgrnid;
            sr25plusgrn._props.Cartridges[0]._max_count = 25;
            sr25plusgrn._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const sr25plusredid = "67932708c270d2b12d050363";
            const sr25plusred = jsonUtil.clone(items["5df8f541c41b2312ea3335e3"]);
            sr25plusred._id = sr25plusredid;
            items[sr25plusredid] = sr25plusred;
            sr25plusred._parent = "5448bc234bdc2d3c308b4569";
            sr25plusred._props.ExaminedByDefault = true;
            sr25plusred._props.Ergonomics = 6;
            sr25plusred._props.Recoil = -5;
            sr25plusred._props.Width = 1;
            sr25plusred._props.Height = 2;
            sr25plusred._props.Weight = 0.53;
            sr25plusred._props.CheckOverride = 0;
            sr25plusred._props.ReloadMagType = "ExternalMagazine";
            sr25plusred._props.VisibleAmmoRangesString = "1-3";
            sr25plusred._props.MalfunctionChance = 0.15;
            sr25plusred._props.magAnimationIndex = 2;
            sr25plusred._props.Prefab.path = "mags/sr25plusred.bundle";
            sr25plusred._props.Cartridges[0]._parent = sr25plusredid;
            sr25plusred._props.Cartridges[0]._max_count = 25;
            sr25plusred._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const sr25plustanid = "67932708c270d2b12d050364";
            const sr25plustan = jsonUtil.clone(items["5df8f541c41b2312ea3335e3"]);
            sr25plustan._id = sr25plustanid;
            items[sr25plustanid] = sr25plustan;
            sr25plustan._parent = "5448bc234bdc2d3c308b4569";
            sr25plustan._props.ExaminedByDefault = true;
            sr25plustan._props.Ergonomics = 1;
            sr25plustan._props.Width = 1;
            sr25plustan._props.Height = 2;
            sr25plustan._props.Weight = 0.53;
            sr25plustan._props.CheckOverride = 0;
            sr25plustan._props.ReloadMagType = "ExternalMagazine";
            sr25plustan._props.VisibleAmmoRangesString = "1-3";
            sr25plustan._props.MalfunctionChance = 0.15;
            sr25plustan._props.magAnimationIndex = 2;
            sr25plustan._props.Prefab.path = "mags/sr25plustan.bundle";
            sr25plustan._props.Cartridges[0]._parent = sr25plustanid;
            sr25plustan._props.Cartridges[0]._max_count = 25;
            sr25plustan._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const mbx140mmredid = "67932708c270d2b12d050365";
            const mbx140mmred = jsonUtil.clone(items["5a718b548dc32e000d46d262"]);
            mbx140mmred._id = mbx140mmredid;
            items[mbx140mmredid] = mbx140mmred;
            mbx140mmred._parent = "5448bc234bdc2d3c308b4569";
            mbx140mmred._props.ExaminedByDefault = true;
            mbx140mmred._props.Ergonomics = 1;
            mbx140mmred._props.Width = 1;
            mbx140mmred._props.Height = 1;
            mbx140mmred._props.Weight = 0.1;
            mbx140mmred._props.CheckOverride = 0;
            mbx140mmred._props.ReloadMagType = "ExternalMagazine";
            mbx140mmred._props.VisibleAmmoRangesString = "1-3";
            mbx140mmred._props.MalfunctionChance = 0.15;
            mbx140mmred._props.magAnimationIndex = 0;
            mbx140mmred._props.Prefab.path = "mags/mbx140mmred.bundle";
            mbx140mmred._props.Cartridges[0]._parent = mbx140mmredid;
            mbx140mmred._props.Cartridges[0]._max_count = 24;
            mbx140mmred._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const mbx170mmredid = "67932708c270d2b12d050366";
            const mbx170mmred = jsonUtil.clone(items["5a718b548dc32e000d46d262"]);
            mbx170mmred._id = mbx170mmredid;
            items[mbx170mmredid] = mbx170mmred;
            mbx170mmred._parent = "5448bc234bdc2d3c308b4569";
            mbx170mmred._props.ExaminedByDefault = true;
            mbx170mmred._props.Ergonomics = 5;
            mbx170mmred._props.Width = 1;
            mbx170mmred._props.Height = 2;
            mbx170mmred._props.Weight = 0.12;
            mbx170mmred._props.CheckOverride = 0;
            mbx170mmred._props.ReloadMagType = "ExternalMagazine";
            mbx170mmred._props.VisibleAmmoRangesString = "1-3";
            mbx170mmred._props.MalfunctionChance = 0.15;
            mbx170mmred._props.magAnimationIndex = 0;
            mbx170mmred._props.Prefab.path = "mags/mbx170mmred.bundle";
            mbx170mmred._props.Cartridges[0]._parent = mbx170mmredid;
            mbx170mmred._props.Cartridges[0]._max_count = 30;
            mbx170mmred._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const a15pmagblkid = "67932708c270d2b12d050368";
            const a15pmagblk = jsonUtil.clone(items["5aaa5e60e5b5b000140293d6"]);
            a15pmagblk._id = a15pmagblkid;
            items[a15pmagblkid] = a15pmagblk;
            a15pmagblk._parent = "5448bc234bdc2d3c308b4569";
            a15pmagblk._props.ExaminedByDefault = true;
            a15pmagblk._props.Ergonomics = 5;
            a15pmagblk._props.Width = 1;
            a15pmagblk._props.Height = 1;
            a15pmagblk._props.Weight = 0.1;
            a15pmagblk._props.CheckOverride = 0;
            a15pmagblk._props.ReloadMagType = "ExternalMagazine";
            a15pmagblk._props.VisibleAmmoRangesString = "1-3";
            a15pmagblk._props.MalfunctionChance = 0.15;
            a15pmagblk._props.magAnimationIndex = 6;
            a15pmagblk._props.Prefab.path = "mags/15pmagblk.bundle";
            a15pmagblk._props.Cartridges[0]._parent = a15pmagblkid;
            a15pmagblk._props.Cartridges[0]._max_count = 15;
            a15pmagblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a15pmagredid = "67932708c270d2b12d050369";
            const a15pmagred = jsonUtil.clone(items["5aaa5e60e5b5b000140293d6"]);
            a15pmagred._id = a15pmagredid;
            items[a15pmagredid] = a15pmagred;
            a15pmagred._parent = "5448bc234bdc2d3c308b4569";
            a15pmagred._props.ExaminedByDefault = true;
            a15pmagred._props.Ergonomics = 6;
            a15pmagred._props.Recoil = -5;
            a15pmagred._props.Width = 1;
            a15pmagred._props.Height = 1;
            a15pmagred._props.Weight = 0.1;
            a15pmagred._props.CheckOverride = 0;
            a15pmagred._props.ReloadMagType = "ExternalMagazine";
            a15pmagred._props.VisibleAmmoRangesString = "1-3";
            a15pmagred._props.MalfunctionChance = 0.15;
            a15pmagred._props.magAnimationIndex = 6;
            a15pmagred._props.Prefab.path = "mags/15pmagred.bundle";
            a15pmagred._props.Cartridges[0]._parent = a15pmagredid;
            a15pmagred._props.Cartridges[0]._max_count = 15;
            a15pmagred._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a15pmaggrnid = "67932708c270d2b12d05036a";
            const a15pmaggrn = jsonUtil.clone(items["5aaa5e60e5b5b000140293d6"]);
            a15pmaggrn._id = a15pmaggrnid;
            items[a15pmaggrnid] = a15pmaggrn;
            a15pmaggrn._parent = "5448bc234bdc2d3c308b4569";
            a15pmaggrn._props.ExaminedByDefault = true;
            a15pmaggrn._props.Ergonomics = 5;
            a15pmaggrn._props.Width = 1;
            a15pmaggrn._props.Height = 1;
            a15pmaggrn._props.Weight = 0.1;
            a15pmaggrn._props.CheckOverride = 0;
            a15pmaggrn._props.ReloadMagType = "ExternalMagazine";
            a15pmaggrn._props.VisibleAmmoRangesString = "1-3";
            a15pmaggrn._props.MalfunctionChance = 0.15;
            a15pmaggrn._props.magAnimationIndex = 6;
            a15pmaggrn._props.Prefab.path = "mags/15pmaggrn.bundle";
            a15pmaggrn._props.Cartridges[0]._parent = a15pmaggrnid;
            a15pmaggrn._props.Cartridges[0]._max_count = 15;
            a15pmaggrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a15pmagtanid = "67932708c270d2b12d05036b";
            const a15pmagtan = jsonUtil.clone(items["5aaa5e60e5b5b000140293d6"]);
            a15pmagtan._id = a15pmagtanid;
            items[a15pmagtanid] = a15pmagtan;
            a15pmagtan._parent = "5448bc234bdc2d3c308b4569";
            a15pmagtan._props.ExaminedByDefault = true;
            a15pmagtan._props.Ergonomics = 5;
            a15pmagtan._props.Width = 1;
            a15pmagtan._props.Height = 1;
            a15pmagtan._props.Weight = 0.1;
            a15pmagtan._props.CheckOverride = 0;
            a15pmagtan._props.ReloadMagType = "ExternalMagazine";
            a15pmagtan._props.VisibleAmmoRangesString = "1-3";
            a15pmagtan._props.MalfunctionChance = 0.15;
            a15pmagtan._props.magAnimationIndex = 6;
            a15pmagtan._props.Prefab.path = "mags/15pmagtan.bundle";
            a15pmagtan._props.Cartridges[0]._parent = a15pmagtanid;
            a15pmagtan._props.Cartridges[0]._max_count = 15;
            a15pmagtan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const sr25drumid = "67932708c270d2b12d05036c";
            const sr25drum = jsonUtil.clone(items["5df8f541c41b2312ea3335e3"]);
            sr25drum._id = sr25drumid;
            items[sr25drumid] = sr25drum;
            sr25drum._parent = "5448bc234bdc2d3c308b4569";
            sr25drum._props.ExaminedByDefault = true;
            sr25drum._props.Ergonomics = 3;
            sr25drum._props.Width = 1;
            sr25drum._props.Height = 2;
            sr25drum._props.Weight = 0.58;
            sr25drum._props.CheckOverride = 0;
            sr25drum._props.ReloadMagType = "ExternalMagazine";
            sr25drum._props.VisibleAmmoRangesString = "1-3";
            sr25drum._props.MalfunctionChance = 0.15;
            sr25drum._props.magAnimationIndex = 5;
            sr25drum._props.Prefab.path = "mags/sr25drum.bundle";
            sr25drum._props.Cartridges[0]._parent = sr25drumid;
            sr25drum._props.Cartridges[0]._max_count = 50;
            sr25drum._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const a25pmagblkid = "67932708c270d2b12d05036d";
            const a25pmagblk = jsonUtil.clone(items["5448c1d04bdc2dff2f8b4569"]);
            a25pmagblk._id = a25pmagblkid;
            items[a25pmagblkid] = a25pmagblk;
            a25pmagblk._parent = "5448bc234bdc2d3c308b4569";
            a25pmagblk._props.ExaminedByDefault = true;
            a25pmagblk._props.Ergonomics = 4;
            a25pmagblk._props.Width = 1;
            a25pmagblk._props.Height = 2;
            a25pmagblk._props.Weight = 0.126;
            a25pmagblk._props.CheckOverride = 0;
            a25pmagblk._props.ReloadMagType = "ExternalMagazine";
            a25pmagblk._props.VisibleAmmoRangesString = "1-3";
            a25pmagblk._props.MalfunctionChance = 0.15;
            a25pmagblk._props.magAnimationIndex = 2;
            a25pmagblk._props.Prefab.path = "mags/25pmagblk.bundle";
            a25pmagblk._props.Cartridges[0]._parent = a25pmagblkid;
            a25pmagblk._props.Cartridges[0]._max_count = 25;
            a25pmagblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a25pmaggrnid = "67932708c270d2b12d05036e";
            const a25pmaggrn = jsonUtil.clone(items["5448c1d04bdc2dff2f8b4569"]);
            a25pmaggrn._id = a25pmaggrnid;
            items[a25pmaggrnid] = a25pmaggrn;
            a25pmaggrn._parent = "5448bc234bdc2d3c308b4569";
            a25pmaggrn._props.ExaminedByDefault = true;
            a25pmaggrn._props.Ergonomics = 4;
            a25pmaggrn._props.Width = 1;
            a25pmaggrn._props.Height = 2;
            a25pmaggrn._props.Weight = 0.126;
            a25pmaggrn._props.CheckOverride = 0;
            a25pmaggrn._props.ReloadMagType = "ExternalMagazine";
            a25pmaggrn._props.VisibleAmmoRangesString = "1-3";
            a25pmaggrn._props.MalfunctionChance = 0.15;
            a25pmaggrn._props.magAnimationIndex = 2;
            a25pmaggrn._props.Prefab.path = "mags/25pmaggrn.bundle";
            a25pmaggrn._props.Cartridges[0]._parent = a25pmaggrnid;
            a25pmaggrn._props.Cartridges[0]._max_count = 25;
            a25pmaggrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a25pmagredid = "67932708c270d2b12d05036f";
            const a25pmagred = jsonUtil.clone(items["5448c1d04bdc2dff2f8b4569"]);
            a25pmagred._id = a25pmagredid;
            items[a25pmagredid] = a25pmagred;
            a25pmagred._parent = "5448bc234bdc2d3c308b4569";
            a25pmagred._props.ExaminedByDefault = true;
            a25pmagred._props.Ergonomics = 5;
            a25pmagred._props.Recoil = -5;
            a25pmagred._props.Width = 1;
            a25pmagred._props.Height = 2;
            a25pmagred._props.Weight = 0.126;
            a25pmagred._props.CheckOverride = 0;
            a25pmagred._props.ReloadMagType = "ExternalMagazine";
            a25pmagred._props.VisibleAmmoRangesString = "1-3";
            a25pmagred._props.MalfunctionChance = 0.15;
            a25pmagred._props.magAnimationIndex = 2;
            a25pmagred._props.Prefab.path = "mags/25pmagred.bundle";
            a25pmagred._props.Cartridges[0]._parent = a25pmagredid;
            a25pmagred._props.Cartridges[0]._max_count = 25;
            a25pmagred._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a25pmagtanid = "67932708c270d2b12d050370";
            const a25pmagtan = jsonUtil.clone(items["5448c1d04bdc2dff2f8b4569"]);
            a25pmagtan._id = a25pmagtanid;
            items[a25pmagtanid] = a25pmagtan;
            a25pmagtan._parent = "5448bc234bdc2d3c308b4569";
            a25pmagtan._props.ExaminedByDefault = true;
            a25pmagtan._props.Ergonomics = 4;
            a25pmagtan._props.Width = 1;
            a25pmagtan._props.Height = 2;
            a25pmagtan._props.Weight = 0.126;
            a25pmagtan._props.CheckOverride = 0;
            a25pmagtan._props.ReloadMagType = "ExternalMagazine";
            a25pmagtan._props.VisibleAmmoRangesString = "1-3";
            a25pmagtan._props.MalfunctionChance = 0.15;
            a25pmagtan._props.magAnimationIndex = 2;
            a25pmagtan._props.Prefab.path = "mags/25pmagtan.bundle";
            a25pmagtan._props.Cartridges[0]._parent = a25pmagtanid;
            a25pmagtan._props.Cartridges[0]._max_count = 25;
            a25pmagtan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a35pmagblkid = "67932708c270d2b12d050371";
            const a35pmagblk = jsonUtil.clone(items["5aaa5dfee5b5b000140293d3"]);
            a35pmagblk._id = a35pmagblkid;
            items[a35pmagblkid] = a35pmagblk;
            a35pmagblk._parent = "5448bc234bdc2d3c308b4569";
            a35pmagblk._props.ExaminedByDefault = true;
            a35pmagblk._props.Ergonomics = 3;
            a35pmagblk._props.Width = 1;
            a35pmagblk._props.Height = 2;
            a35pmagblk._props.Weight = 0.139;
            a35pmagblk._props.CheckOverride = 0;
            a35pmagblk._props.ReloadMagType = "ExternalMagazine";
            a35pmagblk._props.VisibleAmmoRangesString = "1-3";
            a35pmagblk._props.MalfunctionChance = 0.15;
            a35pmagblk._props.magAnimationIndex = 0;
            a35pmagblk._props.Prefab.path = "mags/35pmagblk.bundle";
            a35pmagblk._props.Cartridges[0]._parent = a35pmagblkid;
            a35pmagblk._props.Cartridges[0]._max_count = 35;
            a35pmagblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a35pmaggrnid = "67932708c270d2b12d050372";
            const a35pmaggrn = jsonUtil.clone(items["5aaa5dfee5b5b000140293d3"]);
            a35pmaggrn._id = a35pmaggrnid;
            items[a35pmaggrnid] = a35pmaggrn;
            a35pmaggrn._parent = "5448bc234bdc2d3c308b4569";
            a35pmaggrn._props.ExaminedByDefault = true;
            a35pmaggrn._props.Ergonomics = 3;
            a35pmaggrn._props.Width = 1;
            a35pmaggrn._props.Height = 2;
            a35pmaggrn._props.Weight = 0.139;
            a35pmaggrn._props.CheckOverride = 0;
            a35pmaggrn._props.ReloadMagType = "ExternalMagazine";
            a35pmaggrn._props.VisibleAmmoRangesString = "1-3";
            a35pmaggrn._props.MalfunctionChance = 0.15;
            a35pmaggrn._props.magAnimationIndex = 0;
            a35pmaggrn._props.Prefab.path = "mags/35pmaggrn.bundle";
            a35pmaggrn._props.Cartridges[0]._parent = a35pmaggrnid;
            a35pmaggrn._props.Cartridges[0]._max_count = 35;
            a35pmaggrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a35pmagredid = "67932708c270d2b12d050373";
            const a35pmagred = jsonUtil.clone(items["5aaa5dfee5b5b000140293d3"]);
            a35pmagred._id = a35pmagredid;
            items[a35pmagredid] = a35pmagred;
            a35pmagred._parent = "5448bc234bdc2d3c308b4569";
            a35pmagred._props.ExaminedByDefault = true;
            a35pmagred._props.Ergonomics = 4;
            a35pmagred._props.Recoil = -5;
            a35pmagred._props.Width = 1;
            a35pmagred._props.Height = 2;
            a35pmagred._props.Weight = 0.139;
            a35pmagred._props.CheckOverride = 0;
            a35pmagred._props.ReloadMagType = "ExternalMagazine";
            a35pmagred._props.VisibleAmmoRangesString = "1-3";
            a35pmagred._props.MalfunctionChance = 0.15;
            a35pmagred._props.magAnimationIndex = 0;
            a35pmagred._props.Prefab.path = "mags/35pmagred.bundle";
            a35pmagred._props.Cartridges[0]._parent = a35pmagredid;
            a35pmagred._props.Cartridges[0]._max_count = 35;
            a35pmagred._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a35pmagtanid = "67932708c270d2b12d050374";
            const a35pmagtan = jsonUtil.clone(items["5aaa5dfee5b5b000140293d3"]);
            a35pmagtan._id = a35pmagtanid;
            items[a35pmagtanid] = a35pmagtan;
            a35pmagtan._parent = "5448bc234bdc2d3c308b4569";
            a35pmagtan._props.ExaminedByDefault = true;
            a35pmagtan._props.Ergonomics = 3;
            a35pmagtan._props.Width = 1;
            a35pmagtan._props.Height = 2;
            a35pmagtan._props.Weight = 0.139;
            a35pmagtan._props.CheckOverride = 0;
            a35pmagtan._props.ReloadMagType = "ExternalMagazine";
            a35pmagtan._props.VisibleAmmoRangesString = "1-3";
            a35pmagtan._props.MalfunctionChance = 0.15;
            a35pmagtan._props.magAnimationIndex = 0;
            a35pmagtan._props.Prefab.path = "mags/35pmagtan.bundle";
            a35pmagtan._props.Cartridges[0]._parent = a35pmagtanid;
            a35pmagtan._props.Cartridges[0]._max_count = 35;
            a35pmagtan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a45pmagblkid = "67932708c270d2b12d050375";
            const a45pmagblk = jsonUtil.clone(items["544a378f4bdc2d30388b4567"]);
            a45pmagblk._id = a45pmagblkid;
            items[a45pmagblkid] = a45pmagblk;
            a45pmagblk._parent = "5448bc234bdc2d3c308b4569";
            a45pmagblk._props.ExaminedByDefault = true;
            a45pmagblk._props.Ergonomics = 3;
            a45pmagblk._props.Width = 1;
            a45pmagblk._props.Height = 3;
            a45pmagblk._props.Weight = 0.21;
            a45pmagblk._props.CheckOverride = 0;
            a45pmagblk._props.ReloadMagType = "ExternalMagazine";
            a45pmagblk._props.VisibleAmmoRangesString = "1-3";
            a45pmagblk._props.MalfunctionChance = 0.15;
            a45pmagblk._props.magAnimationIndex = 3;
            a45pmagblk._props.Prefab.path = "mags/45pmagblk.bundle";
            a45pmagblk._props.Cartridges[0]._parent = a45pmagblkid;
            a45pmagblk._props.Cartridges[0]._max_count = 45;
            a45pmagblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a45pmaggrnid = "67932708c270d2b12d050376";
            const a45pmaggrn = jsonUtil.clone(items["544a378f4bdc2d30388b4567"]);
            a45pmaggrn._id = a45pmaggrnid;
            items[a45pmaggrnid] = a45pmaggrn;
            a45pmaggrn._parent = "5448bc234bdc2d3c308b4569";
            a45pmaggrn._props.ExaminedByDefault = true;
            a45pmaggrn._props.Ergonomics = 3;
            a45pmaggrn._props.Width = 1;
            a45pmaggrn._props.Height = 3;
            a45pmaggrn._props.Weight = 0.21;
            a45pmaggrn._props.CheckOverride = 0;
            a45pmaggrn._props.ReloadMagType = "ExternalMagazine";
            a45pmaggrn._props.VisibleAmmoRangesString = "1-3";
            a45pmaggrn._props.MalfunctionChance = 0.15;
            a45pmaggrn._props.magAnimationIndex = 3;
            a45pmaggrn._props.Prefab.path = "mags/45pmaggrn.bundle";
            a45pmaggrn._props.Cartridges[0]._parent = a45pmaggrnid;
            a45pmaggrn._props.Cartridges[0]._max_count = 45;
            a45pmaggrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a45pmagredid = "67932708c270d2b12d050377";
            const a45pmagred = jsonUtil.clone(items["544a378f4bdc2d30388b4567"]);
            a45pmagred._id = a45pmagredid;
            items[a45pmagredid] = a45pmagred;
            a45pmagred._parent = "5448bc234bdc2d3c308b4569";
            a45pmagred._props.ExaminedByDefault = true;
            a45pmagred._props.Ergonomics = 4;
            a45pmagred._props.Recoil = -5;
            a45pmagred._props.Width = 1;
            a45pmagred._props.Height = 3;
            a45pmagred._props.Weight = 0.21;
            a45pmagred._props.CheckOverride = 0;
            a45pmagred._props.ReloadMagType = "ExternalMagazine";
            a45pmagred._props.VisibleAmmoRangesString = "1-3";
            a45pmagred._props.MalfunctionChance = 0.15;
            a45pmagred._props.magAnimationIndex = 3;
            a45pmagred._props.Prefab.path = "mags/45pmagred.bundle";
            a45pmagred._props.Cartridges[0]._parent = a45pmagredid;
            a45pmagred._props.Cartridges[0]._max_count = 45;
            a45pmagred._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a45pmagtanid = "67932708c270d2b12d050378";
            const a45pmagtan = jsonUtil.clone(items["544a378f4bdc2d30388b4567"]);
            a45pmagtan._id = a45pmagtanid;
            items[a45pmagtanid] = a45pmagtan;
            a45pmagtan._parent = "5448bc234bdc2d3c308b4569";
            a45pmagtan._props.ExaminedByDefault = true;
            a45pmagtan._props.Ergonomics = 4;
            a45pmagtan._props.Width = 1;
            a45pmagtan._props.Height = 3;
            a45pmagtan._props.Weight = 0.21;
            a45pmagtan._props.CheckOverride = 0;
            a45pmagtan._props.ReloadMagType = "ExternalMagazine";
            a45pmagtan._props.VisibleAmmoRangesString = "1-3";
            a45pmagtan._props.MalfunctionChance = 0.15;
            a45pmagtan._props.magAnimationIndex = 3;
            a45pmagtan._props.Prefab.path = "mags/45pmagtan.bundle";
            a45pmagtan._props.Cartridges[0]._parent = a45pmagtanid;
            a45pmagtan._props.Cartridges[0]._max_count = 45;
            a45pmagtan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const a25ak7blkid = "67932708c270d2b12d050379";
            const a25ak7blk = jsonUtil.clone(items["64b9cf0ac12b9c38db26923a"]);
            a25ak7blk._id = a25ak7blkid;
            items[a25ak7blkid] = a25ak7blk;
            a25ak7blk._parent = "5448bc234bdc2d3c308b4569";
            a25ak7blk._props.ExaminedByDefault = true;
            a25ak7blk._props.Ergonomics = 4;
            a25ak7blk._props.Width = 1;
            a25ak7blk._props.Height = 2;
            a25ak7blk._props.Weight = 0.145;
            a25ak7blk._props.CheckOverride = 0;
            a25ak7blk._props.ReloadMagType = "ExternalMagazine";
            a25ak7blk._props.VisibleAmmoRangesString = "1-3";
            a25ak7blk._props.MalfunctionChance = 0.15;
            a25ak7blk._props.magAnimationIndex = 0;
            a25ak7blk._props.Prefab.path = "mags/25ak7blk.bundle";
            a25ak7blk._props.Cartridges[0]._parent = a25ak7blkid;
            a25ak7blk._props.Cartridges[0]._max_count = 25;
            a25ak7blk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a25ak7grnid = "67932708c270d2b12d05037a";
            const a25ak7grn = jsonUtil.clone(items["64b9cf0ac12b9c38db26923a"]);
            a25ak7grn._id = a25ak7grnid;
            items[a25ak7grnid] = a25ak7grn;
            a25ak7grn._parent = "5448bc234bdc2d3c308b4569";
            a25ak7grn._props.ExaminedByDefault = true;
            a25ak7grn._props.Ergonomics = 4;
            a25ak7grn._props.Width = 1;
            a25ak7grn._props.Height = 2;
            a25ak7grn._props.Weight = 0.145;
            a25ak7grn._props.CheckOverride = 0;
            a25ak7grn._props.ReloadMagType = "ExternalMagazine";
            a25ak7grn._props.VisibleAmmoRangesString = "1-3";
            a25ak7grn._props.MalfunctionChance = 0.15;
            a25ak7grn._props.magAnimationIndex = 0;
            a25ak7grn._props.Prefab.path = "mags/25ak7grn.bundle";
            a25ak7grn._props.Cartridges[0]._parent = a25ak7grnid;
            a25ak7grn._props.Cartridges[0]._max_count = 25;
            a25ak7grn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a25ak7redid = "67932708c270d2b12d05037b";
            const a25ak7red = jsonUtil.clone(items["64b9cf0ac12b9c38db26923a"]);
            a25ak7red._id = a25ak7redid;
            items[a25ak7redid] = a25ak7red;
            a25ak7red._parent = "5448bc234bdc2d3c308b4569";
            a25ak7red._props.ExaminedByDefault = true;
            a25ak7red._props.Ergonomics = 4;
            a25ak7red._props.Width = 1;
            a25ak7red._props.Height = 2;
            a25ak7red._props.Weight = 0.145;
            a25ak7red._props.CheckOverride = 0;
            a25ak7red._props.ReloadMagType = "ExternalMagazine";
            a25ak7red._props.VisibleAmmoRangesString = "1-3";
            a25ak7red._props.MalfunctionChance = 0.15;
            a25ak7red._props.magAnimationIndex = 0;
            a25ak7red._props.Prefab.path = "mags/25ak7red.bundle";
            a25ak7red._props.Cartridges[0]._parent = a25ak7redid;
            a25ak7red._props.Cartridges[0]._max_count = 25;
            a25ak7red._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a25ak7tanid = "67932708c270d2b12d05037c";
            const a25ak7tan = jsonUtil.clone(items["64b9cf0ac12b9c38db26923a"]);
            a25ak7tan._id = a25ak7tanid;
            items[a25ak7tanid] = a25ak7tan;
            a25ak7tan._parent = "5448bc234bdc2d3c308b4569";
            a25ak7tan._props.ExaminedByDefault = true;
            a25ak7tan._props.Ergonomics = 4;
            a25ak7tan._props.Width = 1;
            a25ak7tan._props.Height = 2;
            a25ak7tan._props.Weight = 0.145;
            a25ak7tan._props.CheckOverride = 0;
            a25ak7tan._props.ReloadMagType = "ExternalMagazine";
            a25ak7tan._props.VisibleAmmoRangesString = "1-3";
            a25ak7tan._props.MalfunctionChance = 0.15;
            a25ak7tan._props.magAnimationIndex = 0;
            a25ak7tan._props.Prefab.path = "mags/25ak7tan.bundle";
            a25ak7tan._props.Cartridges[0]._parent = a25ak7tanid;
            a25ak7tan._props.Cartridges[0]._max_count = 25;
            a25ak7tan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7blkblkid = "67932708c270d2b12d05037d";
            const a35ak7blkblk = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7blkblk._id = a35ak7blkblkid;
            items[a35ak7blkblkid] = a35ak7blkblk;
            a35ak7blkblk._parent = "5448bc234bdc2d3c308b4569";
            a35ak7blkblk._props.ExaminedByDefault = true;
            a35ak7blkblk._props.Ergonomics = 3;
            a35ak7blkblk._props.Width = 1;
            a35ak7blkblk._props.Height = 2;
            a35ak7blkblk._props.Weight = 0.21;
            a35ak7blkblk._props.CheckOverride = 0;
            a35ak7blkblk._props.ReloadMagType = "ExternalMagazine";
            a35ak7blkblk._props.VisibleAmmoRangesString = "1-3";
            a35ak7blkblk._props.MalfunctionChance = 0.15;
            a35ak7blkblk._props.magAnimationIndex = 0;
            a35ak7blkblk._props.Prefab.path = "mags/35ak7blkblk.bundle";
            a35ak7blkblk._props.Cartridges[0]._parent = a35ak7blkblkid;
            a35ak7blkblk._props.Cartridges[0]._max_count = 35;
            a35ak7blkblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7blkgrnid = "67932708c270d2b12d05037e";
            const a35ak7blkgrn = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7blkgrn._id = a35ak7blkgrnid;
            items[a35ak7blkgrnid] = a35ak7blkgrn;
            a35ak7blkgrn._parent = "5448bc234bdc2d3c308b4569";
            a35ak7blkgrn._props.ExaminedByDefault = true;
            a35ak7blkgrn._props.Ergonomics = 3;
            a35ak7blkgrn._props.Width = 1;
            a35ak7blkgrn._props.Height = 2;
            a35ak7blkgrn._props.Weight = 0.21;
            a35ak7blkgrn._props.CheckOverride = 0;
            a35ak7blkgrn._props.ReloadMagType = "ExternalMagazine";
            a35ak7blkgrn._props.VisibleAmmoRangesString = "1-3";
            a35ak7blkgrn._props.MalfunctionChance = 0.15;
            a35ak7blkgrn._props.magAnimationIndex = 0;
            a35ak7blkgrn._props.Prefab.path = "mags/35ak7blkgrn.bundle";
            a35ak7blkgrn._props.Cartridges[0]._parent = a35ak7blkgrnid;
            a35ak7blkgrn._props.Cartridges[0]._max_count = 35;
            a35ak7blkgrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7blkredid = "67932708c270d2b12d05037f";
            const a35ak7blkred = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7blkred._id = a35ak7blkredid;
            items[a35ak7blkredid] = a35ak7blkred;
            a35ak7blkred._parent = "5448bc234bdc2d3c308b4569";
            a35ak7blkred._props.ExaminedByDefault = true;
            a35ak7blkred._props.Ergonomics = 4;
            a35ak7blkred._props.Recoil = -5;
            a35ak7blkred._props.Width = 1;
            a35ak7blkred._props.Height = 2;
            a35ak7blkred._props.Weight = 0.21;
            a35ak7blkred._props.CheckOverride = 0;
            a35ak7blkred._props.ReloadMagType = "ExternalMagazine";
            a35ak7blkred._props.VisibleAmmoRangesString = "1-3";
            a35ak7blkred._props.MalfunctionChance = 0.15;
            a35ak7blkred._props.magAnimationIndex = 0;
            a35ak7blkred._props.Prefab.path = "mags/35ak7blkred.bundle";
            a35ak7blkred._props.Cartridges[0]._parent = a35ak7blkredid;
            a35ak7blkred._props.Cartridges[0]._max_count = 35;
            a35ak7blkred._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7blktanid = "67932708c270d2b12d050380";
            const a35ak7blktan = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7blktan._id = a35ak7blktanid;
            items[a35ak7blktanid] = a35ak7blktan;
            a35ak7blktan._parent = "5448bc234bdc2d3c308b4569";
            a35ak7blktan._props.ExaminedByDefault = true;
            a35ak7blktan._props.Ergonomics = 3;
            a35ak7blktan._props.Width = 1;
            a35ak7blktan._props.Height = 2;
            a35ak7blktan._props.Weight = 0.21;
            a35ak7blktan._props.CheckOverride = 0;
            a35ak7blktan._props.ReloadMagType = "ExternalMagazine";
            a35ak7blktan._props.VisibleAmmoRangesString = "1-3";
            a35ak7blktan._props.MalfunctionChance = 0.15;
            a35ak7blktan._props.magAnimationIndex = 0;
            a35ak7blktan._props.Prefab.path = "mags/35ak7blktan.bundle";
            a35ak7blktan._props.Cartridges[0]._parent = a35ak7blktanid;
            a35ak7blktan._props.Cartridges[0]._max_count = 35;
            a35ak7blktan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7fdeblkid = "67932708c270d2b12d050381";
            const a35ak7fdeblk = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7fdeblk._id = a35ak7fdeblkid;
            items[a35ak7fdeblkid] = a35ak7fdeblk;
            a35ak7fdeblk._parent = "5448bc234bdc2d3c308b4569";
            a35ak7fdeblk._props.ExaminedByDefault = true;
            a35ak7fdeblk._props.Ergonomics = 3;
            a35ak7fdeblk._props.Width = 1;
            a35ak7fdeblk._props.Height = 2;
            a35ak7fdeblk._props.Weight = 0.21;
            a35ak7fdeblk._props.CheckOverride = 0;
            a35ak7fdeblk._props.ReloadMagType = "ExternalMagazine";
            a35ak7fdeblk._props.VisibleAmmoRangesString = "1-3";
            a35ak7fdeblk._props.MalfunctionChance = 0.15;
            a35ak7fdeblk._props.magAnimationIndex = 0;
            a35ak7fdeblk._props.Prefab.path = "mags/35ak7fdeblk.bundle";
            a35ak7fdeblk._props.Cartridges[0]._parent = a35ak7fdeblkid;
            a35ak7fdeblk._props.Cartridges[0]._max_count = 35;
            a35ak7fdeblk._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7fdegrnid = "67932708c270d2b12d050382";
            const a35ak7fdegrn = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7fdegrn._id = a35ak7fdegrnid;
            items[a35ak7fdegrnid] = a35ak7fdegrn;
            a35ak7fdegrn._parent = "5448bc234bdc2d3c308b4569";
            a35ak7fdegrn._props.ExaminedByDefault = true;
            a35ak7fdegrn._props.Ergonomics = 3;
            a35ak7fdegrn._props.Width = 1;
            a35ak7fdegrn._props.Height = 2;
            a35ak7fdegrn._props.Weight = 0.21;
            a35ak7fdegrn._props.CheckOverride = 0;
            a35ak7fdegrn._props.ReloadMagType = "ExternalMagazine";
            a35ak7fdegrn._props.VisibleAmmoRangesString = "1-3";
            a35ak7fdegrn._props.MalfunctionChance = 0.15;
            a35ak7fdegrn._props.magAnimationIndex = 0;
            a35ak7fdegrn._props.Prefab.path = "mags/35ak7fdegrn.bundle";
            a35ak7fdegrn._props.Cartridges[0]._parent = a35ak7fdegrnid;
            a35ak7fdegrn._props.Cartridges[0]._max_count = 35;
            a35ak7fdegrn._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7fderedid = "67932708c270d2b12d050383";
            const a35ak7fdered = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7fdered._id = a35ak7fderedid;
            items[a35ak7fderedid] = a35ak7fdered;
            a35ak7fdered._parent = "5448bc234bdc2d3c308b4569";
            a35ak7fdered._props.ExaminedByDefault = true;
            a35ak7fdered._props.Ergonomics = 4;
            a35ak7fdered._props.Recoil = -5;
            a35ak7fdered._props.Width = 1;
            a35ak7fdered._props.Height = 2;
            a35ak7fdered._props.Weight = 0.21;
            a35ak7fdered._props.CheckOverride = 0;
            a35ak7fdered._props.ReloadMagType = "ExternalMagazine";
            a35ak7fdered._props.VisibleAmmoRangesString = "1-3";
            a35ak7fdered._props.MalfunctionChance = 0.15;
            a35ak7fdered._props.magAnimationIndex = 0;
            a35ak7fdered._props.Prefab.path = "mags/35ak7fdered.bundle";
            a35ak7fdered._props.Cartridges[0]._parent = a35ak7fderedid;
            a35ak7fdered._props.Cartridges[0]._max_count = 35;
            a35ak7fdered._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const a35ak7fdetanid = "67932708c270d2b12d050384";
            const a35ak7fdetan = jsonUtil.clone(items["59d6272486f77466146386ff"]);
            a35ak7fdetan._id = a35ak7fdetanid;
            items[a35ak7fdetanid] = a35ak7fdetan;
            a35ak7fdetan._parent = "5448bc234bdc2d3c308b4569";
            a35ak7fdetan._props.ExaminedByDefault = true;
            a35ak7fdetan._props.Ergonomics = 3;
            a35ak7fdetan._props.Width = 1;
            a35ak7fdetan._props.Height = 2;
            a35ak7fdetan._props.Weight = 0.21;
            a35ak7fdetan._props.CheckOverride = 0;
            a35ak7fdetan._props.ReloadMagType = "ExternalMagazine";
            a35ak7fdetan._props.VisibleAmmoRangesString = "1-3";
            a35ak7fdetan._props.MalfunctionChance = 0.15;
            a35ak7fdetan._props.magAnimationIndex = 0;
            a35ak7fdetan._props.Prefab.path = "mags/35ak7fdetan.bundle";
            a35ak7fdetan._props.Cartridges[0]._parent = a35ak7fdetanid;
            a35ak7fdetan._props.Cartridges[0]._max_count = 35;
            a35ak7fdetan._props.Cartridges[0]._props.filters[0].Filter = [
                "59e655cb86f77411dc52a77b",
                "59e6542b86f77411dc52a77a",
                "59e6658b86f77411d949b250",
                "5f0596629e22f464da6bbdd9",
                "59e0d99486f7744a32234762",
                "59e4d3d286f774176a36250a",
                "5656d7c34bdc2d9d198b4587",
                "59e4cf5286f7741778269d8a",
                "59e4d24686f7741776641ac7",
                "601aa3d2b2bcb34913271e6d",
                "64b7af434b75259c590fa893",
                "64b7af734b75259c590fa895",
                "64b7af5a8532cf95ee0a0dbd"
            ];
            const mbx63blkid = "67932708c270d2b12d050385";
            const mbx63blk = jsonUtil.clone(items["5a7ad2e851dfba0016153692"]);
            mbx63blk._id = mbx63blkid;
            items[mbx63blkid] = mbx63blk;
            mbx63blk._parent = "5448bc234bdc2d3c308b4569";
            mbx63blk._props.ExaminedByDefault = true;
            mbx63blk._props.Ergonomics = 3;
            mbx63blk._props.Width = 1;
            mbx63blk._props.Height = 2;
            mbx63blk._props.Weight = 0.25;
            mbx63blk._props.CheckOverride = 0;
            mbx63blk._props.ReloadMagType = "ExternalMagazine";
            mbx63blk._props.VisibleAmmoRangesString = "1-3";
            mbx63blk._props.MalfunctionChance = 0.15;
            mbx63blk._props.magAnimationIndex = 2;
            mbx63blk._props.Prefab.path = "mags/63blk.bundle";
            mbx63blk._props.Cartridges[0]._parent = mbx63blkid;
            mbx63blk._props.Cartridges[0]._max_count = 63;
            mbx63blk._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const mbx63grnid = "67932708c270d2b12d050386";
            const mbx63grn = jsonUtil.clone(items["5a7ad2e851dfba0016153692"]);
            mbx63grn._id = mbx63grnid;
            items[mbx63grnid] = mbx63grn;
            mbx63grn._parent = "5448bc234bdc2d3c308b4569";
            mbx63grn._props.ExaminedByDefault = true;
            mbx63grn._props.Ergonomics = 3;
            mbx63grn._props.Width = 1;
            mbx63grn._props.Height = 2;
            mbx63grn._props.Weight = 0.25;
            mbx63grn._props.CheckOverride = 0;
            mbx63grn._props.ReloadMagType = "ExternalMagazine";
            mbx63grn._props.VisibleAmmoRangesString = "1-3";
            mbx63grn._props.MalfunctionChance = 0.15;
            mbx63grn._props.magAnimationIndex = 2;
            mbx63grn._props.Prefab.path = "mags/63grn.bundle";
            mbx63grn._props.Cartridges[0]._parent = mbx63grnid;
            mbx63grn._props.Cartridges[0]._max_count = 63;
            mbx63grn._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const mbx63redid = "67932708c270d2b12d050387";
            const mbx63red = jsonUtil.clone(items["5a7ad2e851dfba0016153692"]);
            mbx63red._id = mbx63redid;
            items[mbx63redid] = mbx63red;
            mbx63red._parent = "5448bc234bdc2d3c308b4569";
            mbx63red._props.ExaminedByDefault = true;
            mbx63red._props.Ergonomics = 4;
            mbx63red._props.Recoil = -5;
            mbx63red._props.Width = 1;
            mbx63red._props.Height = 2;
            mbx63red._props.Weight = 0.25;
            mbx63red._props.CheckOverride = 0;
            mbx63red._props.ReloadMagType = "ExternalMagazine";
            mbx63red._props.VisibleAmmoRangesString = "1-3";
            mbx63red._props.MalfunctionChance = 0.15;
            mbx63red._props.magAnimationIndex = 2;
            mbx63red._props.Prefab.path = "mags/63red.bundle";
            mbx63red._props.Cartridges[0]._parent = mbx63redid;
            mbx63red._props.Cartridges[0]._max_count = 63;
            mbx63red._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const mbx63tanid = "67932708c270d2b12d050388";
            const mbx63tan = jsonUtil.clone(items["5a7ad2e851dfba0016153692"]);
            mbx63tan._id = mbx63tanid;
            items[mbx63tanid] = mbx63tan;
            mbx63tan._parent = "5448bc234bdc2d3c308b4569";
            mbx63tan._props.ExaminedByDefault = true;
            mbx63tan._props.Ergonomics = 3;
            mbx63tan._props.Width = 1;
            mbx63tan._props.Height = 2;
            mbx63tan._props.Weight = 0.25;
            mbx63tan._props.CheckOverride = 0;
            mbx63tan._props.ReloadMagType = "ExternalMagazine";
            mbx63tan._props.VisibleAmmoRangesString = "1-3";
            mbx63tan._props.MalfunctionChance = 0.15;
            mbx63tan._props.magAnimationIndex = 2;
            mbx63tan._props.Prefab.path = "mags/63tan.bundle";
            mbx63tan._props.Cartridges[0]._parent = mbx63tanid;
            mbx63tan._props.Cartridges[0]._max_count = 63;
            mbx63tan._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const saigabuddyid = "67932708c270d2b12d050389";
            const saigabuddy = jsonUtil.clone(items["5a966f51a2750c00156aacf6"]);
            saigabuddy._id = saigabuddyid;
            items[saigabuddyid] = saigabuddy;
            saigabuddy._parent = "5448bc234bdc2d3c308b4569";
            saigabuddy._props.ExaminedByDefault = true;
            saigabuddy._props.Ergonomics = 3;
            saigabuddy._props.Width = 1;
            saigabuddy._props.Height = 3;
            saigabuddy._props.Weight = 0.25;
            saigabuddy._props.CheckOverride = 0;
            saigabuddy._props.ReloadMagType = "ExternalMagazine";
            saigabuddy._props.VisibleAmmoRangesString = "1-3";
            saigabuddy._props.MalfunctionChance = 0.15;
            saigabuddy._props.magAnimationIndex = 1;
            saigabuddy._props.Prefab.path = "mags/saigabuddy.bundle";
            saigabuddy._props.Cartridges[0]._parent = saigabuddyid;
            saigabuddy._props.Cartridges[0]._max_count = 20;
            saigabuddy._props.Cartridges[0]._props.filters[0].Filter = [
                "560d5e524bdc2d25448b4571",
                "5d6e6772a4b936088465b17c",
                "5d6e67fba4b9361bc73bc779",
                "5d6e6806a4b936088465b17e",
                "5d6e68dea4b9361bcc29e659",
                "5d6e6911a4b9361bd5780d52",
                "5c0d591486f7744c505b416f",
                "58820d1224597753c90aeb13",
                "5d6e68c4a4b9361b93413f79",
                "5d6e68a8a4b9360b6c0d54e2",
                "5d6e68e6a4b9361c140bcfe0",
                "5d6e6869a4b9361c140bcfde",
                "5d6e68b3a4b9361bca7e50b5",
                "5d6e6891a4b9361bd473feea",
                "5d6e689ca4b9361bc8618956",
                "5d6e68d1a4b93622fe60e845",
                "64b8ee384b75259c590fa89b"
            ];
            const mag9a9130id = "67932708c270d2b12d05038a";
            const mag9a9130 = jsonUtil.clone(items["6450ec2e7da7133e5a09ca96"]);
            mag9a9130._id = mag9a9130id;
            items[mag9a9130id] = mag9a9130;
            mag9a9130._parent = "5448bc234bdc2d3c308b4569";
            mag9a9130._props.ExaminedByDefault = true;
            mag9a9130._props.Ergonomics = 3;
            mag9a9130._props.Width = 1;
            mag9a9130._props.Height = 2;
            mag9a9130._props.Weight = 0.32;
            mag9a9130._props.CheckOverride = 0;
            mag9a9130._props.ReloadMagType = "ExternalMagazine";
            mag9a9130._props.VisibleAmmoRangesString = "1-3";
            mag9a9130._props.magAnimationIndex = 1;
            mag9a9130._props.Prefab.path = "mags/9a9130.bundle";
            mag9a9130._props.Cartridges[0]._parent = mag9a9130id;
            mag9a9130._props.Cartridges[0]._max_count = 30;
            mag9a9130._props.Cartridges[0]._props.filters[0].Filter = [
                "5c0d688c86f77413ae3407b2",
                "61962d879bb3d20b0946d385",
                "57a0dfb82459774d3078b56c",
                "57a0e5022459774d1673f889",
                "5c0d668f86f7747ccb7f13b2",
                "6576f96220d53a5b8f3e395e"
            ];
            const aps35magid = "67932708c270d2b12d05038b";
            const aps35mag = jsonUtil.clone(items["5a17fb03fcdbcbcae668728f"]);
            aps35mag._id = aps35magid;
            items[aps35magid] = aps35mag;
            aps35mag._parent = "5448bc234bdc2d3c308b4569";
            aps35mag._props.ExaminedByDefault = true;
            aps35mag._props.Ergonomics = 3;
            aps35mag._props.Width = 1;
            aps35mag._props.Height = 2;
            aps35mag._props.Weight = 0.049;
            aps35mag._props.CheckOverride = 0;
            aps35mag._props.ReloadMagType = "ExternalMagazine";
            aps35mag._props.MalfunctionChance = 0.15;
            aps35mag._props.magAnimationIndex = 0;
            aps35mag._props.Prefab.path = "mags/aps35.bundle";
            aps35mag._props.Cartridges[0]._parent = aps35magid;
            aps35mag._props.Cartridges[0]._max_count = 35;
            aps35mag._props.Cartridges[0]._props.filters[0].Filter = [
                "573718ba2459775a75491131",
                "573719df2459775a626ccbc2",
                "57371aab2459775a77142f22",
                "57371b192459775a9f58a5e0",
                "57371e4124597760ff7b25f1",
                "57371eb62459776125652ac1",
                "57371f8d24597761006c6a81",
                "5737201124597760fc4431f1",
                "5737207f24597760ff7b25f2",
                "57371f2b24597761224311f1",
                "573719762459775a626ccbc1",
                "573720e02459776143012541",
                "57372140245977611f70ee91",
                "5737218f245977612125ba51"
            ];
            const aps50magid = "67932708c270d2b12d05038c";
            const aps50mag = jsonUtil.clone(items["5a17fb03fcdbcbcae668728f"]);
            aps50mag._id = aps50magid;
            items[aps50magid] = aps50mag;
            aps50mag._parent = "5448bc234bdc2d3c308b4569";
            aps50mag._props.ExaminedByDefault = true;
            aps50mag._props.Ergonomics = 3;
            aps50mag._props.Width = 1;
            aps50mag._props.Height = 2;
            aps50mag._props.Weight = 0.051;
            aps50mag._props.CheckOverride = 0;
            aps50mag._props.ReloadMagType = "ExternalMagazine";
            aps50mag._props.MalfunctionChance = 0.15;
            aps50mag._props.magAnimationIndex = 0;
            aps50mag._props.Prefab.path = "mags/aps50.bundle";
            aps50mag._props.Cartridges[0]._parent = aps50magid;
            aps50mag._props.Cartridges[0]._max_count = 50;
            aps50mag._props.Cartridges[0]._props.filters[0].Filter = [
                "573718ba2459775a75491131",
                "573719df2459775a626ccbc2",
                "57371aab2459775a77142f22",
                "57371b192459775a9f58a5e0",
                "57371e4124597760ff7b25f1",
                "57371eb62459776125652ac1",
                "57371f8d24597761006c6a81",
                "5737201124597760fc4431f1",
                "5737207f24597760ff7b25f2",
                "57371f2b24597761224311f1",
                "573719762459775a626ccbc1",
                "573720e02459776143012541",
                "57372140245977611f70ee91",
                "5737218f245977612125ba51"
            ];
            const ash25id = "67932708c270d2b12d05038d";
            const ash25 = jsonUtil.clone(items["5caf1109ae9215753c44119f"]);
            ash25._id = ash25id;
            items[ash25id] = ash25;
            ash25._parent = "5448bc234bdc2d3c308b4569";
            ash25._props.ExaminedByDefault = true;
            ash25._props.Ergonomics = 2;
            ash25._props.Width = 1;
            ash25._props.Height = 2;
            ash25._props.Weight = 0.051;
            ash25._props.CheckOverride = 0;
            ash25._props.ReloadMagType = "ExternalMagazine";
            ash25._props.MalfunctionChance = 0.15;
            ash25._props.magAnimationIndex = 0;
            ash25._props.Prefab.path = "mags/ash25.bundle";
            ash25._props.Cartridges[0]._parent = ash25id;
            ash25._props.Cartridges[0]._max_count = 25;
            ash25._props.Cartridges[0]._props.filters[0].Filter = [
                "5cadf6ddae9215051e1c23b2",
                "5cadf6e5ae921500113bb973",
                "5cadf6eeae921500134b2799"
            ];
            const dvl15id = "67932708c270d2b12d05038e";
            const dvl15 = jsonUtil.clone(items["5888988e24597752fe43a6fa"]);
            dvl15._id = dvl15id;
            items[dvl15id] = dvl15;
            dvl15._parent = "5448bc234bdc2d3c308b4569";
            dvl15._props.ExaminedByDefault = true;
            dvl15._props.Ergonomics = 3;
            dvl15._props.Width = 1;
            dvl15._props.Height = 2;
            dvl15._props.Weight = 0.6;
            dvl15._props.CheckOverride = 0;
            dvl15._props.ReloadMagType = "ExternalMagazine";
            dvl15._props.MalfunctionChance = 0.15;
            dvl15._props.magAnimationIndex = 0;
            dvl15._props.Prefab.path = "mags/dvl15.bundle";
            dvl15._props.Cartridges[0]._parent = dvl15id;
            dvl15._props.Cartridges[0]._max_count = 15;
            dvl15._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const dvl20id = "67932708c270d2b12d05038f";
            const dvl20 = jsonUtil.clone(items["5888988e24597752fe43a6fa"]);
            dvl20._id = dvl20id;
            items[dvl20id] = dvl20;
            dvl20._parent = "5448bc234bdc2d3c308b4569";
            dvl20._props.ExaminedByDefault = true;
            dvl20._props.Ergonomics = 3;
            dvl20._props.Width = 1;
            dvl20._props.Height = 2;
            dvl20._props.Weight = 0.65;
            dvl20._props.CheckOverride = 0;
            dvl20._props.ReloadMagType = "ExternalMagazine";
            dvl20._props.MalfunctionChance = 0.15;
            dvl20._props.magAnimationIndex = 0;
            dvl20._props.Prefab.path = "mags/dvl20.bundle";
            dvl20._props.Cartridges[0]._parent = dvl20id;
            dvl20._props.Cartridges[0]._max_count = 20;
            dvl20._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const m9a3plusid = "67932708c270d2b12d050390";
            const m9a3plus = jsonUtil.clone(items["5cadc2e0ae9215051e1c21e7"]);
            m9a3plus._id = m9a3plusid;
            items[m9a3plusid] = m9a3plus;
            m9a3plus._parent = "5448bc234bdc2d3c308b4569";
            m9a3plus._props.ExaminedByDefault = true;
            m9a3plus._props.Ergonomics = 3;
            m9a3plus._props.Width = 1;
            m9a3plus._props.Height = 1;
            m9a3plus._props.Weight = 0.089;
            m9a3plus._props.CheckOverride = 0;
            m9a3plus._props.ReloadMagType = "ExternalMagazine";
            m9a3plus._props.MalfunctionChance = 0.15;
            m9a3plus._props.magAnimationIndex = 0;
            m9a3plus._props.Prefab.path = "mags/m9a3plus.bundle";
            m9a3plus._props.Cartridges[0]._parent = m9a3plusid;
            m9a3plus._props.Cartridges[0]._max_count = 23;
            m9a3plus._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const orsis10id = "67932708c270d2b12d050391";
            const orsis10 = jsonUtil.clone(items["5df25b6c0b92095fd441e4cf"]);
            orsis10._id = orsis10id;
            items[orsis10id] = orsis10;
            orsis10._parent = "5448bc234bdc2d3c308b4569";
            orsis10._props.ExaminedByDefault = true;
            orsis10._props.Ergonomics = 1;
            orsis10._props.Width = 1;
            orsis10._props.Height = 1;
            orsis10._props.Weight = 0.39;
            orsis10._props.CheckOverride = 0;
            orsis10._props.ReloadMagType = "ExternalMagazine";
            orsis10._props.MalfunctionChance = 0.15;
            orsis10._props.magAnimationIndex = 0;
            orsis10._props.Prefab.path = "mags/orsis10.bundle";
            orsis10._props.Cartridges[0]._parent = orsis10id;
            orsis10._props.Cartridges[0]._max_count = 10;
            orsis10._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1"
            ];
            const pp1940id = "67932708c270d2b12d050392";
            const pp1940 = jsonUtil.clone(items["599860ac86f77436b225ed1a"]);
            pp1940._id = pp1940id;
            items[pp1940id] = pp1940;
            pp1940._parent = "5448bc234bdc2d3c308b4569";
            pp1940._props.ExaminedByDefault = true;
            pp1940._props.Ergonomics = 4;
            pp1940._props.Width = 1;
            pp1940._props.Height = 2;
            pp1940._props.Weight = 0.18;
            pp1940._props.CheckOverride = 0;
            pp1940._props.ReloadMagType = "ExternalMagazine";
            pp1940._props.MalfunctionChance = 0.15;
            pp1940._props.magAnimationIndex = 0;
            pp1940._props.Prefab.path = "mags/pp1940.bundle";
            pp1940._props.Cartridges[0]._parent = pp1940id;
            pp1940._props.Cartridges[0]._max_count = 40;
            pp1940._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const pp1940redid = "67932708c270d2b12d050393";
            const pp1940red = jsonUtil.clone(items["599860ac86f77436b225ed1a"]);
            pp1940red._id = pp1940redid;
            items[pp1940redid] = pp1940red;
            pp1940red._parent = "5448bc234bdc2d3c308b4569";
            pp1940red._props.ExaminedByDefault = true;
            pp1940red._props.Ergonomics = 8;
            pp1940red._props.Width = 1;
            pp1940red._props.Height = 2;
            pp1940red._props.Weight = 0.18;
            pp1940red._props.CheckOverride = 0;
            pp1940red._props.ReloadMagType = "ExternalMagazine";
            pp1940red._props.MalfunctionChance = 0.15;
            pp1940red._props.magAnimationIndex = 0;
            pp1940red._props.Prefab.path = "mags/pp1940red.bundle";
            pp1940red._props.Cartridges[0]._parent = pp1940redid;
            pp1940red._props.Cartridges[0]._max_count = 40;
            pp1940red._props.Cartridges[0]._props.filters[0].Filter = [
                "5efb0da7a29a85116f6ea05f",
                "5c3df7d588a4501f290594e5",
                "58864a4f2459770fcc257101",
                "56d59d3ad2720bdb418b4577",
                "5c925fa22e221601da359b7b",
                "5a3c16fe86f77452b62de32a",
                "5efb0e16aeb21837e749c7ff",
                "5c0d56a986f774449d5de529",
                "64b7bbb74b75259c590fa897"
            ];
            const pp9140id = "67932708c270d2b12d050394";
            const pp9140 = jsonUtil.clone(items["57d1519e24597714373db79d"]);
            pp9140._id = pp9140id;
            items[pp9140id] = pp9140;
            pp9140._parent = "5448bc234bdc2d3c308b4569";
            pp9140._props.ExaminedByDefault = true;
            pp9140._props.Ergonomics = 4;
            pp9140._props.Width = 1;
            pp9140._props.Height = 2;
            pp9140._props.Weight = 0.13;
            pp9140._props.CheckOverride = 0;
            pp9140._props.ReloadMagType = "ExternalMagazine";
            pp9140._props.MalfunctionChance = 0.15;
            pp9140._props.magAnimationIndex = 0;
            pp9140._props.Prefab.path = "mags/pp9140.bundle";
            pp9140._props.Cartridges[0]._parent = pp9140id;
            pp9140._props.Cartridges[0]._max_count = 40;
            pp9140._props.Cartridges[0]._props.filters[0].Filter = [
                "573718ba2459775a75491131",
                "573719df2459775a626ccbc2",
                "57371aab2459775a77142f22",
                "57371b192459775a9f58a5e0",
                "57371e4124597760ff7b25f1",
                "57371eb62459776125652ac1",
                "57371f8d24597761006c6a81",
                "5737201124597760fc4431f1",
                "5737207f24597760ff7b25f2",
                "57371f2b24597761224311f1",
                "573719762459775a626ccbc1",
                "573720e02459776143012541",
                "57372140245977611f70ee91",
                "5737218f245977612125ba51"
            ];
            const pp9160id = "67932708c270d2b12d050395";
            const pp9160 = jsonUtil.clone(items["57d1519e24597714373db79d"]);
            pp9160._id = pp9160id;
            items[pp9160id] = pp9160;
            pp9160._parent = "5448bc234bdc2d3c308b4569";
            pp9160._props.ExaminedByDefault = true;
            pp9160._props.Ergonomics = 3;
            pp9160._props.Width = 1;
            pp9160._props.Height = 2;
            pp9160._props.Weight = 0.19;
            pp9160._props.CheckOverride = 0;
            pp9160._props.ReloadMagType = "ExternalMagazine";
            pp9160._props.MalfunctionChance = 0.15;
            pp9160._props.magAnimationIndex = 0;
            pp9160._props.Prefab.path = "mags/pp9160.bundle";
            pp9160._props.Cartridges[0]._parent = pp9160id;
            pp9160._props.Cartridges[0]._max_count = 60;
            pp9160._props.Cartridges[0]._props.filters[0].Filter = [
                "573718ba2459775a75491131",
                "573719df2459775a626ccbc2",
                "57371aab2459775a77142f22",
                "57371b192459775a9f58a5e0",
                "57371e4124597760ff7b25f1",
                "57371eb62459776125652ac1",
                "57371f8d24597761006c6a81",
                "5737201124597760fc4431f1",
                "5737207f24597760ff7b25f2",
                "57371f2b24597761224311f1",
                "573719762459775a626ccbc1",
                "573720e02459776143012541",
                "57372140245977611f70ee91",
                "5737218f245977612125ba51"
            ];
            const sr3m35id = "67932708c270d2b12d050396";
            const sr3m35 = jsonUtil.clone(items["5a9e81fba2750c00164f6b11"]);
            sr3m35._id = sr3m35id;
            items[sr3m35id] = sr3m35;
            sr3m35._parent = "5448bc234bdc2d3c308b4569";
            sr3m35._props.ExaminedByDefault = true;
            sr3m35._props.Ergonomics = 3;
            sr3m35._props.Width = 1;
            sr3m35._props.Height = 2;
            sr3m35._props.Weight = 0.48;
            sr3m35._props.CheckOverride = 0;
            sr3m35._props.ReloadMagType = "ExternalMagazine";
            sr3m35._props.MalfunctionChance = 0.15;
            sr3m35._props.magAnimationIndex = 1;
            sr3m35._props.Prefab.path = "mags/sr3m35.bundle";
            sr3m35._props.Cartridges[0]._parent = sr3m35id;
            sr3m35._props.Cartridges[0]._max_count = 35;
            sr3m35._props.Cartridges[0]._props.filters[0].Filter = [
                "5c0d688c86f77413ae3407b2",
                "61962d879bb3d20b0946d385",
                "57a0dfb82459774d3078b56c",
                "57a0e5022459774d1673f889",
                "5c0d668f86f7747ccb7f13b2",
                "6576f96220d53a5b8f3e395e"
            ];
            const sr3m40id = "67932708c270d2b12d050397";
            const sr3m40 = jsonUtil.clone(items["5a9e81fba2750c00164f6b11"]);
            sr3m40._id = sr3m40id;
            items[sr3m40id] = sr3m40;
            sr3m40._parent = "5448bc234bdc2d3c308b4569";
            sr3m40._props.ExaminedByDefault = true;
            sr3m40._props.Ergonomics = 2;
            sr3m40._props.Width = 1;
            sr3m40._props.Height = 2;
            sr3m40._props.Weight = 0.5;
            sr3m40._props.CheckOverride = 0;
            sr3m40._props.ReloadMagType = "ExternalMagazine";
            sr3m40._props.MalfunctionChance = 0.15;
            sr3m40._props.magAnimationIndex = 1;
            sr3m40._props.Prefab.path = "mags/sr3m40.bundle";
            sr3m40._props.Cartridges[0]._parent = sr3m40id;
            sr3m40._props.Cartridges[0]._max_count = 40;
            sr3m40._props.Cartridges[0]._props.filters[0].Filter = [
                "5c0d688c86f77413ae3407b2",
                "61962d879bb3d20b0946d385",
                "57a0dfb82459774d3078b56c",
                "57a0e5022459774d1673f889",
                "5c0d668f86f7747ccb7f13b2",
                "6576f96220d53a5b8f3e395e"
            ];
            const sr3m45id = "67932708c270d2b12d050398";
            const sr3m45 = jsonUtil.clone(items["5a9e81fba2750c00164f6b11"]);
            sr3m45._id = sr3m45id;
            items[sr3m45id] = sr3m45;
            sr3m45._parent = "5448bc234bdc2d3c308b4569";
            sr3m45._props.ExaminedByDefault = true;
            sr3m45._props.Ergonomics = 2;
            sr3m45._props.Width = 1;
            sr3m45._props.Height = 2;
            sr3m45._props.Weight = 0.55;
            sr3m45._props.CheckOverride = 0;
            sr3m45._props.ReloadMagType = "ExternalMagazine";
            sr3m45._props.MalfunctionChance = 0.15;
            sr3m45._props.magAnimationIndex = 1;
            sr3m45._props.Prefab.path = "mags/sr3m45.bundle";
            sr3m45._props.Cartridges[0]._parent = sr3m45id;
            sr3m45._props.Cartridges[0]._max_count = 45;
            sr3m45._props.Cartridges[0]._props.filters[0].Filter = [
                "5c0d688c86f77413ae3407b2",
                "61962d879bb3d20b0946d385",
                "57a0dfb82459774d3078b56c",
                "57a0e5022459774d1673f889",
                "5c0d668f86f7747ccb7f13b2",
                "6576f96220d53a5b8f3e395e"
            ];
            const toz10id = "67932708c270d2b12d050399";
            const toz10 = jsonUtil.clone(items["5c6161fb2e221600113fbde5"]);
            toz10._id = toz10id;
            items[toz10id] = toz10;
            toz10._parent = "5448bc234bdc2d3c308b4569";
            toz10._props.ExaminedByDefault = true;
            toz10._props.Ergonomics = 1;
            toz10._props.Width = 1;
            toz10._props.Height = 2;
            toz10._props.Weight = 0.21;
            toz10._props.CheckOverride = 0;
            toz10._props.ReloadMagType = "ExternalMagazine";
            toz10._props.MalfunctionChance = 0.15;
            toz10._props.magAnimationIndex = 2;
            toz10._props.Prefab.path = "mags/toz10.bundle";
            toz10._props.Cartridges[0]._parent = toz10id;
            toz10._props.Cartridges[0]._max_count = 10;
            toz10._props.Cartridges[0]._props.filters[0].Filter = [
                "5a38ebd9c4a282000d722a5b",
                "5d6e695fa4b936359b35d852",
                "5d6e69b9a4b9361bc8618958",
                "5d6e69c7a4b9360b6c0d54e4",
                "5d6e6a5fa4b93614ec501745",
                "5d6e6a53a4b9361bd473feec",
                "5d6e6a42a4b9364f07165f52",
                "5d6e6a05a4b93618084f58d0"
            ];
            const arsenal35id = "679edba49f79e7dd6e00abcd";
            const arsenal35 = jsonUtil.clone(items["5c0548ae0db834001966a3c2"]);
            arsenal35._id = arsenal35id;
            items[arsenal35id] = arsenal35;
            arsenal35._parent = "5448bc234bdc2d3c308b4569";
            arsenal35._props.ExaminedByDefault = true;
            arsenal35._props.Ergonomics = 3;
            arsenal35._props.Width = 1;
            arsenal35._props.Height = 2;
            arsenal35._props.Weight = 0.47;
            arsenal35._props.CheckOverride = 0;
            arsenal35._props.ReloadMagType = "ExternalMagazine";
            arsenal35._props.VisibleAmmoRangesString = "1-3";
            arsenal35._props.MalfunctionChance = 0.15;
            arsenal35._props.magAnimationIndex = 0;
            arsenal35._props.Prefab.path = "mags/arsenal35.bundle";
            arsenal35._props.Cartridges[0]._parent = "35ARSENAL";
            arsenal35._props.Cartridges[0]._max_count = 35;
            arsenal35._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const arsenal40id = "679edba49f79e7dd6e00abce";
            const arsenal40 = jsonUtil.clone(items["5c0548ae0db834001966a3c2"]);
            arsenal40._id = arsenal40id;
            items[arsenal40id] = arsenal40;
            arsenal40._parent = "5448bc234bdc2d3c308b4569";
            arsenal40._props.ExaminedByDefault = true;
            arsenal40._props.Ergonomics = 3;
            arsenal40._props.Width = 1;
            arsenal40._props.Height = 2;
            arsenal40._props.Weight = 0.5;
            arsenal40._props.CheckOverride = 0;
            arsenal40._props.ReloadMagType = "ExternalMagazine";
            arsenal40._props.VisibleAmmoRangesString = "1-3";
            arsenal40._props.MalfunctionChance = 0.15;
            arsenal40._props.magAnimationIndex = 0;
            arsenal40._props.Prefab.path = "mags/arsenal40.bundle";
            arsenal40._props.Cartridges[0]._parent = "35ARSENAL";
            arsenal40._props.Cartridges[0]._max_count = 40;
            arsenal40._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const arsenal45id = "679edba49f79e7dd6e00abcf";
            const arsenal45 = jsonUtil.clone(items["5c0548ae0db834001966a3c2"]);
            arsenal45._id = arsenal45id;
            items[arsenal45id] = arsenal45;
            arsenal45._parent = "5448bc234bdc2d3c308b4569";
            arsenal45._props.ExaminedByDefault = true;
            arsenal45._props.Ergonomics = 3;
            arsenal45._props.Width = 1;
            arsenal45._props.Height = 2;
            arsenal45._props.Weight = 0.53;
            arsenal45._props.CheckOverride = 0;
            arsenal45._props.ReloadMagType = "ExternalMagazine";
            arsenal45._props.VisibleAmmoRangesString = "1-3";
            arsenal45._props.MalfunctionChance = 0.15;
            arsenal45._props.magAnimationIndex = 0;
            arsenal45._props.Prefab.path = "mags/arsenal45.bundle";
            arsenal45._props.Cartridges[0]._parent = "45ARSENAL";
            arsenal45._props.Cartridges[0]._max_count = 45;
            arsenal45._props.Cartridges[0]._props.filters[0].Filter = [
                "59e6920f86f77411d82aa167",
                "59e6927d86f77411da468256",
                "54527a984bdc2d4e668b4567",
                "54527ac44bdc2d36668b4567",
                "59e68f6f86f7746c9f75e846",
                "59e6906286f7746c9f75e847",
                "59e690b686f7746c9f75e848",
                "59e6918f86f7746c9f75e849",
                "60194943740c5d77f6705eea",
                "601949593ae8f707c4608daa",
                "5c0d5ae286f7741e46554302",
                "5fbe3ffdf8b6a877a729ea82",
                "5fd20ff893a8961fc660a954",
                "619636be6db0f2477964e710",
                "6196364158ef8c428c287d9f",
                "6196365d58ef8c428c287da1",
                "64b8725c4b75259c590fa899"
            ];
            const fn57extendedblkid = "679edba49f79e7dd6e00abd0";
            const fn57extendedblk = jsonUtil.clone(items["5d3eb5eca4b9363b1f22f8e4"]);
            fn57extendedblk._id = fn57extendedblkid;
            items[fn57extendedblkid] = fn57extendedblk;
            fn57extendedblk._parent = "5448bc234bdc2d3c308b4569";
            fn57extendedblk._props.ExaminedByDefault = true;
            fn57extendedblk._props.Ergonomics = 3;
            fn57extendedblk._props.Width = 1;
            fn57extendedblk._props.Height = 1;
            fn57extendedblk._props.Weight = 0.09;
            fn57extendedblk._props.CheckOverride = 0;
            fn57extendedblk._props.ReloadMagType = "ExternalMagazine";
            fn57extendedblk._props.VisibleAmmoRangesString = "1-3";
            fn57extendedblk._props.MalfunctionChance = 0.15;
            fn57extendedblk._props.magAnimationIndex = 0;
            fn57extendedblk._props.Prefab.path = "mags/57extendedblk.bundle";
            fn57extendedblk._props.Cartridges[0]._parent = "FN57BLACKEXTENDED";
            fn57extendedblk._props.Cartridges[0]._max_count = 30;
            fn57extendedblk._props.Cartridges[0]._props.filters[0].Filter = [
                "5cc80f53e4a949000e1ea4f8",
                "5cc86832d7f00c000d3a6e6c",
                "5cc86840d7f00c002412c56c",
                "5cc80f67e4a949035e43bbba",
                "5cc80f38e4a949001152b560",
                "5cc80f8fe4a949033b0224a2",
                "5cc80f79e4a949033c7343b2"
            ];
            const fn57extendedfdeid = "679edba49f79e7dd6e00abd1";
            const fn57extendedfde = jsonUtil.clone(items["5d3eb5eca4b9363b1f22f8e4"]);
            fn57extendedfde._id = fn57extendedfdeid;
            items[fn57extendedfdeid] = fn57extendedfde;
            fn57extendedfde._parent = "5448bc234bdc2d3c308b4569";
            fn57extendedfde._props.ExaminedByDefault = true;
            fn57extendedfde._props.Ergonomics = 3;
            fn57extendedfde._props.Width = 1;
            fn57extendedfde._props.Height = 1;
            fn57extendedfde._props.Weight = 0.09;
            fn57extendedfde._props.CheckOverride = 0;
            fn57extendedfde._props.ReloadMagType = "ExternalMagazine";
            fn57extendedfde._props.VisibleAmmoRangesString = "1-3";
            fn57extendedfde._props.MalfunctionChance = 0.15;
            fn57extendedfde._props.magAnimationIndex = 0;
            fn57extendedfde._props.Prefab.path = "mags/57extendedfde.bundle";
            fn57extendedfde._props.Cartridges[0]._parent = "FN57BLACKEXTENDED";
            fn57extendedfde._props.Cartridges[0]._max_count = 30;
            fn57extendedfde._props.Cartridges[0]._props.filters[0].Filter = [
                "5cc80f53e4a949000e1ea4f8",
                "5cc86832d7f00c000d3a6e6c",
                "5cc86840d7f00c002412c56c",
                "5cc80f67e4a949035e43bbba",
                "5cc80f38e4a949001152b560",
                "5cc80f8fe4a949033b0224a2",
                "5cc80f79e4a949033c7343b2"
            ];
            const falscarid = "679edba49f79e7dd6e00abd2";
            const falscar = jsonUtil.clone(items["618168dc8004cc50514c34fc"]);
            falscar._id = falscarid;
            items[falscarid] = falscar;
            falscar._parent = "5448bc234bdc2d3c308b4569";
            falscar._props.ExaminedByDefault = true;
            falscar._props.Ergonomics = 1;
            falscar._props.Width = 1;
            falscar._props.Height = 2;
            falscar._props.Weight = 0.53;
            falscar._props.CheckOverride = 0;
            falscar._props.ReloadMagType = "ExternalMagazine";
            falscar._props.VisibleAmmoRangesString = "1-3";
            falscar._props.MalfunctionChance = 0.15;
            falscar._props.magAnimationIndex = 2;
            falscar._props.Prefab.path = "mags/falscar.bundle";
            falscar._props.Cartridges[0]._parent = "SCARFAL";
            falscar._props.Cartridges[0]._max_count = 30;
            falscar._props.Cartridges[0]._props.filters[0].Filter = [
                "5a6086ea4f39f99cd479502f",
                "5a608bf24f39f98ffc77720e",
                "58dd3ad986f77403051cba8f",
                "5e023e53d4353e3302577c4c",
                "5efb0c1bd79ff02a1f5e68d9",
                "5e023e6e34d52a55c3304f71",
                "5e023e88277cce2b522ff2b1",
                "6529243824cbe3c74a05e5c1",
                "6529302b8c26af6326029fb7"
            ];
            const magCompatMap = [
                ["67932708c270d2b12d050355", "544a37c44bdc2d25388b4567"], // CHOPPED60
                ["67932708c270d2b12d050356", "5d2f213448f0355009199284"], // mp540
                ["67932708c270d2b12d050357", "5e81c4ca763d9f754677befa"], // extended1911
                ["67932708c270d2b12d050358", "5f647d9f8499b57dc40ddb93"], // ks23stendo
                ["67932708c270d2b12d050359", "5ce69cbad7f00c00b61c5098"], // aics5plusblk
                ["67932708c270d2b12d05035a", "5ce69cbad7f00c00b61c5098"], // aics5plusgrn
                ["67932708c270d2b12d05035b", "5ce69cbad7f00c00b61c5098"], // aics5plusred
                ["67932708c270d2b12d05035c", "5ce69cbad7f00c00b61c5098"], // aics5plustan
                ["67932708c270d2b12d05035d", "5ce69cbad7f00c00b61c5098"], // aics10plusblk
                ["67932708c270d2b12d05035e", "5ce69cbad7f00c00b61c5098"], // aics10plusgrn
                ["67932708c270d2b12d05035f", "5ce69cbad7f00c00b61c5098"], // aics10plusred
                ["67932708c270d2b12d050360", "5ce69cbad7f00c00b61c5098"], // aics10plustan
                ["67932708c270d2b12d050361", "5df8f541c41b2312ea3335e3"], // sr25plusblk
                ["67932708c270d2b12d050362", "5df8f541c41b2312ea3335e3"], // sr25plusgrn
                ["67932708c270d2b12d050363", "5df8f541c41b2312ea3335e3"], // sr25plusred
                ["67932708c270d2b12d050364", "5df8f541c41b2312ea3335e3"], // sr25plustan
                ["67932708c270d2b12d050365", "5a718b548dc32e000d46d262"], // mbx140mmred
                ["67932708c270d2b12d050366", "5a718b548dc32e000d46d262"], // mbx170mmred
                ["67932708c270d2b12d050368", "5aaa5e60e5b5b000140293d6"], // 15pmag blk
                ["67932708c270d2b12d050369", "5aaa5e60e5b5b000140293d6"], // 15pmag red
                ["67932708c270d2b12d05036a", "5aaa5e60e5b5b000140293d6"], // 15pmag grn
                ["67932708c270d2b12d05036b", "5aaa5e60e5b5b000140293d6"], // 15pmag tan
                ["67932708c270d2b12d05036c", "5df8f541c41b2312ea3335e3"], // sr25 drum
                ["67932708c270d2b12d05036d", "5448c1d04bdc2dff2f8b4569"], // 25pmag blk
                ["67932708c270d2b12d05036e", "5448c1d04bdc2dff2f8b4569"], // 25pmag grn
                ["67932708c270d2b12d05036f", "5448c1d04bdc2dff2f8b4569"], // 25pmag red
                ["67932708c270d2b12d050370", "5448c1d04bdc2dff2f8b4569"], // 25pmag tan
                ["67932708c270d2b12d050371", "5aaa5dfee5b5b000140293d3"], // 35pmag blk
                ["67932708c270d2b12d050372", "5aaa5dfee5b5b000140293d3"], // 35pmag grn
                ["67932708c270d2b12d050373", "5aaa5dfee5b5b000140293d3"], // 35pmag red
                ["67932708c270d2b12d050374", "5aaa5dfee5b5b000140293d3"], // 35pmag tan
                ["67932708c270d2b12d050375", "544a378f4bdc2d30388b4567"], // 45pmag blk
                ["67932708c270d2b12d050376", "544a378f4bdc2d30388b4567"], // 45pmag grn
                ["67932708c270d2b12d050377", "544a378f4bdc2d30388b4567"], // 45pmag red
                ["67932708c270d2b12d050378", "544a378f4bdc2d30388b4567"], // 45pmag tan
                ["67932708c270d2b12d050379", "64b9cf0ac12b9c38db26923a"], // 25ak7 blk
                ["67932708c270d2b12d05037a", "64b9cf0ac12b9c38db26923a"], // 25ak7 grn
                ["67932708c270d2b12d05037b", "64b9cf0ac12b9c38db26923a"], // 25ak7 red
                ["67932708c270d2b12d05037c", "64b9cf0ac12b9c38db26923a"], // 25ak7 tan
                ["67932708c270d2b12d05037d", "59d6272486f77466146386ff"], // 35ak7 blk/blk
                ["67932708c270d2b12d05037e", "59d6272486f77466146386ff"], // 35ak7 blk/grn
                ["67932708c270d2b12d05037f", "59d6272486f77466146386ff"], // 35ak7 blk/red
                ["67932708c270d2b12d050380", "59d6272486f77466146386ff"], // 35ak7 blk/tan
                ["67932708c270d2b12d050381", "59d6272486f77466146386ff"], // 35ak7 fde/blk
                ["67932708c270d2b12d050382", "59d6272486f77466146386ff"], // 35ak7 fde/grn
                ["67932708c270d2b12d050383", "59d6272486f77466146386ff"], // 35ak7 fde/red
                ["67932708c270d2b12d050384", "59d6272486f77466146386ff"], // 35ak7 fde/tan
                ["67932708c270d2b12d050385", "5a7ad2e851dfba0016153692"], // 63 blk
                ["67932708c270d2b12d050386", "5a7ad2e851dfba0016153692"], // 63 grn
                ["67932708c270d2b12d050387", "5a7ad2e851dfba0016153692"], // 63 red
                ["67932708c270d2b12d050388", "5a7ad2e851dfba0016153692"], // 63 tan
                ["67932708c270d2b12d050389", "5a966f51a2750c00156aacf6"], // saigabuddy
                ["67932708c270d2b12d05038a", "6450ec2e7da7133e5a09ca96"], // 9a91-30
                ["67932708c270d2b12d05038b", "5a17fb03fcdbcbcae668728f"], // aps35
                ["67932708c270d2b12d05038c", "5a17fb03fcdbcbcae668728f"], // aps50
                ["67932708c270d2b12d05038d", "5caf1041ae92157c28402e3f"], // ash25
                ["67932708c270d2b12d05038e", "5888988e24597752fe43a6fa"], // dvl15
                ["67932708c270d2b12d05038f", "5888988e24597752fe43a6fa"], // dvl20
                ["67932708c270d2b12d050390", "5cadc2e0ae9215051e1c21e7"], // M9A3+5
                ["67932708c270d2b12d050391", "5df25b6c0b92095fd441e4cf"], // ORSIS10
                ["67932708c270d2b12d050392", "599860ac86f77436b225ed1a"], // PP19 30+10
                ["67932708c270d2b12d050393", "599860ac86f77436b225ed1a"], // PP19 30+10 (red)
                ["67932708c270d2b12d050394", "57d1519e24597714373db79d"], // PP91 30+10
                ["67932708c270d2b12d050395", "57d1519e24597714373db79d"], // PP91 30+30
                ["67932708c270d2b12d050396", "5a9e81fba2750c00164f6b11"], // SR3M 35
                ["67932708c270d2b12d050397", "5a9e81fba2750c00164f6b11"], // SR3M 40
                ["67932708c270d2b12d050398", "5a9e81fba2750c00164f6b11"], // SR3M 45
                ["67932708c270d2b12d050399", "5c6161fb2e221600113fbde5"], // TOZ-106 10
                ["679edba49f79e7dd6e00abcd", "5c0548ae0db834001966a3c2"], // SLR-106 30+5
                ["679edba49f79e7dd6e00abce", "5c0548ae0db834001966a3c2"], // SLR-106 40
                ["679edba49f79e7dd6e00abcf", "5c0548ae0db834001966a3c2"], // SLR-106 40+5
                ["679edba49f79e7dd6e00abd0", "5d3eb5eca4b9363b1f22f8e4"], // FN57 20+10 blk
                ["679edba49f79e7dd6e00abd1", "5d3eb5eca4b9363b1f22f8e4"], // FN57 20+10 fde
                ["679edba49f79e7dd6e00abd2", "618168dc8004cc50514c34fc"], // SCAR-FAL 30
            ];
            for (const [newMagTpl, baseMagTpl] of magCompatMap) {
                for (const itemId in items) {
                    const weapon = items[itemId];
                    if (!weapon._props || !weapon._props.Slots) {
                        continue;
                    }
                    for (const slot of weapon._props.Slots) {
                        if (slot._name !== "mod_magazine") {
                            continue;
                        }
                        if (!slot._props || !slot._props.filters) {
                            continue;
                        }
                        for (const filter of slot._props.filters) {
                            if (!filter.Filter || !Array.isArray(filter.Filter)) {
                                continue;
                            }
                            if (filter.Filter.includes(baseMagTpl) && !filter.Filter.includes(newMagTpl)) {
                                filter.Filter.push(newMagTpl);
                            }
                        }
                    }
                }
            }
            addidtot(CHOPPED60id, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mp540id, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(extended1911id, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(ks23stendoid, "58330581ace78e27b8b10cee", 99, 8054, "5449016a4bdc2d6f028b456f", 2, "5b5f754a86f774094242f19b", 5054, true);
            addidtot(aics5plusblkid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics5plusgrnid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics5plusredid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics5plustanid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics10plusblkid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics10plusgrnid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics10plusredid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aics10plustanid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr25plusblkid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr25plusgrnid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr25plusredid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr25plustanid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx140mmredid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx170mmredid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a15pmagblkid, "5a7c2eca46aef81a7ca2145d", 99, 25, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a15pmagredid, "5a7c2eca46aef81a7ca2145d", 99, 25, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a15pmaggrnid, "5a7c2eca46aef81a7ca2145d", 99, 25, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a15pmagtanid, "5a7c2eca46aef81a7ca2145d", 99, 25, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr25drumid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25pmagblkid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25pmaggrnid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25pmagredid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25pmagtanid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35pmagblkid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35pmaggrnid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35pmagredid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35pmagtanid, "5a7c2eca46aef81a7ca2145d", 99, 28, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a45pmagblkid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a45pmaggrnid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a45pmagredid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a45pmagtanid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25ak7blkid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25ak7grnid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25ak7redid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a25ak7tanid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7blkblkid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7blkgrnid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7blkredid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7blktanid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7fdeblkid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7fdegrnid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7fderedid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(a35ak7fdetanid, "5a7c2eca46aef81a7ca2145d", 99, 38, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx63blkid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx63grnid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx63redid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mbx63tanid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(saigabuddyid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(mag9a9130id, "5a7c2eca46aef81a7ca2145d", 99, 65, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aps35magid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(aps50magid, "5a7c2eca46aef81a7ca2145d", 99, 65, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(ash25id, "5a7c2eca46aef81a7ca2145d", 99, 115, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(dvl15id, "5a7c2eca46aef81a7ca2145d", 99, 75, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(dvl20id, "5a7c2eca46aef81a7ca2145d", 99, 75, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(m9a3plusid, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(orsis10id, "5a7c2eca46aef81a7ca2145d", 99, 95, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(pp1940id, "5a7c2eca46aef81a7ca2145d", 99, 65, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(pp1940redid, "5a7c2eca46aef81a7ca2145d", 99, 65, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(pp9140id, "5a7c2eca46aef81a7ca2145d", 99, 35, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(pp9160id, "5a7c2eca46aef81a7ca2145d", 99, 65, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr3m35id, "5a7c2eca46aef81a7ca2145d", 99, 45, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr3m40id, "5a7c2eca46aef81a7ca2145d", 99, 55, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(sr3m45id, "5a7c2eca46aef81a7ca2145d", 99, 75, "5696686a4bdc2da3298b456a", 3, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(toz10id, "5a7c2eca46aef81a7ca2145d", 99, 15, "5696686a4bdc2da3298b456a", 1, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(arsenal35id, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(arsenal40id, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(arsenal45id, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(fn57extendedblkid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(fn57extendedfdeid, "5a7c2eca46aef81a7ca2145d", 99, 48, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            addidtot(falscarid, "5a7c2eca46aef81a7ca2145d", 99, 55, "5696686a4bdc2da3298b456a", 2, "5b5f754a86f774094242f19b", 21615, true);
            logger.info("HANAVI's Items [Extended_mags] Loaded successfully.");
        }
        if (this.cfg.uwu) {
            logger.info("HANAVI's Items is Loaded! UwU");
        }
        for (const locale of Object.values(tables.locales.global)) {
            if (localesData["en"]?.itemids) {
                for (const [idIndex, idName] of Object.entries(localesData["en"].itemids)) {
                    for (const [des, value] of Object.entries(idName)) {
                        locale[`${idIndex} ${des}`] = value;
                    }
                }
            }
        }
        for (const localeID in localesData) {
            if (localeID !== "en" && localesData[localeID]?.itemids) {
                for (const [idIndex, idData] of Object.entries(localesData[localeID].itemids)) {
                    if (typeof idData === "object" && idData !== null) {
                        tables.locales.global[localeID][idIndex] = idData;
                    }
                    else {
                        tables.locales.global[localeID][idIndex] = { Name: idData };
                    }
                }
            }
        }
        function addidtot(itemID, traderID, countNum, price, currency, loyal, type, hbprice, unlock) {
            handbook.Items.push({
                "Id": itemID,
                "ParentId": type,
                "Price": hbprice
            });
            items[itemID]._props.CanSellOnRagfair = unlock;
            if (traderID != "0") {
                tables.traders[traderID].assort.items.push({
                    "_id": itemID,
                    "_tpl": itemID,
                    "parentId": "hideout",
                    "slotId": "hideout",
                    "upd": {
                        "UnlimitedCount": false,
                        "StackObjectsCount": countNum,
                        "BuyRestrictionMax": countNum,
                        "BuyRestrictionCurrent": 0
                    }
                });
                tables.traders[traderID].assort.barter_scheme[itemID] = [
                    [{
                            "count": price,
                            "_tpl": currency
                        }]
                ];
                tables.traders[traderID].assort.loyal_level_items[itemID] = loyal;
            }
        }
        applyMosinExtension(container);
        applyG36Extension(container);
        applyTT33KExtension(container);
        applyNervexExtension(container);
    }
}
// ---------------- 공용: locale itemids 로더 ----------------
function loadItemidsForLang(localesRoot, langId) {
    // 패턴 A: locales/global/<lang>/itemids.json
    const dirPath = path.join(localesRoot, langId);
    const fileA = path.join(dirPath, "itemids.json");
    if (fs.existsSync(fileA)) {
        return JSON.parse(fs.readFileSync(fileA, "utf-8"));
    }
    // 패턴 B: locales/global/<lang>.json (안에 itemids 속성)
    const fileB = path.join(localesRoot, `${langId}.json`);
    if (fs.existsSync(fileB)) {
        const full = JSON.parse(fs.readFileSync(fileB, "utf-8"));
        if (full.itemids) {
            return full.itemids;
        }
    }
    return null;
}
// ---------------- Mosin 통합 ----------------
function applyMosinExtension(container) {
    const databaseServer = container.resolve("DatabaseServer");
    const tables = databaseServer.getTables();
    const items = tables.templates.items;
    const handbook = tables.templates.handbook;
    const itemHelper = container.resolve("ItemHelper");
    // HANA-VI_Items 루트 기준 경로
    const modRoot = path.resolve(__dirname, "..");
    const mosinRoot = path.join(modRoot, "mosin", "db");
    // 1) newitems.json: Mosin 새 아이템 템플릿 등록
    const newitemsPath = path.join(mosinRoot, "newitems.json");
    if (fs.existsSync(newitemsPath)) {
        const newitems = JSON.parse(fs.readFileSync(newitemsPath, "utf-8"));
        if (Array.isArray(newitems.itemsSlot)) {
            for (const slot of newitems.itemsSlot) {
                items[slot._id] = slot;
            }
        }
    }
    // 2) modifyItem.json: 슬롯/핸드북/트레이더/ConflictingItems
    const modifyItemPath = path.join(mosinRoot, "modifyItem.json");
    if (fs.existsSync(modifyItemPath)) {
        const modifyItem = JSON.parse(fs.readFileSync(modifyItemPath, "utf-8"));
        // itemsToAdd
        if (Array.isArray(modifyItem.itemsToAdd)) {
            for (const modSlots of modifyItem.itemsToAdd) {
                const addId = modSlots._id;
                // 슬롯 추가
                if (modSlots.slotAdd) {
                    modSlots.slotAdd.targetId.forEach((value, index) => {
                        const baseItem = items[value];
                        if (!baseItem?._props?.Slots) {
                            return;
                        }
                        const slotName = modSlots.slotAdd.slotName[index];
                        const slot = baseItem._props.Slots.find((s) => s._name === slotName);
                        if (slot && slot._props?.filters?.[0]?.Filter) {
                            slot._props.filters[0].Filter.push(addId);
                        }
                    });
                }
                // 핸드북 추가
                if (modSlots.handbook) {
                    handbook.Items.push(modSlots.handbook);
                }
                // 트레이더 입고
                if (modSlots.traderAssort) {
                    const traderId = modSlots.traderAssort.traderName;
                    const trader = tables.traders[traderId];
                    if (!trader) {
                        continue;
                    }
                    const itemList = modSlots.traderAssort.itemList;
                    trader.assort.items.push(itemList.items);
                    for (const [key, value] of Object.entries(itemList.barter_scheme)) {
                        trader.assort.barter_scheme[key] = value;
                    }
                    const loyalValue = Object.values(itemList.loyal_level_items)[0];
                    trader.assort.loyal_level_items[addId] = loyalValue;
                }
            }
        }
        // itemsToConflicts
        if (Array.isArray(modifyItem.itemsToConflicts)) {
            for (const modConflts of modifyItem.itemsToConflicts) {
                if (!itemHelper.isItemInDb(modConflts._id)) {
                    continue;
                }
                const baseItem = items[modConflts._id];
                if (!baseItem?._props?.ConflictingItems) {
                    continue;
                }
                for (const value of modConflts.ConflictingItems) {
                    baseItem._props.ConflictingItems.push(value);
                }
            }
        }
    }
    // 3) Mosin 로케일 주입 (mosin/db/locales/global)
    const localesRoot = path.join(mosinRoot, "locales", "global");
    // 3-1) en 기준으로 모든 언어에 기본 텍스트
    const enItemids = loadItemidsForLang(localesRoot, "en");
    if (enItemids) {
        const allLocales = Object.values(tables.locales.global);
        for (const locale of allLocales) {
            for (const [idIndex, idName] of Object.entries(enItemids)) {
                for (const [des, value] of Object.entries(idName)) {
                    locale[`${idIndex} ${des}`] = value;
                }
            }
        }
    }
    // 3-2) 언어별 itemids 로 있으면 그 언어로 덮어쓰기
    const availableLangs = Object.keys(tables.locales.global);
    for (const langId of availableLangs) {
        if (langId === "en") {
            continue;
        }
        const langItemids = loadItemidsForLang(localesRoot, langId);
        if (!langItemids) {
            continue;
        }
        const targetLocale = tables.locales.global[langId];
        for (const [idIndex, idName] of Object.entries(langItemids)) {
            for (const [des, value] of Object.entries(idName)) {
                targetLocale[`${idIndex} ${des}`] = value;
            }
        }
    }
}
function loadG36InjectionFiles(nervRoot) {
    const results = [];
    function walk(dir) {
        if (!fs.existsSync(dir))
            return;
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                walk(full);
            }
            else if (name.toLowerCase().endsWith(".json")) {
                const raw = fs.readFileSync(full, "utf-8");
                try {
                    results.push(JSON.parse(raw));
                }
                catch (e) {
                    console.error(`[G36Extension] Failed to parse ${full}:`, e);
                }
            }
        }
    }
    walk(nervRoot);
    return results;
}
function isCorrectG36Injection(obj) {
    return obj
        && obj.overwriteProperties
        && obj.overwriteProperties.newId
        && obj.overwriteProperties.itemTplToClone;
}
function processG36InjectionItemTemplate(customInjection, items, jsonUtil, tables) {
    // 1) 슬롯 추가
    if (customInjection.slotsToAdd) {
        customInjection.slotsToAdd.targetID.forEach((value, index) => {
            const baseItem = items[value];
            if (!baseItem?._props?.Slots)
                return;
            const slotName = customInjection.slotsToAdd.slotName[index];
            const slot = baseItem._props.Slots.find((s) => s._name === slotName);
            if (slot && slot._props?.filters?.[0]?.Filter) {
                slot._props.filters[0].Filter.push(customInjection.overwriteProperties.newId);
            }
        });
    }
    // 2) 핸드북 추가
    tables.templates.handbook.Items.push({
        Id: customInjection.overwriteProperties.newId,
        ParentId: customInjection.overwriteProperties.handbookParentId,
        Price: customInjection.overwriteProperties.handbookPriceRoubles
    });
    // 3) 아이템 템플릿 클론 + override
    const srcTpl = customInjection.overwriteProperties.itemTplToClone;
    const newId = customInjection.overwriteProperties.newId;
    const newItem = jsonUtil.clone(items[srcTpl]);
    newItem._id = newId;
    const override = customInjection.overwriteProperties.overrideProperties;
    if (override && typeof override === "object") {
        for (const [key, value] of Object.entries(override)) {
            if (key in items[srcTpl]._props) {
                newItem._props[key] = value;
            }
            else {
                console.log(`[G36Extension] Key %s not found in item %s`, key, srcTpl);
            }
        }
    }
    else {
        console.log("[G36Extension] overrideProperties is null/undefined or not an object");
    }
    items[newId] = newItem;
    // 4) 상인 등록
    if (customInjection.traderToAdd?.traderID) {
        const traderId = customInjection.traderToAdd.traderID;
        const trader = tables.traders[traderId];
        if (!trader)
            return;
        trader.assort.items.push({
            _id: newId,
            _tpl: newId,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: false,
                StackObjectsCount: customInjection.traderToAdd.BuyRestrictionMax * 11,
                BuyRestrictionMax: customInjection.traderToAdd.BuyRestrictionMax,
                BuyRestrictionCurrent: 0
            }
        });
        // 통화 문자열 → 실제 화폐 템플릿ID 매핑
        //  - ROUBLES: 5449016a4bdc2d6f028b456f
        //  - DOLLARS: 5696686a4bdc2da3298b456a
        //  - EUROS  : 569668774bdc2da2298b4568
        let traderCurrencyTpl = customInjection.traderToAdd.barter_scheme;
        switch (traderCurrencyTpl) {
            case "ROUBLES":
                traderCurrencyTpl = "5449016a4bdc2d6f028b456f";
                break;
            case "DOLLARS":
                traderCurrencyTpl = "5696686a4bdc2da3298b456a";
                break;
            case "EUROS":
                traderCurrencyTpl = "569668774bdc2da2298b4568";
                break;
            default:
                // 이미 템플릿ID를 직접 넣어둔 경우도 있으니, 그때는 그대로 사용
                break;
        }
        trader.assort.barter_scheme[newId] = [
            [{
                    "count": customInjection.traderToAdd.barter_scheme_value,
                    "_tpl": traderCurrencyTpl
                }]
        ];
        trader.assort.loyal_level_items[newId] = customInjection.traderToAdd.loyal_level_items;
    }
}
function applyG36Extension(container) {
    const databaseServer = container.resolve("DatabaseServer");
    const tables = databaseServer.getTables();
    const items = tables.templates.items;
    const jsonUtil = container.resolve("JsonUtil");
    const modRoot = path.resolve(__dirname, "..");
    const g36Root = path.join(modRoot, "g36", "db");
    // 1) nerv_inv 커스텀 아이템 로딩
    const nervRoot = path.join(g36Root, "nerv_inv");
    const customItemsArray = loadG36InjectionFiles(nervRoot);
    if (Array.isArray(customItemsArray)) {
        for (const item of customItemsArray) {
            if (!isCorrectG36Injection(item)) {
                console.error("[G36Extension] Invalid injection file:", item);
                continue;
            }
            processG36InjectionItemTemplate(item, items, jsonUtil, tables);
        }
    }
    else {
        console.error("[G36Extension] customItemsArray is not an array");
    }
    // 2) G36 로케일 주입 (g36/db/locales/global)
    const localesRoot = path.join(g36Root, "locales", "global");
    const enItemids = loadItemidsForLang(localesRoot, "en");
    if (enItemids) {
        const allLocales = Object.values(tables.locales.global);
        for (const locale of allLocales) {
            for (const [idIndex, idName] of Object.entries(enItemids)) {
                for (const [des, value] of Object.entries(idName)) {
                    locale[`${idIndex} ${des}`] = value;
                }
            }
        }
    }
    const availableLangs = Object.keys(tables.locales.global);
    for (const langId of availableLangs) {
        if (langId === "en") {
            continue;
        }
        const langItemids = loadItemidsForLang(localesRoot, langId);
        if (!langItemids) {
            continue;
        }
        const targetLocale = tables.locales.global[langId];
        for (const [idIndex, idName] of Object.entries(langItemids)) {
            for (const [des, value] of Object.entries(idName)) {
                targetLocale[`${idIndex} ${des}`] = value;
            }
        }
    }
}
// ---------------- TT33K 통합 ----------------
function applyTT33KExtension(container) {
    const jsonUtil = container.resolve("JsonUtil");
    const databaseServer = container.resolve("DatabaseServer");
    const tables = databaseServer.getTables();
    const locales = Object.values(tables.locales.global);
    const items = tables.templates.items;
    const handbook = tables.templates.handbook;
    const mastering = tables.globals.config.Mastering;
    // ---------- TT33K 아이템 생성/슬롯/프리셋/퀘스트/마스터리 ----------
    const muzzleJp943id = "674ce37ed70d41fae3dca318";
    const muzzleJp943 = jsonUtil.clone(items["5bffd7ed0db834001d23ebf9"]);
    muzzleJp943._id = muzzleJp943id;
    muzzleJp943._props.Accuracy -= 1;
    muzzleJp943._props.ConflictingItems.push("5bffd7ed0db834001d23ebf9");
    muzzleJp943._props.Prefab.path = "tt33mod1/muzzle_jp94_3.bundle";
    muzzleJp943._props.Weight = 0.0233;
    muzzleJp943._props.Recoil -= 2;
    muzzleJp943._props.Velocity += 0.3;
    items[muzzleJp943id] = muzzleJp943;
    items["571a279b24597720b4066566"]._props.Slots[0]._props.filters[0].Filter.push(muzzleJp943id);
    const mountTt33Shortid = "674ce394810fbfe3d7df0525";
    const mountTt33Short = jsonUtil.clone(items["5a9d6d21a2750c00137fa649"]);
    mountTt33Short._id = mountTt33Shortid;
    mountTt33Short._props.Prefab.path = "tt33mod1/mount_tt_short.bundle";
    mountTt33Short._props.Slots = [
        {
            "_id": "5a9e5f18a2750c003215715c",
            "_mergeSlotWithChildren": false,
            "_name": "mod_tactical",
            "_parent": mountTt33Shortid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a800961159bd4315e3a1657",
                            "57fd23e32459772d0805bcf1",
                            "5cc9c20cd7f00c001336c65d",
                            "5d2369418abbc306c62e0c80",
                            "5b07dd285acfc4001754240d",
                            "56def37dd2720bec348b456a",
                            "5a7b483fe899ef0016170d15",
                            "5a5f1ce64f39f90b401987bc",
                            "560d657b4bdc2da74d8b4572",
                            "5b3a337e5acfc4704b4a19a0",
                            "6272370ee4013c5d7e31f418",
                            "6272379924e29f06af4d5ecb",
                            "644a3df63b0b6f03e101e065"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    mountTt33Short._props.Width = 1;
    mountTt33Short._props.Weight = 0.023;
    items["571a12c42459771f627b58a0"]._props.Slots[4]._props.filters[0].Filter.push(mountTt33Shortid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[4]._props.filters[0].Filter.push(mountTt33Shortid);
    items[mountTt33Shortid] = mountTt33Short;
    const mountTt33nrmRailid = "674ce3a2e3da127b0c18ff2b";
    const mountTt33nrmRail = jsonUtil.clone(items["5a9d6d34a2750c00141e07da"]);
    mountTt33nrmRail._id = mountTt33nrmRailid;
    mountTt33nrmRail._props.Prefab.path = "tt33mod1/mount_rail_tt_nl.bundle";
    mountTt33nrmRail._props.Slots = [
        {
            "_id": "5a9d6d34a2750c00141e07dd",
            "_mergeSlotWithChildren": false,
            "_name": "mod_mount_000",
            "_parent": mountTt33nrmRailid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a9d6d00a2750c5c985b5305",
                            "59e0bdb186f774156f04ce82",
                            "623c2f652febb22c2777d8d7"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        },
        {
            "_id": "5a9d6d34a2750c00141e07de",
            "_mergeSlotWithChildren": false,
            "_name": "mod_mount_001",
            "_parent": mountTt33nrmRailid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a9d6d00a2750c5c985b5305",
                            "59e0bdb186f774156f04ce82",
                            "623c2f652febb22c2777d8d7"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        },
        {
            "_id": "5ab24ef9e5b5b00fe93c920b",
            "_mergeSlotWithChildren": false,
            "_name": "mod_scope",
            "_parent": mountTt33nrmRailid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "57ae0171245977343c27bfcf",
                            "609bab8b455afd752b2e6138",
                            "58d39d3d86f77445bb794ae7",
                            "616554fe50224f204c1da2aa",
                            "615d8d878004cc50514c3233",
                            "577d128124597739d65d0e56",
                            "58d2664f86f7747fec5834f6",
                            "5a33b2c9c4a282000c5a9511",
                            "570fd721d2720bc5458b4596",
                            "584984812459776a704a82a6"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    mountTt33nrmRail._props.Ergonomics = 2;
    mountTt33nrmRail._props.Recoil = -2;
    mountTt33nrmRail._props.Weight = 0.034;
    mountTt33nrmRail._props.Width = 2;
    items[mountTt33nrmRailid] = mountTt33nrmRail;
    const mountTt33nrmDecoid = "674ce3b38a4ec0c33328b3e7";
    const mountTt33nrmDeco = jsonUtil.clone(items["5a9d6d34a2750c00141e07da"]);
    mountTt33nrmDeco._id = mountTt33nrmDecoid;
    mountTt33nrmDeco._props.Prefab.path = "tt33mod1/mount_deco_tt_nl.bundle";
    mountTt33nrmDeco._props.Slots = [
        {
            "_id": "5a9d6d34a2750c00141e07dd",
            "_mergeSlotWithChildren": false,
            "_name": "mod_mount_000",
            "_parent": mountTt33nrmDecoid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a9d6d00a2750c5c985b5305",
                            "59e0bdb186f774156f04ce82",
                            "623c2f652febb22c2777d8d7"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        },
        {
            "_id": "5a9d6d34a2750c00141e07de",
            "_mergeSlotWithChildren": false,
            "_name": "mod_mount_001",
            "_parent": mountTt33nrmDecoid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a9d6d00a2750c5c985b5305",
                            "59e0bdb186f774156f04ce82",
                            "623c2f652febb22c2777d8d7"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    mountTt33nrmDeco._props.Ergonomics = 3;
    mountTt33nrmDeco._props.Width = 1;
    mountTt33nrmDeco._props.Recoil = -0.5;
    mountTt33nrmDeco._props.Weight = 0.023;
    items[mountTt33nrmDecoid] = mountTt33nrmDeco;
    const mountTt33nrmid = "674ce3c2a388fc79ee06f7b7";
    const mountTt33nrm = jsonUtil.clone(items["5a9d6d21a2750c00137fa649"]);
    mountTt33nrm._id = mountTt33nrmid;
    mountTt33nrm._props.Ergonomics = -1;
    mountTt33nrm._props.Prefab.path = "tt33mod1/mount_tt_nl.bundle";
    mountTt33nrm._props.Width = 1;
    mountTt33nrm._props.Slots = [
        {
            "_id": "5a9d6e86a2750c00171b3f7b",
            "_mergeSlotWithChildren": false,
            "_name": "mod_mount",
            "_parent": mountTt33nrmid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            mountTt33nrmDecoid,
                            mountTt33nrmRailid
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        },
        {
            "_id": "5c8a52462e2216000e69ecc1",
            "_mergeSlotWithChildren": false,
            "_name": "mod_tactical",
            "_parent": mountTt33nrmid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a800961159bd4315e3a1657",
                            "57fd23e32459772d0805bcf1",
                            "544909bb4bdc2d6f028b4577",
                            "5c06595c0db834001a66af6c",
                            "5cc9c20cd7f00c001336c65d",
                            "5d2369418abbc306c62e0c80",
                            "5b07dd285acfc4001754240d",
                            "56def37dd2720bec348b456a",
                            "5a7b483fe899ef0016170d15",
                            "5a5f1ce64f39f90b401987bc",
                            "560d657b4bdc2da74d8b4572",
                            "5b3a337e5acfc4704b4a19a0",
                            "5c5952732e2216398b5abda2",
                            "57d17e212459775a1179a0f5",
                            "6267c6396b642f77f56f5c1c",
                            "6272370ee4013c5d7e31f418",
                            "6272379924e29f06af4d5ecb",
                            "626becf9582c3e319310b837",
                            "644a3df63b0b6f03e101e065"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    mountTt33nrm._props.Weight = 0.05;
    items["571a12c42459771f627b58a0"]._props.Slots[4]._props.filters[0].Filter.push(mountTt33nrmid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[4]._props.filters[0].Filter.push(mountTt33nrmid);
    items[mountTt33nrmid] = mountTt33nrm;
    const muzzleTtmafiaid = "674ce3cf5200e755ee6fb23f";
    const muzzleTtmafia = jsonUtil.clone(items["5bffd7ed0db834001d23ebf9"]);
    muzzleTtmafia._id = muzzleTtmafiaid;
    muzzleTtmafia._props.Accuracy += 2;
    muzzleTtmafia._props.ConflictingItems = ["571a279b24597720b4066566"];
    muzzleTtmafia._props.Prefab.path = "tt33mod1/muzzle_tt_mafia.bundle";
    muzzleTtmafia._props.Weight = 0.0233;
    muzzleTtmafia._props.Recoil -= 4;
    muzzleTtmafia._props.Slots = [
        {
            "_id": "5bffd9000db83400232feb12",
            "_mergeSlotWithChildren": false,
            "_name": "mod_muzzle",
            "_parent": muzzleTtmafiaid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5bffd7ed0db834001d23ebf9"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    muzzleTtmafia._props.CoolFactor = 1.03;
    items[muzzleTtmafiaid] = muzzleTtmafia;
    items["571a12c42459771f627b58a0"]._props.Slots[3]._props.filters[0].Filter.push(muzzleTtmafiaid);
    const barrelTt33Mafiaid = "674ce3dcb27759478174421e";
    const barrelTt33Mafia = jsonUtil.clone(items["571a279b24597720b4066566"]);
    barrelTt33Mafia._id = barrelTt33Mafiaid;
    barrelTt33Mafia._props.Accuracy += 1;
    barrelTt33Mafia._props.CenterOfImpact -= 0.032;
    barrelTt33Mafia._props.CoolFactor = 1.02;
    barrelTt33Mafia._props.Ergonomics -= 2;
    barrelTt33Mafia._props.HeatFactor = 0.8;
    barrelTt33Mafia._props.Loudness = 3;
    barrelTt33Mafia._props.Prefab.path = "tt33mod1/barrel_tt_165mm_mafia.bundle";
    barrelTt33Mafia._props.Weight += 0.003;
    barrelTt33Mafia._props.Recoil -= 2;
    barrelTt33Mafia._props.Velocity += 0.01;
    items[barrelTt33Mafiaid] = barrelTt33Mafia;
    const barrelAkid = "674ce3e611029a8e3aa1757c";
    const barrelAk = jsonUtil.clone(items["5bffd7ed0db834001d23ebf9"]);
    barrelAk._id = barrelAkid;
    barrelAk._props.Prefab.path = "tt33mod1/barrel_tt_ak.bundle";
    barrelAk._props.ConflictingItems = [barrelTt33Mafiaid, muzzleTtmafiaid, "5bffd7ed0db834001d23ebf9"];
    barrelAk._props.Recoil -= 4;
    barrelAk._props.Ergonomics = -14;
    barrelAk._props.HeatFactor = 1.01;
    barrelAk._props.Accuracy += 3;
    barrelAk._props.CoolFactor = 1.08;
    barrelAk._props.DurabilityBurnModificator = 0.74;
    barrelAk._props.Velocity += 1;
    barrelAk._props.Weight = 0.23;
    barrelAk._props.Width = 2;
    barrelAk._props.RaidModdable = false;
    barrelAk._props.ExtraSizeLeft = 1;
    barrelAk._props.DeviationMax -= 0.3;
    barrelAk._props.Slots = [
        {
            "_name": "mod_muzzle",
            "_id": "571a29612459771fd90bb671",
            "_parent": barrelAkid,
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": [
                            "571a28e524597720b4066567",
                            muzzleJp943id
                        ]
                    }
                ]
            },
            "_required": false,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        }
    ];
    items[barrelAkid] = barrelAk;
    items["571a279b24597720b4066566"]._props.Slots[0]._props.filters[0].Filter.push(barrelAkid);
    const adapterAkid = "674ce3f3e40d8837dba8c0e5";
    const adapterAk = jsonUtil.clone(items[mountTt33Shortid]);
    adapterAk._id = adapterAkid;
    adapterAk._props.Prefab.path = "tt33mod1/mount_tt_ak.bundle";
    adapterAk._props.Ergonomics -= 3;
    adapterAk._props.RaidModdable = false;
    adapterAk._props.ConflictingItems = [barrelTt33Mafiaid];
    adapterAk._props.Slots = [
        {
            "_name": "mod_handguard",
            "_id": "59d64ec286f774171d1e0a43",
            "_parent": adapterAkid,
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": [
                            "5cf4e3f3d7f00c06595bc7f0",
                            "5648ae314bdc2d3d1c8b457f",
                            "5d2c829448f0353a5c7d6674",
                            "5cbda392ae92155f3c17c39f",
                            "5cbda9f4ae9215000e5b9bfc",
                            "5648b0744bdc2d363b8b4578",
                            "5648b1504bdc2d9d488b4584",
                            "59d64f2f86f77417193ef8b3",
                            "57cff947245977638e6f2a19",
                            "57cffd8224597763b03fc609",
                            "57cffddc24597763133760c6",
                            "57cffe0024597763b03fc60b",
                            "57cffe20245977632f391a9d",
                            "5c9a07572e221644f31c4b32",
                            "5c9a1c3a2e2216000e69fb6a",
                            "5c9a1c422e221600106f69f0",
                            "59e6284f86f77440d569536f",
                            "59e898ee86f77427614bd225",
                            "5a9d56c8a2750c0032157146",
                            "5d1b198cd7ad1a604869ad72",
                            "5d4aaa73a4b9365392071175",
                            "5d4aaa54a4b9365392071170",
                            "5f6331e097199b7db2128dc2",
                            "5c17664f2e2216398b5a7e3c",
                            "5c617a5f2e2216000f1e81b3",
                            "5648b4534bdc2d3d1c8b4580",
                            "5efaf417aeb21837e749c7f2",
                            "6389f1dfc879ce63f72fc43e",
                            "647dba3142c479dde701b654",
                            "647dd2b8a12ebf96c3031655"
                        ]
                    }
                ]
            },
            "_required": true,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        }
    ];
    adapterAk._props.Weight = 0.02;
    adapterAk._props.Width = 1;
    items[adapterAkid] = adapterAk;
    items["571a12c42459771f627b58a0"]._props.Slots[4]._props.filters[0].Filter.push(adapterAkid);
    const roundTt33timbsid = "674ce40e311392052d86e59b";
    const roundTt33timbs = jsonUtil.clone(items["573603562459776430731618"]);
    roundTt33timbs._id = roundTt33timbsid;
    roundTt33timbs._props.ArmorDamage = 45;
    roundTt33timbs._props.BallisticCoeficient = 0.181;
    roundTt33timbs._props.BulletMassGram = 5.5;
    roundTt33timbs._props.CanSellOnRagfair = false;
    roundTt33timbs._props.Damage = 44;
    roundTt33timbs._props.DurabilityBurnModificator = 1.7;
    roundTt33timbs._props.FragmentationChance = 0.13;
    roundTt33timbs._props.HeatFactor = 1.7;
    roundTt33timbs._props.InitialSpeed = 609;
    roundTt33timbs._props.PenetrationChance = 0.9;
    roundTt33timbs._props.PenetrationPower = 60;
    roundTt33timbs._props.PenetrationPowerDiviation = 0.3;
    roundTt33timbs._props.Prefab.path = "tt33mod1/ammo_tt_762x25mm_sabot.bundle";
    items[roundTt33timbsid] = roundTt33timbs;
    items["571a29dc2459771fb2755a6a"]._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    items["571a12c42459771f627b58a0"]._props.Chambers[0]._props.filters[0].Filter.push(roundTt33timbsid);
    items["5b3b713c5acfc4330140bd8d"]._props.Chambers[0]._props.filters[0].Filter.push(roundTt33timbsid);
    items["5ea034eb5aad6446a939737b"]._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    items["5ea034f65aad6446a939737e"]._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    const stockType80bayonetid = "674ce41ad19849345f3319dc";
    const stockType80bayonet = jsonUtil.clone(items["5a17fb9dfcdbcbcae6687291"]);
    stockType80bayonet._id = stockType80bayonetid;
    stockType80bayonet._props.Slots = [];
    stockType80bayonet._props.Prefab.path = "tt33mod1/stock_type80.bundle";
    stockType80bayonet._props.Weight = 0.223;
    stockType80bayonet._props.Width = 2;
    stockType80bayonet._props.Recoil -= 1;
    items[stockType80bayonetid] = stockType80bayonet;
    const mountType54adapterid = "674ce4a4cf14c5613685459c";
    const mountType54adapter = jsonUtil.clone(items["5649b2314bdc2d79388b4576"]);
    mountType54adapter._id = mountType54adapterid;
    mountType54adapter._props.Slots = [
        {
            "_id": "5649db764bdc2d363b8b4583",
            "_mergeSlotWithChildren": false,
            "_name": "mod_stock",
            "_parent": mountType54adapterid,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "5a17fb9dfcdbcbcae6687291",
                            stockType80bayonetid
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": true
        }
    ];
    mountType54adapter._props.Prefab.path = "tt33mod1/mout_type54_adapter.bundle";
    mountType54adapter._props.Recoil = 0;
    mountType54adapter._props.Weight = 0.02;
    items[mountType54adapterid] = mountType54adapter;
    const gripType54id = "674ce4259e5873606176ce06";
    const gripType54 = jsonUtil.clone(items["571a282c2459771fb2755a69"]);
    gripType54._id = gripType54id;
    gripType54._props.Ergonomics += 1;
    gripType54._props.Prefab.path = "tt33mod1/pistolgrip_type_54.bundle";
    gripType54._props.Slots = [
        {
            "_id": "5649db764bdc2d363b8b4583",
            "_mergeSlotWithChildren": false,
            "_name": "mod_tactical",
            "_parent": gripType54id,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            mountType54adapterid
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        }
    ];
    items[gripType54id] = gripType54;
    const magTt33Longid = "674ce42f4fd7d139a6e6bf81";
    const magTt33Long = jsonUtil.clone(items["571a29dc2459771fb2755a6a"]);
    magTt33Long._props.Weight = 0.16;
    magTt33Long._props.Cartridges[0]._max_count = 25;
    magTt33Long._props.Ergonomics = -3;
    magTt33Long._props.LoadUnloadModifier = 23;
    magTt33Long._props.CheckOverride = 0;
    magTt33Long._props.CheckTimeModifier = 36;
    magTt33Long._props.MalfunctionChance = 0.15;
    magTt33Long._props.Height = 2;
    magTt33Long._props.ExtraSizeDown = 1;
    magTt33Long._props.Prefab.path = "tt33mod1/magazine_long.bundle";
    magTt33Long._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    magTt33Long._id = magTt33Longid;
    items[magTt33Longid] = magTt33Long;
    items["571a12c42459771f627b58a0"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Longid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Longid);
    const magTt33Tacid = "674ce43bdd5a0d056ddf96bd";
    const magTt33Tac = jsonUtil.clone(items["571a29dc2459771fb2755a6a"]);
    magTt33Tac._props.Weight += 0.05;
    magTt33Tac._props.Cartridges[0]._max_count = 12;
    magTt33Tac._props.Ergonomics -= 1;
    magTt33Tac._props.LoadUnloadModifier = -19;
    magTt33Tac._props.CheckOverride = 0;
    magTt33Tac._props.CheckTimeModifier = 36;
    magTt33Tac._props.MalfunctionChance = 0.02;
    magTt33Tac._props.Height = 1;
    magTt33Tac._props.VisibleAmmoRangesString = "1-3";
    magTt33Tac._props.Prefab.path = "tt33mod1/magazine_tac.bundle";
    magTt33Tac._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    magTt33Tac._id = magTt33Tacid;
    items[magTt33Tacid] = magTt33Tac;
    items["571a12c42459771f627b58a0"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Tacid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Tacid);
    const magTt33Drumid = "674ce44854e98725ae76f004";
    const magTt33Drum = jsonUtil.clone(items["571a29dc2459771fb2755a6a"]);
    magTt33Drum._id = magTt33Drumid;
    magTt33Drum._props.Weight = 1;
    magTt33Drum._props.CheckOverride = 0;
    magTt33Drum._props.CanSellOnRagfair = true;
    magTt33Drum._props.Cartridges[0]._max_count = 75;
    magTt33Drum._props.Ergonomics = -10;
    magTt33Drum._props.LoadUnloadModifier = 35;
    magTt33Drum._props.CheckTimeModifier = 48;
    magTt33Drum._props.MalfunctionChance = 0.213;
    magTt33Drum._props.Height = 2;
    magTt33Drum._props.Width = 2;
    magTt33Drum._props.ExtraSizeDown = 1;
    magTt33Drum._props.VisibleAmmoRangesString = "1-8";
    magTt33Drum._props.Prefab.path = "tt33mod1/magazine_drum.bundle";
    magTt33Drum._props.Cartridges[0]._props.filters[0].Filter.push(roundTt33timbsid);
    items[magTt33Drumid] = magTt33Drum;
    items["571a12c42459771f627b58a0"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Drumid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[2]._props.filters[0].Filter.push(magTt33Drumid);
    items["571a12c42459771f627b58a0"]._props.Slots[1]._props.filters[0].Filter.push(gripType54id);
    items["571a12c42459771f627b58a0"]._props.Slots[0]._props.filters[0].Filter.push(barrelTt33Mafiaid);
    items["571a12c42459771f627b58a0"]._props.Slots[3]._props.filters[0].Filter.push(muzzleTtmafiaid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[1]._props.filters[0].Filter.push(gripType54id);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[0]._props.filters[0].Filter.push(barrelTt33Mafiaid);
    items["5b3b713c5acfc4330140bd8d"]._props.Slots[3]._props.filters[0].Filter.push(muzzleTtmafiaid);
    const pistolTt33Khyberid = "674ce4782fd1f97fe1ed52fc";
    const pistolTt33KhyberGoldid = "674ce46fd84094117cefbcbf";
    const pistolType54id = "674ce4b50de9c530bb8403d4";
    const pistolTt33Khyber = jsonUtil.clone(items["571a12c42459771f627b58a0"]);
    const pistolTt33KhyberGold = jsonUtil.clone(items["5b3b713c5acfc4330140bd8d"]);
    const pistolType54 = jsonUtil.clone(items["571a12c42459771f627b58a0"]);
    pistolTt33Khyber._id = pistolTt33Khyberid;
    pistolTt33KhyberGold._id = pistolTt33KhyberGoldid;
    pistolType54._id = pistolType54id;
    pistolTt33Khyber._props.weapFireType = ["fullauto", "single"];
    pistolTt33Khyber._props.bFirerate = 840;
    pistolTt33Khyber._props.DurabilityBurnRatio = 1.5;
    pistolTt33Khyber._props.CanSellOnRagfair = false;
    pistolTt33KhyberGold._props.weapFireType = ["fullauto", "single"];
    pistolTt33KhyberGold._props.bFirerate = 850;
    pistolTt33KhyberGold._props.DurabilityBurnRatio = 1.47;
    pistolTt33KhyberGold._props.CanSellOnRagfair = false;
    pistolType54._props.SingleFireRate = 800;
    pistolType54._props.Prefab.path = "tt33mod1/weapon_toz_tt_762x25tt_container.bundle";
    pistolType54._props.CanSellOnRagfair = false;
    pistolType54._props.RecoilCenter[1] = +0.3;
    items[pistolTt33Khyberid] = pistolTt33Khyber;
    items[pistolTt33KhyberGoldid] = pistolTt33KhyberGold;
    items[pistolType54id] = pistolType54;
    // ---------- 상인/핸드북 등록 ----------
    function addidtot(itemID, traderID, countNum, price, currency, loyal, type, hbprice, unlock) {
        handbook.Items.push({
            "Id": itemID,
            "ParentId": type,
            "Price": hbprice
        });
        items[itemID]._props.CanSellOnRagfair = unlock;
        if (traderID !== "0") {
            tables.traders[traderID].assort.items.push({
                "_id": itemID,
                "_tpl": itemID,
                "parentId": "hideout",
                "slotId": "hideout",
                "upd": {
                    "UnlimitedCount": false,
                    "StackObjectsCount": countNum,
                    "BuyRestrictionMax": countNum,
                    "BuyRestrictionCurrent": 0
                }
            });
            tables.traders[traderID].assort.barter_scheme[itemID] = [
                [{
                        "count": price,
                        "_tpl": currency
                    }]
            ];
            tables.traders[traderID].assort.loyal_level_items[itemID] = loyal;
        }
    }
    addidtot(roundTt33timbsid, "5a7c2eca46aef81a7ca2145d", 500, 1500, "5449016a4bdc2d6f028b456f", 2, "5b47574386f77428ca22b33b", 1920, false);
    addidtot(mountType54adapterid, "58330581ace78e27b8b10cee", 2, 18540, "5449016a4bdc2d6f028b456f", 2, "5b5f755f86f77447ec5d770e", 23731, true);
    addidtot(gripType54id, "58330581ace78e27b8b10cee", 4, 4980, "5449016a4bdc2d6f028b456f", 1, "5b5f761f86f774094242f1a1", 6374, true);
    addidtot(stockType80bayonetid, "58330581ace78e27b8b10cee", 3, 12000, "5449016a4bdc2d6f028b456f", 3, "5b5f757486f774093e6cb507", 15360, true);
    addidtot(muzzleJp943id, "58330581ace78e27b8b10cee", 2, 8900, "5449016a4bdc2d6f028b456f", 2, "5b5f724186f77447ed5636ad", 11392, true);
    addidtot(muzzleTtmafiaid, "5a7c2eca46aef81a7ca2145d", 3, 21000, "5449016a4bdc2d6f028b456f", 3, "5b5f72f786f77447ec5d7702", 26800, true);
    addidtot(barrelTt33Mafiaid, "5a7c2eca46aef81a7ca2145d", 3, 12000, "5449016a4bdc2d6f028b456f", 1, "5b5f75c686f774094242f19f", 15360, true);
    addidtot(mountTt33Shortid, "5a7c2eca46aef81a7ca2145d", 3, 3400, "5449016a4bdc2d6f028b456f", 1, "5b5f755f86f77447ec5d770e", 4352, true);
    addidtot(mountTt33nrmid, "58330581ace78e27b8b10cee", 3, 2000, "5449016a4bdc2d6f028b456f", 1, "5b5f755f86f77447ec5d770e", 2560, true);
    addidtot(mountTt33nrmRailid, "58330581ace78e27b8b10cee", 2, 8000, "5449016a4bdc2d6f028b456f", 2, "5b5f755f86f77447ec5d770e", 10240, true);
    addidtot(mountTt33nrmDecoid, "58330581ace78e27b8b10cee", 2, 4600, "5449016a4bdc2d6f028b456f", 1, "5b5f755f86f77447ec5d770e", 5888, true);
    addidtot(pistolTt33Khyberid, "5a7c2eca46aef81a7ca2145d", 3, 8500, "5449016a4bdc2d6f028b456f", 1, "5b5f792486f77447ed5636b3", 10880, true);
    addidtot(pistolTt33KhyberGoldid, "5a7c2eca46aef81a7ca2145d", 3, 1, "5b3b713c5acfc4330140bd8d", 1, "5b5f792486f77447ed5636b3", 110000, false);
    addidtot(pistolType54id, "5a7c2eca46aef81a7ca2145d", 3, 5, "571a12c42459771f627b58a0", 1, "5b5f792486f77447ed5636b3", 40000, false);
    addidtot(magTt33Longid, "5a7c2eca46aef81a7ca2145d", 10, 2380, "5449016a4bdc2d6f028b456f", 1, "5b5f754a86f774094242f19b", 3046, true);
    addidtot(magTt33Tacid, "5a7c2eca46aef81a7ca2145d", 10, 3380, "5449016a4bdc2d6f028b456f", 1, "5b5f754a86f774094242f19b", 4326, true);
    addidtot(magTt33Drumid, "5a7c2eca46aef81a7ca2145d", 3, 23000, "5449016a4bdc2d6f028b456f", 2, "5b5f754a86f774094242f19b", 35260, true);
    addidtot(barrelAkid, "5a7c2eca46aef81a7ca2145d", 3, 12000, "5449016a4bdc2d6f028b456f", 1, "5b5f75c686f774094242f19f", 15360, true);
    addidtot(adapterAkid, "5a7c2eca46aef81a7ca2145d", 3, 2000, "5449016a4bdc2d6f028b456f", 1, "5b5f75c686f774094242f19f", 2560, true);
    // ---------- 프리셋 등록 ----------
    function generateRandomID() {
        const hexChars = "0123456789abcdefABCDEF";
        let result = "";
        for (let i = 0; i < 24; i++) {
            result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
        }
        return result;
    }
    function addPreset(preset, makingChangeOnExistingPreset = false) {
        if (!makingChangeOnExistingPreset) {
            tables.globals.ItemPresets[preset._id] = preset;
        }
    }
    const tt33kmid = [];
    const tt33kgmid = [];
    const type54mid = [];
    for (let i = 0; i < 5; i++) {
        tt33kmid.push(generateRandomID());
        tt33kgmid.push(generateRandomID());
        type54mid.push(generateRandomID());
    }
    const tt33kp = {
        _id: tt33kmid[0],
        _type: "Preset",
        _changeWeaponName: false,
        _name: "TT Kv Default",
        _parent: tt33kmid[1],
        _encyclopedia: pistolTt33Khyberid,
        _items: [
            { _id: tt33kmid[1], _tpl: pistolTt33Khyberid },
            { _id: tt33kmid[2], _tpl: "571a26d524597720680fbe8a", parentId: tt33kmid[1], slotId: "mod_barrel" },
            { _id: tt33kmid[3], _tpl: "571a282c2459771fb2755a69", parentId: tt33kmid[1], slotId: "mod_pistol_grip" },
            { _id: tt33kmid[4], _tpl: "571a29dc2459771fb2755a6a", parentId: tt33kmid[1], slotId: "mod_magazine" }
        ]
    };
    const tt33kgp = {
        _id: tt33kgmid[0],
        _type: "Preset",
        _changeWeaponName: false,
        _name: "Gold TT Kv Default",
        _parent: tt33kgmid[1],
        _encyclopedia: pistolTt33KhyberGoldid,
        _items: [
            { _id: tt33kgmid[1], _tpl: pistolTt33KhyberGoldid },
            { _id: tt33kgmid[2], _tpl: "5b3baf8f5acfc40dc5296692", parentId: tt33kgmid[1], slotId: "mod_barrel" },
            { _id: tt33kgmid[3], _tpl: "5b3cadf35acfc400194776a0", parentId: tt33kgmid[1], slotId: "mod_pistol_grip" },
            { _id: tt33kgmid[4], _tpl: "571a29dc2459771fb2755a6a", parentId: tt33kgmid[1], slotId: "mod_magazine" }
        ]
    };
    const type54p = {
        _id: type54mid[0],
        _type: "Preset",
        _changeWeaponName: false,
        _name: "Type 54 Default",
        _parent: type54mid[1],
        _encyclopedia: pistolType54id,
        _items: [
            { _id: type54mid[1], _tpl: pistolType54id },
            { _id: type54mid[2], _tpl: "571a26d524597720680fbe8a", parentId: type54mid[1], slotId: "mod_barrel" },
            { _id: type54mid[3], _tpl: gripType54id, parentId: type54mid[1], slotId: "mod_pistol_grip" },
            { _id: type54mid[4], _tpl: "571a29dc2459771fb2755a6a", parentId: type54mid[1], slotId: "mod_magazine" }
        ]
    };
    addPreset(tt33kp);
    addPreset(tt33kgp);
    addPreset(type54p);
    // ---------- 퀘스트 & 마스터리 ----------
    const questTemplates = tables.templates.quests;
    for (const id in questTemplates) {
        if (questTemplates[id]._id === "596b455186f77457cb50eccb") {
            const cond = questTemplates[id].conditions.AvailableForFinish[0].counter.conditions[0];
            cond.weapon.push(pistolTt33Khyberid);
            cond.weapon.push(pistolTt33KhyberGoldid);
            cond.weapon.push(pistolType54id);
        }
    }
    for (const slot of mastering) {
        if (slot.Name === "TT") {
            slot.Level2 = 100;
            slot.Level3 = 125;
            slot.Templates.push(pistolTt33Khyberid);
            slot.Templates.push(pistolTt33KhyberGoldid);
            slot.Templates.push(pistolType54id);
        }
    }
    // ---------- 로케일 주입 (tt33k/db/locales/global) ----------
    const modRoot = path.resolve(__dirname, "..");
    const ttRoot = path.join(modRoot, "tt33k", "db");
    const localesRoot = path.join(ttRoot, "locales", "global");
    const enItemids = loadItemidsForLang(localesRoot, "en");
    if (enItemids) {
        for (const locale of locales) {
            for (const [idIndex, idName] of Object.entries(enItemids)) {
                for (const [des, value] of Object.entries(idName)) {
                    locale[`${idIndex} ${des}`] = value;
                }
            }
        }
    }
    const availableLangs = Object.keys(tables.locales.global);
    for (const localeID of availableLangs) {
        if (localeID === "en") {
            continue;
        }
        const langItemids = loadItemidsForLang(localesRoot, localeID);
        if (!langItemids) {
            continue;
        }
        const targetLocale = tables.locales.global[localeID];
        for (const [idIndex, idName] of Object.entries(langItemids)) {
            for (const [des, value] of Object.entries(idName)) {
                targetLocale[`${idIndex} ${des}`] = value;
            }
        }
    }
}
function loadNervexInjectionFiles(nervRoot) {
    const results = [];
    function walk(dir) {
        if (!fs.existsSync(dir))
            return;
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                walk(full);
            }
            else if (name.toLowerCase().endsWith(".json")) {
                const raw = fs.readFileSync(full, "utf-8");
                try {
                    results.push(JSON.parse(raw));
                }
                catch (e) {
                    console.error(`[Nervex] Failed to parse ${full}:`, e);
                }
            }
        }
    }
    walk(nervRoot);
    return results;
}
function isCorrectNervexInjection(obj) {
    return obj && obj.overwriteProperties !== undefined;
}
function processNervexInjectionItemTemplate(customInjection, items, jsonUtil, tables) {
    // 1) 슬롯 추가 (slotsToAdd)
    if (customInjection.slotsToAdd) {
        customInjection.slotsToAdd.targetID.forEach((value, index) => {
            const baseItem = items[value];
            if (!baseItem?._props?.Slots)
                return;
            const slotName = customInjection.slotsToAdd.slotName[index];
            const slot = baseItem._props.Slots.find((s) => s._name === slotName);
            if (slot && slot._props?.filters?.[0]?.Filter) {
                slot._props.filters[0].Filter.push(customInjection.overwriteProperties.newId);
            }
        });
    }
    // 2) 핸드북 추가
    tables.templates.handbook.Items.push({
        "Id": customInjection.overwriteProperties.newId,
        "ParentId": customInjection.overwriteProperties.handbookParentId,
        "Price": customInjection.overwriteProperties.handbookPriceRoubles
    });
    // 3) 아이템 템플릿 클론 + overrideProperties
    if (customInjection.overwriteProperties) {
        const srcTpl = customInjection.overwriteProperties.itemTplToClone;
        const newId = customInjection.overwriteProperties.newId;
        const newItem = jsonUtil.clone(items[srcTpl]);
        newItem._id = newId;
        const override = customInjection.overwriteProperties.overrideProperties;
        if (override && typeof override === "object") {
            for (const [key, value] of Object.entries(override)) {
                if (key in items[srcTpl]._props) {
                    newItem._props[key] = value;
                }
                else {
                    console.log("[Nervex] Key %s not found in item %s", key, customInjection.overwriteProperties.itemTplToClone);
                }
            }
            items[newId] = newItem;
        }
        else {
            console.log("[Nervex] overrideProperties is not an object or is null/undefined");
        }
    }
    // 4) 상인 등록 (traderToAdd)
    if (customInjection.traderToAdd?.traderID) {
        const trader = tables.traders[customInjection.traderToAdd.traderID];
        if (trader) {
            const newId = customInjection.overwriteProperties.newId;
            trader.assort.items.push({
                "_id": newId,
                "_tpl": newId,
                "parentId": "hideout",
                "slotId": "hideout",
                "upd": {
                    "UnlimitedCount": false,
                    "StackObjectsCount": customInjection.traderToAdd.BuyRestrictionMax * 11,
                    "BuyRestrictionMax": customInjection.traderToAdd.BuyRestrictionMax,
                    "BuyRestrictionCurrent": 0
                }
            });
            let traderCurrencyTpl = customInjection.traderToAdd.barter_scheme;
            switch (traderCurrencyTpl) {
                case "ROUBLES":
                    traderCurrencyTpl = "5449016a4bdc2d6f028b456f";
                    break;
                case "DOLLARS":
                    traderCurrencyTpl = "5696686a4bdc2da3298b456a";
                    break;
                case "EUROS":
                    traderCurrencyTpl = "569668774bdc2da2298b4568";
                    break;
                default:
                    break;
            }
            trader.assort.barter_scheme[newId] = [
                [{
                        "count": customInjection.traderToAdd.barter_scheme_value,
                        "_tpl": traderCurrencyTpl
                    }]
            ];
            trader.assort.loyal_level_items[newId] = customInjection.traderToAdd.loyal_level_items;
        }
    }
    // 5) 챔버에 탄약 추가 (chamberToAdd)
    if (customInjection.chamberToAdd) {
        customInjection.chamberToAdd.weaponID.forEach((weaponId) => {
            const weapon = items[weaponId];
            if (weapon?._props?.Chambers?.[0]?._props?.filters?.[0]?.Filter) {
                weapon._props.Chambers[0]._props.filters[0].Filter.push(customInjection.overwriteProperties.newId);
            }
        });
    }
    // 6) 탄창에 탄약 추가 (catridgeToAdd)
    if (customInjection.catridgeToAdd) {
        customInjection.catridgeToAdd.magazineID.forEach((magId) => {
            const mag = items[magId];
            if (mag?._props?.Cartridges?.[0]?._props?.filters?.[0]?.Filter) {
                mag._props.Cartridges[0]._props.filters[0].Filter.push(customInjection.overwriteProperties.newId);
            }
        });
    }
}
function applyNervexExtension(container) {
    const databaseServer = container.resolve("DatabaseServer");
    const tables = databaseServer.getTables();
    const items = tables.templates.items;
    const jsonUtil = container.resolve("JsonUtil");
    const modRoot = path.resolve(__dirname, "..");
    const nervRoot = path.join(modRoot, "nervex", "db");
    // 1) nerv_inv 커스텀 아이템 로딩
    const nervInvRoot = path.join(nervRoot, "nerv_inv");
    const customItemsArray = loadNervexInjectionFiles(nervInvRoot);
    if (Array.isArray(customItemsArray)) {
        for (const item of customItemsArray) {
            if (!isCorrectNervexInjection(item)) {
                console.error("[Nervex] Invalid injection file:", item);
                continue;
            }
            processNervexInjectionItemTemplate(item, items, jsonUtil, tables);
        }
    }
    else {
        console.error("[Nervex] customItemsArray is not an array");
    }
    // 2) 로케일 주입 (nervex/db/locales/global)
    const localesRoot = path.join(nervRoot, "locales", "global");
    // 2-1) en 기준으로 모든 언어에 기본 텍스트 깔기
    const enItemids = loadItemidsForLang(localesRoot, "en");
    if (enItemids) {
        const allLocales = Object.values(tables.locales.global);
        for (const locale of allLocales) {
            for (const [idIndex, idName] of Object.entries(enItemids)) {
                for (const [des, value] of Object.entries(idName)) {
                    locale[`${idIndex} ${des}`] = value;
                }
            }
        }
    }
    // 2-2) 언어별 itemids 파일 있으면 그 언어 텍스트로 덮어쓰기
    const availableLangs = Object.keys(tables.locales.global);
    for (const langId of availableLangs) {
        if (langId === "en") {
            continue;
        }
        const langItemids = loadItemidsForLang(localesRoot, langId);
        if (!langItemids) {
            continue;
        }
        const targetLocale = tables.locales.global[langId];
        for (const [idIndex, idName] of Object.entries(langItemids)) {
            for (const [des, value] of Object.entries(idName)) {
                targetLocale[`${idIndex} ${des}`] = value;
            }
        }
    }
}
module.exports = { mod: new Mod() };
//# sourceMappingURL=mod.js.map