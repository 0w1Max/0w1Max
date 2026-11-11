import {WORLD} from './mission.mjs';
import {desertSprite, desertSpriteDefinitions} from './desert-sprites.mjs';

const height = 470;
const westEdge = 410;
const eastEdge = 850;
const groundTiles = Array.from({length: 8}, (_, i) => `ground-${i}`);

export function desertDimensions() {
  return {displayHeight: height, viewHeight: height};
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
    `<rect width="${width}" height="${groundY}" fill="#36bcee"/>` +
    desertSprite('distant-mesas', westEdge, 0, eastEdge - westEdge, groundY) +
    desertSprite('west-mesa', 0, 0, westEdge, groundY) +
    desertSprite('east-ridge', eastEdge, 0, width - eastEdge, groundY) +
    '</g><g id="desert-ground">' + floor + '</g></g>';
}
