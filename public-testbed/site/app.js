const byId=id=>document.getElementById(id);

function node(tag,text,className){
  const element=document.createElement(tag);
  if(text!==undefined)element.textContent=String(text);
  if(className)element.className=className;
  return element;
}

function addRow(dl,label,value){
  dl.append(node('dt',label),node('dd',value));
}

function renderRooms(data){
  const root=byId('room-grid');
  root.replaceChildren();
  for(const room of data.rooms||[]){
    const article=node('article',undefined,'room-card');
    article.id=room.id;
    article.append(node('h3',room.name),node('p',room.purpose));
    root.append(article);
  }
}


function renderPaths(data){
  const root=byId('path-grid');
  root.replaceChildren();
  for(const pathState of data.paths||[]){
    const article=node('article',undefined,'path-card');
    article.dataset.status=pathState.status;
    const heading=node('h3',pathState.title);
    const state=node('span',`State: ${pathState.status}`,'state-tag');
    state.setAttribute('aria-label',`Path state: ${pathState.status}`);
    const dl=node('dl');
    addRow(dl,'Currentness',pathState.currentness);
    addRow(dl,'Progression',pathState.progression_position);
    addRow(dl,'Relation',pathState.relation);
    addRow(dl,'Evidence',pathState.evidence);
    addRow(dl,'Result',pathState.result);
    if(pathState.zero_result)addRow(dl,'Zero / negative result',pathState.zero_result);
    addRow(dl,'Provenance',pathState.provenance);
    addRow(dl,'Claim boundary',pathState.claim_boundary);
    addRow(dl,'Remainder',pathState.remainder);
    article.append(heading,state,dl);
    root.append(article);
  }

  const lineage=byId('lineage-list');
  lineage.replaceChildren();
  for(const edge of data.verified_lineage||[]){
    lineage.append(node('li',`${edge.from} → ${edge.to} · ${edge.relation} · ${edge.evidence}`));
  }
}


function renderPrinciples(data){
  const root=byId('principle-grid');
  root.replaceChildren();
  for(const principle of data.principles||[]){
    const article=node('article',undefined,'principle-card');
    article.append(
      node('h3',principle.name),
      node('p',principle.meaning),
      node('p',`Boundary: ${principle.boundary}`,'principle-boundary')
    );
    root.append(article);
  }
}

function renderAliases(data){
  const root=byId('alias-list');
  root.replaceChildren();
  for(const alias of data.aliases||[]){
    const dt=node('dt',alias.term);
    const dd=node('dd',`${alias.meaning} · ${alias.relation} · ${alias.claim_boundary}`);
    root.append(dt,dd);
  }
}

function renderExperiment(experiment){
  const card=byId('experiment-card');
  card.replaceChildren();
  const heading=node('h3',experiment.title);
  const state=node('span',experiment.status,'state-tag');
  state.setAttribute('aria-label',`Experiment status: ${experiment.status}`);
  const dl=node('dl');
  addRow(dl,'Currentness',experiment.currentness);
  addRow(dl,'Changed degree',experiment.changed_degree);
  addRow(dl,'Evidence',experiment.evidence);
  addRow(dl,'Result',experiment.result);
  addRow(dl,'Zero / negative result',experiment.zero_result);
  addRow(dl,'Claim boundary',experiment.claim_boundary);
  addRow(dl,'Provenance',experiment.provenance);
  const inv=node('div');
  inv.append(node('h4','Invariants'));
  const list=node('ul');
  for(const item of experiment.invariants||[])list.append(node('li',item));
  inv.append(list);
  card.append(heading,state,dl,inv);

  const remainder=byId('remainder-list');
  remainder.replaceChildren();
  for(const item of experiment.remainder||[])remainder.append(node('li',item));
}

async function loadJson(path){
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok)throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function main(){
  try{
    const [data,manifest]=await Promise.all([
      loadJson('./testbed.json'),
      loadJson('./projection-manifest.json')
    ]);
    renderRooms(data);
    renderPaths(data);
    renderPrinciples(data);
    renderAliases(data);
    renderExperiment(data.experiments?.[0]||{title:'No experiment',status:'preserved-unresolved',remainder:['No current experiment record.']});
    const remainder=byId('remainder-list');
    for(const relation of data.unresolved_relations||[]){
      remainder.append(node('li',`Unresolved relation: ${relation.from} → ${relation.to} · ${relation.relation} · ${relation.reason}`));
    }
    byId('source-revision').textContent=manifest.source_revision;
    byId('manifest-identity').textContent=manifest.projection_sha256;
    byId('projection-authority').textContent=data.authority;
    byId('projection-root').textContent=manifest.source_root;
    byId('status-line').textContent=`Experimental projection · source ${manifest.source_revision.slice(0,12)} · not canonical authority`;
  }catch(error){
    byId('experiment-card').replaceChildren(node('p',`Projection data unavailable: ${error.message}`));
    byId('source-revision').textContent='Unavailable';
    byId('manifest-identity').textContent='Unavailable';
  }
}

main();
