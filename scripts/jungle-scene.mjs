import {WORLD} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 46;
const groundTileWidth = 300;
const groundTileHeight = groundTileWidth * 31 / 193;

export function jungleDimensions() {
  const viewHeight = WORLD.groundY + groundDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function jungleScene(seed) {
  const {width,groundY} = WORLD;
  const floor = Array.from({length:4},(_,index) =>
    jungleSprite('ground-strip',index*groundTileWidth,groundY,
      groundTileWidth,groundTileHeight)).join('');

  return `<g id="jungle-stage" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['ridge','grove','palm-bank','root-escarpment','ground-strip']) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#7fa999"/>` +
    jungleSprite('ridge',0,211,width,width*44/379) +
    jungleSprite('grove',0,groundY-width*48/379,width,width*48/379) +
    jungleSprite('palm-bank',8,groundY-235,440,235) +
    jungleSprite('root-escarpment',699.5,groundY-225,492.5,225) +
    '</g><g id="jungle-ground">' +
    `<rect y="${groundY}" width="${width}" height="${groundDepth}" fill="#786447"/>` +
    floor + '</g></g>';
}
