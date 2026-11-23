import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWeeks} from './scripts/generate.mjs';
import {buildLevel,createMission,validateLayout,WORLD} from './scripts/mission.mjs';
import {LOCATION_KITS} from './scripts/location-kit-config.mjs';
import {locationKitPlatformHeight,locationKitTerrain} from './scripts/location-kit-sprites.mjs';
import {levelMarkup} from './scripts/level-art.mjs';

const calendar=JSON.parse(readFileSync('preview/factory-v8/live-calendar.json','utf8'));
const grid=normalizeWeeks(calendar.weeks);
for(const [location,kit] of Object.entries(LOCATION_KITS)){
  test(`${location}: every new object is reachable through the generator and platforms fit above ground`,()=>{
    const obstacles=new Set(),platforms=new Set();
    for(let seed=0;seed<1000;seed++){
      const level=buildLevel(grid,'0w1Max',seed,location);
      assert.ok(validateLayout(level).valid);
      for(const o of level.obstacles){
        obstacles.add(o.kind);
        assert.ok(o.width>=34&&o.height>=22,'Footprint must remain readable at mobile scale');
      }
      for(const p of level.platforms){
        platforms.add(p.kind);
        assert.ok(p.y+locationKitPlatformHeight(location,p.kind,p.width)<=WORLD.groundY,'Supports extend below ground');
      }
    }
    assert.deepEqual([...obstacles].sort(),Object.keys(kit.obstacles).sort());
    assert.deepEqual([...platforms].sort(),Object.keys(kit.platforms).sort());
    const definitions=locationKitTerrain(location)[2]([...Object.values(kit.obstacles),...Object.values(kit.platforms)]);
    assert.equal((definitions.match(/preserveAspectRatio="xMidYMax meet"/g)||[]).length,7);
    assert.doesNotMatch(definitions,/<image|<script|https?:/);
    const sample=buildLevel(grid,'0w1Max',5,location);
    assert.match(levelMarkup(sample),new RegExp(`${location}-kit-sprite-`));
  });
  test(`${location}: soldier clears the enlarged silhouettes throughout actual SVG jump keyframes`,()=>{
    for(let seed=0;seed<40;seed++){
      const level=buildLevel(grid,'0w1Max',seed,location),mission=createMission(grid,level);
      for(const s of mission.segments)for(let i=0;i<=120;i++){
        const u=i/120,x=s.x0+(s.x1-s.x0)*u;
        let foot=s.y0+(s.y1-s.y0)*u;
        if(['jump','drop','hop'].includes(s.kind)){
          const q=u*12,j=Math.min(11,Math.floor(q)),f=q-j;
          foot-=(Math.sin(j/12*Math.PI)*(1-f)+Math.sin((j+1)/12*Math.PI)*f)*(s.arc??57);
        }
        assert.ok(!level.obstacles.some(o=>x+54>o.x&&x+24<o.x+o.width&&foot>WORLD.groundY-o.height+.1),`seed=${seed} segment=${s.start} ${s.kind}`);
      }
      assert.equal(mission.segments.at(-1).x1,mission.initial.x);
      assert.equal(mission.segments.at(-1).y1,mission.initial.footY);
    }
  });
}
