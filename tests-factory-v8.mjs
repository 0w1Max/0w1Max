import test from 'node:test';
import assert from 'node:assert/strict';
import {factoryObstacles,factoryPlatforms,factorySpriteDefinitions} from './scripts/factory-sprites.mjs';
import {levelMarkup} from './scripts/level-art.mjs';
import {buildLevel,validateLayout} from './scripts/mission.mjs';
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
 assert.ok(svg.includes('x="200" y="320" width="138" height="32"'));
 assert.doesNotMatch(svg,/factory-obstacle-outline|data-sprite="(?:sandbags|stone-ruin|fallen-log)"|<image\b|<script\b|<foreignObject\b/);
 assert.throws(()=>factorySpriteDefinitions(['not-a-sprite']));
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
