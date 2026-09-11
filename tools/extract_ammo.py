#!/usr/bin/env python3
"""SuperAmmo mod.ts 의 itemsToClone 배열 + 호환성 규칙 + 상인 등록을 뽑아낸다."""
import re, json, sys, collections

src = open(sys.argv[1], encoding='utf-8').read()
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', ln) for ln in src.split('\n'))

# ---------- 1. itemsToClone 배열을 JSON 으로 변환 ----------
start = src.index('const itemsToClone')
start = src.index('= [', start) + 2
depth, i = 0, start
while True:
    if src[i] == '[': depth += 1
    elif src[i] == ']':
        depth -= 1
        if depth == 0: break
    i += 1
arr = src[start:i+1]

js = arr
js = re.sub(r'stackConfig\["(\w+)"\]', r'"$\1"', js)          # stackConfig["12gStack"] -> "$12gStack"
js = re.sub(r'colourProfile\["(\d)"\]', r'"$color\1"', js)     # colourProfile["6"]      -> "$color6"
js = re.sub(r'([{,]\s*)([A-Za-z_]\w*)\s*:', r'\1"\2":', js)    # key: -> "key":
js = re.sub(r',(\s*[}\]])', r'\1', js)                         # 뒤따르는 쉼표 제거
items = json.loads(js)

# ---------- 2. 마커 탄약 -> 새 탄약 매핑 (탄창/실린더) ----------
def marker_rules(section_text):
    rules = collections.OrderedDict()
    for m in re.finditer(
        r'if\s*\(\s*ammoType\s*===\s*"([0-9a-zA-Z]{24})"\s*\)\s*\{(.*?)\n\s{16,}\}',
        section_text, re.S):
        adds = re.findall(r'Filter\.push\("([0-9a-zA-Z]{24})"\)', m.group(2))
        if adds: rules.setdefault(m.group(1), []).extend(adds)
    return rules

mag_start = src.index('for (const magazine of magazines)')
cyl_start = src.index('for (const cylinder of cylinders)')
ar_start  = src.index('for (const ar of ars)')
mag_rules = marker_rules(src[mag_start:cyl_start])
cyl_rules = marker_rules(src[cyl_start:ar_start])

# ---------- 3. 구경 -> 새 탄약 매핑 (총기 종류별) ----------
WEAPONS = [('ars','ar'), ('carbines','carbine'), ('srs','sr'), ('mrs','mr'),
           ('pistols','pistol'), ('smgs','smg'), ('shotguns','shotgun')]
weapon_rules = collections.OrderedDict()
for plural, var in WEAPONS:
    key = f'for (const {var} of {plural})'
    if key not in src: continue
    s0 = src.index(key)
    ends = [src.index(f'for (const {v} of {p})') for p, v in WEAPONS if f'for (const {v} of {p})' in src
            and src.index(f'for (const {v} of {p})') > s0]
    s1 = min(ends) if ends else src.index('addidtot("')
    section, rules = src[s0:s1], collections.OrderedDict()
    for m in re.finditer(
        rf'if\s*\(\s*{var}\._props\.ammoCaliber\s*===\s*"(\w+)"\s*\)\s*\{{(.*?)\n\s{{16,}}\}}',
        section, re.S):
        adds = re.findall(r'Filter\.push\("([0-9a-zA-Z]{24})"\)', m.group(2))
        # 더블배럴은 Chambers[0]/[1] 에 같은 걸 두 번 넣는다 -> 중복 제거
        seen, uniq = set(), []
        for a in adds:
            if a not in seen: seen.add(a); uniq.append(a)
        if uniq: rules.setdefault(m.group(1), [])
        for a in uniq:
            if a not in rules[m.group(1)]: rules[m.group(1)].append(a)
    if rules: weapon_rules[plural] = rules

# ---------- 4. 상인 등록 ----------
trades = []
for m in re.finditer(r'addidtot\("([0-9a-zA-Z]{24})",\s*"([0-9a-zA-Z]{24})",\s*(\d+),\s*(\d+),\s*"([0-9a-zA-Z]{24})",\s*(\d+),\s*(true|false)\)', src):
    trades.append(dict(zip(['id','traderId','count','price','currency','loyalty','unlock'], m.groups())))

out = {'items': items, 'magazineRules': mag_rules, 'cylinderRules': cyl_rules,
       'weaponRules': weapon_rules, 'trades': trades}
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(f"탄약 {len(items)}개 / 탄창규칙 {len(mag_rules)} / 실린더규칙 {len(cyl_rules)} / "
      f"총기종류 {len(weapon_rules)} / 상인등록 {len(trades)}")
for k, v in weapon_rules.items(): print(f"   {k:10s} 구경 {len(v)}종")
