/** GitHub API persistence, injectable for first-run and conflict tests. */
import {createHash} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const decode=response=>Buffer.from(response.data.content,'base64');

export async function readOutput({github,owner,repo}){
  let snapshot;
  try {snapshot=(await github.rest.git.getRef({owner,repo,ref:'heads/output'})).data.object.sha;}
  catch(error){if(error.status!==404)throw error;return {snapshot:null,previous:null};}
  // Contents API omits inline bytes for SVGs larger than 1 MB. Read the blob.
  const metadata=await github.rest.repos.getContent({owner,repo,path:'commando-activity.svg',ref:snapshot});
  const svg=decode(await github.rest.git.getBlob({owner,repo,file_sha:metadata.data.sha}));
  let previous;
  try {
    previous=JSON.parse(decode(await github.rest.repos.getContent({owner,repo,path:'commando-state.json',ref:snapshot})).toString('utf8'));
    if(previous.svgSha256!==digest(svg))throw Error('Published SVG/state mismatch');
  }catch(error){
    if(error.status!==404)throw error;
    const location=/data-location="([^"]+)"/.exec(svg.toString('utf8'))?.[1];
    if(!['desert','industrial','temple','coast'].includes(location))throw Error('Cannot bootstrap published location');
    previous={date:null,location,bootstrap:true};
  }
  return {snapshot,previous};
}

export async function publishOutput({github,owner,repo,snapshot,sourceSha,svg,state}){
  if(state.fixture||state.svgSha256!==digest(svg))throw Error('Invalid live publication');
  let current=null;
  try {current=(await github.rest.git.getRef({owner,repo,ref:'heads/output'})).data.object.sha;}
  catch(error){if(error.status!==404)throw error;}
  if(current!==snapshot)throw Error('Output changed during generation; retry without overwriting');
  const parent=snapshot?(await github.rest.git.getCommit({owner,repo,commit_sha:snapshot})).data:null;
  const entries=[];
  for(const [path,bytes] of [['commando-activity.svg',svg],['commando-state.json',JSON.stringify(state,null,2)+'\n']]){
    const blob=await github.rest.git.createBlob({owner,repo,content:Buffer.from(bytes).toString('base64'),encoding:'base64'});
    entries.push({path,mode:'100644',type:'blob',sha:blob.data.sha});
  }
  const tree=(await github.rest.git.createTree({owner,repo,...(parent?{base_tree:parent.tree.sha}:{}),tree:entries})).data;
  if(parent&&tree.sha===parent.tree.sha)return {sha:snapshot,unchanged:true};
  const commit=(await github.rest.git.createCommit({owner,repo,message:`chore(profile): v${state.version} ${state.date} ${state.location}`,tree:tree.sha,parents:[snapshot??sourceSha]})).data;
  if(snapshot)await github.rest.git.updateRef({owner,repo,ref:'heads/output',sha:commit.sha,force:false});
  else await github.rest.git.createRef({owner,repo,ref:'refs/heads/output',sha:commit.sha});
  return {sha:commit.sha,unchanged:false};
}
