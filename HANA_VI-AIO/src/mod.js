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
class Mod {
    mod;
    cfg = require("../config.json");
    constructor() {
        this.mod = "HANA-VI's All In One";
    }
    postDBLoad(container) {
        const jsonUtil = container.resolve("JsonUtil");
        const database = container.resolve("DatabaseServer");
        const tables = database.getTables();
        const items = tables.templates.items;
        const handbook = tables.templates.handbook;
        const modLoader = container.resolve("PreSptModLoader");
        const logger = container.resolve("WinstonLogger");
        const modPath = modLoader.getModPath("HANA-VI_AIO") + "db/";
        const modLocalesPath = path.join(modPath, "locales/global/");
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
        if (this.cfg.ar_firerate_change) {
            logger.info("HANAVI's All In One [ar_firerate_change] Loading...");
            //aks-74u
            aks74u._props.bFirerate = 735;
            //aks-74un
            aks74un._props.bFirerate = 735;
            //aks-74ub
            aks74ub._props.bFirerate = 735;
            //ak-101
            ak101._props.bFirerate = 700;
            //ak-102
            ak102._props.bFirerate = 675;
            //ak-103
            ak103._props.bFirerate = 625;
            //ak-104
            ak104._props.bFirerate = 625;
            //ak-105
            ak105._props.bFirerate = 675;
            //ak-74m
            ak74m._props.bFirerate = 700;
            //rpk-16
            rpk16._props.bFirerate = 725;
            //ak-12
            ak12._props.bFirerate = 750;
            //ak-74/ak-74n/aks-74/aks-74n
            ak74._props.bFirerate = 675;
            ak74n._props.bFirerate = 675;
            aks74._props.bFirerate = 675;
            aks74n._props.bFirerate = 675;
            //vpo136
            vpo136._props.weapFireType.push("fullauto");
            vpo136._props.bFirerate = 550;
            //vpo209
            vpo209._props.weapFireType.push("fullauto");
            vpo209._props.bFirerate = 450;
            //sag ak 545 long changes
            ak545long._props.weapFireType.push("fullauto");
            ak545long._props.bFirerate = 625;
            //sag ak 545 short changes
            ak545short._props.weapFireType.push("fullauto");
            ak545short._props.bFirerate = 625;
            //rd-704
            rd704._props.bFirerate = 650;
            //mk47
            mk47._props.bFirerate = 675;
            //scar-l
            scarl._props.bFirerate = 700;
            scarlfde._props.bFirerate = 700;
            //mdr 5.56
            mdr556._props.bFirerate = 675;
            //aug a3
            auga3._props.bFirerate = 725;
            //adar 2-15
            adar215._props.bFirerate = 600;
            //tx-15
            tx15._props.weapFireType.push("fullauto");
            tx15._props.bFirerate = 700;
            //vsk94
            vsk94._props.bFirerate = 850;
            //9a-91
            x9a91._props.bFirerate = 850;
            //scarh
            scarh._props.bFirerate = 650;
            scarhfde._props.bFirerate = 650;
            //xm7(MCX Spear)
            xm7._props.bFirerate = 750;
            logger.info("HANAVI's All In One [ar_firerate_change] Loaded successfully.");
        }
        if (this.cfg.smg_firerate_change) {
            logger.info("HANAVI's All In One [smg_firerate_change] Loading...");
            //vector 9x19
            vector919._props.bFirerate = 1200;
            //ump45
            ump45._props.bFirerate = 700;
            //stm-9
            stm9._props.weapFireType.push("fullauto");
            stm9._props.bFirerate = 775;
            //pp-19-01
            pp1901._props.bFirerate = 750;
            //saiga-9
            saiga9._props.weapFireType.push("fullauto");
            saiga9._props.bFirerate = 700;
            //sr-2
            sr2._props.bFirerate = 900;
            logger.info("HANAVI's All In One [smg_firerate_change] Loaded successfully.");
        }
        if (this.cfg.dmr_firerate_change) {
            logger.info("HANAVI's All In One [dmr_firerate_change] Loading...");
            //vss
            vss._props.bFirerate = 875;
            //m1a
            m1a._props.weapFireType.push("fullauto");
            m1a._props.bFirerate = 700;
            //sr-25
            sr25._props.weapFireType.push("fullauto");
            sr25._props.bFirerate = 700;
            //g28
            //g28._props.Chambers[0]._props.filters[0].Filter.push(...x68_51mm);
            g28._props.weapFireType.push("fullauto");
            g28._props.bFirerate = 625;
            //rsass
            rsass._props.weapFireType.push("fullauto");
            rsass._props.bFirerate = 600;
            logger.info("HANAVI's All In One [dmr_firerate_change] Loaded successfully.");
        }
        if (this.cfg.shotgun_firerate_change) {
            logger.info("HANAVI's All In One [shotgun_firerate_change] Loading...");
            saiga12._props.weapFireType.push("fullauto");
            saiga12._props.bFirerate = 600;
            logger.info("HANAVI's All In One [shotgun_firerate_change] Loaded successfully.");
        }
        if (this.cfg.vpo215_can_use_762x39mm) {
            logger.info("HANAVI's All In One [vpo215_can_use_762x39mm] Loading...");
            vpo215._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            const vpo215mag = tables.templates.items["5de653abf76fdc1ce94a5a2a"];
            vpo215mag._props.Cartridges[0]._props.filters[0].Filter.push(...m43);
            logger.info("HANAVI's All In One [vpo215_can_use_762x39mm] Loaded successfully.");
        }
        if (this.cfg.adar_can_use_300blk) {
            logger.info("HANAVI's All In One [adar_can_use_300blk] Loading...");
            adar215._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            adar215._props.weapFireType.push("fullauto");
            logger.info("HANAVI's All In One [adar_can_use_300blk] Loaded successfully.");
        }
        if (this.cfg.sks_can_use_366tkm) {
            logger.info("HANAVI's All In One [sks_can_use_366tkm] Loading...");
            sks._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            opsks._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            logger.info("HANAVI's All In One [sks_can_use_366tkm] Loaded successfully.");
        }
        if (this.cfg.stm_can_use_45acp) {
            logger.info("HANAVI's All In One [stm_can_use_45acp] Loading...");
            const vector45mag = [
                "5fb651b52b1b027b1f50bcff",
                "5fb651dc85f90547f674b6f4"
            ];
            stm9._props.Slots[1]._props.filters[0].Filter.push(...vector45mag);
            stm9._props.Chambers[0]._props.filters[0].Filter.push(...x45acp);
            logger.info("HANAVI's All In One [stm_can_use_45acp] Loaded successfully.");
        }
        if (this.cfg.rpd_tacticalkit) {
            logger.info("HANAVI's All In One [rpd_tacticalkit] Loading...");
            const addrpd = [
                "6513ef33e06849f06c0957ca",
                "65268d8ecb944ff1e90ea385"
            ];
            const handguards_rpd = [
                "6491c6f6ef312a876705191b"
            ];
            for (const i in addrpd)
                for (const slot in items[addrpd[i]]._props.Slots)
                    if (items[addrpd[i]]._props.Slots[slot]._name == "mod_handguard")
                        items[addrpd[i]]._props.Slots[slot]._props.filters[0].Filter.push(...handguards_rpd);
            const rearsight_mount = [
                "5c064c400db834001d23f468",
                "5addbffe5acfc4001714dfac"
            ];
            for (const i in addrpd)
                for (const slot in items[addrpd[i]]._props.Slots)
                    if (items[addrpd[i]]._props.Slots[slot]._name == "mod_sight_rear")
                        items[addrpd[i]]._props.Slots[slot]._props.filters[0].Filter.push(...rearsight_mount);
            const addrpdbarrel = [
                "6513eff1e06849f06c0957d4",
                "65266fd43341ed9aa903dd56"
            ];
            const muzzle_m43 = [
                "59d64fc686f774171b243fe2",
                "5a0d716f1526d8000d26b1e2",
                "5f633f68f5750b524b45f112",
                "5c878ebb2e2216001219d48a",
                "59e61eb386f77440d64f5daf",
                "59e8a00d86f7742ad93b569c",
                "5a9ea27ca2750c00137fa672",
                "5cc9ad73d7f00c000e2579d4",
                "5c7951452e221644f31bfd5c",
                "615d8e9867085e45ef1409c6",
                "5a0abb6e1526d8000a025282",
                "59bffc1f86f77435b128b872",
                "593d489686f7745c6255d58a",
                "5a0d63621526d8dba31fe3bf",
                "5a9fbacda2750c00141e080f",
                "64942bfc6ee699f6890dff95"
            ];
            for (const i in addrpdbarrel)
                for (const slot in items[addrpdbarrel[i]]._props.Slots)
                    if (items[addrpdbarrel[i]]._props.Slots[slot]._name == "mod_muzzle")
                        items[addrpdbarrel[i]]._props.Slots[slot]._props.filters[0].Filter.push(...muzzle_m43);
            for (let item in items) {
                if (items[item]._id === "6513f037e06849f06c0957d7") //rpd bipod
                 {
                    items[item]._props.ConflictingItems = [];
                }
            }
            logger.info("HANAVI's All In One [rpd_tacticalkit] Loaded successfully.");
        }
        if (this.cfg.vss_6p29m_mount_can_use_wmx200) {
            logger.info("HANAVI's All In One [vss_6p29m_mount_can_use_wmx200] Loading...");
            const vss_6p29m = [
                "59eb7ebe86f7740b373438ce"
            ];
            const wmx200 = [
                "626becf9582c3e319310b837"
            ];
            for (const i in vss_6p29m)
                for (const slot in items[vss_6p29m[i]]._props.Slots)
                    if (items[vss_6p29m[i]]._props.Slots[slot]._name == "mod_tactical_000" || "mod_tactical_001")
                        items[vss_6p29m[i]]._props.Slots[slot]._props.filters[0].Filter.push(...wmx200);
            logger.info("HANAVI's All In One [vss_6p29m_mount_can_use_wmx200] Loaded successfully.");
        }
        if (this.cfg.g28_can_use_arstocktube) {
            logger.info("HANAVI's All In One [g28_can_use_arstocktube] Loading...");
            const g28a = [
                "6176aca650224f204c1da3fb"
            ];
            const arstocktube = [
                "5649be884bdc2d79388b4577",
                "5d120a10d7ad1a4e1026ba85",
                "5b0800175acfc400153aebd4",
                "602e3f1254072b51b239f713",
                "5c793fb92e221644f31bfb64",
                "5c793fc42e221600114ca25d",
                "638de3603a1a4031d8260b8c"
            ];
            for (const i in g28a)
                for (const slot in items[g28a[i]]._props.Slots)
                    if (items[g28a[i]]._props.Slots[slot]._name == "mod_stock")
                        items[g28a[i]]._props.Slots[slot]._props.filters[0].Filter.push(...arstocktube);
            logger.info("HANAVI's All In One [g28_can_use_arstocktube] Loaded successfully.");
        }
        if (this.cfg.dvl_660mm_can_use_muzzledevice) {
            logger.info("HANAVI's All In One [dvl_660mm_can_use_muzzledevice] Loading...");
            const dvl660mm = [
                "5888956924597752983e182d"
            ];
            const sr25muzzle = [
                "612e0d3767085e45ef14057f",
                "5b7d693d5acfc43bca706a3d",
                "5a34fd2bc4a282329a73b4c5",
                "6065c6e7132d4d12c81fd8e1",
                "5d1f819086f7744b355c219b",
                "5dcbe965e4ed22586443a79d",
                "5d026791d7ad1a04a067ea63",
                "5dfa3cd1b33c0951220c079b",
                "6130c43c67085e45ef1405a1",
                "5cdd7685d7f00c000f260ed2",
                "5c878e9d2e2216000f201903",
                "5d02677ad7ad1a04a15c0f95",
                "5bbdb8bdd4351e4502011460",
                "5cdd7693d7f00c0010373aa5",
                "607ffb988900dc2d9a55b6e4",
                "615d8eb350224f204c1da1cf",
                "612e0e3c290d254f5e6b291d",
                "5d443f8fa4b93678dd4a01aa",
                "5c7954d52e221600106f4cc7",
                "5fbc22ccf24b94483f726483",
                "59bffc1f86f77435b128b872",
                "5cf78496d7f00c065703d6ca",
                "5fbe7618d6fa9c00c571bb6c",
                "628a66b41d5e41750e314f34"
            ];
            for (const i in dvl660mm)
                for (const slot in items[dvl660mm[i]]._props.Slots)
                    if (items[dvl660mm[i]]._props.Slots[slot]._name == "mod_muzzle")
                        items[dvl660mm[i]]._props.Slots[slot]._props.filters[0].Filter.push(...sr25muzzle);
            logger.info("HANAVI's All In One [dvl_660mm_can_use_muzzledevice] Loaded successfully.");
        }
        if (this.cfg.super_plates) {
            logger.info("HANAVI's All In One [super_plates] Loading...");
            for (let item in items) {
                if (items[item]._parent === "644120aa86ffbe10ee032b6f") //plate
                 {
                    items[item]._props.ArmorMaterial = "Aramid";
                    items[item]._props.ArmorType = "Heavy";
                    items[item]._props.Durability = 50;
                    items[item]._props.MaxDurability = 50;
                }
            }
            logger.info("HANAVI's All In One [super_plates] Loaded successfully.");
        }
        if (this.cfg.no_mount_extrasize) {
            logger.info("HANAVI's All In One [no_mount_extrasize] Loading...");
            for (let item in items) {
                if (items[item]._parent === "55818b224bdc2dde698b456f") //mount
                 {
                    items[item]._props.ExtraSizeLeft = 0;
                    items[item]._props.ExtraSizeRight = 0;
                    items[item]._props.ExtraSizeUp = 0;
                    items[item]._props.ExtraSizeDown = 0;
                }
            }
            logger.info("HANAVI's All In One [no_mount_extrasize] Loaded successfully.");
        }
        if (this.cfg.planting_items_can_insert_dogtagcase) {
            logger.info("HANAVI's All In One [planting_items_can_insert_dogtagcase] Loading...");
            const dogtagcase = [
                "5c093e3486f77430cb02e593"
            ];
            const planting_items = [
                "5991b51486f77447b112d44f",
                "5ac78a9b86f7741cca0bbd8d",
                "544fb5454bdc2df8738b456a",
                "5b4391a586f7745321235ab2"
            ];
            for (const i in dogtagcase)
                for (const grid in items[dogtagcase[i]]._props.Grids)
                    items[dogtagcase[i]]._props.Grids[grid]._props.filters[0].Filter.push(...planting_items);
            logger.info("HANAVI's All In One [planting_items_can_insert_dogtagcase] Loaded successfully.");
        }
        if (this.cfg.a556_stanag_guns_can_use_g36_mags) {
            logger.info("HANAVI's All In One [a556_stanag_guns_can_use_g36_mags] Loading...");
            const stanag = [
                "5447a9cd4bdc2dbd208b4567",
                "5bb2475ed4351e00853264e3",
                "5fbcc1d9016cce60e8341ab3",
                "5c07c60e0db834002330051f",
                "5d43021ca4b9362eab4b5e25",
                "5c488a752e221602b412af63",
                "6184055050224f204c1da540",
                "618428466ef05c2ce828f218"
            ];
            const g36mag = [
                "62307b7b10d2321fa8741921"
            ];
            for (const i in stanag)
                for (const slot in items[stanag[i]]._props.Slots)
                    if (items[stanag[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[stanag[i]]._props.Slots[slot]._props.filters[0].Filter.push(...g36mag);
            logger.info("HANAVI's All In One [a556_stanag_guns_can_use_g36_mags] Loaded successfully.");
        }
        if (this.cfg.mk17_can_use_some_762_mags) {
            logger.info("HANAVI's All In One [mk17_can_use_some_762_mags] Loading...");
            const mk17 = [
                "6165ac306ef05c2ce828ef74",
                "6183afd850224f204c1da514",
                "6176aca650224f204c1da3fb" //g28
            ];
            const mk17mags = [
                "5df8f535bb49d91fb446d6b0",
                "5df8f541c41b2312ea3335e3",
                "5a3501acc4a282000d72293a",
                "65293c38fc460e50a509cb25",
                "65293c7a17e14363030ad308"
            ];
            for (const i in mk17)
                for (const slot in items[mk17[i]]._props.Slots)
                    if (items[mk17[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[mk17[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mk17mags);
            logger.info("HANAVI's All In One [mk17_can_use_some_762_mags] Loaded successfully.");
        }
        if (this.cfg.a762_stanag_guns_can_use_mk17_mags) {
            logger.info("HANAVI's All In One [a762_stanag_guns_can_use_mk17_mags] Loading...");
            const ar10 = [
                "5dcbd56fdbd3d91b3e5468d5",
                "65290f395ae2ae97b80fdf2d",
                "5a367e5dc4a282000e49738f",
                "5df8ce05b11454561e39243b",
                "6176aca650224f204c1da3fb"
            ];
            const scar17mags = [
                "618168dc8004cc50514c34fc",
                "6183d53f1cb55961fa0fdcda"
            ];
            for (const i in ar10)
                for (const slot in items[ar10[i]]._props.Slots)
                    if (items[ar10[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[ar10[i]]._props.Slots[slot]._props.filters[0].Filter.push(...scar17mags);
            logger.info("HANAVI's All In One [a762_stanag_guns_can_use_mk17_mags] Loaded successfully.");
        }
        if (this.cfg.mp5k_can_use_mp5_stocks) {
            logger.info("HANAVI's All In One [mp5k_can_use_mp5_stocks] Loading...");
            const mp5kupper = [
                "5d2f261548f03576f500e7b7"
            ];
            const mp5stocks = [
                "5926d3c686f77410de68ebc8",
                "5926d40686f7740f152b6b7e"
            ];
            for (const i in mp5kupper)
                for (const slot in items[mp5kupper[i]]._props.Slots)
                    if (items[mp5kupper[i]]._props.Slots[slot]._name == "mod_stock")
                        items[mp5kupper[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mp5stocks);
            logger.info("HANAVI's All In One [mp5k_can_use_mp5_stocks] Loaded successfully.");
        }
        if (this.cfg.some_mounts_can_use_tactical_device) {
            logger.info("HANAVI's All In One [some_mounts_can_use_tactical_device] Loading...");
            const modscope = [
                "5649a2464bdc2d91118b45a8",
                "5b3b6e495acfc4330140bd88",
                "63fc44e2429a8a166c7f61e6",
                "57adff4f24597737f373b6e6"
            ];
            const tacticaldevice = [
                "5a800961159bd4315e3a1657",
                "57fd23e32459772d0805bcf1",
                "544909bb4bdc2d6f028b4577",
                "5c06595c0db834001a66af6c",
                "5cc9c20cd7f00c001336c65d",
                "5d2369418abbc306c62e0c80",
                "5b07dd285acfc4001754240d",
                "56def37dd2720bec348b456a",
                "5a7b483fe899ef0016170d15",
                "61605d88ffa6e502ac5e7eeb",
                "5a5f1ce64f39f90b401987bc",
                "560d657b4bdc2da74d8b4572",
                "5b3a337e5acfc4704b4a19a0",
                "5c5952732e2216398b5abda2",
                "57d17e212459775a1179a0f5",
                "6267c6396b642f77f56f5c1c",
                "6272370ee4013c5d7e31f418",
                "6272379924e29f06af4d5ecb",
                "626becf9582c3e319310b837",
                "644a3df63b0b6f03e101e065",
                "646f6322f43d0c5d62063715"
            ];
            for (const i in modscope)
                for (const slot in items[modscope[i]]._props.Slots)
                    if (items[modscope[i]]._props.Slots[slot]._name == "mod_scope")
                        items[modscope[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            const modmount = [
                "57ac965c24597706be5f975c",
                "57aca93d2459771f2c7e26db"
            ];
            for (const i in modmount)
                for (const slot in items[modmount[i]]._props.Slots)
                    if (items[modmount[i]]._props.Slots[slot]._name == "mod_mount")
                        items[modmount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            const scope001002 = [
                "5b2389515acfc4771e1be0c0",
                "5aa66c72e5b5b00016327c93",
                "6171407e50224f204c1da3c5",
                "61713cc4d8e3106d9806c109"
            ];
            for (const i in scope001002)
                for (const slot in items[scope001002[i]]._props.Slots)
                    if (items[scope001002[i]]._props.Slots[slot]._name == "mod_scope_001" || "mod_scope_002" || "mod_scope_003")
                        if (items[scope001002[i]]._props.Slots[slot]._props.filters[0].Filter.some(str => str.includes("577d128124597739d65d0e56")))
                            items[scope001002[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            const jp30mm = [
                "5a37ca54c4a282000d72296a"
            ];
            for (const i in jp30mm)
                for (const slot in items[jp30mm[i]]._props.Slots)
                    if (items[jp30mm[i]]._props.Slots[slot]._name == "mod_scope_001")
                        items[jp30mm[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            const geis30mmmount = [
                "618b9682a3884f56c957ca78",
                "618ba92152ecee1505530bd3" //ddc
            ];
            for (const i in geis30mmmount)
                for (const slot in items[geis30mmmount[i]]._props.Slots)
                    if (items[geis30mmmount[i]]._props.Slots[slot]._name == "mod_scope")
                        items[geis30mmmount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            const railgasblock = [
                "56ea8d2fd2720b7c698b4570",
                "5a34fbadc4a28200741e230a"
            ];
            for (const i in railgasblock)
                for (const slot in items[railgasblock[i]]._props.Slots)
                    if (items[railgasblock[i]]._props.Slots[slot]._name == "mod_sight_front")
                        items[railgasblock[i]]._props.Slots[slot]._props.filters[0].Filter.push(...tacticaldevice);
            logger.info("HANAVI's All In One [some_mounts_can_use_tactical_device] Loaded successfully.");
        }
        if (this.cfg.pepr_30mm_mounts_can_use_all_30mm_scope) {
            logger.info("HANAVI's All In One [pepr_30mm_mounts_can_use_all_30mm_scope] Loading...");
            const pepr30mm = [
                "5b2389515acfc4771e1be0c0"
            ];
            const scope30mm = [
                "618ba27d9008e4636a67f61d",
                "617151c1d92c473c770214ab",
                "6567e7681265c8a131069b0f"
            ];
            for (const i in pepr30mm)
                for (const slot in items[pepr30mm[i]]._props.Slots)
                    if (items[pepr30mm[i]]._props.Slots[slot]._name == "mod_scope_000")
                        items[pepr30mm[i]]._props.Slots[slot]._props.filters[0].Filter.push(...scope30mm);
            logger.info("HANAVI's All In One [pepr_30mm_mounts_can_use_all_30mm_scope] Loaded successfully.");
        }
        if (this.cfg.backup_iron_back_slot_can_use_mpr45) {
            logger.info("HANAVI's All In One [backup_iron_back_slot_can_use_mpr45] Loading...");
            const mpr45 = [
                "5649a2464bdc2d91118b45a8"
            ];
            const backupironguns = [
                "5e81ebcd8e146c7080625e15",
                "5ba26383d4351e00334c93d9",
                "5bd70322209c4d00d7167b8f",
                "5a367e5dc4a282000e49738f",
                "5c488a752e221602b412af63",
                "5dcbd56fdbd3d91b3e5468d5",
                "5cadfbf7ae92152ac412eeef",
                "5bfebc530db834001d23eb65",
                "5cde7b43d7f00c000d36b93e",
                "5cc7015ae4a949001152b4c6",
                "5bb20d53d4351e4502010a69",
                "5c0e2f26d174af02a9625114",
                "5c07a8770db8340023300450",
                "55d355e64bdc2d962f8b4569",
                "59bfe68886f7746004266202",
                "5894a5b586f77426d2590767",
                "6529119424cbe3c74a05e5bb",
                "5fbcc3e4d6fa9c00c571bb58",
                "5d4405aaa4b9361e6a4e6bd3",
                "5ab372a310e891001717f0d8",
                "602e63fb6335467b0c5ac94d",
                "5fb64bc92b1b027b1f50bcf2",
                "5fc3f2d5900b1d5091531e57",
                "606587a88900dc2d9a55b659",
                "6165adcdd3a39d50044c120f",
                "6165aeedfaa1272e431521e3",
                "618405198004cc50514c3594",
                "618426d96c780c1e710c9b9f",
                "62e7c8f91cd3fde4d503d690",
                "62811fbf09427b40ab14e767",
                "5cde7b43d7f00c000d36b93e",
                "5bfebc530db834001d23eb65",
                "61713a8fd92c473c770214a4",
                "5fc278107283c4046c581489",
                "5df8e4080b92095fd441e594",
                "60785ce5132d4d12c81fd918",
                "5f2aa49f9b44de6b1b4e68d4"
            ];
            for (const i in backupironguns)
                for (const slot in items[backupironguns[i]]._props.Slots)
                    if (items[backupironguns[i]]._props.Slots[slot]._name == "mod_sight_rear")
                        items[backupironguns[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mpr45);
            logger.info("HANAVI's All In One [backup_iron_back_slot_can_use_mpr45] Loaded successfully.");
        }
        if (this.cfg.tt01_can_use_mpr45) {
            logger.info("HANAVI's All In One [tt01_can_use_mpr45] Loading...");
            const tt01 = [
                "5649d9a14bdc2d79388b4580"
            ];
            const mpr45 = [
                "5649a2464bdc2d91118b45a8"
            ];
            for (const i in tt01)
                for (const slot in items[tt01[i]]._props.Slots)
                    if (items[tt01[i]]._props.Slots[slot]._name == "mod_scope")
                        items[tt01[i]]._props.Slots[slot]._props.filters[0].Filter.push(...mpr45);
            logger.info("HANAVI's All In One [tt01_can_use_mpr45] Loaded successfully.");
        }
        if (this.cfg.smgs_and_shotguns_can_use_30mm_34mm_scopemount) {
            logger.info("HANAVI's All In One [smgs_and_shotguns_can_use_30mm_34mm_scopemount] Loading...");
            const scopemount = [
                "57c69dd424597774c03b7bbc",
                "5b3b99265acfc4704b4a1afb",
                "5a37ca54c4a282000d72296a",
                "618b9643526131765025ab35",
                "618bab21526131765025ab3f",
                "6567e751a715f85433025998",
                "5b2389515acfc4771e1be0c0",
                "6171407e50224f204c1da3c5",
                "62811f461d5df4475f46a332",
                "61713cc4d8e3106d9806c109",
                "5c86592b2e2216000e69e77c",
                "5aa66c72e5b5b00016327c93",
                "5aa66a9be5b5b0214e506e89",
                "5dff77c759400025ea5150cf"
            ];
            const addscopemount = [
                "5ba26383d4351e00334c93d9",
                "5bd70322209c4d00d7167b8f",
                "5cc700ede4a949033c734315",
                "5cc7015ae4a949001152b4c6",
                "5fc3f2d5900b1d5091531e57",
                "5fb64bc92b1b027b1f50bcf2",
                "5fc3e272f8b6a877a729eac5",
                "62e281349ecd3f493f6df954",
                "55d48a634bdc2d8b2f8b456a",
                "5dfe14f30b92095fd441edaf",
                "5a78948ec5856700177b1124"
            ];
            for (const i in addscopemount)
                for (const slot in items[addscopemount[i]]._props.Slots)
                    if (items[addscopemount[i]]._props.Slots[slot]._name == "mod_scope")
                        items[addscopemount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...scopemount);
            logger.info("HANAVI's All In One [smgs_and_shotguns_can_use_30mm_34mm_scopemount] Loaded successfully.");
        }
        if (this.cfg.bit_dt_can_use_some_sights) {
            logger.info("HANAVI's All In One [bit_dt_can_use_some_sights] Loading...");
            const sights = [
                "616584766ef05c2ce828ef57",
                "5c7d55f52e221644f31bff6a",
                "59f9d81586f7744c7506ee62",
                "558022b54bdc2dac148b458d",
                "58491f3324597764bc48fa02",
                "584924ec24597768f12ae244",
                "5d2da1e948f035477b1ce2ba",
                "64785e7c19d732620e045e15",
                "6165ac8c290d254f5e6b2f6c",
                "655f13e0a246670fb0373245",
                "60a23797a37c940de7062d02",
                "6477772ea8a38bb2050ed4db",
                "6478641c19d732620e045e17",
                "5d2dc3e548f035404a1a4798",
                "584984812459776a704a82a6",
                "626bb8532c923541184624b4",
                "609a63b6e2ff132951242d09",
                "5c0505e00db834001b735073",
                "570fd721d2720bc5458b4596",
                "5b30b0dc5acfc400153b7124"
            ];
            const bitdtmount = [
                "638db77630c4240f9e06f8b6"
            ];
            for (const i in bitdtmount)
                for (const slot in items[bitdtmount[i]]._props.Slots)
                    if (items[bitdtmount[i]]._props.Slots[slot]._name == "mod_scope")
                        items[bitdtmount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...sights);
            logger.info("HANAVI's All In One [bit_dt_can_use_some_sights] Loaded successfully.");
        }
        if (this.cfg.svt40_custom_mount) {
            logger.info("HANAVI's All In One [svt40_custom_mount] Loading...");
            const svt40customid = "AA01ad4786f774505619AD75";
            const svt40custom = jsonUtil.clone(items["641dc35e19604f20c800be18"]);
            svt40custom._id = svt40customid;
            items[svt40customid] = svt40custom;
            svt40custom._props.Prefab.path = "hanavi/mount_SVT40_custom.bundle";
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
                svt40customid
            ];
            for (const i in addmount)
                for (const slot in items[addmount[i]]._props.Slots)
                    if (items[addmount[i]]._props.Slots[slot]._name == "mod_scope")
                        items[addmount[i]]._props.Slots[slot]._props.filters[0].Filter.push(...scopes);
            const svt40 = [
                "643ea5b23db6f9f57107d9fd"
            ];
            for (const i in svt40)
                for (const slot in items[svt40[i]]._props.Slots)
                    if (items[svt40[i]]._props.Slots[slot]._name == "mod_scope")
                        items[svt40[i]]._props.Slots[slot]._props.filters[0].Filter.push(...addmount);
            addidtot(svt40customid, "58330581ace78e27b8b10cee", 5, 7400, "5449016a4bdc2d6f028b456f", 1, "5b5f755f86f77447ec5d770e", 10000, true);
            logger.info("HANAVI's All In One [svt40_custom_mount] Loaded successfully.");
        }
        if (this.cfg.sa58_short_barrels_can_use_any_handguard) {
            logger.info("HANAVI's All In One [sa58_short_barrels_can_use_any_handguard] Loading...");
            for (const key in items) {
                const itm = items[key];
                // 혹시 모를 방지용: itm이나 _props 없는 이상한 항목은 스킵
                if (!itm || !itm._props) {
                    continue;
                }
                if (itm._id === "5b099a765acfc47a8607efe3" ||
                    itm._id === "5b7be1125acfc4001876c0e5") {
                    itm._props.ConflictingItems = [];
                }
            }
            logger.info("HANAVI's All In One [sa58_short_barrels_can_use_any_handguard] Loaded successfully.");
        }
        if (this.cfg.some_rails_can_use_cqr) {
            logger.info("HANAVI's All In One [some_rails_can_use_cqr] Loading...");
            const cqr = [
                "5a7dbfc1159bd40016548fde"
            ];
            const griprails = [
                "5b7be4895acfc400170e2dd5",
                "5b4736b986f77405cb415c10",
                "5b800ebc86f774394e230a90",
                "5b8403a086f7747ff856f4e2",
                "5d15ce51d7ad1a1eff619092",
                "5cf4e3f3d7f00c06595bc7f0",
                "5648ae314bdc2d3d1c8b457f",
                "5cbda392ae92155f3c17c39f",
                "5f6331e097199b7db2128dc2",
                "5c617a5f2e2216000f1e81b3",
                "5648b4534bdc2d3d1c8b4580",
                "5efaf417aeb21837e749c7f2",
                "647dba3142c479dde701b654",
                "647dd2b8a12ebf96c3031655",
                "649ec127c93611967b034957",
                "5d133067d7ad1a33013f95b4",
                "5beec3e30db8340019619424",
                "5bb20dfcd4351e00334c9e24",
                "5b7be1ca5acfc400170e2d2f",
                "5b099a9d5acfc47a8607efe7",
                "5a9d6d21a2750c00137fa649",
                "5a957c3fa2750c00137fa5f7",
                "5a9548c9159bd400133e97b3",
                "5827272a24597748c74bdeea",
                "58272b392459774b4c7b3ccd",
                "55d45f484bdc2d972f8b456d",
                "5a788031c585673f2b5c1c79",
                "5d010d1cd7ad1a59283b1ce7",
                "5d19cd96d7ad1a4a992c9f52",
                "5e5699df2161e06ac158df6f",
                "5f63418ef5750b524b45f116",
                "5b4736b986f77405cb415c10",
                "6388c4ac8d895f557a0c6515",
                "59eb7ebe86f7740b373438ce",
                "5f2aa493cd375f14e15eea72",
                "5fc53954f8b6a877a729eaeb",
                "5fbb976df9986c4cff3fe5f2",
                "5fbb978207e8a97d1f0902d3",
                "653ed19d22e1ef3d9002c328"
            ];
            for (const i in griprails)
                for (const slot in items[griprails[i]]._props.Slots)
                    if (items[griprails[i]]._props.Slots[slot]._name == "mod_foregrip")
                        items[griprails[i]]._props.Slots[slot]._props.filters[0].Filter.push(...cqr);
            logger.info("HANAVI's All In One [some_rails_can_use_cqr] Loaded successfully.");
        }
        if (this.cfg.tatm_can_use_n15) {
            logger.info("HANAVI's All In One [tatm_can_use_n15] Loading...");
            const tatm = [
                "5a16b8a9fcdbcb00165aa6ca"
            ];
            const n15 = [
                "5c066e3a0db834001b7353f0"
            ];
            for (const i in tatm)
                for (const slot in items[tatm[i]]._props.Slots)
                    if (items[tatm[i]]._props.Slots[slot]._name == "mod_nvg")
                        items[tatm[i]]._props.Slots[slot]._props.filters[0].Filter.push(...n15);
            logger.info("HANAVI's All In One [tatm_can_use_n15] Loaded successfully.");
        }
        if (this.cfg.ak_partisan_stock_can_use_more_ak) {
            logger.info("HANAVI's All In One [ak_partisan_stock_can_use_more_ak] Loading...");
            const partisanstock = [
                "66ac9d9740e27931602042d4"
            ];
            const moreak = [
                "5ac4cd105acfc40016339859",
                "5ac66cb05acfc40198510a10",
                "5ac66d015acfc400180ae6e4",
                "5ac66d2e5acfc43b321d4b53",
                "5ac66d725acfc43b321d4b60",
                "5ac66d9b5acfc4001633997a",
                "5bf3e0490db83400196199af",
                "5ab8e9fcd8ce870019439434",
                "57dc2fa62459775949412633",
                "583990e32459771419544dd2",
                "5839a40f24597726f856b511",
                "57c44b372459772d2b39b8ce",
                "576165642459773c7a400233",
                "59f9cabd86f7743a10721f46",
                "59984ab886f7743e98271174"
            ];
            for (const i in moreak)
                for (const slot in items[moreak[i]]._props.Slots)
                    if (items[moreak[i]]._props.Slots[slot]._name == "mod_stock")
                        items[moreak[i]]._props.Slots[slot]._props.filters[0].Filter.push(...partisanstock);
            logger.info("HANAVI's All In One [ak_partisan_stock_can_use_more_ak] Loaded successfully.");
        }
        if (this.cfg.mcx_can_use_223) {
            logger.info("HANAVI's All In One [mcx_can_use_223] Loading...");
            mcx._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            logger.info("HANAVI's All In One [mcx_can_use_223] Loaded successfully.");
        }
        if (this.cfg.vss_val_can_use_more_ammo) {
            logger.info("HANAVI's All In One [vss_val_can_use_more_ammo] Loading...");
            vss._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            vss._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            vss._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            vss._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            vss._props.Chambers[0]._props.filters[0].Filter.push(...m74);
            asval._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            asval._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            asval._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            asval._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            asval._props.Chambers[0]._props.filters[0].Filter.push(...m74);
            sr3m._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            sr3m._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            sr3m._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            sr3m._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            sr3m._props.Chambers[0]._props.filters[0].Filter.push(...m74);
            const vssval_m43mags = [
                "59e5d83b86f7745aed03d262",
                "5a01c29586f77474660c694c",
                "5ac66bea5acfc43b321d4aec",
                "59d625f086f774661516605d",
                "5b1fd4e35acfc40018633c39",
                "5a0060fc86f7745793204432",
                "59e5f5a486f7746c530b3ce2",
                "5b1fb3e15acfc4001637f068",
                "59d6272486f77466146386ff",
                "5e21a3c67e40bd02257a008a",
                "5cbdc23eae9215001136a407",
                "5c6175362e221600133e3b94",
                "59fafc5086f7740dbe19f6c3",
                "59fafc9386f774067d462453",
                "5cfe8010d7ad1a59283b14c6",
                "6272874a6c47bd74f92e2087",
                "64b9cf0ac12b9c38db26923a"
            ];
            const vssval_223mags = [
                "5c0548ae0db834001966a3c2",
                "5ac66c5d5acfc4001718d314",
                "6764139c44b3c96e7b0e2f7b"
            ];
            const vssval_m74mags = [
                "564ca9df4bdc2d35148b4569",
                "564ca99c4bdc2d16268b4589",
                "55d480c04bdc2d1d4e8b456a",
                "5cbdaf89ae9215000e5b9c94",
                "55d481904bdc2d8c2f8b456a",
                "55d482194bdc2d1d4e8b456b",
                "55d4837c4bdc2d1d4e8b456c",
                "5aaa4194e5b5b055d06310a5",
                "5bed61680db834001d2c45ab",
                "5bed625c0db834001c062946",
                "649ec30cb013f04a700e60fb",
                "64b9e265c94d0d15c5027e35"
            ];
            const vss_val = [
                "57838ad32459774a17445cd2", //vss
                "57c44b372459772d2b39b8ce", //as val
                "651450ce0e00edc794068371" //sr-3m
            ];
            for (const i in vss_val)
                for (const slot in items[vss_val[i]]._props.Slots)
                    if (items[vss_val[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[vss_val[i]]._props.Slots[slot]._props.filters[0].Filter.push(...vssval_m43mags);
            for (const i in vss_val)
                for (const slot in items[vss_val[i]]._props.Slots)
                    if (items[vss_val[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[vss_val[i]]._props.Slots[slot]._props.filters[0].Filter.push(...vssval_223mags);
            for (const i in vss_val)
                for (const slot in items[vss_val[i]]._props.Slots)
                    if (items[vss_val[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[vss_val[i]]._props.Slots[slot]._props.filters[0].Filter.push(...vssval_m74mags);
            logger.info("HANAVI's All In One [vss_val_can_use_more_ammo] Loaded successfully.");
        }
        if (this.cfg.aa12_can_use_more_muzzles) {
            logger.info("HANAVI's All In One [aa12_can_use_more_muzzles] Loading...");
            const a12gamuzzles = [
                "5c0111ab0db834001966914d",
                "560838c94bdc2d77798b4569",
                "5b363dea5acfc4771e1c5e7e"
            ];
            const aa12barrels = [
                "670fd03dc424cf758f006946",
                "670fd0a8d8d4eae4790c8187"
            ];
            for (const i in aa12barrels)
                for (const slot in items[aa12barrels[i]]._props.Slots)
                    if (items[aa12barrels[i]]._props.Slots[slot]._name == "mod_muzzle")
                        items[aa12barrels[i]]._props.Slots[slot]._props.filters[0].Filter.push(...a12gamuzzles);
            logger.info("HANAVI's All In One [aa12_can_use_more_muzzles] Loaded successfully.");
        }
        if (this.cfg.hydra_mount_can_use_some_sights) {
            logger.info("HANAVI's All In One [hydra_mount_can_use_some_sights] Loading...");
            const hydramounts = [
                "65392f611406374f82152ba5",
                "653931da5db71d30ab1d6296"
            ];
            const somesights = [
                "5a33b652c4a28232996e407c", // RMR high profile mount (AC32062)
                "58d2664f86f7747fec5834f6", // DeltaPoint Cross Slot Mount base (DPCSM)
                "5a33b2c9c4a282000c5a9511", // Trijicon RMR low profile mount (RM33)
                "577d128124597739d65d0e56", // Burris FastFire Weaver Base (FFWB)
                "615d8d878004cc50514c3233", // B&T QD NAR mount for Aimpoint ACRO (NAR)
                "57ae0171245977343c27bfcf", // BelOMO PK-06 reflex sight
                "609bab8b455afd752b2e6138" // Torrey Pines Logic T12W 30Hz thermal reflex sight (T12W)
            ];
            for (const i in hydramounts)
                for (const slot in items[hydramounts[i]]._props.Slots)
                    if (items[hydramounts[i]]._props.Slots[slot]._name == "mod_scope")
                        items[hydramounts[i]]._props.Slots[slot]._props.filters[0].Filter.push(...somesights);
            logger.info("HANAVI's All In One [hydra_mount_can_use_some_sights] Loaded successfully.");
        }
        if (this.cfg.BAD_can_use_any_upper) {
            logger.info("HANAVI's All In One [BAD_can_use_any_upper] Loading...");
            const BAD = [
                "675307301f7c19a9780f2668"
            ];
            items[BAD]._props.ConflictingItems = [];
            logger.info("HANAVI's All In One [BAD_can_use_any_upper] Loaded successfully.");
        }
        if (this.cfg.uzi_pro_can_use_uzi_mags) {
            logger.info("HANAVI's All In One [uzi_pro_can_use_uzi_mags] Loading...");
            const uzimags = [
                "66992713ae08c5c29e0c4f97",
                "6699271b9950f5f4cd060299",
                "669927203c4fda6471005cbe",
                "66992725ae08c5c29e0c4f9a",
                "6699272a3c4fda6471005cc1",
                "676176a162e0497044079f46"
            ];
            const uzi_pro = [
                "668e71a8dadf42204c032ce1", //smg
                "6680304edadb7aa61d00cef0" //pistol
            ];
            for (const i in uzi_pro)
                for (const slot in items[uzi_pro[i]]._props.Slots)
                    if (items[uzi_pro[i]]._props.Slots[slot]._name == "mod_magazine")
                        items[uzi_pro[i]]._props.Slots[slot]._props.filters[0].Filter.push(...uzimags);
            logger.info("HANAVI's All In One [uzi_pro_can_use_uzi_mags] Loaded successfully.");
        }
        if (this.cfg.uzi_pro_more_barrels) {
            logger.info("HANAVI's All In One [uzi_pro_more_barrels] Loading...");
            const pabarrel = [
                "668031705014e211b4078046"
            ];
            const uzi_pro_smg = [
                "668e71a8dadf42204c032ce1", //smg
            ];
            for (const i in uzi_pro_smg)
                for (const slot in items[uzi_pro_smg[i]]._props.Slots)
                    if (items[uzi_pro_smg[i]]._props.Slots[slot]._name == "mod_barrel")
                        items[uzi_pro_smg[i]]._props.Slots[slot]._props.filters[0].Filter.push(...pabarrel);
            logger.info("HANAVI's All In One [uzi_pro_more_barrels] Loaded successfully.");
        }
        if (this.cfg.velociraptor_can_use_more_ammo) {
            logger.info("HANAVI's All In One [velociraptor_can_use_more_ammo] Loading...");
            velociraptor._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            velociraptor._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            velociraptor._props.Chambers[0]._props.filters[0].Filter.push(...m74);
            velociraptor._props.Chambers[0]._props.filters[0].Filter.push(...x9x39mm);
            velociraptor._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            const velociraptor_m74mags = [
                "564ca9df4bdc2d35148b4569",
                "564ca99c4bdc2d16268b4589",
                "55d480c04bdc2d1d4e8b456a",
                "5cbdaf89ae9215000e5b9c94",
                "55d481904bdc2d8c2f8b456a",
                "55d482194bdc2d1d4e8b456b",
                "55d4837c4bdc2d1d4e8b456c",
                "5aaa4194e5b5b055d06310a5",
                "5bed61680db834001d2c45ab",
                "5bed625c0db834001c062946",
                "649ec30cb013f04a700e60fb",
                "64b9e265c94d0d15c5027e35"
            ];
            const velociraptor_m43mags = [
                "59e5d83b86f7745aed03d262",
                "5a01c29586f77474660c694c",
                "5ac66bea5acfc43b321d4aec",
                "59d625f086f774661516605d",
                "5b1fd4e35acfc40018633c39",
                "5a0060fc86f7745793204432",
                "59e5f5a486f7746c530b3ce2",
                "5b1fb3e15acfc4001637f068",
                "59d6272486f77466146386ff",
                "5e21a3c67e40bd02257a008a",
                "5cbdc23eae9215001136a407",
                "5c6175362e221600133e3b94",
                "59fafc5086f7740dbe19f6c3",
                "59fafc9386f774067d462453",
                "5cfe8010d7ad1a59283b14c6",
                "6272874a6c47bd74f92e2087",
                "64b9cf0ac12b9c38db26923a"
            ];
            const velociraptor_939mags = [
                "57838f0b2459774a256959b2",
                "57838f9f2459774a150289a0",
                "5a9e81fba2750c00164f6b11",
                "65118f531b90b4fc77015083"
            ];
            const velociraptor_gun = [
                "674d6121c09f69dfb201a888"
            ];
            for (const i in velociraptor_gun) {
                for (const slot in items[velociraptor_gun[i]]._props.Slots) {
                    if (items[velociraptor_gun[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[velociraptor_gun[i]]._props.Slots[slot]._props.filters[0].Filter.push(...velociraptor_m74mags);
                    }
                }
            }
            for (const i in velociraptor_gun) {
                for (const slot in items[velociraptor_gun[i]]._props.Slots) {
                    if (items[velociraptor_gun[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[velociraptor_gun[i]]._props.Slots[slot]._props.filters[0].Filter.push(...velociraptor_m43mags);
                    }
                }
            }
            for (const i in velociraptor_gun) {
                for (const slot in items[velociraptor_gun[i]]._props.Slots) {
                    if (items[velociraptor_gun[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[velociraptor_gun[i]]._props.Slots[slot]._props.filters[0].Filter.push(...velociraptor_939mags);
                    }
                }
            }
            logger.info("HANAVI's All In One [velociraptor_can_use_more_ammo] Loaded successfully.");
        }
        if (this.cfg.aks74u_can_use_more_ammo) {
            logger.info("HANAVI's All In One [aks74u_can_use_more_ammo] Loading...");
            aks74u._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            aks74u._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            aks74u._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            aks74u._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            aks74u._props.Chambers[0]._props.filters[0].Filter.push(...x9x39mm);
            aks74un._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            aks74un._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            aks74un._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            aks74un._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            aks74un._props.Chambers[0]._props.filters[0].Filter.push(...x9x39mm);
            aks74ub._props.Chambers[0]._props.filters[0].Filter.push(...m43);
            aks74ub._props.Chambers[0]._props.filters[0].Filter.push(...x366tkm);
            aks74ub._props.Chambers[0]._props.filters[0].Filter.push(...x223);
            aks74ub._props.Chambers[0]._props.filters[0].Filter.push(...x300blk);
            aks74ub._props.Chambers[0]._props.filters[0].Filter.push(...x9x39mm);
            const aks74u_223mags = [
                "5c0548ae0db834001966a3c2",
                "5ac66c5d5acfc4001718d314",
                "6764139c44b3c96e7b0e2f7b"
            ];
            const aks74u_m43mags = [
                "59e5d83b86f7745aed03d262",
                "5a01c29586f77474660c694c",
                "5ac66bea5acfc43b321d4aec",
                "59d625f086f774661516605d",
                "5b1fd4e35acfc40018633c39",
                "5a0060fc86f7745793204432",
                "59e5f5a486f7746c530b3ce2",
                "5b1fb3e15acfc4001637f068",
                "59d6272486f77466146386ff",
                "5e21a3c67e40bd02257a008a",
                "5cbdc23eae9215001136a407",
                "5c6175362e221600133e3b94",
                "59fafc5086f7740dbe19f6c3",
                "59fafc9386f774067d462453",
                "5cfe8010d7ad1a59283b14c6",
                "6272874a6c47bd74f92e2087",
                "64b9cf0ac12b9c38db26923a"
            ];
            const aks74u_939mags = [
                "57838f0b2459774a256959b2",
                "57838f9f2459774a150289a0",
                "5a9e81fba2750c00164f6b11",
                "65118f531b90b4fc77015083"
            ];
            const aks74u_family = [
                "57dc2fa62459775949412633", //AKS-74U
                "583990e32459771419544dd2", //AKS-74UN
                "5839a40f24597726f856b511" //AKS-74UB
            ];
            for (const i in aks74u_family) {
                for (const slot in items[aks74u_family[i]]._props.Slots) {
                    if (items[aks74u_family[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[aks74u_family[i]]._props.Slots[slot]._props.filters[0].Filter.push(...aks74u_223mags);
                    }
                }
            }
            for (const i in aks74u_family) {
                for (const slot in items[aks74u_family[i]]._props.Slots) {
                    if (items[aks74u_family[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[aks74u_family[i]]._props.Slots[slot]._props.filters[0].Filter.push(...aks74u_m43mags);
                    }
                }
            }
            for (const i in aks74u_family) {
                for (const slot in items[aks74u_family[i]]._props.Slots) {
                    if (items[aks74u_family[i]]._props.Slots[slot]._name == "mod_magazine") {
                        items[aks74u_family[i]]._props.Slots[slot]._props.filters[0].Filter.push(...aks74u_939mags);
                    }
                }
            }
            logger.info("HANAVI's All In One [aks74u_can_use_more_ammo] Loaded successfully.");
        }
        if (this.cfg.wide_nvgs) {
            logger.info("HANAVI's All In One [wide_nvgs] Loading...");
            const nvgs = [
                "5c0558060db834001b735271", //GPNVG-18
                "57235b6f24597759bf5a30f1", //AN/PVS-14
                "5c066e3a0db834001b7353f0", //N-15
                "5c0696830db834001d23f5da", //PNV-10T
                "67506ca81f18589016006aa6" //PNV-57E
            ];
            for (const i in nvgs)
                items[nvgs[i]]._props.MaskSize = 1;
            logger.info("HANAVI's All In One [wide_nvgs] Loaded successfully.");
        }
        if (this.cfg.pnv_57e_anywhere) {
            logger.info("HANAVI's All In One [pnv_57e_anywhere] Loading...");
            const pnv57e = [
                "67506ca81f18589016006aa6"
            ];
            for (let i in items)
                for (const slot in items[i]._props.Slots)
                    if (items[i]._props.Slots[slot]._name == "mod_nvg")
                        items[i]._props.Slots[slot]._props.filters[0].Filter.push(...pnv57e);
            logger.info("HANAVI's All In One [pnv_57e_anywhere] Loaded successfully.");
        }
        if (this.cfg.uwu) {
            logger.info("HANAVI's All In One is Loaded! UwU");
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
    }
}
module.exports = { mod: new Mod() };
//# sourceMappingURL=mod.js.map