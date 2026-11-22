import {loadPixelSprites} from './pixel-sprites.mjs';

export const {definitions: desertSpriteDefinitions, sprite: desertSprite} = loadPixelSprites('desert');

export const desertObstacleSprites = Object.freeze({
  'jungle-rock': 'sandstone-boulder',
  sandbags: 'desert-sandbags',
  'stone-ruin': 'broken-pillar',
  'supply-crate': 'dusty-crate',
});

export const desertPlatformSprites = Object.freeze({
  'wooden-bridge': 'eroded-stone-ledge',
  'mossy-stone': 'sandstone-shelf',
  'camo-platform': 'ashlar-stone-platform',
});
