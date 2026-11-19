import {WORLD} from './mission.mjs';
import {loadPixelSprites} from './pixel-sprites.mjs';

export const coastArt=loadPixelSprites('coast');
export const coastObstacles=Object.freeze({
  'jungle-rock':'basalt-block',
  'fallen-log':'driftwood',
  'supply-crate':'salvage-crate',
});
export const coastPlatforms=Object.freeze({
  'mossy-stone':'stone-shelf',
  'wooden-bridge':'timber-span',
});

const levee=Array.from({length:4},(_,index)=>`levee-${index}`);
const leveeDepth=50;

export function coastDimensions() {
  const originalHeight=WORLD.groundY+leveeDepth;
  // Slightly taller canvas retains the complete basalt/levee at coast zoom.
  const viewHeight=originalHeight+14;
  return {displayHeight:viewHeight,viewHeight,originalHeight};
}

export function coastScene() {
  const {width,groundY}=WORLD;
  const {definitions,sprite}=coastArt;
  const tileWidth=width/levee.length;
  return '<g id="storm-coast" shape-rendering="crispEdges">' +
    definitions(['offshore-reef','lighthouse','broken-pier',...levee]) +
    `<rect width="${width}" height="${groundY}" fill="#527c89"/>` +
    `<rect y="330" width="${width}" height="${groundY-330}" fill="#366f75"/>` +
    '<defs><linearGradient id="coast-reef-edge"><stop offset="0" stop-color="black"/><stop offset=".08" stop-color="white"/><stop offset=".92" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>' +
    `<mask id="coast-reef-mask" maskUnits="userSpaceOnUse" x="258" y="${groundY-188}" width="700" height="188"><rect x="258" y="${groundY-188}" width="700" height="188" fill="url(#coast-reef-edge)"/></mask></defs>` +
    '<g mask="url(#coast-reef-mask)">' + sprite('offshore-reef',258,groundY-188,700,188) + '</g>' +
    sprite('lighthouse',0,groundY-238,376,238) +
    sprite('broken-pier',786,groundY-116,414,116) +
    `<g id="coast-ground" data-ground-baseline="${groundY}">` +
    levee.map((name,index)=>sprite(name,index*tileWidth,groundY,tileWidth,leveeDepth)).join('') +
    '</g></g>';
}
