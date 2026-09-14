from __future__ import annotations
import argparse, concurrent.futures, hashlib, json, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, urlsplit, quote, urlunsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT=Path(__file__).resolve().parent
CATALOG=json.loads((ROOT/'catalog.json').read_text())
PROVIDERS={x['id']:x for x in CATALOG['providers']}
COUNTRIES={x['code']:x for x in CATALOG['countries']}

def allowed_url(url):
    try:
        p=urlsplit(url);host=(p.hostname or '').rstrip('.').encode('idna').decode().lower()
        if p.scheme!='https' or not host or p.username or p.password:return False
        if host.split('.')[-1] in CATALOG['policy']['blocked_tlds']:return False
        if any(x=='yandex' for x in host.split('.')):return False
        return not any(host==r or host.endswith('.'+r) for r in CATALOG['policy']['blocked_roots'])
    except (ValueError,UnicodeError):return False

def plan(query,country='',category='all'):
    if not isinstance(query,str) or not query.strip() or len(query)>2048:raise ValueError('Enter a query of 1–2048 characters.')
    country=country.upper()
    if country and country not in COUNTRIES:raise ValueError('Country is excluded or unknown.')
    if category not in {'all','web','research','code','archives'}:raise ValueError('Unknown search category.')
    query=query.strip();name=COUNTRIES[country]['name'] if country else ''
    effective=query+(' "'+name+'"' if name else '')
    selected=[p for p in PROVIDERS.values() if p['enabled'] and not p['known_russian_provider'] and (category=='all' or p['category']==category)]
    selected.sort(key=lambda p:(p['country_affinity']!=country, p['id'] not in ['brave','mojeek','crossref','europepmc'],p['name']))
    routes=[]
    for p in selected:
        url=p['query_template'].replace('{q}',quote(effective,safe='')) if p['query_template'] else 'https://search.brave.com/search?'+urlencode({'q':'site:'+urlsplit(p['homepage']).hostname+' '+effective})
        if not allowed_url(p['homepage']) or not allowed_url(url):continue
        routes.append({**p,'url':url,'query':effective})
    return {'query':query,'effective_query':effective,'country':country,'category':category,'routes':routes,
            'country_scope':'keyword hint, not geographic restriction' if country else 'global',
            'authority_transfer':False,'corroborated':False,'unresolved':['Results require source-specific verification.']}

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise ValueError('Redirect not followed; endpoint needs review.')

def _fetch(provider,query,limit):
    if provider=='crossref':
        url='https://api.crossref.org/works?'+urlencode({'query':query,'rows':limit})
    elif provider=='europepmc':
        url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urlencode({'query':query,'format':'json','pageSize':limit})
    else:raise ValueError('No direct API configured for this provider.')
    if not allowed_url(url):raise ValueError('Excluded endpoint.')
    endpoint=url
    with build_opener(NoRedirect).open(Request(url,headers={'User-Agent':'OrbitSearch/3.0 (bounded research metadata client)','Accept':'application/json'}),timeout=12) as r:
        raw=r.read(2_000_001)
        if len(raw)>2_000_000:raise ValueError('Response exceeded limit.')
    data=json.loads(raw);rows=[]
    if provider=='crossref':
        for x in data.get('message',{}).get('items',[]):
            doi=x.get('DOI');url='https://doi.org/'+quote(doi,safe='/') if doi else x.get('URL','')
            rows.append({'title':next(iter(x.get('title',[])),'Untitled'),'url':url,'doi':doi})
    else:
        for x in data.get('resultList',{}).get('result',[]):
            doi=x.get('doi');url='https://doi.org/'+quote(doi,safe='/') if doi else 'https://europepmc.org/article/'+quote(x.get('source','MED'),safe='')+'/'+quote(x.get('id',''),safe='')
            rows.append({'title':x.get('title','Untitled'),'url':url,'doi':doi})
    stamp=datetime.now(timezone.utc).isoformat()
    kept=[{**r,'provider':provider,'retrieved_at':stamp,'relation':'CANDIDATE_ONLY','corroborated':False} for r in rows if allowed_url(r['url'])]
    return {'provider':provider,'status':'ok','results':kept,'filtered_count':len(rows)-len(kept),
            'retrieved_at':stamp,'response_sha256':hashlib.sha256(raw).hexdigest(),'endpoint':endpoint}

def search(query,country='',category='all',limit=5):
    p=plan(query,country,category)
    limit=max(1,min(int(limit),10));active=[x['id'] for x in p['routes'] if x['mode']=='api_and_launch']
    batches=[]
    if active:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            work={executor.submit(_fetch,x,p['effective_query'],limit):x for x in active}
            for future in concurrent.futures.as_completed(work):
                provider=work[future]
                try:batches.append(future.result())
                except Exception as exc:batches.append({'provider':provider,'status':'unavailable','error':type(exc).__name__,'results':[]})
    # Merge duplicate DOI/URL records while retaining every retrieval provenance.
    merged={}
    for batch in batches:
        for row in batch['results']:
            key=('doi:'+row['doi'].lower()) if row.get('doi') else row['url']
            if key not in merged:merged[key]={**row,'provenance':[]}
            merged[key]['provenance'].append({'provider':row['provider'],'retrieved_at':row['retrieved_at']})
    p.update(results=list(merged.values()),provider_runs=batches)
    p['unresolved'] += [x['provider']+': unavailable; not evidence of absence' for x in batches if x['status']!='ok']
    return p

class GlobalSearchCarrier:
    """Existing ECS adapter contract; retrieval never promotes a domain claim."""
    def execute(self,request):
        payload=request.get('search',{})
        query=payload.get('query')
        if not query:return {'ok':False,'result':'An explicit search.query is required.','evidence':[],'unresolved':['No query supplied.']}
        started=time.monotonic()
        out=search(query,payload.get('country',''),payload.get('category','all'))
        good=[x for x in out['provider_runs'] if x['status']=='ok']
        return {'ok':bool(good),'result':f"Retrieved {len(out['results'])} candidate records; {len(out['routes'])} search routes available.",
            'artifact':out,'evidence':['retrieval:'+x['provider']+':sha256:'+x['response_sha256'] for x in good],
            'evidence_kind':'retrieval-trace','scope_kind':'retrieval-state','substantive':False,
            'corroborated':False,'satisfies':[],'unresolved':out['unresolved'],'cost':{'elapsed_seconds':time.monotonic()-started}}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('query');ap.add_argument('--country',default='');ap.add_argument('--category',default='all');ap.add_argument('--live',action='store_true')
    args=ap.parse_args();print(json.dumps((search if args.live else plan)(args.query,args.country,args.category),ensure_ascii=False,indent=2))
