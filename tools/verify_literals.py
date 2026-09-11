#!/usr/bin/env python3
"""3.11 원본 TypeScript 와 4.1 패치 JSON 을 파일 전체 리터럴 단위로 대조한다.

블록 구조가 없는 모드(SuperAmmo, Items)용. 블록별로 보려면 verify.py 를 쓸 것.

사용법:
  python3 tools/verify_literals.py <원본 mod.ts> <4.1 mod 폴더>
"""
import json, os, re, sys

TS, MOD = sys.argv[1], sys.argv[2]
raw = open(TS, encoding='utf-8').read()
src = re.sub(r'/\*.*?\*/', '', raw, flags=re.S)
src = '\n'.join(re.sub(r'//.*$', '', ln) for ln in src.split('\n'))

ID = re.compile(r'"([0-9a-zA-Z]{24})"')

def walk(path):
    for root, _, files in os.walk(path):
        for fn in files:
            if fn.endswith('.json'): yield os.path.join(root, fn)

blob = []
for f in walk(MOD):
    blob.append(open(f, encoding='utf-8').read())
blob = '\n'.join(blob)
got_ids = set(ID.findall(blob)) | set(re.findall(r'[0-9a-zA-Z]{24}', blob))
got_nums = set(re.findall(r':\s*(-?\d+(?:\.\d+)?)', blob))
got_text = blob

ts_ids = set(ID.findall(src))

# 원본에 선언만 돼 있고 실제로는 쓰이지 않는 ID 를 걸러낸다.
# HANA-VI_Items 는 AIO 소스를 복사해 오면서 쓰지 않는 별칭/탄약 목록이 그대로 남아 있다.
# 판정 기준: 첫 번째 `this.cfg.` 패치 블록보다 앞(=선언부)에서만 등장하는 ID.
first_block = src.find('this.cfg.')
if first_block > 0:
    body = src[first_block:]
    declared_only = {i for i in ts_ids if i not in body}
    if declared_only:
        ts_ids -= declared_only
        print(f"  (참고) 원본에서 선언만 되고 쓰이지 않는 ID {len(declared_only)}개는 대조에서 제외)\n")
# _props.X = 123  /  "Key": 123  형태의 숫자
ts_nums = set(re.findall(r'(?:_props\.\w+\s*=|^\s*\w+\s*:)\s*(-?\d+(?:\.\d+)?)\s*[,;]?\s*$', src, re.M))
# 로케일 문자열
ts_names = set(re.findall(r'name:\s*"([^"]+)"', src)) | set(re.findall(r'shortName:\s*"([^"]+)"', src))
# 구경 상수
ts_cal = set(re.findall(r'ammoCaliber\s*===\s*"(\w+)"', src))
# 번들 경로
ts_paths = set(re.findall(r'path:\s*"([^"]+\.bundle)"', src))

def report(label, expected, present):
    missing = sorted(x for x in expected if not present(x))
    ok = not missing
    print(f"  {label:26s} {len(expected):5d}개 중 {len(expected)-len(missing):5d}개 확인  "
          f"{'OK' if ok else '**FAIL**'}")
    if missing:
        for m in missing[:20]: print(f"       누락: {m}")
        if len(missing) > 20: print(f"       … 외 {len(missing)-20}건")
    return ok

print(f"원본: {TS}\n대상: {MOD}\n")
results = [
    report("아이템 ID",     ts_ids,   lambda x: x in got_ids),
    report("숫자 리터럴",   ts_nums,  lambda x: x in got_nums or x in got_text),
    report("아이템 이름",   ts_names, lambda x: x in got_text),
    report("구경 상수",     ts_cal,   lambda x: x in got_text),
    report("번들 경로",     ts_paths, lambda x: x in got_text),
]
print()
if all(results):
    print("원본 리터럴 전부 4.1 데이터에 존재함")
else:
    print("누락이 있다. 위 목록을 확인할 것")
    sys.exit(1)
