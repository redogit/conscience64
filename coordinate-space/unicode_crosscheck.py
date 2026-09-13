"""Independent Python/NumPy replay of the bounded Unicode scalar sweep."""
import hashlib
import json
from coordinate_runtime import encode_utf8_exact, decode_utf8_exact

def run():
    digest=hashlib.sha256(); count=0; byte_count=0; batches=0; chars=[]
    def verify(text):
        nonlocal byte_count,batches
        raw=text.encode('utf8'); values,metadata=encode_utf8_exact(text)
        if decode_utf8_exact(values,len(raw),expected_sha256=metadata['sha256']) != text:
            raise AssertionError('Unicode round-trip mismatch')
        digest.update(raw);byte_count+=len(raw);batches+=1
    for cp in range(0x110000):
        if 0xD800 <= cp <= 0xDFFF: continue
        chars.append(chr(cp));count+=1
        if len(chars)==8192: verify(''.join(chars));chars=[]
    if chars: verify(''.join(chars))
    expected='e0a7693f7362e88827c15e772e55b3490bd983f90711df7f3ef36c2b1ef6847e'
    if count != 1112064 or byte_count != 4382592 or digest.hexdigest() != expected:
        raise AssertionError('Scalar enumeration or transcript digest mismatch')
    return dict(status='PASS',unicode_scalar_values=count,utf8_bytes=byte_count,batches=batches,
                concatenated_utf8_sha256=digest.hexdigest(),
                boundary='Complete scalar range in ordered bounded batches, not all possible Unicode strings or cultural representations.')

if __name__=='__main__': print(json.dumps(run(),indent=2))
