from pathlib import Path
import json,re
root=Path(__file__).resolve().parent;core=(root/'Corefile').read_text();zone=(root/'db.beta.internal').read_text();compose=(root/'compose.yaml').read_text();protocols=json.loads((root.parent.parent/'play/mmo-world/protocols.json').read_text())
for forbidden in ['forward ','proxy ','grpc://','quic://','https://','tls://']: assert forbidden not in core.lower(),forbidden
assert 'beta.internal:1053' in core
assert '127.0.0.1:1053:1053/udp' in compose and '127.0.0.1:1053:1053/tcp' in compose and '127.0.0.1:9153:9153/tcp' in compose
assert re.search(r'_du-cap\s+IN TXT .*du-watch=1',zone);assert re.search(r'_mmo\._tcp\s+IN SRV 10 100 443 mmo\.beta\.internal\.',zone)
assert {p['id'] for p in protocols['protocols']}=={'DU-SD/1','DU-CAP/1','DU-WATCH/1','DU-BT/1'}
print('PASS internal DNS policy: authoritative beta zone, loopback binding, metrics, no recursive/custom transport config.')
