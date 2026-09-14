
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.dirname(fileURLToPath(import.meta.url));
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".md":"text/markdown; charset=utf-8"};
const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,"http://localhost"),rel=decodeURIComponent(u.pathname==="/"?"index.html":u.pathname.slice(1));
    const p=path.resolve(root,rel);
    if(!p.startsWith(root))throw new Error("blocked");
    const body=await fs.readFile(p);
    res.writeHead(200,{"content-type":types[path.extname(p)]||"application/octet-stream","cache-control":"no-store"});
    res.end(body);
  }catch{res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");}
});
const port=Number(process.env.PORT||4173);
server.listen(port,"127.0.0.1",()=>console.log(`Open http://127.0.0.1:${port}`));
