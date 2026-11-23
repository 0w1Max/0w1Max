import test from 'node:test';
import assert from 'node:assert/strict';
import {factoryObstacles,factoryPlatforms,factorySpriteDefinitions,factoryPlatformHeight,factoryObstacleSizes} from './scripts/factory-sprites.mjs';
import {levelMarkup} from './scripts/level-art.mjs';
import {buildLevel,validateLayout,createMission,WORLD} from './scripts/mission.mjs';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {normalizeWeeks} from './scripts/generate.mjs';
const grid=Array.from({length:53},()=>Array(7).fill(null));
test('Factory V8 renders all seven new sprites at the existing collision coordinates',()=>{
 const obstacles=Object.keys(factoryObstacles).map((kind,i)=>({kind,x:300+i*180,width:kind==='sandbags'?45:34,height:27}));
 const platforms=Object.keys(factoryPlatforms).map((kind,i)=>({kind,x:200+i*200,y:320,width:138}));
 const svg=levelMarkup({location:'industrial',obstacles,platforms});
 for(const name of [...Object.values(factoryObstacles),...Object.values(factoryPlatforms)]){
  assert.equal((svg.match(new RegExp('id="factory-v8-'+name+'"','g'))||[]).length,1);
  assert.ok(svg.includes(`href="#factory-v8-${name}"`));
 }
 assert.ok(svg.includes('x="300" y="347" width="45" height="27"'));
 assert.ok(svg.includes(`x="200" y="320" width="138" height="${factoryPlatformHeight('metal-catwalk',138)}"`));
 assert.doesNotMatch(svg,/factory-obstacle-outline|data-sprite="(?:sandbags|stone-ruin|fallen-log)"|<image\b|<script\b|<foreignObject\b/);
 assert.throws(()=>factorySpriteDefinitions(['not-a-sprite']));
});
test('Factory concept retains detailed vector silhouettes and correctly scaled supports',()=>{
 const atlas=JSON.parse(gunzipSync(Buffer.from(readFileSync('assets/factory-v8-sprites.json.gz.b64','utf8').trim(),'base64')));
 for(const [name,[width,height,colors]] of Object.entries(atlas)){
  assert.ok(width>=250&&height>=140,name);
  assert.ok(colors.length>=60,name);
  assert.ok(colors.reduce((sum,[,path])=>sum+(path.match(/M/g)||[]).length,0)>2000,name);
 }
 for(const seed of [5,111,116,104,914102602,1165146435]){
  for(const platform of buildLevel(grid,'0w1Max',seed,'industrial').platforms)
   assert.ok(platform.y+factoryPlatformHeight(platform.kind,platform.width)<=WORLD.groundY+2,'Supports must fit above the ground');
 }
});
test('Factory enlarged obstacles are cleared along the actual twelve-keyframe jump curve',()=>{
 const calendar=JSON.parse(readFileSync('preview/factory-v8/live-calendar.json','utf8'));
 const actualGrid=normalizeWeeks(calendar.weeks);
 for(const seed of [5,111,116,104,914102602,1165146435]){
  const level=buildLevel(actualGrid,'0w1Max',seed,'industrial'),mission=createMission(actualGrid,level);
  assert.ok(Math.max(...mission.jumps.map(s=>s.arc??57))<=250,'Jump arc must remain on screen');
  for(const s of mission.segments)for(let i=0;i<=120;i++){
   const u=i/120,x=s.x0+(s.x1-s.x0)*u;
   let footY=s.y0+(s.y1-s.y0)*u;
   if(['jump','drop','hop'].includes(s.kind)){
    const q=u*12,j=Math.min(11,Math.floor(q)),f=q-j;
    const sine=Math.sin(j/12*Math.PI)*(1-f)+Math.sin((j+1)/12*Math.PI)*f;
    footY-=sine*(s.arc??57);
   }
   assert.ok(!level.obstacles.some(o=>x+54>o.x&&x+24<o.x+o.width&&footY>WORLD.groundY-o.height+.1),`seed=${seed}, t=${s.start}, kind=${s.kind}`);
  }
 }
});
test('Factory compact obstacles have fixed distinct sizes and crate is strictly largest',()=>{
 assert.deepEqual(factoryObstacleSizes,{'supply-crate':[40,34],'fallen-log':[26,18],sandbags:[36,26],'stone-ruin':[32,20]});
 const [crateW,crateH]=factoryObstacleSizes['supply-crate'];
 for(const [kind,[w,h]] of Object.entries(factoryObstacleSizes))if(kind!=='supply-crate'){
  assert.ok(w<crateW&&h<crateH,kind);
 }
 for(let seed=0;seed<1000;seed++)for(const obstacle of buildLevel(grid,'0w1Max',seed,'industrial').obstacles)
  assert.deepEqual([obstacle.width,obstacle.height],factoryObstacleSizes[obstacle.kind]);
 const art=factorySpriteDefinitions(Object.values(factoryObstacles));
 assert.doesNotMatch(art,/preserveAspectRatio="none"|factory-v8-(?:electric-motor|pipe-bundle|cable-reel)/);
 assert.equal((art.match(/preserveAspectRatio="xMidYMax meet"/g)||[]).length,4);
});
test('Factory V8 seeded previews cover the whole kit while retaining valid jump layouts',()=>{
 const objects=new Set(),platforms=new Set();
 for(const seed of [5,111,116,104]){
  const level=buildLevel(grid,'0w1Max',seed,'industrial');assert.ok(validateLayout(level).valid);
  level.obstacles.forEach(o=>objects.add(factoryObstacles[o.kind]));
  level.platforms.forEach(p=>platforms.add(factoryPlatforms[p.kind]));
 }
 assert.deepEqual([...objects].sort(),Object.values(factoryObstacles).sort());
 assert.deepEqual([...platforms].sort(),Object.values(factoryPlatforms).sort());
});
