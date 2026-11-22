/** Native SVG end screens: materials and silhouettes follow the approved locations. */
import {gameOverHeading,endScreenEntry} from './end-screen-art.mjs';
import {stormCoastVictory} from './coast-ui.mjs';

const subtitle=(text,color)=>`<text x="600" y="289" fill="${color}" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="2" text-anchor="middle">${text}</text>`;

function canyon(){return `
  <path d="M382 213h432v7h18v17h8v57h-12v13H374v-9h-12v-65h9v-13h11z" fill="#533b32"/>
  <path d="M382 220h432v7h11v63h-8v9H382v-8h-12v-52h6v-12h6z" fill="#a67350"/>
  <path d="M388 228h420v63H388z" fill="#4c3832"/>
  <path d="M382 220h432v5H382zM376 230h5v55h-5zM388 295h420v4H388z" fill="#dfbc83"/>
  <path d="M388 228h420v4H388zM802 233h6v58h-6z" fill="#735040"/>
  <path d="M389 218v8h7v8h-5M807 295v-7h8v-9M373 258h8v7h-5M824 247h-8v8h5" fill="none" stroke="#694739" stroke-width="3"/>
  <path d="M396 273h27v3h-27zM777 273h27v3h-27z" fill="#a67350"/>
  ${gameOverHeading('#f0d3a0','#251f24')}${subtitle('DESERT CANYON','#d9b77f')}`;}

function factory(){return `
  <path d="M378 210h444l16 16v68l-16 16H378l-16-16v-68z" fill="#24383a"/>
  <path d="M380 215h440l13 13v64l-13 13H380l-13-13v-64z" fill="#778d85"/>
  <path d="M387 224h426l9 9v54l-9 10H387l-9-10v-54z" fill="#30484b"/>
  <path d="M387 224h426v4H387zM378 233h4v54h-4z" fill="#c1c6ae"/>
  <path d="M388 293h424v4H388zM817 235h5v50h-5z" fill="#1b3035"/>
  <path d="M374 236h6v6h-6zM820 236h6v6h-6zM374 278h6v6h-6zM820 278h6v6h-6z" fill="#d0c6a1"/>
  <path d="M386 216h14v5h-14zM406 216h14v5h-14zM780 299h14v5h-14zM800 299h14v5h-14z" fill="#b79c62"/>
  <path d="M391 216h5v5h-5zM411 216h5v5h-5zM785 299h5v5h-5zM805 299h5v5h-5z" fill="#394641"/>
  ${gameOverHeading('#e3dfbd','#14272c')}${subtitle('ABANDONED FACTORY','#b9c6b5')}`;}

function temple(){return `
  <path d="M380 209h440v9h14v81h-10v13H376v-13h-10v-81h14z" fill="#294c45"/>
  <path d="M381 217h438v8h8v68h-10v10H383v-10h-10v-68h8z" fill="#7e9271"/>
  <path d="M391 229h418v62H391z" fill="#34574f"/>
  <path d="M381 217h438v4H381zM377 227h4v62h-4zM392 298h416v5H392z" fill="#c7bb89"/>
  <path d="M383 224h15v6h-9v10h-6zM817 224h-15v6h9v10h6zM383 292h15v-6h-9v-10h-6zM817 292h-15v-6h9v-10h6z" fill="#b4a975"/>
  <path d="M372 214h22v4h-12v6h-10zM805 214h23v12h-4v-8h-19zM375 288h4v12h12v6h-16z" fill="#587b4f"/>
  <path d="M402 306h32v-3h28v3h33m210 0h32v-3h28v3h33" fill="none" stroke="#659c90" stroke-width="3"/>
  ${gameOverHeading('#e2d6a7','#193c38')}${subtitle('FLOODED TEMPLE','#c2c99a')}`;}

const themes={desert:['canyon-game-over',canyon],industrial:['factory-game-over',factory],temple:['temple-game-over',temple]};
export function renderGameOver(location,timing){
  if(location==='coast')return stormCoastVictory(timing);
  if(!Object.hasOwn(themes,location))throw new Error('Unsupported end-screen location: '+location);
  const motion=endScreenEntry(timing),[id,art]=themes[location];
  return `<g id="${id}" data-biome="${location}" data-end-screen="game-over" shape-rendering="crispEdges">${motion}${art()}</g>`;
}

/** Replace only panel art; retain every byte of calendar, route, shots and alpha timing. */
export function replaceEndScreen(svg,location){
  const opening=/<g\b[^>]*\bid="mission-complete"[^>]*>/.exec(svg);
  if(!opening)throw new Error('Mission completion group is missing');
  const inside=opening.index+opening[0].length;
  const alpha=/^\s*<animate\b[^>]*attributeName="opacity"[^>]*\/>/.exec(svg.slice(inside));
  if(!alpha)throw new Error('Completion visibility timeline is missing');
  const attribute=name=>new RegExp(`\\b${name}="([^"]+)"`).exec(alpha[0])?.[1];
  const duration=Number(attribute('dur')?.replace(/s$/,''));
  const keys=attribute('keyTimes')?.split(';').map(Number);
  if(attribute('values')!=='0;0;1;1;0;0'||keys?.length!==6||!keys.every(Number.isFinite))
    throw new Error('Unrecognized completion visibility timeline');
  const tags=/<\/?g\b[^>]*>/g;tags.lastIndex=inside;
  let depth=1,closing;
  for(let tag;(tag=tags.exec(svg));){
    depth+=tag[0].startsWith('</')?-1:tag[0].endsWith('/>')?0:1;
    if(depth===0){closing=tag.index;break;}
  }
  if(closing===undefined)throw new Error('Unclosed completion group');
  const artStart=inside+alpha[0].length;
  const art=renderGameOver(location,{duration,finishedAt:keys[2]*duration,fadeBegin:keys[3]*duration});
  return svg.slice(0,artStart)+art+svg.slice(closing);
}
