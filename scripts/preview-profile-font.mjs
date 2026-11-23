/** Default profile typography on the same reviewed maps and real calendar snapshot. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {renderSvg} from './generate.mjs';

const root=new URL('../',import.meta.url),folder=new URL('preview/profile-font-default/',root);
const read=name=>readFileSync(new URL(name,root),'utf8');
const calendar=JSON.parse(read('preview/factory-v8/live-calendar.json'));
if(calendar.source.fixture!==false)throw Error('Real calendar required');
const sprites=JSON.parse(gunzipSync(Buffer.from(read('assets/sprites.json.gz.b64').trim(),'base64')));
const variants=[
  {location:'industrial',font:'monospace',seed:1165146435},
  {location:'desert',font:'monospace',seed:162},
  {location:'temple',font:'monospace',seed:104},
  {location:'coast',font:'monospace',seed:111},
];
mkdirSync(folder,{recursive:true});
for(const variant of variants){
  const svg=renderSvg({weeks:calendar.weeks,sprites,username:'0w1Max',seedOverride:variant.seed,locationOverride:variant.location,});
  writeFileSync(new URL(variant.location+'.svg',folder),svg);
  variant.sha256=createHash('sha256').update(svg).digest('hex');
}
writeFileSync(new URL('manifest.json',folder),JSON.stringify({status:'profile typography default',weight:'bold',titleSize:21,monthSize:15,calendar:calendar.source,variants},null,2)+'\n');
console.log(variants.map(v=>`${v.location}: ${v.font} Bold`).join('\n'));
