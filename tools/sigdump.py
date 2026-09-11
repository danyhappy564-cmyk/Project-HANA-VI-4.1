#!/usr/bin/env python3
"""Decode property signatures for named types (removes guesswork about collection types)."""
import sys, struct, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mdump import Meta, u16, u32

PRIM = {0x01:'void',0x02:'bool',0x03:'char',0x04:'sbyte',0x05:'byte',0x06:'short',0x07:'ushort',
        0x08:'int',0x09:'uint',0x0a:'long',0x0b:'ulong',0x0c:'float',0x0d:'double',0x0e:'string',
        0x16:'TypedRef',0x18:'IntPtr',0x19:'UIntPtr',0x1c:'object'}

class Sig:
    def __init__(s, m):
        s.m = m; s.d = m.d
        s.blobbase = m.streams['#Blob'][0]
        s.ridx = lambda o, w: (u32(s.d, o) if w == 4 else u16(s.d, o))

    def blob(s, idx):
        o = s.blobbase + idx
        b0 = s.d[o]
        if b0 & 0x80 == 0: ln, o = b0, o+1
        elif b0 & 0x40 == 0: ln, o = ((b0 & 0x3f) << 8) | s.d[o+1], o+2
        else: ln, o = ((b0 & 0x1f) << 24) | (s.d[o+1] << 16) | (s.d[o+2] << 8) | s.d[o+3], o+4
        return s.d[o:o+ln]

    def cuint(s, b, i):
        x = b[i]
        if x & 0x80 == 0: return x, i+1
        if x & 0x40 == 0: return ((x & 0x3f) << 8) | b[i+1], i+2
        return ((x & 0x1f) << 24) | (b[i+1] << 16) | (b[i+2] << 8) | b[i+3], i+4

    def typename(s, tbl, row):
        m = s.m; S = m.sidx
        rs = lambda o: (u32(s.d, o) if S == 4 else u16(s.d, o))
        if tbl == 0:   # TypeDef
            o = m.row(0x02, row); n, ns = m.s(rs(o+4)), m.s(rs(o+4+S))
        elif tbl == 1: # TypeRef
            RS = m.sizes[0x01] - 2*S
            o = m.row(0x01, row); n, ns = m.s(rs(o+RS)), m.s(rs(o+RS+S))
        else: return f"TypeSpec#{row}"
        return f"{ns}.{n}" if ns else n

    def parse(s, b, i=0):
        t = b[i]; i += 1
        if t in PRIM: return PRIM[t], i
        if t in (0x11, 0x12):  # VALUETYPE / CLASS
            c, i = s.cuint(b, i)
            return s.typename(c & 3, c >> 2), i
        if t == 0x15:          # GENERICINST
            inner, i = s.parse(b, i)
            n, i = s.cuint(b, i)
            args = []
            for _ in range(n):
                a, i = s.parse(b, i); args.append(a)
            return f"{inner}<{', '.join(args)}>", i
        if t == 0x1d:          # SZARRAY
            e, i = s.parse(b, i); return f"{e}[]", i
        if t in (0x13, 0x1e):  # VAR / MVAR
            n, i = s.cuint(b, i); return f"T{n}", i
        if t == 0x45:          # CMOD/pinned-ish prefix seen in practice
            return s.parse(b, i)
        if t in (0x1f, 0x20):  # CMOD_REQD / CMOD_OPT
            _, i = s.cuint(b, i); return s.parse(b, i)
        return f"?0x{t:02x}", i

    def props_of(s, typename):
        m = s.m; S = m.sidx
        rs = lambda o: (u32(s.d, o) if S == 4 else u16(s.d, o))
        pi = m.ti(0x17); tdw = m.ti(0x02)
        nprop = m.rows.get(0x17, 0); npm = m.rows.get(0x15, 0); ntd = m.rows.get(0x02, 0)
        target = None
        for i in range(1, ntd+1):
            o = m.row(0x02, i)
            n, ns = m.s(rs(o+4)), m.s(rs(o+4+S))
            if (f"{ns}.{n}" if ns else n) == typename or n == typename:
                target = i; break
        if target is None: return None
        for i in range(1, npm+1):
            o = m.row(0x15, i)
            if s.ridx(o, tdw) != target: continue
            a = s.ridx(o+tdw, pi)
            b_ = s.ridx(m.row(0x15, i+1)+tdw, pi) if i < npm else nprop+1
            out = []
            for pr in range(a, min(b_, nprop+1)):
                po = m.row(0x17, pr)
                name = m.s(rs(po+2))
                blobidx = s.ridx(po+2+S, m.bidx)
                sig = s.blob(blobidx)
                j = 1
                _, j = s.cuint(sig, j)   # param count
                try: ty, _ = s.parse(sig, j)
                except Exception as e: ty = f"<err {e}>"
                out.append((name, ty))
            return out
        return []

m = Meta(sys.argv[1]); sg = Sig(m)
for tn in sys.argv[2:]:
    r = sg.props_of(tn)
    print(f"### {tn}")
    if r is None: print("  (type not found)"); continue
    for n, t in r: print(f"  {t:60s} {n}")
    print()
