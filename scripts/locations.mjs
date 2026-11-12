import {desertScene as desert} from './canyon-scene.mjs';
import {jungleScene as jungle} from './jungle-scene.mjs';
import {snowScene as snow} from './snow-scene.mjs';
import {volcanoScene} from './volcano-scene.mjs';
/** Пять детерминированных пиксельных окружений. Коллизии уровня не меняются. */
export const LOCATION_POOL = Object.freeze(['jungle','desert','snow','volcano','industrial']);
export const LOCATION_NAMES = Object.freeze({
  jungle:'Тропические джунгли',desert:'Пустынный каньон',
  snow:'Снежная база',volcano:'Вулканическая зона',industrial:'Заброшенный завод'
});
export function selectLocation(seed){
  if(!Number.isSafeInteger(seed)||seed<0)throw new Error('Некорректный seed локации');
  let x=(seed^0x9e3779b9)>>>0;
  x=Math.imul(x^(x>>>16),0x85ebca6b);
  x=Math.imul(x^(x>>>13),0xc2b2ae35);
  x=(x^(x>>>16))>>>0;
  return LOCATION_POOL[x%LOCATION_POOL.length];
}
const rect=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';
const shape=(d,c)=>'<path d="'+d+'" fill="'+c+'"/>';
const spot=(seed,i)=>(i*73+(seed%43))%1195;
function ground(top,dirt,edge,rocks,seed){
  let details='';
  for(let i=0;i<50;i++){
    details+=rect(spot(seed,i),395+(i*11)%29,4+(i*7)%15,3+(i%3)*2,rocks[i%rocks.length]);
    details+=rect(i*25+(i%5)*2,376+(i%2)*5,6+(i%3)*3,3,edge);
  }
  return rect(0,374,1200,14,top)+rect(0,388,1200,42,dirt)+rect(0,387,1200,3,edge)+details;
}
function volcano(seed){
  return volcanoScene(seed);
}
function industrial(seed){
  let city='';
  for(let i=0;i<12;i++){
    const x=i*106-12,h=54+(i*37)%76;
    city+=rect(x,371-h,92,h,i%2?'#2a414d':'#324955')+
      rect(x+11,371-h-7,7,7,'#6b8187');
    for(let j=0;j<5;j++)city+=rect(x+11+j*15,371-h+13,6,8,j%3?'#5c8189':'#c5a066');
  }
  for(let i=0;i<4;i++){
    const x=135+i*269;
    city+=rect(x,264,20,110,'#445e67')+rect(x-9,253,38,14,'#788b92')+rect(x+5,226,9,28,'#8c9b9c');
  }
  return rect(885,238,36,36,'#7f9eae')+
    shape('M0 360v-50l107-25 94 15 89-30 88 25 97-25 100 38 84-30 108 28 81-24 105 35 92-22 105 32v33z','#223947')+
    city+ground('#53666c','#303d46','#93acb0',['#4f6570','#798c90','#aa9262'],seed);
}
const SCENE=Object.freeze({jungle,desert,snow,volcano,industrial});
const PALETTE=Object.freeze({
  jungle:['#05111e','#0d2036','#24455a'],desert:['#35263b','#744750','#d59b7c'],
  snow:['#182e49','#375775','#789bad'],volcano:['#190f21','#472232','#923d3d'],
  industrial:['#0b1827','#1b3444','#466273']
});
export function renderLocation(location,seed=0){
  if(!Object.hasOwn(SCENE,location))throw new Error('Неизвестная локация: '+String(location));
  if(!Number.isSafeInteger(seed)||seed<0)throw new Error('Некорректный seed окружения');
  const colors=PALETTE[location];
  const defs='<defs><linearGradient id="location-sky" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="'+colors[0]+'"/><stop offset=".65" stop-color="'+colors[1]+'"/>'+
    '<stop offset="1" stop-color="'+colors[2]+'"/></linearGradient></defs>';
  return '<g id="location-'+location+'" data-location="'+location+'" data-seed="'+seed+
    '" aria-label="'+LOCATION_NAMES[location]+'" shape-rendering="crispEdges">'+defs+
    rect(0,0,1200,430,'url(#location-sky)')+SCENE[location](seed)+'</g>';
}
