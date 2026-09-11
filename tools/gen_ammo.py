#!/usr/bin/env python3
import json, os, sys, collections
raw = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]
cfg = json.load(open(sys.argv[3], encoding='utf-8'))   # 3.11 config/config.json
P = os.path.join(OUT, 'db', 'patches')

BASE = {
 'MAGAZINE':          '5448bc234bdc2d3c308b4569',
 'CYLINDER_MAGAZINE': '610720f290b75a49ff2e5e25',
 'ars':               '5447b5f14bdc2d61278b4567',
 'carbines':          '5447b5fc4bdc2d87278b4567',
 'srs':               '5447b6254bdc2dc3278b4568',
 'mrs':               '5447b6194bdc2d67278b4567',
 'pistols':           '5447b5cf4bdc2d65278b4567',
 'smgs':              '5447b5e04bdc2d62278b4567',
 'shotguns':          '5447b6094bdc2dc3278b4567',
}
KOREAN = {'ars':'돌격소총','carbines':'기병총','srs':'저격소총','mrs':'지정사수소총',
          'pistols':'권총','smgs':'기관단총','shotguns':'산탄총'}

def dump(name, doc):
    json.dump(doc, open(os.path.join(P, name), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

# ---------- db/values.json : 탄 적재량 + 배경색 ----------
prof = cfg['ColorProfiles'][cfg['ColorProfile']]
values = collections.OrderedDict()
values['_comment'] = ("패치에서 \"$이름\" 으로 참조하는 공용 값. 여기 하나만 고치면 그 값을 쓰는 "
                      "모든 탄약에 한 번에 반영된다. (3.11 의 config/config.json 에 해당)")
for k, v in cfg.items():
    if k.endswith('Stack'): values[k] = v
for k, v in prof.items():
    values[f'color{k}'] = v
json.dump(values, open(os.path.join(OUT, 'db', 'values.json'), 'w', encoding='utf-8'),
          indent=2, ensure_ascii=False)

# ---------- 01 : 탄약 아이템 28종 등록 ----------
ops, locales_en, locales_kr = [], {}, {}
for it in raw['items']:
    nid = it['newId']
    ops.append(collections.OrderedDict([
        ('op', 'cloneItem'), ('stage', 'preload'),
        ('from', it['itemTplToClone']), ('newId', nid),
        ('newParentId', it['parentId']),
        ('props', it['overrideProperties']),
        ('_name', it['locales']['en']['name']),
    ]))
    ops.append(collections.OrderedDict([
        ('op', 'handbookEntry'), ('stage', 'preload'),
        ('id', nid), ('parentId', it['handbookParentId']),
        ('price', it['handbookPriceRoubles']),
        ('canSellOnRagfair', True),
        ('_fleaPriceRoubles', it['fleaPriceRoubles']),
    ]))
    for code, store in (('en', locales_en), ('kr', locales_kr)):
        loc = it['locales'].get(code) or it['locales']['en']
        store[f'{nid} Name'] = loc['name']
        store[f'{nid} ShortName'] = loc['shortName']
        store[f'{nid} Description'] = loc['description']

dump('01_ammo_items.json', collections.OrderedDict([
    ('key', 'ammo_items'), ('title', '특수탄 28종 추가'), ('enabled', True),
    ('_note', '아이템을 새로 만드는 작업이라 stage 는 반드시 preload 다. '
              'StackMaxSize / BackgroundColor 의 "$..." 는 db/values.json 을 참조한다.'),
    ('ops', ops)]))

for code, store in (('en', locales_en), ('kr', locales_kr)):
    store = collections.OrderedDict(
        [('_comment', "키 형식: '<아이템ID> Name' / ' ShortName' / ' Description'")] +
        sorted(store.items()))
    json.dump(store, open(os.path.join(OUT, 'db', 'locales', 'global', f'{code}.json'), 'w',
                          encoding='utf-8'), indent=2, ensure_ascii=False)

# ---------- 02 : 탄창 호환 ----------
def compat(key, title, base, rules, into, slots=None, note=''):
    ops = []
    for marker, adds in rules.items():
        op = collections.OrderedDict([
            ('op', 'addFilter'),
            ('targetsByBaseClass', [base]),
            ('into', into)])
        if slots: op['slots'] = slots
        op['whenFilterContains'] = [marker]
        op['add'] = adds
        ops.append(op)
    dump(key + '.json', collections.OrderedDict([
        ('key', key.split('_', 1)[1]), ('title', title), ('enabled', True),
        ('_note', note), ('ops', ops)]))
    return len(ops)

n2 = compat('02_magazine_compat', '탄창 호환 (같은 구경 탄창에 특수탄 허용)',
            BASE['MAGAZINE'], raw['magazineRules'], 'cartridge',
            note='기존 탄창 허용목록에 마커 탄약(whenFilterContains)이 들어있으면 같은 구경으로 보고 '
                 '특수탄을 추가한다. 3.11 의 ItemHelper.isOfBaseclass(MAGAZINE) 루프와 같은 동작이다.')
n3 = compat('03_cylinder_compat', '리볼버 실린더 호환',
            BASE['CYLINDER_MAGAZINE'], raw['cylinderRules'], 'slot', slots=['*'],
            note='실린더는 약실이 Slots 에 여러 칸으로 나뉘어 있어 모든 슬롯을 훑는다.')

# ---------- 04 : 총기 약실 호환 (구경 매칭) ----------
ops = []
for plural, rules in raw['weaponRules'].items():
    for caliber, adds in rules.items():
        ops.append(collections.OrderedDict([
            ('op', 'addFilter'),
            ('targetsByBaseClass', [BASE[plural]]),
            ('whenPropEquals', {'ammoCaliber': caliber}),
            ('into', 'chamber'),
            ('add', adds),
            ('_weapon', KOREAN[plural]),
        ]))
dump('04_weapon_compat.json', collections.OrderedDict([
    ('key', 'weapon_compat'), ('title', '총기 약실 호환 (구경별)'), ('enabled', True),
    ('_note', '총기 종류(베이스클래스) + ammoCaliber 가 맞는 총기의 약실에 특수탄을 추가한다. '
              '더블배럴 산탄총은 약실이 2개인데, into=chamber 가 모든 약실을 훑으므로 '
              '3.11 처럼 Chambers[0]/[1] 을 따로 쓸 필요가 없다.'),
    ('ops', ops)]))

# ---------- 05 : 상인 등록 ----------
tops = []
for t in raw['trades']:
    tops.append(collections.OrderedDict([
        ('op', 'traderOffer'), ('stage', 'trader'),
        ('id', t['id']), ('traderId', t['traderId']),
        ('count', int(t['count'])), ('price', int(t['price'])),
        ('currency', t['currency']), ('loyaltyLevel', int(t['loyalty'])),
    ]))
dump('05_trader_offers.json', collections.OrderedDict([
    ('key', 'trader_offers'), ('title', '스키어 판매 등록 (충성도 4)'), ('enabled', True),
    ('_note', '상인 어사트 등록은 stage=trader 여야 한다. preload 에 넣으면 상인이 아직 '
              '준비되지 않아 예외 없이 조용히 실패한다.'),
    ('_traderName', 'Skier'), ('_currencyName', 'Roubles'),
    ('ops', tops)]))

# ---------- config.json ----------
keys = ['ammo_items', 'magazine_compat', 'cylinder_compat', 'weapon_compat', 'trader_offers']
conf = collections.OrderedDict([
    ('_comment', [
      "HANA-VI SuperAmmo — SPT 4.1 포팅본 설정",
      "enabled        : 전체 on/off",
      "verboseLogging : 적용한 패치를 서버 로그에 한 줄씩 출력",
      "patches        : 패치 key -> true/false",
      "탄 적재량과 배경색은 db/values.json 에서 고친다 (3.11 의 config/config.json 에 해당).",
      "탄약 성능(관통력/데미지 등)은 db/patches/01_ammo_items.json 에서 고친다."]),
    ('enabled', True), ('verboseLogging', True),
    ('patches', collections.OrderedDict((k, True) for k in keys))])
json.dump(conf, open(os.path.join(OUT, 'config.json'), 'w', encoding='utf-8'),
          indent=2, ensure_ascii=False)

print(f"탄약 {len(raw['items'])}종 / 탄창규칙 {n2} / 실린더규칙 {n3} / "
      f"총기규칙 {len(ops)} / 상인등록 {len(tops)}")
print(f"values.json: 적재량 {sum(1 for k in values if k.endswith('Stack'))}개, 색상 {len(prof)}개")
