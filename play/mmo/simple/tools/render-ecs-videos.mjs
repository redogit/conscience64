#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {initializeECS,videoJobs,VIDEO_BOUNDARY} from '../ecs.mjs';

const output=resolve(process.argv[2]||'ecs-video-output');
const seconds=Math.max(.5,Math.min(12,Number(process.argv[3]||1.5)));
mkdirSync(output,{recursive:true});

const ffmpeg=spawnSync('ffmpeg',['-version'],{stdio:'ignore'});
if(ffmpeg.status!==0){
  console.error('FFmpeg is required for this explicit video carrier. ECS world state remains valid without it.');
  process.exit(2);
}

const world=initializeECS();
const jobs=videoJobs(world);
const colors={'player-pov':'17211d','character-view':'301d22','world-view':'18222f'};
const font=process.env.C64_VIDEO_FONT||'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const escapeText=value=>String(value).replace(/\\/g,'\\\\').replace(/:/g,'\\:').replace(/'/g,"\\'").replace(/%/g,'\\%');
const rendered=[];

for(const job of jobs){
  const filename=`${job.id.replace(/:/g,'__')}.webm`;
  const path=resolve(output,filename);
  const title=`${job.place} — ${job.perspective}`;
  const context=job.context.length>82?`${job.context.slice(0,79)}...`:job.context;
  const filters=[
    `drawbox=x='mod(t*90,iw+220)-220':y=80:w=220:h=120:color=white@0.08:t=fill`,
    `drawbox=x='iw-mod(t*65,iw+160)':y=430:w=160:h=80:color=red@0.12:t=fill`,
    `drawtext=fontfile=${font}:text='${escapeText(title)}':fontcolor=white:fontsize=30:x=48:y=52`,
    `drawtext=fontfile=${font}:text='${escapeText(context)}':fontcolor=white@0.82:fontsize=18:x=48:y=112`,
    `drawtext=fontfile=${font}:text='ECS RENDER SMOKE · ${escapeText(VIDEO_BOUNDARY)}':fontcolor=white@0.58:fontsize=14:x=48:y=h-48`
  ].join(',');
  const args=[
    '-y','-f','lavfi','-i',`color=c=#${colors[job.perspective]}:s=640x360:r=24:d=${seconds}`,
    '-vf',filters,'-an','-c:v','libvpx-vp9','-b:v','260k','-deadline','realtime',path
  ];
  const result=spawnSync('ffmpeg',args,{stdio:'pipe',encoding:'utf8'});
  if(result.status!==0){
    console.error(result.stderr||`FFmpeg failed for ${job.id}`);
    process.exit(result.status||1);
  }
  rendered.push({...job,file:filename,carrier:'ffmpeg-procedural-smoke',smokeRender:true});
}

writeFileSync(resolve(output,'manifest.json'),JSON.stringify({
  schema:'conscience64.ecs-video-render/v1',
  count:rendered.length,
  boundary:VIDEO_BOUNDARY,
  note:'Procedural renderer smoke artifacts. These prove carrier execution and perspective coverage; they are not production visual canon.',
  jobs:rendered
},null,2));

console.log(`Rendered ${rendered.length} WebM scene-perspective clips to ${output}`);
