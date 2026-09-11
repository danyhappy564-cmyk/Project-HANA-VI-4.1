import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { CustomItemService } from "@spt/services/mod/CustomItemService";
import { NewItemFromCloneDetails } from "@spt/models/spt/mod/NewItemDetails";

import { DatabaseServer } from "@spt/servers/DatabaseServer";

import { ItemHelper } from "@spt/helpers/ItemHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";

import stackConfig from '../config/config.json';
import backgroundcolourConfig from '../config/config.json';

class SuperAmmo implements IPostDBLoadMod
{
    IsPluginLoaded(): boolean
    {
        const fs = require('fs');
        const pluginName = "rairai.colorconverterapi.dll";

        try
        {
            const pluginList = fs.readdirSync("./BepInEx/plugins").map(plugin => plugin.toLowerCase());
            return pluginList.includes(pluginName);
        }
        catch
        {
            return false;
        }
    }

    public postDBLoad(container: DependencyContainer): void
    {
        const CustomItem = container.resolve<CustomItemService>("CustomItemService");
        const database = container.resolve<DatabaseServer>("DatabaseServer");
        const tables = database.getTables();
        const itemsa = tables.templates.items;
        const colourProfile = backgroundcolourConfig.ColorProfiles[backgroundcolourConfig.ColorProfile];

        const itemsToClone: NewItemFromCloneDetails[] = [
            { // 12/70 Harvester (flechette Gen2)
                itemTplToClone: "5d6e6911a4b9361bd5780d52",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/12x70_flechette.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 25,
                    PenetrationPower: 56,
                    Damage: 23,
                    InitialSpeed: 365,
                    StackMaxSize: stackConfig["12gStack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "36c2c851e64b4074b6AC319c",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 12/70 Harvester",
                        shortName: "Harvester",
                        description: "A specialist shotshell housing eight high-density tungsten alloy darts. Engineered to bypass and neutralise effective armour coverage."
                    },
                    kr: {
                        name: "HANA'VI Tactical 12/70 Harvester",
                        shortName: "Harvester",
                        description: "8발의 고밀도 텅스텐 합금 다트를 세이보(Sabot)에 수납한 특수 샷쉘입니다. 방탄재의 유효 방어 면적을 무력화하기 위해 설계되었습니다."
                    }
                }
            },
            { // 12/70 Shredder (Piranha Gen2)
                itemTplToClone: "64b8ee384b75259c590fa89b",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/12x70_flechette.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 23,
                    PenetrationPower: 44,
                    Damage: 20,
                    InitialSpeed: 342,
                    StackMaxSize: stackConfig["12gStack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66f5b68962fe6c1f25af9936",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 12/70 Shredder",
                        shortName: "Shredder",
                        description: "A specialist buckshot designed for structural destruction. High-hardness fragments shred the armour surface to maximise performance."
                    },
                    kr: {
                        name: "HANA'VI Tactical 12/70 Shredder",
                        shortName: "Shredder",
                        description: "하드 플레이트의 구조적 파괴를 목적으로 제작된 특수 벅샷입니다. 고경도 파편이 방탄재 표면을 찢어발겨 타격 성능을 극대화합니다."
                    }
                },
            },
            { // 12/70 Obelisk Slug
                itemTplToClone: "5d6e68e6a4b9361c140bcfe0",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/12x70_piranha.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 65,
                    Damage: 100,
                    InitialSpeed: 485,
                    StackMaxSize: stackConfig["12gStack"],
                    ammoAccr: 900,
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66f5b68962fe6c1f25af9681",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 12/70 Obelisk Slug",
                        shortName: "Obelisk",
                        description: "A precision sniper slug featuring an extremely reinforced monolithic penetrator. Pierces the highest grades of modern hard ballistic plates."
                    },
                    kr: {
                        name: "HANA'VI Tactical 12/70 Obelisk Slug",
                        shortName: "Obelisk",
                        description: "극도로 강화된 단일 관통자를 채택한 정밀 저격용 슬러그입니다. 현존하는 최상위 등급의 하드 플레이트를 투과하도록 제작되었습니다."
                    }
                },
            },
            { // 20/70 Stiletto Slug
                itemTplToClone: "660137d8481cc6907a0c5cda",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_20x70_slug_ap.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 65,
                    Damage: 80,
                    InitialSpeed: 488,
                    StackMaxSize: stackConfig["20gStack"],
                    ammoAccr: 900,
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6962052d842fa461cfca30c5",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 20/70 Stiletto Slug",
                        shortName: "Stiletto",
                        description: "A high-precision 20-gauge sabot round. Named after the slender, piercing dagger, the \"Stiletto\" utilises a sub-calibre tungsten penetrator to achieve surgical accuracy and superior armour penetration. Engineered to neutralise specific vulnerabilities in high-tier ballistic protection from short-barrelled platforms. Manufactured by HANA'VI Tactical."
                    },
                    kr: {
                        name: "HANA'VI Tactical 20/70 Stiletto Slug",
                        shortName: "Stiletto",
                        description: "고정밀 20게이지 세이보(Sabot) 탄약입니다. 가늘고 날카로운 단검의 이름을 딴 \"Stiletto\"는 구경보다 작은 텅스텐 관통자를 사용하여 정밀한 타격과 우수한 관통력을 제공합니다. 짧은 총열 플랫폼에서도 하이티어 방탄복의 취약점을 정밀하게 무력화할 수 있도록 설계되었습니다."
                    }
                },
            },
            { // 20/70 Sickle
                itemTplToClone: "6601380580e77cfd080e3418",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_20x70_flechette.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 25,
                    PenetrationPower: 56,
                    Damage: 26,
                    InitialSpeed: 488,
                    StackMaxSize: stackConfig["20gStack"],
                    ammoAccr: 20,
                    buckshotBullets: 6,
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6962080a0ac7b0e58556c481",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 20/70 Sickle",
                        shortName: "Sickle",
                        description: "A specialist 20-gauge flechette round developed as the counterpart to the 12-gauge \"Harvester\". The \"Sickle\" houses six high-tensile tungsten darts designed to slice through ballistic fibres and neutralise armoured targets with surgical efficiency. Manufactured by HANA'VI Tactical."
                    },
                    kr: {
                        name: "HANA'VI Tactical 20/70 Sickle",
                        shortName: "Sickle",
                        description: "12게이지 \"Harvester\"의 대응 사양으로 개발된 특수 20게이지 플레체트 탄약입니다. \"Sickle\"은 6개의 고인장 텅스텐 다트를 방사하여 방탄 섬유를 절개하고 장갑 목표를 정밀하게 무력화합니다."
                    }
                },
            },
            { // 23x75mm Leviathan Slug
                itemTplToClone: "5e85aa1a988a8701445df1f5",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_23x75_barricade.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 65,
                    Damage: 120,
                    InitialSpeed: 483,
                    StackMaxSize: stackConfig["23Stack"],
                    ammoAccr: 900,
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6962068b45b57405fed4068b",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 23x75mm Leviathan Slug",
                        shortName: "Leviathan",
                        description: "A monstrous 23mm anti-material slug for the KS-23 platform. The \"Leviathan\" is engineered to deliver unparalleled kinetic impact, designed to shatter and bypass the most advanced hard ballistic plates. A single round provides overwhelming stopping power, ensuring the absolute neutralisation of any armoured threat. Manufactured by HANA'VI Tactical."
                    },
                    kr: {
                        name: "HANA'VI Tactical 23x75mm Leviathan Slug",
                        shortName: "Leviathan",
                        description: "KS-23 플랫폼을 위한 압도적인 위력의 23mm 대물 파쇄용 슬러그입니다. 전설적인 괴수의 이름을 딴 \"Leviathan\"은 최첨단 하드 방탄판을 분쇄하기 위해 설계되었으며, 타의 추종을 불허하는 운동 에너지를 전달합니다. 단 한 발만으로도 장갑을 착용한 모든 위협을 확실하게 무력화할 수 있는 압도적인 저지력을 보유하고 있습니다."
                    }
                },
            },
            { // 23x75mm Reaper
                itemTplToClone: "5f647f31b6238e5dd066e196",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_23x75_shrapnel_25.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 25,
                    PenetrationPower: 56,
                    Damage: 28,
                    InitialSpeed: 483,
                    StackMaxSize: stackConfig["23Stack"],
                    ammoAccr: 10,
                    buckshotBullets: 10,
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "69620cb818fa2048f4b56c5f",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 23x75mm Reaper",
                        shortName: "Reaper",
                        description: "The ultimate evolution of the HANA'VI Tactical harvesting series. The 23mm \"Reaper\" houses twelve heavy-duty tungsten darts within its massive casing. Engineered to saturate the target area with overwhelming force, it is capable of shredding high-tier ballistic fibres and heavy plating with ease. A single discharge represents the absolute end of any armoured resistance. Manufactured by HANA'VI Tactical."
                    },
                    kr: {
                        name: "HANA'VI Tactical 23x75mm Reaper",
                        shortName: "Reaper",
                        description: "HANA'VI Tactical '수확' 시리즈의 최종 진화형인 23mm 플레체트 탄약입니다. \"Reaper\"는 거대한 탄피 내부에 12개의 중량 텅스텐 다트를 탑재하고 있습니다. 목표 구역을 압도적인 화력으로 제압하도록 설계되었으며, 하이티어 방탄 섬유와 중장갑판을 손쉽게 갈기갈기 찢어버립니다. 단 한 번의 사격으로 장갑을 착용한 모든 저항을 완벽히 종식시킵니다."
                    }
                },
            },
            { // 12.7x55mm 7N56 'Sledge'
                itemTplToClone: "5cadf6ddae9215051e1c23b2",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_12,7x55_ps12b.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 57,
                    Damage: 90,
                    InitialSpeed: 650,
                    StackMaxSize: stackConfig["12_7Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66fb34873370c7729baed341",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 12.7x55mm 7N56 'Sledge'",
                        shortName: "7N56",
                        description: "A heavy-weight penetrator round designed to overcome physical limitations. Transfers overwhelming kinetic energy directly into the target."
                    },
                    kr: {
                        name: "HANA'VI Tactical 12.7x55mm 7N56 'Sledge'",
                        shortName: "7N56",
                        description: "기존 PS12 시리즈의 물리적 한계를 극복하기 위해 설계된 고중량 관통 탄약입니다. 압도적인 질량 에너지를 목표물에 그대로 전달합니다."
                    }
                },
            },
            { // .357 HCP 'Enforcer'
                itemTplToClone: "62330c18744e5e31df12f516",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x33r_jhp.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 40,
                    PenetrationPower: 42,
                    Damage: 62,
                    InitialSpeed: 412,
                    StackMaxSize: stackConfig["357Stack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "670547827c51eb084de1bd17",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .357 HCP 'Enforcer'",
                        shortName: "HCP",
                        description: "A specialist penetrator round utilising a high-hardness alloy core, focusing the raw destructive power of the Magnum cartridge into pure armour-piercing capability."
                    },
                    kr: {
                        name: "HANA'VI Tactical .357 HCP 'Enforcer'",
                        shortName: "HCP",
                        description: "고경도 합금 심재를 사용한 특수 관통탄으로, 매그넘 탄의 파괴력을 관통력에 집중시켰습니다."
                    }
                },
            },
            { // .357 XM1035 EPR 'Gungnir'
                itemTplToClone: "62330c18744e5e31df12f516",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x33r_fmj.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 38,
                    PenetrationPower: 54,
                    Damage: 60,
                    InitialSpeed: 439,
                    StackMaxSize: stackConfig["357Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "670547827c51eb084de1bdAA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .357 XM1035 EPR 'Gungnir'",
                        shortName: "XM1035",
                        description: "A next-generation experimental round designed to push the absolute physical limits of armour penetration for the .357 calibre."
                    },
                   kr : {
                        name: "HANA'VI Tactical .357 XM1035 EPR 'Gungnir'",
                        shortName: "XM1035",
                        description: "차세대 실험용 관통 탄약으로, .357 구경에서 도달할 수 있는 물리적 관통 한계에 도전한 모델입니다."
                    }
                },
            },
            { // .45 ACP XM1162 EPR
                itemTplToClone: "5e81f423763d9f754677bf2e",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/1143x23_acp.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 52,
                    PenetrationPower: 44,
                    Damage: 62,
                    InitialSpeed: 300,
                    StackMaxSize: stackConfig["45ACPStack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66fb98a14d1456cf00a13500",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .45 ACP XM1162 EPR",
                        shortName: "XM1162",
                        description: "An experimental cartridge that maintains the stopping power of low-velocity, large-calibre rounds while significantly enhancing armour penetration."
                    },
                    kr: {
                        name: "HANA'VI Tactical .45 ACP XM1162 EPR",
                        shortName: "XM1162",
                        description: "저속 대구경탄의 특성을 유지하면서 방탄재 투과 능력을 높인 실험용 탄약입니다."
                    }
                },
            },
            { // .45 ACP XM1165 ADVAP
                itemTplToClone: "5e81f423763d9f754677bf2e",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/1143x23_acp_ap.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 50,
                    PenetrationPower: 55,
                    Damage: 60,
                    InitialSpeed: 319,
                    StackMaxSize: stackConfig["45ACPStack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66fb98a14d1456cf00a135AA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .45 ACP XM1165 ADVAP",
                        shortName: "XM1165",
                        description: "The definitive end-tier .45 calibre penetrator, specifically engineered to neutralise high-tier ballistic protection."
                    },
                    kr: {
                        name: "HANA'VI Tactical .45 ACP XM1165 ADVAP",
                        shortName: "XM1165",
                        description: "고티어 방탄복 무력화를 위해 설계된 .45 구경 최종 티어 관통 탄약입니다."
                    }
                },
            },
            { // 5.7x28mm R39.F 'Viper'
                itemTplToClone: "5cc80f53e4a949000e1ea4f8",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_57x28_l191.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 42,
                    PenetrationPower: 42,
                    Damage: 42,
                    InitialSpeed: 770,
                    StackMaxSize: stackConfig["57Stack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67055c41ebc73eaa35ba547e",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 5.7x28mm R39.F 'Viper'",
                        shortName: "R39.F",
                        description: "A specialist cartridge designed to maximise the inherent advantages of small-calibre, high-velocity rounds, piercing light armour like a needle."
                    },
                    kr: {
                        name: "HANA'VI Tactical 5.7x28mm R39.F 'Viper'",
                        shortName: "R39.F",
                        description: "소구경 고속탄의 장점을 극대화하여 얇은 방탄재를 송곳처럼 뚫고 들어가는 특수 탄약입니다."
                    }
                },
            },
            { // 5.7x28mm R39.X 'Stinger'
                itemTplToClone: "5cc80f53e4a949000e1ea4f8",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_57x28_l191.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 45,
                    PenetrationPower: 54,
                    Damage: 40,
                    InitialSpeed: 821,
                    StackMaxSize: stackConfig["57Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67055c41ebc73eaa35ba54AA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 5.7x28mm R39.X 'Stinger'",
                        shortName: "R39.X",
                        description: "Leveraging the unique traits of small-calibre, high-velocity ballistics, this ultra-precision penetrator is designed to shred ballistic fibres and inflict lethal internal damage."
                    },
                    kr: {
                        name: "HANA'VI Tactical 5.7x28mm R39.X 'Stinger'",
                        shortName: "R39.X",
                        description: "소구경 고속탄 특유의 장점을 살려, 초정밀 관통자가 방탄 섬유 조직을 뚫고 들어가 치명적인 내부 피해를 입히도록 설계되었습니다."
                    }
                },
            },
            { // 9x19mm 7N51 'Stilet'
                itemTplToClone: "5c925fa22e221601da359b7b",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x19_ap_63.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 57,
                    PenetrationPower: 44,
                    Damage: 41,
                    InitialSpeed: 489,
                    StackMaxSize: stackConfig["919Stack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66fb917da189607ce317ffef",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x19mm 7N51 'Stilet'",
                        shortName: "7N51",
                        description: "A next-generation Russian 9mm high-penetration 'Stilet' (Stiletto) cartridge with performance that completely overwhelms the 7N31."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x19mm 7N51 'Stilet'",
                        shortName: "7N51",
                        description: "7N31을 압도하는 관통력을 지닌 차세대 러시아 9mm 고관통 송곳(Stilet) 탄약입니다."
                    }
                },
            },
            { // 9x19mm 7N52 'Klyuch'
                itemTplToClone: "5c925fa22e221601da359b7b",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x19_7n31.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 52,
                    PenetrationPower: 54,
                    Damage: 40,
                    InitialSpeed: 521,
                    StackMaxSize: stackConfig["919Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "66fb917da189607ce317ffAA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x19mm 7N52 'Klyuch'",
                        shortName: "7N52",
                        description: "Developed under the concept of a 'universal key' for all armour. The high-velocity core effortlessly bypasses conventional ballistic defences."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x19mm 7N52 'Klyuch'",
                        shortName: "7N52",
                        description: "모든 방탄복을 여는 '열쇠'라는 컨셉으로 개발되었습니다. 고속으로 사출되는 심재가 방탄재의 방어선을 손쉽게 통과합니다."
                    }
                },
            },
            { // 9x21mm SP-14 'Grom'
                itemTplToClone: "5a26ac0ec4a28200741e1e18",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x21_sp13.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 50,
                    PenetrationPower: 44,
                    Damage: 47,
                    InitialSpeed: 444,
                    StackMaxSize: stackConfig["921Stack"],
                    BackgroundColor: colourProfile["4"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6705dba9e4697fa86c4d5e43",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x21mm SP-14 'Grom'",
                        shortName: "SP-14",
                        description: "A high-performance 9x21mm penetrator developed to meet the exacting requirements of Russian special forces."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x21mm SP-14 'Grom'",
                        shortName: "SP-14",
                        description: "러시아 특수부대의 요구에 맞춰 개발된 9x21mm 체급의 고성능 관통 탄약입니다."
                    }
                },
            },
            { // 9x21mm SP-15 'Shtil'
                itemTplToClone: "5a26ac0ec4a28200741e1e18",
                overrideProperties: {
                    Prefab: {
                        path: "hanavi/9x21_7n42.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 44,
                    PenetrationPower: 55,
                    Damage: 44,
                    InitialSpeed: 473,
                    StackMaxSize: stackConfig["921Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6705dba9e4697fa86c4d5eAA",
                fleaPriceRoubles: 1400,
                handbookPriceRoubles: 1230,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x21mm SP-15 'Shtil'",
                        shortName: "SP-15",
                        description: "The latest 9x21mm specialist cartridge, engineered for lethal penetration whilst maintaining total silence."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x21mm SP-15 'Shtil'",
                        shortName: "SP-15",
                        description: "고요함 속의 치명적 관통을 목표로 설계된 최신형 9x21mm 특수 탄약입니다."
                    }
                },
            },
            { // 6.8x51mm XM1184 ADVAP
                itemTplToClone: "6529243824cbe3c74a05e5c1",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_68x51.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 55,
                    Damage: 70,
                    InitialSpeed: 959,
                    StackMaxSize: stackConfig["277Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 6.8x51mm XM1184 ADVAP",
                        shortName: "XM1184",
                        description: "A high-performance experimental armour-piercing round designed to push the capabilities of Next Generation Squad Weapons (NGSW) to the extreme."
                    },
                    kr: {
                        name: "HANA'VI Tactical 6.8x51mm XM1184 ADVAP",
                        shortName: "XM1184",
                        description: "차세대 분대화기(NGSW)의 성능을 극한으로 끌어올린 고성능 실험용 철갑탄입니다."
                    }
                },
            },
            { // 6.8x51mm XM1186 ADVAP
                itemTplToClone: "6529243824cbe3c74a05e5c1",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_68x51.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 50,
                    PenetrationPower: 60,
                    Damage: 68,
                    InitialSpeed: 1021,
                    StackMaxSize: stackConfig["277Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAB",
                fleaPriceRoubles: 1100,
                handbookPriceRoubles: 1080,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 6.8x51mm XM1186 ADVAP",
                        shortName: "XM1186",
                        description: "The pinnacle of 6.8mm hybrid casing technology, engineered to maintain superior armour penetration even at extended ranges."
                    },
                    kr: {
                        name: "HANA'VI Tactical 6.8x51mm XM1186 ADVAP",
                        shortName: "XM1186",
                        description: "6.8mm 하이브리드 탄피 기술의 정점으로, 원거리에서도 높은 관통력을 유지합니다."
                    }
                },
            },
            { // .366 TKM Shilo
                itemTplToClone: "5f0596629e22f464da6bbdd9",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_366tkm_geksa.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 55,
                    PenetrationPower: 53,
                    Damage: 86,
                    InitialSpeed: 589,
                    StackMaxSize: stackConfig["366Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAc",
                fleaPriceRoubles: 900,
                handbookPriceRoubles: 870,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .366 TKM Shilo",
                        shortName: "Shilo",
                        description: "A specialist cartridge featuring a high-strength 'Shilo' awl penetrator, designed to push the .366 TKM far beyond its civilian limitations."
                    },
                    kr: {
                        name: "HANA'VI Tactical .366 TKM Shilo",
                        shortName: "Shilo",
                        description: "민수용 구경의 한계를 넘기 위해 특수 제작된 고강도 송곳(Shilo) 관통자 삽입 탄약입니다."
                    }
                },
            },
            { // .366 TKM Vanguard
                itemTplToClone: "5f0596629e22f464da6bbdd9",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_366tkm_fmj.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 50,
                    PenetrationPower: 61,
                    Damage: 78,
                    InitialSpeed: 627,
                    StackMaxSize: stackConfig["366Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAD",
                fleaPriceRoubles: 900,
                handbookPriceRoubles: 870,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .366 TKM Vanguard",
                        shortName: "Vanguard",
                        description: "A custom-balanced high-penetration round designed to act as the vanguard in breaching enemy defensive lines."
                    },
                    kr: {
                        name: "HANA'VI Tactical .366 TKM Vanguard",
                        shortName: "Vanguard",
                        description: "적의 방어선을 뚫는 선봉장 역할을 수행하기 위해 커스텀 밸런싱된 고관통 탄약입니다."
                    }
                },
            },
            { // .300 BLK EPR
                itemTplToClone: "5fd20ff893a8961fc660a954",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_762x35_vmax.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 60,
                    PenetrationPower: 54,
                    Damage: 47,
                    InitialSpeed: 810,
                    StackMaxSize: stackConfig["300Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAE",
                fleaPriceRoubles: 800,
                handbookPriceRoubles: 770,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .300 BLK EPR",
                        shortName: "EPR",
                        description: "An Enhanced Performance Round (EPR) that successfully balances superior armour penetration with lethal terminal ballistics."
                    },
                    kr: {
                        name: "HANA'VI Tactical .300 BLK EPR",
                        shortName: "EPR",
                        description: "관통력과 살상력을 동시에 확보한 강화 성능 탄약(Enhanced Performance Round)입니다."
                    }
                },
            },
            { // .300 BLK XM1163 ADVAP
                itemTplToClone: "5fd20ff893a8961fc660a954",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_762x35_ap.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 54,
                    PenetrationPower: 62,
                    Damage: 45,
                    InitialSpeed: 866,
                    StackMaxSize: stackConfig["300Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5eAF",
                fleaPriceRoubles: 990,
                handbookPriceRoubles: 900,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical .300 BLK XM1163 ADVAP",
                        shortName: "XM1163",
                        description: "Combines subsonic silence with high-performance penetrative power. Stealthily neutralises armoured targets during clandestine operations."
                    },
                    kr: {
                        name: "HANA'VI Tactical .300 BLK XM1163 ADVAP",
                        shortName: "XM1163",
                        description: "아음속에서의 정숙성과 고성능 철갑탄의 투과력을 동시에 확보했습니다. 특수 작전 중 방탄복을 착용한 목표물을 은밀히 무력화합니다."
                    }
                },
            },
            { // 9x39mm 7N32 'Failnaught'
                itemTplToClone: "5c0d688c86f77413ae3407b2",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_9x39_bp.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 64,
                    PenetrationPower: 62,
                    Damage: 52,
                    InitialSpeed: 331,
                    StackMaxSize: stackConfig["939Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "67056974e4697fa86c4d5ecf",
                fleaPriceRoubles: 1200,
                handbookPriceRoubles: 1100,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x39mm 7N32 'Failnaught'",
                        shortName: "7N32",
                        description: "A next-generation subsonic cartridge that builds upon the technology of the 7N12, offering improved ballistic stability and superior armour penetration."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x39mm 7N32 'Failnaught'",
                        shortName: "7N32",
                        description: "7N12의 기술력을 계승하되 탄도 안정성과 장갑 투과성을 더욱 개선한 차세대 아음속 탄약입니다."
                    }
                },
            },
            { // 5.45x39mm 7N44 'Fragarach'
                itemTplToClone: "61962b617c6c7b169525f168",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_545x39_7n40.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 61,
                    PenetrationPower: 58,
                    Damage: 43,
                    InitialSpeed: 1040,
                    StackMaxSize: stackConfig["545Stack"],
                    BackgroundColor: colourProfile["6"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "696211d570c512d3c6158b76",
                fleaPriceRoubles: 1200,
                handbookPriceRoubles: 1100,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 5.45x39mm 7N44 'Fragarach'",
                        shortName: "7N44",
                        description: "A cutting-edge 5.45x39mm cartridge named after the legendary sword of Irish mythology. The 7N44 'Fragarach' features a refined tungsten core that balances the precision of the 7N40 with the devastating penetration required to compromise Class 6 ballistic protection. Known as 'The Answerer', it leaves no question on the battlefield. Manufactured by HANA'VI Tactical."
                    },
                    kr: {
                        name: "HANA'VI Tactical 5.45x39mm 7N44 'Fragarach'",
                        shortName: "7N44",
                        description: "아일랜드 신화의 전설적인 검에서 이름을 딴 최첨단 5.45x39mm 탄약입니다. 7N44 'Fragarach'는 7N40의 정밀함과 6클래스 방탄 시스템을 무력화하는 관통력을 동시에 갖추고 있습니다. '응답자'라는 이름처럼, 전장에서 모든 위협에 확실한 해답을 제시합니다."
                    }
                },
            },
            { // 7.62x25mm SP-18 'Zhal'
                itemTplToClone: "573602322459776445391df1",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_762x25tt_lrnpc.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 30,
                    PenetrationPower: 54,
                    Damage: 40,
                    InitialSpeed: 490,
                    StackMaxSize: stackConfig["762_25Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6646a939a189607ce317ffAA",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 7.62x25mm SP-18 'Zhal'",
                        shortName: "SP-18",
                        description: "A specialist cartridge that reinterprets the Tokarev's high muzzle velocity through a modern armour-piercing mechanism."
                    },
                    kr: {
                        name: "HANA'VI Tactical 7.62x25mm SP-18 'Zhal'",
                        shortName: "SP-18",
                        description: "토카레프 탄의 빠른 탄속을 현대적인 장갑 투과 메커니즘으로 재해석한 특수 목적 탄약입니다."
                    }
                },
            },
            { // 9x18mm 7N38 'Gvozd'
                itemTplToClone: "5737201124597760fc4431f1",
                overrideProperties: {
                    Prefab: {
                        path: "assets/content/items/ammo/patrons/patron_9x18pm_pst_gzh.bundle",
                        rcid: ""
                    },
                    ArmorDamage: 30,
                    PenetrationPower: 54,
                    Damage: 38,
                    InitialSpeed: 340,
                    StackMaxSize: stackConfig["918Stack"],
                    BackgroundColor: colourProfile["5"]
                },
                parentId: "5485a8684bdc2da71d8b4567",
                newId: "6646a939a189607ce3174649",
                fleaPriceRoubles: 600,
                handbookPriceRoubles: 500,
                handbookParentId: "5b47574386f77428ca22b33b",
                locales: {
                    en: {
                        name: "HANA'VI Tactical 9x18mm 7N38 'Gvozd'",
                        shortName: "7N38",
                        description: "A formidable 'Gvozd' (Nail) penetrator designed to push the humble Makarov calibre beyond its conventional physical limitations."
                    },
                    kr: {
                        name: "HANA'VI Tactical 9x18mm 7N38 'Gvozd'",
                        shortName: "7N38",
                        description: "마카로프 구경의 물리적 한계를 극복하기 위해 설계된 강력한 '못(Gvozd)' 관통탄입니다."
                    }
                },
            }
        ];

        for (const cloneItem of itemsToClone)
        {
            CustomItem.createItemFromClone(cloneItem);
        }
        
        const db = container.resolve<DatabaseServer>("DatabaseServer");

        const dbT = db.getTables();

        const itemHelper: ItemHelper = container.resolve<ItemHelper>("ItemHelper");

        const items = Object.values(dbT.templates.items);

        const magazines = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.MAGAZINE));
        const cylinders = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.CYLINDER_MAGAZINE));
        const ars = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.ASSAULT_RIFLE));
        const carbines = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.ASSAULT_CARBINE));
        //const mgs = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.MACHINE_GUN));
        const srs = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.SNIPER_RIFLE));
        const mrs = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.MARKSMAN_RIFLE));
        const pistols = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.PISTOL));
        const smgs = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.SMG));
        const shotguns = items.filter(x => itemHelper.isOfBaseclass(x._id, BaseClasses.SHOTGUN));

        for (const magazine of magazines)
        {
            for (const ammoType of magazine._props.Cartridges[0]._props.filters[0].Filter)
            {
                if (ammoType === "64b7bbb74b75259c590fa897") // 9x19
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66fb917da189607ce317ffef");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66fb917da189607ce317ffAA");
                }

                if (ammoType === "5efb0d4f4bc50b58e81710f3") // .45 ACP
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a13500");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a135AA");
                }

                if (ammoType === "5cadf6ddae9215051e1c23b2") // 12.7x55
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66fb34873370c7729baed341");
                }

                if (ammoType === "560d5e524bdc2d25448b4571") // 12 gauge 
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("36c2c851e64b4074b6AC319c");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9936");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9681");
                }

                if (ammoType === "62330b3ed4dc74626d570b95") // .357
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("670547827c51eb084de1bd17");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("670547827c51eb084de1bdAA");
                }

                if (ammoType === "5cc86832d7f00c000d3a6e6c") // 5.7x28mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba547e");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba54AA");
                }

                if (ammoType === "5a269f97c4a282000b151807") // 9x21mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5e43");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5eAA");
                }

                if (ammoType === "6529243824cbe3c74a05e5c1") // .277 Fury (6.8x51mm)
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAA");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAB");
                }

                if (ammoType === "5f0596629e22f464da6bbdd9") // .366 TKM
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAc");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAD");
                }

                if (ammoType === "5fd20ff893a8961fc660a954") // .300 BLK
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAE");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAF");
                }

                if (ammoType === "5c0d688c86f77413ae3407b2") // 9x39mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5ecf");
                }

                if (ammoType === "5735ff5c245977640e39ba7e") // 7.62x25mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6646a939a189607ce317ffAA");
                }

                if (ammoType === "573719762459775a626ccbc1") // 9x18mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6646a939a189607ce3174649")
                }

                if (ammoType === "56dff3afd2720bba668b4567") // 5.45x39mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("696211d570c512d3c6158b76");
                }

                if (ammoType === "5a38ebd9c4a282000d722a5b") // 20/70
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6962052d842fa461cfca30c5");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6962080a0ac7b0e58556c481");
                }

                if (ammoType === "5e85a9a6eacf8c039e4e2ac1") // 23x75mm
                {
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("6962068b45b57405fed4068b");
                    magazine._props.Cartridges[0]._props.filters[0].Filter.push("69620cb818fa2048f4b56c5f");
                }
            }
        }

        for (const cylinder of cylinders)
        {
            for (const num in cylinder._props.Slots)
            {
                for (const ammoType of cylinder._props.Slots[num]._props.filters[0].Filter)
                {
                    if (ammoType === "5cadf6ddae9215051e1c23b2") // 12.7x55
                    {
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("66fb34873370c7729baed341");
                    }

                    if (ammoType === "5d6e6772a4b936088465b17c") // 12g
                    {
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("36c2c851e64b4074b6AC319c");
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9936");
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9681");
                    }

                    if (ammoType === "62330b3ed4dc74626d570b95") // .357
                    {
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("670547827c51eb084de1bd17");
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("670547827c51eb084de1bdAA");
                    }

                    if (ammoType === "64b7bbb74b75259c590fa897") // 9x19mm
                    {
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("66fb917da189607ce317ffef");
                        cylinder._props.Slots[num]._props.filters[0].Filter.push("66fb917da189607ce317ffAA");
                    }
                }
            }
        }

        for (const ar of ars)
        {
            if (ar._props)
            {
                if (ar._props.Chambers[0])
                {
                    if (ar._props.Chambers[0]._props)
                    {
                        if (ar._props.Chambers[0]._props.filters[0])
                        {
                            if (ar._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (ar._props.ammoCaliber === "Caliber127x55")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("66fb34873370c7729baed341");
                                }

                                if (ar._props.ammoCaliber === "Caliber68x51")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAA");
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAB");
                                }

                                if (ar._props.ammoCaliber === "Caliber366TKM")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAc");
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAD");
                                }

                                if (ar._props.ammoCaliber === "Caliber762x35")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAE");
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAF");
                                }

                                if (ar._props.ammoCaliber === "Caliber9x39")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5ecf");
                                }

                                if (ar._props.ammoCaliber === "Caliber9x19PARA")
                                {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffef");
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffAA");
                                }

                                if (ar._props.ammoCaliber === "Caliber545x39") {
                                    ar._props.Chambers[0]._props.filters[0].Filter.push("696211d570c512d3c6158b76");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const carbine of carbines)
        {
            if (carbine._props)
            {
                if (carbine._props.Chambers[0])
                {
                    if (carbine._props.Chambers[0]._props)
                    {
                        if (carbine._props.Chambers[0]._props.filters[0])
                        {
                            if (carbine._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (carbine._props.ammoCaliber === "Caliber68x51")
                                {
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAA");
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAB");
                                }
                                if (carbine._props.ammoCaliber === "Caliber762x35")
                                {
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAE");
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAF");
                                }

                                if (carbine._props.ammoCaliber === "Caliber9x39")
                                {
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5ecf");
                                }

                                if (carbine._props.ammoCaliber === "Caliber366TKM")
                                {
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAc");
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAD");
                                }

                                if (carbine._props.ammoCaliber === "Caliber545x39") {
                                    carbine._props.Chambers[0]._props.filters[0].Filter.push("696211d570c512d3c6158b76");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const sr of srs)
        {
            if (sr._props)
            {
                if (sr._props.Chambers[0])
                {
                    if (sr._props.Chambers[0]._props)
                    {
                        if (sr._props.Chambers[0]._props.filters[0])
                        {
                            if (sr._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (sr._props.ammoCaliber === "Caliber366TKM")
                                {
                                    sr._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAc");
                                    sr._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5eAD");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const mr of mrs)
        {
            if (mr._props)
            {
                if (mr._props.Chambers[0])
                {
                    if (mr._props.Chambers[0]._props)
                    {
                        if (mr._props.Chambers[0]._props.filters[0])
                        {
                            if (mr._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (mr._props.ammoCaliber === "Caliber9x39")
                                {
                                    mr._props.Chambers[0]._props.filters[0].Filter.push("67056974e4697fa86c4d5ecf");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const pistol of pistols)
        {
            if (pistol._props)
            {
                if (pistol._props.Chambers[0])
                {
                    if (pistol._props.Chambers[0]._props)
                    {
                        if (pistol._props.Chambers[0]._props.filters[0])
                        {
                            if (pistol._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (pistol._props.ammoCaliber === "Caliber9x19PARA")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffef");
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffAA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber1143x23ACP")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a13500");
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a135AA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber127x55")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("66fb34873370c7729baed341");
                                }

                                if (pistol._props.ammoCaliber === "Caliber9x33R") // .357
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("670547827c51eb084de1bd17");
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("670547827c51eb084de1bdAA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber57x28") // 5.7x28mm
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba547e");
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba54AA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber9x21")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5e43");
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5eAA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber762x25TT")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("6646a939a189607ce317ffAA");
                                }

                                if (pistol._props.ammoCaliber === "Caliber9x18PM")
                                {
                                    pistol._props.Chambers[0]._props.filters[0].Filter.push("6646a939a189607ce3174649");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const smg of smgs)
        {
            if (smg._props)
            {
                if (smg._props.Chambers[0])
                {
                    if (smg._props.Chambers[0]._props)
                    {
                        if (smg._props.Chambers[0]._props.filters[0])
                        {
                            if (smg._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (smg._props.ammoCaliber === "Caliber9x19PARA")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffef");
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("66fb917da189607ce317ffAA");
                                }

                                if (smg._props.ammoCaliber === "Caliber1143x23ACP")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a13500");
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("66fb98a14d1456cf00a135AA");
                                }

                                if (smg._props.ammoCaliber === "Caliber127x55")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("66fb34873370c7729baed341");
                                }

                                if (smg._props.ammoCaliber === "Caliber9x33R") // .357
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("670547827c51eb084de1bd17");
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("670547827c51eb084de1bdAA");
                                }

                                if (smg._props.ammoCaliber === "Caliber57x28") // 5.7x28mm
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba547e");
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("67055c41ebc73eaa35ba54AA");
                                }

                                if (smg._props.ammoCaliber === "Caliber9x21")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5e43");
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("6705dba9e4697fa86c4d5eAA");
                                }

                                if (smg._props.ammoCaliber === "Caliber762x25TT")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("6646a939a189607ce317ffAA");
                                }

                                if (smg._props.ammoCaliber === "Caliber9x18PM")
                                {
                                    smg._props.Chambers[0]._props.filters[0].Filter.push("6646a939a189607ce3174649");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const shotgun of shotguns)
        {
            if (shotgun._props)
            {
                if (shotgun._props.Chambers[0])
                {
                    if (shotgun._props.Chambers[1]) // Double-Barrel
                    {
                        if (shotgun._props.Chambers[0]._props && shotgun._props.Chambers[1]._props)
                        {
                            if (shotgun._props.Chambers[0]._props.filters[0] && shotgun._props.Chambers[1]._props.filters[0])
                            {
                                if (shotgun._props.Chambers[0]._props.filters[0].Filter && shotgun._props.Chambers[1]._props.filters[0].Filter)
                                {
                                    if (shotgun._props.ammoCaliber === "Caliber12g")
                                    {
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("36c2c851e64b4074b6AC319c");
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9936");
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9681");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("36c2c851e64b4074b6AC319c");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9936");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9681");
                                    }

                                    if (shotgun._props.ammoCaliber === "Caliber20g") {
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962052d842fa461cfca30c5");
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962080a0ac7b0e58556c481");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("6962052d842fa461cfca30c5");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("6962080a0ac7b0e58556c481");
                                    }

                                    if (shotgun._props.ammoCaliber === "Caliber23x75") {
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962068b45b57405fed4068b");
                                        shotgun._props.Chambers[0]._props.filters[0].Filter.push("69620cb818fa2048f4b56c5f");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("6962068b45b57405fed4068b");
                                        shotgun._props.Chambers[1]._props.filters[0].Filter.push("69620cb818fa2048f4b56c5f");
                                    }
                                }
                            }
                        }
                    }
                    else if (shotgun._props.Chambers[0]._props)
                    {
                        if (shotgun._props.Chambers[0]._props.filters[0])
                        {
                            if (shotgun._props.Chambers[0]._props.filters[0].Filter)
                            {
                                if (shotgun._props.ammoCaliber === "Caliber12g")
                                {
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("36c2c851e64b4074b6AC319c");
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9936");
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("66f5b68962fe6c1f25af9681");
                                }

                                if (shotgun._props.ammoCaliber === "Caliber20g") {
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962052d842fa461cfca30c5");
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962080a0ac7b0e58556c481");
                                }
                                
                                if (shotgun._props.ammoCaliber === "Caliber23x75") {
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("6962068b45b57405fed4068b");
                                    shotgun._props.Chambers[0]._props.filters[0].Filter.push("69620cb818fa2048f4b56c5f");
                                }
                            }
                        }
                    }
                }
            }
        }

        addidtot("36c2c851e64b4074b6AC319c", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66f5b68962fe6c1f25af9936", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66f5b68962fe6c1f25af9681", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66fb34873370c7729baed341", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("670547827c51eb084de1bd17", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("670547827c51eb084de1bdAA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66fb98a14d1456cf00a13500", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66fb98a14d1456cf00a135AA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67055c41ebc73eaa35ba547e", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67055c41ebc73eaa35ba54AA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66fb917da189607ce317ffef", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("66fb917da189607ce317ffAA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("6705dba9e4697fa86c4d5e43", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("6705dba9e4697fa86c4d5eAA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAB", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAc", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAD", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAE", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5eAF", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("67056974e4697fa86c4d5ecf", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("6646a939a189607ce317ffAA", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("6646a939a189607ce3174649", "58330581ace78e27b8b10cee", 500000, 469, "5449016a4bdc2d6f028b456f", 4, true);
        addidtot("696211d570c512d3c6158b76", "58330581ace78e27b8b10cee", 500000, 1100, "5449016a4bdc2d6f028b456f", 4, true); // 7N44
        addidtot("6962052d842fa461cfca30c5", "58330581ace78e27b8b10cee", 500000, 600, "5449016a4bdc2d6f028b456f", 4, true);  // Stiletto
        addidtot("6962080a0ac7b0e58556c481", "58330581ace78e27b8b10cee", 500000, 600, "5449016a4bdc2d6f028b456f", 4, true);  // Sickle
        addidtot("69620cb818fa2048f4b56c5f", "58330581ace78e27b8b10cee", 500000, 1200, "5449016a4bdc2d6f028b456f", 4, true); // Reaper
        
        function addidtot(itemID, traderID, countNum, price, currency, loyal, unlock) {
            itemsa[itemID]._props.CanSellOnRagfair = unlock;
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

module.exports = { mod: new SuperAmmo() }