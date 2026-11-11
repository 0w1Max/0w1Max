import {loadPixelSprites} from './pixel-sprites.mjs';

export const {definitions: volcanoSpriteDefinitions, sprite: volcanoSprite} = loadPixelSprites('volcano');

export const volcanoObstacleSprites = Object.freeze({
  'jungle-rock': 'basalt-boulder',
  'fallen-log': 'ruptured-pipe',
  sandbags: 'slag-pile',
  'stone-ruin': 'steel-barricade',
  'tree-stump': 'furnace-vent',
  'supply-crate': 'power-terminal',
});

export const volcanoPlatformSprites = Object.freeze({
  'mossy-stone': 'basalt-ledge',
  'metal-catwalk': 'truss-catwalk',
  'camo-platform': 'armored-gangway',
});
