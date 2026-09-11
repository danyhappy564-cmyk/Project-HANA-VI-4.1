# 검증 스크립트

SPT 4.1 서버를 켜기 전에 실수를 잡아내는 도구입니다. 파이썬 3만 있으면 됩니다.

이 환경에서는 .NET SDK 설치가 막혀 있어 컴파일 검증을 하지 못했습니다.
아래 스크립트들이 그 자리를 대신합니다.

---

## 1. 패치 데이터 검증 (가장 자주 쓰는 것)

```bash
python3 tools/datacheck.py 4.1/HANA_VI-AIO/mod
python3 tools/datacheck.py 4.1/HANA-VI-SuperAmmo/mod
python3 tools/datacheck.py 4.1/HANA-VI_Items/mod
```

`mod/db/patches/*.json` 을 고쳤으면 **커밋 전에 반드시** 돌리십시오. 잡아내는 것:

- 모르는 `op` 이름, 잘못된 `stage` / `into` 값
- 24자 16진수가 아닌 아이템 ID
- 존재하지 않는 프로퍼티 이름 (`bFirerate` 를 `bFireRate` 로 오타낸 경우 등)
- 찾을 수 없는 `@세트이름`, `$값이름`
- `config.json` 과 패치 파일 `key` 불일치
- **`cloneItem` 인데 `stage: "preload"` 가 빠진 경우** ← 서버가 죽는 사고

SPT 타입에 없는 게임 프로퍼티는 오류가 아니라 **경고**로 알려 줍니다
(`ExtensionData` 로 게임에 전달되기 때문입니다).

---

## 2. 원본 대조 검증 (포팅이 원본과 같은지)

```bash
# 블록(this.cfg.*) 구조가 있는 모드
python3 tools/verify.py 3.x-original/HANA_VI-AIO/src/mod.ts 4.1/HANA_VI-AIO/mod/db/patches

# 블록 구조가 없는 모드
python3 tools/verify_literals.py 3.x-original/HANA-VI-SuperAmmo/src/mod.ts 4.1/HANA-VI-SuperAmmo/mod
```

3.11 원본 TypeScript 의 **모든 아이템 ID·숫자·슬롯 이름·번들 경로**가 4.1 패치 JSON 에
빠짐없이 들어갔는지 리터럴 단위로 대조합니다. 포팅 누락을 잡는 용도입니다.

`verify_literals.py` 는 원본에 선언만 되고 실제로는 쓰이지 않는 ID 를 자동으로 제외합니다
(Items 에는 AIO 소스를 복사해 오면서 남은 미사용 ID 가 84개 있습니다).

> 실제로 이 검증이 Items 의 `magCompatMap` 누락을 잡았습니다.
> 새 탄창 74종을 어떤 총에도 장착할 수 없게 만드는 누락이었습니다.

---

## 3. SPT API 존재 확인 (C# 을 고쳤을 때)

```bash
python3 tools/apicheck.py 4.1
```

C# 코드가 참조하는 SPT 네임스페이스·타입·멤버가 4.1.5 어셈블리에 실제로 있는지 대조합니다.

## 4. C# 정적 점검 (C# 을 고쳤을 때)

```bash
python3 tools/csharpcheck.py 4.1
```

- csproj 가 링크하는 `Shared/` · `bundles/` 경로가 실제로 있는지
- 생성자 주입 타입이 SPT 어셈블리에 있는지
- **로드 단계 규칙**: 아이템 등록 로더가 `Preload` 인지, 상인 로더가 `TraderRegistration` 인지
- 패치 데이터가 쓰는 `op` 이름을 `PatchEngine` 이 전부 아는지

---

## 5. 어셈블리 덤프 갱신 (SPT 버전이 올라갔을 때)

`tools/sptarkov_*.json` 은 SPT 4.1.5 어셈블리에서 뽑아낸 타입 목록입니다.
SPT 가 올라가면 새로 만들어야 합니다.

```bash
# NuGet 에서 받기 (패키지명은 SPTushonka.*, 어셈블리명은 SPTarkov.*)
curl -o core.nupkg https://api.nuget.org/v3-flatcontainer/sptushonka.server.core/4.2.0/sptushonka.server.core.4.2.0.nupkg
unzip -o core.nupkg 'lib/*'
python3 tools/mdump.py lib/net10.0/SPTarkov.Server.Core.dll tools/sptarkov_server_core.json
```

`mdump.py` 는 ECMA-335 메타데이터를 직접 읽는 파서입니다 (.NET SDK 없이 동작합니다).

- `tools/sigdump.py <dll> <타입이름...>` — 프로퍼티의 **타입**까지 보여줍니다.
  `Slots` 가 `List` 인지 `IEnumerable` 인지 같은 걸 확인할 때 씁니다.
- `tools/methsig.py <dll> <타입이름...>` — 메서드 시그니처를 보여줍니다.

---

## 6. 변환 스크립트 (재현용)

3.11 TypeScript 를 4.1 패치 JSON 으로 바꾼 스크립트들입니다.
원본에서 다시 뽑아야 할 때만 쓰며, 평소에는 돌릴 일이 없습니다.

| 스크립트 | 대상 |
|---|---|
| `extract.py` + `generate.py` | AIO (`this.cfg.*` 블록 42개) |
| `extract_ammo.py` + `gen_ammo.py` | SuperAmmo (itemsToClone + 호환 규칙) |
| `extract_items.py` | Items 설정 패치 7블록 |
| `extract_tt33k.py` | Items 의 tt33k 확장 (844줄) |

모든 추출기는 **인식하지 못한 구문을 전부 보고**합니다.
"조용히 빠뜨리는" 사고를 막기 위한 장치입니다.
