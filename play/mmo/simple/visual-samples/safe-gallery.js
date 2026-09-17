const SOURCES=[
{title:'Night City Sphere',license:'CC0',file:'NightCitySphere (raw SD1.5).jpg',page:'https://commons.wikimedia.org/wiki/File:NightCitySphere_(raw_SD1.5).jpg'},
{title:'Dotonbori neon at night',license:'CC0',file:'Dotombori neon sign at night.JPG',page:'https://commons.wikimedia.org/wiki/File:Dotombori_neon_sign_at_night.JPG'},
{title:'Mountain demon face mask',license:'CC0',file:"Mask in the Shape of a Mountain Demon's Face MET LC-36 25 263-006.jpg",page:"https://commons.wikimedia.org/wiki/File:Mask_in_the_Shape_of_a_Mountain_Demon%27s_Face_MET_LC-36_25_263-006.jpg"},
{title:'Tsuina demon mask',license:'CC0',file:'Demon Mask (Tsuina-men), used in Setsubun holiday, 15th-16 century, Japan, wood with traces of color - Art Institute of Chicago - DSC00191.JPG',page:'https://commons.wikimedia.org/wiki/File:Demon_Mask_(Tsuina-men),_used_in_Setsubun_holiday,_15th-16_century,_Japan,_wood_with_traces_of_color_-_Art_Institute_of_Chicago_-_DSC00191.JPG'}
];
const ROLE_GROUPS={
'Work & learned trades':['Data Specialist','Reverse Engineer','Coder','Hacker','Cracker','Slacker','Paralegal','Early Childhood Educator','Document Accessibility Specialist','Section 508 Specialist','Salesforce Administrator','CPACC Accessibility Practitioner'],
'Research & reasoning':['Researcher','Analyst','Observer','Mapper','Seeker','Reverser','Experimenter','Tester','Verifier','Reviewer','Archivist','Librarian'],
'Building & systems':['Operator','Builder','Fitter','Optimizer','Repairer','Toolmaker','Compiler Builder','Language Designer','Systems Engineer','Data Curator','Accessibility Tester'],
'World & play':['Explorer','Game Designer','World Builder','Renderer','Forge Keeper','Companion','Agent','Storyteller','Musician','Garden Keeper']
};
const enc=s=>encodeURIComponent(s).replace(/%2F/g,'/');
function fileUrl(file){return `https://commons.wikimedia.org/wiki/Special:FilePath/${enc(file)}`}
function renderSources(root){root.innerHTML=SOURCES.map((s,i)=>`<figure class="morph"><img src="${fileUrl(s.file)}" alt="Public-domain reference: ${s.title}" loading="lazy"><figcaption><span class="form">Form ${i+1}: ${s.title}</span><br><span class="source">${s.license} · <a href="${s.page}" rel="noopener">source and license</a></span></figcaption></figure>`).join('')}
function renderRoles(root){root.innerHTML=Object.entries(ROLE_GROUPS).map(([group,roles])=>`<section><h2>${group}</h2><div class="roles">${roles.map(r=>`<span class="role"><strong>${r}</strong></span>`).join('')}</div></section>`).join('')}
function nav(page){return Array.from({length:6},(_,i)=>`<a class="${page===i+1?'active':''}" href="page-${i+1}.html">${i+1}</a>`).join('')}
document.addEventListener('DOMContentLoaded',()=>{const page=Number(document.body.dataset.page||0);const n=document.querySelector('[data-route]');if(n)n.innerHTML=`<a href="index.html">Gallery</a>${nav(page)}`;const s=document.querySelector('[data-sources]');if(s)renderSources(s);const r=document.querySelector('[data-roles]');if(r)renderRoles(r);});