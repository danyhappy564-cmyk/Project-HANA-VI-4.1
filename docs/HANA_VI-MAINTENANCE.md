# HANA_VI 님을 위한 유지보수 가이드

> 이 문서 하나만 보시면 **C# 을 전혀 몰라도** 모드 수치·대상·on/off 를 전부 바꾸실 수 있습니다.
> AI 어시스턴트에게 시킬 때는 [`../CLAUDE.md`](../CLAUDE.md) 를 대화창 맨 앞에 붙여넣으십시오.

---

## 0. 3분 요약

3.11 때는 설정을 바꾸려면 `mod.ts` 안의 코드를 직접 고쳐야 했습니다.
4.1 포팅본은 **코드와 데이터를 분리**했습니다.

```
C# (.cs)  = "어떻게 적용하는가"   ← 건드릴 일 거의 없음 (R_F 담당)
JSON      = "무엇을, 얼마나"      ← 전부 여기서 조정 (HANA_VI 담당)
```

그래서 수치 하나 바꾸는 데 **.NET 설치도, 재컴파일도 필요 없습니다.**
게임 폴더의 JSON 을 고치고 **서버만 재시작**하면 끝입니다.

---

## 1. 어디를 고치면 되는가

게임에 설치된 경로 기준입니다.

```
E:\SPT 4.1\SPT_Runtime\user\mods\
  HANA_VI-AIO\
    config.json                패치 42개 on/off
    db\ammo.json               구경별 탄약 묶음
    db\patches\*.json          패치 42개 (여기가 본체)
    db\locales\global\kr.json  아이템 이름/설명

  HANA-VI-SuperAmmo\
    config.json                패치 5개 on/off
    db\values.json             탄 적재량·배경색 (3.11 의 config/config.json 에 해당)
    db\patches\*.json          특수탄 28종 + 호환 규칙

  HANA-VI_Items\
    config.json                패치 8개 on/off
    db\packs.json              아이템 팩 11개 on/off
    db\packs\<팩이름>\          팩 데이터 (3.11 원본 그대로)
    db\patches\*.json          확장 탄창·전술키트 등 패치 8개

  HANA-VI-AllExamined\
    config.json
```

> ⚠️ 게임 폴더에서 고친 내용은 **다음 빌드 때 덮어써집니다.**
> 확정된 수정은 이 저장소의 `4.1/HANA_VI-AIO/mod/` 쪽에도 반영해 주십시오.

---

## 2. 자주 하는 작업 7가지

### (1) 패치 하나를 끄고 싶다

`config.json` 에서 `true` → `false` 로 바꾸면 됩니다.

```jsonc
"patches": {
  "ar_firerate_change": true,
  "super_plates": false,        // ← 이 패치만 끔
  ...
}
```

전부 끄려면 맨 위의 `"enabled": false`.

---

### (2) 연사속도 숫자를 바꾸고 싶다

`db/patches/01_ar_firerate_change.json` 을 열면 이렇게 생겼습니다.

```jsonc
{
  "op": "setProps",
  "targets": ["57dc2fa62459775949412633"],   // AKS-74U
  "props": { "bFirerate": 735 }              // ← 이 숫자만 바꾸면 됨
}
```

어떤 총인지는 파일 안의 주석이나 [SPT 아이템 DB](https://db.sp-tarkov.com/) 에서
ID 로 검색하시면 확인됩니다.

---

### (3) "이 총에 이 부품도 달리게 해 줘"

`addFilter` op 를 추가하거나, 기존 op 의 `add` 목록에 ID 를 덧붙이면 됩니다.

```jsonc
{
  "op": "addFilter",
  "targets": ["5ac4cd105acfc40016339859"],   // AK-74M 에
  "into": "slot",
  "slots": ["mod_magazine"],                 // 탄창 슬롯에
  "add": ["62307b7b10d2321fa8741921"]        // G36 탄창 허용
}
```

`slots` 에 자주 쓰이는 이름:
`mod_magazine` `mod_stock` `mod_barrel` `mod_handguard` `mod_muzzle`
`mod_scope` `mod_sight_front` `mod_sight_rear` `mod_foregrip` `mod_tactical` `mod_nvg`

탄약이면 `"into": "chamber"` (약실), 탄창 내부면 `"into": "cartridge"`,
가방/컨테이너 칸이면 `"into": "grid"` 입니다.

---

### (4) 탄약 묶음에 새 탄을 추가하고 싶다

`db/ammo.json` 은 구경별 탄약 ID 묶음입니다. 여기에 추가하면
그 묶음을 쓰는 **모든 패치에 한 번에 반영**됩니다.

```jsonc
{
  "m43": [                                  // 7.62x39mm
    "59e0d99486f7744a32234762",
    "59e4d3d286f774176a36250a",
    "새로_추가할_탄약_ID"                    // ← 여기
  ]
}
```

패치 파일에서는 `"add": "@m43"` 처럼 `@` 를 붙여 참조합니다.

---

### (5) 새 패치를 통째로 추가하고 싶다

1. `db/patches/43_내가만든패치.json` 을 만듭니다.
2. `config.json` 의 `patches` 에 같은 `key` 를 추가합니다.
3. 검증 스크립트를 돌립니다.

```jsonc
{
  "key": "my_new_patch",
  "title": "내가 만든 패치",
  "enabled": true,
  "sets": {
    "my_guns": ["5ac4cd105acfc40016339859"]
  },
  "ops": [
    { "op": "setProps", "targets": "@my_guns", "props": { "bFirerate": 800 } }
  ]
}
```

파일 이름 앞의 숫자가 **적용 순서**입니다. 나중에 적용되는 패치가 앞 패치의 값을 덮어씁니다.

---

### (6) 아이템 팩을 통째로 끄고 싶다 (Items 전용)

`HANA-VI_Items\db\packs.json` 에서 해당 팩의 `enabled` 를 `false` 로 바꾸면 됩니다.

```jsonc
{ "key": "atlas_gear", "name": "A T L A S Custom Weapons & Equipment",
  "enabled": false,        // ← 이 팩만 통째로 꺼짐
  "format": "hanamod", "folder": "ATLAS-GEAR/database", ... }
```

팩 안의 **개별 아이템**을 끄려면 그 팩 폴더의 `*_items.json` 에서
해당 아이템의 `"enable": false` 로 바꾸면 됩니다 (3.11 과 같은 방식입니다).

팩 11개 목록:
`atlas_gear` `carl_qhb` `sig_mcx_virtus` `sdtac_kits` `qbz191`
`wtt_items` `mxlr` `mosin` `g36` `nervex`, 그리고 패치로 들어간 `tt33k`.

---

### (7) 여러 패치가 쓰는 수치를 한 번에 바꾸고 싶다

`db\values.json` 에 이름 붙은 값을 두고 패치에서 `"$이름"` 으로 참조합니다.
SuperAmmo 의 탄 적재량과 배경색이 이 방식입니다.

```jsonc
// db/values.json — 여기 하나만 고치면
{ "12gStack": 50, "919Stack": 300, "color6": "#6A006A" }

// 이 값을 쓰는 모든 탄약에 반영됩니다
{ "op": "cloneItem", "props": { "StackMaxSize": "$12gStack" } }
```

---

## 3. 고치고 나면 반드시 이걸 돌리십시오

```bash
python3 tools/datacheck.py 4.1/HANA_VI-AIO/mod
python3 tools/datacheck.py 4.1/HANA-VI-SuperAmmo/mod
python3 tools/datacheck.py 4.1/HANA-VI_Items/mod
```

오타 하나로 서버가 안 켜지는 걸 미리 잡아 줍니다. 잡아내는 것:

- `bFirerate` 를 `bFireRate` 로 잘못 쓴 경우
- 아이템 ID 길이가 틀린 경우
- 없는 `@세트이름` 을 참조한 경우
- `config.json` 에 key 를 추가하지 않은 경우
- **새 아이템을 만드는 op 에 `stage: "preload"` 를 빼먹은 경우** ← 이게 제일 중요

---

## 4. 반드시 지켜야 할 것 하나

**새 아이템을 만드는 작업(`cloneItem`, `handbookEntry`)은 반드시 `"stage": "preload"` 입니다.**

SPT 4.1 은 프로필을 읽는 시점에 아이템 목록을 고정해 두고, 그 뒤에 아이템이
새로 생기면 서버를 죽여 버립니다. 이런 에러가 뜨면 이것 때문입니다.

```
DatabaseModifiedAfterCutoffException: N item(s) were added to the database after profiles loaded
```

반대로 **상인 판매 등록(`traderOffer`)은 `"stage": "trader"`** 입니다.
`preload` 에 넣으면 에러도 없이 그냥 안 팔립니다 (상인이 아직 준비 전이라서).

값만 고치는 작업(`setProps`, `appendProps`, `addFilter`)은 `stage` 를 안 써도 됩니다.

---

## 5. 서버가 안 켜질 때

| 로그에 뜨는 말 | 원인 | 해결 |
|---|---|---|
| `DatabaseModifiedAfterCutoffException` | 새 아이템 op 에 `stage: "preload"` 누락 | 해당 op 에 stage 추가 |
| `'xxx' 프로퍼티를 찾을 수 없다` | 프로퍼티 이름 오타 | `datacheck.py` 로 확인 |
| `'@xxx' 세트를 찾을 수 없다` | 없는 세트 참조 | `sets` 나 `ammo.json` 에 정의 |
| `아이템 xxx 를 DB 에서 찾을 수 없어 건너뛴다` | 다른 모드가 빠졌거나 ID 오타 | **서버는 안 죽음.** 경고만 나고 그 항목만 건너뜀 |
| `상인 xxx 를 찾을 수 없다` | 상인 ID 오타 | 상인 ID 확인 |
| `'@xxx' 세트를 찾을 수 없다` | 없는 세트 참조 | `sets` 나 `ammo.json` 에 정의 |
| `'$xxx' 을(를) db/values.json 에서 찾을 수 없다` | 없는 값 참조 | `values.json` 에 추가 |
| `ID 가 24자 16진수가 아니다` | 아이템 ID 형식 오류 | 24자 16진수인지 확인 |
| `복제 원본 xxx 이 DB 에 없다` | 원본 아이템이 없음(다른 모드 누락) | **서버는 안 죽음.** 그 아이템만 건너뜀 |

마지막 줄이 중요합니다. 3.11 원본은 아이템 하나가 없으면 **서버 전체가 죽었지만**,
4.1 포팅본은 없는 아이템은 경고만 남기고 넘어갑니다. 모드 조합을 바꿔도 잘 버팁니다.

---

## 6. 상인 ID / 통화 ID 참고표

| 상인 | ID |
|---|---|
| Prapor | `54cb50c76803fa8b248b4571` |
| Therapist | `54cb57776803fa99248b456e` |
| Skier | `58330581ace78e27b8b10cee` |
| Peacekeeper | `5935c25fb3acc3127c3d8cd9` |
| Mechanic | `5a7c2eca46aef81a7ca2145d` |
| Ragman | `5ac3b934156ae10c4430e83c` |
| Jaeger | `5c0647fdd443bc2504c2d371` |
| Fence | `579dc571d53a0658a154fbec` |

| 통화 | ID |
|---|---|
| Roubles | `5449016a4bdc2d6f028b456f` |
| Dollars | `5696686a4bdc2da3298b456a` |
| Euros | `569668774bdc2da2298b4568` |
