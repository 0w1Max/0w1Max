import {loadPixelSprites} from './pixel-sprites.mjs';
import {LOCATION_KITS} from './location-kit-config.mjs';

const art = Object.fromEntries(Object.keys(LOCATION_KITS).map(location=>[location,loadPixelSprites(`${location}-kit`)]));
export function locationKitTerrain(location) {
  const kit=LOCATION_KITS[location],sprites=art[location];
  if(!kit)throw Error('Unknown location kit: '+location);
  return [kit.obstacles,kit.platforms,
    names=>sprites.definitions(names).replaceAll('preserveAspectRatio="none"','preserveAspectRatio="xMidYMax meet"'),
    sprites.sprite];
}
export function locationKitPlatformHeight(location,kind,width) {
  const name=LOCATION_KITS[location]?.platforms[kind];
  if(!name)throw Error('Unknown location platform: '+location+'/'+kind);
  const [w,h]=art[location].dimensions(name);
  return width*h/w;
}
