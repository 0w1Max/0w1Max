/**
 * Визуальные комплекты игровых локаций.
 * Данные не зависят от внешних PNG и не влияют на физику движения.
 * На каждой карте все платформы получают один тип и одну ширину.
 */
import { LOCATION_POOL } from './locations.mjs';

const define = (obstacles, platforms, palette, outfit) => Object.freeze({
  obstacles: Object.freeze(obstacles),
  platforms: Object.freeze(platforms),
  palette: Object.freeze(palette),
  outfit: Object.freeze(outfit),
});

export const BIOMES = Object.freeze({
  jungle: define(
    ['jungle-rock','fallen-log','stone-ruin','tree-stump','supply-crate'],
    ['wooden-bridge','mossy-stone','vine-ledge'],
    {leaf:'#65ba46',timber:'#91603b',stone:'#778a78',metal:'#637d75',shade:'#263d30',highlight:'#b2e77b'},
    {cloth:'#848e43',vest:'#666b65'}
  ),
  desert: define(
    ['jungle-rock','sandbags','stone-ruin','supply-crate'],
    ['wooden-bridge','mossy-stone','camo-platform'],
    {leaf:'#c2a05a',timber:'#a06b44',stone:'#c98f62',metal:'#aa8b6e',shade:'#613c2e',highlight:'#f6d08b'},
    {cloth:'#c99a64',vest:'#95634f'}
  ),
  snow: define(
    ['jungle-rock','fallen-log','sandbags','supply-crate'],
    ['mossy-stone','metal-catwalk','camo-platform'],
    {leaf:'#d7edfa',timber:'#71828a',stone:'#9fbaca',metal:'#829cae',shade:'#354a61',highlight:'#f4fbff'},
    {cloth:'#b2c6c7',vest:'#6b8494'}
  ),
  volcano: define(
    ['jungle-rock','fallen-log','sandbags','stone-ruin','tree-stump','supply-crate'],
    ['mossy-stone','metal-catwalk','camo-platform'],
    {leaf:'#f58a37',timber:'#6b4540',stone:'#625057',metal:'#65565d',shade:'#231f2d',highlight:'#ffc14f'},
    {cloth:'#69616a',vest:'#484651'}
  ),
  industrial: define(
    ['sandbags','stone-ruin','supply-crate','fallen-log'],
    ['metal-catwalk','camo-platform','wooden-bridge'],
    {leaf:'#bfaa55',timber:'#686e70',stone:'#79868a',metal:'#82939b',shade:'#29393f',highlight:'#f3ca57'},
    {cloth:'#82958d',vest:'#505f69'}
  ),
});

export function biomeFor(location) {
  if (!LOCATION_POOL.includes(location)) throw new Error('Неизвестная игровая локация: '+location);
  return BIOMES[location];
}

const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hex = channels => '#'+channels.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

/**
 * У солдата остаются исходные синие повязка, кожа, оружие и контуры.
 * Перекрашиваются только различимые по цвету ткань и детали жилета.
 */
export function soldierColor(original, location) {
  if (location==='jungle') return original;
  const {outfit}=biomeFor(location);
  if (!/^#[\da-f]{6}$/i.test(original)) return original;
  const [r,g,b]=rgb(original);
  if (b>r*1.22 && b>g*1.10) return original; // синяя повязка
  if (r>g*1.22 && g>b*1.16) return original; // кожа, руки, лицо
  if (Math.max(r,g,b)<49) return original; // тёмные контуры
  const olive = r>=64 && g>=58 && g>b*1.34 && r>=g*.87 && r<=g*1.25;
  const vest = r>=61 && r<=139 && Math.abs(r-g)<24 && Math.abs(g-b)<29 && !olive;
  if (!olive && !vest) return original;
  const base=rgb(olive?outfit.cloth:outfit.vest);
  const brightness=(r*.25+g*.60+b*.15);
  const factor=clamp(brightness/(olive?103:90),.58,1.34);
  return hex(base.map(v=>v*factor));
}

/** Palette-mapping keeps 8-bit source geometry unchanged, but makes each biome cohesive. */
export function tintTerrainArt(markup, location) {
  if (location==='jungle') return markup;
  const pal=biomeFor(location).palette;
  return markup.replace(/(fill|stroke)="(#[0-9a-f]{6})"/gi, (attr,prop,color)=>{
    const [r,g,b]=rgb(color);
    const lum=.299*r+.587*g+.114*b;
    if (lum<38) return attr;
    let role;
    if(g>r*1.18 && g>b*1.16)role='leaf';
    else if(r>g*1.18 && g>b*1.08)role='timber';
    else if(r>g*.9 && g>b*1.20 && r<=g*1.18)role='leaf';
    else if(Math.abs(r-g)<25 && Math.abs(g-b)<27)role='stone';
    else role='metal';
    const desired=rgb(pal[role]);
    const factor=clamp(lum/129,.53,1.35);
    return `${prop}="${hex(desired.map(v=>v*factor))}"`;
  });
}

const bar=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

/** Decorations are purely visual, inside the existing collision bounding boxes. */
export function obstacleBiomeDetail(obstacle, location) {
  const {width:w,height:h}=obstacle;
  const pal=biomeFor(location).palette;
  switch(location){
    case 'jungle':
      return `<g data-theme-detail="jungle">${bar(6,-h+2,6,3,pal.leaf)}${bar(w-13,-h+4,5,4,pal.highlight)}</g>`;
    case 'desert':
      return `<g data-theme-detail="desert">${bar(5,-h+3,w-11,3,pal.highlight)}${bar(11,-8,5,3,pal.shade)}${bar(w-10,-13,4,3,pal.stone)}</g>`;
    case 'snow':
      return `<g data-theme-detail="snow">${bar(3,-h+1,w-6,5,pal.highlight)}${bar(8,-h+6,4,4,pal.leaf)}${bar(w-13,-h+6,3,6,pal.leaf)}</g>`;
    case 'volcano':
      return `<g data-theme-detail="volcano"><path d="M6 -4h8v-7h5v5h7v-6" stroke="${pal.leaf}" stroke-width="3" fill="none"/>${bar(w-10,-h+4,4,4,pal.highlight)}</g>`;
    case 'industrial':
      return `<g data-theme-detail="industrial">${bar(4,-h+4,w-8,4,pal.highlight)}${bar(8,-h+9,5,3,pal.shade)}${bar(w-13,-h+9,5,3,pal.shade)}</g>`;
    default:throw new Error('Неподдерживаемая локация');
  }
}

export function platformBiomeDetail(platform, location) {
  const w=platform.width;
  const pal=biomeFor(location).palette;
  switch(location){
    case 'jungle':
      return `<g data-theme-detail="jungle">${bar(4,-2,w-8,4,pal.leaf)}${bar(14,8,3,11,pal.leaf)}${bar(w-25,11,4,13,pal.leaf)}</g>`;
    case 'desert':
      return `<g data-theme-detail="desert">${bar(3,-1,w-6,4,pal.highlight)}${bar(9,5,8,3,pal.stone)}${bar(w-24,5,8,3,pal.stone)}</g>`;
    case 'snow':
      return `<g data-theme-detail="snow">${bar(3,-3,w-6,6,pal.highlight)}${Array.from({length:Math.floor(w/32)},(_,i)=>bar(14+i*32,3,4,9,pal.leaf)).join('')}</g>`;
    case 'volcano':
      return `<g data-theme-detail="volcano">${bar(4,-1,w-8,3,pal.shade)}${Array.from({length:Math.floor(w/27)},(_,i)=>bar(12+i*27,2,7,3,pal.highlight)).join('')}</g>`;
    case 'industrial':
      return `<g data-theme-detail="industrial">${bar(3,-2,w-6,4,pal.metal)}${Array.from({length:Math.floor(w/29)},(_,i)=>bar(10+i*29,4,11,4,i%2?pal.shade:pal.highlight)).join('')}</g>`;
    default:throw new Error('Неподдерживаемая локация');
  }
}
