import {WORLD, seededRandom} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 56;
const groundTiles = Array.from({length:8},(_,index)=>`ground-${index}`);

export function jungleDimensions() {
  const viewHeight=WORLD.groundY+groundDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function jungleScene(seed) {
  const {width,groundY}=WORLD;
  const tileWidth=width/groundTiles.length;
  // Keep the native 41 × 24 aspect ratio and crop below the walking surface.
  const tileHeight=tileWidth*24/41;
  const random=seededRandom(seed ^ 0x139a7a33);
  const offset=Math.floor(random()*groundTiles.length);
  const floor=groundTiles.map((_,index)=>
    jungleSprite(groundTiles[(index+offset)%groundTiles.length],index*tileWidth,
      groundY,tileWidth,tileHeight)).join('');

  const canopyWidth=groundY*144/86;
  const canopy=jungleSprite('canopy',width/2-canopyWidth,0,canopyWidth,groundY);
  const foregroundScale=3;
  const foregroundHeight=86*foregroundScale;
  return `<g id="jungle-stage" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['tree-wall','canopy','waterfall-ruins',...groundTiles]) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#040907"/>` +
    canopy + `<g transform="translate(${width} 0) scale(-1 1)">${canopy}</g>` +
    jungleSprite('tree-wall',0,groundY-foregroundHeight,80*foregroundScale,foregroundHeight) +
    jungleSprite('waterfall-ruins',width-103*foregroundScale,groundY-foregroundHeight,103*foregroundScale,foregroundHeight) +
    '</g><g id="jungle-ground">' + floor + '</g></g>';
}
