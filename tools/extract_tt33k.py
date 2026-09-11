#!/usr/bin/env python3
"""applyTT33KExtension (844줄) 을 4.1 패치 JSON 으로 옮긴다.

인식하지 못한 구문은 전부 보고한다. 누락이 있으면 verify_literals 가 다시 잡는다.
"""
import re, json, sys, collections

src = open(sys.argv[1], encoding='utf-8').read()
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', l) for l in src.split('\n'))
start = src.index('function applyTT33KExtension')
end = src.index('function loadNervexInjectionFiles')
text = src[start:end]

ID = r'[0-9a-zA-Z]{24}'
idvars = {m.group(1): m.group(2) for m in re.finditer(rf'const\s+(\w+)id\s*=\s*"({ID})"\s*;', text)}
known = set()
def mark(m): known.update(range(m.start(), m.end()))
for m in re.finditer(rf'const\s+(\w+)id\s*=\s*"({ID})"\s*;', text): mark(m)

def lit(v):
    v = v.strip()
    if v in ('true','false'): return v == 'true'
    if re.fullmatch(r'-?\d+', v): return int(v)
    if re.fullmatch(r'-?\d*\.\d+', v): return float(v)
    if v.startswith('"') and v.endswith('"'): return v[1:-1]
    return None

# ---- 복제 그룹 ----
clones = collections.OrderedDict()
for m in re.finditer(rf'const\s+(\w+)\s*=\s*jsonUtil\.clone\(items\[(?:"({ID})"|(\w+id))\]\)\s*;', text):
    var = m.group(1)
    src_id = m.group(2) or idvars.get((m.group(3) or '')[:-2])
    clones[var] = {'from': src_id, 'newId': idvars.get(var), 'set': collections.OrderedDict(),
                   'adjust': collections.OrderedDict(), 'slotsJson': None,
                   'cartMax': None, 'conflicts': [], 'pos': m.start()}
    mark(m)
for m in re.finditer(r'\bitems\[(\w+)id\]\s*=\s*(\w+)\s*;', text):
    mark(m)

# X._props.KEY = <literal>;
for m in re.finditer(r'\b(\w+)\._props\.(\w+)\s*=\s*([^;\n]+);', text):
    var, prop, raw = m.group(1), m.group(2), m.group(3).strip()
    if var not in clones or raw.startswith('['): continue
    v = lit(raw)
    if v is None: continue
    clones[var]['set'][prop] = v; mark(m)

# X._props.KEY = ["a", "b"];   (문자열 배열 통째 대입)
for m in re.finditer(r'\b(\w+)\._props\.(\w+)\s*=\s*\[([^\]]*)\]\s*;', text):
    var, prop = m.group(1), m.group(2)
    if var not in clones or prop in ('Slots', 'ConflictingItems'): continue
    vals = re.findall(r'"([^"]*)"', m.group(3))
    if not vals: continue
    clones[var]['set'][prop] = vals; mark(m)

# X._props.Prefab.path = "...";
for m in re.finditer(r'\b(\w+)\._props\.Prefab\.path\s*=\s*"([^"]*)"\s*;', text):
    if m.group(1) in clones:
        clones[m.group(1)]['set']['Prefab'] = {'path': m.group(2), 'rcid': ''}; mark(m)

# X._props.KEY += / -= N;
for m in re.finditer(r'\b(\w+)\._props\.(\w+)\s*([+\-])=\s*([\d.]+)\s*;', text):
    var, prop, sign, num = m.groups()
    if var not in clones: continue
    val = float(num) if '.' in num else int(num)
    clones[var]['adjust'][prop] = -val if sign == '-' else val
    mark(m)

# X._props.ConflictingItems.push("ID");
for m in re.finditer(rf'\b(\w+)\._props\.ConflictingItems\.push\("({ID})"\)\s*;', text):
    if m.group(1) in clones: clones[m.group(1)]['conflicts'].append(m.group(2)); mark(m)

# X._props.Slots = [ ... ];   (JSON 리터럴 통째 교체)
for m in re.finditer(r'\b(\w+)\._props\.Slots\s*=\s*(\[\s*\];|\[.*?\n    \];)', text, re.S):
    if m.group(1) not in clones: continue
    raw = m.group(2).rstrip(';')
    raw = re.sub(r'\b(\w+)id\b', lambda mm: f'"{idvars[mm.group(1)]}"' if mm.group(1) in idvars else mm.group(0), raw)
    raw = re.sub(r'([{,]\s*)([A-Za-z_]\w*)\s*:', r'\1"\2":', raw)
    raw = re.sub(r',(\s*[}\]])', r'\1', raw)
    try:
        clones[m.group(1)]['slotsJson'] = json.loads(raw); mark(m)
    except Exception as e:
        print(f"  [경고] {m.group(1)}._props.Slots 파싱 실패: {e}", file=sys.stderr)

pushes = []

# X._props.ConflictingItems = [ ... ];  (push 가 아니라 통째 교체)
for m in re.finditer(r'\b(\w+)\._props\.ConflictingItems\s*=\s*\[([^\]]*)\]\s*;', text):
    if m.group(1) not in clones: continue
    vals = []
    for tok in re.findall(rf'"({ID})"|\b(\w+id)\b', m.group(2)):
        if tok[0]: vals.append(tok[0])
        elif tok[1][:-2] in idvars: vals.append(idvars[tok[1][:-2]])
    clones[m.group(1)]['set']['ConflictingItems'] = vals
    clones[m.group(1)]['conflicts'] = []
    mark(m)

# 복제본의 탄창 필터에 다른 새 아이템 추가
for m in re.finditer(r'\b(\w+)\._props\.(Cartridges|Chambers|Slots)\[(\d+)\]\._props\.filters\[0\]\.Filter\.push\((\w+)\)\s*;', text):
    var, coll, idx, addvar = m.groups()
    if var not in clones: continue
    nid = idvars.get(addvar[:-2]) if addvar.endswith('id') else None
    if not nid: continue
    pushes.append({'targetVar': var, 'into': coll, 'index': int(idx), 'add': nid}); mark(m)

# X._props.Cartridges[0]._max_count = N;
for m in re.finditer(r'\b(\w+)\._props\.Cartridges\[(\d+)\]\._max_count\s*=\s*(\d+)\s*;', text):
    if m.group(1) in clones: clones[m.group(1)]['cartMax'] = int(m.group(3)); mark(m)

# 기존 아이템의 슬롯/탄창 필터에 새 아이템 추가 (인덱스 지정)
for m in re.finditer(rf'items\["({ID})"\]\._props\.(Slots|Cartridges|Chambers)\[(\d+)\]\._props\.filters\[0\]\.Filter\.push\((\w+)\)\s*;', text):
    tgt, coll, idx, var = m.groups()
    nid = idvars.get(var[:-2]) if var.endswith('id') else None
    if nid:
        pushes.append({'target': tgt, 'into': coll, 'index': int(idx), 'add': nid}); mark(m)

# addidtot
trades = []
for m in re.finditer(
    rf'addidtot\(\s*(\w+)\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*(true|false)\s*\)', text):
    iid = idvars.get(m.group(1)[:-2]) if m.group(1).endswith('id') else None
    if iid:
        trades.append({'id': iid, 'traderId': m.group(2), 'count': int(m.group(3)),
                       'price': int(m.group(4)), 'currency': m.group(5), 'loyalty': int(m.group(6)),
                       'hbParent': m.group(7), 'hbPrice': int(m.group(8)), 'unlock': m.group(9)=='true'})
        mark(m)

# 퀘스트 무기 조건
quest = None
qm = re.search(rf'questTemplates\[id\]\._id\s*===\s*"({ID})"(.*?)\n    \}}', text, re.S)
if qm:
    weapons = [idvars[v[:-2]] for v in re.findall(r'cond\.weapon\.push\((\w+)\)', qm.group(2))
               if v.endswith('id') and v[:-2] in idvars]
    if weapons: quest = {'questId': qm.group(1), 'add': weapons}
    mark(qm)

# 숙련도
mastery = None
mm2 = re.search(r'if\s*\(\s*slot\.Name\s*===\s*"(\w+)"\s*\)\s*\{(.*?)\n        \}', text, re.S)
if mm2:
    body = mm2.group(2)
    tpls = [idvars[v[:-2]] for v in re.findall(r'slot\.Templates\.push\((\w+)\)', body)
            if v.endswith('id') and v[:-2] in idvars]
    mastery = {'name': mm2.group(1), 'add': tpls}
    for lvl in ('Level2', 'Level3'):
        lm = re.search(rf'slot\.{lvl}\s*=\s*(\d+)', body)
        if lm: mastery[lvl.lower()] = int(lm.group(1))
    mark(mm2)

# 미인식 구문 보고
unhandled = collections.Counter()
for mm in re.finditer(r'^[ \t]*([A-Za-z_].*?;)\s*$', text, re.M):
    if any(i in known for i in range(mm.start(), mm.end())): continue
    t = mm.group(1).strip()
    if t.startswith(('const ','logger.','return','let ','function','tables.','if ','for ')): continue
    unhandled[re.sub(r'"[^"]*"','STR',t)[:100]] += 1

# ---- 프리셋 ----
# 원본은 generateRandomID() 로 서버가 켜질 때마다 다른 ID 를 만든다.
# 여기서는 프리셋 이름에서 결정적으로 ID 를 만들어 매번 같은 값이 되게 한다.
import hashlib
def stable_id(seed):
    return hashlib.sha1(seed.encode()).hexdigest()[:24]

presets = []
for m in re.finditer(r'const\s+(\w+)\s*=\s*\{\s*\n\s*_id:\s*(\w+)\[0\],(.*?)\n    \};', text, re.S):
    varname, midvar, bodytext = m.group(1), m.group(2), m.group(3)
    raw = '{\n        _id: ' + midvar + '[0],' + bodytext + '\n    }'
    namem = re.search(r'_name:\s*"([^"]+)"', raw)
    if not namem: continue
    seed = namem.group(1)
    # <midvar>[n] → 이름 기반 고정 ID
    raw = re.sub(rf'{midvar}\[(\d+)\]', lambda mm: f'"{stable_id(seed + "#" + mm.group(1))}"', raw)
    raw = re.sub(r'\b(\w+id)\b', lambda mm: f'"{idvars[mm.group(1)[:-2]]}"' if mm.group(1)[:-2] in idvars else mm.group(0), raw)
    raw = re.sub(r'([{,]\s*)([A-Za-z_]\w*)\s*:', r'\1"\2":', raw)
    raw = re.sub(r',(\s*[}\]])', r'\1', raw)
    try:
        presets.append(json.loads(raw)); mark(m)
    except Exception as e:
        print(f"  [경고] 프리셋 {varname} 파싱 실패: {e}", file=sys.stderr)

out = {'clones': list(clones.values()), 'pushes': pushes, 'trades': trades,
       'presets': presets, 'quest': quest, 'mastery': mastery}
json.dump(out, open(sys.argv[2],'w',encoding='utf-8'), indent=1, ensure_ascii=False)
print(f"복제 {len(clones)} / 필터추가 {len(pushes)} / 상인등록 {len(trades)} / 프리셋 {len(presets)} / 퀘스트 {1 if quest else 0} / 숙련도 {1 if mastery else 0}")
if unhandled:
    print("[미인식 구문]")
    for t,c in unhandled.most_common(25): print(f"  {c:3d}  {t}")
else:
    print("미인식 구문 없음")
