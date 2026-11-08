import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import {normalizeWeeks,renderSvg} from './scripts/generate.mjs';
import {buildLevel,createMission,WORLD,hpForLevel,firstLiveIntersection} from './scripts/mission.mjs';
const fixture=JSON.parse(gunzipSync(Buffer.from((await readFile('fixtures/demo-calendar.json.gz.b64','utf8')).trim(),'base64')).toString('utf8'));
const sprites=JSON.parse(gunzipSync(Buffer.from((await readFile('assets/sprites.json.gz.b64','utf8')).trim(),'base64')).toString('utf8'));
test('Календарь нормализуется в 53 × 7',()=>{
  const weeks=normalizeWeeks(fixture.weeks);
  assert.equal(weeks.length,53);
  assert.ok(weeks.every(x=>x.length===7));
  assert.equal(weeks[5][1].date,fixture.weeks[5].contributionDays[1].date);
});
test('Анимация содержит штатного бойца и выстрелы',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.ok(svg.includes('blue-commando'));
  assert.ok(svg.includes('soldier-shoot-stand'));
  assert.ok(svg.includes('repeatCount="indefinite"'));
  assert.ok(svg.includes('GITHUB CONTRIBUTIONS'));
  assert.ok(svg.includes('DEMO / TEST DATA'));
  assert.ok(svg.includes('Прицельный выстрел 1'));
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
});
test('Неверный уровень активности блокируется',()=>{
  const copy=structuredClone(fixture.weeks);
  copy[0].contributionDays[0].contributionLevel='MADE_UP';
  assert.throws(()=>normalizeWeeks(copy));
});
test('Недопустимое количество недель блокируется',()=>{
  assert.throws(()=>normalizeWeeks(Array.from({length:56},()=>({contributionDays:[]}))));
});

test('SVG не содержит сторонних внешних адресов или скриптов',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\s(?:href|src)=["\']https?:\/\//i);
  assert.match(svg,/id="contribution-grid"/);
  assert.match(svg,/id="blue-commando"/);
});
test('Реальный режим не помечен как демонстрационный',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:false});
  assert.doesNotMatch(svg,/DEMO \/ TEST DATA/);
  assert.match(svg,/Календарь получен через API GitHub/);
});


const grid=normalizeWeeks(fixture.weeks), level=buildLevel(grid,'0w1Max'), mission=createMission(grid,level), active=grid.flat().filter(x=>x&&x.level>0).length, totalHp=grid.flat().reduce((n,d)=>n+hpForLevel(d?.level??0),0);
test('Планировщик назначает нужное число попаданий в зависимости от HP',()=>{
 assert.equal(mission.shots.length,totalHp);
 assert.equal(mission.totalHp,totalHp);
 assert.equal(new Set(mission.shots.map(s=>s.key)).size,active);
 assert.ok(mission.shots.every(s=>s.impact>s.start && s.impact<mission.duration));
});
test('Пули выходят из ствола и идут по диагонали к точной цели',()=>{
 for(const s of mission.shots){
  assert.equal(s.origin.y,s.footY-WORLD.muzzleYFromFeet);
  assert.equal(s.origin.x,s.playerX+(s.facing==='right'?WORLD.muzzleRightX:WORLD.muzzleLeftX));
  assert.ok(s.y<s.origin.y);
  assert.ok((s.x-s.origin.x)*(s.facing==='right'?1:-1)>0);
  const angle=Math.atan2(Math.abs(s.x-s.origin.x),s.origin.y-s.y)*180/Math.PI;
  assert.ok(angle>=13 && angle<=52);
 }
});
test('Боец ходит туда и обратно, перепрыгивает преграды, использует платформы',()=>{
 assert.ok(mission.segments.some(s=>s.kind==='run'&&s.facing==='right'));
 assert.ok(mission.segments.some(s=>s.kind==='run'&&s.facing==='left'));
 assert.ok(mission.jumps.some(s=>s.kind==='jump'));
 assert.ok(mission.jumps.some(s=>s.kind==='drop'));
 assert.ok(mission.jumps.some(s=>s.kind==='hop'));
 assert.ok(mission.shots.some(s=>s.footY<WORLD.groundY));
});
test('Карта детерминирована по seed и меняется при другом seed',()=>{
 assert.deepEqual(buildLevel(grid,'0w1Max',2026),buildLevel(grid,'0w1Max',2026));
 assert.notDeepEqual(buildLevel(grid,'0w1Max',2026),buildLevel(grid,'0w1Max',2027));
 assert.deepEqual(createMission(grid,level),createMission(grid,level));
});
test('Количество объектов ограничено, препятствия разделены безопасными интервалами',()=>{
 for(let seed=0;seed<60;seed++){
  const map=buildLevel(grid,'0w1Max',seed);
  assert.ok(map.obstacles.length>=1&&map.obstacles.length<=3);
  assert.ok(map.platforms.length>=1&&map.platforms.length<=2);
  for(let i=0;i<map.obstacles.length;i++)for(let j=i+1;j<map.obstacles.length;j++)assert.ok(Math.abs(map.obstacles[i].x-map.obstacles[j].x)>=180);
 }
});
test('100 процедурных карт: все цели поражаются, боец не пробегает через ящики',()=>{
 for(let seed=0;seed<100;seed++){
  const map=buildLevel(grid,'0w1Max',seed),plan=createMission(grid,map);
  assert.equal(plan.shots.length,totalHp);
  for(const s of plan.segments.filter(s=>s.kind==='run'&&s.y0===WORLD.groundY&&s.y1===WORLD.groundY)){
   for(let k=0;k<=20;k++){
    const x=s.x0+(s.x1-s.x0)*k/20;
    assert.ok(!map.obstacles.some(o=>x+70>o.x&&x+8<o.x+o.width));
   }
  }
 }
});
test('Пустой календарь не создаёт вымышленных выстрелов',()=>{
 const empty=grid.map(w=>w.map(d=>d?{...d,level:0,count:0}:null));
 const plan=createMission(empty,buildLevel(empty,'0w1Max',777));
 assert.equal(plan.shots.length,0);
});
test('SVG содержит уровень, попадания, финал, но не содержит внешних скриптов',()=>{
 const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
 assert.ok(svg.includes('mission-complete')&&svg.includes('procedural-level')&&svg.includes('platform-0'));
 assert.equal((svg.match(/id="shot-\d+"/g)||[]).length,totalHp);
 assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\s(?:href|src)=["']https?:\/\//i);
});


test('HP по уровню активности: 0 / 1 / 1 / 2 / 3',()=>{
 assert.deepEqual([0,1,2,3,4].map(hpForLevel),[0,1,1,2,3]);
 assert.throws(()=>hpForLevel(5));
 assert.throws(()=>hpForLevel(-1));
});

test('Первое столкновение: нижняя клетка закрывает верхнюю',()=>{
 const live=new Map([
  ['lower',{key:'lower',col:2,row:6,x:180,y:204.5,hp:1}],
  ['upper',{key:'upper',col:2,row:5,x:180,y:184.5,hp:1}],
 ]);
 const origin={x:120,y:312},goal={x:180,y:184.5};
 assert.equal(firstLiveIntersection(origin,goal,live)?.key,'lower');
 live.get('lower').hp=0;
 assert.equal(firstLiveIntersection(origin,goal,live)?.key,'upper');
});

test('Весь календарь уничтожается строго снизу вверх без прострела сквозь клетки',()=>{
 const live=new Map();
 for(let col=0;col<53;col++)for(let row=0;row<7;row++){
  const d=grid[col][row];if(!d||!d.level)continue;
  live.set(`${col}:${row}`,{key:`${col}:${row}`,col,row,
   x:WORLD.gridX+col*WORLD.step+WORLD.cell/2,
   y:WORLD.gridY+row*WORLD.step+WORLD.cell/2,hp:hpForLevel(d.level)});
 }
 for(const shot of mission.shots){
  const state=live.get(shot.key);
  assert.ok(state);
  assert.equal(firstLiveIntersection(shot.origin,shot,live)?.key,shot.key);
  assert.equal(state.hp,shot.hpBefore);
  assert.ok(![...live.values()].some(v=>v.col===shot.col&&v.row>shot.row&&v.hp>0));
  state.hp--;
  assert.equal(state.hp,shot.hpAfter);
  if(!state.hp)live.delete(shot.key);
 }
 assert.equal(live.size,0);
});

test('Прочные клетки темнеют после попаданий, а затем уничтожаются',()=>{
 const byCell=new Map();
 for(const shot of mission.shots){
  if(!byCell.has(shot.key))byCell.set(shot.key,[]);
  byCell.get(shot.key).push(shot);
 }
 assert.equal(byCell.size,active);
 for(const [key,hits] of byCell){
  const [col,row]=key.split(':').map(Number);
  assert.equal(hits.length,hpForLevel(grid[col][row].level));
  assert.ok(hits.slice(0,-1).every(x=>!x.finalHit&&x.hpAfter>0));
  assert.equal(hits.at(-1).hpAfter,0);
  assert.equal(hits.at(-1).finalHit,true);
 }
 const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
 assert.match(svg,/attributeName="fill"/);
 assert.equal((svg.match(/id="shot-\d+"/g)||[]).length,totalHp);
});
