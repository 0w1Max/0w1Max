import {WORLD} from './mission.mjs';
import {loadPixelSprites} from './pixel-sprites.mjs';

const {definitions,sprite} = loadPixelSprites('factory');
const serviceDepth = 64;

export function factoryDimensions() {
  const viewHeight = WORLD.groundY + serviceDepth;
  return {displayHeight: viewHeight, viewHeight};
}

const rect = (x,y,width,height,fill) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;

function serviceTrench(x,width) {
  return `<g transform="translate(${x} 0)" data-service-trench="true">` +
    `<path d="M0 25h${width}v28h-6v4H6v-4H0z" fill="#313c3c"/>` +
    rect(4,27,width-8,2,'#242f30') +
    rect(4,53,width-8,2,'#6d6e5f') +
    rect(10,36,width-20,6,'#6b6955') +
    rect(10,36,width-20,2,'#b0a383') +
    rect(10,40,width-20,2,'#514f44') +
    rect(10,47,width-20,3,'#637e78') +
    [17,width-24].map(offset=>rect(offset,34,6,10,'#827e68') +
      rect(offset,34,2,10,'#b2a68a')).join('') + '</g>';
}

function serviceDeck() {
  const {width,groundY}=WORLD;
  const slabWidths=[114,92,128,104,116,96,120,100,112,118,100];
  let left=0;
  const slabs=slabWidths.map((span,index)=>{
    const x=left;
    left+=span;
    const chip=x+18+(index*17)%48;
    return rect(x,3,span-2,14,index%2?'#8c8572':'#958d77') +
      rect(x,3,span-2,2,'#b9ab88') +
      rect(x+3,14,span-7,3,'#746e60') +
      `<path d="M${chip} 5h5v3h4v3h-4V9h-5zM${x+span-19} 10h9v2h-9z" fill="#6b685c"/>`;
  }).join('');
  return `<g id="factory-ground" data-ground-baseline="${groundY}">` +
    `<g transform="translate(0 ${groundY})">` +
    rect(0,0,width,serviceDepth,'#4b514d') +
    rect(0,17,width,5,'#676558') +
    rect(0,22,width,2,'#777564') +
    rect(0,59,width,5,'#3b4541') +
    slabs + rect(0,0,width,3,'#c2b592') +
    [[36,184],[256,198],[503,174],[721,209],[985,177]].map(([x,w])=>serviceTrench(x,w)).join('') +
    '</g></g>';
}

function skyline() {
  return '<g id="factory-skyline" fill="#648487">' +
    '<path d="M0 374v-40h102v-14h50v-14h27v14h33v-26h8v26h66v-14h45v11h45v-13h72v11h43v-32h8v32h52v-10h55v15h60v-21h58v15h58v-24h9v26h114v13h64v-12h76v12h113v-13h50v15h62v-18h91v55z"/>' +
    '</g>';
}

export function factoryScene() {
  const {width,groundY}=WORLD;
  return '<g id="abandoned-factory" shape-rendering="crispEdges">' +
    definitions(['process-yard','foundry','loading-bay']) +
    `<rect width="${width}" height="${groundY}" fill="#476b70"/>` +
    skyline() +
    sprite('process-yard',320,groundY-134,600,134) +
    sprite('foundry',0,groundY-222,420,222) +
    sprite('loading-bay',810,groundY-184,390,184) +
    serviceDeck() + '</g>';
}
