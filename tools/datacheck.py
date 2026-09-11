#!/usr/bin/env python3
"""패치 JSON 이 엔진 스키마와 실제 SPT 프로퍼티 이름에 맞는지 검증."""
import json, os, sys, re

SP = os.path.dirname(os.path.abspath(__file__))
DUMP = os.path.join(SP, 'sptarkov_server_core.json')
props = set()
if os.path.exists(DUMP):
    core = json.load(open(DUMP))
    for k, v in core.items():
        if k.endswith('TemplateItemProperties'):
            props = {p.lower() for p in v['props']}
else:
    # 어셈블리 덤프가 없으면 프로퍼티 이름 검사는 건너뛴다.
    # 덤프를 만들려면:  python3 tools/mdump.py <SPTarkov.Server.Core.dll> tools/sptarkov_server_core.json
    print("[안내] tools/sptarkov_server_core.json 이 없어 프로퍼티 이름 검사는 건너뛴다")
# [JsonPropertyName] 으로 매핑되는 소문자 시작 이름은 어셈블리 문자열에서 확인했다.
JSON_ALIASES = {'bfirerate', 'weapfiretype', 'durability', 'maxdurability'}

MOD = sys.argv[1]
patchdir = os.path.join(MOD, 'db', 'patches')
ammo = json.load(open(os.path.join(MOD, 'db', 'ammo.json'), encoding='utf-8'))
config = json.load(open(os.path.join(MOD, 'config.json'), encoding='utf-8'))

OPS = {'setProps', 'appendProps', 'addFilter', 'cloneItem', 'handbookEntry', 'traderOffer'}
INTO = {'slot', 'chamber', 'cartridge', 'grid'}
STAGES = {'preload', 'postload', 'trader'}
ID = re.compile(r'^[0-9a-zA-Z]{24}$')

errs, warns = [], []
keys = set()
n_ops = n_ids = 0

for fn in sorted(os.listdir(patchdir)):
    doc = json.load(open(os.path.join(patchdir, fn), encoding='utf-8'))
    where = lambda m: errs.append(f"{fn}: {m}")

    if not doc.get('key'): where("key 가 없다")
    if doc['key'] in keys: where(f"key '{doc['key']}' 중복")
    keys.add(doc['key'])
    if doc['key'] not in config['patches']:
        where(f"key '{doc['key']}' 가 config.json 의 patches 에 없다")

    sets = doc.get('sets', {})
    for sname, vals in sets.items():
        for v in vals:
            n_ids += 1
            if not ID.match(v): where(f"sets.{sname} 의 '{v}' 는 24자 ID 형식이 아니다")

    def resolve(val, field):
        out = []
        toks = [val] if isinstance(val, str) else (val if isinstance(val, list) else [])
        for t in toks:
            if not isinstance(t, str): where(f"{field} 에 문자열이 아닌 값"); continue
            if t.startswith('@'):
                name = t[1:]
                if name in sets: out += sets[name]
                elif name in ammo: out += ammo[name]
                else: where(f"{field} 의 '@{name}' 세트를 찾을 수 없다")
            else:
                out.append(t)
        return out

    for i, op in enumerate(doc.get('ops', [])):
        n_ops += 1
        tag = f"ops[{i}]"
        kind = op.get('op')
        if kind not in OPS: where(f"{tag}: 모르는 op '{kind}'"); continue
        if 'stage' in op and op['stage'] not in STAGES:
            where(f"{tag}: 모르는 stage '{op['stage']}'")

        targeting = sum([bool(op.get('targets')), bool(op.get('targetsByParent')), bool(op.get('targetsAll'))])
        if kind in ('setProps', 'appendProps', 'addFilter') and targeting != 1:
            where(f"{tag}: 대상 지정이 정확히 하나여야 한다 (targets / targetsByParent / targetsAll)")

        for f in ('targets', 'add'):
            if f in op:
                for v in resolve(op[f], f"{tag}.{f}"):
                    n_ids += 1
                    if not ID.match(v): where(f"{tag}.{f} 의 '{v}' 는 24자 ID 형식이 아니다")

        if kind in ('setProps', 'appendProps'):
            for name, val in (op.get('props') or {}).items():
                if props and name.lower() not in props and name.lower() not in JSON_ALIASES:
                    where(f"{tag}: TemplateItemProperties 에 '{name}' 프로퍼티가 없다")
                if kind == 'appendProps' and not isinstance(val, list):
                    where(f"{tag}: appendProps 의 '{name}' 값은 배열이어야 한다")

        if kind == 'addFilter':
            if op.get('into', 'slot') not in INTO: where(f"{tag}: into 값이 잘못됐다")
            if not op.get('add'): where(f"{tag}: add 가 비어 있다")
            if op.get('into', 'slot') == 'slot' and not (op.get('slots') or op.get('slotIndexes')):
                warns.append(f"{fn} {tag}: slots 도 slotIndexes 도 없어 모든 슬롯에 적용된다")

        if kind == 'cloneItem':
            if op.get('stage') != 'preload':
                where(f"{tag}: cloneItem 은 반드시 stage=preload 여야 한다 "
                      f"(아니면 DatabaseModifiedAfterCutoffException 으로 서버가 죽는다)")
            for f in ('from', 'newId'):
                if not ID.match(op.get(f, '')): where(f"{tag}: {f} 가 24자 ID 형식이 아니다")
        if kind == 'handbookEntry' and op.get('stage') != 'preload':
            where(f"{tag}: handbookEntry 는 stage=preload 여야 한다")
        if kind == 'traderOffer' and op.get('stage') != 'trader':
            where(f"{tag}: traderOffer 는 stage=trader 여야 한다")

for k in config['patches']:
    if k not in keys: errs.append(f"config.json 의 '{k}' 에 해당하는 패치 파일이 없다")

print(f"패치 {len(keys)}개 / op {n_ops}개 / ID 참조 {n_ids}개 검사")
for w in warns: print("  경고:", w)
if errs:
    print(f"\n오류 {len(errs)}건:")
    for e in errs: print("  -", e)
    sys.exit(1)
print("\n패치 데이터 전부 스키마·프로퍼티 이름 검증 통과")
