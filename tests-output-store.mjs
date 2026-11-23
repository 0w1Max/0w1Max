import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readOutput,publishOutput} from './scripts/output-store.mjs';
const missing=()=>{throw Object.assign(Error('Not found'),{status:404});};
const svg='<svg data-location="temple"/>',state={version:'2.7.0',fixture:false,date:'2026-11-24',location:'temple',svgSha256:createHash('sha256').update(svg).digest('hex')};
function api({head=null,saved=state}={}){
  const calls=[];
  const call=(name,result)=>async args=>{calls.push({name,args});return {data:result};};
  return {calls,rest:{git:{
    getRef:head?call('getRef',{object:{sha:head}}):missing,
    getCommit:call('getCommit',{sha:head,tree:{sha:'old-tree'}}),
    getBlob:call('getBlob',{content:Buffer.from(svg).toString('base64')}),
    createBlob:call('createBlob',{sha:'blob'}),createTree:call('createTree',{sha:'new-tree'}),
    createCommit:call('createCommit',{sha:'new-commit'}),createRef:call('createRef',{}),updateRef:call('updateRef',{}),
  },repos:{getContent:async ({path})=>{
    if(path.endsWith('json')&&saved===null)return missing();
    if(path.endsWith('svg'))return {data:{sha:'large-svg',encoding:'none',content:''}};
    return {data:{content:Buffer.from(JSON.stringify(saved)).toString('base64')}};
  }}}};
}
test('A new user repository starts with no output and publishes SVG/state in one new branch',async()=>{
  const github=api(),target={github,owner:'another-user',repo:'profile-game'};
  assert.deepEqual(await readOutput(target),{snapshot:null,previous:null});
  await publishOutput({...target,snapshot:null,sourceSha:'source',svg,state});
  const names=github.calls.map(c=>c.name);
  assert.equal(names.filter(n=>n==='createBlob').length,2);
  assert.ok(names.includes('createRef'));assert.ok(!names.includes('updateRef'));
  assert.deepEqual(github.calls.find(c=>c.name==='createCommit').args.parents,['source']);
  assert.equal(github.calls.find(c=>c.name==='createRef').args.ref,'refs/heads/output');
});
test('Existing publications migrate legacy state, reject corruption and preserve the output parent',async()=>{
  assert.equal((await readOutput({github:api({head:'old',saved:null}),owner:'u',repo:'r'})).previous.bootstrap,true);
  await assert.rejects(readOutput({github:api({head:'old',saved:{...state,svgSha256:'broken'}}),owner:'u',repo:'r'}),/mismatch/);
  const github=api({head:'old'});
  await publishOutput({github,owner:'u',repo:'r',snapshot:'old',sourceSha:'source',svg,state});
  assert.deepEqual(github.calls.find(c=>c.name==='createCommit').args.parents,['old']);
  assert.equal(github.calls.find(c=>c.name==='updateRef').args.force,false);
});
test('API failures and concurrent output changes stop before any write',async()=>{
  const github=api({head:'newer'});
  await assert.rejects(publishOutput({github,owner:'u',repo:'r',snapshot:'old',sourceSha:'source',svg,state}),/changed/);
  assert.equal(github.calls.length,1);
  github.rest.git.getRef=()=>{throw Object.assign(Error('Forbidden'),{status:403});};
  await assert.rejects(readOutput({github,owner:'u',repo:'r'}),/Forbidden/);
});
