import {WORLD} from './mission.mjs';

const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path = (d,fill) => `<path d="${d}" fill="${fill}"/>`;

function windowBay(x,y,broken) {
  return rect(x,y,38,30,'#273b3a') +
    rect(x+4,y+3,30,23,'#192b2c') +
    path(`M${x+5} ${y+4}h28v21h-28z`,broken?'#415855':'#586961') +
    rect(x+17,y+3,3,24,'#243a39') + rect(x+4,y+12,30,3,'#243a39') +
    (broken ? path(`M${x+20} ${y+15}h13v10h-7v-4h-6z`,'#233637') : '') +
    rect(x-2,y+27,42,3,'#738073');
}

function workshop() {
  return '<g id="factory-workshop">' +
    path('M0 360V267h65l55-47v45l64-48v48l63-42v41h53v96z','#3a514d') +
    path('M0 267h65l55-47v12l-50 43H0zM120 265l64-48v12l-54 42h-10zM184 265l63-42v11l-53 38h-10z','#687a6f') +
    rect(0,275,300,6,'#293d3b') +
    [31,93,158,222].map((x,i)=>windowBay(x,291,i%2===0)).join('') +
    path('M15 319h20v2H15zM66 321h16v2H66zM121 316h17v2h-17zM203 324h19v2h-19zM39 341h19v2H39zM138 343h22v2h-22zM211 338h14v2h-14z','#50635a') +
    rect(14,333,272,3,'#586960') + rect(280,276,17,80,'#293d3b') +
    path('M8 349h21v-5h22v4h29v5h30v7H8zM235 351h22v-8h16v4h22v13h-60z','#334944') +
    '</g>';
}

function loadingHall() {
  const shutter = Array.from({length:6},(_,i)=>rect(1029,300+i*8,104,2,'#57665d')).join('');
  return '<g id="factory-loading-hall">' +
    path('M906 360v-87h25v-16h26v-18h226v17h17v104z','#465b53') +
    path('M906 273h25v-16h26v-18h226v7H963v18h-25v16h-32z','#798477') +
    rect(1021,287,120,73,'#253938') + rect(1029,295,104,65,'#344a46') + shutter +
    rect(1015,289,6,67,'#8b795a') + rect(1141,289,6,67,'#8b795a') +
    windowBay(963,281,true) + windowBay(1154,281,false) +
    rect(1071,277,27,5,'#a58a61') +
    path('M984 237v-24h7v17h66v-31h8v38z','#52675f') +
    path('M988 230h69v-31h3v34h-72z','#7c8779') + '</g>';
}

function factoryFloor(seed) {
  const {width,height,groundY}=WORLD;
  let details='';
  for(let x=0;x<width;x+=48){
    const offset=(x/48*13+seed%17)%19;
    details+=rect(x+offset,groundY+11,16,2,'#6d7569')+
      rect(x+offset,groundY+35,22,3,'#465954')+
      rect(x+47,groundY+3,1,15,'#394c48');
  }
  return `<g id="factory-ground" data-ground-baseline="${groundY}">` +
    rect(0,groundY,width,height-groundY,'#324744') +
    rect(0,groundY,width,23,'#52645c') + rect(0,groundY,width,3,'#929487') +
    rect(0,groundY+23,width,3,'#263a37') + details + '</g>';
}

export function factoryScene(seed) {
  return '<g id="abandoned-factory">' +
    '<g id="factory-skyline">' +
    path('M0 365v-52h33v-23h23v19h40v-17h36v-50h18v-39h12v39h19v59h36v-15h42v-18h36v29h42v-22h43v23h43v-49h62v-18h23v18h25v-30h39v46h32v17h48v-35h69v-22h38v23h49v-39h22v-40h12v40h21v68h63v-18h45v18h49v-62h17v-28h11v28h21v42h53v-31h43v23h33v73z','#405a56') +
    path('M123 249h58v5h-58zM452 252h60v5h-60zM838 228h55v5h-55zM1051 251h58v5h-58z','#576e66') +
    path('M320 354v-35h32v-42h24v-8h94v8h20v63h42v14zM562 354v-41h28v-56h16v-9h61v9h18v78h27v19z','#48605a') +
    path('M357 277h128v5H357zM590 257h95v4h-95zM371 285h5v48h-5zM611 264h4v61h-4z','#5b7167') +
    path('M350 321h139v4H350zM591 283h94v4h-94zM591 303h94v4h-94z','#3b534f') +
    '</g><g id="factory-utility-pipes">' +
    path('M235 319h59v-17h244v-41h11v51h-246v17h-68zM624 336v-45h212v-26h12v37H635v34z','#293f3f') +
    path('M298 302h240v-41h4v46H298zM627 291h209v-26h4v31H627z','#768277') +
    [324,444,502,668,744,810].map(x=>rect(x,x<600?302:291,5,13,'#4b5e56')).join('') +
    '</g>' + workshop() + loadingHall() +
    path('M0 374v-19h85v4h54v-4h72v7h75v-8h72v9h81v-3h66v4h73v-6h53v5h82v-5h79v6h88v-8h79v5h60v-4h89v3h92v14z','#384e48') +
    path('M0 374v-4h165v-3h119v3h113v-4h105v4h89v-4h96v4h138v-3h103v3h112v-4h160v8z','#67796d') +
    factoryFloor(seed) + '</g>';
}
