/** Build end-screen previews from the exact approved SVGs, without fetching a calendar. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {renderGameOver,replaceEndScreen} from './game-over-ui.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(await readFile(resolve(root,'commando-release.json'),'utf8'));
const destination=resolve(root,'preview/official-v2.5.0');
await mkdir(destination,{recursive:true});
for(const location of catalog.locations){
  const source=resolve(root,location.scene_source_path??location.path);
  const svg=await readFile(source,'utf8');
  const output=replaceEndScreen(svg,location.id);
  await writeFile(resolve(destination,location.id+'.svg'),output);
  console.log(`${location.name}: GAME OVER preview (${Buffer.byteLength(output)} bytes)`);
}

const cards=catalog.locations.map(({id},index)=>{
  const x=index%2?300:-300,y=index<2?-170:10;
  const panel=renderGameOver(id,{duration:10,finishedAt:2,fadeBegin:6})
    .replace(/<animateTransform\b[^>]*\/>/g,'');
  return `<g transform="translate(${x} ${y})">${panel}</g>`;
}).join('');
await writeFile(resolve(destination,'game-over-panels.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="350" viewBox="0 0 1200 350">'+
  '<rect width="1200" height="350" fill="#13222a"/>'+cards+'</svg>');
