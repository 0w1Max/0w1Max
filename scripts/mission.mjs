/**
 * Детерминированный планировщик игрового уровня для SVG README.
 * Только вычисления: данные GitHub и побочные эффекты остаются за генератором.
 */
export const WORLD = Object.freeze({
  width: 1200, height: 430, groundY: 374, spriteSize: 78,
  gridX: 72, gridY: 76, step: 20, cell: 17,
  muzzleRightX: 63, muzzleLeftX: 15, muzzleYFromFeet: 62,
});

function hash32(value) {
  let h = 2166136261;
  for (let i=0; i<value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRandom(seed) {
  let state=seed>>>0;
  return () => {
    state+=0x6d2b79f5;
    let t=state;
    t=Math.imul(t ^ t>>>15,t|1);
    t^=t+Math.imul(t ^ t>>>7,t|61);
    return ((t ^ t>>>14)>>>0)/4294967296;
  };
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=x=>Math.round(x*10000)/10000;

export function buildLevel(grid, username='0w1Max', seedOverride) {
  if (!Array.isArray(grid) || grid.length!==53 || grid.some(w=>!Array.isArray(w)||w.length!==7)) {
    throw new Error('Для карты нужен календарь 53 × 7');
  }
  const seed=seedOverride ?? hash32(username+'|'+grid.flat().map(d=>d?`${d.date}:${d.count}:${d.level}`:'-').join('|'));
  const rand=seededRandom(seed);
  const obstacles=[];
  const count=1+Math.floor(rand()*3); // 1–3 небольших препятствия
  for (let i=0;i<count;i++) {
    const sectorStart=310+i*(520/count);
    const x=Math.round(sectorStart+rand()*(520/count-55));
    const width=24+Math.floor(rand()*16);
    obstacles.push({x,width,height:21+Math.floor(rand()*13),kind:rand()<.5?'crate':'rock'});
  }
  const platforms=[];
  const pCount=1+Math.floor(rand()*2); // 1–2 доступные платформы
  for(let i=0;i<pCount;i++) {
    const base=260+i*460;
    const x=Math.round(base+rand()*80);
    const width=118+Math.round(rand()*31);
    const y=319+Math.round(rand()*14);
    platforms.push({x,y,width});
  }
  // Убираем преграды под платформами: у каждого объекта должен быть понятный маршрут.
  const safeObstacles=[];
  for(const o of obstacles) {
    if(!platforms.every(p=>o.x+o.width < p.x-45 || o.x > p.x+p.width+45))continue;
    if(safeObstacles.some(prev=>Math.abs(o.x-prev.x)<180))continue;
    safeObstacles.push(o);
  }
  if(!safeObstacles.length) safeObstacles.push({x:340,width:30,height:24,kind:'crate'});
  return {seed,obstacles:safeObstacles,platforms};
}

function allTargets(grid){
  const out=[];
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
    const cell=grid[col][row];
    // Нулевые дни остаются тёмным фоном. Зачищаются все существующие зелёные cells.
    if(!cell || cell.level===0)continue;
    out.push({col,row,key:`${col}:${row}`,x:WORLD.gridX+col*WORLD.step+WORLD.cell/2,y:WORLD.gridY+row*WORLD.step+WORLD.cell/2});
  }
  return out;
}

function chooseFiringPosition(target,pass,level,currentX){
  const footCandidates=[];
  for(const groundY of [WORLD.groundY,...level.platforms.map(p=>p.y)]){
    for(const facing of ['right','left']){
      const muzzleY=groundY-WORLD.muzzleYFromFeet;
      const vertical=muzzleY-target.y;
      if(vertical<12) continue;
      const run=vertical*.57;
      const offset=facing==='right'?WORLD.muzzleRightX:WORLD.muzzleLeftX;
      const rawX=target.x-offset+(facing==='right'?-run:run);
      if(rawX<6||rawX>1110)continue;
      for(const adjust of [0,-24,24,-46,46,-70,70,-95,95]) {
        const x=rawX+adjust;
        if(x<6||x>1110)continue;
        const muzzleX=x+(facing==='right'?WORLD.muzzleRightX:WORLD.muzzleLeftX);
        const horizontal=target.x-muzzleX;
        if((facing==='right'&&horizontal<=0)||(facing==='left'&&horizontal>=0))continue;
        const angle=Math.atan2(Math.abs(horizontal),vertical)*180/Math.PI;
        if(angle<13||angle>52)continue; // Пуля обязана совпадать с наклоном ствола
        const onPlatform=level.platforms.find(p=>p.y===groundY);
        if(onPlatform && !(x+38>=onPlatform.x+14&&x+38<=onPlatform.x+onPlatform.width-14))continue;
        const blocking=level.obstacles.some(o=>groundY===WORLD.groundY && x+8<o.x+o.width+5 && x+70>o.x-5);
        if(blocking)continue; // не останавливаться и не стрелять внутри препятствия
        footCandidates.push({x,footY:groundY,facing,platform:onPlatform??null,
          cost:Math.abs(x-currentX)*.07 + Math.abs(adjust)*.55 +
            (facing!==pass?13:0)+(onPlatform?-5:0)});
      }
    }
  }
  if(!footCandidates.length) throw new Error(`Нельзя прицелиться в клетку ${target.key}`);
  footCandidates.sort((a,b)=>a.cost-b.cost);
  return footCandidates[0];
}

/** Выдаёт воспроизводимый план: движение, прыжки, точные попадания, финальная зачистка. */
export function createMission(grid,level){
  const targets=allTargets(grid);
  const ordered=[];
  // Три прохода: слева направо, обратно, снова вправо.
  for(let pass=0;pass<3;pass++){
    const rowSet=pass===0?[0,1,2]:pass===1?[3,4]:[5,6];
    const subset=targets.filter(v=>rowSet.includes(v.row)).sort((a,b)=>
      (pass===1?b.col-a.col:a.col-b.col)||a.row-b.row);
    ordered.push(...subset.map(v=>({...v,pass,preferredFacing:pass===1?'left':'right'})));
  }
  let t=0,player={x:90,footY:WORLD.groundY,facing:'right'};
  const segments=[],shots=[],jumps=[];
  const speed=168;
  function segment(kind,duration,toX=player.x,toY=player.footY,facing=player.facing){
    const start=round(t),end=round(t+Math.max(duration,.02));
    const s={kind,start,end,x0:round(player.x),x1:round(toX),y0:round(player.footY),y1:round(toY),facing};
    segments.push(s);
    t=end;player={x:toX,footY:toY,facing};
    if(kind==='jump'||kind==='drop'||kind==='hop')jumps.push(s);
    return s;
  }
  function walkTo(x){
    if(Math.abs(x-player.x)<1)return;
    const facing=x>player.x?'right':'left';
    segment('run',Math.abs(x-player.x)/speed,x,player.footY,facing);
  }
  function leapTo(x,y,kind='jump'){
    segment(kind,Math.max(.46,Math.abs(x-player.x)/180),x,y,x>player.x?'right':'left');
  }
  function moveTo(dest){
    const targetX=dest.x;
    let goalY=dest.footY;
    const platformNow=level.platforms.find(p=>p.y===player.footY&&player.x+38>=p.x&&player.x+38<=p.x+p.width);
    if(platformNow && goalY!==player.footY){
      const dir=targetX>player.x?1:-1;
      const exit=safeGroundLanding(clamp(player.x+dir*70,5,1110),dir);
      leapTo(exit,WORLD.groundY,'drop');
    }
    if(goalY!==WORLD.groundY && player.footY===WORLD.groundY){
      const p=dest.platform;
      const toSide=player.x < p.x+p.width/2?1:-1;
      const approach=toSide>0?p.x-55:p.x+p.width+55;
      const approachX=safeGroundLanding(clamp(approach,5,1110),approach>player.x?1:-1);
      moveGround(approachX);
      const land=clamp(toSide>0?p.x+15:p.x+p.width-91,p.x-20,p.x+p.width-58);
      leapTo(land,p.y,'jump');
    }
    if(player.footY===WORLD.groundY && goalY===WORLD.groundY)moveGround(targetX);
    else walkTo(targetX);
  }
  function safeGroundLanding(x,dir){
    let position=x;
    for(const o of level.obstacles) {
      const left=o.x-78, right=o.x+o.width;
      if(position>left && position<right)position=dir>0?right+12:left-12;
    }
    return clamp(position,5,1110);
  }
  function moveGround(destX){
    if(Math.abs(destX-player.x)<1)return;
    const dir=destX>player.x?1:-1;
    // Запретная зона включает и ширину бойца: прыжок должен начаться ДО столкновения.
    const crossed=level.obstacles.filter(o=>dir>0?
      player.x<=o.x-70 && destX>=o.x+o.width-8 :
      player.x>=o.x+o.width-8 && destX<=o.x-70)
      .sort((a,b)=>dir*(a.x-b.x));
    let jumped=false;
    for(const o of crossed){
      const before=clamp(dir>0?o.x-90:o.x+o.width+18,5,1110);
      const after=clamp(dir>0?o.x+o.width+18:o.x-90,5,1110);
      if(dir*(before-player.x)>1)walkTo(before);
      if(dir*(after-player.x)>1){leapTo(after,WORLD.groundY,'jump');jumped=true;}
    }
    const diff=destX-player.x;
    if(!jumped && Math.abs(diff)>140 && (level.seed+shots.length)%3===0){
      const mid=player.x+diff*.46;
      walkTo(mid-25*dir);
      leapTo(mid+36*dir,WORLD.groundY,'hop');
    }
    walkTo(destX);
  }

  const used=new Set();
  let previousPass=null;
  for(const target of ordered){
    if(previousPass!==null && target.pass!==previousPass && player.footY===WORLD.groundY){
      const direction=target.preferredFacing==='left'?-1:1;
      const hopX=clamp(player.x+direction*74,5,1110);
      const safe=level.obstacles.every(o=>hopX+70<=o.x || hopX+8>=o.x+o.width);
      if(safe && Math.abs(hopX-player.x)>40)leapTo(hopX,WORLD.groundY,'hop');
    }
    previousPass=target.pass;
    const dest=chooseFiringPosition(target,target.preferredFacing,level,player.x);
    moveTo(dest);
    if(player.facing!==dest.facing)segment('turn',.045,player.x,player.footY,dest.facing);
    segment('aim',.052);
    const start=round(t);
    const origin={x:round(player.x+(player.facing==='right'?WORLD.muzzleRightX:WORLD.muzzleLeftX)),y:round(player.footY-WORLD.muzzleYFromFeet)};
    const distance=Math.hypot(origin.x-target.x,origin.y-target.y);
    const impact=round(start+distance/780);
    shots.push({...target,origin,facing:player.facing,start,impact,playerX:round(player.x),footY:round(player.footY)});
    if(used.has(target.key))throw new Error(`Повторная цель: ${target.key}`);
    used.add(target.key);
    segment('shoot',.105);
  }
  const lastImpact=shots.reduce((v,s)=>Math.max(v,s.impact),t);
  if(t<lastImpact)segment('aim',lastImpact-t);
  segment('clear',1.25);
  const duration=round(t);
  if(duration>240)throw new Error(`Непрактичная длительность анимации: ${duration}с`);
  if(used.size!==targets.length)throw new Error(`Не все квадраты обработаны: ${used.size}/${targets.length}`);
  return {duration,segments,shots,jumps,level,targets:targets.length,initial:{x:90,footY:WORLD.groundY},lastImpact};
}
