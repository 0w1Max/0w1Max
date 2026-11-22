import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectDailyLocation} from './daily-location.mjs';
import {fetchCalendar,normalizeWeeks,renderSvg} from './generate.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=text=>createHash('sha256').update(text).digest('hex');
export function buildDailyPublication({settings,previous,now,weeks,sprites,username='0w1Max',demo=false}){
  const selected=selectDailyLocation(settings,previous,now);
  const grid=normalizeWeeks(weeks),days=grid.flat().filter(Boolean);
  let svg=renderSvg({weeks,sprites,username,fixture:demo,seedOverride:selected.seed,locationOverride:selected.location});
  svg=svg.replace(' role="img"',` data-profile-date="${selected.date}" data-project-version="${settings.version}" role="img"`);
  const state={...selected,fixture:demo,calendarDays:days.length,calendarLastDate:days.map(d=>d.date).sort().at(-1),svgSha256:hash(svg)};
  return {svg,state};
}

async function main(){
  const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const demo=args.includes('--demo');
  const settings=JSON.parse(await readFile(resolve(root,'commando-settings.json'),'utf8'));
  const previousFile=arg('--previous-state',null);
  const previous=previousFile?JSON.parse(await readFile(resolve(previousFile),'utf8')):null;
  if(!demo&&!previousFile)throw Error('Publication requires the previous output state');
  const sprites=JSON.parse(gunzipSync(Buffer.from((await readFile(resolve(root,'assets/sprites.json.gz.b64'),'utf8')).trim(),'base64')));
  const weeks=demo?JSON.parse(gunzipSync(Buffer.from((await readFile(resolve(root,'fixtures/demo-calendar.json.gz.b64'),'utf8')).trim(),'base64'))).weeks
    :await fetchCalendar(process.env.GITHUB_USER||'0w1Max',process.env.GH_TOKEN||process.env.GITHUB_TOKEN);
  const {svg,state}=buildDailyPublication({settings,previous,now:new Date(),weeks,sprites,username:process.env.GITHUB_USER||'0w1Max',demo});
  const output=resolve(arg('--output',resolve(root,'generated/commando-activity.svg')));
  const stateFile=resolve(arg('--state-output',resolve(root,'generated/commando-state.json')));
  await mkdir(dirname(output),{recursive:true});await mkdir(dirname(stateFile),{recursive:true});
  await writeFile(output,svg);await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
  console.log(`${state.date} ${settings.timezone}: ${state.location}, seed ${state.seed}, ${state.calendarDays} calendar days`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
