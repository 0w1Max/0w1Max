const ice='#cadde3', frost='#96bac8', steel='#658a9f', slate='#496b81', dark='#29485e';
const amber='#c59b6c';
const path = (d,fill) => `<path d="${d}" fill="${fill}"/>`;
const sprite = (width,height,art) => ({width,height,art});

const atlas = {
  'frozen-boulder': sprite(34,27,
    path('M0 27v-8h4v-7h5V7h6V3h10v3h5v6h4v15z',dark) +
    path('M3 23v-5h5v-6h5V8h5v4h8v6h-7v5zM23 20h7v4h-7z',steel) +
    path('M9 12V7h6V3h10v3h5v5h-6v3h-5v-4h-4v2z',ice) +
    path('M6 23h9v3H6zM27 13h4v5h-4z',frost)),
  'snowbound-log': sprite(44,19,
    path('M0 19v-8h4V5h9V3h23v2h6v5h2v9z','#354957') +
    path('M3 13h35v5H3zM5 7h32v4H5z','#6f7777') +
    path('M4 5h9V3h23v2h6v4h-9v2h-6V8H14v3H5z',ice) +
    path('M35 10h7v7h-7z','#ab9680') + path('M37 12h3v3h-3z','#6c6159')),
  'frosted-sandbags': sprite(45,25,
    path('M0 25V15h4v-4h6V5h5V2h19v3h4v8h3v4h4v8z',dark) +
    path('M3 18h18v5H3zM24 18h18v5H24zM12 8h23v5H12z','#819da7') +
    path('M4 15h15v3H4zM26 15h14v3H26zM15 3h17v4H15z',ice) +
    path('M5 20h8v2H5zM29 20h8v2h-8zM14 11h10v2H14z','#617e8c')),
  'arctic-cargo-crate': sprite(34,27,
    path('M0 27V5h3V1h28v4h3v22z',dark) +
    path('M2 7h30v17H2z',steel) + path('M5 9h24v12H5z',slate) +
    path('M0 5h3V1h28v4h3v3h-8V6h-9v2H0z',ice) +
    path('M3 8h3v16H3zM28 8h3v16h-3z',frost) +
    path('M12 12h10v5H12z',amber) + path('M15 13h4v3h-4z',dark)),
  'ice-covered-slab': sprite(76,14,
    path('M0 0h76v9h-7v3h-12v2H17v-2H7V9H0z',dark) +
    path('M0 2h76v6h-9v3H13V8H0z',steel) +
    path('M0 0h76v3H66v2h-8V3H39v2h-9V3H13v2H6V3H0z',ice) +
    path('M5 6h14v2H5zM24 8h14v2H24zM42 6h17v2H42zM63 6h10v2H63z',frost)),
  'frosted-catwalk': sprite(76,14,
    path('M0 0h76v7h-3v7H3V7H0z',dark) +
    path('M0 2h76v4H0zM5 11h66v2H5z',steel) +
    path('M4 6h3v5H4zM7 6h5l5 5h-5zM20 6h5l5 5h-5zM33 6h5l5 5h-5zM46 6h5l5 5h-5zM59 6h5l5 5h-5zM69 6h3v5h-3z',frost) +
    path('M0 0h76v2H0z',ice) + path('M4 3h5v2H4zM67 3h5v2h-5z',amber)),
  'reinforced-loading-deck': sprite(76,14,
    path('M0 0h76v10h-5v4h-9v-3H14v3H5v-4H0z',dark) +
    path('M1 3h74v6H1z',slate) + path('M2 4h18v4H2zM23 4h18v4H23zM44 4h17v4H44zM64 4h10v4H64z',steel) +
    path('M0 0h76v3H67v1h-8V3H44v1H32V3H14v1H7V3H0z',ice) +
    path('M5 5h4v3H5zM67 5h4v3h-4z',amber)),
};

export const snowObstacleSprites = Object.freeze({
  'jungle-rock':'frozen-boulder',
  'fallen-log':'snowbound-log',
  sandbags:'frosted-sandbags',
  'supply-crate':'arctic-cargo-crate',
});

export const snowPlatformSprites = Object.freeze({
  'mossy-stone':'ice-covered-slab',
  'metal-catwalk':'frosted-catwalk',
  'camo-platform':'reinforced-loading-deck',
});

export function snowSpriteDefinitions(names) {
  return '<defs>' + [...new Set(names)].map(name=>{
    const {width,height,art}=atlas[name];
    return `<symbol id="snow-sprite-${name}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges">${art}</symbol>`;
  }).join('') + '</defs>';
}

export function snowSprite(name,x,y,width,height) {
  return `<use href="#snow-sprite-${name}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
}
