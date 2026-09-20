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
    renderExperiment(data.experiments?.[0]||{title:'No experiment',status:'preserved-unresolved',remainder:['No current experiment record.']});
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
