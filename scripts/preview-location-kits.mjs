/** Build real-calendar review maps; the official release and output branch are separate. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {renderSvg,normalizeWeeks} from './generate.mjs';
import {buildLevel,validateLayout,WORLD} from './mission.mjs';
import {LOCATION_KITS} from './location-kit-config.mjs';
import {locationKitTerrain,locationKitPlatformHeight} from './location-kit-sprites.mjs';

const root=new URL('../',import.meta.url),folder=new URL('preview/location-kit-refresh/',root);
mkdirSync(folder,{recursive:true});
const read=name=>readFileSync(new URL(name,root),'utf8');
const calendar=JSON.parse(read('preview/factory-v8/live-calendar.json'));
if(calendar.source.fixture!==false||!calendar.source.svgBlob)throw Error('Verified real calendar required');
const grid=normalizeWeeks(calendar.weeks);
const sprites=JSON.parse(gunzipSync(Buffer.from(read('assets/sprites.json.gz.b64').trim(),'base64')));
const save=(name,contents)=>writeFileSync(new URL(name,folder),contents);
const manifest={status:'draft',calendar:calendar.source,totalContributions:calendar.weeks.flatMap(w=>w.contributionDays).reduce((sum,d)=>sum+d.contributionCount,0),locations:{}};
for(const [location,kit] of Object.entries(LOCATION_KITS)){
  const candidates=Array.from({length:160},(_,seed)=>buildLevel(grid,'0w1Max',seed,location))
    .filter(l=>l.platforms.length&&l.obstacles.length>=2);
  const chosen=[],seenObstacles=new Set(),seenPlatforms=new Set();
  while(seenObstacles.size<4||seenPlatforms.size<3){
    const score=l=>l.obstacles.filter(o=>!seenObstacles.has(o.kind)).length*10+
      l.platforms.filter(p=>!seenPlatforms.has(p.kind)).length*3+l.obstacles.length;
    const next=candidates.filter(l=>!chosen.includes(l)).sort((a,b)=>score(b)-score(a)||a.seed-b.seed)[0];
    if(!next||chosen.length>=5)throw Error('Could not cover '+location);
    chosen.push(next);
    next.obstacles.forEach(o=>seenObstacles.add(o.kind));
    next.platforms.forEach(p=>seenPlatforms.add(p.kind));
  }
  const maps=[];
  for(const [index,level] of chosen.entries()){
    if(!validateLayout(level).valid)throw Error('Invalid review layout');
    const filename=`${location}-${index+1}.svg`;
    const svg=renderSvg({weeks:calendar.weeks,sprites,username:'0w1Max',fixture:false,seedOverride:level.seed,locationOverride:location})
      .replace('role="img"',`data-location-kit-version="${kit.version}" role="img"`);
    for(const day of calendar.weeks.flatMap(w=>w.contributionDays))
      if(!svg.includes(`${day.date}: ${day.contributionCount} contributions`))throw Error('Missing real calendar date');
    save(filename,svg);
    maps.push({filename,seed:level.seed,level,sha256:createHash('sha256').update(svg).digest('hex')});
  }
  const [obstacles,platforms,definitions,sprite]=locationKitTerrain(location);
  const names=[...Object.values(obstacles),...Object.values(platforms)];
  const text=(x,y,t,size=19,color='#e9e0cc')=>`<text x="${x}" y="${y}" fill="${color}" font-family="DejaVu Sans,sans-serif" font-size="${size}" font-weight="bold">${t}</text>`;
  let sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640"><rect width="1200" height="640" fill="#12212a"/>${definitions(names)}`;
  sheet+=text(28,43,kit.title+' · новый игровой набор',28)+text(28,78,'4 препятствия и 3 платформы · согласованный игровой масштаб',17,'#a7babb');
  Object.entries(obstacles).forEach(([kind,name],i)=>{
    const [w,h]=kit.sizes[kind],x=28+i*294;
    sheet+=`<rect x="${x}" y="102" width="274" height="232" rx="8" fill="#20333d"/>`+
      sprite(name,x+(274-w*4)/2,130+(150-h*4),w*4,h*4)+text(x+12,302,kit.obstacleLabels[Number(name.at(-1))],17)+text(x+12,326,`${w} × ${h} px`,14,'#a7babb');
  });
  Object.entries(platforms).forEach(([kind,name],i)=>{
    const x=28+i*392,width=138,height=locationKitPlatformHeight(location,kind,width);
    sheet+=`<rect x="${x}" y="364" width="372" height="230" rx="8" fill="#20333d"/>`+
      sprite(name,x+20,385,width*2.4,height*2.4)+text(x+12,566,kit.platformLabels[Number(name.at(-1))],19);
  });
  sheet+=text(28,626,'Части набора выбираются генератором по seed; фон и календарь сохранены.',16,'#a7babb')+'</svg>';
  save(`${location}-objects.svg`,sheet);
  manifest.locations[location]={title:kit.title,version:kit.version,maps};
}
save('manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(manifest.locations).map(([k,v])=>[k,v.maps.map(m=>m.seed)]))));
