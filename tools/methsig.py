#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mdump import Meta, u16, u32
from sigdump import Sig

m = Meta(sys.argv[1]); sg = Sig(m); S = m.sidx
rs = lambda o: (u32(m.d,o) if S==4 else u16(m.d,o))
ridx = lambda o,w: (u32(m.d,o) if w==4 else u16(m.d,o))
mi = m.ti(0x06); ntd=m.rows.get(0x02,0); nm=m.rows.get(0x06,0)
for tn in sys.argv[2:]:
    for i in range(1, ntd+1):
        o=m.row(0x02,i); n,ns=m.s(rs(o+4)), m.s(rs(o+4+S))
        full=f"{ns}.{n}" if ns else n
        if full!=tn and n!=tn: continue
        fl=o+4+S+S+m.TypeDefOrRef
        m0=ridx(fl+m.ti(0x04),mi)
        if i<ntd:
            o2=m.row(0x02,i+1); m1=ridx(o2+4+S+S+m.TypeDefOrRef+m.ti(0x04),mi)
        else: m1=nm+1
        print(f"### {full}")
        for k in range(m0, min(m1,nm+1)):
            mo=m.row(0x06,k); name=m.s(rs(mo+8))
            if name.startswith(('get_','set_','<','add_','remove_')): continue
            sig=sg.blob(ridx(mo+8+S, m.bidx))
            j=0; flags=sig[j]; j+=1
            if flags & 0x10: _,j = sg.cuint(sig,j)   # generic param count
            cnt,j = sg.cuint(sig,j)
            try:
                ret,j = sg.parse(sig,j)
                ps=[]
                for _ in range(cnt):
                    p,j = sg.parse(sig,j); ps.append(p)
            except Exception as e:
                ret, ps = f"<err {e}>", []
            short=lambda t: t.replace('SPTarkov.Server.Core.Models.','').replace('System.Collections.Generic.','').replace('System.','')
            print(f"  {short(ret)} {name}({', '.join(short(p) for p in ps)})")
        print()
        break
