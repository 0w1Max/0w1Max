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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USERNAME = process.env.GITHUB_USER || '0w1Max';
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const COLORS = ['#182b26', '#0f663c', '#1b984d', '#32c45d', '#9af345'];
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

async function fetchCalendar(username, token) {
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

function gridMarkup(grid,mission) {
  const impacts=new Map(); for(const s of mission.shots){if(!impacts.has(s.key))impacts.set(s.key,[]);impacts.get(s.key).push(s);}
  let output='';
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
    const d=grid[col][row];if(!d)continue;
    const key=`${col}:${row}`;
    const hits=impacts.get(key)??[];
    const x=GRID_X+col*STEP,y=GRID_Y+row*STEP;
    const title=`${d.date}: ${d.count} contributions`;
    // Урон уменьшает яркость, финальный выстрел скрывает квадрат.
    const keys=[0,...hits.map(s=>s.impact),mission.duration];
    const opacities=['1',...hits.map(s=>s.finalHit?'0':'1'),'1'];
    const shades=[COLORS[d.level],...hits.map(s=>s.finalHit?COLORS[1]:COLORS[Math.min(d.level,s.hpAfter+1)]),COLORS[d.level]];
    const child=hits.length ? animationAttr('opacity',keys,opacities,mission.duration)
      +animationAttr('fill',keys,shades,mission.duration) : '';
    output+=`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${COLORS[d.level]}"><title>${escapeXml(title)}</title>${child}</rect>`;
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

function spriteDefs(sprites) {
  let out='';
  for(const [name,colors] of Object.entries(sprites)) {
    out+=`<g id="soldier-${name}" shape-rendering="crispEdges">`;
    for(const [color,path] of Object.entries(colors))out+=`<path d="${path}" fill="${color}"/>`;
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
  if(keys.at(-1)!==d) add(d,mission.initial.x,mission.initial.footY);
  else {keys[keys.length-1]=d;moves[moves.length-1]=`${mission.initial.x} ${mission.initial.footY-WORLD.spriteSize}`;}
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
  return `<g id="blue-commando" aria-label="Боец с синей повязкой">${motion}${output}</g>`;
}

function levelMarkup(level) {
  const props=level.obstacles.map((o,i)=>{
    const y=WORLD.groundY-o.height;
    if(o.kind==='rock')return `<g id="obstacle-${i}" shape-rendering="crispEdges"><path d="M${o.x} ${WORLD.groundY}v-11h7v-${o.height-15}h11v-4h${o.width-23}v6h5v${o.height-13}h6v12z" fill="#7c8595" stroke="#29313b" stroke-width="3"/><path d="M${o.x+6} ${y+9}h11v5h-11z" fill="#afb7c4"/></g>`;
    return `<g id="obstacle-${i}" shape-rendering="crispEdges"><rect x="${o.x}" y="${y}" width="${o.width}" height="${o.height}" fill="#485b69" stroke="#16212e" stroke-width="3"/><path d="M${o.x+4} ${y+4}l${o.width-8} ${o.height-8}m0-${o.height-8}l-${o.width-8} ${o.height-8}" stroke="#b7c4cd" stroke-width="3"/></g>`;
  }).join('');
  const platforms=level.platforms.map((p,i)=>`<g id="platform-${i}" shape-rendering="crispEdges"><rect x="${p.x}" y="${p.y}" width="${p.width}" height="11" fill="#497a45" stroke="#102f2c" stroke-width="3"/><path d="M${p.x} ${p.y+2}h${p.width}" stroke="#b4ef63" stroke-width="4"/><rect x="${p.x+12}" y="${p.y+11}" width="6" height="${WORLD.groundY-p.y-11}" fill="#3f5361"/><rect x="${p.x+p.width-18}" y="${p.y+11}" width="6" height="${WORLD.groundY-p.y-11}" fill="#3f5361"/></g>`).join('');
  return `<g id="procedural-level" aria-label="Препятствия и платформы">${platforms}${props}</g>`;
}

function background() {
  // Pixel-art scenery is generated as vector shapes; no third-party image hosts.
  const palm = (x, base, size, dim = false) => {
    const leaf = dim ? '#0b3b37' : '#1d7850';
    const highlight = dim ? '#105047' : '#56b64b';
    const trunk = dim ? '#18413b' : '#94613a';
    return `<g transform="translate(${x} ${base}) scale(${size})" shape-rendering="crispEdges">
      <path d="M-5 0h12v-19H5v-19H2v-18H-1v-17H-4v-17H-7v-22h11v20h3v18h3v18h3v18h3v20h-5V0Z" fill="${trunk}"/>
      <path d="M-5 -95h9v10h-9zM0 -70h10v5H0z" fill="${dim ? '#25665b' : '#d99453'}"/>
      <path d="M0 -112h-14v-8h-22v-6h-19v8h-12v10h-10v14h8v-8h11v-6h19v3h10v10h14v14h8v-20h7z" fill="${leaf}"/>
      <path d="M1 -113h13v-7h21v-5h21v10h14v8h10v15h-9v-9h-11v-6h-19v5h-13v10H10v12H3z" fill="${leaf}"/>
      <path d="M-1 -117h-14v-16h-16v-12h-18v-10h-13v8h11v10h9v12h10v12h13v12H-3zM4 -118h15v-16h16v-12h17v-9h13v7h-9v12h-11v13H33v11H19v12H5z" fill="${highlight}"/>
      <path d="M-9 -121h-14v-5h-15v-6h-13v-4h16v5h20v6h12zM8 -123h15v-6h15v-7h13v-4H36v5H19v7H6z" fill="${dim ? '#16665d' : '#90d95d'}"/>
    </g>`;
  };
  const silhouettes = Array.from({length:30}, (_,i) => {
    const x=i*43-13;
    const h=28+(i*13)%32;
    return `<path d="M${x} 369v-${h}h5v-${(i*7)%11+8}h4v${(i*7)%11+8}h5v${h}h-4v-18h-9v18z" fill="${i%3===0?'#103b3c':'#0b3035'}"/>`;
  }).join('');
  const rockySpots = Array.from({length:54},(_,i)=>{
    const x=11+i*23;
    const y=400+((i*17)%23);
    const w=7+((i*7)%12);
    return `<rect x="${x}" y="${y}" width="${w}" height="${4+(i%3)*2}" fill="${i%4===0?'#cc7d3e':i%3===0?'#70462b':'#90603b'}"/>`;
  }).join('');
  const shrubs = Array.from({length:64}, (_,i)=> {
    const x=(i*61)%1200;
    const y=368+(i%3)*2;
    const h=5+(i*17)%14;
    return `<path d="M${x-7} ${y}v-${h}h3v${h-5}h3v-${h+3}h3v${h-5}h4v${h}z" fill="${i%4===0?'#52984e':'#2a6945'}"/>`;
  }).join('');
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#030b16"/><stop offset="0.55" stop-color="#0b1e36"/><stop offset="1" stop-color="#24475e"/></linearGradient>
    <pattern id="grass" width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#194626"/><path d="M0 0h9v4h8v-3h15v5H21v4h-9v-4H0z" fill="#7be244"/><rect x="6" y="8" width="5" height="5" fill="#3e9136"/></pattern>
    <pattern id="dirt" width="48" height="36" patternUnits="userSpaceOnUse"><rect width="48" height="36" fill="#543624"/><path d="M0 0h19v8H7v10h-7M22 19h16v7H27v10h-5" fill="#a56a32"/><path d="M19 8h5v7h-5M38 0h8v5h-8" fill="#e28b42"/></pattern>
    <pattern id="dither" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="2" height="2" x="1" y="1" fill="#a4c9dc" opacity=".20"/></pattern>
  </defs>
  <rect width="1200" height="430" fill="url(#sky)"/>
  <g fill="#163452" shape-rendering="crispEdges">
    <path d="M0 329V303L90 276l55 13 71-34 49 20 94-71 69 55 80-35 52 24 96-81 88 80 100-57 74 64 94-34 78 66 110-34v77z"/>
    <path d="M0 329v-27l83-26 59 13 74-33 48 19 95-70 15 16-25 23-29 2 8 11-66 12-31 24-99 17-60-21zM597 268l59-99 36 46-25-12-12 27-13-5-16 29zM872 272l38-48 37 46-27-12-9-21-20 24z" fill="#6488b1" opacity=".85"/>
    <path d="M0 340V310l75-19 86 21 93-31 108 24 84-32 92 26 88-24 111 40 93-29 117 22 93-39 111 51v20z" fill="#132b46"/>
  </g>
  <g shape-rendering="crispEdges" opacity=".7"><path d="M45 275h85v4H45zM345 283h70v3h-70zM889 281h75v4h-75z" fill="#427090"/><path d="M20 306h96v2H20zM790 302h140v2H790z" fill="url(#dither)"/></g>
  <path d="M0 374v-60l55-10 70 30 80-19 67 24 79-14 75 22 91-17 64 17 97-21 75 13 100-28 96 26 104-22 86 24 77-14 64 30v19Z" fill="#092b32"/>
  ${silhouettes}
  ${palm(50,374,1.14)}${palm(152,375,.57,true)}${palm(1134,375,1.08)}${palm(1055,376,.58,true)}${palm(790,375,.42,true)}
  ${shrubs}
  <rect x="0" y="374" width="1200" height="14" fill="url(#grass)"/>
  <rect x="0" y="388" width="1200" height="42" fill="url(#dirt)"/>
  ${rockySpots}
  <path d="M0 388h1200" stroke="#b9f667" stroke-width="2"/>
`;
}

export function renderSvg({weeks,sprites,username,fixture=false,seedOverride}) {
  const grid=normalizeWeeks(weeks);
  const level=buildLevel(grid,username,seedOverride);
  const mission=createMission(grid,level);
  const header=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="430" viewBox="0 0 1200 430" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(username)} — Commando Activity</title><desc id="desc">Боец в синей повязке непредсказуемо патрулирует процедурный уровень, перепрыгивает препятствия, запрыгивает на платформы и стреляет в клетки календаря активности GitHub. ${fixture?'Демонстрационные данные.':'Календарь получен через API GitHub.'}</desc>`;
  const scene=background();
  const defs=`<defs>${spriteDefs(sprites)}${effectsDefs()}
    <clipPath id="aim-upper"><rect x="-50" y="-50" width="180" height="93"/></clipPath>
    <clipPath id="aim-legs"><rect x="-50" y="43" width="180" height="100"/></clipPath>
  </defs>`;
  const months=['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
  let monthText=''; let prev=-1;
  for(let col=0;col<53;col++){
    const day=grid[col].find(Boolean);if(!day)continue;
    const m=Number(day.date.slice(5,7))-1;
    if(m!==prev&&col<50){monthText+=`<text x="${GRID_X+col*STEP}" y="${GRID_Y-10}" fill="#9eb8ba" font-family="monospace" font-size="12">${months[m]}</text>`;prev=m;}
  }
  const top=`<rect x="65" y="27" width="1070" height="190" fill="#030e14" fill-opacity=".77" rx="6" stroke="#294c45" stroke-width="2"/><text x="72" y="20" font-family="monospace" font-size="18" fill="#a4f0b5">${escapeXml(username)} / GITHUB CONTRIBUTIONS</text>${monthText}<g id="contribution-grid">${gridMarkup(grid,mission)}</g>`;
  const missionEnd=mission.duration;
  const finishedAt=round(Math.max(0,mission.lastImpact+.06));
  const missionComplete=animationAttr('opacity',[0,finishedAt,missionEnd-.09,missionEnd],['0','1','1','0'],missionEnd);
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
  const svg=renderSvg({weeks,sprites,username:USERNAME,fixture:demo});
  await mkdir(dirname(out),{recursive:true});
  await writeFile(out,svg,'utf8');
  console.log(`SVG создан: ${out} (${Buffer.byteLength(svg)} байт, ${demo?'демо':'реальные данные'})`);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{ console.error(`ОШИБКА: ${error.message}`);process.exitCode=1;});
}
