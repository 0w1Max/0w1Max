import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monthLabels} from './scripts/profile-hud.mjs';
import {hudBaselineForTop} from './scripts/hud-font.mjs';

test('Font auditions retain regular outlines, real calendar and independent animation timelines',()=>{
  const manifest=JSON.parse(readFileSync('preview/font-audition-v1/manifest.json'));
  const calendar=JSON.parse(readFileSync('preview/factory-v8/live-calendar.json'));
  for(const variant of manifest.variants){
    const svg=readFileSync(`preview/font-audition-v1/${variant.location}.svg`,'utf8');
    const overlay=svg.split('id="contribution-overlay"')[1].split('id="contribution-grid"')[0];
    assert.ok(overlay.includes(`data-font="${variant.font} Regular"`));
    assert.doesNotMatch(overlay,/<text|font-weight="bold"|@font-face|https?:/);
    assert.match(svg,/<animateTransform/);
    for(const day of calendar.weeks.flatMap(w=>w.contributionDays))
      assert.ok(svg.includes(`${day.date}: ${day.contributionCount} contributions`));
    const font=JSON.parse(readFileSync(`assets/fonts/${variant.fontKey}-regular-glyphs.json`));
    assert.equal(font.weight,400);
    const baseline=hudBaselineForTop('0w1Max /',22,5,variant.fontKey);
    const maxY=Math.max(...[...'0w1Max /'].map(c=>font.glyphs[c].bounds?.[3]??0));
    assert.ok(Math.abs(baseline-maxY*22/font.unitsPerEm-5)<.001);
    for(const columns of [53,54,55]){
      const grid=Array.from({length:columns},(_,col)=>Array.from({length:7},(_,day)=>({date:new Date(Date.UTC(2025,10,23+(col*7)+day)).toISOString().slice(0,10)})));
      const labels=monthLabels(grid,{fontKey:variant.fontKey});
      labels.slice(1).forEach((label,i)=>assert.ok(label.x-labels[i].x-labels[i].width>=6.99));
    }
  }
});
