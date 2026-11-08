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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DURATION = 10;
const USERNAME = process.env.GITHUB_USER || '0w1Max';
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const COLORS = ['#182b26', '#0f663c', '#1b984d', '#32c45d', '#9af345'];
const VIEW_W = 1200;
const VIEW_H = 430;
const GRID_X = 72;
const GRID_Y = 76;
const STEP = 20;
const CELL = 17;

const escapeXml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const timePct = t => (t / DURATION).toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
const attrAnimate = (name, times, values, type='') => `<animate ${type} attributeName="${name}" calcMode="discrete" keyTimes="${times.map(timePct).join(';')}" values="${values.join(';')}" dur="${DURATION}s" repeatCount="indefinite"/>`;

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

function pickTargets(grid) {
  const plans=[{start:2.32,player:340,bulletCount:3},{start:4.82,player:565,bulletCount:3},{start:7.14,player:780,bulletCount:3}];
  const taken=new Set();
  const result=[];
  for(const plan of plans) {
    for (let i=0;i<plan.bulletCount;i++) {
      const start=plan.start+i*.23;
      const startX=plan.player+54;
      const candidates=[];
      for(let col=0;col<53;col++)for(let row=0;row<7;row++){
        const v=grid[col][row]; if(!v || v.level===0)continue;
        const key=`${col}:${row}`; if(taken.has(key))continue;
        const tx=GRID_X+col*STEP+CELL/2;
        const ty=GRID_Y+row*STEP+CELL/2;
        const dist=Math.abs(tx-(startX+25+i*11));
        candidates.push({col,row,x:tx,y:ty,key,score:dist+Math.abs(row-4)*9+i*3});
      }
      candidates.sort((a,b)=>a.score-b.score);
      const picked=candidates[0];
      if(picked){taken.add(picked.key);result.push({...picked,start,startX,startY:304,impact:start+.43});}
    }
  }
  return result;
}

function gridMarkup(grid, targets) {
  const impacts=new Map(targets.map(t=>[t.key,t.impact]));
  let output='';
  for(let col=0;col<53;col++)for(let row=0;row<7;row++){
    const cell=grid[col][row];
    if (!cell)continue;
    const x=GRID_X+col*STEP;
    const y=GRID_Y+row*STEP;
    const title=`${cell.date}: ${cell.count} contributions`;
    const impacted=impacts.get(`${col}:${row}`);
    const attrs=`x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${COLORS[cell.level]}"`;
    let child='';
    if(impacted!==undefined) {
      const t=[0,impacted,9.75,9.99,10];
      child=attrAnimate('opacity',t,['1','0','0','1','1']);
    }
    output+=`<rect ${attrs}><title>${escapeXml(title)}</title>${child}</rect>`;
  }
  return output;
}

function bulletMarkup(targets) {
  return targets.map((t,i)=>{
    const x=t.startX,y=t.startY;
    const pts=[0,Math.max(0,t.start-.001),t.start,t.impact,t.impact+.06,10];
    const opacity=attrAnimate('opacity',pts,['0','0','1','1','0','0']);
    const movement=`<animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y};${x} ${y};${t.x} ${t.y};${t.x} ${t.y};${x} ${y}" keyTimes="${pts.map(timePct).join(';')}" dur="${DURATION}s" repeatCount="indefinite"/>`;
    const boom=attrAnimate('opacity',[0,t.impact,t.impact+.08,t.impact+.25,10],['0','0','1','0','0']);
    return `<g aria-label="Выстрел ${i+1}"><g>${movement}${opacity}<rect x="-2" y="-9" width="4" height="18" rx="1" fill="#fff7bf"/><rect x="-1" y="-15" width="2" height="8" fill="#f59e0b"/></g><g transform="translate(${t.x},${t.y})">${boom}<path d="M-20 -5h10v-7h7v-9h7v10h8v-6h5v11h9v8h-12v10h-9v9h-7v-12h-12v-5h-8z" fill="#f97316"/><rect x="-7" y="-6" width="14" height="12" fill="#fff6b7"/></g></g>`;
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

function spriteMarkup() {
  const frames=['run-a','run-b','run-c','run-d','aim','shoot-idle','shoot-stand','aim','run-a','run-b','run-c','run-d','aim','shoot-idle','shoot-stand','aim','run-a','run-b','run-c','run-d','aim','shoot-idle','shoot-stand','aim','idle-a'];
  const key=Array.from({length:frames.length},(_,i)=>10*i/(frames.length-1));
  // Сегменты стрельбы должны совпадать с выстрелами, иначе используем фреймы бега.
  const shotRanges=[[2.15,3.22],[4.68,5.75],[6.98,8.12]];
  const marks=Array.from({length:101},(_,i)=>+(i/10).toFixed(1));
  const choose=t=>{
    if(t<2.15 || (t>=3.22&&t<4.68) || (t>=5.75&&t<6.98) || (t>=8.12&&t<9.8)) {
      return ['run-a','run-b','run-c','run-d'][Math.floor(t/.16)%4];
    }
    if(t>=9.8) return 'idle-a';
    const rg=shotRanges.find(([a,b])=>t>=a&&t<b);
    if(rg) return ['aim','shoot-idle','shoot-stand'][Math.floor((t-rg[0])/.13)%3];
    return 'idle-a';
  };
  const keys=Object.keys({'idle-a':1,'run-a':1,'run-b':1,'run-c':1,'run-d':1,'aim':1,'shoot-idle':1,'shoot-stand':1});
  let shapes='';
  for(const name of keys){
    const vals=marks.map(t=>choose(t)===name?'1':'0');
    shapes+=`<g opacity="${vals[0]}"><use href="#soldier-${name}" width="78" height="78"/>${attrAnimate('opacity',marks,vals)}</g>`;
  }
  const trackTimes=[0,2.15,3.22,4.68,5.75,6.98,8.12,9.79,9.8,10];
  const trackVals=['130 293','340 293','340 293','565 293','565 293','780 293','780 293','1030 293','130 293','130 293'];
  const travel=`<animateTransform attributeName="transform" type="translate" calcMode="linear" values="${trackVals.join(';')}" keyTimes="${trackTimes.map(timePct).join(';')}" dur="${DURATION}s" repeatCount="indefinite"/>`;
  return `<g id="blue-commando" aria-label="Боец в синей повязке">${travel}${shapes}</g>`;
}

function background() {
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#06111e"/><stop offset="1" stop-color="#12374a"/></linearGradient>
    <pattern id="grass" width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#153a25"/><path d="M0 0h9v4h8v-3h15v5H21v4h-9v-4H0z" fill="#6ddb3e"/><rect x="6" y="8" width="5" height="5" fill="#397d33"/></pattern>
    <pattern id="dirt" width="48" height="36" patternUnits="userSpaceOnUse"><rect width="48" height="36" fill="#543624"/><path d="M0 0h19v8H7v10h-7M22 19h16v7H27v10h-5" fill="#a56a32"/><path d="M19 8h5v7h-5M38 0h8v5h-8" fill="#e28b42"/></pattern>
  </defs>
  <rect width="1200" height="430" fill="url(#sky)"/>
  <g fill="#0b253a" shape-rendering="crispEdges"><path d="M0 336V275L65 250L106 270L173 210L253 270L329 220L420 294L522 219L638 287L741 196L868 284L995 223L1103 301L1200 240V336Z"/><path d="M0 336V306L88 280L176 308L290 258L396 300L502 256L620 314L727 252L821 311L934 267L1038 314L1100 259L1200 312V336Z" fill="#133a43"/></g>
  <path d="M0 376v-39l85 -18 70 16 88-32 70 36 86-18 81 15 74-29 90 28 114-30 110 28 95-27 87 29 110-35v52Z" fill="#0b292b"/>
  <g stroke="#286a42" stroke-width="7" stroke-linecap="square" fill="none" opacity=".85">
    <path d="M44 372V296m0 10l-36-14m36 11l43-28m-43 17l-26-41m26 29l13-50"/>
    <path d="M1140 372V286m0 19l-38-27m38 26l41-38m-41 14l-17-39m17 44l22-48"/>
    <path d="M950 370V331m0 12l-26-20m26 20l29-24"/>
  </g>
  <rect x="0" y="374" width="1200" height="14" fill="url(#grass)"/>
  <rect x="0" y="388" width="1200" height="42" fill="url(#dirt)"/>
  <path d="M0 388h1200" stroke="#b9f667" stroke-width="2"/>
  <g shape-rendering="crispEdges"><rect x="1030" y="335" width="36" height="39" fill="#536476" stroke="#16232a" stroke-width="4"/><path d="M1037 342l22 25m0-25l-22 25" stroke="#b7c5c5" stroke-width="4"/><rect x="1073" y="322" width="43" height="52" fill="#536476" stroke="#18252e" stroke-width="4"/><path d="M1081 330l27 35m0-35l-27 35" stroke="#b7c5c5" stroke-width="4"/></g>`;
}

export function renderSvg({weeks,sprites,username,fixture=false}) {
  const grid=normalizeWeeks(weeks);
  const targets=pickTargets(grid);
  const header=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="430" viewBox="0 0 1200 430" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(username)} — Commando Activity</title><desc id="desc">Пиксельный солдат с синей повязкой бежит по джунглям и стреляет вверх по клеткам календаря активности GitHub. ${fixture?'Демонстрационные данные.':'Календарь получен через API GitHub.'}</desc>`;
  const scene=background();
  const defs=`<defs>${spriteDefs(sprites)}</defs>`;
  const months=['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
  let monthText='';
  let prev=-1;
  for(let col=0;col<53;col++) {
    const day=grid[col].find(Boolean);
    if (!day) continue;
    const m=Number(day.date.slice(5,7))-1;
    if(m!==prev && col<50){monthText+=`<text x="${GRID_X+col*STEP}" y="${GRID_Y-10}" fill="#9eb8ba" font-family="monospace" font-size="12">${months[m]}</text>`;prev=m;}
  }
  const top=`<rect x="65" y="27" width="1070" height="190" fill="#030e14" fill-opacity=".77" rx="6" stroke="#294c45" stroke-width="2"/><text x="72" y="20" font-family="monospace" font-size="18" fill="#a4f0b5">${escapeXml(username)} / GITHUB CONTRIBUTIONS</text>${monthText}<g id="contribution-grid">${gridMarkup(grid,targets)}</g>`;
  const bullets=bulletMarkup(targets);
  const indicator=fixture?`<text x="1118" y="20" text-anchor="end" font-family="monospace" font-size="13" fill="#fcd34d">DEMO / TEST DATA</text>`:'';
  return `${header}${scene}${defs}${top}${indicator}${bullets}${spriteMarkup()}</svg>\n`;
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
