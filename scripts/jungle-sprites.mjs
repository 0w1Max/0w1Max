import {loadPixelSprites} from './pixel-sprites.mjs';

export const {definitions: jungleSpriteDefinitions, sprite: jungleSprite} = loadPixelSprites('jungle');

export const jungleObstacleSprites = Object.freeze({
  'jungle-rock': 'moss-boulder',
  'fallen-log': 'broken-log',
  'stone-ruin': 'temple-block',
  'tree-stump': 'tree-stump',
  'supply-crate': 'army-crate',
});

export const junglePlatformSprites = Object.freeze({
  'wooden-bridge': 'rope-bridge',
  'mossy-stone': 'moss-ledge',
  'vine-ledge': 'vine-ledge',
});
