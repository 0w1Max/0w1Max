import {WORLD, seededRandom} from './mission.mjs';
import {volcanoSprite, volcanoSpriteDefinitions} from './volcano-sprites.mjs';

const scenery = ['lavafall', 'cavern', 'furnace', 'bridge', 'lava-a', 'lava-b'];
const tileWidth = 120;

export function volcanoScene(seed = 0) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('Некорректный seed вулкана');

  const {width, height, groundY} = WORLD;
  const random = seededRandom(seed ^ 0x9e3779b9);
  const leftWidth = 214 + Math.floor(random() * 56);
  const rightWidth = 233 + Math.floor(random() * 56);
  const rightX = width - rightWidth;
  const centerWidth = rightX - leftWidth;
  const cavern = volcanoSprite('cavern', leftWidth, 0, centerWidth, groundY);
  const center = random() < .5 ? cavern : `<g transform="translate(${leftWidth + rightX} 0) scale(-1 1)">${cavern}</g>`;
  const bridgeHeight = 39;
  const lavaY = groundY + bridgeHeight;
  const tiles = [];
  for (let x = 0; x < width; x += tileWidth) {
    tiles.push(volcanoSprite('bridge', x, groundY, tileWidth, bridgeHeight));
    tiles.push(volcanoSprite(random() < .5 ? 'lava-a' : 'lava-b', x, lavaY, tileWidth, height - lavaY));
  }

  return `<g id="volcano-stage-v4" data-scene="volcano-nes" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    volcanoSpriteDefinitions(scenery) + '<g id="volcano-cavern">' +
    `<rect width="${width}" height="${groundY}" fill="#080507"/>` +
    volcanoSprite('lavafall', 0, 0, leftWidth, groundY) + center +
    volcanoSprite('furnace', rightX, 0, rightWidth, groundY) +
    '</g><g id="volcano-bridge-and-lava">' + tiles.join('') + '</g></g>';
}
