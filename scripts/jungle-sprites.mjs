import {loadPixelSprites} from './pixel-sprites.mjs';

export const {definitions: jungleSpriteDefinitions, sprite: jungleSprite} = loadPixelSprites('jungle');

export const jungleObstacleSprites = Object.freeze({
  'jungle-rock': 'wild-moss-boulder',
  'fallen-log': 'wild-broken-log',
  'stone-ruin': 'wild-rock-pile',
  'tree-stump': 'wild-stump',
  'supply-crate': 'wild-root-bundle',
});

export const junglePlatformSprites = Object.freeze({
  'wooden-bridge': 'wild-log-platform',
  'mossy-stone': 'wild-stone-ledge',
  'vine-ledge': 'wild-root-platform',
});
