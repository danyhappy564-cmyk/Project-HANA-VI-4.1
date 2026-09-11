#!/usr/bin/env python3
"""C# 소스에서 흔한 포팅 실수를 정적으로 잡는다 (.NET SDK 없이 돌아가는 최소 점검).

- 프로젝트가 참조하는 Shared 소스가 실제로 존재하는가
- 생성자 주입 타입이 SPT 어셈블리에 있는가
- [Injectable] 이 붙은 IOnLoad 구현이 로드 단계 규칙을 지키는가
- 엔진이 아는 op 이름과 패치 데이터의 op 이름이 일치하는가
"""
import json, os, re, sys

SP = os.path.dirname(os.path.abspath(__file__))
dumps = {}
for f in ['sptarkov_server_core', 'sptarkov_di', 'sptarkov_common', 'sptarkov_reflection']:
    path = os.path.join(SP, f + '.json')
    if os.path.exists(path): dumps.update(json.load(open(path)))
short = {}
for full in dumps:
    short.setdefault(full.rsplit('.', 1)[-1], full)

ROOT = sys.argv[1]
sources = []
for root, _, files in os.walk(ROOT):
    if any(x in root for x in ('obj', 'bin')): continue
    for fn in files:
        if fn.endswith('.cs'): sources.append(os.path.join(root, fn))

errs, warns = [], []

# 1) csproj 가 링크하는 Shared 경로가 실제로 있는가
for root, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith('.csproj'): continue
        text = open(os.path.join(root, fn), encoding='utf-8').read()
        for inc in re.findall(r'<Compile Include="([^"]+)"', text):
            base = inc.split('**')[0].replace('\\', os.sep)
            if not os.path.isdir(os.path.join(root, base)):
                errs.append(f"{fn}: Compile Include 경로가 없다 — {inc}")
        for inc in re.findall(r'<None Include="([^"]+)"', text):
            base = inc.split('**')[0].replace('\\', os.sep).rstrip(os.sep)
            p = os.path.join(root, base)
            if not (os.path.isdir(p) or os.path.isfile(p)):
                warns.append(f"{fn}: None Include 경로가 없다 — {inc}")

# 2) 생성자 주입 타입이 SPT 어셈블리에 있는가 (프로젝트 안에서 정의한 타입은 제외)
local = set()
for path in sources:
    text = open(path, encoding='utf-8').read()
    local |= set(re.findall(r'\b(?:class|record|interface|enum)\s+(\w+)', text))

KNOWN_BCL = {'string','int','bool','double','float','long','object','CancellationToken','Task',
             'List','Dictionary','HashSet','JsonElement','JsonNode','JsonObject','Assembly','Type'}
for path in sources:
    text = open(path, encoding='utf-8').read()
    for m in re.finditer(r'public class (\w+)\(([^)]*)\)', text, re.S):
        for param in m.group(2).split(','):
            param = param.strip()
            if not param: continue
            tm = re.match(r'([\w<>\[\]?.]+)\s+\w+$', param)
            if not tm: continue
            t = tm.group(1).split('<')[0].split('.')[-1].rstrip('?[]')
            if t in KNOWN_BCL or t in local: continue
            if t not in short and f'{t}`1' not in short:
                errs.append(f"{os.path.basename(path)}: 주입 타입 '{t}' 을(를) SPT 어셈블리에서 찾을 수 없다")

# 3) 로드 단계 규칙
for path in sources:
    text = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\[Injectable\(([^\]]*)\)\]\s*public class (\w+)[^{]*?:\s*(\w+)', text, re.S):
        attr, cls, base = m.group(1), m.group(2), m.group(3)
        stage = re.search(r'OnLoadOrder\.(\w+)', attr)
        if not stage: continue
        stage = stage.group(1)
        if base.startswith('Preload') and stage != 'Preload':
            errs.append(f"{cls}: 아이템 등록 로더인데 {stage} 단계다 (Preload 여야 한다)")
        if base.startswith('Trader') and stage != 'TraderRegistration':
            errs.append(f"{cls}: 상인 로더인데 {stage} 단계다 (TraderRegistration 이어야 한다)")

# 4) 엔진이 아는 op 과 데이터의 op 이 맞는가
engine = os.path.join(ROOT, 'Shared', 'Patching', 'PatchEngine.cs')
if os.path.exists(engine):
    text = open(engine, encoding='utf-8').read()
    known = set(re.findall(r'"(\w+)"\s*=>\s*\w+\(', text)) | {'traderOffer'}
    used = set()
    for root, _, files in os.walk(ROOT):
        if 'packs' in root: continue
        for fn in files:
            if not fn.endswith('.json') or 'patches' not in root: continue
            for doc in [json.load(open(os.path.join(root, fn), encoding='utf-8'))]:
                for op in doc.get('ops', []): used.add(op.get('op'))
    for op in sorted(used - known):
        errs.append(f"패치 데이터가 쓰는 op '{op}' 을(를) PatchEngine 이 모른다")
    for op in sorted(known - used):
        warns.append(f"PatchEngine 의 op '{op}' 은 지금 쓰이는 데이터가 없다")

print(f"C# 파일 {len(sources)}개 점검")
for w in warns: print("  경고:", w)
if errs:
    print(f"\n오류 {len(errs)}건:")
    for e in errs: print("  -", e)
    sys.exit(1)
print("\nC# 정적 점검 통과")
