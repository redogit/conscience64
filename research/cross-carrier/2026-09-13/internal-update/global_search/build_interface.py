import json
from pathlib import Path
root=Path(__file__).resolve().parent
catalog=json.loads((root/'catalog.json').read_text())
encoded=json.dumps(catalog,ensure_ascii=False).replace('<','\\u003c')
(root/'index.html').write_text((root/'interface.html').read_text().replace('__CATALOG__',encoded).replace('__SPACE__',(root/'space.js').read_text()))
