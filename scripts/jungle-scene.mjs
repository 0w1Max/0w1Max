import {WORLD} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 46;
const groundTileWidth = 300;
const groundTileHeight = groundTileWidth * 22 / 150;

export function jungleDimensions() {
  const viewHeight = WORLD.groundY + groundDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function jungleScene(seed) {
  const {width,groundY} = WORLD;
  const floor = Array.from({length:4},(_,index) =>
    jungleSprite('ground-strip',index*groundTileWidth,groundY,
      groundTileWidth,groundTileHeight)).join('');

  return `<g id="jungle-stage" data-art-direction="wild-gorge" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['wild-distant-forest','wild-undergrowth','wild-waterfall-cliff','wild-fallen-trunk','ground-strip']) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#0d2630"/>` +
    jungleSprite('wild-distant-forest',0,190,width,width*40/380) +
    jungleSprite('wild-undergrowth',0,groundY-width*36/380,width,width*36/380) +
    jungleSprite('wild-waterfall-cliff',8,groundY-270,270*174/110,270) +
    jungleSprite('wild-fallen-trunk',604,groundY-315,315*202/110,315) +
    '</g>' +
    // Keep calendar cells readable over the gorge and the diagonal trunk.
    // Stepped strips match the pixel scenery and avoid a framed HUD panel.
    '<g id="jungle-calendar-backplate" fill="#061b28" aria-hidden="true">' +
    '<rect width="1200" height="218" fill-opacity=".72"/>' +
    '<rect y="218" width="1200" height="8" fill-opacity=".48"/>' +
    '<rect y="226" width="1200" height="8" fill-opacity=".24"/></g>' +
    '<g id="jungle-ground">' +
    `<rect y="${groundY}" width="${width}" height="${groundDepth}" fill="#292a43"/>` +
    floor + '</g></g>';
}
