import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

export function loadPixelSprites(biome) {
  const encoded = readFileSync(new URL(`../assets/${biome}-sprites.json.gz.b64`, import.meta.url), 'utf8');
  const atlas = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
  const symbols = Object.fromEntries(Object.entries(atlas).map(([name, [width, height, paths]]) => [
    name,
    `<symbol id="${biome}-sprite-${name}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">` +
      paths.map(([color, data]) => `<path fill="#${color}" d="${data}"/>`).join('') + '</symbol>'
  ]));

  return {
    definitions(names) {
      return '<defs>' + [...new Set(names)].map(name => {
        if (!Object.hasOwn(symbols, name)) throw new Error(`Неизвестный спрайт ${biome}: ${name}`);
        return symbols[name];
      }).join('') + '</defs>';
    },
    sprite(name, x, y, width, height) {
      return `<use href="#${biome}-sprite-${name}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
    }
  };
}
