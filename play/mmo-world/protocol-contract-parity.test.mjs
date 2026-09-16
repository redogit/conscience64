import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PROTOCOL_POLICY, renderProtocolsContract, protocolById } from './protocol-policy.mjs';

const raw = await readFile(new URL('./protocols.json', import.meta.url), 'utf8');
const contract = JSON.parse(raw);

assert.deepEqual(contract, PROTOCOL_POLICY);
assert.equal(raw, renderProtocolsContract(), 'protocols.json must be generated exactly from protocol-policy.mjs');
assert.deepEqual(PROTOCOL_POLICY.protocols.map(p => p.id), ['DU-SD/1','DU-CAP/1','DU-WATCH/1','DU-BT/1']);
assert.equal(new Set(PROTOCOL_POLICY.protocols.map(p => p.id)).size, PROTOCOL_POLICY.protocols.length, 'protocol IDs must be unique');
for (const protocol of PROTOCOL_POLICY.protocols) {
  for (const field of ['id','purpose','carrier','status','boundary']) assert.equal(typeof protocol[field], 'string', `${protocol.id}.${field} must be text`);
  assert.ok(protocol.boundary.length > 20, `${protocol.id} boundary must remain explicit`);
}
const bt = protocolById('DU-BT/1');
assert.match(bt.serviceUuid, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
assert.match(bt.boundary, /No silent scanning/i);
assert.match(bt.boundary, /user must initiate/i);
assert.match(protocolById('DU-SD/1').boundary, /No recursive resolver/i);
assert.match(protocolById('DU-CAP/1').boundary, /not authorization/i);
assert.match(protocolById('DU-WATCH/1').boundary, /does not prove the game server itself is healthy/i);

console.log('PASS MMO protocol contract parity: exact frozen registry, unique IDs, explicit boundaries, and pinned Bluetooth service identity.');
