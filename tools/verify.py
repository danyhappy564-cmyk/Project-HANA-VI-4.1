#!/usr/bin/env python3
"""3.11 TypeScript 원본과 4.1 패치 JSON 을 리터럴 단위로 대조한다.

사용법:  python3 tools/verify.py 3.x-original/<모드>/src/mod.ts 4.1/<모드>/mod/db/patches

Checks, per config block:
  * every 24-char template id present in the TS block is present in the JSON patch
  * every numeric literal assigned to a _props.X is present
  * every slot/grid name string is present
Anything missing must be explainable; an unexplained miss means the port dropped data.
"""
import re, json, sys, os, collections

TS, PATCHDIR = sys.argv[1], sys.argv[2]
raw = open(TS, encoding='utf-8').read()
src = re.sub(r'/\*.*?\*/', '', raw, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', ln) for ln in src.split('\n'))

ID = re.compile(r'"([0-9a-zA-Z]{24})"')
blocks = [(m.group(1), m.start()) for m in re.finditer(r'if\s*\(\s*this\.cfg\.(\w+)\s*\)', src)]
alias = {m.group(1): m.group(2)
         for m in re.finditer(r'const\s+(\w+)\s*=\s*tables\.templates\.items\["([0-9a-fA-F]{24})"\]\s*;', src)}
head = src[:blocks[0][1]]

patches = {}
for fn in sorted(os.listdir(PATCHDIR)):
    if fn == 'ammo.json': continue
    d = json.load(open(os.path.join(PATCHDIR, fn), encoding='utf-8'))
    patches[d['key']] = (fn, d)
ammo = json.load(open(os.path.join(os.path.dirname(PATCHDIR.rstrip('/')), 'ammo.json'), encoding='utf-8'))

def literals(obj, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.startswith('_'): continue     # commentary fields
            out.add(str(k)); literals(v, out)
    elif isinstance(obj, list):
        for v in obj: literals(v, out)
    else:
        out.add(str(obj))
    return out

fail = 0
print(f"{'block':52s} {'ids':>9s} {'nums':>9s} {'slots':>9s}")
print("-" * 84)
for i, (key, a) in enumerate(blocks):
    b = blocks[i+1][1] if i+1 < len(blocks) else len(src)
    text = src[a:b]
    fn, doc = patches[key]

    got = literals(doc, set())
    # a patch referencing @ammoSet inherits that set's ids
    for ref in re.findall(r'@(\w+)', json.dumps(doc)):
        if ref in ammo: got |= set(ammo[ref])
        if 'sets' in doc and ref in doc['sets']: got |= set(doc['sets'][ref])
    # aliases used in the block resolve to their template id
    ts_ids = set(ID.findall(text))
    for name, tid in alias.items():
        if re.search(r'\b' + re.escape(name) + r'\._props\.', text): ts_ids.add(tid)
    # ammo set spreads pull in the whole set
    for sname in re.findall(r'push\(\.\.\.(\w+)\)', text):
        if sname in ammo: ts_ids |= set(ammo[sname])

    ts_nums = set(re.findall(r'\._props\.\w+\s*=\s*(-?\d+)\s*;', text))
    ts_slots = set(re.findall(r'_name\s*==\s*"([^"]+)"', text))

    miss_id = sorted(ts_ids - got)
    miss_n  = sorted(ts_nums - got)
    miss_s  = sorted(ts_slots - got - {'*'})
    # slot names swallowed by the JS `|| ` bug are recorded under _intendedSlots
    intended = set(re.findall(r'"_intendedSlots":\s*\[([^\]]*)\]', json.dumps(doc)))
    for grp in intended: miss_s = [s for s in miss_s if f'"{s}"' not in grp]
    ok = not (miss_id or miss_n or miss_s)
    if not ok: fail += 1
    mark = "OK " if ok else "**FAIL**"
    print(f"{key:52s} {len(ts_ids):4d}/{len(ts_ids)-len(miss_id):<4d} "
          f"{len(ts_nums):4d}/{len(ts_nums)-len(miss_n):<4d} "
          f"{len(ts_slots):4d}/{len(ts_slots)-len(miss_s):<4d} {mark}")
    if miss_id: print(f"     missing ids  : {miss_id}")
    if miss_n:  print(f"     missing nums : {miss_n}")
    if miss_s:  print(f"     missing slots: {miss_s}")

print("-" * 84)
print("ALL BLOCKS VERIFIED" if not fail else f"{fail} BLOCK(S) INCOMPLETE")
sys.exit(1 if fail else 0)
