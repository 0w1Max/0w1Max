/** Векторные 8-bit тайлы окружения; нет внешних PNG и файловой подгрузки. */
import { WORLD } from './mission.mjs';
import {biomeFor,tintTerrainArt,obstacleBiomeDetail,platformBiomeDetail} from './biomes.mjs';
import {volcanoObstacleSprites, volcanoPlatformSprites, volcanoSprite, volcanoSpriteDefinitions} from './volcano-sprites.mjs';
import {jungleObstacleSprites, junglePlatformSprites, jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';
const n = value => Number(value.toFixed(3));

function obstacle(o, i) {
  const w=o.width,h=o.height;
  const dark='#1b302d', moss='#6ec349', lightMoss='#a5e16b';
  let art='';
  switch(o.kind) {
    case 'jungle-rock':
      art=`<path d="M1 0V-9H5v-8h6v-5h9v-4h9v8h4v11h-4v7Z" fill="#566a71" stroke="#26343b" stroke-width="2"/>
      <path d="M7 -11v-7h7v-5h9v6h-6v7H9v6H5v-5z" fill="#a0abb2"/>
      <path d="M21 -9h8v5h-8z" fill="#344b52"/><path d="M3 -3h7v-4h5v4h6" stroke="${moss}" stroke-width="3" fill="none"/>`;
      break;
    case 'fallen-log':
      art=`<rect x="1" y="-16" width="${w-3}" height="15" fill="#855136" stroke="#422f26" stroke-width="3"/>
      <path d="M6 -16h${w-17}v3H6zM7 -8h${w-19}v3H7z" fill="#b67a43"/>
      <rect x="${w-14}" y="-13" width="9" height="9" fill="#d6a066"/>
      <rect x="${w-11}" y="-10" width="4" height="4" fill="#67422e"/>
      <path d="M7 -17v-5h3v-2h5v6h6v2" stroke="${moss}" stroke-width="3" fill="none"/>`;
      break;
    case 'sandbags':
      art=`<rect x="2" y="-10" width="20" height="10" rx="3" fill="#92774f" stroke="#503f30" stroke-width="2"/>
      <rect x="22" y="-10" width="21" height="10" rx="3" fill="#ab9163" stroke="#503f30" stroke-width="2"/>
      <rect x="12" y="-20" width="22" height="11" rx="3" fill="#ba9d6c" stroke="#564835" stroke-width="2"/>
      <path d="M13 -16h6m12 11h5M7 -6h4" stroke="#d7c491" stroke-width="2"/>`;
      break;
    case 'stone-ruin':
      art=`<rect x="2" y="-28" width="28" height="28" fill="#656e65" stroke="#303c3b" stroke-width="3"/>
      <rect x="5" y="-24" width="23" height="7" fill="#92988c"/><path d="M4 -14h25M14 -28v14M23 -14V0" stroke="#34413e" stroke-width="2"/>
      <path d="M2 -28h9v3h6v4h-5v3H4z" fill="${moss}"/><rect x="25" y="-8" width="4" height="4" fill="${lightMoss}"/>`;
      break;
    case 'tree-stump':
      art=`<path d="M2 0v-7h5v-15h5v-6h14v6h3v13h-4v9h-6v-5h-7v5z" fill="#805137" stroke="#382b26" stroke-width="3"/>
      <rect x="11" y="-27" width="14" height="6" fill="#cb9a58"/><rect x="16" y="-25" width="5" height="3" fill="#745032"/>
      <path d="M10 -19v12M23 -18v10" stroke="#b77944" stroke-width="3"/><path d="M2 -1h10m15 0h4" stroke="${moss}" stroke-width="3"/>`;
      break;
    case 'supply-crate':
      art=`<rect x="2" y="-26" width="30" height="26" fill="#466245" stroke="#1c342f" stroke-width="3"/>
      <rect x="5" y="-23" width="24" height="5" fill="#7c9a5d"/><rect x="8" y="-16" width="18" height="11" fill="#385343"/>
      <path d="M11 -13h4v-3h3v3h4v3h-4v3h-3v-3h-4z" fill="#c4a44b"/>
      <rect x="2" y="-29" width="30" height="4" fill="#889b62"/><rect x="5" y="-5" width="4" height="4" fill="#142d28"/>`;
      break;
    default:throw new Error('Неизвестное препятствие: '+o.kind);
  }
  return `<g id="obstacle-${i}" data-kind="${o.kind}" transform="translate(${n(o.x)} ${WORLD.groundY})" shape-rendering="crispEdges">
    ${art}<path d="M0 -2h4v-3h4v3h4" fill="none" stroke="${moss}" stroke-width="2"/>
  </g>`;
}

function platform(p,i) {
  const w=p.width;
  const panel=(count,callback)=>Array.from({length:count},(_,j)=>callback(j)).join('');
  let art='';
  switch(p.kind){
    case 'wooden-bridge':
      art=`<rect width="${w}" height="12" fill="#6d462f" stroke="#2f2d2a" stroke-width="3"/>
      ${panel(Math.floor(w/20),j=>`<rect x="${j*20+3}" y="1" width="18" height="7" fill="${j%2?'#a56a3d':'#b67e4a'}"/><rect x="${j*20+10}" y="4" width="2" height="2" fill="#e0bd75"/>`)}
      <path d="M12 12v10h8l12-10m${w-44} 0l12 10h8V12" fill="none" stroke="#67452e" stroke-width="5"/>`;
      break;
    case 'mossy-stone':
      art=`<rect width="${w}" height="19" fill="#505a56" stroke="#28393b" stroke-width="3"/>
      ${panel(Math.floor(w/24),j=>`<rect x="${j*24+3}" y="5" width="21" height="10" fill="${j%2?'#76837b':'#64756d'}"/><path d="M${j*24+5} 10h17" stroke="#3d504e" stroke-width="2"/>`)}
      <path d="M0 2h${w}v4H0z" fill="#81c54d"/><path d="M11 17v11h4V17m${w-32} 0v14h4V17" fill="#4b9950"/>`;
      break;
    case 'vine-ledge':
      art=`<path d="M0 0h${w}v12h-12v6h-18v-5H8v4H0Z" fill="#714933" stroke="#402f2c" stroke-width="3"/>
      <rect width="${w}" height="5" fill="#83ce50"/>
      <path d="M19 14v16h3v-8h5m${w-46} -8v23h3v-12h7" fill="none" stroke="#4c9950" stroke-width="3"/>
      ${panel(Math.floor(w/28),j=>`<rect x="${j*28+7}" y="5" width="15" height="5" fill="${j%2?'#8f6440':'#a16c42'}"/>`)}`;
      break;
    case 'metal-catwalk':
      art=`<rect width="${w}" height="13" fill="#536c75" stroke="#21343d" stroke-width="3"/>
      <path d="M4 3h${w-8}" stroke="#bdcbd0" stroke-width="3"/>
      ${panel(Math.floor(w/18),j=>`<rect x="${j*18+7}" y="6" width="8" height="5" fill="${j%2?'#d2a83a':'#1d343d'}"/>`)}
      <path d="M12 13v12h8l12-12m${w-44} 0l12 12h8V13" fill="none" stroke="#435c65" stroke-width="4"/>`;
      break;
    case 'camo-platform':
      art=`<rect width="${w}" height="17" fill="#4c6d43" stroke="#203a33" stroke-width="3"/>
      ${panel(Math.floor(w/28),j=>`<path d="M${j*28+3} 3h17v5h-8v4h-9z" fill="${j%2?'#6f9555':'#988f57'}"/>`)}
      <path d="M6 16h${w-12}" stroke="#233e34" stroke-width="4"/><rect x="14" y="17" width="9" height="8" fill="#496649"/><rect x="${w-23}" y="17" width="9" height="8" fill="#496649"/>`;
      break;
    default:throw new Error('Неизвестная платформа: '+p.kind);
  }
  return `<g id="platform-${i}" data-kind="${p.kind}" transform="translate(${n(p.x)} ${n(p.y)})" shape-rendering="crispEdges">${art}</g>`;
}


const spriteTerrain = {
  volcano: [volcanoObstacleSprites, volcanoPlatformSprites, volcanoSpriteDefinitions, volcanoSprite],
  jungle: [jungleObstacleSprites, junglePlatformSprites, jungleSpriteDefinitions, jungleSprite]
};

function pixelTerrain(level, [obstacleSprites, platformSprites, defineSprites, sprite]) {
  const obstacles = level.obstacles.map(item => obstacleSprites[item.kind]);
  const platforms = level.platforms.map(item => platformSprites[item.kind]);
  const terrain = (item, index, type, name, y, height) =>
    `<g id="${type}-${index}" data-kind="${item.kind}" data-theme-detail="${level.location}" data-sprite="${name}">` +
      sprite(name, item.x, y, item.width, height) + '</g>';

  return defineSprites([...obstacles, ...platforms]) +
    level.platforms.map((item, index) => terrain(item, index, 'platform', platforms[index], item.y, 18)).join('') +
    level.obstacles.map((item, index) =>
      terrain(item, index, 'obstacle', obstacles[index], WORLD.groundY - item.height, item.height)).join('');
}

function biomeObstacle(item,index,location) {
  if(!location)return obstacle(item,index);
  const base=tintTerrainArt(obstacle(item,index),location);
  return base.replace(/<\/g>$/,obstacleBiomeDetail(item,location)+'</g>');
}
function biomePlatform(item,index,location) {
  if(!location)return platform(item,index);
  const base=tintTerrainArt(platform(item,index),location);
  return base.replace(/<\/g>$/,platformBiomeDetail(item,location)+'</g>');
}
export function levelMarkup(level) {
  const location=level.location;
  if(location)biomeFor(location);
  const terrain = Object.hasOwn(spriteTerrain,location) ? pixelTerrain(level,spriteTerrain[location]) :
    level.platforms.map((item,i)=>biomePlatform(item,i,location)).join('') +
    level.obstacles.map((item,i)=>biomeObstacle(item,i,location)).join('');
  return `<g id="procedural-level" data-biome="${location??'unstyled'}" aria-label="Препятствия и платформы">${terrain}</g>`;
}
