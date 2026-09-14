#!/usr/bin/env python3
"""DU-WATCH/1: dependency-free exact probes for the loopback beta DNS service."""
from __future__ import annotations
import argparse, ipaddress, json, random, socket, struct, time
TYPE={"A":1,"TXT":16,"SRV":33}
def qname(name):
    labels=name.rstrip('.').split('.')
    if any(not x or len(x.encode('ascii'))>63 for x in labels): raise ValueError('invalid DNS name')
    return b''.join(bytes([len(x)])+x.encode('ascii') for x in labels)+b'\0'
def read_name(data,off,depth=0):
    if depth>16: raise ValueError('compression depth')
    labels=[];jumped=False;resume=off
    while True:
        if off>=len(data): raise ValueError('truncated name')
        n=data[off]
        if n==0:
            off+=1;return '.'.join(labels)+'.',(resume if jumped else off)
        if n&0xC0==0xC0:
            if off+1>=len(data): raise ValueError('truncated pointer')
            ptr=((n&0x3F)<<8)|data[off+1]
            if not jumped: resume=off+2
            suffix,_=read_name(data,ptr,depth+1);labels.extend(suffix.rstrip('.').split('.'));return '.'.join(labels)+'.',resume
        if n&0xC0: raise ValueError('invalid label')
        off+=1
        if off+n>len(data): raise ValueError('truncated label')
        labels.append(data[off:off+n].decode('ascii'));off+=n
def query(name,qtype,host='127.0.0.1',port=1053,timeout=1.0):
    ident=random.SystemRandom().randrange(65536);packet=struct.pack('!HHHHHH',ident,0x0100,1,0,0,0)+qname(name)+struct.pack('!HH',TYPE[qtype],1)
    with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as s: s.settimeout(timeout);s.sendto(packet,(host,port));data,_=s.recvfrom(4096)
    if len(data)<12: raise ValueError('short DNS response')
    rid,flags,qd,an,ns,ar=struct.unpack('!HHHHHH',data[:12])
    if rid!=ident or not(flags&0x8000): raise ValueError('invalid response header')
    rcode=flags&0xF;off=12
    for _ in range(qd): _,off=read_name(data,off);off+=4
    answers=[]
    for _ in range(an):
        owner,off=read_name(data,off);rtype,rclass,ttl,rdlen=struct.unpack('!HHIH',data[off:off+10]);off+=10;start,end=off,off+rdlen
        if end>len(data): raise ValueError('truncated rdata')
        if rtype==TYPE['A'] and rdlen==4: value=str(ipaddress.IPv4Address(data[start:end]))
        elif rtype==TYPE['TXT']:
            parts=[];p=start
            while p<end:
                n=data[p];p+=1
                if p+n>end: raise ValueError('bad TXT')
                parts.append(data[p:p+n].decode('utf-8'));p+=n
            value=''.join(parts)
        elif rtype==TYPE['SRV'] and rdlen>=7:
            priority,weight,service_port=struct.unpack('!HHH',data[start:start+6]);target,_=read_name(data,start+6);value={'priority':priority,'weight':weight,'port':service_port,'target':target}
        else: value=data[start:end].hex()
        answers.append({'owner':owner,'type':rtype,'class':rclass,'ttl':ttl,'value':value});off=end
    return {'name':name,'qtype':qtype,'rcode':rcode,'answers':answers,'authority':ns,'additional':ar}
def main():
    p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=1053);args=p.parse_args();started=time.time();checks=[]
    def check(name,qtype,predicate,label):
        try:
            result=query(name,qtype,args.host,args.port);checks.append({'check':label,'ok':predicate(result),'result':result})
        except Exception as exc: checks.append({'check':label,'ok':False,'error':f'{type(exc).__name__}: {exc}'})
    check('mmo.beta.internal','A',lambda r:r['rcode']==0 and any(a['value']=='127.0.0.1' for a in r['answers']),'mmo A exact')
    check('_du-cap.beta.internal','TXT',lambda r:r['rcode']==0 and any('du-watch=1' in str(a['value']) for a in r['answers']),'capability TXT')
    check('_mmo._tcp.beta.internal','SRV',lambda r:r['rcode']==0 and any(isinstance(a['value'],dict) and a['value']['port']==443 and a['value']['target']=='mmo.beta.internal.' for a in r['answers']),'MMO SRV exact')
    check('example.com','A',lambda r:r['rcode']!=0 or not r['answers'],'recursion refused/not served')
    report={'schema':'du-watch/1','elapsed_ms':round((time.time()-started)*1000,2),'ok':all(c['ok'] for c in checks),'checks':checks};print(json.dumps(report,indent=2,sort_keys=True));return 0 if report['ok'] else 1
if __name__=='__main__': raise SystemExit(main())
