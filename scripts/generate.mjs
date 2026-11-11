#!/usr/bin/env node
/**
 * Автономный SVG-генератор графика GitHub в стиле 8-bit run-and-gun.
 * Не использует сторонние npm-пакеты, отправляет запрос только к GitHub API.
 * Ошибки API приводят к ненулевому коду выхода: фиктивные данные не публикуются.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevel, createMission, WORLD, aimGeometry } from './mission.mjs';
import { renderLocation } from './locations.mjs';
import {desertDimensions} from './canyon-scene.mjs';
import {jungleDimensions} from './jungle-scene.mjs';
import {volcanoDimensions} from './volcano-scene.mjs';
import { levelMarkup } from './level-art.mjs';
import {soldierColor} from './biomes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USERNAME = process.env.GITHUB_USER || '0w1Max';
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const COLORS = ['#a8bcc4', '#166f43', '#22a857', '#3dd96b', '#b7ff63'];
const {gridX:GRID_X,gridY:GRID_Y,step:STEP,cell:CELL}=WORLD;

const escapeXml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const round = x => Math.round(x*10000)/10000;
const fmt = n => Number(n.toFixed(6)).toString();
function keyPct(t,duration) {return fmt(Math.max(0,Math.min(1,t/duration)));}
function animationAttr(name,keys,values,duration,mode='discrete') {
  return `<animate attributeName="${name}" calcMode="${mode}" keyTimes="${keys.map(t=>keyPct(t,duration)).join(';')}" values="${values.join(';')}" dur="${fmt(duration)}s" repeatCount="indefinite"/>`;
}
function timeline(times,values,duration){
  if(times.length!==values.length || times[0]!==0 || times.at(-1)!==duration)throw new Error('Некорректная шкала анимации');
  return {times,values};
}

export async function fetchCalendar(username, token) {
  if (!/^[A-Za-z\d-]{1,39}$/.test(username)) throw new Error('Некорректное имя GitHub пользователя');
  if (!token) throw new Error('Для настоящего календаря нужен GITHUB_TOKEN (или GH_TOKEN)');
  const query = `query($login:String!){ user(login:$login){ contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${token}`, 'Content-Type':'application/json', 'Accept':'application/vnd.github+json', 'User-Agent':'0w1max-commando-activity-generator'},
      body: JSON.stringify({query,variables:{login:username}}), signal:controller.signal
    });
  } finally { clearTimeout(timeout); }
  if (!response.ok) throw new Error(`Ошибка GitHub GraphQL: HTTP ${response.status}`);
  const data = await response.json();
  if (data.errors?.length) throw new Error(`GitHub GraphQL вернул ${data.errors.length} ошибок`);
  const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks) || !weeks.length) throw new Error('GitHub вернул пустой календарь');
  return weeks;
}

export function normalizeWeeks(weeks) {
  if (!Array.isArray(weeks) || weeks.length < 1 || weeks.length > 55) throw new Error('Неверное количество недель');
  const normalized = Array.from({length:53},()=>Array(7).fill(null));
  const last = weeks.slice(-53);
  const pad = 53-last.length;
  for (let c=0; c<last.length; c++) {
    const week=last[c];
    if (!Array.isArray(week?.contributionDays)) throw new Error('Некорректная структура недели');
    for (const d of week.contributionDays) {
      const dow=new Date(`${d.date}T12:00:00Z`).getUTCDay();
      if (!Number.isInteger(d.contributionCount) || d.contributionCount < 0 || !LEVELS.includes(d.contributionLevel) || !Number.isFinite(dow)) throw new Error('Некорректный день календаря');
      normalized[c+pad][dow]={date:d.date,count:d.contributionCount,level:LEVELS.indexOf(d.contributionLevel)};
    }
  }
  return normalized;
}

function gridMarkup(grid,mission,emptyBorder) {
  const impacts=new Map();
  for(const shot of mission.shots){
    if(!impacts.has(shot.key))impacts.set(shot.key,[]);
    impacts.get(shot.key).push(shot);
  }
  let output='';
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
    const cell=grid[col][row];if(!cell)continue;
    const key=`${col}:${row}`,hits=impacts.get(key)??[];
    const x=GRID_X+col*STEP,y=GRID_Y+row*STEP;
    const title=`${cell.date}: ${cell.count} contributions`;
    let child='';
    if(hits.length){
      // Повреждение и исчезновение — мгновенные события; восстановление
      // происходит плавно по столбцам, пока боец возвращается к старту.
      const fade=.3;
      const range=mission.restoreEnd-mission.restoreStart-fade;
      const share=(col+row*.04)/(52+.24);
      const at=round(mission.restoreStart+share*range);
      const end=round(at+fade);
      const keys=[0],opacity=['1'];
      for(const shot of hits){
        keys.push(round(shot.impact-.001),shot.impact);
        opacity.push(opacity.at(-1),shot.finalHit?'0':'1');
      }
      keys.push(at,end,mission.duration);
      opacity.push('0','1','1');
      // Интерполяция между совпадающими состояниями эквивалентна удержанию:
      // 0.001 секунды на разрушение; 0.3 секунды на восстановление.
      child+=animationAttr('opacity',keys,opacity,mission.duration,'linear');
      const shadeKeys=[0,...hits.map(h=>h.impact),at,mission.duration];
      const shades=[COLORS[cell.level],...hits.map(h=>h.finalHit?COLORS[1]:COLORS[Math.min(cell.level,h.hpAfter+1)]),COLORS[cell.level],COLORS[cell.level]];
      child+=animationAttr('fill',shadeKeys,shades,mission.duration);
    }
    const fillOpacity = cell.level === 0 ? "0.22" : "1";
    const border=cell.level===0 ? emptyBorder : '';
    output+=`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${COLORS[cell.level]}" fill-opacity="${fillOpacity}"${border}><title>${escapeXml(title)}</title>${child}</rect>`;
  }
  return output;
}

/** Общие пиксельные формы, которые повторно используются каждым выстрелом. */
function effectsDefs(){
  return `<g id="fx-muzzle" shape-rendering="crispEdges">
    <path d="M0 -2h5v-3h5v-3h4v5h5v6h-6v5h-4v-4H5v-2H0Z" fill="#ff9e20"/>
    <path d="M0 -1h7v-2h5v2h4v3h-5v2H7V2H0Z" fill="#fff4a8"/>
    <rect x="17" y="-1" width="4" height="2" fill="#ffd064"/>
  </g>
  <g id="fx-impact-damage" shape-rendering="crispEdges">
    <path d="M-2 -10h4v7h7v5H2v7h-4V2h-7v-5h7z" fill="#fff3a8"/>
    <rect x="-12" y="-3" width="4" height="4" fill="#ff9b2c"/>
    <rect x="8" y="-8" width="4" height="4" fill="#ff9b2c"/>
    <rect x="5" y="8" width="3" height="3" fill="#4ae78a"/>
  </g>
  <g id="fx-impact-break" shape-rendering="crispEdges">
    <rect x="-6" y="-6" width="12" height="12" fill="#fff1a0"/>
    <path d="M-3 -12h6v6h8v6H5v6h-10V0h-7v-6h9z" fill="#ff9b2c"/>
    <rect x="-18" y="-12" width="5" height="5" fill="#ffd75e"/>
    <rect x="13" y="-11" width="6" height="5" fill="#ffcd48"/>
    <rect x="-19" y="9" width="5" height="5" fill="#ec6b2e"/>
    <rect x="12" y="13" width="5" height="5" fill="#ec6b2e"/>
    <rect x="-5" y="-22" width="4" height="5" fill="#68e887"/>
    <rect x="2" y="18" width="5" height="4" fill="#68e887"/>
    <rect x="-24" y="-2" width="5" height="4" fill="#78c957"/>
    <rect x="19" y="3" width="5" height="4" fill="#78c957"/>
  </g>`;
}

function bulletMarkup(mission){
  const duration=mission.duration;
  return mission.shots.map((s,i)=>{
    const dx=s.x-s.origin.x,dy=s.y-s.origin.y,dist=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx)*180/Math.PI;
    const opacity=animationAttr('opacity',
      [0,Math.max(0,s.start-.0004),s.start,s.impact,Math.min(duration,s.impact+.001),duration],
      ['0','0','1','1','0','0'],duration);
    const slide=`<animateTransform attributeName="transform" type="translate" calcMode="linear"
      keyTimes="${[0,s.start,s.impact,duration].map(t=>keyPct(t,duration)).join(';')}"
      values="0 0;0 0;${fmt(dist)} 0;${fmt(dist)} 0" dur="${fmt(duration)}s" repeatCount="indefinite"/>`;
    const flash=animationAttr('opacity',
      [0,Math.max(0,s.start-.0004),s.start,Math.min(duration,s.start+.048),duration],
      ['0','0','1','0','0'],duration,'linear');
    const fxLength=s.finalHit?.24:.105;
    const impactTimes=[0,Math.max(0,s.impact-.0004),s.impact,Math.min(duration,s.impact+fxLength),duration];
    const impactOpacity=animationAttr('opacity',impactTimes,['0','0','1','0','0'],duration,'linear');
    const stages=[0,Math.max(0,s.impact-.0004),s.impact,
      Math.min(duration,s.impact+fxLength*.28),Math.min(duration,s.impact+fxLength),duration];
    const scales=s.finalHit?['.2','.2','.45','1','1.5','1.5']:['.4','.4','.65','1','1.15','1.15'];
    const scaleAnimation=`<animateTransform attributeName="transform" type="scale" calcMode="linear"
      keyTimes="${stages.map(t=>keyPct(t,duration)).join(';')}"
      values="${scales.join(';')}" dur="${fmt(duration)}s" repeatCount="indefinite"/>`;
    return `<g id="shot-${i+1}" aria-label="Прицельный выстрел ${i+1}">
      <g id="shot-${i+1}-muzzle" transform="translate(${fmt(s.origin.x)} ${fmt(s.origin.y)}) rotate(${fmt(angle)})">
        <g class="muzzle-flash" opacity="0">${flash}<use href="#fx-muzzle"/></g>
        <g class="bullet" opacity="0">${opacity}
          <g>${slide}<rect x="-12" y="-2" width="9" height="4" fill="#ffd96d"/>
            <rect x="-3" y="-2" width="4" height="4" fill="#fff4ac"/></g>
        </g>
      </g>
      <g id="shot-${i+1}-impact" transform="translate(${fmt(s.x)} ${fmt(s.y)})" opacity="0">${impactOpacity}
        <g>${scaleAnimation}<use href="#fx-impact-${s.finalHit?'break':'damage'}"/></g>
      </g>
    </g>`;
  }).join('');
}

function spriteDefs(sprites,location) {
  let out='';
  for(const [name,colors] of Object.entries(sprites)) {
    out+=`<g id="soldier-${name}" shape-rendering="crispEdges">`;
    for(const [color,path] of Object.entries(colors))out+=`<path d="${path}" fill="${soldierColor(color,location)}"/>`;
    out+='</g>';
  }
  return out;
}

function playerMarkup(mission) {
  const d=mission.duration;
  const keys=[0],moves=[`${mission.initial.x} ${mission.initial.footY-WORLD.spriteSize}`];
  function add(t,x,y){
    const next=Math.min(t,d);
    if(next<=keys.at(-1))return;
    keys.push(round(next));moves.push(`${fmt(x)} ${fmt(y-WORLD.spriteSize)}`);
  }
  for(const s of mission.segments) {
    if(['jump','hop','drop'].includes(s.kind)) {
      for(let i=1;i<=12;i++) {
        const u=i/12;
        const x=s.x0+(s.x1-s.x0)*u;
        const y=s.y0+(s.y1-s.y0)*u-Math.sin(u*Math.PI)*57;
        add(s.start+(s.end-s.start)*u,x,y);
      }
    } else add(s.end,s.x1,s.y1);
  }
  // Не подменять последнюю позицию стартовой: планировщик ОБЯЗАН
  // физически завершить маршрут там, где начинается новый цикл.
  if(keys.at(-1)!==d)throw new Error('Маршрут бойца не доходит до конца SVG');
  const startPoint=`${fmt(mission.initial.x)} ${fmt(mission.initial.footY-WORLD.spriteSize)}`;
  if(moves.at(-1)!==startPoint)throw new Error('Анимация не замкнута: скачок позиции на стыке');
  const motion=`<animateTransform attributeName="transform" type="translate" calcMode="linear" keyTimes="${keys.map(t=>keyPct(t,d)).join(';')}" values="${moves.join(';')}" dur="${fmt(d)}s" repeatCount="indefinite"/>`;
  // Кадры переключаются только при событиях; внутри run — 4 фазы шага.
  const marks=[{t:0,frame:'idle-a',face:'right'}];
  function push(t,frame,face){
    const t0=round(t);
    if(t0>marks.at(-1).t && t0<d) marks.push({t:t0,frame,face});
    else if(t0===marks.at(-1).t) marks[marks.length-1]={t:t0,frame,face};
  }
  for(const s of mission.segments) {
    const face=s.facing;
    if(s.kind==='run'||s.kind==='walk') {
      const frames=['run-a','run-b','run-c','run-d'];
      let n=0;
      for(let t=s.start;t<s.end;t+=(s.kind==='walk'?.18:.115))push(t,frames[n++%4],face);
    } else if(['jump','hop','drop'].includes(s.kind))push(s.start,'jump',face);
    else if(s.kind==='shoot')push(s.start,'aim',face); // без второго запечённого всполоха
    else if(s.kind==='aim')push(s.start,'aim',face);
    else push(s.start,'idle-a',face);
  }
  push(d-.02,'idle-a','right');
  marks.push({t:d,frame:'idle-a',face:'right'});
  // Поворот позы aim по тем же углам, которыми планировщик рассчитал луч.
  const poseMarks=[{t:0,tilt:0}];
  for(const shot of mission.shots){
    const at=round(Math.max(0,shot.start-.052));
    if(at>poseMarks.at(-1).t)poseMarks.push({t:at,tilt:shot.tilt});
    else if(at===poseMarks.at(-1).t)poseMarks[poseMarks.length-1]={t:at,tilt:shot.tilt};
  }
  poseMarks.push({t:d,tilt:0});
  const tiltAnimation=`<animateTransform attributeName="transform" type="rotate" calcMode="discrete"
    keyTimes="${poseMarks.map(m=>keyPct(m.t,d)).join(';')}"
    values="${poseMarks.map(m=>`${fmt(m.tilt)} ${WORLD.aimPivotX} ${WORLD.aimPivotY}`).join(';')}"
    dur="${fmt(d)}s" repeatCount="indefinite"/>`;
  const frames=['idle-a','run-a','run-b','run-c','run-d','jump','aim'];
  let output='';
  for(const face of ['right','left']){
    const content=frames.map(name=>{
      const vals=marks.map(m=>(m.frame===name&&m.face===face)?'1':'0');
      const art=name==='aim' ? `<use href="#soldier-aim" clip-path="url(#aim-legs)"/>
        <g>${tiltAnimation}<use href="#soldier-aim" clip-path="url(#aim-upper)"/></g>`
        : `<use href="#soldier-${name}"/>`;
      return `<g opacity="${vals[0]}">${art}${animationAttr('opacity',marks.map(m=>m.t),vals,d)}</g>`;
    }).join('');
    if(face==='right')output+=`<g>${content}</g>`;
    else output+=`<g transform="translate(78 0) scale(-1 1)">${content}</g>`;
  }
  return `<g id="blue-commando" transform="translate(${startPoint})" aria-label="Боец с синей повязкой">${motion}${output}</g>`;
}

export function renderSvg({weeks,sprites,username,fixture=false,seedOverride}) {
  const grid=normalizeWeeks(weeks);
  const level=buildLevel(grid,username,seedOverride);
  const mission=createMission(grid,level);
  const daylight = level.location === 'desert';
  const labelFill = daylight ? '#172b45' : '#d0e4e8';
  const titleFill = daylight ? '#172b45' : '#f2f7fa';
  const subtitleFill = daylight ? '#233b52' : '#d5e8e9';
  const pixelViewport = level.location === 'desert' ? desertDimensions() :
    level.location === 'volcano' ? volcanoDimensions() :
    level.location === 'jungle' ? jungleDimensions() : null;
  const scaleMode = pixelViewport && pixelViewport.displayHeight !== pixelViewport.viewHeight
    ? ' preserveAspectRatio="none"' : '';
  const viewport = pixelViewport
    ? `width="${WORLD.width}" height="${pixelViewport.displayHeight}" viewBox="0 0 ${WORLD.width} ${pixelViewport.viewHeight}"${scaleMode}`
    : `width="${WORLD.width}" height="${WORLD.height}" viewBox="0 0 ${WORLD.width} ${WORLD.height}"`;
  const header=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ${viewport} role="img" aria-labelledby="title desc"><title id="title">${escapeXml(username)} — Commando Activity</title><desc id="desc">Боец в синей повязке непредсказуемо патрулирует процедурный уровень, перепрыгивает препятствия, запрыгивает на платформы и стреляет в клетки календаря активности GitHub. ${fixture?'Демонстрационные данные.':'Календарь получен через API GitHub.'}</desc>`;
  const scene=renderLocation(level.location,level.seed);
  const defs=`<defs>
    <linearGradient id="contribution-scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05111e" stop-opacity=".93"/>
      <stop offset=".75" stop-color="#071927" stop-opacity=".82"/>
      <stop offset=".88" stop-color="#071927" stop-opacity=".70"/>
      <stop offset="1" stop-color="#071927" stop-opacity="0"/>
    </linearGradient>
    ${spriteDefs(sprites,level.location)}${effectsDefs()}
    <clipPath id="aim-upper"><rect x="-50" y="-50" width="180" height="93"/></clipPath>
    <clipPath id="aim-legs"><rect x="-50" y="43" width="180" height="100"/></clipPath>
  </defs>`;
  const months=['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
  let monthText=''; let prev=-1;
  for(let col=0;col<53;col++){
    const day=grid[col].find(Boolean);if(!day)continue;
    const m=Number(day.date.slice(5,7))-1;
    if(m!==prev&&col<50){monthText+=`<text x="${GRID_X+col*STEP}" y="${GRID_Y-10}" fill="${labelFill}" font-family="monospace" font-size="13">${months[m]}</text>`;prev=m;}
  }
  // Затемнение с мягкой границей вместо толстой HUD-рамки: поле — часть игрового мира.
  const scrim = pixelViewport ? '' : '<rect id="contribution-shade" x="0" y="0" width="1200" height="241" fill="url(#contribution-scrim)"/>';
  const emptyBorder = daylight ? ' stroke="#172b45" stroke-opacity=".30"' :
    pixelViewport ? ' stroke="#110c11" stroke-opacity=".75"' : '';
  const top=`<g id="contribution-overlay">${scrim}<text x="72" y="23" font-family="monospace" font-size="18" font-weight="bold" fill="${titleFill}">${escapeXml(username)}<tspan font-weight="normal" fill="${subtitleFill}"> / GITHUB CONTRIBUTIONS</tspan></text>${monthText}<g id="contribution-grid">${gridMarkup(grid,mission,emptyBorder)}</g></g>`;
  const missionEnd=mission.duration;
  const finishedAt=round(Math.min(missionEnd-.5,mission.finishAt+.06));
  const fadeBegin=round(Math.min(mission.restoreStart+.28,missionEnd-.38));
  const fadeEnd=round(Math.min(fadeBegin+.55,missionEnd-.10));
  const missionComplete=animationAttr('opacity',
    [0,round(finishedAt-.001),finishedAt,fadeBegin,fadeEnd,missionEnd],['0','0','1','1','0','0'],missionEnd,'linear');
  const done=`<g id="mission-complete" opacity="0">${missionComplete}<rect x="410" y="230" width="380" height="60" rx="4" fill="#06151f" fill-opacity=".9" stroke="#86efac" stroke-width="2"/><text x="600" y="268" fill="#b5ff97" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">MISSION COMPLETE</text></g>`;
  const indicator=fixture?`<text x="1118" y="20" text-anchor="end" font-family="monospace" font-size="13" fill="#fcd34d">DEMO / TEST DATA</text>`:'';
  return `${header}${scene}${defs}${top}${indicator}${levelMarkup(level)}${playerMarkup(mission)}${bulletMarkup(mission)}${done}</svg>\n`;
}

async function main() {
  const args=process.argv.slice(2);
  const getArg = (flag,defaultValue) => {const index=args.indexOf(flag);return index===-1?defaultValue:args[index+1];};
  const demo=args.includes('--demo');
  const out=resolve(getArg('--output', resolve(ROOT,'generated','commando-activity.svg')));
  const sprites=JSON.parse(gunzipSync(Buffer.from((await readFile(resolve(ROOT,'assets','sprites.json.gz.b64'),'utf8')).trim(),'base64')).toString('utf8'));
  const weeks=demo ? JSON.parse(gunzipSync(Buffer.from((await readFile(resolve(ROOT,'fixtures','demo-calendar.json.gz.b64'),'utf8')).trim(),'base64')).toString('utf8')).weeks : await fetchCalendar(USERNAME,process.env.GITHUB_TOKEN||process.env.GH_TOKEN);
  // В CI каждый новый запуск создаёт новую карту. COMMANDO_MAP_SEED позволяет воспроизвести её.
  const rawSeed=process.env.COMMANDO_MAP_SEED ?? process.env.GITHUB_RUN_ID;
  let seedOverride;
  if(rawSeed!==undefined){
    if(!/^\d+$/.test(rawSeed))throw new Error('COMMANDO_MAP_SEED должен быть неотрицательным целым числом');
    seedOverride=Number(BigInt(rawSeed)&0xffffffffn);
  } else {
    const {randomInt}=await import('node:crypto');
    seedOverride=randomInt(0,4294967296);
  }
  const svg=renderSvg({weeks,sprites,username:USERNAME,fixture:demo,seedOverride});
  await mkdir(dirname(out),{recursive:true});
  await writeFile(out,svg,'utf8');
  console.log(`SVG создан: ${out} (${Buffer.byteLength(svg)} байт, ${demo?'демо':'реальные данные'})`);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{ console.error(`ОШИБКА: ${error.message}`);process.exitCode=1;});
}