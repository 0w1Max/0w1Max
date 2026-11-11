import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const encoded = readFileSync(new URL('../assets/volcano-sprites.json.gz.b64', import.meta.url), 'utf8');
const atlas = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
const symbols = Object.fromEntries(Object.entries(atlas).map(([name, [width, height, paths]]) => [
  name,
  `<symbol id="volcano-sprite-${name}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">` +
    paths.map(([color, data]) => `<path fill="#${color}" d="${data}"/>`).join('') + '</symbol>'
]));

export const volcanoObstacleSprites = Object.freeze({
  'jungle-rock': 'basalt-boulder',
  'fallen-log': 'ruptured-pipe',
  sandbags: 'slag-pile',
  'stone-ruin': 'steel-barricade',
  'tree-stump': 'furnace-vent',
  'supply-crate': 'power-terminal',
});

export const volcanoPlatformSprites = Object.freeze({
  'mossy-stone': 'basalt-ledge',
  'metal-catwalk': 'truss-catwalk',
  'camo-platform': 'armored-gangway',
});

export function volcanoSpriteDefinitions(names) {
  return '<defs>' + [...new Set(names)].map(name => {
    if (!Object.hasOwn(symbols, name)) throw new Error('Неизвестный спрайт вулкана: ' + name);
    return symbols[name];
  }).join('') + '</defs>';
}

export function volcanoSprite(name, x, y, width, height) {
  return `<use href="#volcano-sprite-${name}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
}
