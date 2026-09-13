'use strict';
const byId = id => document.getElementById(id);
let verified = null, generation = 0;
function invalidate(message = 'Input changed. Verify again before saving.') {
  generation++; verified = null; byId('savePacket').disabled = byId('saveText').disabled = true;
  byId('summary').textContent = byId('recovered').textContent = ''; byId('status').textContent = message;
}
function accept(packet) {
  const result = CoordinateCodec.decode(packet);
  verified = {packet, ...result};
  byId('recovered').textContent = result.text;
  byId('summary').textContent = `${result.raw.length} UTF-8 bytes\n${packet.coordinates.length} ordered coordinates\nSHA-256 ${result.sha256}`;
  byId('status').textContent = 'PASS — exact bytes reconstructed and checked.';
  byId('savePacket').disabled = byId('saveText').disabled = false;
}
function perform(action) { invalidate('Verifying…'); try { action(); } catch (error) { invalidate('FAIL — ' + error.message); } }
byId('encode').addEventListener('click', () => perform(() => { const packet = CoordinateCodec.encode(byId('text').value); accept(packet); byId('packet').value = JSON.stringify(packet, null, 2); }));
byId('decode').addEventListener('click', () => perform(() => { if (byId('packet').value.length > 12 * 1024 * 1024) throw Error('Envelope exceeds 12 MiB text limit.'); accept(JSON.parse(byId('packet').value)); }));
for (const id of ['text', 'packet']) byId(id).addEventListener('input', () => invalidate());
byId('clear').addEventListener('click', () => { byId('text').value = byId('packet').value = byId('load').value = ''; invalidate('Cleared. No text is saved by this application.'); byId('text').focus(); });
byId('load').addEventListener('change', async () => {
  invalidate('Reading local envelope…');
  const ticket = generation, file = byId('load').files[0]; if (!file) { invalidate(); return; }
  try { if (file.size > 12 * 1024 * 1024) throw Error('Envelope exceeds 12 MiB limit.'); const text = await file.text(); if (ticket !== generation) return; byId('packet').value = text; perform(() => accept(JSON.parse(text))); }
  catch (error) { if (ticket === generation) invalidate('FAIL — ' + error.message); }
});
function save(bytes, name, type) { const url = URL.createObjectURL(new Blob([bytes], {type})); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
byId('savePacket').addEventListener('click', () => { if (verified) save(JSON.stringify(verified.packet, null, 2), 'coordinates.json', 'application/json'); });
byId('saveText').addEventListener('click', () => { if (verified) save(verified.raw, 'recovered.txt', 'application/octet-stream'); });
