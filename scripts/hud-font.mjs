import {readFileSync} from 'node:fs';

const fonts=Object.fromEntries(['oxanium','jetbrains-mono','ibm-plex-mono','manrope','space-grotesk'].map(key=>[key,JSON.parse(readFileSync(new URL(`../assets/fonts/${key}-regular-glyphs.json`,import.meta.url),'utf8'))]));
const getFont=key=>{if(!Object.hasOwn(fonts,key))throw Error('Unknown HUD font: '+key);return fonts[key];};
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=value=>Number(value.toFixed(5));
const glyph=(font,char)=>{
  if(!Object.hasOwn(font.glyphs,char))throw Error('Unsupported HUD character: '+char);
  return font.glyphs[char];
};

export function hudTextWidth(text,size,spacing=.3,fontKey='profile'){
  if(fontKey==='profile')return [...text].length*size*.6;
  const font=getFont(fontKey);
  return [...text].reduce((width,char)=>width+glyph(font,char).advance*size/font.unitsPerEm,0)+Math.max(0,[...text].length-1)*spacing;
}

/** Profile uses its published native monospace; archived auditions retain embedded outlines. */
export function hudText(text,{x,y,size,fill,id,month,spacing=.3,fontKey='profile'}){
  if(fontKey==='profile')return `<text${id?` id="${escape(id)}"`: ''}${month?` data-month="${escape(month)}"`: ''} x="${x}" y="${y}" font-family="monospace" font-size="${size}" font-weight="bold" fill="${fill}" aria-label="${escape(text)}">${escape(text)}</text>`;
  const font=getFont(fontKey);
  const scale=size/font.unitsPerEm;
  let cursor=x;
  const paths=[...text].map(char=>{
    const shape=glyph(font,char);
    const path=shape.path?`<path transform="translate(${fmt(cursor)} ${fmt(y)}) scale(${fmt(scale)} ${fmt(-scale)})" d="${shape.path}"/>`:'';
    cursor+=shape.advance*scale+spacing;
    return path;
  }).join('');
  return `<g${id?` id="${escape(id)}"`:''}${month?` data-month="${escape(month)}"`:''} data-font="${escape(font.family)} Regular" font-size="${size}" font-weight="400" fill="${fill}" role="img" aria-label="${escape(text)}" shape-rendering="geometricPrecision">`+
    `<title>${escape(text)}</title><g aria-hidden="true">${paths}</g></g>`;
}

export function hudBaselineForTop(text,size,top,fontKey){
  const font=getFont(fontKey);
  return top+Math.max(...[...text].map(char=>glyph(font,char).bounds?.[3]??0))*size/font.unitsPerEm;
}
