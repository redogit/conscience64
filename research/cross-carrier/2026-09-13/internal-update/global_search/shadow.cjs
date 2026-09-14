/* Separate browser worker. Never attaches to an existing browser or OS desktop. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const catalog=require('./catalog.json');
function publicURL(value){const u=new URL(value),h=u.hostname.toLowerCase().replace(/\.$/,'');if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!h.includes('.')||h.includes(':')||/^\d+[.]/.test(h)||/\.(localhost|local|internal)$/.test(h)||catalog.policy.blocked_tlds.includes(h.split('.').pop())||h.split('.').includes('yandex')||catalog.policy.blocked_roots.some(r=>h===r||h.endsWith('.'+r)))throw Error('URL outside public HTTPS policy');return u.href;}
function point(a){if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<0||a.y<0||a.x>=1024||a.y>=768)throw Error('Point outside 1024 × 768 CSS-pixel viewport');return {x:a.x,y:a.y};}
async function run(task){
 if(!Array.isArray(task.actions)||task.actions.length>50)throw Error('Expected at most 50 actions');
 const mode=task.url?'public-read':'internal';if(task.url)publicURL(task.url);
 const opts={headless:true};const proxyURL=process.env.HTTPS_PROXY||process.env.https_proxy;if(proxyURL){const proxy=new URL(proxyURL);opts.proxy={server:proxy.protocol+'//'+proxy.host,...(proxy.username?{username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)}:{})};}if(process.env.ORBIT_PORTABLE_CHROMIUM==='1'){const c=require('@sparticuz/chromium').default;opts.executablePath=await c.executablePath();opts.args=c.args.filter(a=>!a.includes('disable-web-security')&&!a.includes('disable-site-isolation'));}
 const browser=await chromium.launch(opts),log=[];
 try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,javaScriptEnabled:mode==='internal',acceptDownloads:false,serviceWorkers:'block',permissions:[]});
 await context.route('**/*',async route=>{const r=route.request();try{if(mode==='internal')return route.abort();publicURL(r.url());if(r.method()!=='GET'||!['document','stylesheet','image','font'].includes(r.resourceType()))return route.abort();return route.continue();}catch{return route.abort();}});
 const page=await context.newPage();page.setDefaultTimeout(5000);page.on('dialog',d=>d.dismiss());context.on('page',p=>{if(p!==page)p.close();});
 if(mode==='internal')await page.setContent(fs.readFileSync(__dirname+'/shadow.html','utf8'));else await page.goto(task.url,{waitUntil:'domcontentloaded',timeout:20000});
 for(const a of task.actions){
 const record={action:a.type,at:new Date().toISOString(),mode};
 if(a.type==='observe'){record.title=await page.title();record.text=(await page.locator('body').innerText()).slice(0,20000);}
 else if(a.type==='move'){const p=point(a);await page.mouse.move(p.x,p.y,{steps:10});Object.assign(record,p);}
 else if(a.type==='click'||a.type==='touch'){
 if(mode!=='internal')throw Error('Activation on external pages requires a separate, explicitly scoped adapter');
 const p=point(a);if(a.target!=='target')throw Error('Expected internal target identity');
 const hit=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p);if(hit!==a.target)throw Error('Point does not hit the expected target');
 if(a.type==='click')await page.mouse.click(p.x,p.y);else await page.touchscreen.tap(p.x,p.y);
 record.x=p.x;record.y=p.y;record.receipt=await page.evaluate(()=>window.receipts.at(-1));if(!record.receipt||record.receipt.x!==p.x||record.receipt.y!==p.y)throw Error('Coordinate receipt mismatch');
 }else if(a.type==='scroll'){if(!Number.isFinite(a.dy)||Math.abs(a.dy)>2000)throw Error('Invalid scroll');await page.mouse.wheel(0,a.dy);record.dy=a.dy;}
 else throw Error('Unknown action');log.push(record);
 }
 return {schema:'orbit-shadow/1',mode,visible_user_page_touched:false,authenticated_session_used:false,authority_transfer:false,corroborated:false,log};
 }finally{await browser.close();}
}
module.exports={run,point,publicURL};
if(require.main===module){let raw='';process.stdin.on('data',c=>raw+=c);process.stdin.on('end',async()=>{try{if(raw.length>100000)throw Error('Task too large');console.log(JSON.stringify(await run(JSON.parse(raw)),null,2));}catch(e){console.error(e.message);process.exitCode=1;}});}
