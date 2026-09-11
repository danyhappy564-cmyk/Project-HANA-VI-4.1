#!/usr/bin/env python3
"""작성한 C# 이 참조하는 SPT 네임스페이스/타입/멤버가 4.1.5 어셈블리에 실제로 있는지 대조."""
import json, os, re, sys, glob

SP = os.path.dirname(os.path.abspath(__file__))
dumps = {}
for f in ['sptarkov_server_core', 'sptarkov_di', 'sptarkov_common', 'sptarkov_reflection']:
    dumps.update(json.load(open(os.path.join(SP, f + '.json'))))

namespaces = set()
bytype = {}
for full, v in dumps.items():
    if '.' in full:
        ns, short = full.rsplit('.', 1)
        namespaces.add(ns)
    else:
        short = full
    bytype.setdefault(short, []).append((full, v))

src = []
for root, _, files in os.walk(sys.argv[1]):
    if 'obj' in root or 'bin' in root: continue
    for fn in files:
        if fn.endswith('.cs'): src.append(os.path.join(root, fn))

fail = []
checked_ns = checked_ty = checked_mem = 0

# 1) using 문의 SPT 네임스페이스가 실재하는가
for path in src:
    text = open(path, encoding='utf-8').read()
    for ns in re.findall(r'^using\s+(SPTarkov\.[\w.]+)\s*;', text, re.M):
        checked_ns += 1
        if ns not in namespaces:
            fail.append(f"{os.path.basename(path)}: 네임스페이스 '{ns}' 없음")

# 2) 명시적으로 검증할 타입.멤버 목록 (코드가 실제로 의존하는 것들)
MEMBERS = {
 'IOnLoad': ['OnLoadAsync'],
 'OnLoadOrder': ['Preload', 'PostLoad', 'TraderRegistration'],
 'IModMetadata': ['ModGuid','Name','Author','Contributors','Version','SptVersion',
                  'HasPrepatcher','Incompatibilities','ModDependencies','Url','License'],
 'InjectionType': ['Singleton'],
 'Injectable': ['TypePriority','InjectionType'],
 'TemplateTable': ['Items','Handbook'],
 'LocaleTable': ['Global'],
 'TemplateItem': ['Id','Name','Parent','Properties'],
 'TemplateItemProperties': ['Slots','Chambers','Cartridges','Grids','ExaminedByDefault',
                            'CanSellOnRagfair','ConflictingItems','WeapFireType','BFirerate',
                            'MaskSize','ArmorMaterial','ArmorType','Durability','MaxDurability',
                            'ExtraSizeLeft','ExtraSizeRight','ExtraSizeUp','ExtraSizeDown','Prefab'],
 'Slot': ['Name','Properties'],
 'SlotProperties': ['Filters'],
 'SlotFilter': ['Filter'],
 'Grid': ['Properties'],
 'GridProperties': ['Filters'],
 'GridFilter': ['Filter'],
 'Prefab': ['Path','Rcid'],
 'HandbookBase': ['Items'],
 'HandbookItem': ['Id','ParentId','Price'],
 'TradersTable': ['GetTrader'],
 'Trader': ['Assort'],
 'TraderAssort': ['Items','BarterScheme','LoyalLevelItems'],
 'Item': ['Id','Template','ParentId','SlotId','Upd'],
 'Upd': ['UnlimitedCount','StackObjectsCount','BuyRestrictionMax','BuyRestrictionCurrent'],
 'BarterScheme': ['Count','Template'],
 'MongoId': ['.ctor'],
 'ModHelper': ['GetAbsolutePathToModFolder'],
 'ICloner': ['Clone'],
 'ISptLogger`1': ['Info','Warning','Error','Success'],
 'LazyLoad`1': ['AddTransformer'],
 'GlobalLocaleDictionary': [],
 'GlobalTable': ['ItemPresets','Configuration'],
 'GlobalConfig': ['Mastering'],
 'Mastering': ['Name','Templates'],
 'Preset': ['Id','Name','Parent','Items'],
 'CustomizationItem': ['Id','Name','Parent','Properties'],
 'Suit': ['Id','Tid','SuiteId'],
 'TraderBase': ['CustomizationSeller'],
 'Trader': ['Assort','Base','Suits'],
 'JsonUtil': ['Serialize','Deserialize'],
 'TemplateItemProperties': ['Slots','Chambers','Cartridges','Grids','ExaminedByDefault',
                            'CanSellOnRagfair','ConflictingItems','WeapFireType','BFirerate',
                            'MaskSize','ArmorMaterial','ArmorType','Durability','MaxDurability',
                            'ExtraSizeLeft','ExtraSizeRight','ExtraSizeUp','ExtraSizeDown','Prefab',
                            'StackMaxSize','BackgroundColor','AmmoCaliber'],
}
for tname, members in MEMBERS.items():
    checked_ty += 1
    cands = bytype.get(tname)
    if not cands:
        fail.append(f"타입 '{tname}' 을(를) 어셈블리에서 찾을 수 없음")
        continue
    have = set()
    for _, v in cands:
        have |= set(v['props']) | set(v['methods']) | set(v['fields'])
    for m in members:
        checked_mem += 1
        if m not in have:
            fail.append(f"{tname}.{m} 없음  (있는 것: {sorted(have)[:8]} …)")

print(f"검사: 네임스페이스 {checked_ns}건, 타입 {checked_ty}건, 멤버 {checked_mem}건")
if fail:
    print(f"\n실패 {len(fail)}건:")
    for f in fail: print("  -", f)
    sys.exit(1)
print("\n참조한 SPT API 전부 4.1.5 어셈블리에 존재함")
