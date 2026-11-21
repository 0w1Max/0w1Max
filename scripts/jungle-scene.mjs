import {WORLD} from './mission.mjs';
import {jungleSprite, jungleSpriteDefinitions} from './jungle-sprites.mjs';

const groundDepth = 46;
const groundTileWidth = 300;
const groundTileHeight = groundTileWidth * 14 / 100;

export function jungleDimensions() {
  const viewHeight = WORLD.groundY + groundDepth;
  return {displayHeight:viewHeight,viewHeight};
}

export function jungleScene(seed) {
  const {width,groundY} = WORLD;
  const floor = Array.from({length:4},(_,index) =>
    jungleSprite('ground-strip',index*groundTileWidth,groundY,
      groundTileWidth,groundTileHeight)).join('');

  return `<g id="jungle-stage" data-art-direction="radio-relay" data-seed="${seed}" data-ground-baseline="${groundY}" shape-rendering="crispEdges">` +
    jungleSpriteDefinitions(['relay-horizon','relay-undergrowth','relay-bank','relay-bunker','ground-strip']) +
    '<g id="jungle-backdrop">' +
    `<rect width="${width}" height="${groundY}" fill="#0d2630"/>` +
    jungleSprite('relay-horizon',0,232,width,width*18/253) +
    jungleSprite('relay-undergrowth',0,groundY-width*24/253,width,width*24/253) +
    jungleSprite('relay-bank',8,groundY-270,270*144/82,270) +
    '<g opacity=".78">' +
    jungleSprite('relay-bunker',666,groundY-350,350*97/82,350) +
    '</g>' +
    // Broken power line connects the bamboo pylon to the relay in the rear plane.
    '<path d="M290 282h38v8h48v7h52v4h82v-4h68v-6h65v-7h64" fill="none" stroke="#643727" stroke-width="2"/>' +
    '</g>' +
    // Keep calendar cells readable over both tree silhouettes and open sky.
    // Stepped strips match the pixel scenery and avoid a framed HUD panel.
    '<g id="jungle-calendar-backplate" fill="#061b28" aria-hidden="true">' +
    '<rect width="1200" height="218" fill-opacity=".72"/>' +
    '<rect y="218" width="1200" height="8" fill-opacity=".48"/>' +
    '<rect y="226" width="1200" height="8" fill-opacity=".24"/></g>' +
    '<g id="jungle-ground">' +
    `<rect y="${groundY}" width="${width}" height="${groundDepth}" fill="#203546"/>` +
    floor + '</g></g>';
}
