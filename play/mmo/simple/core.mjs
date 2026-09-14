export const SCHEMA = 'conscience64.mmo.simple/v1';

export const BOUNDARIES = Object.freeze({
  authority: 'LOCAL != AUTHORITY',
  evidence: 'REFERENCE != EVIDENCE'
});

export const ACTIVITIES = Object.freeze([
  {id:'monster-mood',kind:'play',title:'Monster Mood',place:'Arcade',prompt:'A monster looks confused. Pick the calmest useful response.',choices:['Give it space and ask what it needs','Shout louder','Block the exit'],answer:0,reward:{xp:8,joy:6}},
  {id:'redline',kind:'move',title:'Redline',place:'Street',prompt:'Cross the marked practice lane when you are ready. No timer.',choices:['Go when ready','Keep waiting'],answer:0,reward:{xp:8,joy:4}},
  {id:'sidewalk-slalom',kind:'move',title:'Sidewalk Slalom',place:'Park',prompt:'Follow the marked accessible route around the puddles.',choices:['Left · right · left','Right · right · right'],answer:0,reward:{xp:8,joy:5}},
  {id:'parcel-relay',kind:'move',title:'Parcel Relay',place:'Maker Garage',prompt:'Move the handcart along the posted route without blocking the aisle.',choices:['Forward · left · forward','Back · back · stop'],answer:0,reward:{xp:8,joy:5}},
  {id:'cipher-snap',kind:'puzzle',title:'Cipher Snap',place:'Arcade',prompt:'Complete the pattern: 2 · 4 · 8 · ?',choices:['16','12','10'],answer:0,reward:{xp:10,joy:4}},
  {id:'bus-transfer',kind:'puzzle',title:'Bus Transfer',place:'Bus Stop',prompt:'The fictional map says Route 7 reaches Maker Quarter.',choices:['7','4','11'],answer:0,reward:{xp:8,joy:4}},
  {id:'observatory-label',kind:'learn',title:'Observatory Label Check',place:'Roof',prompt:'Which label preserves the astronomy boundary?',choices:['Game reconstruction — not telescope data','Direct rooftop photo of a black hole','Proof of a new discovery'],answer:0,reward:{xp:8,joy:4}},
  {id:'market-closing',kind:'help',title:'Market Closing Shift',place:'Market',prompt:'Rain reaches a cardboard display. What is the useful first move?',choices:['Move it under cover','Leave it in the walkway','Push it into the street'],answer:0,reward:{xp:8,joy:6}},
  {id:'workshop-sort',kind:'help',title:'Workshop Sort',place:'Maker Garage',prompt:'A hand tool is in the walking path.',choices:['Put it in marked storage','Hide it','Leave it'],answer:0,reward:{xp:8,joy:5}},
  {id:'repair-bench',kind:'make',title:'Repair Bench Remix',place:'Maker Garage',prompt:'Combine two harmless spare parts into something useful.',choices:['Make and name a small useful object','Throw everything away'],answer:0,reward:{xp:10,joy:7}},
  {id:'make-something',kind:'make',title:'Make Something',place:'Community Room',prompt:'Create something small that makes waiting easier.',choices:['Make and name it','Do nothing'],answer:0,reward:{xp:10,joy:7}},
  {id:'fuzzball-question',kind:'learn',title:'Fuzzball: Question or Claim?',place:'Service Road',prompt:'An unexplained pattern appears. What do we know?',choices:['It is an open question that needs evidence','It proves one cause','It solves a physics problem'],answer:0,reward:{xp:8,joy:5,discoveries:1}}
]);

export const PLACES = Object.freeze([
  'Mercer & Red Street','Corner Market','Maker Garage','City Park','Bus Stop','Roof Observatory','Community Room','Unmarked Service Road'
]);

export function freshPlayer() {
  return {schema:SCHEMA,xp:0,joy:50,discoveries:0,place:PLACES[0],activityIndex:0,creations:[],chronicle:[]};
}

export function clampPlayer(input={}) {
  const p=freshPlayer();
  p.xp=Math.max(0,Math.min(1_000_000,Number.isFinite(input.xp)?Math.trunc(input.xp):0));
  p.joy=Math.max(0,Math.min(100,Number.isFinite(input.joy)?Math.trunc(input.joy):50));
  p.discoveries=Math.max(0,Math.min(100_000,Number.isFinite(input.discoveries)?Math.trunc(input.discoveries):0));
  p.place=PLACES.includes(input.place)?input.place:PLACES[0];
  p.activityIndex=Number.isInteger(input.activityIndex)?((input.activityIndex%ACTIVITIES.length)+ACTIVITIES.length)%ACTIVITIES.length:0;
  p.creations=Array.isArray(input.creations)?input.creations.filter(x=>typeof x==='string').map(x=>x.slice(0,120)).slice(-12):[];
  p.chronicle=Array.isArray(input.chronicle)?input.chronicle.filter(x=>typeof x==='string').map(x=>x.slice(0,240)).slice(-20):[];
  return p;
}

export function currentActivity(player){return ACTIVITIES[clampPlayer(player).activityIndex];}

export function answerActivity(player,choiceIndex){
  const p=clampPlayer(player); const a=ACTIVITIES[p.activityIndex]; const ok=choiceIndex===a.answer;
  if(ok){p.xp+=a.reward.xp||0;p.joy=Math.min(100,p.joy+(a.reward.joy||0));p.discoveries+=a.reward.discoveries||0;p.chronicle.push(`Completed ${a.title}.`);}
  else {p.joy=Math.min(100,p.joy+1);p.chronicle.push(`Tried ${a.title}. Nothing was lost.`);}
  p.activityIndex=(p.activityIndex+1)%ACTIVITIES.length;
  return {player:p,ok,activity:a};
}

export function goSomewhere(player,index){
  const p=clampPlayer(player); const i=((index%PLACES.length)+PLACES.length)%PLACES.length;
  p.place=PLACES[i];p.joy=Math.min(100,p.joy+2);p.chronicle.push(`Went to ${p.place}.`);return p;
}

export function addCreation(player,name){
  const p=clampPlayer(player); const clean=String(name||'').trim().slice(0,120); if(!clean)return p;
  p.creations.push(clean);p.creations=p.creations.slice(-12);p.xp+=5;p.joy=Math.min(100,p.joy+5);p.chronicle.push(`Made ${clean}.`);return p;
}

export function serialize(player){return JSON.stringify(clampPlayer(player));}
export function parse(text){const raw=JSON.parse(text);if(raw?.schema!==SCHEMA)throw new Error('wrong save schema');return clampPlayer(raw);}
