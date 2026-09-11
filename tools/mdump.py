#!/usr/bin/env python3
"""Minimal ECMA-335 metadata reader: dumps TypeDef -> fields/methods/properties."""
import struct, sys, json

def u8(b,o): return b[o]
def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]

class Meta:
    def __init__(self, path):
        d = open(path,'rb').read(); self.d=d
        pe = u32(d,0x3c)
        assert d[pe:pe+4]==b'PE\0\0'
        nsec = u16(d,pe+6); opt = pe+24; optsize = u16(d,pe+20)
        magic = u16(d,opt)
        dd = opt + (0x60 if magic==0x10b else 0x70)
        cli_rva = u32(d, dd+14*8)
        sects=[]
        so = opt+optsize
        for i in range(nsec):
            b = so+i*40
            sects.append((u32(d,b+12), u32(d,b+8), u32(d,b+20)))  # vaddr, vsize, praw
        self.sects=sects
        cli = self.rva2off(cli_rva)
        md_rva = u32(d, cli+8)
        md = self.rva2off(md_rva)
        assert d[md:md+4]==b'BSJB'
        vlen = u32(d, md+12); p = md+16+vlen
        p += 2  # flags
        nstreams = u16(d,p); p+=2
        self.streams={}
        for _ in range(nstreams):
            off=u32(d,p); size=u32(d,p+4); p+=8
            e=d.index(b'\0',p); name=d[p:e].decode()
            p += (len(name)//4+1)*4
            self.streams[name]=(md+off,size)
        self.strings=self.streams.get('#Strings')
        self.parse_tables()

    def rva2off(self,rva):
        for va,vs,praw in self.sects:
            if va<=rva<va+max(vs,1)+0x2000: return praw+(rva-va)
        raise ValueError(rva)

    def s(self,idx):
        if idx==0: return ''
        o=self.strings[0]+idx
        e=self.d.index(b'\0',o)
        return self.d[o:e].decode('utf-8','replace')

    def parse_tables(self):
        d=self.d; base=self.streams['#~'][0]
        heapsizes=u8(d,base+6)
        valid=struct.unpack_from('<Q',d,base+8)[0]
        p=base+24
        rows={}
        for i in range(64):
            if valid>>i & 1:
                rows[i]=u32(d,p); p+=4
        self.rows=rows
        self.sidx = 4 if heapsizes&1 else 2
        self.gidx = 4 if heapsizes&2 else 2
        self.bidx = 4 if heapsizes&4 else 2
        def ti(t):
            if isinstance(t,int): t=[t]
            return 4 if any(rows.get(x,0)>=65536 for x in t) else 2
        def ci(tags,bits):
            return 4 if any(rows.get(x,0) >= (1<<(16-bits)) for x in tags) else 2
        S,G,B=self.sidx,self.gidx,self.bidx
        TypeDefOrRef=ci([0x02,0x01,0x1b],2)
        HasConstant=ci([0x04,0x08,0x17],2)
        HasCustomAttribute=ci([0x06,0x04,0x01,0x02,0x08,0x09,0x0a,0x00,0x0e,0x17,0x14,0x11,0x1a,0x1b,0x20,0x23,0x26,0x27,0x28,0x2a,0x2c],5)
        HasFieldMarshal=ci([0x04,0x08],1)
        HasDeclSecurity=ci([0x02,0x06,0x20],2)
        MemberRefParent=ci([0x02,0x01,0x1a,0x06,0x1b],3)
        HasSemantics=ci([0x0e,0x17],1)
        MethodDefOrRef=ci([0x06,0x0a],1)
        MemberForwarded=ci([0x04,0x06],1)
        Implementation=ci([0x26,0x23,0x27],2)
        CustomAttributeType=ci([0x06,0x0a],3)
        ResolutionScope=ci([0x00,0x1a,0x23,0x01],2)
        TypeOrMethodDef=ci([0x02,0x06],1)
        sizes={
         0x00:2+S+G+G+G, 0x01:ResolutionScope+S+S,
         0x02:4+S+S+TypeDefOrRef+ti(0x04)+ti(0x06),
         0x04:2+S+B, 0x06:4+2+2+S+B+ti(0x08),
         0x08:2+2+S, 0x09:ti(0x02)+ti(0x06),
         0x0a:MemberRefParent+S+B, 0x0b:1+1+HasConstant+B,
         0x0c:HasCustomAttribute+CustomAttributeType+B,
         0x0d:HasFieldMarshal+B, 0x0e:2+HasDeclSecurity+B,
         0x0f:2+4+ti(0x02), 0x10:4+ti(0x04), 0x11:B,
         0x12:ti(0x02)+ti(0x14), 0x14:2+S+TypeDefOrRef,
         0x15:ti(0x02)+ti(0x17), 0x17:2+S+B,
         0x18:2+ti(0x06)+HasSemantics,
         0x19:ti(0x02)+MethodDefOrRef+MethodDefOrRef,
         0x1a:S, 0x1b:B, 0x1c:2+MemberForwarded+S+ti(0x1a),
         0x1d:4+ti(0x04), 0x1e:ti(0x02)+ti(0x02),
         0x20:4+2+2+2+2+4+B+S+S, 0x21:4,
         0x23:2+2+2+2+4+B+S+S+B, 0x24:4,
         0x26:4+S+B, 0x27:4+4+S+S+Implementation,
         0x28:4+4+S+Implementation, 0x29:ti(0x02)+ti(0x02),
         0x2a:2+2+TypeOrMethodDef+S, 0x2b:MethodDefOrRef+B,
         0x2c:ti(0x2a)+TypeDefOrRef, 0x2d:4+4+4+4,
        }
        self.off={}
        for i in sorted(rows):
            self.off[i]=p
            p += rows[i]*sizes[i]
        self.sizes=sizes
        self.ti=ti; self.TypeDefOrRef=TypeDefOrRef; self.HasSemantics=HasSemantics

    def row(self,t,i):  # 1-based
        return self.off[t] + (i-1)*self.sizes[t]

def dump(path):
    m=Meta(path); d=m.d; S=m.sidx
    fi=m.ti(0x04); mi=m.ti(0x06); pi=m.ti(0x17)
    ntd=m.rows.get(0x02,0); nf=m.rows.get(0x04,0); nm=m.rows.get(0x06,0)
    nprop=m.rows.get(0x17,0); npm=m.rows.get(0x15,0)
    rs = lambda o: (u32(d,o) if S==4 else u16(d,o))
    ridx= lambda o,w: (u32(d,o) if w==4 else u16(d,o))
    # property map: typedef -> property range
    pmap={}
    if npm:
        tdw=m.ti(0x02)
        for i in range(1,npm+1):
            o=m.row(0x15,i)
            td=ridx(o,tdw); pl=ridx(o+tdw,pi)
            nxt = ridx(m.row(0x15,i+1)+tdw,pi) if i<npm else nprop+1
            pmap[td]=(pl,nxt)
    out={}
    for i in range(1,ntd+1):
        o=m.row(0x02,i)
        name=m.s(rs(o+4)); ns=m.s(rs(o+4+S))
        fl=o+4+S+S+m.TypeDefOrRef
        f0=ridx(fl,fi); m0=ridx(fl+fi,mi)
        if i<ntd:
            o2=m.row(0x02,i+1); fl2=o2+4+S+S+m.TypeDefOrRef
            f1=ridx(fl2,fi); m1=ridx(fl2+fi,mi)
        else:
            f1=nf+1; m1=nm+1
        full=f"{ns}.{name}" if ns else name
        props=[]
        if i in pmap:
            a,b=pmap[i]
            for pr in range(a,min(b,nprop+1)):
                po=m.row(0x17,pr)
                props.append(m.s(rs(po+2)))
        methods=[]
        for k in range(m0,min(m1,nm+1)):
            mo=m.row(0x06,k)
            methods.append(m.s(rs(mo+8)))
        fields=[]
        for k in range(f0,min(f1,nf+1)):
            fo=m.row(0x04,k)
            fields.append(m.s(rs(fo+2)))
        out[full]={'props':props,'methods':methods,'fields':fields}
    return out

if __name__=='__main__':
    res=dump(sys.argv[1])
    json.dump(res,open(sys.argv[2],'w'),indent=0)
    print(f"{len(res)} types -> {sys.argv[2]}")
