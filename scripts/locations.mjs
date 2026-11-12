import {desertScene as desert} from './canyon-scene.mjs';
import {jungleScene as jungle} from './jungle-scene.mjs';
import {snowScene as snow} from './snow-scene.mjs';
import {factoryScene as industrial} from './factory-scene.mjs';
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
function volcano(seed){
  return volcanoScene(seed);
}
const SCENE=Object.freeze({jungle,desert,snow,volcano,industrial});
const PALETTE=Object.freeze({
  jungle:['#05111e','#0d2036','#24455a'],desert:['#35263b','#744750','#d59b7c'],
  snow:['#182e49','#375775','#789bad'],volcano:['#190f21','#472232','#923d3d'],
  industrial:['#283e43','#435c5a','#788477']
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
