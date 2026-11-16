import {WORLD, seededRandom} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 46;
const groundTiles = ['ground-0','ground-1','ground-2','ground-3'];

export function jungleDimensions() {
  const viewHeight = WORLD.groundY + groundDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function jungleScene(seed) {
  const {width,groundY} = WORLD;
  const tileWidth = width / groundTiles.length;
  const random = seededRandom(seed ^ 0x139a7a33);
  const offset = Math.floor(random() * groundTiles.length);
  const floor = groundTiles.map((_,index) =>
    jungleSprite(groundTiles[(index+offset)%groundTiles.length],index*tileWidth,
      groundY,tileWidth,groundDepth)).join('');

  return `<g id="jungle-stage" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['ridge','grove','palm-bank','dry-gate',...groundTiles]) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#8da386"/>` +
    jungleSprite('ridge',0,groundY-224,width,224) +
    jungleSprite('grove',0,groundY-144,width,144) +
    jungleSprite('palm-bank',12,groundY-250,364,250) +
    jungleSprite('dry-gate',width-356,groundY-214,348,214) +
    '</g><g id="jungle-ground">' + floor + '</g></g>';
}
