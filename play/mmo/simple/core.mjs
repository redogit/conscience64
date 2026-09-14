export const SCHEMA = 'conscience64.mmo.simple/v1';

export const BOUNDARIES = Object.freeze({
  authority: 'LOCAL != AUTHORITY',
  evidence: 'REFERENCE != EVIDENCE'
});

export const PLACES = Object.freeze([
  'Mercer & Red Street','Corner Market','Maker Garage','City Park',
  'Bus Stop','Roof Observatory','Red Street Arcade','Unmarked Service Road'
]);

export const CONTEXT = Object.freeze({
  'Mercer & Red Street':'Wet pavement, apartments, passing buses, and people getting on with the evening.',
  'Corner Market':'Coffee, bread, groceries, cardboard displays, and neighborhood conversation.',
  'Maker Garage':'Tools, marked storage, repair benches, spare parts, and practical work.',
  'City Park':'Trees, puddles, benches, marked paths, and room to move without needing a quest.',
  'Bus Stop':'A simple posted route map, shelter lights, and ordinary local travel.',
  'Roof Observatory':'A quiet roof with a labeled game reconstruction and links to real astronomy references.',
  'Red Street Arcade':'A small neighborhood arcade where monsters, puzzles, and jokes can safely get strange.',
  'Unmarked Service Road':'An ordinary-looking service road where Fuzzball keeps finding questions nobody has answered yet.'
});

export const ACTIVITIES = Object.freeze([
  {id:'monster-mood',kind:'play',title:'Monster Mood',place:'Red Street Arcade',prompt:'A monster looks confused. Pick the calmest useful response.',choices:['Give it space and ask what it needs','Shout louder','Block the exit'],answer:0,reward:{xp:8,joy:6}},
  {id:'redline',kind:'move',title:'Redline',place:'Mercer & Red Street',prompt:'Cross the marked practice lane when you are ready. No timer.',choices:['Go when ready','Keep waiting'],answer:0,reward:{xp:8,joy:4}},
  {id:'sidewalk-slalom',kind:'move',title:'Sidewalk Slalom',place:'City Park',prompt:'Follow the marked accessible route around the puddles.',choices:['Left · right · left','Right · right · right'],answer:0,reward:{xp:8,joy:5}},
  {id:'parcel-relay',kind:'move',title:'Parcel Relay',place:'Maker Garage',prompt:'Move the handcart along the posted route without blocking the aisle.',choices:['Forward · left · forward','Back · back · stop'],answer:0,reward:{xp:8,joy:5}},
  {id:'cipher-snap',kind:'puzzle',title:'Cipher Snap',place:'Red Street Arcade',prompt:'Complete the pattern: 2 · 4 · 8 · ?',choices:['16','12','10'],answer:0,reward:{xp:10,joy:4}},
  {id:'bus-transfer',kind:'puzzle',title:'Bus Transfer',place:'Bus Stop',prompt:'The fictional map says Route 7 reaches Maker Quarter.',choices:['7','4','11'],answer:0,reward:{xp:8,joy:4}},
  {id:'observatory-label',kind:'learn',title:'Observatory Label Check',place:'Roof Observatory',prompt:'Which label preserves the astronomy boundary?',choices:['Game reconstruction — not telescope data','Direct rooftop photo of a black hole','Proof of a new discovery'],answer:0,reward:{xp:8,joy:4}},
  {id:'market-closing',kind:'help',title:'Market Closing Shift',place:'Corner Market',prompt:'Rain reaches a cardboard display. What is the useful first move?',choices:['Move it under cover','Leave it in the walkway','Push it into the street'],answer:0,reward:{xp:8,joy:6}},
  {id:'workshop-sort',kind:'help',title:'Workshop Sort',place:'Maker Garage',prompt:'A hand tool is in the walking path.',choices:['Put it in marked storage','Hide it','Leave it'],answer:0,reward:{xp:8,joy:5}},
  {id:'repair-bench',kind:'make',title:'Repair Bench Remix',place:'Maker Garage',prompt:'Combine two harmless spare parts into something useful.',choices:['Make and name a small useful object','Throw everything away'],answer:0,reward:{xp:10,joy:7}},
  {id:'make-something',kind:'make',title:'Make Something',place:'City Park',prompt:'Create something small that makes waiting easier.',choices:['Make and name it','Do nothing'],answer:0,reward:{xp:10,joy:7}},
  {id:'fuzzball-question',kind:'learn',title:'Fuzzball: Question or Claim?',place:'Unmarked Service Road',prompt:'An unexplained pattern appears. What do we know?',choices:['It is an open question that needs evidence','It proves one cause','It solves a physics problem'],answer:0,reward:{xp:8,joy:5,discoveries:1}}
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
  p.activityIndex=Number.isInteger(input.activityIndex)?Math.max(0,input.activityIndex):0;
  p.creations=Array.isArray(input.creations)?input.creations.filter(x=>typeof x==='string').map(x=>x.slice(0,120)).slice(-12):[];
  p.chronicle=Array.isArray(input.chronicle)?input.chronicle.filter(x=>typeof x==='string').map(x=>x.slice(0,240)).slice(-20):[];
  return p;
}

export function contextFor(place){return CONTEXT[PLACES.includes(place)?place:PLACES[0]];}
export function activitiesAtPlace(place){const safe=PLACES.includes(place)?place:PLACES[0];return ACTIVITIES.filter(a=>a.place===safe);}
export function currentActivity(player){const p=clampPlayer(player);const rows=activitiesAtPlace(p.place);return rows[p.activityIndex%rows.length];}
export function nextActivity(player){const p=clampPlayer(player);const rows=activitiesAtPlace(p.place);p.activityIndex=(p.activityIndex+1)%rows.length;return p;}

export function answerActivity(player,choiceIndex){
  const p=clampPlayer(player); const a=currentActivity(p); const ok=choiceIndex===a.answer;
  if(ok){p.xp+=a.reward.xp||0;p.joy=Math.min(100,p.joy+(a.reward.joy||0));p.discoveries+=a.reward.discoveries||0;p.chronicle.push(`Completed ${a.title}.`);}
  else {p.joy=Math.min(100,p.joy+1);p.chronicle.push(`Tried ${a.title}. Nothing was lost.`);}
  p.activityIndex=(p.activityIndex+1)%activitiesAtPlace(p.place).length;
  return {player:p,ok,activity:a};
}

export function goSomewhere(player,index){
  const p=clampPlayer(player); const i=((index%PLACES.length)+PLACES.length)%PLACES.length;
  p.place=PLACES[i];p.activityIndex=0;p.joy=Math.min(100,p.joy+2);p.chronicle.push(`Went to ${p.place}.`);return p;
}

export function addCreation(player,name){
  const p=clampPlayer(player); const clean=String(name||'').trim().slice(0,120); if(!clean)return p;
  p.creations.push(clean);p.creations=p.creations.slice(-12);p.xp+=5;p.joy=Math.min(100,p.joy+5);p.chronicle.push(`Made ${clean}.`);return p;
}

export function serialize(player){return JSON.stringify(clampPlayer(player));}
export function parse(text){const raw=JSON.parse(text);if(raw?.schema!==SCHEMA)throw new Error('wrong save schema');return clampPlayer(raw);}
