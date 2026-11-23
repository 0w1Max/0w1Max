import {readFileSync} from 'node:fs';

const font=JSON.parse(readFileSync(new URL('../assets/fonts/oxanium-regular-glyphs.json',import.meta.url),'utf8'));
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=value=>Number(value.toFixed(5));
const glyph=char=>{
  if(!Object.hasOwn(font.glyphs,char))throw Error('Unsupported HUD character: '+char);
  return font.glyphs[char];
};

export function hudTextWidth(text,size,spacing=.3){
  return [...text].reduce((width,char)=>width+glyph(char).advance*size/font.unitsPerEm,0)+Math.max(0,[...text].length-1)*spacing;
}

/** Real regular-weight font outlines: no network font loading or device-specific fallback. */
export function hudText(text,{x,y,size,fill,id,month,spacing=.3}){
  const scale=size/font.unitsPerEm;
  let cursor=x;
  const paths=[...text].map(char=>{
    const shape=glyph(char);
    const path=shape.path?`<path transform="translate(${fmt(cursor)} ${fmt(y)}) scale(${fmt(scale)} ${fmt(-scale)})" d="${shape.path}"/>`:'';
    cursor+=shape.advance*scale+spacing;
    return path;
  }).join('');
  return `<g${id?` id="${escape(id)}"`:''}${month?` data-month="${escape(month)}"`:''} data-font="Oxanium Regular" font-size="${size}" font-weight="400" fill="${fill}" role="img" aria-label="${escape(text)}" shape-rendering="geometricPrecision">`+
    `<title>${escape(text)}</title><g aria-hidden="true">${paths}</g></g>`;
}
