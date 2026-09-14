import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {recordsFromRepository,CORPUS_BOUNDARIES} from './semantic-corpus.mjs';
import {massSemanticCrossReferenceMap} from './semantic-crossref.mjs';
import {semanticRoute,crossReferenceSubgraph,crossProjectBridgeCandidates,ROUTING_BOUNDARIES} from './semantic-routing.mjs';

const dir=await mkdtemp(path.join(tmpdir(),'c64-semantic-corpus-'));
try{
  await mkdir(path.join(dir,'docs'),{recursive:true});
  await mkdir(path.join(dir,'node_modules'),{recursive:true});
  await writeFile(path.join(dir,'README.md'),'# Alpha Knowledge Router\n\nMaps evidence and provenance. See [Beta](docs/beta.md).\n');
  await writeFile(path.join(dir,'docs','beta.md'),'# Beta Evidence Bridge\n\nSemantic knowledge bridge with provenance and bounded evidence routing.\n');
  await writeFile(path.join(dir,'docs','gamma.md'),'# Gamma Retrieval Map\n\nKnowledge retrieval and cross reference navigation over semantic records.\n');
  await writeFile(path.join(dir,'node_modules','skip.md'),'# Must not be indexed\n');
  await writeFile(path.join(dir,'large.txt'),'x'.repeat(5000));
  await writeFile(path.join(dir,'bad.txt'),Buffer.from([0xff,0xfe,0xfd]));

  const corpus=await recordsFromRepository(dir,{maxFileBytes:1000,maxTextChars:500,maxFiles:100});
  assert.equal(corpus.records.length,3);
  assert.ok(CORPUS_BOUNDARIES.includes('CORPUS_RECORD != EVIDENCE'));
  assert.equal(corpus.stats.skippedLarge,1);
  assert.equal(corpus.stats.skippedDecode,1);
  assert.ok(!corpus.records.some(r=>r.provenance.path.includes('node_modules')));
  const alpha=corpus.records.find(r=>r.id==='file:README.md');
  assert.ok(alpha);
  assert.ok(alpha.relations.some(r=>r.target==='file:docs/beta.md'&&r.relation==='LINKS_TO'));
  assert.match(alpha.provenance.sha256,/^[0-9a-f]{64}$/);

  const second=await recordsFromRepository(dir,{maxFileBytes:1000,maxTextChars:500,maxFiles:100});
  assert.equal(JSON.stringify(corpus),JSON.stringify(second));

  const graph=massSemanticCrossReferenceMap(corpus.records,{threshold:.08,maxEdgesPerNode:8});
  const route=semanticRoute(graph,'file:README.md','file:docs/beta.md',{maxHops:4});
  assert.equal(route.found,true);
  assert.equal(route.hopCount,1);
  assert.ok(route.boundaries.includes('SEMANTIC_PATH != PROOF_CHAIN'));
  const subgraph=crossReferenceSubgraph(graph,['file:README.md'],{depth:2,maxNodes:10,minScore:.05});
  assert.ok(subgraph.nodes.some(n=>n.id==='file:docs/beta.md'));
  const bridges=crossProjectBridgeCandidates(graph,{limit:20,minScore:.05});
  assert.ok(bridges.some(b=>new Set([b.sourceProject,b.targetProject]).has('root')&&new Set([b.sourceProject,b.targetProject]).has('docs')));
  assert.ok(ROUTING_BOUNDARIES.includes('BRIDGE_CANDIDATE != APPLICABILITY'));

  const repo=await recordsFromRepository('.',{maxFiles:5000,maxFileBytes:256000,maxTextChars:2500});
  assert.ok(repo.records.length>50,`expected >50 repository records, got ${repo.records.length}`);
  assert.ok(repo.records.some(r=>r.id==='file:tools/SEMANTIC_CROSS_REFERENCE_MAP.md'));
  assert.ok(!repo.records.some(r=>r.provenance.path.includes('node_modules/')));
  const repoGraph=massSemanticCrossReferenceMap(repo.records,{threshold:.3,maxEdgesPerNode:6,maxTokenDfRatio:.12});
  assert.equal(repoGraph.nodes.length,repo.records.length);
  assert.ok(repoGraph.edges.length>0);
  assert.ok(repoGraph.edges.filter(e=>e.epistemicStatus==='derived-relation').every(e=>e.boundaries.includes('RELATED != SUPPORTS')));
  console.log(`PASS semantic corpus routing: ${repo.records.length} repository records, ${repoGraph.edges.length} bounded edges, explicit links + routes + subgraphs + bridges`);
} finally {
  await rm(dir,{recursive:true,force:true});
}
