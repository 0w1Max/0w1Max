/** Factory V8: native pixel sprites. Legacy keys preserve the proven collision model. */
const C={ink:'#182631',dark:'#2d494b',steel:'#66847d',light:'#bcc6a0',deep:'#603e37',rust:'#a45d3a',orange:'#c67b45',gold:'#c4a256',wood:'#8d7049'};
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[c]}"/>`;
const p=(d,c)=>`<path d="${d}" fill="${C[c]}"/>`;
const bolts=(xs,y)=>xs.map(x=>r(x,y,2,2,'ink')+r(x,y,1,1,'light')).join('');
const crate=r(0,0,34,27,'ink')+r(2,2,30,23,'deep')+r(3,3,28,3,'orange')+r(3,7,28,16,'rust')+
 [6,14,23].map(x=>r(x,7,1,16,'deep')).join('')+
 p('M5 7h3v2h3v2h3v2h3v2h3v2h3v2h3v3h-3v-2h-3v-2h-3v-2h-3v-2h-3v-2H8v-2H5z','gold')+
 p('M26 7h3v3h-3v2h-3v2h-3v2h-3v2h-3v2h-3v2H8v-3h3v-2h3v-2h3v-2h3v-2h3V9h3z','wood')+
 [0,26].map(x=>r(x,1,8,6,'steel')+r(x+1,1,7,2,'light')+r(x,20,8,6,'steel')+r(x+1,20,7,2,'light')+bolts([x+3],4)+bolts([x+3],23)).join('')+
 r(14,2,6,8,'ink')+r(15,3,4,6,'gold')+r(16,5,2,3,'dark')+r(8,25,18,2,'ink');
const reel=r(1,17,42,2,'ink')+r(5,15,32,2,'wood')+r(10,3,23,13,'ink')+r(10,4,23,3,'steel')+r(10,8,23,6,'dark')+
 [13,17,21,25,29].map(x=>r(x,4,2,11,'ink')+r(x,4,1,8,'steel')).join('')+
 [2,28].map(x=>p(`M${x+4} 0h7v2h3v3h2v8h-2v3h-3v2h-7v-2h-3v-3h-1V5h1V2h3z`,'ink')+
 p(`M${x+5} 1h5v2h3v3h2v6h-2v3h-3v2h-5v-2h-3v-3h-1V6h1V3h3z`,'wood')+
 r(x+5,2,5,2,'gold')+r(x+3,5,2,7,'orange')+r(x+8,5,1,10,'deep')+r(x+6,7,6,5,'ink')+r(x+7,8,4,3,'steel')+r(x+8,8,2,1,'light')).join('')+r(40,13,3,3,'dark')+r(42,15,2,2,'steel');
function pipe(x,y){return p(`M${x+3} ${y}h9v1h3v2h2v7h-2v2h-3v1H${x+3}v-1h-2v-2h-1v-7h1v-2h2z`,'ink')+
 p(`M${x+3} ${y+1}h9v1h2v2h2v5h-2v2h-2v1H${x+3}v-1h-2V${y+3}h2z`,'rust')+
 r(x+4,y+1,8,1,'light')+r(x+2,y+3,1,7,'orange')+r(x+4,y+3,8,8,'ink')+r(x+3,y+5,2,5,'dark');}
const pipes=r(1,18,43,7,'ink')+r(3,19,39,4,'steel')+r(3,19,39,1,'light')+
 r(25,3,15,15,'dark')+r(24,3,15,3,'steel')+r(28,4,3,2,'rust')+r(39,6,3,13,'ink')+
 pipe(3,9)+pipe(19,9)+pipe(11,0)+r(1,16,3,7,'gold')+r(40,16,3,7,'gold')+bolts([5,36],21);
const motor=r(1,27,30,5,'ink')+r(3,28,26,3,'steel')+r(3,28,26,1,'light')+r(7,24,4,4,'rust')+r(22,24,4,4,'rust')+
 p('M5 7h18v2h3v3h2v10h-2v3h-3v1H5v-2H3v-3H1v-9h2V9h2z','ink')+
 r(5,9,18,14,'dark')+r(4,11,22,10,'steel')+r(6,9,16,2,'light')+
 [12,16,20].map(y=>r(5,y,19,2,'ink')+r(6,y,16,1,'light')).join('')+
 r(3,12,3,10,'rust')+r(24,12,3,10,'rust')+r(27,15,5,5,'ink')+r(27,16,5,3,'gold')+
 r(8,1,12,7,'ink')+r(9,2,10,5,'steel')+r(9,2,10,1,'light')+bolts([11,16],4)+r(10,22,9,4,'deep');
const top=(body)=>r(0,0,128,12,'ink')+r(1,1,126,2,'light')+body;
const catwalk=top(r(2,4,124,6,'dark')+Array.from({length:15},(_,i)=>r(4+i*8,5,4,4,i%2?'steel':'ink')).join('')+
 [1,31,63,95,124].map(x=>r(x,3,3,8,'steel')+r(x,4,1,1,'gold')).join('')+r(2,10,124,2,'steel'))+
 p('M5 12h4v15h3l16-15h6L13 32H5z','ink')+p('M8 12h3v12l13-12h5L11 29H8z','steel')+
 p('M123 12h-4v15h-3l-16-15h-6l21 20h8z','ink')+p('M120 12h-3v12l-13-12h-5l18 17h3z','steel');
const conveyor=p('M5 0h118v2h3v3h2v10h-2v3h-3v2H5v-2H2v-3H0V5h2V2h3z','ink')+
 r(7,1,114,2,'light')+r(8,4,112,8,'dark')+
 Array.from({length:13},(_,i)=>p(`M${10+i*8} 4h5l-3 6h-5z`,'ink')).join('')+
 r(8,13,112,5,'rust')+r(8,13,112,1,'gold')+bolts([21,42,63,84,105],15)+
 [2,114].map(x=>p(`M${x+2} 3h6v2h2v8h-2v2h-6v-2h-2V5h2z`,'steel')+r(x+2,5,6,7,'dark')+r(x+4,7,2,3,'gold')).join('')+
 p('M9 20h5v7h5l7-7h5L18 32H9zM119 20h-5v7h-5l-7-7h-5l13 12h9z','ink')+
 p('M12 20h3v7l7-7h4L15 30h-3zM116 20h-3v7l-7-7h-4l11 10h3z','gold');
const deck=top(r(2,4,124,7,'deep')+Array.from({length:8},(_,i)=>r(3+i*15,4,13,6,i%2?'orange':'rust')+bolts([5+i*15],6)).join('')+r(2,10,124,2,'rust'))+
 [9,109].map(x=>r(x,12,10,18,'ink')+r(x+2,12,6,16,'rust')+r(x+2,12,2,14,'orange')+r(x-3,28,16,4,'ink')+r(x-2,29,14,2,'steel')).join('')+
 r(19,22,90,6,'ink')+r(19,23,90,3,'rust')+r(20,23,88,1,'orange')+r(61,21,6,8,'steel')+bolts([63],24);
const ART={'cargo-crate':[34,27,crate],'cable-reel':[44,19,reel],'pipe-bundle':[45,25,pipes],'electric-motor':[32,32,motor],
 'steel-catwalk':[128,32,catwalk],'stopped-conveyor':[128,32,conveyor],'service-deck':[128,32,deck]};
export const factoryObstacles=Object.freeze({'sandbags':'pipe-bundle','stone-ruin':'electric-motor','supply-crate':'cargo-crate','fallen-log':'cable-reel'});
export const factoryPlatforms=Object.freeze({'metal-catwalk':'steel-catwalk','camo-platform':'stopped-conveyor','wooden-bridge':'service-deck'});
export function factorySpriteDefinitions(names){return '<defs>'+[...new Set(names)].map(name=>{const a=ART[name];if(!a)throw Error('Unknown factory sprite: '+name);return `<symbol id="factory-v8-${name}" viewBox="0 0 ${a[0]} ${a[1]}" preserveAspectRatio="none">${a[2]}</symbol>`;}).join('')+'</defs>';}
export function factorySprite(name,x,y,width,height){if(!ART[name])throw Error('Unknown factory sprite: '+name);return `<use href="#factory-v8-${name}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;}
