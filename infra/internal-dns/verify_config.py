from pathlib import Path
import json,re

root=Path(__file__).resolve().parent
core=(root/'Corefile').read_text()
zone=(root/'db.beta.internal').read_text()
compose=(root/'compose.yaml').read_text()
protocols=json.loads((root.parent.parent/'play/mmo-world/protocols.json').read_text())

for forbidden in ['forward ','proxy ','grpc://','quic://','https://','tls://']:
    assert forbidden not in core.lower(), forbidden
assert 'beta.internal:1053' in core
assert '127.0.0.1:1053:1053/udp' in compose and '127.0.0.1:1053:1053/tcp' in compose and '127.0.0.1:9153:9153/tcp' in compose
assert re.search(r'_du-cap\s+IN TXT .*du-watch=1',zone)
assert re.search(r'_mmo\._tcp\s+IN SRV 10 100 443 mmo\.beta\.internal\.',zone)

assert protocols['schema']=='conscience64/mmo-protocols/v1'
assert protocols['version']=='1.0.0-beta'
by_id={p['id']:p for p in protocols['protocols']}
assert len(by_id)==len(protocols['protocols'])
assert set(by_id)=={'DU-SD/1','DU-CAP/1','DU-WATCH/1','DU-BT/1'}

sd=by_id['DU-SD/1']
assert sd['status']=='CONFIGURED_INTERNAL_ONLY'
assert 'DNS SRV' in sd['carrier'] and 'TXT metadata' in sd['carrier']
assert 'No recursive resolver' in sd['boundary'] and 'no public listener' in sd['boundary']

cap=by_id['DU-CAP/1']
assert cap['status']=='BETA'
assert 'DNS TXT' in cap['carrier']
assert 'not authorization' in cap['boundary'] and 'identity' in cap['boundary'] and 'health' in cap['boundary']

watch=by_id['DU-WATCH/1']
assert watch['status']=='BETA'
assert 'local metrics/probe output' in watch['carrier']
assert 'does not prove the game server itself is healthy' in watch['boundary']

bt=by_id['DU-BT/1']
assert bt['status']=='CLIENT_CONNECTION_BETA'
assert re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',bt['serviceUuid'],re.I)
assert 'No silent scanning' in bt['boundary'] and 'user must initiate' in bt['boundary']

print('PASS internal DNS policy: authoritative beta zone, loopback binding, metrics, exact protocol registry boundaries, no recursive/custom transport config.')
