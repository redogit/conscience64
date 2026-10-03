#!/usr/bin/env python3
import hashlib, itertools, json, os, platform, random, statistics, struct, subprocess, zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
inputs=ROOT/'inputs'; inputs.mkdir(exist_ok=True)
def zip_bytes(data,level=6,strategy=0,chunk=None,flush=None,stored=False):
    if stored: payload=data; method=0
    else:
        co=zlib.compressobj(level,zlib.DEFLATED,-15,8,strategy); pieces=[]
        if chunk is None: pieces.append(co.compress(data))
        else:
            for pos in range(0,len(data),chunk):
                pieces.append(co.compress(data[pos:pos+chunk]))
                if flush is not None: pieces.append(co.flush(flush))
        pieces.append(co.flush()); payload=b''.join(pieces); method=8
    name=b'probe.txt'; crc=zlib.crc32(data); n=len(data); c=len(payload)
    local=struct.pack('<IHHHHHIIIHH',0x04034b50,20,0,method,0,0,crc,c,n,len(name),0)+name+payload
    central=struct.pack('<IHHHHHHIIIHHHHHII',0x02014b50,20,20,0,method,0,0,crc,c,n,len(name),0,0,0,0,0,0)+name
    return local+central+struct.pack('<IHHHHIIH',0x06054b50,0,0,1,1,len(central),len(local),0)
def run(binary,cmd,path,model=False):
    args=[str(ROOT/binary),cmd,str(path)]
    if model: args+=['probe.txt',str(ROOT/'fixture.znn')]
    r=subprocess.run(args,capture_output=True,text=True,check=True)
    return json.loads(r.stdout),json.loads(r.stderr) if r.stderr else {}
def timed(binary,cmd,path):
    r=subprocess.run([str(ROOT/'measure'),str(ROOT/binary),cmd,str(path)],capture_output=True,text=True,check=True)
    rows=[json.loads(x) for x in r.stderr.splitlines()]
    measurement=rows[-1]; measurement.pop('measurement')
    return {**measurement,'carrier':json.loads(r.stdout),'work':rows[0] if len(rows)>1 else {}}
# Newly retained deterministic workload, not recovered historical bytes.
line=b'Exact carrier preserves logical order across recompression; bounded history reclaims obsolete grammar nodes.\n'
data=(line*((924000+len(line)-1)//len(line)))[:924000]
paths={}
for kind,stored in [('stored',True),('deflate',False)]:
    p=inputs/f'{kind}.zip';p.write_bytes(zip_bytes(data,stored=stored));paths[kind]=p
report={'scope':'systems-only mark/sweep slot reuse','historical_input_identity':'UNRECOVERED; matched new inputs across implementations, not exact historical rerun','logical_bytes':len(data),'logical_sha256':hashlib.sha256(data).hexdigest(),'environment':{'platform':platform.platform(),'python':platform.python_version(),'zlib':zlib.ZLIB_VERSION,'compiler':subprocess.check_output(['cc','--version'],text=True).splitlines()[0]},'benchmark':{},'counterprobes':{}}
if '--counterprobes-only' in __import__('sys').argv:
    report=json.loads((ROOT/'results.json').read_text())
for kind,p in ([] if '--counterprobes-only' in __import__('sys').argv else paths.items()):
    records={'whole':[],'copy':[],'reclaim':[]}
    variants=[('whole','baseline_cli','embed'),('copy','baseline_instrumented','stream-embed'),('reclaim','reclamation','stream-embed')]
    # Alternate order to reduce fixed-order bias. Seven separate process samples.
    for rep in range(7):
        for label,binary,cmd in (variants if rep%2==0 else list(reversed(variants))): records[label].append(timed(binary,cmd,p))
    reference=records['whole'][0]['carrier']['embedding']
    for label,runs in records.items():
        assert all(r['carrier']['embedding']==reference for r in runs),(kind,label)
    report['benchmark'][kind]={'zip_bytes':p.stat().st_size,'zip_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'runs':records,'medians':{k:{'wall_s':statistics.median(x['wall_s'] for x in v),'peak_rss_kib':statistics.median(x['peak_rss_kib'] for x in v),'reconstruction_s':statistics.median(x['work'].get('reconstruction_s',0) for x in v),'reclamation_s':statistics.median(x['work'].get('reclamation_s',0) for x in v)} for k,v in records.items()},'max_embedding_drift':0.0}
    print(kind,report['benchmark'][kind]['medians'],flush=True)
if '--benchmark-only' in __import__('sys').argv:
    prior=json.loads((ROOT/'results.json').read_text())
    report['counterprobes']=prior['counterprobes']
    report['large_collection_counterprobes']=prior['large_collection_counterprobes']
    (ROOT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    raise SystemExit(0)
(ROOT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
# Same inherited categories: stored, levels 0..9, strategies and forced flush boundaries.
# Historical 361 input encodings were not retained; this is a new 361-case matrix.
rng=random.Random(20261003)
corpus=b''.join(line+bytes(rng.randrange(256) for _ in range(64)) for _ in range(200))
text=corpus[:30713]
variants=[('stored',zip_bytes(text,stored=True))]
pool=[];seen={hashlib.sha256(variants[0][1]).hexdigest()}
for level,strategy,chunk,flush in itertools.product(range(10),[zlib.Z_DEFAULT_STRATEGY,zlib.Z_FILTERED,zlib.Z_HUFFMAN_ONLY,zlib.Z_RLE,zlib.Z_FIXED],[None,*range(7,128,4),251,1024,4096],[None,zlib.Z_SYNC_FLUSH,zlib.Z_FULL_FLUSH]):
    encoded=zip_bytes(text,level,strategy,chunk,flush)
    sha=hashlib.sha256(encoded).hexdigest()
    if sha in seen: continue
    seen.add(sha)
    pool.append((f'l{level}_s{strategy}_c{chunk}_f{flush}',encoded))
rng.shuffle(pool)
assert len(pool)>=360,len(pool)
variants+=pool[:360]
assert len(variants)==361
ref=None;pred=None;rows=[]
for name,encoded in variants:
    p=inputs/'counterprobe.zip';p.write_bytes(encoded)
    w,_=run('baseline_cli','embed',p)
    b,_=run('baseline_cli','stream-embed',p)
    v,_=run('reclamation','stream-embed',p)
    pb,_=run('baseline_cli','stream-nn-classify',p,True)
    pv,_=run('reclamation','stream-nn-classify',p,True)
    if ref is None: ref=w['embedding'];pred=pb
    assert w['embedding']==b['embedding']==v['embedding']==ref,name
    assert pb['probability']==pv['probability']==pred['probability'],name
    assert pb['score']==pv['score']==pred['score'],name
    rows.append({'variant':name,'zip_sha256':hashlib.sha256(encoded).hexdigest(),'zip_bytes':len(encoded),'embedding_drift':0.0,'probability_drift':0.0})
report['counterprobes']={'matrix_identity':'NEW; 361 distinct encodings from inherited categories; original generator missing','logical_bytes':len(text),'logical_sha256':hashlib.sha256(text).hexdigest(),'generator_seed':20261003,'attempted':len(rows),'passed':len(rows),'distinct_zip_encodings':len(set(r['zip_sha256'] for r in rows)),'max_embedding_drift':0.0,'max_probability_drift':0.0,'model':'unchanged nn_init fixed fixture; no training or semantic-model changes','rows':rows}
# Cases >32KiB ensure collections run under very different parse shapes.
large=[]
for level,strategy,chunk,flush in [(0,0,None,None),(6,0,17,zlib.Z_FULL_FLUSH),(9,zlib.Z_FIXED,4096,zlib.Z_SYNC_FLUSH),(6,zlib.Z_HUFFMAN_ONLY,None,None)]:
    p=inputs/'counterprobe.zip';p.write_bytes(zip_bytes(data[:100000],level,strategy,chunk,flush))
    w,_=run('baseline_cli','embed',p);b,_=run('baseline_cli','stream-embed',p);v,work=run('reclamation','stream-embed',p)
    assert w['embedding']==b['embedding']==v['embedding']
    pb,_=run('baseline_cli','stream-nn-classify',p,True);pv,_=run('reclamation','stream-nn-classify',p,True)
    assert pb['score']==pv['score'] and pb['probability']==pv['probability']
    assert v['compactions']>0 and work['reclaimed_nodes']>0
    large.append({'level':level,'strategy':strategy,'chunk':chunk,'flush':flush,'zip_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'compactions':v['compactions'],'max_embedding_drift':0.0,'max_probability_drift':0.0})
report['large_collection_counterprobes']=large
(ROOT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
print('counterprobes:',len(rows),'matrix +',len(large),'large collection cases passed',flush=True)
