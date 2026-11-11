import {WORLD} from './mission.mjs';
import {desertSprite, desertSpriteDefinitions} from './desert-sprites.mjs';

const sourceWidth = 2172;
const sourceHeight = 724;
const sourceGround = 576;
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
  const tileWidth = width / groundTiles.length;
  const floor = groundTiles.map((name, index) =>
    desertSprite(name, index * tileWidth, groundY, tileWidth, viewHeight - groundY)).join('');

  return `<g id="desert-canyon-v6" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    desertSpriteDefinitions(['west-mesa', 'distant-mesas', 'east-ridge', ...groundTiles]) +
    '<g id="desert-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#080609"/>` +
    desertSprite('distant-mesas', 0, 0, width, groundY) +
    desertSprite('west-mesa', 0, 0, width, groundY) +
    desertSprite('east-ridge', 0, 0, width, groundY) +
    '</g><g id="desert-ground">' + floor + '</g></g>';
}
