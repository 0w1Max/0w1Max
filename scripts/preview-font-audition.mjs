/** Four typeface auditions on the same reviewed maps and real calendar snapshot. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {renderSvg} from './generate.mjs';

const root=new URL('../',import.meta.url),folder=new URL('preview/font-audition-v1/',root);
const read=name=>readFileSync(new URL(name,root),'utf8');
const calendar=JSON.parse(read('preview/factory-v8/live-calendar.json'));
if(calendar.source.fixture!==false)throw Error('Real calendar required');
const sprites=JSON.parse(gunzipSync(Buffer.from(read('assets/sprites.json.gz.b64').trim(),'base64')));
const variants=[
  {location:'industrial',font:'JetBrains Mono',fontKey:'jetbrains-mono',seed:1165146435},
  {location:'desert',font:'IBM Plex Mono',fontKey:'ibm-plex-mono',seed:162},
  {location:'temple',font:'Manrope',fontKey:'manrope',seed:104},
  {location:'coast',font:'Space Grotesk',fontKey:'space-grotesk',seed:111},
];
mkdirSync(folder,{recursive:true});
for(const variant of variants){
  const svg=renderSvg({weeks:calendar.weeks,sprites,username:'0w1Max',seedOverride:variant.seed,locationOverride:variant.location,hudFontOverride:variant.fontKey});
  writeFileSync(new URL(variant.location+'.svg',folder),svg);
  variant.sha256=createHash('sha256').update(svg).digest('hex');
}
writeFileSync(new URL('manifest.json',folder),JSON.stringify({status:'font comparison draft',weight:400,calendar:calendar.source,variants},null,2)+'\n');
console.log(variants.map(v=>`${v.location}: ${v.font} Regular`).join('\n'));
