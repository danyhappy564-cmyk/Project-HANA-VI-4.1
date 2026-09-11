#!/usr/bin/env python3
"""HANA-VI_Items 의 cfg 패치 블록을 4.1 패치 JSON 으로 변환한다.

Extended_mags 의 탄창 74개처럼 '복제 + 프로퍼티 + 탄창필터 교체 + 상인등록' 이
반복되는 구조를 op 로 옮긴다. 인식하지 못한 구문은 전부 보고해서 누락을 막는다.
"""
import re, json, sys, collections

src_raw = open(sys.argv[1], encoding='utf-8').read()
src = re.sub(r'/\*.*?\*/', '', src_raw, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', ln) for ln in src.split('\n'))

ALIAS = {m.group(1): m.group(2) for m in
         re.finditer(r'const\s+(\w+)\s*=\s*tables\.templates\.items\["([0-9a-zA-Z]{24})"\]\s*;', src)}

blocks = [(m.group(1), m.start()) for m in re.finditer(r'if\s*\(\s*this\.cfg\.(\w+)\s*\)', src)]
bounds = [(k, p, blocks[i+1][1] if i+1 < len(blocks) else len(src)) for i, (k, p) in enumerate(blocks)]

ID = r'[0-9a-zA-Z]{24}'
def lit(v):
    v = v.strip()
    if v in ('true', 'false'): return v == 'true'
    if re.fullmatch(r'-?\d+', v): return int(v)
    if re.fullmatch(r'-?\d*\.\d+', v): return float(v)
    if v.startswith('"') and v.endswith('"'): return v[1:-1]
    return v

unhandled = collections.Counter()
out = {}

for key, a, b in bounds:
    text = src[a:b]
    idvars = {m.group(1): m.group(2) for m in re.finditer(rf'const\s+(\w+)id\s*=\s*"({ID})"\s*;', text)}
    # 배열 리터럴. 원소가 "ID" 이거나 <이름>id 변수 참조일 수 있다.
    arrays = {}
    for m in re.finditer(r'const\s+(\w+)\s*=\s*\[([^\]]*)\]\s*;?', text, re.S):
        vals = []
        for tok in re.findall(rf'"({ID})"|\b(\w+id)\b', m.group(2)):
            if tok[0]: vals.append(tok[0])
            elif tok[1][:-2] in idvars: vals.append(idvars[tok[1][:-2]])
        if vals: arrays[m.group(1)] = vals
    localalias = {m.group(1): m.group(2) for m in
                  re.finditer(rf'const\s+(\w+)\s*=\s*tables\.templates\.items\["({ID})"\]\s*;', text)}

    # ---- 복제 그룹: const X = jsonUtil.clone(items["SRC"]);
    clones = collections.OrderedDict()
    for m in re.finditer(rf'const\s+(\w+)\s*=\s*jsonUtil\.clone\(items\["({ID})"\]\)\s*;', text):
        var, srcid = m.group(1), m.group(2)
        newid = idvars.get(var)
        if newid is None:
            m2 = re.search(rf'items\[(\w+)\]\s*=\s*{re.escape(var)}\s*;', text)
            newid = idvars.get(m2.group(1)[:-2]) if m2 and m2.group(1).endswith('id') else None
        clones[var] = {'from': srcid, 'newId': newid, 'props': collections.OrderedDict(),
                       'parent': None, 'slotProps': collections.OrderedDict(),
                       'cartFilter': None, 'pos': m.start()}

    known = set()
    def mark(m): known.update(range(m.start(), m.end()))

    # X._parent = "ID";
    for m in re.finditer(rf'\b(\w+)\._parent\s*=\s*"({ID})"\s*;', text):
        if m.group(1) in clones: clones[m.group(1)]['parent'] = m.group(2); mark(m)

    # X._props.Cartridges[0]._props.filters[0].Filter = [ ... ];
    for m in re.finditer(r'\b(\w+)\._props\.(Cartridges|Chambers)\[(\d+)\]\._props\.filters\[0\]\.Filter\s*=\s*\[([^\]]*)\]\s*;', text, re.S):
        if m.group(1) in clones:
            clones[m.group(1)]['cartFilter'] = {'into': m.group(2), 'ids': re.findall(rf'"({ID})"', m.group(4))}
            mark(m)

    # X._props.Cartridges[0]._max_count = N;  /  ._parent = Xid | "str"
    for m in re.finditer(r'\b(\w+)\._props\.(Cartridges|Chambers)\[(\d+)\]\.(_max_count|_parent)\s*=\s*([^;]+);', text):
        if m.group(1) in clones:
            v = m.group(5).strip()
            val = '$self' if v == m.group(1) + 'id' else lit(v)
            clones[m.group(1)]['slotProps'][m.group(4)] = val
            mark(m)

    # X._props.Prefab.path = "...";
    for m in re.finditer(r'\b(\w+)\._props\.Prefab\.path\s*=\s*"([^"]*)"\s*;', text):
        if m.group(1) in clones:
            clones[m.group(1)]['props']['Prefab'] = {'path': m.group(2), 'rcid': ''}
            mark(m)

    # X._props.KEY = value;   (복제본이면 클론 props, 기존 아이템이면 setProps op)
    plain_props = []
    for m in re.finditer(r'\b(\w+)\._props\.(\w+)\s*=\s*([^;\n]+)\s*;?\s*$', text, re.M):
        var, prop, raw = m.group(1), m.group(2), m.group(3)
        if prop in ('Prefab',) or '[' in raw: continue
        if var in clones: clones[var]['props'][prop] = lit(raw); mark(m)
        elif var in ALIAS or var in localalias:
            plain_props.append({'id': localalias.get(var) or ALIAS[var], 'prop': prop, 'value': lit(raw)}); mark(m)

    # weapFireType.push
    fire = []
    for m in re.finditer(r'\b(\w+)\._props\.weapFireType\.push\("([^"]+)"\)', text):
        tid = localalias.get(m.group(1)) or ALIAS.get(m.group(1))
        if tid: fire.append({'id': tid, 'mode': m.group(2)}); mark(m)

    # 기존 아이템 약실/탄창에 push
    chamber = []
    for m in re.finditer(r'\b(\w+)\._props\.(Chambers|Cartridges)\[0\]\._props\.filters\[0\]\.Filter\.push\((\.\.\.)?(\w+)\)', text):
        tid = localalias.get(m.group(1)) or ALIAS.get(m.group(1))
        if not tid: continue
        add = arrays.get(m.group(4)) or ([idvars[m.group(4)[:-2]]] if m.group(4).endswith('id') and m.group(4)[:-2] in idvars else None)
        if add: chamber.append({'id': tid, 'into': m.group(2), 'add': add}); mark(m)

    # 슬롯 루프
    loops = []
    for m in re.finditer(
        r'for\s*\(\s*(?:const|let)\s+\w+\s+in\s+(\w+)\s*\)\s*(?:\{\s*)?'
        r'for\s*\(\s*(?:const|let)\s+\w+\s+in\s+items\[\1\[\w+\]\]\._props\.(Slots|Grids)\s*\)\s*(?:\{\s*)?'
        r'(?:if\s*\((.*?)\)\s*)?(?:\{\s*)?'
        r'items\[\1\[\w+\]\]\._props\.\2\[\w+\]\._props\.filters\[0\]\.Filter\.push\((\.\.\.)?(\w+)\)', text, re.S):
        tgt, coll, cond, addvar = m.group(1), m.group(2), m.group(3) or '', m.group(5)
        names = re.findall(r'_name\s*==\s*"([^"]+)"', cond)
        add = arrays.get(addvar) or ([idvars[addvar[:-2]]] if addvar.endswith('id') and addvar[:-2] in idvars else None)
        tl = arrays.get(tgt)
        if add and tl:
            loops.append({'targets': tl, 'collection': coll, 'slotNames': names,
                          'orChain': cond.count('||') > 0, 'add': add})
            mark(m)

    # magCompatMap: [[새탄창, 원본탄창], ...] 뒤에
    #   "모든 무기의 mod_magazine 슬롯에서 원본탄창이 허용돼 있으면 새탄창도 허용" 루프가 붙는다.
    magmap = []
    mm = re.search(r'const\s+magCompatMap[^=]*=\s*\[(.*?)\]\s*;', text, re.S)
    if mm:
        for pair in re.finditer(rf'\[\s*"({ID})"\s*,\s*"({ID})"\s*\]', mm.group(1)):
            magmap.append({'new': pair.group(1), 'base': pair.group(2)})
        mark(mm)
        loopm = re.search(r'for\s*\(\s*const\s*\[\s*newMagTpl.*?\n\s{12}\}', text, re.S)
        if loopm:
            slot = re.search(r'slot\._name\s*!==\s*"([^"]+)"', loopm.group(0))
            for e in magmap: e['slot'] = slot.group(1) if slot else 'mod_magazine'
            mark(loopm)

    # addidtot(id, trader, count, price, currency, loyal, hbParent, hbPrice, unlock)
    trades = []
    for m in re.finditer(
        rf'addidtot\(\s*(\w+|"{ID}")\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*"({ID})"\s*,\s*(\d+)\s*,\s*(true|false)\s*\)', text):
        v = m.group(1)
        iid = v.strip('"') if v.startswith('"') else (idvars.get(v[:-2]) if v.endswith('id') else None)
        if iid:
            trades.append({'id': iid, 'traderId': m.group(2), 'count': int(m.group(3)),
                           'price': int(m.group(4)), 'currency': m.group(5),
                           'loyalty': int(m.group(6)), 'hbParent': m.group(7),
                           'hbPrice': int(m.group(8)), 'unlock': m.group(9) == 'true'})
            mark(m)

    # 인식 못한 '의미 있는' 구문 보고
    for mm in re.finditer(r'^[ \t]*([A-Za-z_].*?;)\s*$', text, re.M):
        if mm.start() in known or any(i in known for i in range(mm.start(), mm.end())): continue
        t = mm.group(1).strip()
        if t.startswith(('logger.', 'const ', 'this.', 'addidtot(', 'items[')): continue
        unhandled[re.sub(r'"[^"]*"', 'STR', t)[:100]] += 1

    out[key] = {'clones': list(clones.values()), 'plainProps': plain_props, 'fire': fire,
                'chamber': chamber, 'loops': loops, 'trades': trades, 'arrays': arrays,
                'magCompatMap': magmap}

json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for k, v in out.items():
    print(f"  {k:22s} clone={len(v['clones']):3d} props={len(v['plainProps']):3d} "
          f"fire={len(v['fire']):2d} chamber={len(v['chamber']):2d} loop={len(v['loops']):2d} "
          f"trade={len(v['trades']):3d} magmap={len(v['magCompatMap']):3d}")
if unhandled:
    print("\n[미인식 구문]")
    for t, c in unhandled.most_common(20): print(f"  {c:3d}  {t}")
else:
    print("\n미인식 구문 없음")
