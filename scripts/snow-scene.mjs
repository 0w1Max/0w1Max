import {WORLD} from './mission.mjs';

const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path = (d,fill) => `<path d="${d}" fill="${fill}"/>`;

function pine(x,y,scale,near=false) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">` +
    rect(-2,-12,4,12,near?'#344e61':'#47687a') +
    path('M-3-55h6v7h4v7h4v6h-3v3h7v7h4v6h-5v3h9v7h4v4h-54v-4h4v-7h9v-3h-5v-6h4v-7h7v-3h-3v-6h4v-7h4z',near?'#203f51':'#3a6175') +
    path('M-3-55h6v7h4v5H-7v-5h4zM-11-32h8v4h13v4h-25v-4h4zM-19-16h10v3h10v4h-24v-4h4z',near?'#9ebdc6':'#628a9e') +
    '</g>';
}

function observationTower() {
  const deck = rect(58,251,114,7,'#7795a4') + rect(53,251,9,7,'#b2ccd2');
  return '<g id="snow-watchtower">' +
    path('M65 354V257h9v32h13v-11h13v-20h8v26h-8v10H86v13H74v47zM142 354v-48h-13v-12h-13v-11h-8v-25h8v20h13v12h13v-33h8v97z','#344d5f') +
    rect(65,258,3,96,'#608498') + rect(142,258,3,96,'#608498') +
    rect(79,218,67,33,'#273e52') + rect(145,222,15,29,'#355568') +
    path('M72 218v-5h8v-6h65v5h13v6z','#bfd3db') +
    rect(80,218,65,4,'#63899e') + rect(86,226,52,11,'#132d41') +
    rect(89,228,19,7,'#9c805e') + rect(112,228,23,7,'#dcb073') +
    rect(145,228,10,8,'#6e6558') + deck +
    rect(119,180,3,27,'#7696a3') + rect(109,186,21,2,'#7696a3') +
    rect(118,177,5,4,'#d4a16b') + '</g>';
}

function bunker() {
  const vents = [979,994,1009,1024].map(x=>rect(x,286,10,3,'#132c40')).join('');
  const joints = [898,922,1105,1134,1163].map(x=>rect(x,282,3,65,'#2e4a5d')).join('');
  return '<g id="snow-bunker">' +
    path('M879 351v-73h18v-13h38v-15h215v13h25v10h25v78z','#3d5c6e') +
    path('M879 278h18v-13h38v-15h215v13h25v10h25v8h-29v-6h-28v-11H942v12h-42v8h-21z','#87a9b7') +
    path('M885 276h14v-11h37v-15h45v-3h56v3h59v-4h50v5h11v12h25v10h18v3h-30v-8h-26v-10H942v12h-37v8h-20z','#d1e0e3') +
    joints + rect(964,295,124,56,'#294658') +
    path('M949 351v-33h8v-14h12v-10h110v9h14v14h7v34z','#7696a6') +
    path('M960 351v-31h7v-13h13v-5h90v5h12v13h7v31z','#162e41') +
    rect(975,324,99,27,'#345468') +
    [328,335,342].map(y=>rect(978,y,93,2,'#253f54')).join('') +
    rect(958,283,89,9,'#527489') + vents +
    rect(947,321,6,13,'#d1a16d') + rect(1095,321,6,13,'#d1a16d') +
    rect(1064,270,57,10,'#2b4457') + rect(1067,272,22,5,'#9c805e') + rect(1094,272,24,5,'#d2a675') +
    rect(1134,209,5,37,'#6f92a3') + rect(1123,218,27,3,'#6f92a3') +
    rect(1148,214,3,11,'#6f92a3') + rect(1134,205,5,4,'#d4a16b') +
    '</g>';
}

function snowpack(seed) {
  const {width,groundY,height} = WORLD;
  let strata = '';
  let stones = '';
  for (let x=0; x<width; x+=40) {
    const drift = (x/40*7+seed%29)%11;
    strata += path(`M${x} ${groundY+9+drift}h17v3h12v4h11v7h-13v-3h-15v-3h-12z`,x%120?'#87a8ba':'#7497ad');
    stones += rect(x+drift,groundY+31+drift,11+drift,4,x%160?'#658aa0':'#a3bdca');
  }
  return `<g id="snow-ground" data-ground-baseline="${groundY}">` +
    rect(0,groundY,width,height-groundY,'#4a7088') +
    rect(0,groundY,width,27,'#9bb8c8') + strata +
    rect(0,groundY,width,7,'#dbe8eb') +
    rect(0,groundY+27,width,4,'#779cb1') + stones + '</g>';
}

export function snowScene(seed) {
  const distantPines = Array.from({length:27},(_,i)=>{
    const x=i*47+(i*23)%27;
    const y=337+(i*11)%18;
    return pine(x,y,(55+(i*17)%44)/100);
  }).join('');
  return '<g id="snow-base">' +
    '<g id="snow-mountain-ranges">' +
    path('M0 338V257h27v-16h25v-14h22v-15h30v-13h26v-15h39v15h27v17h27v19h33v16h42v-14h37v-18h35v-14h28v-16h28v-17h39v16h27v16h22v15h31v18h33v13h26v-13h40v-16h35v-16h36v-15h41v14h27v15h36v18h42v13h35v-15h29v-21h24v-18h37v-16h36v17h27v20h27v17h36v98z','#426984') +
    path('M52 241v-14h22v-15h30v-13h26v-15h39v15h27v17h27v19h-19v-9h-21v-13h-24v-10h-20v12h-21v10H91v8H73v8zM335 237v-18h35v-14h28v-16h28v-17h39v16h27v16h22v15h-21v-8h-21v-12h-25v-9h-16v12h-20v9h-25v10h-25v9h-16v7zM913 258h13v-15h29v-21h24v-18h37v-16h36v17h27v20h27v17h-21v-10h-20v-12h-22v-15h-20v13h-22v10h-19v9h-21v12h-21v9z','#7296aa') +
    path('M159 214h20v12h20v13h26v14h22v14h-18v-8h-23v-9h-23v-11h-24zM454 197h18v12h18v12h21v12h25v19h-23v-9h-20v-13h-19v-11h-20zM781 228h18v11h26v12h23v12h27v15h-26v-7h-24v-8h-25v-10h-19zM1048 208h20v13h20v12h18v17h-21v-9h-18v-12h-19z','#345870') +
    path('M19 272h46v-6h17v5H66v8H33v5H19zM312 263h24v-8h22v-5h13v6h-15v7h-16v7h-28zM553 272h36v-7h22v-8h15v7h-12v9h-23v6h-38zM849 290h29v-7h34v-7h16v5h-13v8h-33v7h-33z','#537b91') +
    path('M0 365v-61h36v-11h33v-8h45v-12h40v8h52v15h49v13h56v-10h30v-10h57v-12h51v10h51v9h55v13h63v-9h31v-12h42v-8h51v8h50v10h50v12h43v-11h36v-12h47v-9h55v12h43v9h40v10h37v56z','#60889e') +
    '</g><g id="snow-treeline">'+distantPines+'</g>' +
    observationTower() + bunker() +
    path('M0 374v-35h38v-8h32v8h33v5h48v-5h48v7h49v7h37v-4h56v7h67v-4h51v6h55v-5h51v5h70v-5h68v-6h59v-6h53v6h50v-4h75v3h58v-6h49v5h77v-4h76v32z','#759aae') +
    path('M0 367h49v-5h32v5h72v-6h54v5h86v-4h33v4h78v-4h79v5h75v-4h88v-4h80v4h112v4h95v-6h76v3h79v-4h112v14H0z','#acc8d4') +
    pine(29,370,1.36,true) + pine(207,370,1.04,true) + pine(840,369,.95,true) + pine(1174,369,1.45,true) +
    snowpack(seed) + '</g>';
}
