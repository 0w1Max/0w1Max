import {loadPixelSprites} from './pixel-sprites.mjs';

export const {definitions: jungleSpriteDefinitions, sprite: jungleSprite} = loadPixelSprites('jungle');

export const jungleObstacleSprites = Object.freeze({
  'jungle-rock': 'relay-boulder',
  'fallen-log': 'bamboo-barricade',
  'stone-ruin': 'concrete-rubble',
  'tree-stump': 'broken-post',
  'supply-crate': 'relay-crate',
});

export const junglePlatformSprites = Object.freeze({
  'wooden-bridge': 'bamboo-bridge',
  'mossy-stone': 'concrete-ledge',
  'vine-ledge': 'relay-catwalk',
});
