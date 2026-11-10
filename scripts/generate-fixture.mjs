import {writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const end=new Date('2026-11-07T12:00:00Z');
const start=new Date(end);start.setUTCDate(start.getUTCDate()-370);
start.setUTCDate(start.getUTCDate()-start.getUTCDay());
let seed=321192;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const levels=['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'];
const weeks=[];
for(let w=0;w<53;w++) {
  const contributionDays=[];
  for(let d=0;d<7;d++){
    const day=new Date(start);day.setUTCDate(day.getUTCDate()+w*7+d);
    const x=random(),n=x<.29?0:x<.52?1:x<.72?3:x<.86?6:12;
    contributionDays.push({date:day.toISOString().slice(0,10),contributionCount:n,contributionLevel:levels[n===0?0:n<2?1:n<4?2:n<9?3:4]});
  }
  weeks.push({contributionDays});
}
await writeFile(resolve(root,'fixtures','demo-calendar.json'),JSON.stringify({note:'СИНТЕТИЧЕСКИЙ ТЕСТОВЫЙ КАЛЕНДАРЬ; не публиковать как реальные данные',weeks},null,2));
