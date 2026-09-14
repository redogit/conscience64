"""Import an exported UI packet through TBCL and Orbit without promoting leads."""
from pathlib import Path
import argparse,base64,hashlib,importlib.util,json,sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'connection_next/extracted/orbit_lab_reflow_1_0/engine'))
from orbit_lab import OrbitLab
from search import allowed_url

def ingest(path,database):
    raw=Path(path).read_bytes()
    if len(raw)>2_000_000:raise ValueError('Packet exceeds bounded import size.')
    packet=json.loads(raw)
    if packet.get('schema')!='orbit-search-working/3':raise ValueError('Unrecognized working packet schema.')
    required={'subject','motivator','request','obligation','surface','context','observations','kept','unresolved'}
    if not required<=packet.keys():raise ValueError('Missing working-set fields.')
    if not isinstance(packet['kept'],list) or any(not isinstance(x,dict) or not allowed_url(x.get('url','')) for x in packet['kept']):raise ValueError('Invalid or excluded lead URL.')
    spec=importlib.util.spec_from_file_location('working_tbcl',ROOT/'connection_next/sources/tbcl.py')
    tbcl=importlib.util.module_from_spec(spec);sys.modules[spec.name]=tbcl;spec.loader.exec_module(tbcl)
    digest=hashlib.sha256(raw).hexdigest()
    records=[('meta',{'origin':str(Path(path).name),'scope':'retrieved candidates'}),('subject',{'title':packet['subject']}),('obligation',{'text':packet['obligation']}),('execution',{'status':'imported; not domain-verified'})]
    program=tbcl.Program(records,'','','',[tbcl.Artifact('working.json',digest,len(raw),raw)])
    transported=tbcl.parse_bytes(tbcl.render(program)).artifacts[0].payload
    if transported!=raw:raise ValueError('TBCL transport changed packet bytes.')
    lab=OrbitLab(database)
    try:
        oid=lab.add('Artifact','Search working packet',data={'source_sha256':digest,'payload_base64':base64.b64encode(transported).decode(),'relation':'CANDIDATE_ONLY','authority_transfer':False},provenance_class='CURRENT_CONVERSATION',provenance='import_working_packet.py',lifecycle='QUARANTINED')
        return {'object_id':oid,'source_sha256':digest,'status':lab.admission_status(oid)['status'],'exact_transport':True,'authority_transfer':False}
    finally:lab.close()

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('packet');ap.add_argument('--database',default='search_working.db');args=ap.parse_args();print(json.dumps(ingest(args.packet,args.database),indent=2))
