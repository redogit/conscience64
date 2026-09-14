"""Local search interface; serves only the UI and fixed search endpoints."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,parse_qs
from pathlib import Path
import json, subprocess, threading
WORKER_LOCK=threading.Lock()
from search import search
ROOT=Path(__file__).resolve().parent
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_POST(self):
        if self.path!='/api/workspace': self.send_error(404);return
        if self.headers.get('Origin')!='http://127.0.0.1:8765' or self.headers.get('Host')!='127.0.0.1:8765': self.send_error(403);return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<=0 or size>10000: raise ValueError('Invalid request size')
            request=json.loads(self.rfile.read(size))
            if request.get('mode')=='internal': task=json.loads((ROOT/'shadow-task.json').read_text())
            elif request.get('mode')=='public-read' and isinstance(request.get('url'),str):
                if any(not isinstance(request.get(k),str) or not request[k].strip() or len(request[k])>1000 for k in ['goal','boundary','context','outcome']): raise ValueError('Answer the goal, context, outcome, and preservation questions first')
                task={'url':request['url'],'actions':[{'type':'observe'}]}
            else: raise ValueError('Unknown workspace mode')
            if not WORKER_LOCK.acquire(blocking=False): raise ValueError('Workspace busy; try again after the current task')
            try:
                result=subprocess.run(['node',str(ROOT/'shadow.cjs')],input=json.dumps(task),capture_output=True,text=True,timeout=45,cwd=ROOT)
            finally: WORKER_LOCK.release()
            if result.returncode: raise ValueError(result.stderr.strip()[:1000] or 'Browser worker failed')
            payload=json.loads(result.stdout);payload['request_context']={'goal':request.get('goal','Internal coordinate verification'),'boundary':request.get('boundary','Isolated internal page'),'context':request.get('context','Internal fixture'),'outcome':request.get('outcome','Verified XY receipts'),'role':'user-provided task context; does not grant additional permissions'};status=200
        except (ValueError,subprocess.TimeoutExpired,OSError) as exc: payload={'error':str(exc)};status=400
        raw=json.dumps(payload).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        path=urlsplit(self.path).path
        try:
            if path in ['/','/index.html']:
                raw=(ROOT/'index.html').read_bytes();kind='text/html; charset=utf-8'
            elif path=='/api/search':
                q=parse_qs(urlsplit(self.path).query)
                result=search(q.get('q',[''])[0],q.get('country',[''])[0],q.get('category',['all'])[0])
                raw=json.dumps(result,ensure_ascii=False).encode();kind='application/json; charset=utf-8'
            else:self.send_error(404);return
            self.send_response(200);self.send_header('Content-Type',kind);self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw)
        except ValueError as exc:
            self.send_response(400);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps({'error':str(exc)}).encode())
        except (BrokenPipeError,ConnectionResetError):pass
if __name__=='__main__':
    print('Orbit Search: http://127.0.0.1:8765 — Ctrl+C to stop',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
