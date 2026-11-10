/**
 * NES/Dendy-совместимый checkpoint пустынного каньона.
 * Только SVG-фигуры — без внешних ассетов, JavaScript или смены хитбоксов.
 */
import {DESERT_CHECKPOINT,WORLD} from './mission.mjs';

const fmt = n => Number(n.toFixed(6)).toString();
const pct = (t,d) => fmt(Math.min(1,Math.max(0,t/d)));
const R = (x,y,w,h,c) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';

export function checkpointMarkup(level,mission){
  if(level.location!=='desert')return '';
  const {playerX,gateX}=DESERT_CHECKPOINT;
  if(!Number.isFinite(mission.duration)||mission.finishAt<0||
    mission.finishAt>=mission.returnStart||mission.returnStart>=mission.duration)
    throw new Error('Некорректное время победной сцены checkpoint');
  const win=mission.finishAt,leave=mission.returnStart,d=mission.duration;
  const dark='#382f36',sh='#68433d',stone='#935849',warm='#bf7954',light='#e0a06a';
  const base=[
    // Каменная облицовка ПОД уровнем стоп, совпадающим с WORLD.groundY.
    R(982,WORLD.groundY,218,6,dark),R(986,WORLD.groundY+6,214,9,stone),
    R(1000,WORLD.groundY+7,49,3,light),R(1060,WORLD.groundY+9,39,3,warm),
    R(1110,WORLD.groundY+8,47,3,light),R(1170,WORLD.groundY+8,28,3,warm),
    R(992,WORLD.groundY+15,208,12,sh),R(988,WORLD.groundY+27,212,29,dark),
    R(1004,WORLD.groundY+29,41,6,stone),R(1060,WORLD.groundY+37,56,5,stone),
    R(1141,WORLD.groundY+31,36,5,warm),R(1018,WORLD.groundY+48,58,4,sh),
    R(1102,WORLD.groundY+51,43,5,stone)
  ];
  // Узкая арка справа от точки остановки бойца. Ступени — единичные
  // пиксельные блоки, а не растянутые вертикальные колонны.
  const arch=[
    '<path d="M'+gateX+' 374V331h5v-14h6v-10h7v-8h8v-7h68v8h8v9h7v14h3v51h-19v-56h-16v-5h-38v5h-15v56z" fill="'+dark+'"/>',
    '<path d="M1105 373v-40h5v-14h7v-12h9v-8h47v7h9v14h8v54h-14v-59h-16v-6h-28v6h-13v59z" fill="'+stone+'"/>',
    R(1113,322,8,16,light),R(1120,311,14,6,warm),
    R(1137,301,44,5,light),R(1182,320,6,18,light),
    R(1113,350,9,7,sh),R(1177,342,9,5,sh),
    R(1104,366,25,8,sh),R(1167,364,30,10,sh),
    R(1123,316,8,4,dark),R(1176,312,7,4,dark),
    R(1105,284,89,17,dark),R(1109,286,81,12,sh),
    '<text x="1150" y="296" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" letter-spacing=".8" fill="#f8d69b">CHECKPOINT</text>',
    R(1109,336,7,2,light),R(1124,307,11,3,warm),
    R(1145,304,16,3,warm),R(1167,305,11,3,light),R(1183,351,5,5,sh),
    '<path d="M1110 350h12m-6 7h11m52-8h9" stroke="#583c3d" stroke-width="2" fill="none"/>'
  ];
  const flag=[
    R(1157,249,3,36,dark),R(1155,249,7,3,light),R(1157,262,4,6,warm),
    '<g id="desert-victory-flag" opacity="0">',
    '<animate attributeName="opacity" calcMode="discrete" keyTimes="'+
      [0,pct(win,d),pct(leave,d),1].join(';')+
      '" values="0;1;0;0" dur="'+fmt(d)+'s" repeatCount="indefinite"/>',
    '<path d="M1161 254h31v7h-8v8h-23z" fill="#37795c"/>',
    R(1164,256,20,3,'#98ec92'),R(1168,262,11,3,'#61ad6c'),
    '</g>'
  ];
  return '<g id="desert-end-zone" data-checkpoint-player-x="'+playerX+
    '" data-gate-x="'+gateX+'" data-ground-y="'+WORLD.groundY+
    '" shape-rendering="crispEdges">'+base.join('')+arch.join('')+flag.join('')+'</g>';
}
