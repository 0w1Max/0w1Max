import {WORLD} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 46;
const groundTileWidth = 300;
const groundTileHeight = groundTileWidth * 23 / 150;

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
    `<rect width="${width}" height="${groundY}" fill="#2d4b4e"/>` +
    jungleSprite('ridge',0,190,width,width*31/378) +
    jungleSprite('grove',0,groundY-width*32/379,width,width*32/379) +
    jungleSprite('palm-bank',8,groundY-285,380,285) +
    jungleSprite('root-escarpment',822,groundY-300,370,300) +
    '</g><g id="jungle-ground">' +
    `<rect y="${groundY}" width="${width}" height="${groundDepth}" fill="#252f2c"/>` +
    floor + '</g></g>';
}
