import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {calendarDate,selectDailyLocation,validateSettings,OFFICIAL_LOCATIONS} from './scripts/daily-location.mjs';
import {monthLabels,HUD} from './scripts/profile-hud.mjs';
import {buildDailyPublication} from './scripts/publish-daily.mjs';
import {validatePublication} from './scripts/validate-daily.mjs';
import {renderSvg,normalizeWeeks,fetchCalendar} from './scripts/generate.mjs';
import {WORLD,buildLevel} from './scripts/mission.mjs';

const settings=JSON.parse(await readFile('commando-settings.json','utf8'));
const unpack=async path=>JSON.parse(gunzipSync(Buffer.from((await readFile(path,'utf8')).trim(),'base64')));
const {weeks}=await unpack('fixtures/demo-calendar.json.gz.b64');
const sprites=await unpack('assets/sprites.json.gz.b64');

test('Moscow midnight, month/year boundaries and repeated same-day runs retain a single choice',()=>{
  assert.equal(calendarDate(new Date('2026-11-22T20:59:59Z')),'2026-11-22');
  assert.equal(calendarDate(new Date('2026-11-22T21:00:00Z')),'2026-11-23');
  assert.equal(calendarDate(new Date('2026-12-31T21:00:00Z')),'2027-01-01');
  const first=selectDailyLocation(settings,{date:null,location:'coast',bootstrap:true},new Date('2026-11-22T10:00:00Z'));
  assert.equal(first.location,'desert');
  const rerun=selectDailyLocation(settings,first,new Date('2026-11-22T20:59:59Z'));
  assert.deepEqual(rerun,first);
  assert.notEqual(selectDailyLocation(settings,first,new Date('2026-11-22T21:00:00Z')).location,first.location);
});

test('Three years of daily publications only select the four approved locations and never repeat on consecutive days',()=>{
  let previous=null;const seen=new Set();
  for(let day=0;day<1100;day++){
    const now=new Date(Date.UTC(2026,10,22+day,10));
    const state=selectDailyLocation(settings,previous,now);
    assert.ok(OFFICIAL_LOCATIONS.includes(state.location));
    if(previous)assert.notEqual(state.location,previous.location);
    assert.deepEqual(selectDailyLocation(settings,state,now),state);
    seen.add(state.location);previous=state;
  }
  assert.equal(seen.size,4);
});

test('Skipped runs, migration and invalid settings/state cannot silently reintroduce repeats or experimental locations',()=>{
  const today=new Date('2026-11-22T12:00:00Z');
  const state=selectDailyLocation(settings,{date:'2026-11-18',location:'desert',seed:49},today);
  assert.notEqual(state.location,'desert');
  assert.throws(()=>selectDailyLocation(settings,{date:'2026-11-23',location:'coast',seed:5},today));
  assert.throws(()=>selectDailyLocation(settings,{date:'2026-11-22',location:'jungle',seed:5},today));
  assert.throws(()=>validateSettings({...settings,rotation:{...settings.rotation,order:['jungle','desert','temple','coast']}}));
  assert.throws(()=>validateSettings({...settings,rotation:{...settings.rotation,preventConsecutiveRepeats:false}}));
});

test('The latest partial NOV/DEC is labeled in 53/54/55-week calendars without overlaps or clipping',()=>{
  for(const length of [53,54,55]){
    const grid=Array.from({length},()=>Array(7).fill(null));
    grid[0][0]={date:'2025-11-30'};grid[0][1]={date:'2025-12-01'};
    grid[length-1][0]={date:'2026-11-22'};
    const labels=monthLabels(grid);
    assert.deepEqual(labels.map(l=>l.month),['2025-11','2025-12','2026-11']);
    assert.equal(labels.at(-1).text,'NOV');
    for(let i=1;i<labels.length;i++)assert.ok(labels[i].x>=labels[i-1].x+labels[i-1].width+6);
    assert.ok(labels[0].x>=8);
    assert.ok(labels.at(-1).x+labels.at(-1).width<=72+(length-1)*20+18);
  }
});

test('All four profile scenes keep readable HUD labels, 18px cells and clearance above the highest platform',()=>{
  for(const location of OFFICIAL_LOCATIONS){
    const svg=renderSvg({weeks,sprites,username:'0w1Max',locationOverride:location,seedOverride:settings.seeds[location]});
    assert.match(svg,/id="hud-username"[^>]*aria-label="0w1Max \/"/);
    assert.match(svg,/font-size="21" font-weight="bold"/);
    assert.match(svg,/font-size="15" font-weight="bold"/);
    const labels=svg.split('<g id="contribution-overlay">')[1]?.split('<g id="contribution-grid">')[0];
    assert.match(labels,/font-family="monospace"/);
    assert.doesNotMatch(labels,/data-font=|@font-face|https?:/);
    const titleY=Number(labels.match(/id="hud-username"[^>]* y="([^"]+)/)[1]);
    const monthY=Number(labels.match(/data-month="[^"]+"[^>]* y="([^"]+)/)[1]);
    const coastTransform=svg.match(/id="storm-coast-profile-scale"[^>]*transform="translate\([^ ]+ ([^)]+)\) scale\(([^)]+)\)/);
    const scale=coastTransform?Number(coastTransform[2]):1;
    const offset=coastTransform?Number(coastTransform[1]):0;
    assert.ok(Math.abs(titleY*scale+offset+8)<.01);
    assert.ok((monthY-titleY)*scale>=43);
    assert.match(svg,/viewBox="0 -32 1200/);
    assert.doesNotMatch(svg,/[А-Яа-яЁё]/);
    const cells=[...svg.matchAll(/<rect x="([0-9.]+)" y="([0-9.]+)" width="18" height="18" rx="3"[^>]*><title>(\d{4}-\d{2}-\d{2}):/g)];
    assert.equal(cells.length,normalizeWeeks(weeks).flat().filter(Boolean).length);
    for(const m of cells){assert.equal((Number(m[1])-WORLD.gridX)%WORLD.step,0);assert.equal((Number(m[2])-WORLD.gridY)%WORLD.step,0);}
    assert.equal(Number(cells[1][2])-Number(cells[0][2])-HUD.cellSize,HUD.gap);
    const level=buildLevel(normalizeWeeks(weeks),'0w1Max',settings.seeds[location],location);
    const highestFoot=Math.min(WORLD.groundY,...level.platforms.map(p=>p.y));
    const gridBottom=Math.max(...cells.map(m=>Number(m[2])+HUD.cellSize));
    assert.ok(highestFoot-WORLD.spriteSize-gridBottom>=24,'Calendar crowds the soldier on a platform');
  }
});

test('Daily SVG/state checks reject fixture output, missing latest month and tampered state',()=>{
  const publication=buildDailyPublication({settings,previous:null,now:new Date('2026-11-22T10:00:00Z'),weeks,sprites,demo:true});
  assert.equal(validatePublication(publication.svg,publication.state,settings,{allowDemo:true}).cells,publication.state.calendarDays);
  assert.throws(()=>validatePublication(publication.svg,publication.state,settings));
  assert.throws(()=>validatePublication(publication.svg,{...publication.state,location:'jungle'},settings,{allowDemo:true}));
  assert.throws(()=>validatePublication(publication.svg+' ',publication.state,settings,{allowDemo:true}));
});

test('Live calendar fetch retains owner/scope checks from the existing production generator',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response(JSON.stringify({data:{viewer:{login:'somebody-else'},user:{contributionsCollection:{contributionCalendar:{weeks}}}}}),{headers:{'x-oauth-scopes':'read:user'}});
    await assert.rejects(fetchCalendar('0w1Max','test-token'),/владельцу/);
    globalThis.fetch=async()=>new Response('{}',{headers:{'x-oauth-scopes':'repo'}});
    await assert.rejects(fetchCalendar('0w1Max','test-token'),/scope/);
  }finally{globalThis.fetch=original;}
});
