/** Rebuild the Factory V8 draft without touching the production catalog or output branch. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderSvg} from './generate.mjs';
import {buildLevel} from './mission.mjs';
import {factoryScene} from './factory-scene.mjs';
import {levelMarkup} from './level-art.mjs';
import {factoryObstacles,factoryPlatforms,factoryObstacleSizes} from './factory-sprites.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const unpack=path=>JSON.parse(gunzipSync(Buffer.from(read(path).trim(),'base64')).toString('utf8'));
const real=process.argv.includes('--real');
const {weeks}=real?JSON.parse(read('preview/factory-v8/live-calendar.json')):unpack('fixtures/demo-calendar.json.gz.b64');
const sprites=unpack('assets/sprites.json.gz.b64');
const dest=new URL('preview/factory-v8/',root);mkdirSync(dest,{recursive:true});
const save=(name,s)=>writeFileSync(new URL(name,dest),s);
for(const [name,seed] of [['factory-v8.svg',5],['steel-catwalk.svg',111],['stopped-conveyor.svg',116],['service-deck.svg',104]]){
 const svg=renderSvg({weeks,sprites,username:'0w1Max',fixture:!real,seedOverride:seed,locationOverride:'industrial'});
 save(name,svg.replace('role="img"','data-factory-art-version="8.1-draft" role="img"'));
}
const prefix=(s,p)=>s.replace(/id="([^"]+)"/g,(_,id)=>`id="${p}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${p}${id})`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#${p}${id}"`);
const text=(x,y,t,size=20,color='#dde5dc')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="DejaVu Sans,sans-serif" font-weight="bold">${t}</text>`;
const sizes=factoryObstacleSizes;
const obstacles=[['supply-crate','Грузовой ящик'],['fallen-log','Кабельная катушка'],['sandbags','Секция труб'],['stone-ruin','Электродвигатель']];
const platforms=[['metal-catwalk','Стальной настил'],['camo-platform','Остановленный конвейер'],['wooden-bridge','Ремонтная площадка']];
let sheet='<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1080" viewBox="0 0 1440 1080"><rect width="1440" height="1080" fill="#101820"/>';
sheet+=text(32,44,'ЗАБРОШЕННЫЙ ЗАВОД · V8.1 · ПРЕВЬЮ',31)+text(32,77,'Новые игровые спрайты · 4 препятствия · 3 платформы',20,'#9eafa5');
sheet+=`<svg x="24" y="96" width="1392" height="430" overflow="hidden" viewBox="0 0 1200 437"><defs><clipPath id="overview-clip"><rect width="1200" height="437"/></clipPath></defs><g clip-path="url(#overview-clip)">${prefix(factoryScene()+levelMarkup(buildLevel(Array.from({length:53},()=>Array(7).fill(null)),'0w1Max',5,'industrial')),'overview-')}</g></svg>`;
sheet+=text(32,559,'ПРЕПЯТСТВИЯ',23);
obstacles.forEach(([kind,label],i)=>{
 const [w,h]=sizes[kind],x=32+i*346;
 sheet+=`<rect x="${x}" y="581" width="332" height="194" rx="8" fill="#1d2934"/>`;
 const level={location:'industrial',platforms:[],obstacles:[{kind,x:0,width:w,height:h}]};
 sheet+=`<svg x="${x+75}" y="595" width="182" height="126" viewBox="-4 ${374-h-4} ${w+12} ${h+13}" shape-rendering="crispEdges">${prefix(levelMarkup(level),`o${i}-`)}</svg>`+text(x+18,753,label,20);
});
sheet+=text(32,814,'ПЛАТФОРМЫ',23);
platforms.forEach(([kind,label],i)=>{
 const x=32+i*461;
 sheet+=`<rect x="${x}" y="838" width="447" height="176" rx="8" fill="#1d2934"/>`;
 const level={location:'industrial',obstacles:[],platforms:[{kind,x:0,y:0,width:138}]};
 sheet+=`<svg x="${x+36}" y="849" width="375" height="113" viewBox="-4 -3 146 52" shape-rendering="crispEdges">${prefix(levelMarkup(level),`p${i}-`)}</svg>`+text(x+18,990,label,20);
});
sheet+=text(32,1054,'Спрайты из рабочего SVG-рендерера. Релиз v2.6.0 не изменён.',18,'#9eafa5')+'</svg>';
save('factory-v8-objects.svg',sheet);
save('manifest.json',JSON.stringify({status:'draft',locationVersion:'8.1',baseRelease:'2.6.0',obstacles:factoryObstacles,platforms:factoryPlatforms,previews:{'factory-v8.svg':5,'steel-catwalk.svg':111,'stopped-conveyor.svg':116,'service-deck.svg':104},fixture:!real},null,2)+'\n');
console.log('Factory V8: rebuilt 4 animated demos and the complete native sprite sheet.');
