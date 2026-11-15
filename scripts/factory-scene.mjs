import {WORLD} from './mission.mjs';
import {loadPixelSprites} from './pixel-sprites.mjs';

const {definitions,sprite} = loadPixelSprites('factory');
const deck = Array.from({length:4},(_,index)=>`service-deck-${index}`);

function skyline() {
  return '<g id="factory-skyline" fill="#648487">' +
    '<path d="M0 374v-40h102v-14h50v-14h27v14h33v-26h8v26h66v-14h45v11h45v-13h72v11h43v-32h8v32h52v-10h55v15h60v-21h58v15h58v-24h9v26h114v13h64v-12h76v12h113v-13h50v15h62v-18h91v55z"/>' +
    '</g>';
}

export function factoryScene() {
  const {width,height,groundY}=WORLD;
  const tileWidth=width/deck.length;
  return '<g id="abandoned-factory" shape-rendering="crispEdges">' +
    definitions(['process-yard','foundry','loading-bay',...deck]) +
    `<rect width="${width}" height="${groundY}" fill="#476b70"/>` +
    skyline() +
    sprite('process-yard',320,groundY-134,600,134) +
    sprite('foundry',0,groundY-222,420,222) +
    sprite('loading-bay',810,groundY-184,390,184) +
    `<g id="factory-ground" data-ground-baseline="${groundY}">` +
    deck.map((name,index)=>sprite(name,index*tileWidth,groundY,tileWidth,height-groundY)).join('') +
    '</g></g>';
}
