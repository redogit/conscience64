"""Runnable, authored examples: UTF-8 identity and variable layer composition."""
from coordinate_runtime import encode_utf8_exact, decode_utf8_exact
from float64_coordinate_builder import Float64CoordinateBuilder

text = 'Hello / مرحبا / 你好 / 🌍'
coordinates, metadata = encode_utf8_exact(text)
assert decode_utf8_exact(coordinates, metadata['utf8_bytes'], expected_sha256=metadata['sha256']) == text
print('Exact UTF-8 recovery: PASS')
registry = [dict(ns='demo', sym=s, name=s, kind='scalar', domain='research',
                 definition='Authored public example '+s, provenance='assistant') for s in ['input','output']]
builder = Float64CoordinateBuilder(registry)
state = builder.build_state({'demo::input':1}, [('demo::input','carries','demo::output',1)])
for count in [9,11]:
    stack = builder.stack_states([state]*count)
    print(f'{count} aligned layers: {stack["symbols"].shape}; repeated layers are not independent evidence')
