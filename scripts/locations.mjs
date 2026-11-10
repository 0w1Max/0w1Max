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
const group=(x,y,scale,art)=>'<g transform="translate('+x+' '+y+') scale('+scale+')">'+art+'</g>';
const spot=(seed,i)=>(i*73+(seed%43))%1195;
function ground(top,dirt,edge,rocks,seed){
  let details='';
  for(let i=0;i<50;i++){
    details+=rect(spot(seed,i),395+(i*11)%29,4+(i*7)%15,3+(i%3)*2,rocks[i%rocks.length]);
    details+=rect(i*25+(i%5)*2,376+(i%2)*5,6+(i%3)*3,3,edge);
  }
  return rect(0,374,1200,14,top)+rect(0,388,1200,42,dirt)+rect(0,387,1200,3,edge)+details;
}
function palm(x,scale){
  return group(x,374,scale,
    shape('M-5 0h10v-60h-4v-44h-8v44h2z','#9f6b43')+
    shape('M-4 -100h-15v-12h-24v-8h-21v11h17v7h22v15h13z','#267c56')+
    shape('M2 -101h18v-12h24v-9h21v11H48v8H25v16H10z','#368a56')+
    shape('M-7 -102h-11v-18h-20v-12h-12v-7h-9v9h10v10h13v18h18z','#8ad563')+
    shape('M5 -104h14v-17h19v-12h13v-7h8v9h-9v9H36v18H18z','#72c960'));
}
function cactus(x,scale){
  return group(x,374,scale,
    shape('M-8 0v-72h13v72zM-8 -21h-15v-15h-8v-20h9v12h14zM5 -37h15v-15h10v24H5z','#568e6f')+
    rect(-5,-61,4,52,'#93bf94'));
}
function pine(x,scale){
  return group(x,374,scale,rect(-4,-24,8,24,'#667682')+
    shape('M0 -112l20 30h-10l18 28H15l22 27h-74l22-27h-13l18-28h-10z','#285367')+
    shape('M-8 -93H9l7 11h-32zM-21 -58h42l8 8h-58zM-34 -32h68l4 6h-76z','#d3e9f1'));
}
function scrub(seed,count,color){
  let out='';
  for(let i=0;i<count;i++){
    const x=spot(seed,i),height=5+(i*11)%11;
    out+=shape('M'+x+' 374v-'+height+'h3v'+(height-4)+'h4v-7h3v'+height+'z',color);
  }
  return out;
}
function jungle(seed){
  return shape('M0 342v-43l95-30 90 23 77-46 70 25 74-60 81 49 70-34 71 32 83-69 89 59 83-31 80 60 87-32 103 59v38z','#22445c')+
    shape('M0 361v-44l107-25 88 26 97-30 91 25 86-29 83 32 80-29 95 31 88-28 102 32 96-21v60z','#123e46')+
    palm(65,.97)+palm(1130,1.01)+palm(185,.53)+scrub(seed,36,'#3d8051')+
    ground('#215b3b','#50392b','#a8d663',['#83583b','#a97340','#6c4d35'],seed);
}
function desert(seed){
  return rect(908,242,70,70,'#f0b36d')+
    shape('M0 352v-78h65v-30h68v-45h76v41h56v58h67v54zM387 354v-79h63v-36h76v-38h60v36h65v54h89v63zM801 352v-68h52v-45h90v-28h51v44h69v45h72v52z','#af6452')+
    shape('M0 363v-29l110-33 108 25 85-26 93 27 109-22 93 31 105-35 102 25 111-30 100 34 84-13v46z','#d28e6c')+
    cactus(82,.58)+cactus(1132,.69)+cactus(825,.4)+scrub(seed,12,'#ba9e5c')+
    ground('#b88f5b','#87513c','#e2b479',['#a66c48','#cb8660','#70503e'],seed);
}
function snow(seed){
  return rect(857,229,48,48,'#e2f4ff')+
    shape('M0 352v-53l96-35 70 30 65-57 71 37 84-78 77 64 72-32 90 37 76-81 78 80 85-33 89 54 83-42 104 54v55z','#51748c')+
    shape('M222 249l9-12 71 37-38-8-22-19-9 12zM374 205l12-9 77 64-29-13-26-25-15 14zM693 195l8-11 78 80-27-17-24-34-15 14z','#e1f6ff')+
    shape('M0 362v-32l111-27 100 26 92-30 96 33 97-27 103 28 101-32 90 27 99-29 111 30 100-24v37z','#9ebdc9')+
    pine(60,.68)+pine(1129,.75)+pine(190,.5)+pine(1014,.44)+
    ground('#c3e0ed','#617987','#f0faff',['#b0d0df','#7ca0b0','#d1e2e8'],seed);
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
  snow:['#071e35','#21455f','#6593a8'],volcano:['#190f21','#472232','#923d3d'],
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
