/** Volcano V3 - cleaner NES/Contra-style volcanic stage. */
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const p=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const g=(id,body)=>`<g id="${id}" shape-rendering="crispEdges">${body}</g>`;
const PAL={
  sky:'#17061f', band1:'#4a243b', band2:'#6f3540', band3:'#9b4143',
  far:'#39273b', far2:'#4f3144',
  rock:'#2a2433', rock2:'#43394b', rock3:'#6c6274',
  ground:'#221f2c', edge:'#5f5968', edge2:'#8b8290',
  lava:'#e2572a', lava2:'#ff9b2f', lava3:'#ffe07a', ember:'#b83a2e',
  ruin:'#241f2b', ruin2:'#3a3240'
};
function seeded(seed){let v=(seed^0x9e3779b9)>>>0;return ()=>((v=Math.imul(v,1664525)+1013904223>>>0)/4294967296)}
function horizon(){const C=PAL;return g('volcano-horizon',[
 r(0,0,1200,211,C.sky),r(0,211,1200,31,C.band1),r(0,242,1200,29,C.band2),r(0,271,1200,28,C.band3),r(0,299,1200,75,C.band1),
 r(0,246,1200,4,'#7e4350'),r(0,301,1200,3,'#b14f46')
].join(''));}
function ridges(){const C=PAL;return g('volcano-ridges',[
 p('M0 354v-34h44v-10h39v-16h30v14h38v-12h46v11h36v17h40v30H0z',C.far),
 p('M252 355v-21h29v-15h36v-18h29v14h40v-12h41v18h31v34H252z',C.far2),
 p('M741 356v-25h48v-18h42v-19h42v11h38v16h36v-10h48v17h39v28H741z',C.far),
 p('M1010 356v-17h31v-14h36v-16h31v10h42v17h50v20H1010z',C.far2),
 r(94,320,24,4,'#6a4354'),r(388,325,28,4,'#7b5060'),r(824,323,29,4,'#6f4659'),r(1108,329,32,4,'#7c4c57')
].join(''));}
function volcano(seed){const C=PAL;const rand=seeded(seed+11);let sparks='';for(let i=0;i<18;i++){const x=585+Math.floor((rand()*90));const y=190+Math.floor(rand()*42);const s=i%5===0?4:2;sparks+=r(x,y,s,s,i%5===0?C.lava3:i%2?C.lava2:C.ember)}
 return g('volcano-caldera',[
 p('M430 374v-18h24v-18h22v-19h21v-18h20v-20h19v-17h19v-15h20v-13h20v-12h21v-10h28v-7h26v8h20v9h23v10h21v11h18v13h22v16h20v15h19v19h20v20h20v18h24v18h27v20z',C.rock),
 p('M463 374v-18h22v-17h20v-18h19v-17h18v-18h19v-17h17v-15h19v-13h17v-12h20v-10h17v-10h18v-8h18v8h-14v11h-18v11h-17v12h-17v15h-20v17h-18v18h-19v19h-21v17h-20v18h-20v17z',C.rock2),
 p('M570 232h20v-5h18v5h25v-5h20v5h19v7h-13v6h-24v-6h-52v6h-22v-6h-11z',C.rock3),
 r(586,229,73,5,C.ember),r(596,229,49,4,C.lava2),r(608,229,22,3,C.lava3),
 p('M598 234h7v16h-6v15h-9v17h-10v19h-11v19h-11v21h-12v18h-11v15h-9v-4h7v-16h11v-17h11v-19h10v-19h9v-17h8z',C.lava),
 p('M609 234h4v18h5v18h6v18h8v16h10v17h11v16h12v19h11v18h9v-4h-7v-18h-11v-18h-11v-18h-10v-17h-8v-17h-8v-18h-6z',C.lava),
 p('M603 240h4v13h-5v15h-7v15h-7v16h-8v16h-8v17h-9v15h-8v13h-6v-4h4v-15h8v-14h8v-17h7v-17h7v-16h7v-16h6z',C.lava2),
 p('M611 240h2v15h5v15h7v16h7v15h8v15h8v17h9v15h8v13h6v-4h-4v-14h-7v-15h-8v-17h-8v-16h-7v-16h-6v-15h-6z',C.lava2),
 p('M596 181h12v-9h10v10h9v9h10v13h-10v8h-11v9h-17v-9h-11v-9h-8v-10h6z',C.rock2),
 p('M602 175h10v-6h6v7h6v7h7v10h-7v7h-9v8h-10v-8h-8v-7h-6v-7h6z',C.rock3),
 p('M595 167h17v-8h14v9h14v9h10v11h-11v9h-13v9h-16v8h-17v-8h-12v-9h-11v-9h8v-11h11z','#3f3447'),
 sparks
 ].join(''));}
function smoke(seed){const C=PAL;const rand=seeded(seed+33);let bits='';for(let i=0;i<14;i++){const x=560+Math.floor(rand()*120),y=164+Math.floor(rand()*38),w=10+Math.floor(rand()*12),h=4+Math.floor(rand()*7);bits+=r(x,y,w,h,i%3?C.rock2:C.rock3)}return g('volcano-smoke',bits)}
function ruins(){const C=PAL;return g('volcano-ruins',[
 p('M59 374v-93h19v-19h18v-13h25v9h18v18h17v19h25v79z',C.ruin),
 p('M74 374v-81h16v-18h15v-11h17v12h16v18h16v80z',C.ruin2),r(86,305,7,18,C.ember),r(89,309,3,10,C.lava2),r(113,318,7,21,C.ruin),r(116,322,3,10,C.lava),r(141,332,6,17,C.ruin),r(143,335,2,9,C.lava2),
 r(72,292,19,5,C.rock3),r(104,277,19,5,C.rock3),r(137,292,15,5,C.rock3),
 p('M1008 374v-90h18v-19h18v-14h27v8h17v18h18v21h23v76z',C.ruin),
 p('M1020 374v-78h16v-18h16v-11h17v13h14v18h17v76z',C.ruin2),r(1034,306,7,18,C.ruin),r(1037,309,3,10,C.lava),r(1061,321,7,18,C.ruin),r(1064,324,3,10,C.lava2),r(1088,335,7,16,C.ruin),r(1091,338,3,8,C.lava),
 r(1016,295,19,5,C.rock3),r(1047,280,19,5,C.rock3),r(1081,297,14,5,C.rock3),
 r(176,328,99,6,C.ruin),r(180,331,91,3,C.ruin2),r(923,325,100,6,C.ruin),r(927,328,92,3,C.ruin2)
 ].join(''));}
function lavaPools(seed){const C=PAL;const rand=seeded(seed+55);let emb='';for(let i=0;i<30;i++){const x=(i<15?58:790)+Math.floor(rand()*(i<15?150:160));const y=359+Math.floor(rand()*9);emb+=r(x,y,2+(i%3)*2,2,i%4===0?C.lava3:i%2?C.lava2:C.ember)}return g('volcano-lava-waterfalls',[
 p('M46 362h140v4h32v8H21v-6h25z',C.ember),p('M60 363h119v3h28v5H43v-3h17z',C.lava),r(71,364,46,3,C.lava3),r(127,365,39,3,C.lava2),
 p('M808 362h138v-4h36v5h34v11H774v-8h34z',C.ember),p('M816 363h115v-3h31v5h26v6H797v-4h19z',C.lava),r(823,364,47,3,C.lava3),r(900,365,39,3,C.lava2),
 p('M148 338h24v13h8v11h12v12h-19v-10h-10v-12h-15z',C.ember),p('M154 338h15v13h7v11h8v12h-9v-10h-9v-12h-12z',C.lava),r(159,341,7,10,C.lava3),
 p('M874 339h27v11h-5v24h-20v-21h-2z',C.ember),p('M879 339h18v11h-5v24h-11v-20h-2z',C.lava),r(884,342,6,20,C.lava3),emb
 ].join(''));}
function floor(seed){const C=PAL;const rand=seeded(seed+77);let chips='';for(let i=0;i<72;i++){const x=8+Math.floor(rand()*1180/4)*4,y=386+Math.floor(rand()*35/4)*4,w=4+4*Math.floor(rand()*3),h=2+2*Math.floor(rand()*2);chips+=r(x,y,w,h,i%5===0?C.edge2:i%2?C.edge:C.rock2)}return g('volcano-basalt-floor',[
 r(0,374,1200,4,'#111622'),r(0,378,1200,5,C.edge),r(0,383,1200,47,C.ground),r(0,424,1200,6,'#15141c'),
 r(0,389,212,3,C.rock2),r(227,391,195,3,C.rock2),r(441,389,178,3,C.rock2),r(640,392,163,3,C.rock2),r(818,389,198,3,C.rock2),r(1032,392,168,3,C.rock2),
 r(23,397,18,2,C.ember),r(286,404,20,2,C.ember),r(558,397,20,2,C.ember),r(882,403,20,2,C.ember),r(1121,400,18,2,C.ember),
 p('M0 374v-33h13v-11h13v-6h13v7h14v13h11v30z',C.rock),p('M0 366v-23h14v-8h14v7h10v24z',C.rock2),
 p('M1160 374v-21h11v-14h10v-10h10v7h9v38z',C.rock),p('M1168 369v-21h11v-8h9v29z',C.rock2),chips
 ].join(''));}
export function volcanoScene(seed=0){if(!Number.isSafeInteger(seed)||seed<0)throw new Error('bad seed');return `<g id="volcano-stage-v3" data-scene="volcano-nes" data-seed="${seed}" shape-rendering="crispEdges">${horizon()}${ridges()}${volcano(seed)}${smoke(seed)}${ruins()}${lavaPools(seed)}${floor(seed)}</g>`}
