/** Detailed factory artwork compiled from the approved-style concept atlas. */
import {loadPixelSprites} from './pixel-sprites.mjs';
const art=loadPixelSprites('factory-v8');
export const factoryObstacles=Object.freeze({'sandbags':'maintenance-barrier','stone-ruin':'concrete-rubble','supply-crate':'cargo-crate','fallen-log':'toolbox'});
export const factoryPlatforms=Object.freeze({'metal-catwalk':'steel-catwalk','camo-platform':'stopped-conveyor','wooden-bridge':'service-deck'});
export const factoryObstacleSizes=Object.freeze({'supply-crate':[45,38],'fallen-log':[33,23],'sandbags':[43,31],'stone-ruin':[39,25]});
const platformRatios={'steel-catwalk':148/477,'stopped-conveyor':144/494,'service-deck':151/495};
export function factoryPlatformHeight(kind,width){const name=factoryPlatforms[kind];if(!name)throw Error('Unknown factory platform');return width*platformRatios[name];}
export function factorySpriteDefinitions(names){return art.definitions(names).replaceAll('preserveAspectRatio="none"','preserveAspectRatio="xMidYMax meet"').replaceAll('factory-v8-sprite-','factory-v8-');}
export function factorySprite(name,x,y,width,height){if(![...Object.values(factoryObstacles),...Object.values(factoryPlatforms)].includes(name))throw Error('Unknown factory sprite');return art.sprite(name,x,y,width,height).replaceAll('factory-v8-sprite-','factory-v8-');}
