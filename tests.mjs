import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {normalizeWeeks,renderSvg} from './scripts/generate.mjs';
import {buildLevel,createMission,WORLD,hpForLevel,firstLiveIntersection,aimGeometry} from './scripts/mission.mjs';

async function loadCompressedJson(path){
  return JSON.parse(gunzipSync(Buffer.from((await readFile(path,'utf8')).trim(),'base64')).toString('utf8'));
}
const fixture=await loadCompressedJson('fixtures/demo-calendar.json.gz.b64');
const sprites=await loadCompressedJson('assets/sprites.json.gz.b64');
const grid=normalizeWeeks(fixture.weeks);
const level=buildLevel(grid,'0w1Max');
const mission=createMission(grid,level);
const active=grid.flat().filter(d=>d && d.level>0).length;
const totalHp=grid.flat().reduce((sum,d)=>sum+hpForLevel(d?.level??0),0);

test('Календарь нормализуется в 53 × 7, исходные даты сохраняются',()=>{
  assert.equal(grid.length,53);
  assert.ok(grid.every(x=>x.length===7));
  assert.equal(grid[5][1].date,fixture.weeks[5].contributionDays[1].date);
});

test('Спрайты бойца представлены отдельными игровыми кадрами',()=>{
  assert.ok(Object.keys(sprites).length>=16);
  for(const name of ['idle-a','run-a','run-b','run-c','run-d','jump','aim','shoot-stand']){
    assert.ok(sprites[name],`Нет спрайта: ${name}`);
  }
});

test('Полная зачистка: прочность всех клеток учтена',()=>{
  assert.equal(mission.shots.length,totalHp);
  assert.equal(mission.totalHp,totalHp);
  assert.equal(mission.targets,active);
  assert.equal(new Set(mission.shots.map(s=>s.key)).size,active);
  assert.ok(mission.duration>20 && mission.duration<720);
  assert.ok(mission.shots.every(s=>s.start<s.impact && s.impact<mission.duration));
  assert.ok(mission.shots.every(s=>Math.abs(Math.hypot(s.x-s.origin.x,s.y-s.origin.y)-(s.impact-s.start)*780)<.15));
});

test('Пули и вспышки стартуют из реального дула при любой позе и повороте',()=>{
  const tilts=new Set();
  for(const shot of mission.shots){
    const pose=aimGeometry(shot.playerX,shot.footY,shot.facing,shot.tilt);
    tilts.add(shot.tilt);
    assert.ok(Math.abs(shot.origin.x-pose.origin.x)<0.0002,`Ошибка дула X ${shot.key}`);
    assert.ok(Math.abs(shot.origin.y-pose.origin.y)<0.0002,`Ошибка дула Y ${shot.key}`);
    const ray={x:shot.x-shot.origin.x,y:shot.y-shot.origin.y};
    const cross=ray.x*pose.barrel.y-ray.y*pose.barrel.x;
    const dot=ray.x*pose.barrel.x+ray.y*pose.barrel.y;
    assert.ok(Math.abs(cross)<.02,`Линия полёта не совпадает со стволом ${shot.key}`);
    assert.ok(dot>0 && ray.y<0,`Обратный выстрел ${shot.key}`);
    assert.equal(pose.barrel.x>0,shot.facing==='right');
  }
  assert.ok(tilts.size>2,'В разных точках должны использоваться разные углы прицеливания');
});

test('Движение в обе стороны, прыжки, платформы и стрельба с возвышения',()=>{
  assert.ok(mission.segments.some(s=>s.kind==='run'&&s.facing==='right'));
  assert.ok(mission.segments.some(s=>s.kind==='run'&&s.facing==='left'));
  assert.ok(mission.jumps.some(s=>s.kind==='jump'));
  assert.ok(mission.jumps.some(s=>s.kind==='drop'));
  assert.ok(mission.jumps.some(s=>s.kind==='hop'));
  assert.ok(mission.shots.some(s=>s.footY===WORLD.groundY));
  assert.ok(mission.shots.some(s=>s.footY<WORLD.groundY));
});

test('Процедурная карта воспроизводима по seed и меняется при другом seed',()=>{
  assert.deepEqual(buildLevel(grid,'0w1Max',1234),buildLevel(grid,'0w1Max',1234));
  assert.notDeepEqual(buildLevel(grid,'0w1Max',1234),buildLevel(grid,'0w1Max',1235));
  assert.deepEqual(createMission(grid,level),createMission(grid,level));
});

test('Карта ограничивает число платформ и преград, преграды не накладываются друг на друга',()=>{
  for(let seed=0;seed<70;seed++){
    const map=buildLevel(grid,'0w1Max',seed);
    assert.ok(map.platforms.length>=1&&map.platforms.length<=2);
    assert.ok(map.obstacles.length>=1&&map.obstacles.length<=3);
    for(let i=0;i<map.obstacles.length;i++)for(let j=i+1;j<map.obstacles.length;j++){
      assert.ok(Math.abs(map.obstacles[i].x-map.obstacles[j].x)>=180);
    }
  }
});



test('На 1000 seed не возникают ящики с крестом и преграды под платформами',()=>{
  for(let seed=0;seed<1000;seed++){
    const map=buildLevel(grid,'0w1Max',seed);
    assert.ok(map.obstacles.length>=1&&map.obstacles.length<=3);
    for(const o of map.obstacles){
      assert.equal(o.kind,'rock',`Неожиданный ящик: seed=${seed}`);
      for(const p of map.platforms){
        assert.ok(o.x+o.width < p.x-45 || o.x > p.x+p.width+45,
          `Препятствие под платформой: seed=${seed}, obstacleX=${o.x}, platformX=${p.x}`);
      }
    }
  }
  // Текущий демонстрационный seed раньше принудительно ставил x=340 под платформой x=334.
  assert.ok(!level.obstacles.some(o=>o.x===340));
});

test('SVG не рисует металлический ящик с диагональным крестом',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.match(svg,/id="obstacle-0"/);
  assert.doesNotMatch(svg,/stroke="#b7c4cd"|fill="#485b69"/);
});

test('На 100 разных картах боец не проходит сквозь преграды во время бега',()=>{
  for(let seed=0;seed<100;seed++){
    const map=buildLevel(grid,'0w1Max',seed);
    const plan=createMission(grid,map);
    assert.equal(plan.shots.length,totalHp,`Не все попадания для seed=${seed}`);
    for(const s of plan.segments.filter(s=>['walk','run'].includes(s.kind)&&s.y0===WORLD.groundY&&s.y1===WORLD.groundY)){
      for(let sample=0;sample<=20;sample++){
        const x=s.x0+(s.x1-s.x0)*sample/20;
        const collision=map.obstacles.find(o=>x+70>o.x && x+8<o.x+o.width);
        assert.equal(collision,undefined,`Столкновение seed=${seed} t=${s.start}`);
      }
    }
  }
});

test('Пустой календарь завершается корректно и не создаёт вымышленные выстрелы',()=>{
  const empty=grid.map(week=>week.map(d=>d?{...d,level:0,count:0}:null));
  const map=buildLevel(empty,'0w1Max',777);
  const plan=createMission(empty,map);
  assert.equal(plan.targets,0);
  assert.equal(plan.shots.length,0);
  assert.ok(plan.duration>0);
});

test('Недопустимый уровень активности блокируется',()=>{
  const copy=structuredClone(fixture.weeks);
  copy[0].contributionDays[0].contributionLevel='MADE_UP';
  assert.throws(()=>normalizeWeeks(copy));
});

test('Недопустимое число недель блокируется',()=>{
  assert.throws(()=>normalizeWeeks(Array.from({length:56},()=>({contributionDays:[]}))));
});

test('SVG включает карты, преграды, прицельные пули и финальную зачистку',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  for(const token of ['blue-commando','soldier-shoot-stand','repeatCount="indefinite"','GITHUB CONTRIBUTIONS','DEMO / TEST DATA','Прицельный выстрел 1','procedural-level','platform-0','obstacle-0','mission-complete']){
    assert.ok(svg.includes(token),`Не найден SVG-маркер ${token}`);
  }
  assert.equal((svg.match(/id="shot-\d+"/g)||[]).length,totalHp);
  assert.equal((svg.match(/<rect x="[0-9]+" y="[0-9]+" width="17" height="17"/g)||[]).length,grid.flat().filter(Boolean).length);
});

test('SVG не содержит внешних адресов, скриптов, foreignObject и небезопасных источников',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\s(?:href|src)=["']https?:\/\//i);
  assert.match(svg,/id="contribution-grid"/);
  assert.match(svg,/id="blue-commando"/);
});

test('Настоящий режим не маскирует тестовые данные под реальные',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:false});
  assert.doesNotMatch(svg,/DEMO \/ TEST DATA/);
  assert.match(svg,/Календарь получен через API GitHub/);
});


test('HP по яркости GitHub: NONE=0, Q1/Q2=1, Q3=2, Q4=3',()=>{
  assert.deepEqual([0,1,2,3,4].map(hpForLevel),[0,1,1,2,3]);
  assert.throws(()=>hpForLevel(-1));
  assert.throws(()=>hpForLevel(5));
});

test('Первое пересечение блокирует верхнюю клетку нижней, в том числе по диагонали',()=>{
  const live=new Map([
    ['bottom',{key:'bottom',col:5,row:6,x:180,y:204.5,hp:1}],
    ['top',{key:'top',col:5,row:5,x:180,y:184.5,hp:1}]
  ]);
  const origin={x:120,y:312},end={x:180,y:184.5};
  assert.equal(firstLiveIntersection(origin,end,live)?.key,'bottom');
  live.get('bottom').hp=0;
  assert.equal(firstLiveIntersection(origin,end,live)?.key,'top');
});

test('Зачистка идёт снизу вверх и никогда не пробивает живую клетку',()=>{
  const live=new Map();
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
    const d=grid[col][row];if(!d||!d.level)continue;
    live.set(`${col}:${row}`,{
      key:`${col}:${row}`,col,row,x:WORLD.gridX+col*WORLD.step+WORLD.cell/2,
      y:WORLD.gridY+row*WORLD.step+WORLD.cell/2,hp:hpForLevel(d.level)
    });
  }
  for(const shot of mission.shots){
    const state=live.get(shot.key);
    assert.ok(state,`Неожиданная цель: ${shot.key}`);
    assert.equal(firstLiveIntersection(shot.origin,shot,live)?.key,shot.key,`Перекрытие ${shot.key}`);
    assert.ok(![...live.values()].some(cell=>cell.col===shot.col&&cell.row>shot.row&&cell.hp>0),`Нижняя клетка ещё жива: ${shot.key}`);
    assert.equal(state.hp,shot.hpBefore);
    state.hp--;
    assert.equal(state.hp,shot.hpAfter);
    if(state.hp===0)live.delete(shot.key);
  }
  assert.equal(live.size,0);
});

test('Каждый квадрат выдерживает строго заданное число выстрелов',()=>{
  const grouped=new Map();
  for(const shot of mission.shots){
    if(!grouped.has(shot.key))grouped.set(shot.key,[]);
    grouped.get(shot.key).push(shot);
  }
  assert.equal(grouped.size,active);
  for(const [key,hits] of grouped){
    const [col,row]=key.split(':').map(Number);
    const hp=hpForLevel(grid[col][row].level);
    assert.equal(hits.length,hp);
    assert.ok(hits.slice(0,-1).every(s=>!s.finalHit&&s.hpAfter>0));
    assert.equal(hits.at(-1).hpAfter,0);
    assert.equal(hits.at(-1).finalHit,true);
    assert.ok(hits.every((s,i)=>i===0||s.start>hits[i-1].impact));
  }
});

test('SVG содержит промежуточное потускнение и восстановление по завершении цикла',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.match(svg,/attributeName="fill"/);
  assert.match(svg,/attributeName="opacity"/);
  assert.equal((svg.match(/id="shot-\d+"/g)||[]).length,totalHp);
});

test('Вспышка создаётся в точке дула и не задваивается кадром shoot-stand',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.equal((svg.match(/class="muzzle-flash"/g)||[]).length,totalHp);
  assert.equal((svg.match(/class="bullet"/g)||[]).length,totalHp);
  assert.match(svg,/href="#fx-muzzle"/);
  assert.doesNotMatch(svg,/<use href="#soldier-shoot-stand"/);
  assert.match(svg,/id="aim-upper"/);
  assert.match(svg,/type="rotate" calcMode="discrete"/);
  assert.match(svg,/type="translate" calcMode="linear"/);
});

test('Различаются короткие попадания и полноценные пиксельные взрывы',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  const destroyed=mission.shots.filter(s=>s.finalHit).length;
  assert.equal(destroyed,active);
  assert.equal((svg.match(/href="#fx-impact-break"/g)||[]).length,destroyed);
  assert.equal((svg.match(/href="#fx-impact-damage"/g)||[]).length,totalHp-destroyed);
  assert.match(svg,/id="fx-impact-break"/);
  assert.match(svg,/type="scale" calcMode="linear"/);
});

test('Геометрия позиции корректно зеркалится при развороте бойца',()=>{
  for(const angle of [-23,-7,0,14]){
    const right=aimGeometry(200,374,'right',angle);
    const left=aimGeometry(200,374,'left',angle);
    assert.ok(Math.abs(right.origin.x+left.origin.x-(400+WORLD.spriteSize))<1e-9);
    assert.ok(Math.abs(right.origin.y-left.origin.y)<1e-9);
    assert.ok(Math.abs(right.barrel.x+left.barrel.x)<1e-9);
    assert.ok(Math.abs(right.barrel.y-left.barrel.y)<1e-9);
  }
});


test('Цели выбираются не по рядам: верхние доступны через пропуски в нижних',()=>{
  const order=mission.targetOrder.map(key=>key.split(':').map(Number));
  assert.equal(order.length,active);
  // В первых 40 попаданиях должны встречаться разные ряды,
  // а не весь нижний ряд, за которым следующий.
  const first=order.slice(0,40).map(([col,row])=>row);
  assert.ok(new Set(first).size>=3,'Стрельба по-прежнему привязана к одному ряду');
  assert.ok(first.some(row=>row<=4),'Верхние клетки через пустые места не выбираются');
  assert.ok(first.some(row=>row===6),'Нижние клетки тоже выбираются');
  assert.ok(first.slice(1).filter((r,i)=>r!==first[i]).length>=14,'Нет смены высоты целей');
});

test('В каждом столбце нижние живые цели защищают верхние при случайном порядке',()=>{
  const seen=new Set();
  for(const key of mission.targetOrder){
    const [col,row]=key.split(':').map(Number);
    for(let lower=row+1;lower<7;lower++){
      if(grid[col][lower]?.level>0)assert.ok(seen.has(`${col}:${lower}`),`Раннее поражение ${key}`);
    }
    seen.add(key);
  }
  assert.equal(seen.size,active);
});

test('Seed изменяет маршрут и порядок выстрелов, повторный seed даёт ровно тот же порядок',()=>{
  const same=createMission(grid,buildLevel(grid,'0w1Max',818));
  const sameAgain=createMission(grid,buildLevel(grid,'0w1Max',818));
  const other=createMission(grid,buildLevel(grid,'0w1Max',819));
  assert.deepEqual(same.targetOrder,sameAgain.targetOrder);
  assert.notDeepEqual(same.targetOrder,other.targetOrder);
  assert.notDeepEqual(same.targetOrder,grid.flat().filter(Boolean).map(d=>d.date));
  assert.ok(same.segments.some(s=>s.kind==='walk'));
  assert.ok(same.segments.some(s=>s.kind==='run'));
  assert.ok(same.segments.some(s=>s.kind==='hop'));
});

test('После последнего попадания боец возвращается к старту настоящим маршрутом',()=>{
  assert.ok(mission.finishAt>=mission.lastImpact);
  assert.ok(mission.returnStart>mission.finishAt);
  assert.ok(mission.restoreStart>mission.returnStart);
  assert.ok(mission.restoreEnd<mission.duration);
  const tail=mission.segments.filter(s=>s.start>=mission.returnStart);
  assert.ok(tail.some(s=>['walk','run','hop','jump','drop'].includes(s.kind)),
    'После победы должно оставаться движение');
  for(let i=1;i<tail.length;i++){
    assert.ok(Math.abs(tail[i].x0-tail[i-1].x1)<.001,'Скачок X между сегментами');
    assert.ok(Math.abs(tail[i].y0-tail[i-1].y1)<.001,'Скачок Y между сегментами');
  }
  const final=mission.segments.at(-1);
  assert.equal(final.x1,mission.initial.x);
  assert.equal(final.y1,mission.initial.footY);
  assert.equal(final.facing,mission.initial.facing);
  assert.equal(final.kind,'idle');
});

test('На разных seed и на пустой карте финал остаётся бесшовным',()=>{
  const empty=grid.map(w=>w.map(d=>d?{...d,level:0,count:0}:null));
  const cases=[createMission(empty,buildLevel(empty,'0w1Max',14)),
    ...[17,39,68].map(seed=>createMission(grid,buildLevel(grid,'0w1Max',seed)))];
  for(const plan of cases){
    const last=plan.segments.at(-1);
    assert.equal(last.x1,plan.initial.x);
    assert.equal(last.y1,plan.initial.footY);
    assert.equal(last.facing,'right');
    assert.ok(plan.restoreEnd>plan.restoreStart);
    assert.ok(plan.restoreEnd<plan.duration);
  }
});

test('SVG плавно восстанавливает клетки и не телепортирует игрока',()=>{
  const svg=renderSvg({weeks:fixture.weeks,sprites,username:'0w1Max',fixture:true});
  assert.match(svg,/id="mission-complete"/);
  // Надпись появляется только после завершения миссии, затем плавно исчезает.
  assert.match(svg,/attributeName="opacity" calcMode="linear"/);
  // Отказ от принудительной замены последней позиции в рендере.
  assert.match(svg,/id="blue-commando"/);
  assert.equal((svg.match(/id="shot-\d+"/g)||[]).length,totalHp);
});
