# CLAUDE.md — Project HANA-VI 4.1

> 이 파일은 **AI 어시스턴트(Claude Code / ChatGPT)가 이 저장소에서 작업할 때 읽는 지침서**입니다.
> HANA_VI 님이 유지보수할 때는 이 파일을 새 대화창 맨 앞에 붙여넣고 시작하시면 됩니다.
> 사람이 읽는 사용 설명서는 [`docs/HANA_VI-MAINTENANCE.md`](docs/HANA_VI-MAINTENANCE.md) 입니다.

---

## 0. 역할 분담 (가장 중요)

| 사람 | 담당 | 건드리는 파일 |
|---|---|---|
| **R_F** | 3.x → 4.1 **포팅**. C# 엔진 구조, 로드 단계, 빌드 설정 | `4.1/**/*.cs`, `Directory.Build.props` |
| **HANA_VI** | **메인터넌스**. CONFIG 및 세부 조정 (수치, 대상 아이템, on/off) | `4.1/**/mod/**/*.json` |

**AI 어시스턴트에게:**
HANA_VI 님의 요청은 기본적으로 **JSON 데이터 수정**으로 해결하십시오.
"C# 을 고쳐야 한다"는 결론이 나오면 그건 대체로 잘못 짚은 것입니다. 먼저 이 질문을 하십시오.

> "이건 `mod/db/patches/*.json` 수정으로 되는 일인가?"

`.cs` 파일 수정이 정말로 필요한 경우는 아래 셋뿐입니다.
1. 기존 op 6종으로 표현할 수 없는 **새로운 종류의 동작**이 필요할 때
2. SPT 본체가 4.1.x → 4.2 처럼 올라가서 **API 가 깨졌을 때**
3. 버그 수정

그 외에는 전부 JSON 입니다. 그렇게 설계했습니다.

---

## 1. 이 저장소의 구조

```
3.x-original/        SPT 3.11 원본 (읽기 전용, 대조용으로만 본다. 절대 수정하지 않는다)
4.1/                 SPT 4.1 포팅본 — 여기가 실제 작업 대상
  Directory.Build.props   공통 빌드 설정 (net10.0, SPTushonka 4.1.5, 배포/패키징)
  Shared/                 모드 4개 공용 (R_F 담당)
    Patching/             패치 엔진 — op 10종
    Packs/                아이템 팩 주입 엔진 — 형식 5종
    Loaders/              로드 단계별 로더 뼈대
  HANA_VI-AIO/          mod/db/patches/*.json 42개              ← HANA_VI
  HANA-VI-SuperAmmo/    mod/db/values.json + patches 5개        ← HANA_VI
  HANA-VI_Items/        mod/db/packs.json + packs/ + patches 8개 ← HANA_VI
  HANA-VI-AllExamined/  mod/config.json                        ← HANA_VI
docs/                설명 문서
tools/               검증 스크립트
```

**`3.x-original/` 은 절대 수정하지 마십시오.** 포팅이 원본과 같게 동작하는지 대조하는
기준점이며, 검증 스크립트가 이 폴더를 원본으로 삼습니다.

---

## 2. 패치 JSON 문법 (전부 알아야 할 내용)

패치 파일 하나 = 설정 토글 하나입니다. `4.1/HANA_VI-AIO/mod/db/patches/` 에 있습니다.

```jsonc
{
  "key":     "ar_firerate_change",     // config.json 의 키와 반드시 일치
  "title":   "돌격소총 연사속도 조정",   // 로그에 뜨는 이름, 자유롭게 수정 가능
  "enabled": true,                     // config.json 에 이 key 가 없을 때의 기본값

  "sets": {                            // 이 파일 안에서만 쓰는 ID 묶음
    "ak_family": ["5ac4cd105acfc40016339859", "5ac66cb05acfc40198510a10"]
  },

  "ops": [ /* 아래 6종 */ ]
}
```

`"@이름"` 은 세트 참조입니다. 먼저 그 파일의 `sets` 에서 찾고, 없으면 공용
`db/ammo.json` 에서 찾습니다. `["@m43", "5ac4cd105acfc40016339859"]` 처럼 섞어 쓸 수 있습니다.

### op 10종

| op | 하는 일 |
|---|---|
| `setProps` | 아이템의 값을 **덮어쓴다** (연사속도, 내구도, 차지공간 …) |
| `adjustProps` | 원본 값에 **더한다** (`"Recoil": -2` → 기존 값에서 2 감소) |
| `appendProps` | 목록형 값에 **덧붙인다** (`weapFireType` 에 `fullauto` 추가 등) |
| `addFilter` | 슬롯/약실/탄창/그리드의 **허용 목록에 아이템을 추가한다** |
| `cloneItem` | 기존 아이템을 복제해 **새 아이템을 만든다** (⚠️ `stage: "preload"` 필수) |
| `handbookEntry` | 도감에 등록하고 가격을 정한다 (⚠️ `stage: "preload"` 필수) |
| `addPreset` | 무기 프리셋을 등록한다 (⚠️ `stage: "preload"` 필수) |
| `traderOffer` | 상인 판매 목록에 올린다 (⚠️ `stage: "trader"` 필수) |
| `questWeapons` | 퀘스트의 "이 무기로 처치" 조건에 무기를 더한다 |
| `masteryTemplates` | 무기 숙련도에 템플릿을 더하고 Level2/Level3 을 조정한다 |

### 대상 지정 — 넷 중 정확히 하나

```jsonc
"targets":          ["5ac4cd105acfc40016339859"]   // 특정 아이템들 (또는 "@세트이름")
"targetsByParent":   ["644120aa86ffbe10ee032b6f"]  // 이 분류(_parent)에 속하는 아이템 전부
"targetsByBaseClass":["5448bc234bdc2d3c308b4569"]  // 이 베이스클래스 전부 (예: 모든 탄창)
"targetsAll":        true                          // DB 의 모든 아이템
```

고른 대상을 더 좁히려면 `whenPropEquals` 를 쓴다.

```jsonc
{ "op": "addFilter", "targetsByBaseClass": ["5447b5f14bdc2d61278b4567"],
  "whenPropEquals": { "ammoCaliber": "Caliber9x39" },
  "into": "chamber", "add": ["..."] }      // 9x39 구경 돌격소총의 약실에만
```

### 예시

```jsonc
// 연사속도를 700 으로
{ "op": "setProps", "targets": ["5ac4cd105acfc40016339859"], "props": { "bFirerate": 700 } }

// 연발 사격 추가
{ "op": "appendProps", "targets": ["@ak_family"], "props": { "weapFireType": ["fullauto"] } }

// 탄창 슬롯에 G36 탄창 허용
{ "op": "addFilter", "targets": ["@stanag"], "into": "slot",
  "slots": ["mod_magazine"], "add": ["62307b7b10d2321fa8741921"] }

// 약실에 7.62x39 허용
{ "op": "addFilter", "targets": ["@sks"], "into": "chamber", "add": "@m43" }
```

`addFilter` 세부 옵션:
- `"into"`: `slot` / `chamber` / `cartridge` / `grid`
- `"slots"`: 슬롯 이름 목록. `["*"]` 이면 모든 슬롯
- `"slotIndexes"`: 이름 대신 순서(0부터)로 지정. 다른 모드가 순서를 바꾸면 깨지므로 되도록 피할 것
- `"whenFilterContains"`: 기존 허용 목록에 이 ID 가 이미 있는 슬롯에만 적용
- `"replace"`: true 면 기존 허용 목록을 지우고 `add` 로 **교체**한다
- `"slotProps"`: 슬롯 자체의 값 수정 (`_max_count`, `_parent`). `"$self"` 는 대상 아이템 자신의 ID

### 값 공유 — `db/values.json`

여러 패치가 같은 수치를 쓸 때는 `db/values.json` 에 이름을 붙여 두고 `"$이름"` 으로 참조한다.
SuperAmmo 의 탄 적재량·배경색이 이 방식이다. 한 곳만 고치면 전부 반영된다.

```jsonc
// db/values.json
{ "12gStack": 50, "color6": "#6A006A" }
// 패치에서
{ "op": "cloneItem", "props": { "StackMaxSize": "$12gStack" } }
```

### 아이템 팩 (Items 전용)

`HANA-VI_Items` 는 패치 외에 **아이템 팩 11개**를 따로 주입한다.
팩 데이터는 3.11 원본 JSON 그대로이며 `mod/db/packs/` 에 있다.
`mod/db/packs.json` 이 "어떤 팩을 어떤 형식으로 읽을지" 적어 둔 설명서다.

| format | 쓰는 팩 | 데이터 모양 |
|---|---|---|
| `hanamod` | ATLAS-GEAR, Carl-QHB, SIG_MCX_VIRTUS, SDTAC_KITS, qbz191 | `*_items.json` + `*_clothes.json` + `globals.json` + `traders/` |
| `wtt` | Items | 무기 하나당 파일 하나 |
| `raw` | mxlr | `templates/items.json` 을 그대로 얹음 |
| `mosin` | mosin | `newitems.json` + `modifyItem.json` |
| `nerv` | g36, nervex | `nerv_inv/*.json` |

팩을 통째로 끄려면 `packs.json` 에서 `"enabled": false`.
아이템 스탯·가격을 바꾸려면 그 팩 폴더의 JSON 을 직접 고치면 된다.

`_` 로 시작하는 필드(`_note`, `_intendedSlots`, `_comment`)는 **주석이며 엔진이 무시합니다.**
JSON 에는 원래 주석이 없어서 쓰는 방식입니다. 지우지 말고 그대로 두십시오.

---

## 3. 절대 어겨선 안 되는 규칙

### 3-1. 새 아이템은 반드시 `stage: "preload"`

SPT 4.1 의 `DatabaseIntegrityService` 는 프로필을 읽는 시점에 아이템 키 목록을
스냅샷으로 떠 둡니다. 그 뒤에 키가 새로 생기면 이 예외로 **서버가 죽습니다.**

```
DatabaseModifiedAfterCutoffException: N item(s) were added to the database after profiles loaded
```

`cloneItem` / `handbookEntry` 에서 `stage` 를 빼먹으면 이 사고가 납니다.
반대로 상인 어사트 추가를 `preload` 에 넣으면 상인이 아직 준비되지 않아
**예외도 없이 조용히 실패**합니다. 그래서 단계가 셋으로 나뉘어 있습니다.

| stage | 언제 | 무엇을 |
|---|---|---|
| `preload` | DB 로드 직후, 프로필 로드 전 | 아이템 **추가**, 도감 등록, 로케일 |
| `postload` (기본값) | 서버 로드 마지막 | 기존 아이템 **값 수정** |
| `trader` | 상인 등록 시점 | 상인 판매 목록 |

### 3-2. 아이템 ID 는 24자 16진수

`"5ac4cd105acfc40016339859"` 형식입니다. 길이가 다르면 검증 스크립트가 잡아냅니다.

### 3-3. `config.json` 의 `patches` 키와 패치 파일의 `key` 는 1:1

새 패치 파일을 만들면 `config.json` 의 `patches` 에도 같은 key 를 추가해야 합니다.

### 3-4. 수정 후 반드시 검증 스크립트를 돌린다

```bash
python3 tools/datacheck.py 4.1/HANA_VI-AIO/mod
python3 tools/datacheck.py 4.1/HANA-VI-SuperAmmo/mod
python3 tools/datacheck.py 4.1/HANA-VI_Items/mod
python3 tools/csharpcheck.py 4.1     # .cs 를 고쳤을 때
python3 tools/apicheck.py 4.1        # .cs 를 고쳤을 때
```

오타, 없는 프로퍼티 이름, 못 찾는 `@세트`, 잘못된 stage 를 전부 잡아냅니다.
**커밋 전에 이걸 통과시키십시오.**

---

## 4. 빌드와 배포

```bash
# 전체 빌드 + E:\SPT 4.1\SPT_Runtime\user\mods 로 자동 배포 + release/*.zip 생성
dotnet build 4.1 -c Release

# SPT 를 다른 곳에 설치했다면
dotnet build 4.1 -c Release -p:SptRoot="D:\SPT 4.1"
```

**JSON 만 고쳤다면 빌드가 필요 없습니다.** `user/mods/<모드폴더>/` 안의 JSON 을
직접 고치고 서버만 재시작하면 반영됩니다. 이게 데이터 주도형 구조의 핵심 이점입니다.
다만 다음 빌드 때 덮어써지므로, 확정된 수정은 이 저장소의 `4.1/**/mod/` 쪽에도 반영하십시오.

---

## 5. AI 어시스턴트 작업 수칙

1. **사실 확인 우선.** SPT 4.1 API 를 기억에 의존해 답하지 마십시오.
   `docs/PORTING-NOTES.md` 에 실제 어셈블리에서 뽑아낸 API 표가 있습니다.
2. **원본 대조.** 동작이 원본과 같아야 하는지 물어보십시오.
   `3.x-original/` 의 TypeScript 가 정답지입니다.
3. **원본 버그를 임의로 고치지 마십시오.** 일부러 재현해 둔 것이 있습니다
   (`_note` 필드로 표시). 고치면 게임 밸런스가 3.11 과 달라집니다. 고칠지 물어보십시오.
4. **커밋 작성자는 `R_F <danyhappy564@gmail.com>` 로 고정.**
   커밋 메시지·PR·README·모드 메타데이터에 Claude/Anthropic 관련 문구를 넣지 마십시오.
5. **문서는 한국어로.**
6. 토큰·시간 예상치를 먼저 말하고 시작하십시오.
