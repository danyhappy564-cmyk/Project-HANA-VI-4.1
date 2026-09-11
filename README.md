# Project HANA-VI 4.1

**제작자 (Original Author):** HANA_VI — https://arca.live/u/@HANA_VI

**포팅 (Porting):** R_F — https://arca.live/u/@R_F/89477337

**원본 저장소 (Original Repository):** Project-HANA-VI

**원본 링크 (Original Link):** https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1

**License:** MIT

---

### ⚠️ IMPORTANT NOTICE / DISCLAIMER

**Original Author:** HANA_VI (https://arca.live/u/@HANA_VI)

**Original Repository:** Project-HANA-VI

**Original Link:** https://github.com/danyhappy564-cmyk/Project-HANA-VI-4.1

**License notation:** MIT

1. **Reflection & Take-Downs:** I deeply reflect on the ECOT incident. As an AI-assisted "vibe coder," I will immediately delete files if the original authors ask.
2. **No Re-Distribution:** These ported builds are unverified, temporary fixes. Please do NOT re-upload or share them anywhere else.
3. **Do Not Pester Original Authors:** Never report bugs or pester original modders regarding issues from my unofficial ports.
4. **Full Credit & Respect:** I will always credit original creators on GitHub and prioritize their decisions above all else.
5. **Support Original Creators:** Instead of using my ports, please visit the original authors' Forge pages to leave kind words or tips.

> `HANA-VI-SuperAmmo` 는 Rising Star (ElacoLR) 님의 `zz_RS-Exploster` 를 원본으로 하며,
> HANA_VI 님이 수정하고 GoRani 님이 번들을 제작한 것입니다. 해당 모드의 크레딧은 원 저작자들께 있습니다.

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
3.x-original/        SPT 3.11 원본 (읽기 전용, 대조 기준)
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
  HANA-VI_Items/
    mod/db/packs.json       아이템 팩 목록       ← HANA_VI
    mod/db/packs/           팩 데이터 (3.11 원본 그대로)  ← HANA_VI
    mod/db/patches/*.json   패치 8개            ← HANA_VI
  HANA-VI-AllExamined/
docs/                설명 문서
tools/               검증 스크립트
CLAUDE.md            AI 어시스턴트 지침서
```

---

## 빌드

.NET 10 SDK 가 필요합니다. (https://dotnet.microsoft.com/download)

```bash
# 빌드 + E:\SPT 4.1\SPT_Runtime\user\mods 로 자동 배포 + release/*.zip 생성
dotnet build 4.1 -c Release

# SPT 설치 경로가 다르면
dotnet build 4.1 -c Release -p:SptRoot="D:\SPT 4.1"
```

**JSON 만 고쳤다면 빌드는 필요 없습니다.** `user/mods/<모드폴더>/` 의 JSON 을
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

## 실기 테스트가 필요한 항목

이 환경에서는 .NET SDK 설치가 막혀 있어 **컴파일·구동 검증을 하지 못했습니다.**
아래를 확인해 주시면 도움이 됩니다.

1. `dotnet build 4.1 -c Release` 통과 여부
2. 서버 기동 시 로그에 `[HANA-VI AIO] 패치 42개 / 작업 150건 적용 완료` 가 뜨는지
3. 게임 내 확인
   - AIO: AKS-74U 연사속도(735), 스키어의 SVT-40 커스텀 마운트(7,400루블), 방탄판 성능 상향
   - SuperAmmo: 스키어 충성도 4에 특수탄 28종, 같은 구경 총기·탄창에 장착되는지
   - Items: 아이템 팩 11개의 무기·장비가 상인에 뜨는지, 확장 탄창 74종이 총에 붙는지
   - AllExamined: 모든 아이템이 검사 완료 상태인지
