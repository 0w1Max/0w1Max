import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderGameOver,replaceEndScreen} from './scripts/game-over-ui.mjs';

const catalog=JSON.parse(await readFile('commando-release.json','utf8'));
const timing={duration:109,finishedAt:75,fadeBegin:81};
const panelGroup=svg=>{
  const start=svg.indexOf('<g id="mission-complete"');
  if(start<0)throw Error('missing completion group');
  const tags=/<\/?g\b[^>]*>/g;tags.lastIndex=start;
  let depth=0;
  for(let m;(m=tags.exec(svg));){
    depth+=m[0].startsWith('</')?-1:m[0].endsWith('/>')?0:1;
    if(!depth)return {before:svg.slice(0,start),group:svg.slice(start,tags.lastIndex),after:svg.slice(tags.lastIndex)};
  }
  throw Error('invalid completion group');
};

test('All four approved scenes retain the exact calendar, shots, route, viewport and final visibility timeline',async()=>{
  for(const location of catalog.locations){
    const original='<svg width="1200" height="438"><g id="contribution-grid"><rect width="18" height="18"/></g>'+
      '<g id="route"><g id="shot-1"/></g><g id="mission-complete" opacity="0">'+
      '<animate attributeName="opacity" keyTimes="0;.499;.5;.6;.7;1" values="0;0;1;1;0;0" dur="100s" repeatCount="indefinite"/>'+
      '<g><g><text>MISSION COMPLETE</text></g></g></g></svg>';
    const result=replaceEndScreen(original,location.id);
    const before=panelGroup(original),after=panelGroup(result);
    assert.equal(after.before,before.before,location.id+': scene changed');
    assert.equal(after.after,before.after,location.id+': closing content changed');
    const visibility=s=>s.match(/<animate attributeName="opacity"[^>]*\/>/)[0];
    assert.equal(visibility(after.group),visibility(before.group),location.id+': timing changed');
    assert.match(after.group,/GAME OVER/);
    assert.doesNotMatch(after.group,/MISSION COMPLETE/);
    assert.equal((after.group.match(/data-end-screen="game-over"/g)||[]).length,1);
  }
});

test('Location panels have distinct materials, vector pixel titles and only local SVG geometry',()=>{
  const expected={desert:['canyon-game-over','DESERT CANYON','#a67350'],industrial:['factory-game-over','ABANDONED FACTORY','#778d85'],temple:['temple-game-over','FLOODED TEMPLE','#7e9271'],coast:['storm-coast-victory','STORM COAST','#102836']};
  const panels=[];
  for(const [location,tokens] of Object.entries(expected)){
    const art=renderGameOver(location,timing);panels.push(art);
    for(const token of tokens)assert.ok(art.includes(token),location+': '+token);
    assert.match(art,/<title>GAME OVER<\/title>/);
    assert.match(art,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(art,/<image\b|<script\b|<foreignObject\b|https?:\/\//);
    assert.doesNotMatch(art,/<text[^>]*>GAME OVER<\/text>/,'Title should not depend on an installed font');
  }
  assert.equal(new Set(panels).size,4);
});

test('Bad end-screen timing, unknown location and malformed source SVG fail closed',()=>{
  for(const location of ['desert','industrial','temple','coast']){
    for(const bad of [{...timing,duration:0},{...timing,finishedAt:-1},{...timing,fadeBegin:74},{...timing,fadeBegin:110},{...timing,duration:NaN}])
      assert.throws(()=>renderGameOver(location,bad));
    const short=renderGameOver(location,{duration:5,finishedAt:2,fadeBegin:2.005});
    assert.doesNotMatch(short,/animateTransform/);
  }
  assert.throws(()=>renderGameOver('jungle',timing));
  assert.throws(()=>replaceEndScreen('<svg/>','desert'));
  assert.throws(()=>replaceEndScreen('<g id="mission-complete"></g>','desert'));
});
