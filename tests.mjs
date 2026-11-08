import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import {normalizeWeeks,renderSvg} from './scripts/generate.mjs';
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
  assert.ok(svg.includes('Выстрел 1'));
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
