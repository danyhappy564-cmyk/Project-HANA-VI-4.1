#!/usr/bin/env python3
"""Extract every id-array and per-block structure from the 3.11 AIO mod.ts."""
import re, json, sys, collections

src_raw = open(sys.argv[1], encoding='utf-8').read()
# strip comments so commented-out statements are not extracted as live code
src = re.sub(r'/\*.*?\*/', '', src_raw, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', ln) for ln in src.split('\n'))
lines = src.split('\n')

# ---- 1. top-level item aliases:  const NAME = tables.templates.items["ID"];
alias = {}
for m in re.finditer(r'const\s+(\w+)\s*=\s*tables\.templates\.items\["([0-9a-fA-F]{24})"\]\s*;', src):
    alias[m.group(1)] = m.group(2)

# ---- 2. block boundaries: if(this.cfg.KEY)
blocks = []
for m in re.finditer(r'if\s*\(\s*this\.cfg\.(\w+)\s*\)', src):
    blocks.append((m.group(1), m.start()))
bounds = []
for i, (key, pos) in enumerate(blocks):
    end = blocks[i+1][1] if i+1 < len(blocks) else len(src)
    bounds.append((key, pos, end))

# ---- 3. arrays: const NAME = [ "id", ... ];   (scoped to block)
arr_re = re.compile(r'const\s+(\w+)\s*=\s*\[([^\]]*)\]\s*;?', re.S)
id_re  = re.compile(r'"([0-9a-zA-Z]{24})"')

def arrays_in(text):
    out = collections.OrderedDict()
    for m in arr_re.finditer(text):
        ids = id_re.findall(m.group(2))
        if ids:
            out[m.group(1)] = ids
    return out

# global (pre-first-block) arrays = the ammo sets
global_arrays = arrays_in(src[:blocks[0][1]])

result = {"aliases": alias, "ammoSets": global_arrays, "blocks": collections.OrderedDict()}
for key, a, b in bounds:
    text = src[a:b]
    entry = {"localArrays": arrays_in(text)}
    # set numeric/string props on aliases:  alias._props.Prop = value;
    props = []
    for m in re.finditer(r'\b(\w+)\._props\.(\w+)\s*=\s*([^;]+);', text):
        props.append({"alias": m.group(1), "prop": m.group(2), "value": m.group(3).strip()})
    entry["setProps"] = props
    # weapFireType pushes
    fm = []
    for m in re.finditer(r'\b(\w+)\._props\.weapFireType\.push\(("[^"]+")\)', text):
        fm.append({"alias": m.group(1), "mode": m.group(2).strip('"')})
    entry["fireModes"] = fm
    # chamber / cartridge spreads
    ch = []
    for m in re.finditer(r'\b(\w+)\._props\.(Chambers|Cartridges)\[0\]\._props\.filters\[0\]\.Filter\.push\(\.\.\.(\w+)\)', text):
        ch.append({"alias": m.group(1), "into": m.group(2), "set": m.group(3)})
    entry["chamberPushes"] = ch
    # slot/grid loops:  for (const i in LIST) for (const slot in items[LIST[i]]._props.Slots) if (... == "NAME") ... push(...SET)
    loops = []
    for m in re.finditer(
        r'for\s*\(\s*(?:const|let)\s+\w+\s+in\s+(\w+)\s*\)\s*'
        r'(?:\{\s*)?for\s*\(\s*(?:const|let)\s+\w+\s+in\s+items\[\1\[\w+\]\]\._props\.(Slots|Grids)\s*\)\s*'
        r'(?:\{\s*)?(?:if\s*\((.*?)\)\s*)?(?:\{\s*)?'
        r'(?:if\s*\((.*?)\)\s*)?'
        r'items\[\1\[\w+\]\]\._props\.\2\[\w+\]\._props\.filters\[0\]\.Filter\.push\(\.\.\.(\w+)\)', text, re.S):
        cond = m.group(3) or ''
        cond2 = m.group(4) or ''
        names = re.findall(r'_name\s*==\s*"([^"]+)"', cond)
        guard = re.findall(r'includes\("([0-9a-zA-Z]{24})"\)', cond + cond2)
        loops.append({"targetSet": m.group(1), "collection": m.group(2),
                      "slotNames": names, "orChain": cond.count('||') > 0,
                      "guardContains": guard, "addSet": m.group(5)})
    entry["loops"] = loops
    # parent/id sweeps
    sweeps = []
    for m in re.finditer(r'if\s*\(\s*items\[\w+\]\.(_parent|_id)\s*===\s*"([0-9a-zA-Z]{24})"', text):
        sweeps.append({"by": m.group(1), "id": m.group(2)})
    for m in re.finditer(r'itm\.(_parent|_id)\s*===\s*"([0-9a-zA-Z]{24})"', text):
        sweeps.append({"by": m.group(1), "id": m.group(2)})
    entry["sweeps"] = sweeps
    # clones
    entry["clones"] = [{"newIdVar": m.group(1), "fromId": m.group(2)}
        for m in re.finditer(r'const\s+(\w+)\s*=\s*jsonUtil\.clone\(items\["([0-9a-zA-Z]{24})"\]\)', text)]
    entry["addidtot"] = re.findall(r'addidtot\(([^)]*)\)', text)
    entry["rawLineCount"] = text.count('\n')
    result["blocks"][key] = entry

json.dump(result, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print(f"aliases={len(alias)} ammoSets={len(global_arrays)} blocks={len(result['blocks'])}")
for k, v in result["blocks"].items():
    print(f"  {k:52s} arrays={len(v['localArrays']):2d} props={len(v['setProps']):2d} "
          f"fire={len(v['fireModes']):2d} chamber={len(v['chamberPushes']):2d} loops={len(v['loops']):2d} "
          f"sweeps={len(v['sweeps']):2d} clone={len(v['clones'])} trader={len(v['addidtot'])}")
