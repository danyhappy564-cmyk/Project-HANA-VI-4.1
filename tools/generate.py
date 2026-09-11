#!/usr/bin/env python3
"""Turn the extracted 3.11 AIO structure into SPT 4.1 data-driven patch files."""
import json, os, sys, collections

SRC, OUT = sys.argv[1], sys.argv[2]
D = json.load(open(SRC, encoding='utf-8'))
ALIAS, AMMO, BLOCKS = D['aliases'], D['ammoSets'], D['blocks']

TITLES = {
 "ar_firerate_change": "돌격소총 연사속도 조정",
 "smg_firerate_change": "기관단총 연사속도 조정",
 "dmr_firerate_change": "지정사수소총 연사속도 조정 + 연발 추가",
 "shotgun_firerate_change": "산탄총 연사속도 조정 + 연발 추가",
 "vpo215_can_use_762x39mm": "VPO-215에 7.62x39mm 사용 허용",
 "adar_can_use_300blk": "ADAR 2-15에 .300 BLK + 연발 허용",
 "sks_can_use_366tkm": "SKS / OP-SKS에 .366 TKM 허용",
 "stm_can_use_45acp": "STM-9에 .45 ACP + 벡터 탄창 허용",
 "rpd_tacticalkit": "RPD 전술 키트(핸드가드/조준기/총구/바이포드)",
 "vss_6p29m_mount_can_use_wmx200": "VSS 6P29M 마운트에 WMX200 허용",
 "g28_can_use_arstocktube": "G28에 AR 스톡 튜브 허용",
 "dvl_660mm_can_use_muzzledevice": "DVL-10 660mm 배럴에 총구 장치 허용",
 "super_plates": "모든 방탄판 성능 상향",
 "no_mount_extrasize": "마운트류 차지공간(ExtraSize) 제거",
 "planting_items_can_insert_dogtagcase": "인식표 케이스에 설치형 퀘스트 아이템 수납",
 "a556_stanag_guns_can_use_g36_mags": "5.56 STANAG 총기에 G36 탄창 허용",
 "mk17_can_use_some_762_mags": "MK17 / G28에 일부 7.62 탄창 허용",
 "a762_stanag_guns_can_use_mk17_mags": "AR-10 계열에 SCAR-H 탄창 허용",
 "mp5k_can_use_mp5_stocks": "MP5K 어퍼에 MP5 스톡 허용",
 "some_mounts_can_use_tactical_device": "일부 마운트/스코프에 전술장비 장착 허용",
 "pepr_30mm_mounts_can_use_all_30mm_scope": "PEPR 30mm 마운트에 30mm 조준경 전부 허용",
 "backup_iron_back_slot_can_use_mpr45": "다수 총기 후방 조준기 슬롯에 MPR45 허용",
 "tt01_can_use_mpr45": "TT01 마운트에 MPR45 허용",
 "smgs_and_shotguns_can_use_30mm_34mm_scopemount": "기관단총/산탄총에 30mm·34mm 스코프 마운트 허용",
 "bit_dt_can_use_some_sights": "BIT DT 마운트에 일부 도트 허용",
 "svt40_custom_mount": "SVT-40 커스텀 마운트 신규 아이템 추가 (메카닉 판매)",
 "sa58_short_barrels_can_use_any_handguard": "SA-58 단축 배럴 핸드가드 제한 해제",
 "some_rails_can_use_cqr": "다수 레일에 CQR 그립 허용",
 "tatm_can_use_n15": "TATM 마운트에 N-15 야시경 허용",
 "ak_partisan_stock_can_use_more_ak": "파르티잔 스톡을 더 많은 AK 계열에 허용",
 "mcx_can_use_223": "MCX에 5.56 NATO 허용",
 "vss_val_can_use_more_ammo": "VSS / AS VAL / SR-3M 다구경 + 탄창 확장",
 "aa12_can_use_more_muzzles": "AA-12 배럴에 12게이지 총구 장치 허용",
 "hydra_mount_can_use_some_sights": "하이드라 마운트에 일부 도트 허용",
 "BAD_can_use_any_upper": "BAD 레버 어퍼 충돌 제거",
 "uzi_pro_can_use_uzi_mags": "UZI PRO에 UZI 탄창 허용",
 "uzi_pro_more_barrels": "UZI PRO SMG에 권총용 배럴 허용",
 "velociraptor_can_use_more_ammo": "벨로시랩터 다구경 + 탄창 확장",
 "aks74u_can_use_more_ammo": "AKS-74U 계열 다구경 + 탄창 확장",
 "wide_nvgs": "야시경 시야(MaskSize) 확대",
 "pnv_57e_anywhere": "PNV-57E를 모든 야시경 슬롯에 허용",
 "uwu": "로딩 완료 로그 (UwU)",
}

# 3.11 원본에서 `a == "x" || "y"` 로 작성돼 항상 참이 되던(=모든 슬롯에 적용되던) 조건.
BUG_NOTE = ("원본 3.11 코드가 `_name == \"A\" || \"B\"` 로 작성돼 자바스크립트에서 항상 참이었음 "
            "→ 지정한 슬롯이 아니라 '모든 슬롯'에 적용됐다. 게임플레이를 원본과 동일하게 유지하려고 "
            "그대로 재현한다. 의도대로 고치려면 slots 를 _intendedSlots 값으로 바꿔라.")

def ids(x): return x if isinstance(x, list) else [x]

def mkfilter(loop, sets):
    op = {"op": "addFilter",
          "targets": "@" + loop["targetSet"],
          "into": "grid" if loop["collection"] == "Grids" else "slot"}
    if loop["collection"] == "Slots":
        if loop["orChain"]:
            op["slots"] = ["*"]
            op["_intendedSlots"] = loop["slotNames"]
            op["_note"] = BUG_NOTE
        else:
            op["slots"] = loop["slotNames"] or ["*"]
    if loop["guardContains"]:
        op["whenFilterContains"] = loop["guardContains"]
    op["add"] = "@" + loop["addSet"]
    return op

# ---- manual op tables for the statements the pattern extractor cannot express ----
MANUAL_PRE = {  # ops inserted BEFORE the generated ones
 "stm_can_use_45acp": [
   {"op": "addFilter", "targets": ["60339954d62c9b14ed777c06"], "into": "slot",
    "slotIndexes": [1], "add": "@vector45mag",
    "_note": "원본은 Slots[1] 을 인덱스로 직접 지정했다. 슬롯 이름이 아니라 순서에 의존하므로 "
             "다른 모드가 STM-9 슬롯 순서를 바꾸면 엉뚱한 슬롯에 들어간다."}],
 "super_plates": [
   {"op": "setProps", "targetsByParent": ["644120aa86ffbe10ee032b6f"],
    "props": {"ArmorMaterial": "Aramid", "ArmorType": "Heavy", "Durability": 50, "MaxDurability": 50}}],
 "no_mount_extrasize": [
   {"op": "setProps", "targetsByParent": ["55818b224bdc2dde698b456f"],
    "props": {"ExtraSizeLeft": 0, "ExtraSizeRight": 0, "ExtraSizeUp": 0, "ExtraSizeDown": 0}}],
 "sa58_short_barrels_can_use_any_handguard": [
   {"op": "setProps", "targets": ["5b099a765acfc47a8607efe3", "5b7be1125acfc4001876c0e5"],
    "props": {"ConflictingItems": []}}],
 "BAD_can_use_any_upper": [
   {"op": "setProps", "targets": ["675307301f7c19a9780f2668"], "props": {"ConflictingItems": []}}],
 "wide_nvgs": [
   {"op": "setProps", "targets": "@nvgs", "props": {"MaskSize": 1}}],
 "pnv_57e_anywhere": [
   {"op": "addFilter", "targetsAll": True, "into": "slot", "slots": ["mod_nvg"], "add": "@pnv57e"}],
 "svt40_custom_mount": [
   {"op": "cloneItem", "stage": "preload",
    "from": "641dc35e19604f20c800be18", "newId": "AA01ad4786f774505619AD75",
    "props": {"Prefab": {"path": "hanavi/mount_SVT40_custom.bundle", "rcid": ""}}},
   {"op": "handbookEntry", "stage": "preload", "id": "AA01ad4786f774505619AD75",
    "parentId": "5b5f755f86f77447ec5d770e", "price": 10000, "canSellOnRagfair": True},
   {"op": "traderOffer", "stage": "trader", "id": "AA01ad4786f774505619AD75",
    "traderId": "58330581ace78e27b8b10cee", "count": 5, "price": 7400,
    "currency": "5449016a4bdc2d6f028b456f", "loyaltyLevel": 1,
    "_traderName": "Mechanic", "_currencyName": "Roubles"}],
}
MANUAL_SETS = {
 "svt40_custom_mount": {"addmount": ["AA01ad4786f774505619AD75"]},
}
MANUAL_DROP_SWEEP = {"super_plates", "no_mount_extrasize", "sa58_short_barrels_can_use_any_handguard"}
STAGES = {"svt40_custom_mount": None}   # per-op stage used instead

os.makedirs(OUT, exist_ok=True)
json.dump({"_comment": "구경별 탄약 ID 묶음. 패치 파일에서 @이름 으로 참조한다.", **AMMO},
          open(os.path.join(OUT, "ammo.json"), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

index = []
for i, (key, b) in enumerate(BLOCKS.items(), 1):
    sets = dict(b["localArrays"])
    sets.update(MANUAL_SETS.get(key, {}))
    ops = list(MANUAL_PRE.get(key, []))

    for p in b["setProps"]:
        if p["alias"] not in ALIAS:      # itm._props.X = [] handled manually
            continue
        v = p["value"]
        val = int(v) if v.lstrip('-').isdigit() else (json.loads(v) if v in ("[]", "true", "false") else v.strip('"'))
        ops.append({"op": "setProps", "targets": [ALIAS[p["alias"]]], "props": {p["prop"]: val}})
    for f in b["fireModes"]:
        ops.append({"op": "appendProps", "targets": [ALIAS[f["alias"]]],
                    "props": {"weapFireType": [f["mode"]]}})
    for c in b["chamberPushes"]:
        ops.append({"op": "addFilter", "targets": [ALIAS[c["alias"]]],
                    "into": "chamber" if c["into"] == "Chambers" else "cartridge",
                    "add": "@" + c["set"]})
    for l in b["loops"]:
        ops.append(mkfilter(l, sets))
    if key not in MANUAL_DROP_SWEEP:
        for s in b["sweeps"]:
            if s["by"] == "_id":
                ops.append({"op": "setProps", "targets": [s["id"]], "props": {"ConflictingItems": []}})

    # merge consecutive identical-target setProps (firerate + firemode readability)
    doc = collections.OrderedDict()
    doc["key"] = key
    doc["title"] = TITLES[key]
    doc["enabled"] = True
    if sets: doc["sets"] = sets
    doc["ops"] = ops
    name = f"{i:02d}_{key}.json"
    json.dump(doc, open(os.path.join(OUT, name), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    index.append((name, key, len(ops)))

print(f"wrote {len(index)} patch files + ammo.json to {OUT}")
for n, k, c in index: print(f"  {n:58s} ops={c}")
