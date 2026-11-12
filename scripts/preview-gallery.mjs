#!/usr/bin/env node
/**
 * PR-only biome gallery: all samples share a single real public GitHub calendar.
 * Never reads the private-contribution PAT and never updates main or output.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomInt} from 'node:crypto';
import {fetchCalendar,normalizeWeeks,renderSvg} from './generate.mjs';
import {buildLevel} from './mission.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const GALLERY_SEEDS=Object.freeze({
  industrial:0,jungle:1,desert:3,volcano:6,snow:7
});
export function seedForPreviewRun(runId,attempt='1'){
  if(!/^\d+$/.test(String(runId))||!/^[1-9]\d*$/.test(String(attempt)))
    throw new Error('Некорректный GITHUB_RUN_ID/GITHUB_RUN_ATTEMPT');
  return Number((BigInt(runId)+BigInt(attempt)-1n)&0xffffffffn);
}
export function validateGallerySeeds(grid,username='0w1Max'){
  for(const [location,seed] of Object.entries(GALLERY_SEEDS)){
    const map=buildLevel(grid,username,seed);
    if(map.location!==location)throw new Error('Неверная локация '+location+' для seed '+seed);
  }
}
async function main(){
  const login=process.env.GITHUB_USER||'0w1Max';
  const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
  const weeks=await fetchCalendar(login,token);
  const grid=normalizeWeeks(weeks);
  validateGallerySeeds(grid,login);
  const sprites=JSON.parse(gunzipSync(Buffer.from(
    (await readFile(resolve(ROOT,'assets/sprites.json.gz.b64'),'utf8')).trim(),'base64'
  )).toString('utf8'));
  const runId=process.env.GITHUB_RUN_ID??String(randomInt(0,4294967296));
  const runAttempt=process.env.GITHUB_RUN_ATTEMPT??'1';
  const seed=seedForPreviewRun(runId,runAttempt);
  const variants=[
    {file:'preview/commando-activity.svg',seed,name:'Случайная карта'},
    {file:'preview/desert-canyon.svg',seed:3,name:'Эталонный каньон'},
    ...[49,109,167].map(value=>({
      file:'preview/desert-canyon-v6-'+value+'.svg',seed:value,name:'Каньон '+value
    })),
    ...Object.entries(GALLERY_SEEDS).map(([name,value])=>({
      file:'preview/biomes/'+name+'.svg',seed:value,name
    }))
  ];
  const results=[];
  for(const item of variants){
    const level=buildLevel(grid,login,item.seed);
    const svg=renderSvg({weeks,sprites,username:login,seedOverride:item.seed});
    if(/DEMO \/ TEST DATA|<script\b|<image\b|data:image\//i.test(svg) ||
       !svg.includes('id="contribution-grid"') ||
       !svg.includes('id="blue-commando"') ||
       !svg.includes('data-biome="'+level.location+'"'))
      throw new Error('Не прошла проверка карты '+item.file);
    const path=resolve(ROOT,item.file);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,svg,'utf8');
    results.push({...item,location:level.location,obstacles:level.obstacles.length,
      platforms:level.platforms.length,bytes:Buffer.byteLength(svg)});
    console.log(item.name+': biome='+level.location+' seed='+item.seed+
      ' obstacles='+level.obstacles.length+' platforms='+level.platforms.length);
  }
  await writeFile(resolve(ROOT,'preview/biomes/manifest.json'),JSON.stringify({
    source:'GitHub GraphQL public preview',runId,runAttempt,results
  },null,2)+'\n','utf8');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error('Ошибка генерации галереи: '+error.message);process.exitCode=1;});
}
