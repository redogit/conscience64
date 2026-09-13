/* Byte-preserving original UTF-8 intake. Never use textarea.value or Blob.text
 * as the authoritative file source. The v1 coordinate codec stays unchanged. */
'use strict';
(function(root) {
  function fromBytes(bytes) {
    if (!(bytes instanceof Uint8Array)) throw Error('E_SOURCE_BYTES: Uint8Array required');
    if (bytes.byteLength > CoordinateCodec.maxBytes) throw Error('E_SOURCE_LIMIT: 1 MiB UTF-8');
    const raw = new Uint8Array(bytes);
    const text = new TextDecoder('utf-8', {fatal:true, ignoreBOM:true}).decode(raw);
    const packet = CoordinateCodec.encode(text), recovered = CoordinateCodec.decode(packet);
    if (raw.length !== recovered.raw.length || raw.some((b,i) => b !== recovered.raw[i]))
      throw Error('E_SOURCE_ROUNDTRIP: original bytes differ');
    return packet;
  }
  async function read(file) {
    if (!file || typeof file.arrayBuffer !== 'function' || !Number.isSafeInteger(file.size) || file.size < 0)
      throw Error('E_SOURCE_FILE: file bytes and exact size required');
    if (file.size > CoordinateCodec.maxBytes) throw Error('E_SOURCE_LIMIT: 1 MiB UTF-8');
    const buffer = await file.arrayBuffer();
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== file.size)
      throw Error('E_SOURCE_LENGTH: file byte count changed');
    return fromBytes(new Uint8Array(buffer));
  }
  root.CoordinateSourceFile = Object.freeze({fromBytes,read});
})(globalThis);
