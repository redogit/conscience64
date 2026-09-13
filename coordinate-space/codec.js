/* Public browser adapter for ExactUTF8-F64. No storage, analytics or uploads. */
'use strict';
(function (root) {
  const SCHEMA = 'exact-utf8-f64/v1', MAX_BYTES = 1024 * 1024;
  const keys = ['coordinates', 'pad_bytes', 'schema', 'sha256', 'utf8_bytes'];
  function integer(n, max, label) {
    if (!Number.isSafeInteger(n) || n < 0 || Object.is(n, -0) || n > max) throw Error(label + ' must be a nonnegative exact integer within its bound.');
    return n;
  }
  function digest(raw) { return bytesToHex(sha256Bytes(raw)); }
  function encode(text) {
    if (typeof text !== 'string') throw Error('Input must be text.');
    // TextEncoder replaces lone UTF-16 surrogates; reject instead of silently changing input.
    for (const ch of text) { const cp = ch.codePointAt(0); if (cp >= 0xD800 && cp <= 0xDFFF) throw Error('Unpaired Unicode surrogate.'); }
    if (text.length > MAX_BYTES) throw Error('Public browser limit is 1 MiB of UTF-8.');
    const raw = new TextEncoder().encode(text);
    if (raw.length > MAX_BYTES) throw Error('Public browser limit is 1 MiB of UTF-8.');
    const coordinates = [];
    for (let i = 0; i < raw.length; i += 6) { let n = 0; for (let j = 0; j < 6; j++) n = n * 256 + (raw[i+j] ?? 0); coordinates.push(n); }
    return {schema: SCHEMA, utf8_bytes: raw.length, pad_bytes: (6 - raw.length % 6) % 6, sha256: digest(raw), coordinates};
  }
  function decode(packet) {
    if (!packet || typeof packet !== 'object' || Array.isArray(packet) || Object.keys(packet).sort().join('|') !== keys.join('|') || packet.schema !== SCHEMA) throw Error('Unknown or malformed envelope schema.');
    const n = integer(packet.utf8_bytes, MAX_BYTES, 'Byte length');
    integer(packet.pad_bytes, 5, 'Padding');
    if (!Array.isArray(packet.coordinates) || packet.coordinates.length !== Math.ceil(n / 6) || packet.pad_bytes !== (6 - n % 6) % 6) throw Error('Coordinate count or padding mismatch.');
    if (typeof packet.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(packet.sha256)) throw Error('A lowercase SHA-256 digest is required.');
    const raw = new Uint8Array(n);
    for (let i = 0; i < packet.coordinates.length; i++) {
      let v = BigInt(integer(packet.coordinates[i], 2**48 - 1, 'Coordinate'));
      for (let j = 5; j >= 0; j--) { const b = Number(v & 255n), pos = i * 6 + j; v >>= 8n; if (pos < n) raw[pos] = b; else if (b !== 0) throw Error('Nonzero padding.'); }
    }
    const sha256 = digest(raw);
    if (sha256 !== packet.sha256) throw Error('SHA-256 mismatch.');
    const text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(raw);
    return {text, raw, sha256};
  }
  root.CoordinateCodec = Object.freeze({encode, decode, schema: SCHEMA, maxBytes: MAX_BYTES});
})(globalThis);
