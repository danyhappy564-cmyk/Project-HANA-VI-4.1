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

| 모드 | 원본 규모 | 상태 |
|---|---|---|
| `HANA_VI-AIO` | 1,865줄 / 토글 42개 | ✅ **포팅 완료** (검증 통과, 실기 확인 대기) |
| `HANA-VI-AllExamined` | 31줄 | ✅ **포팅 완료** |
| `HANA-VI_Items` | 6,711줄 + 아이템팩 12개 | ⏳ 미착수 |
| `HANA-VI-SuperAmmo` | 1,499줄 | ⏳ 미착수 |

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
  HANA_VI-AIO/
    *.cs                    패치 엔진           ← R_F
    mod/config.json         패치 on/off         ← HANA_VI
    mod/db/ammo.json        구경별 탄약 묶음     ← HANA_VI
    mod/db/patches/*.json   패치 42개           ← HANA_VI
    mod/db/locales/         아이템 이름/설명     ← HANA_VI
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
python3 tools/datacheck.py 4.1/HANA_VI-AIO/mod     # 패치 데이터 (자주 씀)
python3 tools/verify.py 3.x-original/HANA_VI-AIO/src/mod.ts 4.1/HANA_VI-AIO/mod/db/patches
python3 tools/apicheck.py 4.1                      # C# 을 고쳤을 때
```

현재 상태:

```
패치 42개 / op 150개 / ID 참조 1,457개 검사  →  전부 통과
블록 42개 원본 리터럴 대조                    →  ALL BLOCKS VERIFIED
SPT API 네임스페이스 36 / 타입 30 / 멤버 80   →  전부 존재 확인
```

---

## 실기 테스트가 필요한 항목

이 환경에서는 .NET SDK 설치가 막혀 있어 **컴파일·구동 검증을 하지 못했습니다.**
아래를 확인해 주시면 도움이 됩니다.

1. `dotnet build 4.1 -c Release` 통과 여부
2. 서버 기동 시 로그에 `[HANA-VI AIO] 패치 42개 / 작업 150건 적용 완료` 가 뜨는지
3. 게임 내 확인 — AKS-74U 연사속도(735), 스키어의 SVT-40 커스텀 마운트(7,400루블),
   방탄판 성능 상향, 모든 아이템 검사 완료 상태
