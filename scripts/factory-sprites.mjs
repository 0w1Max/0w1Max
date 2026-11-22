/** Detailed factory artwork compiled from the approved-style concept atlas. */
import {loadPixelSprites} from './pixel-sprites.mjs';
const art=loadPixelSprites('factory-v8');
export const factoryObstacles=Object.freeze({'sandbags':'pipe-bundle','stone-ruin':'electric-motor','supply-crate':'cargo-crate','fallen-log':'cable-reel'});
export const factoryPlatforms=Object.freeze({'metal-catwalk':'steel-catwalk','camo-platform':'stopped-conveyor','wooden-bridge':'service-deck'});
export const factoryObstacleSizes=Object.freeze({'supply-crate':[64,54],'fallen-log':[76,53],'sandbags':[80,43],'stone-ruin':[76,53]});
const platformRatios={'steel-catwalk':148/477,'stopped-conveyor':144/494,'service-deck':151/495};
export function factoryPlatformHeight(kind,width){const name=factoryPlatforms[kind];if(!name)throw Error('Unknown factory platform');return width*platformRatios[name];}
export function factorySpriteDefinitions(names){return art.definitions(names).replaceAll('factory-v8-sprite-','factory-v8-');}
export function factorySprite(name,x,y,width,height){if(![...Object.values(factoryObstacles),...Object.values(factoryPlatforms)].includes(name))throw Error('Unknown factory sprite');return art.sprite(name,x,y,width,height).replaceAll('factory-v8-sprite-','factory-v8-');}
