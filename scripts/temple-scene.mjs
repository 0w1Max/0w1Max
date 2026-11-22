import {WORLD} from './mission.mjs';
import {loadPixelSprites} from './pixel-sprites.mjs';

export const templeArt = loadPixelSprites('temple');
export const templeObstacles = Object.freeze({
  'jungle-rock':'river-rock',
  'stone-ruin':'broken-column',
  'supply-crate':'supply-chest',
});
export const templePlatforms = Object.freeze({
  'mossy-stone':'carved-ledge',
  'vine-ledge':'moss-ledge',
});

const causeway = Array.from({length:4},(_,index)=>`causeway-${index}`);
const causewayDepth = 64;

export function templeDimensions() {
  const viewHeight = WORLD.groundY + causewayDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function templeScene() {
  const {width,groundY}=WORLD;
  const {definitions,sprite}=templeArt;
  const tileWidth=width/causeway.length;
  return '<g id="flooded-temple" shape-rendering="crispEdges">' +
    definitions(['distant-sanctuary','temple-entrance','aqueduct',...causeway]) +
    `<rect width="${width}" height="${groundY}" fill="#609697"/>` +
    '<path d="M0 353h1200v21H0z" fill="#497f7d"/>' +
    sprite('distant-sanctuary',290,groundY-156,640,156) +
    sprite('temple-entrance',0,groundY-234,414,234) +
    sprite('aqueduct',786,groundY-176,414,176) +
    `<g id="temple-ground" data-ground-baseline="${groundY}">` +
    causeway.map((name,index)=>sprite(name,index*tileWidth,groundY,tileWidth,causewayDepth)).join('') +
    '</g></g>';
}
