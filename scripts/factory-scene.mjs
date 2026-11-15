import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {WORLD} from './mission.mjs';

function loadPlate(layer) {
  const asset = new URL(`../assets/factory-${layer}-v4.svg.gz.b64`, import.meta.url);
  return gunzipSync(Buffer.from(readFileSync(asset, 'utf8'), 'base64')).toString('utf8');
}

const yard = loadPlate('yard');
const ground = loadPlate('ground');

function plate(id, y, height, sourceHeight, markup, attributes = '') {
  return `<svg id="${id}" y="${y}" width="${WORLD.width}" height="${height}" viewBox="0 0 400 ${sourceHeight}" preserveAspectRatio="none"${attributes}>${markup}</svg>`;
}

export function factoryScene() {
  return '<g id="abandoned-factory" shape-rendering="crispEdges">' +
    plate('factory-yard', 0, WORLD.groundY, 125, yard) +
    plate('factory-ground', WORLD.groundY, WORLD.height - WORLD.groundY, 19, ground,
      ` data-ground-baseline="${WORLD.groundY}"`) +
    '</g>';
}
