/**
 * Детерминированный планировщик игрового уровня для SVG README.
 * Только вычисления: данные GitHub и побочные эффекты остаются за генератором.
 */
import {selectLocation} from './locations.mjs';
import {biomeFor} from './biomes.mjs';

export const WORLD = Object.freeze({
  width: 1200, height: 430, groundY: 374, spriteSize: 78,
  gridX: 72, gridY: 76, step: 20, cell: 18,
  // Опорные координаты исходного спрайта aim 78×78 (в пикселях).
  aimPivotX: 38, aimPivotY: 42,
  aimGripX: 38, aimGripY: 40,
  aimTipX: 60, aimTipY: 14,
  muzzleRightX: 60, muzzleLeftX: 18, muzzleYFromFeet: 64,
});

function hash32(value) {
  let h = 2166136261;
  for (let i=0; i<value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function seededRandom(seed) {
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

/** Коллекции оригинальных 8-bit объектов, оформляемые рендерером отдельно. */
export const OBSTACLE_POOL = Object.freeze([
  'jungle-rock', 'fallen-log', 'sandbags', 'stone-ruin', 'tree-stump', 'supply-crate'
]);
export const PLATFORM_POOL = Object.freeze([
  'wooden-bridge', 'mossy-stone', 'vine-ledge', 'metal-catwalk', 'camo-platform'
]);

export function randomCount(random,max) {
  if(!Number.isInteger(max)||max<0)throw new Error('Некорректный предел объектов');
  return Math.floor(random()*(max+1));
}

/** Fisher–Yates: без повторений, пока есть уникальные варианты. */
export function pickUnique(pool,count,random) {
  if(!Array.isArray(pool)||!Number.isInteger(count)||count<0)throw new Error('Неверный пул объектов');
  const options=[...new Set(pool)];
  for(let i=options.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [options[i],options[j]]=[options[j],options[i]];
  }
  return options.slice(0,count);
}

export function validateLayout(level) {
  const issues=[];
  if(level.obstacles.length>3)issues.push('Больше трёх препятствий');
  if(level.platforms.length>2)issues.push('Больше двух платформ');
  if(new Set(level.obstacles.map(o=>o.kind)).size!==level.obstacles.length)
    issues.push('Повторение типа препятствия');
  if(new Set(level.platforms.map(p=>p.kind)).size>1)
    issues.push('На одной карте платформы разных типов');
  if(new Set(level.platforms.map(p=>p.width)).size>1)
    issues.push('На одной карте платформы разной ширины');
  if(level.location!==undefined){
    const theme=biomeFor(level.location);
    if(level.obstacles.some(o=>!theme.obstacles.includes(o.kind)))issues.push('Преграда не соответствует локации');
    if(level.platforms.some(p=>!theme.platforms.includes(p.kind)))issues.push('Платформа не соответствует локации');
  }
  for(let i=0;i<level.platforms.length;i++){
    const p=level.platforms[i];
    if(!PLATFORM_POOL.includes(p.kind)||p.x<190||p.x+p.width>1110||
      p.width<110||p.width>165||p.y<310||p.y>340)
      issues.push(`Платформа ${i} вне допустимых размеров`);
    for(let j=i+1;j<level.platforms.length;j++){
      const q=level.platforms[j];
      if(!(p.x+p.width+90<q.x||q.x+q.width+90<p.x))
        issues.push(`Платформы ${i}/${j} слишком близко`);
    }
  }
  for(let i=0;i<level.obstacles.length;i++){
    const o=level.obstacles[i];
    if(!OBSTACLE_POOL.includes(o.kind)||o.x<290||o.x+o.width>1120||
      o.width<20||o.width>55||o.height<15||o.height>36)
      issues.push(`Препятствие ${i} вне допустимых размеров`);
    for(let j=i+1;j<level.obstacles.length;j++){
      const q=level.obstacles[j];
      if(Math.abs(o.x-q.x)<180)issues.push(`Препятствия ${i}/${j} слишком близко`);
    }
    for(let j=0;j<level.platforms.length;j++){
      const p=level.platforms[j];
      if(!(o.x+o.width<p.x-45||o.x>p.x+p.width+45))
        issues.push(`Препятствие ${i} перекрывает платформу ${j}`);
    }
  }
  return {valid:issues.length===0,issues};
}

export function buildLevel(grid, username='0w1Max', seedOverride) {
  if (!Array.isArray(grid) || grid.length<53 || grid.length>55 || grid.some(w=>!Array.isArray(w)||w.length!==7)) {
    throw new Error('Для карты нужен календарь из 53–55 недель по 7 дней');
  }
  const seed=seedOverride ?? hash32(username+'|'+grid.flat().map(d=>d?`${d.date}:${d.count}:${d.level}`:'-').join('|'));
  const location=selectLocation(seed);
  const biome=biomeFor(location);
  const rand=seededRandom(seed);
  const platformCount=randomCount(rand,2);
  const obstacleCount=randomCount(rand,3);
  // Одна общая модель и ширина для всех платформ этой карты.
  const platformKind=platformCount ? biome.platforms[Math.floor(rand()*biome.platforms.length)] : null;
  const platformWidth=platformCount ? 116+Math.floor(rand()*34) : null;
  const obstacleTypes=pickUnique(biome.obstacles,obstacleCount,rand);
  // Две непересекающиеся зоны, доступные для прыжка с земли.
  const zones=pickUnique([0,1],platformCount,rand).sort();
  const platforms=zones.map((zone,i)=>({
    kind:platformKind,
    x:Math.round((zone===0?255:735)+rand()*80),
    width:platformWidth,
    y:317+Math.floor(rand()*16)
  }));
  const sizes={
    'jungle-rock':[34,27], 'fallen-log':[44,19], 'sandbags':[45,25],
    'stone-ruin':[32,32], 'tree-stump':[31,30], 'supply-crate':[34,27]
  };
  const obstacles=[];
  for(const kind of obstacleTypes){
    const [width,height]=sizes[kind];
    // Левый участок x < 290 оставлен свободным для заключительного патруля.
    // 50 воспроизводимых кандидатов: при нехватке места объект НЕ добавляем.
    for(let attempt=0;attempt<50;attempt++){
      const x=290+Math.floor(rand()*780);
      const o={kind,x,width,height};
      if(obstacles.some(prev=>Math.abs(prev.x-x)<180))continue;
      if(platforms.some(p=>!(x+width<p.x-45||x>p.x+p.width+45)))continue;
      obstacles.push(o);
      break;
    }
  }
  const level={seed,location,obstacles,platforms};
  const checked=validateLayout(level);
  if(!checked.valid)throw new Error('Некорректная карта: '+checked.issues.join('; '));
  return level;
}

/**
 * Прочность зависит только от уровня активности GitHub.
 * NONE=0, Q1/Q2=1, Q3=2, Q4=3. Исходные данные не мутируем.
 */
export function hpForLevel(level) {
  if (!Number.isInteger(level) || level < 0 || level > 4) throw new Error('Недопустимый уровень клетки');
  return level === 0 ? 0 : level >= 3 ? level - 1 : 1;
}

function allTargets(grid) {
  const out=[];
  for(let col=0;col<grid.length;col++)for(let row=0;row<7;row++){
    const cell=grid[col][row];
    if(!cell || cell.level===0)continue;
    out.push({
      col,row,key:`${col}:${row}`,level:cell.level,maxHp:hpForLevel(cell.level),
      x:WORLD.gridX+col*WORLD.step+WORLD.cell/2,
      y:WORLD.gridY+row*WORLD.step+WORLD.cell/2
    });
  }
  return out;
}

/**
 * Столкновение линии полёта с первой живой клеткой.
 * Проверяется реальный прямоугольник клетки, а не только её центр/столбец.
 */
export function firstLiveIntersection(origin, end, live) {
  const dx=end.x-origin.x,dy=end.y-origin.y;
  let nearest=null,bestT=Infinity;
  for(const cell of live.values()){
    if(cell.hp<=0)continue;
    const half=WORLD.cell/2;
    const left=cell.x-half,right=cell.x+half,top=cell.y-half,bottom=cell.y+half;
    let t0=0,t1=1;
    for(const [p,v,min,max] of [[origin.x,dx,left,right],[origin.y,dy,top,bottom]]){
      if(Math.abs(v)<1e-9){
        if(p<min||p>max){t0=2;break;}
      } else {
        let a=(min-p)/v,b=(max-p)/v;
        if(a>b)[a,b]=[b,a];
        t0=Math.max(t0,a);t1=Math.min(t1,b);
        if(t0>t1)break;
      }
    }
    if(t0<=t1 && t0>=0 && t0<bestT){
      bestT=t0;nearest={key:cell.key,t:t0,col:cell.col,row:cell.row};
    }
  }
  return nearest;
}

/**
 * Единственный источник геометрии дула. Поворот верхней части спрайта aim
 * относительно опорной точки применяется и к стволу, и к началу траектории.
 * Угол tilt — градусы, положительный наклон опускает ствол в сторону движения.
 */
export function aimGeometry(playerX,footY,facing,tilt=0){
  if(facing!=='left'&&facing!=='right')throw new Error('Некорректное направление персонажа');
  const rad=tilt*Math.PI/180,co=Math.cos(rad),si=Math.sin(rad);
  const rotate=(x,y)=>({
    x:WORLD.aimPivotX+(x-WORLD.aimPivotX)*co-(y-WORLD.aimPivotY)*si,
    y:WORLD.aimPivotY+(x-WORLD.aimPivotX)*si+(y-WORLD.aimPivotY)*co
  });
  const tip=rotate(WORLD.aimTipX,WORLD.aimTipY),grip=rotate(WORLD.aimGripX,WORLD.aimGripY);
  const dir=facing==='right'?1:-1;
  const offset=x=>facing==='right'?x:WORLD.spriteSize-x;
  return {
    origin:{x:playerX+offset(tip.x),y:footY-WORLD.spriteSize+tip.y},
    barrel:{x:dir*(tip.x-grip.x),y:tip.y-grip.y},
    tilt
  };
}

function chooseFiringPosition(target,pass,level,currentX,live){
  const footCandidates=[];
  for(const groundY of [WORLD.groundY,...level.platforms.map(p=>p.y)]){
    for(const facing of ['right','left']){
      // Смещаем плечо вместе с оружием; SVG повторяет тот же поворот.
      for(const tilt of [-23,-19,-15,-11,-7,-3,0,3,7,11,14]){
        const pose=aimGeometry(0,groundY,facing,tilt);
        const vertical=pose.origin.y-target.y;
        if(vertical<12||pose.barrel.y>=-2)continue;
        const run=vertical*Math.abs(pose.barrel.x/pose.barrel.y);
        const dir=facing==='right'?1:-1;
        const x=target.x-pose.origin.x-dir*run;
        if(x<6||x>1110)continue;
        const muzzle=aimGeometry(x,groundY,facing,tilt);
        if(Math.abs((target.x-muzzle.origin.x)*muzzle.barrel.y-
          (target.y-muzzle.origin.y)*muzzle.barrel.x)>0.01)continue;
        const onPlatform=level.platforms.find(p=>p.y===groundY);
        if(onPlatform && !(x+38>=onPlatform.x+14&&x+38<=onPlatform.x+onPlatform.width-14))continue;
        const blocking=level.obstacles.some(o=>groundY===WORLD.groundY && x+8<o.x+o.width+5 && x+70>o.x-5);
        if(blocking)continue;
        if(firstLiveIntersection(muzzle.origin,target,live)?.key!==target.key)continue;
        footCandidates.push({x,footY:groundY,facing,tilt,platform:onPlatform??null,
          cost:Math.abs(x-currentX)*.07+Math.abs(tilt)*.55+(facing!==pass?13:0)+(onPlatform?-5:0)});
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
  const live=new Map(targets.map(cell=>[cell.key,{...cell,hp:cell.maxHp}]));
  // Псевдослучайность привязана к seed карты + содержимому календаря.
  // Нет Math.random(): повторный запуск строит тот же маршрут и набор попаданий.
  const rand=seededRandom(hash32(`mission-v3|${level.seed}|`+
    targets.map(v=>`${v.key}:${v.maxHp}`).join('|')));
  // У каждого столбца собственная очередь: верхняя клетка открывается после
  // уничтожения всех живых клеток под ней. При этом сами столбцы НЕ сортируются
  // по рядам; следующий выстрел может быть в любом открытом столбце.
  const columns=Array.from({length:grid.length},()=>[]);
  for(const target of targets) columns[target.col].push(target);
  for(const cells of columns)cells.sort((a,b)=>b.row-a.row);
  let selectionIndex=0;
  const targetOrder=[];
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
    if(Math.abs(x-player.x)<.0001)return;
    const facing=x>player.x?'right':'left';
    const distance=Math.abs(x-player.x);
    const walking=distance<130 && rand()<.48;
    segment(walking?'walk':'run',distance/(walking?108:speed),x,player.footY,facing);
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
    if(Math.abs(destX-player.x)<.0001)return;
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
  function chooseNextTarget(){
    // По одному ближайшему к земле оставшемуся квадрату на столбец.
    // Отдельно от ограничения по столбцам проверяется реальный луч пули:
    // любой пересечённый живой квадрат делает кандидат недоступным.
    const frontier=columns.map(cells=>cells.find(c=>live.has(c.key))).filter(Boolean);
    if(!frontier.length) return null;
    // Ранжирование не по строкам, а по текущей окрестности бойца с шумом.
    // Редкие дальние кандидаты дают неожиданные развороты, но не вынуждают
    // бойца каждые несколько выстрелов пересекать всю карту.
    const ranked=frontier.map(target=>({target,
      nearby:Math.abs(target.x-(player.x+WORLD.spriteSize/2)) + rand()*210,
      lottery:rand()})).sort((a,b)=>a.nearby-b.nearby);
    const shortlist=ranked.slice(0,10).map(v=>v.target);
    const distant=ranked.slice(10).sort((a,b)=>a.lottery-b.lottery);
    shortlist.push(...distant.slice(0,4).map(v=>v.target));
    const options=[];
    const budget=shortlist.length;
    const tryCandidate=(target)=>{
      let dest;
      try{dest=chooseFiringPosition(target,player.facing,level,player.x,live);}
      catch(error){if(!/^Нельзя прицелиться/.test(error.message))throw error;return;}
      const cost=Math.abs(dest.x-player.x)+(dest.footY===player.footY?0:110);
      // Местные цели немного предпочтительнее, но удалённые тоже возможны.
      // Диапазон весов не допускает вырождения в полностью жадный обход.
      const weight=.045+5*Math.exp(-cost/125)+rand()*.07;
      options.push({target,dest,weight});
    };
    for(let i=0;i<budget;i++)tryCandidate(shortlist[i]);
    // Если случайная выборка вся перекрыта, ищем среди остальных.
    if(!options.length)for(const candidate of ranked.slice(10+4))tryCandidate(candidate.target);
    if(!options.length)throw new Error('Не найдено ни одной доступной цели при живых клетках');
    const total=options.reduce((v,o)=>v+o.weight,0);
    let ticket=rand()*total;
    for(const choice of options){ticket-=choice.weight;if(ticket<=0)return choice;}
    return options.at(-1);
  }

  while(live.size){
    // Короткие свободные пробежки нарушают ритм «переход-выстрел»,
    // а переходы через препятствия остаются под контролем moveGround.
    if(selectionIndex>0 && selectionIndex%7===0 && rand()<.32 &&
      player.footY===WORLD.groundY){
      const direction=rand()<.5?-1:1;
      const x=safeGroundLanding(clamp(player.x+direction*(45+rand()*105),5,1110),direction);
      moveGround(x);
    }
    const choice=chooseNextTarget();
    if(!choice)throw new Error('Исчезла доступная цель при незавершённой миссии');
    const {target,dest}=choice;
    moveTo(dest);
    if(player.facing!==dest.facing)segment('turn',.045,player.x,player.footY,dest.facing);
    segment('aim',.052);
    const geometry=aimGeometry(player.x,player.footY,player.facing,dest.tilt);
    const origin={x:round(geometry.origin.x),y:round(geometry.origin.y)};
    if(firstLiveIntersection(origin,target,live)?.key!==target.key)
      throw new Error(`Траектория перекрыта перед выстрелом: ${target.key}`);
    // Важно: цель остаётся живой до последнего попадания.
    const distance=Math.hypot(origin.x-target.x,origin.y-target.y);
    const state=live.get(target.key);
    if(!state || state.hp!==target.maxHp)throw new Error(`Неверное состояние цели: ${target.key}`);
    for(let hit=1;hit<=target.maxHp;hit++){
      const start=round(t);
      const impact=round(start+distance/780);
      const hpBefore=state.hp;
      state.hp--;
      shots.push({...target,origin,facing:player.facing,tilt:dest.tilt,start,impact,
        playerX:round(player.x),footY:round(player.footY),
        hitIndex:hit,hpBefore,hpAfter:state.hp,finalHit:state.hp===0});
      segment('shoot',Math.max(.105,impact-start+.018));
    }
    if(state.hp!==0)throw new Error(`Цель не уничтожена: ${target.key}`);
    live.delete(target.key);
    if(used.has(target.key))throw new Error(`Повторная цель: ${target.key}`);
    used.add(target.key);
    targetOrder.push(target.key);
    selectionIndex++;
  }
  const lastImpact=shots.reduce((v,s)=>Math.max(v,s.impact),t);
  if(t<lastImpact)segment('aim',lastImpact-t);
  // Победная поза не телепортирует бойца: после неё он реально проходит
  // остаток уровня, перепрыгивая препятствия и спускаясь с платформ.
  const finishAt=round(t);
  segment('victory',.78);
  const returnStart=round(t);
  const spawnX=90;
  moveTo({x:spawnX,footY:WORLD.groundY,platform:null});
  // Если финиш оказался рядом со стартом, устраиваем короткое патрулирование
  // с прыжком на безопасном левом участке, вместо искусственного ожидания.
  if(t-returnStart<1.5){
    moveGround(165);
    leapTo(215,WORLD.groundY,'hop');
    moveGround(spawnX);
  }
  if(Math.abs(player.x-spawnX)>.0001 || player.footY!==WORLD.groundY)
    throw new Error('Боец не вернулся на старт перед повтором');
  if(player.facing!=='right')segment('turn',.22,spawnX,WORLD.groundY,'right');
  // Стартовый и заключительный кадры совпадают (x, y, направление, idle).
  segment('idle',.85,spawnX,WORLD.groundY,'right');
  const duration=round(t);
  const restoreStart=round(returnStart+.12);
  const restoreEnd=round(duration-.12);
  if(restoreEnd-restoreStart<.6)
    throw new Error('Недостаточно времени для плавного восстановления поля');
  if(duration>720)throw new Error(`Непрактичная длительность анимации: ${duration}с`);
  if(used.size!==targets.length || live.size!==0)
    throw new Error(`Не все квадраты обработаны: ${used.size}/${targets.length}`);
  const totalHp=targets.reduce((sum,cell)=>sum+cell.maxHp,0);
  if(shots.length!==totalHp)throw new Error(`Недостаточно попаданий: ${shots.length}/${totalHp}`);
  return {duration,segments,shots,jumps,level,targets:targets.length,totalHp,targetOrder,
    initial:{x:spawnX,footY:WORLD.groundY,facing:'right'},lastImpact,finishAt,
    returnStart,restoreStart,restoreEnd};
}