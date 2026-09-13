#!/usr/bin/env python3
import json,sys
from pathlib import Path
E=lambda u,v:(u,v) if u<v else (v,u)
def CE(c): return {E(c[i],c[(i+1)%len(c)]) for i in range(len(c))}
def main(p):
 c=json.loads(Path(p).read_text()); n=c["n"]; es={E(*x) for x in c["e"]}
 assert n==20 and len(es)==30
 d={E(*x) for x in c["d"]}; A=set(c["a"])
 assert d<=es and len(d)==2
 assert all(((u in A)!=(v in A)) for u,v in es-d)
 cyc=[CE(x) for x in c["c"]]
 assert all(len(c["c"][i])%2 and cyc[i]<=es for i in range(len(cyc)))
 assert not set.intersection(*cyc)
 beta=2; mc=len(es)-beta
 assert mc==c["mc"]==28
 best=0
 for b in range(1<<(n-1)):
  s=0
  for u,v in es:
   x=0 if u==0 else (b>>(u-1))&1
   y=0 if v==0 else (b>>(v-1))&1
   s+=x!=y
  best=max(best,s)
 assert best==mc
 print(f"PASS bytes={Path(p).stat().st_size} beta={beta} maxcut={mc} exhaustive={best}")
 return 0
if __name__=="__main__": raise SystemExit(main(sys.argv[1]))
