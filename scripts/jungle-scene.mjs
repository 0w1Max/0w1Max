import {WORLD, seededRandom} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const sourceWidth = 2172;
const sourceHeight = 724;
const sourceGround = 563;
const groundTiles = Array.from({length: 8}, (_, i) => `ground-${i}`);

export function jungleDimensions() {
  return {
    displayHeight: Math.round(sourceHeight * WORLD.width / sourceWidth),
    viewHeight: Math.round(sourceHeight * WORLD.groundY / sourceGround)
  };
}

export function jungleScene(seed) {
  const {width, groundY} = WORLD;
  const {viewHeight} = jungleDimensions();
  const treeEdge = Math.round(531 * width / sourceWidth);
  const ruinEdge = Math.round(1490 * width / sourceWidth);
  const tileWidth = width / groundTiles.length;
  const random = seededRandom(seed ^ 0x139a7a33);
  const offset = Math.floor(random() * groundTiles.length);
  const floor = groundTiles.map((_, index) =>
    jungleSprite(groundTiles[(index + offset) % groundTiles.length], index * tileWidth,
      groundY, tileWidth, viewHeight - groundY)).join('');

  return `<g id="jungle-stage" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['tree-wall', 'canopy', 'waterfall-ruins', ...groundTiles]) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#040907"/>` +
    jungleSprite('tree-wall', 0, 0, treeEdge, groundY) +
    jungleSprite('canopy', treeEdge, 0, ruinEdge - treeEdge, groundY) +
    jungleSprite('waterfall-ruins', ruinEdge, 0, width - ruinEdge, groundY) +
    '</g><g id="jungle-ground">' + floor + '</g></g>';
}
