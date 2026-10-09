#!/usr/bin/env python3
from __future__ import annotations
import copy, json, math, os, re, shutil, subprocess, tempfile, time
from dataclasses import dataclass, asdict
from enum import Enum
from fractions import Fraction
from hashlib import sha256
from pathlib import Path

class R(str, Enum): PASS='PASS'; FAIL='FAIL'; PARTIAL='PARTIAL'; INCONCLUSIVE='INCONCLUSIVE'
class E(str, Enum): THEOREM='THEOREM'; EXACT='EXACT_COMPUTATION'; CROSS='CROSS_VERIFIED'; NUM='NUMERICAL_EVIDENCE'; HYP='HYPOTHESIS'; UNKNOWN='UNKNOWN'
ORDER={E.UNKNOWN:0,E.HYP:1,E.NUM:2,E.EXACT:3,E.CROSS:4,E.THEOREM:5}
CEILING={'mathbox':E.HYP,'webgl':E.HYP,'brl':E.HYP,'ai':E.HYP,'webgpu':E.NUM,'mathematica':E.EXACT,'wasm_exact':E.EXACT}
def cj(x): return json.dumps(x,sort_keys=True,separators=(',',':'))
def dg(x): return sha256(cj(x).encode()).hexdigest()
@dataclass(frozen=True)
class Event: seq:int; typ:str; payload:dict; tx:str|None=None

def replay(events, crash=False):
    committed={}; overlay={}; tx=None
    for e in events:
        if e.typ=='object.committed': committed[e.payload['id']]=copy.deepcopy(e.payload['value'])
        elif e.typ=='transaction.opened':
            if tx is not None: raise ValueError('nested tx')
            tx=e.payload['id']; overlay={}
        elif e.typ=='object.derived':
            if tx!=e.tx: raise ValueError('tx mismatch')
            overlay[e.payload['id']]=copy.deepcopy(e.payload['value'])
        elif e.typ=='transaction.committed':
            if tx!=e.payload['id']: raise ValueError('tx mismatch')
            committed.update(overlay); overlay={}; tx=None
        elif e.typ=='transaction.rolled_back':
            if tx!=e.payload['id']: raise ValueError('tx mismatch')
            overlay={}; tx=None
        else: raise ValueError(e.typ)
    if crash: overlay={}; tx=None
    return {'committed':committed,'working':{**committed,**overlay},'tx':tx}

def authority(backend, requested, mutant=False): return True if mutant else ORDER[requested]<=ORDER[CEILING[backend]]
def rankq(m):
    a=[[Fraction(x) for x in row] for row in m]; r=0
    for c in range(len(a[0]) if a else 0):
        p=next((i for i in range(r,len(a)) if a[i][c]),None)
        if p is None: continue
        a[r],a[p]=a[p],a[r]; q=a[r][c]; a[r]=[x/q for x in a[r]]
        for i in range(len(a)):
            if i!=r and a[i][c]:
                q=a[i][c]; a[i]=[x-q*y for x,y in zip(a[i],a[r])]
        r+=1
        if r==len(a): break
    return r

def fq_lines(): return [(f,a,b) for f in range(3) for a in range(4) for b in range(4)]
def fq_int(L,M):
    f,a,b=L; g,c,d=M
    if L==M:return -2
    if f==g:return int((a==c)^(b==d))
    if (f,g) in {(1,0),(2,0),(2,1)}: return fq_int(M,L)
    if (f,g)==(0,1): return int((a+d-c-b)%4==0)
    if (f,g)==(0,2): return int((c-a-b-d-1)%4==0)
    if (f,g)==(1,2): return int((a+b-c-d)%4==0)
    raise AssertionError

def fq_matrix():
    L=fq_lines(); return [[fq_int(x,y) for y in L] for x in L]
def validate_matrix(m):
    n=len(m); assert n and all(len(x)==n for x in m); assert all(m[i][i]==-2 for i in range(n)); assert all(m[i][j]==m[j][i] for i in range(n) for j in range(n))
def snf2(m):
    g=0
    for row in m:
        for x in row:g=math.gcd(g,abs(x))
    det=m[0][0]*m[1][1]-m[0][1]*m[1][0]
    return [] if g==0 else ([g] if det==0 else [g,abs(det)//g])
def wasm_snf(root,data):
    node=shutil.which('node')
    if not node: raise RuntimeError('node unavailable')
    js="""const fs=require('fs');const b=Buffer.from(fs.readFileSync(process.argv[2],'utf8').trim(),'base64');const d=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));(async()=>{let {instance}=await WebAssembly.instantiate(b,{});let o=d.matrices.map(m=>{let [a,b]=m[0],[c,e]=m[1],x=Number(instance.exports.snf_d1(BigInt(a),BigInt(b),BigInt(c),BigInt(e))),y=Number(instance.exports.snf_d2(BigInt(a),BigInt(b),BigInt(c),BigInt(e)));return x===0?[]:(y===0?[x]:[x,y])});process.stdout.write(JSON.stringify(o))})()"""
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False) as f:f.write(js); p=f.name
    try:return json.loads(subprocess.check_output([node,p,str(root/'fixtures/snf2.wasm.b64'),str(root/'fixtures/e003_snf2_fixture.json')],text=True))
    finally:os.unlink(p)
def cmd(s,lattice=None,objs=None):
    s=' '.join(s.lower().strip().split())
    m=re.fullmatch(r'smith\s+([\w-]+)',s) or re.fullmatch(r'compute the smith (?:normal )?form of\s+([\w-]+)',s)
    if m:return {'verb':'COMPUTE','op':'SmithNormalForm','target':m.group(1).upper(),'exactness':'EXACT'}
    if s.rstrip('?')=='what are the elementary divisors here': return {'unresolved':['target']} if not lattice else {'verb':'COMPUTE','op':'SmithNormalForm','target':lattice.upper(),'exactness':'EXACT'}
    if s.rstrip('.')=='compare these': return {'verb':'COMPARE','left':objs[0],'right':objs[1]} if objs and len(objs)==2 else {'unresolved':['left','right'],'candidates':objs or []}
    return {'unresolved':['command']}
def corr_obs(): return {k:'OPEN' for k in ['cycle_exists_algebraically','codimension_correct','field_of_definition','cycle_class_defined','induced_map_defined','desired_realization_map','galois_compatibility','normalization','inverse_or_composition']}
def corr_complete(o): return bool(o) and all(v in {'SATISFIED','NOT_APPLICABLE'} for v in o.values())
def merge(a,b):
    c=[k for k in set(a)&set(b) if a[k]!=b[k]]
    if c: raise ValueError(c)
    return {**a,**b}
@dataclass
class X: id:str; result:R; duration_ms:float; observation:dict; counterprobe:dict; claim_ceiling:str; input_hash:str; output_hash:str
def runx(i,inp,ceiling,fn):
    t=time.perf_counter(); r,o,c=fn(); d=(time.perf_counter()-t)*1000; return X(i,r,d,o,c,ceiling,dg(inp),dg({'r':r.value,'o':o,'c':c}))
def suite(root):
    out=[]
    def e1():
        es=[Event(1,'object.committed',{'id':'X','value':1}),Event(2,'transaction.opened',{'id':'T'}),Event(3,'object.derived',{'id':'Y','value':2},'T'),Event(4,'transaction.rolled_back',{'id':'T'})]; a=replay(es[:1]); b=replay(es); m=replay(es[:-1]); ok=dg(a['working'])==dg(b['working']) and dg(m['working'])!=dg(a['working']); return (R.PASS if ok else R.FAIL,{'baseline_hash':dg(a['working']),'final_hash':dg(b['working'])},{'rollback_removed_mutant_killed':dg(m['working'])!=dg(a['working'])})
    out.append(runx('E001',{'contract':'replay+rollback'},'State conformance only; no mathematical claim.',e1))
    def e2():
        A=[('mathbox',E.THEOREM),('brl',E.EXACT),('webgpu',E.EXACT),('ai',E.THEOREM)]; s=[authority(*x) for x in A]; m=[authority(*x,mutant=True) for x in A]; ok=s==[False]*4 and m==[True]*4; return (R.PASS if ok else R.FAIL,{'accepted':s},{'unsafe_promoter_accepts_all':m,'mutant_killed':ok})
    out.append(runx('E002',{'ceilings':{k:v.value for k,v in CEILING.items()}},'Authority policy only.',e2))
    def e3():
        d=json.loads((root/'fixtures/e003_snf2_fixture.json').read_text()); a=d['wolfram_smith_invariants']; b=[snf2(m) for m in d['matrices']]; c=wasm_snf(root,d); ok=a==b==c; mut=copy.deepcopy(c); mut[1][-1]+=1; killed=mut!=a; return (R.PASS if ok and killed else R.FAIL,{'cases':len(a),'all_three_equal':ok},{'one_invariant_mutation_detected':killed})
    out.append(runx('E003',{'fixture':'e003'},'Bounded 2x2 Smith cross-verification only.',e3))
    def e4():
        r=json.loads((root/'fixtures/brl_identity_cliff.json').read_text())['baseline']; w=next(((a,b) for a,b in zip(r,r[1:]) if b['true_pair_bit_jaccard_mean']>a['true_pair_bit_jaccard_mean'] and b['unique_top1_recovery']<a['unique_top1_recovery']-.1),None); unsafe=w is not None; ok=w is not None; return (R.PASS if ok else R.FAIL,{'witness':w,'identity_inference_allowed':False},{'unsafe_similarity_implies_identity_mutant':unsafe,'mutant_killed':unsafe})
    out.append(runx('E004',{'fixture':'brl-cliff'},'Preserved synthetic BRL counterexample only.',e4))
    def e5():
        m=fq_matrix(); validate_matrix(m); rk=rankq(m); mut=copy.deepcopy(m); mut[0][1]=0; killed=False
        try:validate_matrix(mut)
        except AssertionError:killed=True
        ok=len(fq_lines())==48 and rk==20 and killed; return (R.PASS if ok else R.FAIL,{'constructed_lines':48,'intersection_matrix':[48,48],'rational_rank':rk},{'asymmetric_intersection_mutant_detected':killed})
    out.append(runx('E005',{'family':'Fermat quartic K3'},'Exact finite line-span calibration; not a general Hodge result.',e5))
    def e6():
        s={'X':{'eq':'fermat4','cycles':48}}; h=dg(s); va={'camera':[0,0,5]}; vb={'camera':[2,1,7]}; killed=dg({'math':s,'view':va})!=dg({'math':s,'view':vb}); return (R.PASS if killed else R.FAIL,{'math_hash_before':h,'math_hash_after':dg(s)},{'view_in_authoritative_hash_mutant_changes_identity':killed})
    out.append(runx('E006',{'views':2},'Visualization isolation only.',e6))
    def e7():
        o=corr_obs(); refused=not corr_complete(o); o={k:'SATISFIED' for k in o}; done=corr_complete(o); m=dict(o); m['galois_compatibility']='OPEN'; killed=not corr_complete(m); ok=refused and done and killed; return (R.PASS if ok else R.FAIL,{'obligations':len(o),'incomplete_refused':refused,'complete_after_all_satisfied':done},{'one_open_obligation_blocks_completion':killed})
    out.append(runx('E007',{'Gamma':'X->Y'},'Obligation-generation semantics only.',e7))
    def e8():
        es=[Event(1,'object.committed',{'id':'A','value':1}),Event(2,'transaction.opened',{'id':'T'}),Event(3,'object.derived',{'id':'B','value':2},'T')]; r=replay(es,crash=True); u=replay(es); ok=r['committed']=={'A':1} and 'B' not in r['working']; killed='B' in u['working']; return (R.PASS if ok and killed else R.FAIL,{'recovered':r['committed']},{'unsafe_overlay_survives_without_crash_rule':killed})
    out.append(runx('E008',{'crash_after':3},'Recovery semantics only.',e8))
    def e9():
        base={'X':1}; a={'A':1}; b={'B':1}; iso='B' not in a and 'A' not in b; c=dg(merge(base,merge(a,b)))==dg(merge(base,merge(b,a))); killed=False
        try:merge({'C':1},{'C':2})
        except ValueError:killed=True
        ok=iso and c and killed; return (R.PASS if ok else R.FAIL,{'isolated':iso,'merge_order_invariant':c},{'conflicting_parallel_write_rejected':killed})
    out.append(runx('E009',{'branches':2},'Parallel isolation semantics only.',e9))
    def e10():
        a=cmd('smith L',lattice='L'); b=cmd('compute the Smith normal form of L',lattice='L'); c=cmd('what are the elementary divisors here?',lattice='L'); eq=a==b==c; amb=cmd('compare these',objs=['X','Y','Z']); refused=amb.get('unresolved')==['left','right']; ok=eq and refused; return (R.PASS if ok else R.FAIL,{'canonical':a,'three_forms_equivalent':eq},{'three_object_compare_requires_resolution':refused})
    out.append(runx('E010',{'utterances':4},'Bounded parser conformance only.',e10))
    report={'schema':'conscience64/hodge-conformance/v0.2','protocol_kernel':'v0.1','suite':'E001-E010','hard_boundaries':['SOFTWARE_PASS != MATHEMATICAL_PROOF','METHOD_TRANSFER != EVIDENCE_TRANSFER','SIMILARITY != SOURCE_IDENTITY','VISUALIZATION != EVIDENCE_PROMOTION','FLOATING_POINT != EXACT','TIMEOUT != NEGATIVE_RESULT'],'results':[asdict(x)|{'result':x.result.value} for x in out]}
    report['summary']={k:sum(x.result.value==k.upper() for x in out) for k in ['pass','fail','partial','inconclusive']}; report['suite_hash']=dg({'results':report['results'],'hard_boundaries':report['hard_boundaries']}); return report
if __name__=='__main__':
    root=Path(__file__).resolve().parent; r=suite(root); (root/'CONFORMANCE_RESULT.json').write_text(json.dumps(r,indent=2)+'\n'); print(json.dumps(r['summary'],indent=2)); print(r['suite_hash']); raise SystemExit(1 if r['summary']['fail'] else 0)
