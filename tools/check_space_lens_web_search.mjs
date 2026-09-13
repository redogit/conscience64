#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const requested=[];
globalThis.fetch=async (url,options={})=>{
  const u=String(url);requested.push(u);
  let body,status=200;
  if(u.includes('wikipedia.org/w/api.php')) body={query:{search:[{title:'Orbit',snippet:'An <b>orbit</b> is a path.'}]}};
  else if(u.includes('api.openalex.org/works')) body={results:[{display_name:'Orbit research paper',publication_year:2025,id:'https://openalex.org/W1',authorships:[{author:{display_name:'A. Researcher'}}]}]};
  else if(u.includes('api.crossref.org/works')) body={message:{items:[{title:['Carrier transforms'],DOI:'10.1/example',URL:'https://doi.org/10.1/example',published:{'date-parts':[[2024]]},author:[{given:'B',family:'Writer'}]}]}};
  else if(u.includes('archive.org/advancedsearch.php')) body={response:{docs:[{identifier:'orbit_archive',title:'Orbit Archive',creator:'Archivist',year:2020,description:'Preserved orbit material.'}]}};
  else if(u.includes('api.github.com/search/repositories')) body={items:[{full_name:'example/orbit',description:'Orbit code',html_url:'https://github.com/example/orbit',stargazers_count:3}]};
  else {status=404;body={};}
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
};

const code=await readFile(resolve(root,'space-lens-web-search.js'));
await import(`data:text/javascript;base64,${code.toString('base64')}`);
const web=globalThis.SpaceLensWebSearch;
assert.equal(web.version,'1.0.0');
const out=await web.search('orbit');
assert.equal(out.errors.length,0);
assert.equal(out.total,5);
assert.deepEqual(new Set(out.results.map(r=>r.provider)),new Set(['Wikipedia','OpenAlex','Crossref','Internet Archive','GitHub']));
assert.match(out.results.find(r=>r.provider==='Wikipedia').snippet,/orbit is a path/i);
assert.match(out.results.find(r=>r.provider==='OpenAlex').snippet,/2025/);
assert.match(out.results.find(r=>r.provider==='Crossref').title,/Carrier transforms/);
assert.match(out.results.find(r=>r.provider==='Internet Archive').url,/archive\.org\/details\/orbit_archive/);
assert.match(out.results.find(r=>r.provider==='GitHub').url,/github\.com\/example\/orbit/);
assert.equal(requested.length,5);

// Provider failures are isolated rather than collapsing the whole federated search.
const originalFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>String(url).includes('openalex.org')?new Response('{}',{status:503,statusText:'Unavailable'}):originalFetch(url,options);
const partial=await web.search('orbit',{providers:['wikipedia','openalex','github']});
assert.equal(partial.results.length,2);
assert.equal(partial.errors.length,1);
assert.equal(partial.errors[0].provider,'OpenAlex');

// No provider outside the explicit selection is contacted.
requested.length=0;
await web.search('orbit',{providers:['wikipedia']});
assert.equal(requested.length,1);
assert.match(requested[0],/wikipedia/);

console.log('PASS Space Lens Web Search: five in-page providers, source selection, parsing, and isolated provider failure');
