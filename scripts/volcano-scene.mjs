import {WORLD, seededRandom} from './mission.mjs';
import {volcanoSprite, volcanoSpriteDefinitions} from './volcano-sprites.mjs';

const scenery = ['lavafall', 'cavern', 'furnace', 'bridge', 'lava-a', 'lava-b'];
const tileWidth = 120;
// The reference is 2172 × 724, with the bridge top at source row 558.
const sourceGround = 558;
export function volcanoDimensions() {
  return {displayHeight: WORLD.width / 3, viewHeight: Math.round(724 * WORLD.groundY / sourceGround)};
}

export function volcanoScene(seed = 0) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('Некорректный seed вулкана');

  const {width, groundY} = WORLD;
  const random = seededRandom(seed ^ 0x9e3779b9);
  const leftWidth = Math.round(450 * width / 2172);
  const rightX = Math.round(1685 * width / 2172);
  const centerWidth = rightX - leftWidth;
  const bridgeHeight = Math.round((680 - sourceGround) * groundY / sourceGround);
  const lavaY = groundY + bridgeHeight;
  const {viewHeight} = volcanoDimensions();
  const tiles = [];
  for (let x = 0; x < width; x += tileWidth) {
    tiles.push(volcanoSprite('bridge', x, groundY, tileWidth, bridgeHeight));
    tiles.push(volcanoSprite(random() < .5 ? 'lava-a' : 'lava-b', x, lavaY, tileWidth, viewHeight - lavaY));
  }

  return `<g id="volcano-stage-v4" data-scene="volcano-nes" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    volcanoSpriteDefinitions(scenery) + '<g id="volcano-cavern">' +
    `<rect width="${width}" height="${groundY}" fill="#080507"/>` +
    volcanoSprite('lavafall', 0, 0, leftWidth, groundY) +
    volcanoSprite('cavern', leftWidth, 0, centerWidth, groundY) +
    volcanoSprite('furnace', rightX, 0, width - rightX, groundY) +
    '</g><g id="volcano-bridge-and-lava">' + tiles.join('') + '</g></g>';
}
