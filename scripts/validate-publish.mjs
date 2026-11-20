#!/usr/bin/env node
import {readFileSync} from 'node:fs';
const path=process.argv[2];
if(!path)throw new Error('Укажите путь к результату SVG');
const svg=readFileSync(path,'utf8');
const cells=(svg.match(/<rect x="[0-9.]+" y="[0-9.]+" width="17" height="17" rx="3"/g)||[]).length;
const shots=(svg.match(/id="shot-\d+"/g)||[]).length;
if(svg.length<100000||svg.length>3000000)throw new Error('Неожиданный размер SVG');
for(const expected of ['id="storm-coast"','id="storm-coast-victory"','data-location="coast"','id="blue-commando"','id="contribution-grid"','GitHub calendar fetched from the GitHub API.']){
  if(!svg.includes(expected))throw new Error('Отсутствует проверочный маркер '+expected);
}
if(/DEMO \/ TEST DATA|<script\b|<image\b|data:image\/|<foreignObject\b/i.test(svg))throw new Error('Непроверенные данные или опасный контент SVG');
if(cells<350||cells>371)throw new Error('Неправильное число календарных клеток: '+cells);
if(shots<1)throw new Error('В SVG нет выстрелов по активности');
console.log('PASS: Storm Coast V2, '+cells+' клеток, '+shots+' выстрелов, реальный календарь GitHub');
