import {WORLD} from './mission.mjs';
import {loadPixelSprites} from './pixel-sprites.mjs';

const {definitions,sprite} = loadPixelSprites('factory');
const deck = Array.from({length:4},(_,index)=>`service-deck-${index}`);

function skyline() {
  return '<g id="factory-skyline" transform="scale(2)">' +
    '<path d="M0 187v-32h61v-9h41v8h39v-17h24v14h33v-29h5v29h23v-10h32v6h31v-16h23v8h16v-29h5v30h27v-15h24v14h21v-38h6v39h24v-12h25v-19h7v32h46v-12h31v9h56v49z" fill="#284f4e"/>' +
    '<path d="M0 187v-15h88v-11h38v6h81v-12h54v12h51v-15h36v10h40v-11h63v10h59v-12h36v10h54v28z" fill="#244846"/>' +
    '</g>';
}

export function factoryScene() {
  const {width,height,groundY}=WORLD;
  const tileWidth=width/deck.length;
  return '<g id="abandoned-factory" shape-rendering="crispEdges">' +
    definitions(['process-yard','foundry','loading-bay',...deck]) +
    skyline() +
    sprite('process-yard',270,groundY-204,642,204) +
    sprite('foundry',0,groundY-278,290,278) +
    sprite('loading-bay',908,groundY-234,292,234) +
    `<g id="factory-ground" data-ground-baseline="${groundY}">` +
    deck.map((name,index)=>sprite(name,index*tileWidth,groundY,tileWidth,height-groundY)).join('') +
    '</g></g>';
}
