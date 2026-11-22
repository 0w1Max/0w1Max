# Abandoned Factory V8.0 — draft

This standalone review replaces the factory's four obstacles and three platform designs. Production v2.6.0 and its official catalog remain unchanged.

## New native SVG sprites

| Engine key (compatibility) | New object | Collision size |
| --- | --- | --- |
| supply-crate | Reinforced cargo crate | 34 × 27 |
| fallen-log | Cable reel | 44 × 19 |
| sandbags | Pipe bundle | 45 × 25 |
| stone-ruin | Electric motor | 32 × 32 |
| metal-catwalk | Steel catwalk | Existing generated width, unchanged top |
| camo-platform | Stopped conveyor | Existing generated width, unchanged top |
| wooden-bridge | Service deck | Existing generated width, unchanged top |

Legacy keys are internal collision-model adapters; industrial rendering selects only the new sprites. All assets are local SVG geometry, with no raster embedding, external assets or scripts. Platform supports extend 32 px below the existing landing surface. Conveyor is static.

## Review

- `factory-v8.svg`: rebuilt original seed 5, animated demo.
- `steel-catwalk.svg`: seed 111, additional obstacle coverage.
- `stopped-conveyor.svg`: seed 116.
- `service-deck.svg`: seed 104, includes cable reel.
- `factory-v8-objects.svg` / `.png`: all seven sprites and background at game scale.

All animated previews use explicitly labeled test calendar data, not a claimed current contribution calendar. Across the four valid layouts every new object is shown. A single layout retains the existing limit of three obstacles and two matching platforms.

Rebuild: `node scripts/preview-factory-v8.mjs`.

Validation: 73 existing tests and two factory-specific checks passed. Existing motion planning, jump clearance, shooting and calendar regressions remain covered. The other biomes and factory architecture, calendar, soldier and GAME OVER artwork are unchanged.
