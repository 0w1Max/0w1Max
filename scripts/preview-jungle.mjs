/** Rebuild a review preview from a retained API snapshot, without a token. */
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {renderSvg, normalizeWeeks} from './generate.mjs';
import {buildLevel, createMission} from './mission.mjs';

const root = new URL('../', import.meta.url);
const {weeks, source} = JSON.parse(await readFile(new URL('fixtures/jungle-preview-calendar.json', root)));
const sprites = JSON.parse(gunzipSync(Buffer.from((await readFile(new URL('assets/sprites.json.gz.b64',root),'utf8')).trim(),'base64')));
await mkdir(new URL('preview/',root),{recursive:true});
for (const seed of [25,31,34]) {
  const level = buildLevel(normalizeWeeks(weeks),'0w1Max',seed,'jungle');
  const mission = createMission(normalizeWeeks(weeks),level);
  const svg = renderSvg({weeks,sprites,username:'0w1Max',seedOverride:seed,locationOverride:'jungle'})
    .replace('Календарь получен через API GitHub.', 'Сохранённый снимок API GitHub, не свежая выгрузка.');
  await writeFile(new URL(`preview/jungle-dark-${seed}.svg`,root),svg);
  console.log(JSON.stringify({seed,bytes:Buffer.byteLength(svg),platforms:level.platforms.length,obstacles:level.obstacles.length,shots:mission.shots.length,source}));
}
