#!/usr/bin/env node
import {readFileSync} from 'node:fs';
const path=process.argv[2];
if(!path)throw new Error('Укажите путь к результату SVG');
const svg=readFileSync(path,'utf8');
const cells=(svg.match(/<rect x="\d+" y="\d+" width="18" height="18"/g)||[]).length;
const shots=(svg.match(/id="shot-\d+"/g)||[]).length;
if(svg.length<100000||svg.length>3000000)throw new Error('Неожиданный размер SVG');
for(const expected of ['id="desert-canyon-v3"','data-art-version="5.0"','id="blue-commando"','id="contribution-grid"','Календарь получен через API GitHub']){
  if(!svg.includes(expected))throw new Error('Отсутствует проверочный маркер '+expected);
}
if(/DEMO \/ TEST DATA|<script\b|<image\b|data:image\/|<foreignObject\b/i.test(svg))throw new Error('Непроверенные данные или опасный контент SVG');
if(cells<350||cells>371)throw new Error('Неправильное число календарных клеток: '+cells);
if(shots<1)throw new Error('В SVG нет выстрелов по активности');
console.log('PASS: SVG V5, '+cells+' клеток, '+shots+' выстрелов, реальный календарь GitHub');
