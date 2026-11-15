import {WORLD} from './mission.mjs';

// The scenery is drawn on a half-resolution grid. One art pixel is two SVG pixels.
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path = (d,fill) => `<path d="${d}" fill="${fill}"/>`;
const group = (x,y,art) => `<g transform="translate(${x} ${y})">${art}</g>`;
const repeat = (count,draw) => Array.from({length:count},(_,i)=>draw(i)).join('');

function furnace(x,y) {
  return group(x,y,
    path('M0 69V24h3v-8h5v-5h10V0h15v11h11v5h5v8h3v45z','#3a514d') +
    path('M4 27v-7h4v-5h10v-4h15v4h11v5h4v7z','#61746a') +
    path('M5 28h7v37H5zM15 25h3v43h-3z','#50665c') +
    path('M33 26h17v36H33zM3 42h46v3H3zM4 56h46v3H4z','#304743') +
    path('M5 41h40v2H5zM4 55h42v1H4zM20 2h4v9h-4z','#718277') +
    rect(22,33,6,7,'#324944') + rect(23,34,3,3,'#927d60'));
}

function pipe(x,y,width) {
  return group(x,y,
    path(`M0 0h8v10h${width}v-8h8v16H0z`,'#253b39') +
    path(`M1 1h3v11h${width+7}v2H1z`,'#819184') +
    rect(5,14,width+8,2,'#526b5e') +
    repeat(Math.floor(width/23),i=>rect(18+i*23,10,3,8,'#3b534a') +
      rect(18+i*23,10,1,5,'#9c9d83')));
}

function workshop() {
  const shell='M0 179V118h15v-6h8v-5h7v-6h8v-6h9v17h9v-5h8v-6h9v-6h9v18h8v-5h8v-7h8v-6h10v19h14v65z';
  return '<g id="factory-workshop">' +
    path(shell,'#425950') + path(shell,'url(#factory-masonry)') +
    path('M0 118h15v-6h8v-5h7v-6h8v-6h9v3h-8v6h-8v6h-7v5h-8v6H0zM47 112h9v-5h8v-6h9v-6h9v3h-8v6h-9v6h-8v5H47zM82 113h8v-5h8v-7h8v-6h10v3h-9v6h-8v7h-8v5h-9z','#8c9580') +
    path('M0 121h129v4H0zM0 171h129v8H0zM48 126h5v47h-5zM113 126h8v47h-8z','#273f39') +
    path('M7 133h33v24H7zM58 131h49v29H58z','#203632') +
    path('M9 135h28v17H9zM61 134h43v21H61z','#6c8271') +
    path('M9 135h13v6H9zM62 135h13v4H62zM80 136h10v6H80zM92 143h11v10H92z','#889788') +
    path('M19 136h3v5h5v4h-4v7H12v-9h4v-3h3zM64 144h10v-5h7v5h8v7h6v4H64z','#2c4640') +
    path('M24 134h2v20h-2zM9 143h28v2H9zM77 133h2v24h-2zM91 133h2v24h-2zM60 143h45v2H60z','#344e45') +
    path('M6 155h35v3H6zM57 157h51v3H57zM49 127h2v42h-2zM115 127h2v43h-2z','#82917d') +
    path('M121 149h9v4h-3v8h3v6h-6v7h-3zM2 161h11v3H2zM32 166h13v3H32zM96 164h15v2H96z','#687767') +
    '</g>';
}

function loadingHall() {
  const shell='M457 179v-35h8v-12h11v-11h13v-12h58v-6h23v6h30v70z';
  return '<g id="factory-loading-hall">' +
    path(shell,'#4c6257') + path(shell,'url(#factory-masonry)') +
    path('M457 144h8v-12h11v-11h13v-12h58v-6h23v6h30v4h-32v-6h-19v6h-59v12h-12v11h-11v12h-10z','#899380') +
    path('M489 118h111v4H489zM467 171h133v8H467z','#304a40') +
    path('M501 179v-43h8v-7h75v7h8v43z','#243a35') +
    path('M501 136h8v-7h75v7h8v43h-5v-40h-8v-6h-67v6h-7v40h-4z','#889781') +
    rect(509,140,73,39,'#1a302a') +
    path('M512 140h67v27h-14v2h-15v-2h-38z','#425b4f') +
    repeat(6,i=>rect(512,142+i*4,67,1,'#6a7f6c')) +
    path('M514 169h26v4h-26zM558 174h18v2h-18z','#2f493d') +
    repeat(5,i=>path(`M${514+i*13} 132h7l-3 3h-7z`,'#b59a6b')) +
    path('M502 147h3v13h-3zM587 147h3v13h-3zM475 145h13v3h-13z','#9e8a65') +
    path('M550 103V90h5v8h32V85h5v18z','#354e47') +
    path('M550 90h2v10h37V85h3v16h-42z','#74877a') +
    '</g>';
}

function floor(seed) {
  return '<g id="factory-ground" data-ground-baseline="374">' +
    rect(0,187,600,28,'#344b42') + rect(0,187,600,12,'#596d5f') +
    rect(0,187,600,1,'#a0a18a') + rect(0,198,600,2,'#293e36') +
    repeat(25,i=>{
      const x=i*24, offset=(i*13+seed%17)%11;
      return path(`M${x+6} 189h1v3h3v3h3v3h-2v-2h-3v-3h-3z`,'#3e574c') +
        rect(x+offset+2,195,7,1,'#768675') +
        rect(x+4,201,7,13,'#253b33') + rect(x+4,201,7,2,'#5a6b5d') +
        rect(x+offset+11,212,5,1,'#617467');
    }) +
    path('M0 203h600v1H0zM0 209h600v1H0z','#82917d') +
    path('M0 204h600v1H0zM0 210h600v1H0z','#253d33') + '</g>';
}

export function factoryScene(seed) {
  return `<g id="abandoned-factory" transform="scale(2)" shape-rendering="crispEdges" data-width="${WORLD.width}">` +
    '<defs><pattern id="factory-masonry" width="26" height="10" patternUnits="userSpaceOnUse">' +
    path('M0 4h26v1H0zM0 9h26v1H0zM8 0h1v4H8zM21 5h1v4h-1z','#344c43') +
    path('M2 2h5v1H2zM11 6h9v1h-9zM18 1h6v1h-6z','#607163') +
    '</pattern></defs>' +
    '<g id="factory-skyline">' +
    path('M0 180v-38h19v-12h21v7h20v-13h27v19h31v-25h27v-11h20v18h20V94h6V77h8v17h7v38h21v-12h25v13h22v-23h17v-8h18v13h28v24h26v-21h24V90h8V73h7v17h8v45h25v-14h23v-11h37v24h18v-38h7V80h8v16h6v32h26v-14h41v66z','#3b5652') +
    path('M187 94h15v3h-15zM390 90h16v3h-16zM515 96h17v3h-17zM270 138h17v2h-17zM452 125h31v2h-31z','#526b61') +
    path('M113 177v-36h27v-7h52v4h13v39zM334 177v-35h17v-10h24v-8h39v10h16v43z','#4a6359') +
    path('M141 138h53v3h-53zM351 135h62v3h-62zM122 156h70v3h-70zM341 151h77v2h-77z','#5c7568') +
    '</g><g id="factory-furnaces">' + furnace(163,109) + furnace(208,119) + furnace(304,111) +
    path('M365 177v-26h8v-6h18v-6h44v-9h15v9h15v38z','#40594f') +
    path('M374 149h88v4h-88zM390 161h62v3h-62z','#5b7163') + '</g>' +
    '<g id="factory-utility-pipes">' + pipe(105,135,118) + pipe(260,148,134) +
    path('M145 152h4v25h-4zM215 152h4v25h-4zM353 164h4v14h-4zM386 164h4v14h-4z','#304b40') +
    '</g>' + workshop() + loadingHall() +
    path('M0 187v-10h23v3h20v-2h40v1h28v-3h24v3h37v-3h38v4h53v-3h30v3h69v-4h31v3h35v-3h33v2h47v-2h52v3h40v8z','#3e574a') +
    path('M0 185h32v-2h35v2h52v-2h24v1h19v2h27v-1h41v-2h14v2h65v-1h24v2h54v-2h50v1h57v-1h24v1h18v-2h44v2h20v2H0z','#718375') +
    floor(seed) + '</g>';
}
