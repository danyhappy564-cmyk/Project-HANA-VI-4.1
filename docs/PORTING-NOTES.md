# 포팅 노트 — SPT 3.11 → 4.1 에서 무엇이 어떻게 바뀌었나

> 이 문서는 **무엇을 왜 그렇게 바꿨는지**의 기록입니다.
> 사용법은 [`HANA_VI-MAINTENANCE.md`](HANA_VI-MAINTENANCE.md) 를 보십시오.

---

## 1. 왜 "수정"이 아니라 "재작성"인가

SPT 3.11 과 4.1 은 **서버 런타임 자체가 다릅니다.**

| | SPT 3.11 | SPT 4.1 |
|---|---|---|
| 서버 언어 | TypeScript (Node.js) | **C# (.NET 10)** |
| 모드 진입점 | `mod.ts` + `package.json` | `.dll` + `IModMetadata` 클래스 |
| 의존성 주입 | tsyringe `container.resolve()` | **생성자 주입** |
| DB 접근 | `databaseServer.getTables()` | **필요한 테이블만 직접 주입** |
| 로드 순서 | `postDBLoad` / `postSptLoad` | `IOnLoad` + `OnLoadOrder` 우선순위 |

`.ts` 파일을 조금 고쳐서 돌아가는 종류의 변화가 아니라, **언어가 바뀐** 것이라
전면 재작성입니다. 그래서 "무엇을 바꾸는가"(데이터)와 "어떻게 바꾸는가"(코드)를
분리하는 쪽으로 구조를 새로 잡았습니다.

---

## 2. 구조 변경 — 하드코딩에서 데이터 주도형으로

### 3.11 원본

`HANA_VI-AIO/src/mod.ts` 1,865줄 안에 아이템 ID 1,457개와 수치가 전부 하드코딩돼
있었습니다. 연사속도 하나를 바꾸려면 TypeScript 소스를 고쳐야 했습니다.

```typescript
if(this.cfg.ar_firerate_change)
{
    aks74u._props.bFirerate = 735;
    ak101._props.bFirerate = 700;
    // ... 32줄
}
```

### 4.1 포팅본

같은 내용을 **JSON 데이터 + 범용 패치 엔진**으로 분리했습니다.

```
mod/db/patches/01_ar_firerate_change.json   ← 무엇을, 얼마나 (HANA_VI 담당)
Patching/PatchEngine.cs                     ← 어떻게 (R_F 담당)
```

```jsonc
{ "op": "setProps", "targets": ["57dc2fa62459775949412633"], "props": { "bFirerate": 735 } }
```

1,865줄의 절차적 코드가 **op 6종 / 150개 작업**으로 표현됩니다.

| op | 3.11 원본에서 대응하던 코드 |
|---|---|
| `setProps` | `item._props.X = 값` |
| `appendProps` | `item._props.weapFireType.push("fullauto")` |
| `addFilter` | `..._props.filters[0].Filter.push(...목록)` 4중 반복문 |
| `cloneItem` | `jsonUtil.clone(items[id])` |
| `handbookEntry` | `addidtot()` 의 도감 부분 |
| `traderOffer` | `addidtot()` 의 상인 부분 |

**얻은 것:** HANA_VI 님이 .NET SDK 없이, 재컴파일 없이, JSON 만 고치고
서버 재시작으로 모든 수치·대상을 조정할 수 있습니다.

**치른 비용:** 초기 작업량이 1:1 직역보다 컸고, 패치 엔진이라는 층이 하나 늘었습니다.

---

## 3. SPT 4.1 API 변경점 (실제로 부딪힌 것만)

아래는 NuGet 의 **실제 4.1.5 어셈블리 메타데이터를 직접 파싱해서 확인한 내용**입니다.
기억이나 추측이 아닙니다. (`tools/mdump.py`, `tools/sigdump.py`)

### 3-1. 모드 메타데이터

`package.json` 이 없어졌습니다. 대신 `IModMetadata` 를 구현한 클래스를 둡니다.

```csharp
public class ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "com.hanavi.aio";
    public SemanticVersioning.Range SptVersion { get; init; } = new("~4.1.0");
    public bool HasPrepatcher { get; init; } = false;   // 4.1 신규
    // ...
}
```

- `isBundleMod` 은 **없어졌습니다.** 4.1 은 `bundles.json` 이 있으면 자동 판단합니다.
- `HasPrepatcher` 가 신규입니다.
- NuGet 패키지명은 `SPTushonka.*` 인데 **네임스페이스는 `SPTarkov.*`** 입니다. 첫 번째 함정입니다.

### 3-2. 진입점

```typescript
// 3.11
public postDBLoad(container: DependencyContainer): void
```
```csharp
// 4.1
public Task OnLoadAsync(CancellationToken cancellationToken = default)
```

### 3-3. DB 접근 — 통짜 테이블이 사라졌습니다

```typescript
// 3.11 — 전부 받아서 골라 쓴다
const tables = databaseServer.getTables();
tables.templates.items[id]._props.bFirerate = 700;
```
```csharp
// 4.1 — 필요한 테이블만 생성자로 받는다
public class AioPatchLoader(TemplateTable templates, TradersTable traders) : IOnLoad
```

| 3.11 | 4.1 |
|---|---|
| `tables.templates` | `TemplateTable` 주입 |
| `tables.locales` | `LocaleTable` 주입 |
| `tables.traders` | `TradersTable` 주입 |
| `tables.templates.handbook` | `TemplateTable.Handbook` |

### 3-4. ⚠️ 로드 단계 — 가장 조심해야 할 부분

`OnLoadOrder` 상수는 3.x/4.0 과 **이름도 값도 다릅니다.** 숫자를 그대로 옮기면 안 됩니다.

4.1 의 실제 값 (어셈블리에서 확인):
`Watermark` → `Preload` → `GameCallbacks` → `TraderRegistration` → `Routers`
→ `HandbookCallbacks` → `SaveCallbacks` → `TraderCallbacks` → `PresetCallbacks`
→ `RagfairCallbacks` → `PostLoad`

**핵심 규칙:**

| 하는 일 | 단계 | 어기면 |
|---|---|---|
| 아이템 **추가** | `Preload` | `DatabaseModifiedAfterCutoffException` 으로 **서버 사망** |
| 아이템 **값 수정** | 아무 때나 (여기서는 `PostLoad`) | — |
| **상인 어사트** 추가 | `TraderRegistration` | 예외 없이 **조용히 실패** |

`DatabaseIntegrityService` 가 프로필 로드 시점에 아이템 키 목록을 스냅샷으로
떠 두기 때문입니다. 그래서 AIO 를 **로더 4개로 쪼갰습니다.**

| 로더 | 단계 | 담당 |
|---|---|---|
| `AioPreloadLoader` | `Preload + 10` | 아이템 복제, 도감 등록 |
| `AioLocaleLoader` | `Preload + 20` | 아이템 이름/설명 |
| `AioPatchLoader` | `PostLoad + 10` | 값 수정 전부 |
| `AioTraderLoader` | `TraderRegistration + 50` | 상인 판매 등록 |

### 3-5. `InjectionType` 열거형 번호가 밀렸습니다

| 값 | 3.x/4.0 | 4.1 |
|---|---|---|
| 0 | Singleton | **HostedService** |
| 1 | Transient | **Singleton** |
| 2 | Scoped | **Transient** |
| 3 | — | Scoped |

`[Injectable]` 의 기본 인자가 양쪽 다 `2` 인데 **가리키는 값이 다릅니다.**
컴파일은 되는데 의미가 바뀌는 종류의 함정입니다.

### 3-6. 컬렉션 타입이 바뀌었습니다

실제 시그니처를 뽑아 본 결과입니다.

| 멤버 | 4.1 실제 타입 | 주의점 |
|---|---|---|
| `TemplateTable.Items` | `Dictionary<MongoId, TemplateItem>` | 키가 `string` 이 아니라 `MongoId` |
| `TemplateItemProperties.Slots` | `IEnumerable<Slot>` | **`List` 가 아님** — 인덱스 접근 불가 |
| `SlotProperties.Filters` | `IEnumerable<SlotFilter>` | 같음 |
| `SlotFilter.Filter` | `HashSet<MongoId>` | `.Add()` 로 추가, **중복 자동 제거** |
| `GridProperties.Filters` | `IEnumerable<GridFilter>` | `SlotFilter` 와 **다른 타입** |
| `TemplateItemProperties.ConflictingItems` | `HashSet<MongoId>` | |
| `TemplateItemProperties.WeapFireType` | `HashSet<string>` | |
| `LocaleTable.Global` | `Dictionary<string, LazyLoad<GlobalLocaleDictionary>>` | **아래 참고** |

### 3-7. 로케일은 `LazyLoad` 라서 직접 못 넣습니다

3.11 은 `tables.locales.global[localeID][key] = value` 로 끝났습니다.
4.1 은 `LazyLoad<T>` 로 감싸여 있어서, 값을 직접 넣으면 실제 로케일이 로드될 때
**통째로 덮어써집니다.** 변환 함수를 등록해야 합니다.

```csharp
lazy.AddTransformer(dict =>
{
    foreach (var (key, value) in payload) dict[key] = value;
    return dict;
});
```

### 3-8. 깊은 복사

3.11 의 `jsonUtil.clone()` 에 대응하는 것은 `ICloner` 주입입니다.
C# record 의 `with` 식은 **얕은 복사**라서, 복제본의 슬롯에 부품을 추가하면
**원본까지 같이 바뀝니다.** SVT-40 커스텀 마운트가 정확히 이 케이스입니다.

```csharp
var clone = cloner.Clone(source) with { Id = newId };   // ICloner 는 깊은 복사
```

---

## 4. 동작이 3.11 과 달라진 부분

원본과 **의도적으로 다르게** 만든 것들입니다.

### 4-1. 없는 아이템에 대한 태도 — 서버가 안 죽습니다

3.11 원본은 `items[id]._props` 를 바로 참조해서, 다른 모드가 빠지면
`Cannot read property of undefined` 로 **서버 전체가 죽었습니다.**

4.1 포팅본은 없는 아이템을 만나면 경고 한 줄만 남기고 그 항목만 건너뜁니다.
모드 조합을 바꿔도 잘 버팁니다.

### 4-2. 전체 순회 패치가 모드 아이템까지 잡습니다

`super_plates`, `no_mount_extrasize`, `pnv_57e_anywhere` 는 DB 의 모든 아이템을
훑는 패치입니다. 3.11 은 `postDBLoad`(중간 단계)에서 돌아서 다른 모드가 나중에
추가한 아이템은 **놓쳤습니다.** 4.1 포팅본은 `PostLoad`(마지막 단계)에서 돌아
모드 아이템까지 함께 적용됩니다.

> 원본과 똑같이 하려면 `AioPatchLoader` 의 우선순위를 앞당기면 되지만,
> 이쪽이 의도에 더 맞다고 판단했습니다. 밸런스가 달라지면 알려 주십시오.

### 4-3. AllExamined 에 제외 목록이 생겼습니다

3.11 원본은 무조건 전체였습니다. `config.json` 의 `excludeItemIds` /
`excludeParentIds` 로 일부를 뺄 수 있게 했습니다. 비워 두면 원본과 동일합니다.

### 4-5. 프리셋 ID 가 고정됐습니다

tt33k 의 무기 프리셋 3개는 원본에서 `generateRandomID()` 로 **서버가 켜질 때마다
다른 ID** 를 받았습니다. 프리셋 이름에서 고정 ID 를 만들어 매번 같은 값이 되게 했습니다.
저장된 프로필이 프리셋을 참조할 때 안전합니다.

### 4-6. SPT 가 모르는 게임 프로퍼티도 전달됩니다

`PenetrationChance` 처럼 게임은 읽지만 SPT 4.1 의 `TemplateItemProperties` 에는
없는 값이 있습니다. 이런 값은 `ExtensionData`(`[JsonExtensionData]`)에 담아
클라이언트로 그대로 전달합니다. 검증 스크립트는 오류가 아니라 경고로 알려 줍니다.

### 4-4. SVT-40 커스텀 마운트에 이름이 생겼습니다

원본 코드는 `db/locales/global/en.json` 을 읽게 돼 있었는데 **그 파일이 저장소에
없었습니다.** 이대로면 게임에서 이름 없는 아이템으로 나옵니다.
한국어/영어 로케일을 새로 작성해 넣었습니다.

---

## 5. 일부러 그대로 둔 원본 버그

3.11 원본에 이런 코드가 있습니다.

```typescript
if (slot._name == "mod_tactical_000" || "mod_tactical_001")
```

자바스크립트에서 `"문자열"` 은 항상 참이라, 이 조건은 **언제나 참**입니다.
결과적으로 지정한 슬롯이 아니라 **모든 슬롯**에 적용되고 있었습니다.

해당 패치는 게임플레이를 3.11 과 동일하게 유지하려고 **그 동작을 그대로 재현**했습니다.
패치 JSON 에 이렇게 표시해 뒀습니다.

```jsonc
{
  "slots": ["*"],                                    // 실제 동작: 모든 슬롯
  "_intendedSlots": ["mod_tactical_000"],            // 원래 의도했던 슬롯
  "_note": "원본 3.11 코드가 ... 항상 참이었음 ..."
}
```

**의도대로 고치려면** `"slots"` 값을 `_intendedSlots` 값으로 바꾸면 됩니다.
해당하는 패치는 2개입니다: `vss_6p29m_mount_can_use_wmx200`,
`some_mounts_can_use_tactical_device`.

### 옮기지 않은 무효 코드

아래 두 가지는 3.11 에서도 아무 효과가 없던 코드라 옮기지 않았습니다.

| 원본 코드 | 왜 무효인가 |
|---|---|
| `pistolType54._props.RecoilCenter[1] = 0.3` | `RecoilCenter` 는 배열이 아니라 `{x,y,z}` 객체다. 자바스크립트에서 `[1]` 대입은 게임이 무시하는 숫자 키를 만들 뿐이다 |
| ATLAS 숙련도에 `"0088_ATL_SR25_FDE_8800"` 추가 | 이 ID 의 아이템이 ATLAS 팩에 없다. 원본 ATLAS 모드에서 가져온 잔재로, 존재하지 않는 템플릿을 가리킨다 |

---

## 6. 포팅을 어떻게 검증했는가

.NET SDK 설치가 이 작업 환경의 네트워크 정책에 막혀 있어서
**컴파일 검증은 하지 못했습니다.** 대신 세 가지로 신뢰도를 확보했습니다.

### (1) 리터럴 단위 원본 대조 — `tools/verify.py`

3.11 원본 TypeScript 에 있는 **모든 아이템 ID·숫자·슬롯 이름**을 뽑아서,
4.1 패치 JSON 에 빠짐없이 들어갔는지 블록 단위로 대조했습니다.

```
블록 42개 / 아이템 ID 1,457개 / 숫자 24개 / 슬롯 이름 전부  →  ALL BLOCKS VERIFIED
```

"컴파일은 되는데 내용이 누락된" 종류의 사고를 잡는 방법입니다.

### (2) SPT API 존재 확인 — `tools/apicheck.py`

NuGet 에서 받은 4.1.5 어셈블리의 **메타데이터를 직접 파싱**해서
(ECMA-335 테이블 리더를 작성했습니다 — `tools/mdump.py`, `tools/sigdump.py`),
C# 코드가 참조하는 네임스페이스 36건 / 타입 30건 / 멤버 80건이
실제로 존재하는지 전수 대조했습니다. 전부 통과했습니다.

이 문서 3장의 API 표는 **추측이 아니라 이 덤프에서 나온 사실**입니다.

### (3) 패치 데이터 스키마 검증 — `tools/datacheck.py`

패치 42개 / op 150개 / ID 참조 1,457개에 대해
프로퍼티 이름 존재 여부, ID 형식, `@세트` 해결 가능 여부,
stage 규칙(`cloneItem` 은 `preload` 여야 함)을 검사했습니다. 전부 통과했습니다.

### 남은 리스크

세 검증이 **컴파일과 실제 구동을 대체하지는 못합니다.** 실기 확인이 필요한 부분:

1. `dotnet build 4.1 -c Release` 가 통과하는지
2. 서버가 정상 기동하고 로그에 `패치 42개 / 작업 150건 적용 완료` 가 뜨는지
3. 게임 안에서 AKS-74U 연사속도, SVT-40 커스텀 마운트(스키어 판매), 방탄판 성능 확인

---

## 6-1. 저장소 정리 (포팅 완료 후)

포팅이 끝난 뒤 `3.x-original/` 을 정리했습니다.

| 항목 | 처리 |
|---|---|
| 번들(에셋) 583MB | `4.1/<모드>/mod/bundles/` 로 이동 — 실제로 배포되는 쪽에 둔다 |
| Items 팩 JSON 79개 | 이미 `4.1/.../mod/db/packs/` 에 동일하게 복사돼 있어 삭제 |
| `types/` (SPT 3.11 타입 선언 155개), `types.zip` | 구버전 SDK 타이핑이라 4.1 에 불필요 — 삭제 |
| `build.mjs`, `tsconfig.json`, `*.js`, `*.js.map`, `package.json` | 3.x 빌드 산출물/설정 — 삭제 |
| **`src/mod.ts` 4개 (476KB)** | **남김** — 포팅 대조 검증의 유일한 기준 |

결과: `3.x-original/` 588MB → 476KB.

> 참고: 작업 트리에서 지워도 **git 저장소 용량은 줄지 않습니다.** 583MB 블롭은 이미
> 히스토리에 들어 있어, 전체 클론은 여전히 그만큼을 받습니다. 얕은 클론
> (`git clone --depth 1`)과 체크아웃만 가벼워집니다.

번들을 `mod/` 아래에 둔 이유는 `Directory.Build.props` 의
`<None Include="mod\**\*" />` 가 출력 폴더로 자동 복사하기 때문입니다.
csproj 에서 `..\..\3.x-original\...` 링크를 걸던 항목을 없앨 수 있었습니다.

---

## 7. 포팅 결과 요약

| 모드 | 원본 | 4.1 결과 |
|---|---|---|
| `HANA_VI-AIO` | 1,865줄 | 패치 42개 / 작업 150개 |
| `HANA-VI-AllExamined` | 31줄 | 로더 1개 + 제외 목록 설정 |
| `HANA-VI-SuperAmmo` | 1,499줄 | 특수탄 28종 / 패치 5개 / 작업 136개 |
| `HANA-VI_Items` | 6,711줄 | 아이템 팩 11개 + 패치 8개 / 작업 505개 |

TypeScript 약 10,100줄 → C# 엔진(파일 21개) + JSON 데이터.

### 아이템 팩 11개를 어떻게 처리했나

3.11 은 팩마다 전용 주입 함수를 두고 있었습니다 (`injectAtlasGear`, `injectCarlQhb`,
`applyMosinExtension`, `applyG36Extension` …). 데이터 형식은 5종뿐인데 코드는 11벌이었습니다.

4.1 포팅본은 **형식별 처리기 5개 + 설명서(`db/packs.json`)** 로 바꿨습니다.
팩 데이터(JSON)는 **변환하지 않고 3.11 원본 그대로** 씁니다. 변환하면 그 과정에서
값이 어긋날 위험이 있고, HANA_VI 가 익숙한 파일 구조도 깨지기 때문입니다.

| format | 팩 | 처리 |
|---|---|---|
| `hanamod` | ATLAS-GEAR, Carl-QHB, SIG_MCX_VIRTUS, SDTAC_KITS, qbz191 | `PackInjector` |
| `wtt` | Items | SPT `CustomItemService.CreateItemFromClone` |
| `raw` | mxlr | 완성된 템플릿을 그대로 얹음 |
| `mosin` | mosin | `newitems.json` + `modifyItem.json` |
| `nerv` | g36, nervex | `nerv_inv/*.json` |

`tt33k`(844줄)만 팩이 아니라 코드 내장형이라, 패치 데이터(op 98개)로 옮겼습니다.

### 패치 엔진 op 10종

`setProps` `adjustProps` `appendProps` `addFilter` `cloneItem`
`handbookEntry` `addPreset` `traderOffer` `questWeapons` `masteryTemplates`

대상 지정 4종(`targets` / `targetsByParent` / `targetsByBaseClass` / `targetsAll`)과
`whenPropEquals` 로 좁히기를 조합하면 3.11 의 모든 반복문 패턴이 표현됩니다.
