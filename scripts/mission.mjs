/**
 * Детерминированный планировщик игрового уровня для SVG README.
 * Только вычисления: данные GitHub и побочные эффекты остаются за генератором.
 */
export const WORLD = Object.freeze({
  width: 1200, height: 430, groundY: 374, spriteSize: 78,
  gridX: 72, gridY: 76, step: 20, cell: 17,
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
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
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
  const columns=Array.from({length:53},()=>[]);
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
  segment('clear',1.25);
  const duration=round(t);
  if(duration>720)throw new Error(`Непрактичная длительность анимации: ${duration}с`);
  if(used.size!==targets.length || live.size!==0)
    throw new Error(`Не все квадраты обработаны: ${used.size}/${targets.length}`);
  const totalHp=targets.reduce((sum,cell)=>sum+cell.maxHp,0);
  if(shots.length!==totalHp)throw new Error(`Недостаточно попаданий: ${shots.length}/${totalHp}`);
  return {duration,segments,shots,jumps,level,targets:targets.length,totalHp,targetOrder,initial:{x:90,footY:WORLD.groundY},lastImpact};
}
