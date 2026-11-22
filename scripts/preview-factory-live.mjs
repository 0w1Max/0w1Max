/** Real-calendar Factory V8 animation with a fresh, reproducible random layout. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {randomInt,createHash} from 'node:crypto';
import {renderSvg,normalizeWeeks} from './generate.mjs';
import {buildLevel,createMission,validateLayout} from './mission.mjs';
import {factoryObstacles,factoryPlatforms} from './factory-sprites.mjs';
const root=new URL('../',import.meta.url),folder=new URL('preview/factory-v8/',root);
const calendar=JSON.parse(readFileSync(new URL('live-calendar.json',folder),'utf8'));
if(calendar.source.fixture!==false||!calendar.source.svgBlob)throw Error('A verified real calendar snapshot is required');
const grid=normalizeWeeks(calendar.weeks);
const sprites=JSON.parse(gunzipSync(Buffer.from(readFileSync(new URL('assets/sprites.json.gz.b64',root),'utf8').trim(),'base64')).toString('utf8'));
const index=process.argv.indexOf('--seed');
const requested=index<0?null:process.argv[index+1];
if(requested!==null&&!/^\d{1,10}$/.test(requested??''))throw Error('Invalid seed');
let seed,level;
for(let attempt=0;attempt<1000;attempt++){
 seed=requested===null?randomInt(0,4294967296):Number(requested);
 if(seed>4294967295)throw Error('Seed exceeds uint32');
 level=buildLevel(grid,'0w1Max',seed,'industrial');
 if(level.platforms.length&&level.obstacles.length)break;
 if(requested!==null)throw Error('This seed produces an empty platform or obstacle collection');
}
if(!level.platforms.length||!level.obstacles.length||!validateLayout(level).valid)throw Error('Could not build a populated valid layout');
const mission=createMission(grid,level);
let svg=renderSvg({weeks:calendar.weeks,sprites,username:'0w1Max',fixture:false,seedOverride:seed,locationOverride:'industrial'});
svg=svg.replace('role="img"',`data-factory-art-version="8.1-draft" data-map-seed="${seed}" data-calendar-snapshot="${calendar.source.publishedDate}" role="img"`);
if(svg.includes('DEMO / TEST DATA'))throw Error('Unexpected demo marker');
for(const item of level.obstacles)if(!svg.includes(`data-sprite="${factoryObstacles[item.kind]}"`))throw Error('Old obstacle artwork');
for(const item of level.platforms)if(!svg.includes(`data-sprite="${factoryPlatforms[item.kind]}"`))throw Error('Old platform artwork');
const days=calendar.weeks.flatMap(w=>w.contributionDays);
for(const day of days)if(!svg.includes(`${day.date}: ${day.contributionCount} contributions`))throw Error('Missing calendar date');
const manifest={version:'8.1-draft',fixture:false,calendarSource:calendar.source,lastDate:days.at(-1).date,calendarDays:days.length,totalContributions:days.reduce((sum,day)=>sum+day.contributionCount,0),seed,level,obstacleSprites:level.obstacles.map(o=>factoryObstacles[o.kind]),platformSprite:factoryPlatforms[level.platforms[0].kind],mission:{duration:mission.duration,targets:mission.targets,shots:mission.shots.length,jumps:mission.jumps.length},svgSha256:createHash('sha256').update(svg).digest('hex')};
writeFileSync(new URL('factory-v8-random-live.svg',folder),svg);
writeFileSync(new URL('factory-v8-random-live.json',folder),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
