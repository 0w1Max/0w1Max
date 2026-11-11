import {WORLD, seededRandom} from './mission.mjs';
import {desertSprite, desertSpriteDefinitions} from './desert-sprites.mjs';

const sourceWidth = 2172;
const sourceHeight = 724;
const sourceGround = 566;
const groundTiles = Array.from({length: 8}, (_, i) => `ground-${i}`);

export function desertDimensions() {
  return {
    displayHeight: Math.round(sourceHeight * WORLD.width / sourceWidth),
    viewHeight: Math.round(sourceHeight * WORLD.groundY / sourceGround)
  };
}

export function desertScene(seed) {
  const {width, groundY} = WORLD;
  const {viewHeight} = desertDimensions();
  const westEdge = Math.round(625 * width / sourceWidth);
  const eastEdge = Math.round(1350 * width / sourceWidth);
  const tileWidth = width / groundTiles.length;
  const random = seededRandom(seed ^ 0x21c699fd);
  const offset = Math.floor(random() * groundTiles.length);
  const floor = groundTiles.map((_, index) =>
    desertSprite(groundTiles[(index + offset) % groundTiles.length], index * tileWidth,
      groundY, tileWidth, viewHeight - groundY)).join('');

  return `<g id="desert-canyon-v6" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    desertSpriteDefinitions(['west-mesa', 'distant-mesas', 'east-ridge', ...groundTiles]) +
    '<g id="desert-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#080609"/>` +
    desertSprite('west-mesa', 0, 0, westEdge, groundY) +
    desertSprite('distant-mesas', westEdge, 0, eastEdge - westEdge, groundY) +
    desertSprite('east-ridge', eastEdge, 0, width - eastEdge, groundY) +
    '</g><g id="desert-ground">' + floor + '</g></g>';
}
