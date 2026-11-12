import {WORLD} from './mission.mjs';

const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path = (d,fill) => `<path d="${d}" fill="${fill}"/>`;

function windowBay(x,y,broken) {
  const shape='M0 0h52v41H0z';
  return `<g transform="translate(${x} ${y})">` +
    path(shape,'#233735') + rect(3,3,46,31,'#172a29') +
    path('M5 4h42v26H5z','#516b60') +
    path('M6 5h13v9H6zM23 5h10v9H23zM7 18h9v9H7zM36 5h11v9H36z','#64786a') +
    (broken ? path('M26 5h7v7h5v5h9v13H28v-5h-6v-7h4z','#233937') : '') +
    path('M17 4h4v27h-4zM33 4h4v27h-4zM4 15h45v4H4z','#263c39') +
    path('M0 34h52v4h3v3H-3v-3H0z','#859184') +
    path('M3 38h46v3H3z','#586d62') + '</g>';
}

function workshop() {
  const shell='M0 360V260h49v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v51h11v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v54h13v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v56h25v101z';
  return '<g id="factory-workshop">' +
    path(shell,'#455c52') + path(shell,'url(#factory-brick)') +
    path('M0 260h49v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v8h-7v9H99v9H87v9H75v9H63v9H51v9H0zM118 257h11v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v8h-7v9h-12v9h-12v9h-12v9h-12v9h-12v9h-13zM198 257h13v-9h12v-9h12v-9h12v-9h12v-9h12v-9h9v8h-7v9h-12v9h-12v9h-12v9h-12v9h-12v9h-15z','#7d8c78') +
    path('M4 271h296v7H4zM0 348h305v12H0z','#2b413c') +
    [20,89,158,227].map((x,i)=>windowBay(x,287,i%3!==1)).join('') +
    path('M78 279h6v69h-6zM147 279h6v69h-6zM216 279h6v69h-6zM289 270h8v90h-8z','#314942') +
    path('M79 282h2v61h-2zM148 282h2v61h-2zM217 282h2v61h-2z','#6a7b69') +
    path('M9 331h13v3H9zM40 337h16v3H40zM103 334h18v3h-18zM181 335h17v3h-17zM240 341h12v3h-12z','#6b7767') +
    '</g>';
}

function loadingHall() {
  const shell='M904 361v-88h16v-13h18v-13h20v-19h212v9h18v12h12v112z';
  const shutter=Array.from({length:7},(_,i)=>rect(1032,295+i*8,112,2,'#4f655c')).join('');
  const warning=Array.from({length:5},(_,i)=>path(`M${1017+i*28} 278h11l-6 7h-11z`,'#aa9169')).join('');
  return '<g id="factory-loading-hall">' +
    path(shell,'#496158') + path(shell,'url(#factory-brick)') +
    path('M904 273h16v-13h18v-13h20v-19h212v9h18v12h12v8h-17v-12h-18v-9H965v19h-20v13h-18v13h-23z','#879382') +
    path('M969 250h200v8H969zM911 351h289v10H911z','#304740') +
    path('M1004 361v-72h11v-13h144v13h11v72z','#263d37') +
    path('M1004 289h11v-13h144v13h11v72h-8v-67h-10v-9h-130v9h-10v67h-8z','#758477') +
    rect(1024,290,128,71,'#1f3330') + rect(1032,292,112,66,'#354e46') + shutter + warning +
    path('M1032 345h28v3h32v3h52v7h-112z','#2d453f') +
    rect(1009,310,3,21,'#b09a73') + rect(1162,310,3,21,'#b09a73') +
    windowBay(934,291,true) +
    path('M978 228v-28h10v18h93v-22h12v32z','#384f49') +
    path('M980 200h4v22h101v-26h4v30H980z','#748679') +
    path('M993 218h6v10h-6zM1056 218h6v10h-6z','#2d463f') + '</g>';
}

function factoryFloor(seed) {
  const {width,height,groundY}=WORLD;
  let seams='', ballast='', sleepers='';
  for(let x=0;x<width;x+=48){
    const offset=(x/48*13+seed%17)%19;
    seams+=path(`M${x} ${groundY+4}h3v9h4v9h-7z`,'#364c45') +
      rect(x+offset+6,groundY+11,14,2,'#758273') +
      rect(x+offset+18,groundY+17,10,2,'#65796a');
    ballast+=rect(x+offset,groundY+47,12,3,'#52685d')+
      rect(x+offset+19,groundY+50,8,2,'#293e38');
    sleepers+=rect(x+5,groundY+30,13,20,'#233732')+
      rect(x+5,groundY+30,13,3,'#56675a');
  }
  return `<g id="factory-ground" data-ground-baseline="${groundY}">` +
    rect(0,groundY,width,height-groundY,'#3a5047') +
    rect(0,groundY,width,24,'#52675b') + rect(0,groundY,width,3,'#989888') + seams +
    rect(0,groundY+22,width,5,'#263c35') + sleepers +
    rect(0,groundY+33,width,3,'#7f8978') + rect(0,groundY+36,width,2,'#2b423a') +
    rect(0,groundY+43,width,3,'#697b6d') + ballast + '</g>';
}

export function factoryScene(seed) {
  return '<g id="abandoned-factory">' +
    '<defs><pattern id="factory-brick" width="48" height="20" patternUnits="userSpaceOnUse">' +
    path('M0 8h48v2H0zM0 18h48v2H0zM18 0h2v9h-2zM40 10h2v9h-2z','#3a5047') +
    path('M5 3h12v2H5zM23 12h16v2H23z','#566a5c') +
    '</pattern></defs>' +
    '<g id="factory-skyline">' +
    path('M0 365v-52h33v-23h23v19h40v-17h36v-50h18v-39h12v39h19v59h36v-15h42v-18h36v29h42v-22h43v23h43v-49h62v-18h23v18h25v-30h39v46h32v17h48v-35h69v-22h38v23h49v-39h22v-40h12v40h21v68h63v-18h45v18h49v-62h17v-28h11v28h21v42h53v-31h43v23h33v73z','#405a56') +
    path('M123 249h58v5h-58zM452 252h60v5h-60zM838 228h55v5h-55zM1051 251h58v5h-58z','#576e66') +
    path('M320 354v-35h32v-42h24v-8h94v8h20v63h42v14zM562 354v-41h28v-56h16v-9h61v9h18v78h27v19z','#48605a') +
    path('M357 277h128v5H357zM590 257h95v4h-95zM371 285h5v48h-5zM611 264h4v61h-4z','#5b7167') +
    path('M350 321h139v4H350zM591 283h94v4h-94zM591 303h94v4h-94z','#3b534f') +
    path('M697 356v-51h11v-21h22v-17h9v17h29v-28h10v28h17v-36h10v36h22v72z','#47615a') +
    path('M689 315h143v5H689zM700 334h128v3H700zM723 290h86v4h-86z','#556f65') +
    '</g><g id="factory-utility-pipes">' +
    path('M235 319h59v-17h244v-41h11v51h-246v17h-68zM624 336v-45h212v-26h12v37H635v34z','#293f3f') +
    path('M298 302h240v-41h4v46H298zM627 291h209v-26h4v31H627z','#768277') +
    [324,444,502,668,744,810].map(x=>{
      const y=x<600?300:289;
      return rect(x,y,8,16,'#364e46')+rect(x,y,3,13,'#839181');
    }).join('') +
    path('M356 315h7v39h-7zM483 315h7v39h-7zM691 302h7v51h-7zM800 302h7v51h-7z','#354f45') +
    path('M358 326h5v4h-5zM485 335h5v4h-5zM693 318h5v4h-5zM802 332h5v4h-5z','#728477') +
    '</g>' + workshop() + loadingHall() +
    path('M0 374v-19h85v4h54v-4h72v7h75v-8h72v9h81v-3h66v4h73v-6h53v5h82v-5h79v6h88v-8h79v5h60v-4h89v3h92v14z','#384e48') +
    path('M0 374v-4h165v-3h119v3h113v-4h105v4h89v-4h96v4h138v-3h103v3h112v-4h160v8z','#67796d') +
    factoryFloor(seed) + '</g>';
}
