#!/usr/bin/env python3
import json, os, sys, collections
raw = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]
P = os.path.join(OUT, 'db', 'patches')
os.makedirs(P, exist_ok=True)

TITLES = {
 'toygun_rework':      '장난감 총(토이건) 실총화',
 'ppsh41_tacticalkit': 'PPSh-41 전술 키트',
 'ks23m_tacticalkit':  'KS-23M 전술 키트',
 'vssm_receiver':      'VSSM 리시버 추가',
 'vssm_stock':         'VSSM 스톡 추가',
 'Extended_mags':      '확장 탄창 74종 추가',
 'uwu':                '로딩 완료 로그 (UwU)',
}
BUG = ("원본 3.11 코드가 `_name == \"A\" || \"B\"` 로 작성돼 자바스크립트에서 항상 참이었다 "
       "→ 지정한 슬롯이 아니라 '모든 슬롯'에 적용됐다. 게임플레이를 원본과 동일하게 유지하려고 "
       "그대로 재현한다. 의도대로 고치려면 slots 를 _intendedSlots 값으로 바꿔라.")

order = ['toygun_rework','ppsh41_tacticalkit','ks23m_tacticalkit','vssm_receiver',
         'vssm_stock','Extended_mags','uwu']
keys = []
for i, key in enumerate(order, 1):
    b = raw[key]
    ops, sets = [], {}

    # --- 복제 (stage=preload) ---
    for c in b['clones']:
        if not c['newId']: continue
        op = collections.OrderedDict([('op','cloneItem'), ('stage','preload'),
                                      ('from', c['from']), ('newId', c['newId'])])
        if c['parent']: op['newParentId'] = c['parent']
        if c['props']: op['props'] = c['props']
        ops.append(op)
        # 탄창 슬롯 값 / 필터 교체는 preload 이후(값 수정)라 postload 로 둔다
        if c['slotProps'] or c['cartFilter']:
            f = c['cartFilter']
            sub = collections.OrderedDict([
                ('op','addFilter'), ('targets',[c['newId']]),
                ('into', 'cartridge' if (f['into'] if f else 'Cartridges')=='Cartridges' else 'chamber')])
            if c['slotProps']: sub['slotProps'] = c['slotProps']
            if f:
                sub['replace'] = True
                sub['add'] = f['ids']
                sub['_note'] = '원본이 Filter 를 통째로 새 배열로 덮어썼으므로 replace 다.'
            ops.append(sub)

    # --- 기존 아이템 값 수정 ---
    for p in b['plainProps']:
        ops.append(collections.OrderedDict([('op','setProps'), ('targets',[p['id']]),
                                            ('props',{p['prop']: p['value']})]))
    for f in b['fire']:
        ops.append(collections.OrderedDict([('op','appendProps'), ('targets',[f['id']]),
                                            ('props',{'weapFireType':[f['mode']]})]))
    for c in b['chamber']:
        ops.append(collections.OrderedDict([
            ('op','addFilter'), ('targets',[c['id']]),
            ('into','chamber' if c['into']=='Chambers' else 'cartridge'), ('add', c['add'])]))
    for l in b['loops']:
        op = collections.OrderedDict([('op','addFilter'), ('targets', l['targets']),
                                      ('into','grid' if l['collection']=='Grids' else 'slot')])
        if l['collection']=='Slots':
            if l['orChain']:
                op['slots']=['*']; op['_intendedSlots']=l['slotNames']; op['_note']=BUG
            else:
                op['slots']= l['slotNames'] or ['*']
        op['add']=l['add']
        ops.append(op)

    # --- 탄창 호환: 원본 탄창이 허용된 mod_magazine 슬롯에 새 탄창도 허용 ---
    for e in b.get('magCompatMap', []):
        ops.append(collections.OrderedDict([
            ('op','addFilter'), ('targetsAll', True), ('into','slot'),
            ('slots',[e.get('slot','mod_magazine')]),
            ('whenFilterContains',[e['base']]), ('add',[e['new']]),
            ('_note','원본 탄창이 들어가는 총이면 이 확장 탄창도 들어가게 한다.')]))

    # --- 도감 + 상인 ---
    for t in b['trades']:
        ops.append(collections.OrderedDict([
            ('op','handbookEntry'), ('stage','preload'), ('id',t['id']),
            ('parentId',t['hbParent']), ('price',t['hbPrice']), ('canSellOnRagfair',t['unlock'])]))
        if t['traderId'] != '0':
            ops.append(collections.OrderedDict([
                ('op','traderOffer'), ('stage','trader'), ('id',t['id']),
                ('traderId',t['traderId']), ('count',t['count']), ('price',t['price']),
                ('currency',t['currency']), ('loyaltyLevel',t['loyalty'])]))

    doc = collections.OrderedDict([('key',key), ('title',TITLES[key]), ('enabled',True)])
    if sets: doc['sets'] = sets
    doc['ops'] = ops
    json.dump(doc, open(os.path.join(P, f'{i:02d}_{key}.json'),'w',encoding='utf-8'),
              indent=2, ensure_ascii=False)
    keys.append(key)
    print(f"  {i:02d}_{key:22s} op={len(ops)}")

conf = collections.OrderedDict([
    ('_comment', [
      "HANA-VI's Items — SPT 4.1 포팅본 설정",
      "enabled / verboseLogging / patches 는 다른 모드와 같은 형식이다.",
      "itemPacks : 아이템 팩(무기·장비 묶음) on/off. 팩 데이터는 db/packs/ 아래에 원본 그대로 있다.",
      "패치 내용(수치·아이템 ID)은 db/patches/*.json 에서 고친다."]),
    ('enabled', True), ('verboseLogging', True),
    ('patches', collections.OrderedDict((k, True) for k in keys)),
    ('oldLocales', False), ('lvl1Traders', False)])
json.dump(conf, open(os.path.join(OUT,'config.json'),'w',encoding='utf-8'), indent=2, ensure_ascii=False)
