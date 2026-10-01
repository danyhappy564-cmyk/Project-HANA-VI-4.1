# Project HANA-VI 4.1

**제작자 (Original Author):** HANA_VI — https://arca.live/u/@HANA_VI

**포팅 (Porting):** R_F — https://arca.live/u/@R_F/89477337

**원본 링크 (Original Link):** https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1

**License:** MIT

---

### ⚠️ IMPORTANT NOTICE / DISCLAIMER

**Original Author:** HANA_VI (https://arca.live/u/@HANA_VI)

**Original Link:** https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1

**License notation:** MIT

> `HANA-VI-SuperAmmo` 는 Rising Star (ElacoLR) 님의 `zz_RS-Exploster` 를 원본으로 하며,
> HANA_VI 님이 수정하고 GoRani 님이 번들을 제작한 것입니다. 해당 모드의 크레딧은 원 저작자들께 있습니다.

---

## 변경 이력

- 2026-10-02 02:03 — **실제 SPT 4.1 서버를 띄워서 확인하고, 서버가 켜지지 않던 문제와 아이템이 빠지던 문제를 고쳤습니다.**
  - **서버가 시작하자마자 꺼지던 문제**: 모드 4개가 같은 이름의 공용 부품(`PatchLoader` = 패치 파일을 읽는 부분 등)을
    각자 들고 있었는데, SPT 는 이름이 같으면 하나만 등록해서 나머지 모드가 시작을 못 했습니다. 빌드할 때 모드마다
    이름을 다르게(예: `HanaVi.Items.Shared`) 붙여서 해결.
  - **Items 의 새 아이템 209개가 안 만들어지던 문제**: 확장 탄창 74종·TT-33K·전술키트 부품을 만드는 단계(preload)를
    실행하는 부분이 Items 에만 빠져 있었습니다. 그런데 상인 판매 등록은 돼서 "없는 아이템을 파는" 상태였습니다. 추가해서 해결.
  - **탄창 슬롯·충돌 목록 값을 못 넣던 문제**: 값 변환에 SPT 전용 변환 규칙을 안 써서 `_parent`, `Slots`, `ConflictingItems` 가
    오류로 빠졌습니다(80여 건). SPT 설정을 쓰도록 수정.
  - 데이터 수정: `Remington ACR.json` 의 `"Ergonomics": "11"`(문자라서 그 부품 설정 전체가 무시됨) → 숫자 `11`.
    `06_Extended_mags.json` 에서 슬롯 `_parent` 에 아이템 ID 대신 `"35ARSENAL"` 같은 이름이 들어 있던 6곳 → 다른 탄창처럼 `$self`.
    `bundles.json` 의 중복 항목 51개 삭제(같은 내용이 두 번씩 있었음). `packs.json` 의 설명용 항목이 "이름 없는 팩"으로 읽히던 것 수정.
  - ⚠️ **아직 남은 문제 — 번들 파일 301개가 저장소에 없습니다.** [docs/missing-bundles.md](docs/missing-bundles.md) 참고.
    3.11 모드 폴더에서 복사해 넣어야 해당 아이템이 게임에서 보입니다.

- 2026-10-02 01:46 — **빌드 오류 수정 + 쉽게 쓰는 도구 2개 추가.**
  - 컴파일이 안 되던 문제(오류 35개, 경고 23개)를 실제로 빌드해 보며 전부 고쳤습니다. 이제 오류·경고 0개입니다.
    원인은 `Path`(파일 경로 도구) 이름이 SPT 의 봇 경로 타입과 겹친 것, SPT 4.1 에서 "처음 만들 때만 넣을 수 있게" 잠긴
    도감·프리셋 목록에 새 목록을 넣으려 한 것, 새 아이템 내부 이름(`NewItemName`)을 빼먹은 것 등입니다.
  - **빌드 결과 폴더 구조 버그 수정**: 빌드하면 설정·패치 파일이 `user/mods/<모드>/mod/` 안으로 한 단계 더 들어가서,
    서버가 설정·패치·번들을 하나도 못 찾는 상태였습니다(오류 없이 아무 효과가 없음). 이제 `user/mods/<모드>/config.json` 처럼 제자리에 들어갑니다.
  - `HANA-VI 빌드.bat` — 더블클릭하면 .NET SDK 설치 확인 → 빌드 → SPT 폴더 복사 → zip 생성까지 한 번에.
  - `HANA-VI 설정 편집기.bat` — 더블클릭하면 브라우저에 설정 화면(http://127.0.0.1)이 열려서 패치 켜기/끄기·수치를 클릭으로 고칩니다.

---

## 이 저장소는 무엇인가

HANA_VI 님의 SPT 3.11 모드팩을 **SPT 4.1.5** 로 포팅하는 작업 저장소입니다.

SPT 는 4.0 부터 서버가 **TypeScript 에서 C# (.NET 10) 으로 완전히 바뀌었습니다.**
따라서 이 작업은 수정이 아니라 **재작성**입니다.

---

## 역할 분담

| 사람 | 담당 | 건드리는 파일 |
|---|---|---|
| **R_F** | 3.x → 4.1 **포팅** (C# 엔진, 로드 단계, 빌드) | `4.1/**/*.cs` |
| **HANA_VI** | **메인터넌스** (CONFIG 및 세부 조정) | `4.1/**/mod/**/*.json` |

이 분담이 가능하도록 **코드와 데이터를 분리**했습니다.
수치·대상 아이템·on/off 는 전부 JSON 에 있어서, **.NET 설치도 재컴파일도 없이**
JSON 을 고치고 서버만 재시작하면 반영됩니다.

---

## 진행 상황

| 모드 | 원본 규모 | 4.1 포팅 결과 | 상태 |
|---|---|---|---|
| `HANA_VI-AIO` | 1,865줄 | 패치 42개 / 작업 150개 | ✅ 완료 |
| `HANA-VI-AllExamined` | 31줄 | 로더 1개 + 제외 목록 설정 | ✅ 완료 |
| `HANA-VI-SuperAmmo` | 1,499줄 | 특수탄 28종 / 패치 5개 / 작업 136개 | ✅ 완료 |
| `HANA-VI_Items` | 6,711줄 | 아이템 팩 11개 + 패치 8개 / 작업 505개 | ✅ 완료 |

TypeScript 약 10,100줄을 C# 패치 엔진 + JSON 데이터로 재작성했습니다.
**모든 포팅이 끝났고, 남은 것은 실기(실제 게임) 확인입니다.**

---

## 문서

| 문서 | 대상 | 내용 |
|---|---|---|
| [**docs/HANA_VI-MAINTENANCE.md**](docs/HANA_VI-MAINTENANCE.md) | HANA_VI 님 | **수치·설정을 어떻게 바꾸는가.** C# 몰라도 됨 |
| [**CLAUDE.md**](CLAUDE.md) | AI 어시스턴트 | Claude Code / ChatGPT 에게 붙여넣는 작업 지침서 |
| [**docs/PORTING-NOTES.md**](docs/PORTING-NOTES.md) | 전부 | **무엇이 왜 바뀌었는가.** SPT 4.1 API 변경점 정리 |
| [**tools/README.md**](tools/README.md) | 전부 | 검증 스크립트 사용법 |

---

## 폴더 구조

```
3.x-original/        SPT 3.11 원본 mod.ts 4개 (476KB, 대조 기준)
4.1/                 SPT 4.1 포팅본
  Directory.Build.props     공통 빌드 설정
  Shared/                   모드 4개가 공유하는 엔진 (소스 링크로 각 DLL 에 컴파일)
    Patching/               패치 엔진 (op 10종)
    Packs/                  아이템 팩 주입 엔진
    Loaders/                로드 단계별 로더 뼈대
  HANA_VI-AIO/
    mod/config.json         패치 on/off         ← HANA_VI
    mod/db/ammo.json        구경별 탄약 묶음     ← HANA_VI
    mod/db/patches/*.json   패치 42개           ← HANA_VI
    mod/db/locales/         아이템 이름/설명     ← HANA_VI
  HANA-VI-SuperAmmo/
    mod/db/values.json      탄 적재량·배경색     ← HANA_VI
    mod/db/patches/*.json   패치 5개            ← HANA_VI
    mod/bundles/            에셋 번들
  HANA-VI_Items/
    mod/db/packs.json       아이템 팩 목록       ← HANA_VI
    mod/db/packs/           팩 데이터 (3.11 원본 그대로)  ← HANA_VI
    mod/db/patches/*.json   패치 8개            ← HANA_VI
    mod/bundles/            에셋 번들 (579MB)
  HANA-VI-AllExamined/
docs/                설명 문서
tools/               검증 스크립트
  build.ps1                 "HANA-VI 빌드.bat" 본체
  editor/                   "HANA-VI 설정 편집기.bat" 본체 (server.ps1 + index.html)
HANA-VI 빌드.bat       더블클릭 빌드
HANA-VI 설정 편집기.bat  더블클릭 웹 설정 편집기
CLAUDE.md            AI 어시스턴트 지침서
```

---

## 쉽게 쓰기 — 더블클릭 2개

| 파일 | 하는 일 |
|---|---|
| **`HANA-VI 설정 편집기.bat`** | 브라우저에 설정 화면이 열립니다. 패치 켜기/끄기, 연사속도·탄 적재량 같은 수치, 아이템 팩 on/off 를 클릭으로 고치고 **[모두 저장]** 하면 끝. 저장할 때 이 저장소와 설치된 SPT 모드 폴더를 **둘 다** 고치므로 서버만 재시작하면 됩니다. 고치기 전 파일은 `.editor-backup\` 에 자동 백업됩니다. |
| **`HANA-VI 빌드.bat`** | .NET 10 SDK 가 없으면 설치를 도와주고(winget), 빌드 → `E:\SPT 4.1\SPT_Runtime\user\mods` 복사 → `release\*.zip` 생성까지 합니다. SPT 경로가 다르면 처음 한 번 물어보고 기억합니다. **C# 을 고쳤을 때만** 필요합니다. |

- 설정 편집기 주소 `http://127.0.0.1:8642` 의 `127.0.0.1` 은 "이 컴퓨터 자신"이라는 뜻입니다. 다른 컴퓨터나 인터넷에서는 열리지 않습니다.
- 편집기는 Windows 에 기본으로 있는 PowerShell 로 돌아가서 따로 설치할 것이 없습니다.
- SPT 를 설치해 둔 PC 라면 아이템 ID 옆에 한국어 아이템 이름이 같이 표시됩니다.
- 빌드할 때는 SPT 서버를 꺼 주세요 (켜져 있으면 DLL 을 덮어쓰지 못합니다).

## 빌드 (명령줄)

.NET 10 SDK 가 필요합니다. (https://dotnet.microsoft.com/download)

```bash
# 빌드 + E:\SPT 4.1\SPT_Runtime\user\mods 로 자동 배포 + release/*.zip 생성
dotnet build Project-HANA-VI-4.1.slnx -c Release

# SPT 설치 경로가 다르면
dotnet build Project-HANA-VI-4.1.slnx -c Release -p:SptRoot="D:\SPT 4.1"

# 솔루션 없이 폴더째로 빌드해도 동일합니다
dotnet build 4.1 -c Release
```

`Project-HANA-VI-4.1.slnx` 를 Visual Studio 나 Rider 로 열면 프로젝트 4개가 한 번에 붙습니다.
`.slnx` 는 .NET 9 SDK(9.0.200)부터 들어간 XML 솔루션 형식이라, net10.0 을 쓰는 이 프로젝트는
별도 설정 없이 바로 열립니다.

**JSON 만 고쳤다면 빌드는 필요 없습니다.** 설정 편집기로 저장하거나 `user/mods/<모드폴더>/` 의 JSON 을
직접 고치고 서버만 재시작하십시오.

---

## 수정 후 검증

```bash
# 패치 데이터 검증 (가장 자주 씀)
python3 tools/datacheck.py 4.1/HANA_VI-AIO/mod
python3 tools/datacheck.py 4.1/HANA-VI-SuperAmmo/mod
python3 tools/datacheck.py 4.1/HANA-VI_Items/mod

# 원본 대조
python3 tools/verify.py 3.x-original/HANA_VI-AIO/src/mod.ts 4.1/HANA_VI-AIO/mod/db/patches
python3 tools/verify_literals.py 3.x-original/HANA-VI-SuperAmmo/src/mod.ts 4.1/HANA-VI-SuperAmmo/mod

# C# 을 고쳤을 때
python3 tools/apicheck.py 4.1        # SPT API 존재 확인
python3 tools/csharpcheck.py 4.1     # 로드 단계 규칙 / op 이름 일치
```

현재 상태:

```
AIO        패치 42개 / op 150개 / ID 참조 1,465개   →  통과
SuperAmmo  패치  5개 / op 136개 / ID 참조   301개   →  통과
Items      패치  8개 / op 505개 / ID 참조 1,731개   →  통과
원본 리터럴 대조  AIO 42블록 / SuperAmmo / Items / tt33k  →  전부 확인
SPT API  네임스페이스 60 / 타입 38 / 멤버 105        →  전부 존재
C# 정적 점검  파일 21개                              →  통과
```

---

## 검증 상태

**2026-10-02, 컨테이너에서 실제 SPT 4.1 서버(4.1.6 데이터)를 띄워 확인했습니다.**

| 항목 | 결과 |
|---|---|
| `dotnet build` | ✅ 오류 0 / 경고 0 |
| 서버 기동 (모드 4개 동시) | ✅ 정상 기동 |
| AIO | ✅ 새 아이템 2 · 상인 1건 · 패치 42개/작업 147건 적용, 오류 없음 |
| SuperAmmo | ✅ 특수탄 등 새 아이템 56 · 상인 27건 · 패치 5개/작업 43건, 오류 없음 |
| Items | ✅ 팩 10개 313개 + 패치 아이템 209개 · 상인 99+53건 · 패치 8개/작업 196건, 코드 오류 없음 |
| AllExamined | ✅ 아이템 5,114개 검사 완료 처리 |
| 게임 API 로 값 확인 | ✅ AKS-74U 연사속도 735, 확장 탄창 생성·탄 슬롯 40발, ACR 손잡이 인체공학 11 |
| 번들 | ⚠️ Items 번들 **301개 파일 없음 + 1개 0바이트** → [docs/missing-bundles.md](docs/missing-bundles.md) |

아직 확인 못 한 것 (게임 클라이언트가 필요):

- 아이템이 게임 안에서 실제로 보이고 장착되는지 (특히 번들 누락분)
- 상인 화면에서 판매 목록이 정상인지
- AIO: 스키어의 SVT-40 커스텀 마운트(7,400루블), 방탄판 성능 상향
- SuperAmmo: 스키어 신뢰도 4에 특수탄, 같은 구경 총기·탄창에 장전되는지
