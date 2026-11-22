# Abandoned Factory V8.1 — faithful concept implementation

This review replaces the simplified V8.0 draft with detailed artwork based on the approved concept. Production v2.6.0 is unchanged.

The seven sprites preserve the X-braced red crate, round cable reel, hollow pipe bundle, ribbed motor and lightning plate, grated steel catwalk, stopped conveyor and braced red service deck. Local vector pixel runs retain the isolated source artwork with an 80-color palette per object. The standalone game SVG embeds no bitmap images, external resources or scripts.

The source alpha atlas is `assets/factory-v8-source.png`. Rebuild the compressed vector atlas with `python scripts/compile-factory-concept.py assets/factory-v8-source.png`. The PNG was isolated from the approved concept using image generation; the compiler preserves its detailed silhouettes rather than drawing low-detail substitutes.

## Game scale and physics

- Cargo crate: 64 × 54.
- Cable reel: 76 × 53.
- Pipe bundle: 80 × 43.
- Electric motor: 76 × 53.
- Platforms: randomized width 176–188; height follows the original sprite proportions. Top landing surface remains the collision reference.
- Only the industrial biome receives these dimensions and adaptive jump arcs.
- Right-edge crossings and occasional decorative hops now account for enlarged obstacles.
- A layout still contains at most three distinct obstacles and two matching platforms.

Legacy engine keys remain collision-model adapters. Visible industrial artwork exclusively uses the new named sprites.

## View

`factory-v8-random-live.svg` is the complete random-map animation with the real published calendar snapshot (366 dates, 620 contributions, last date 2026-11-23). Seed 914102602 remains fixed for reproducible comparison with the earlier implementation. New builds can choose a fresh random seed with `node scripts/preview-factory-live.mjs`.

`factory-v8.svg`, `steel-catwalk.svg`, `stopped-conveyor.svg` and `service-deck.svg` are additional seeded real-calendar animations. Rebuild using `node scripts/preview-factory-v8.mjs --real`.

`factory-v8-objects.svg` and `.png` show all seven sprites from the actual game renderer.

## Validation

77 tests: calendar, shots, engine regressions, all seven detailed vector sprites, valid platform supports and collision clearance along the same twelve-keyframe jump curve used by the animation. Five prepared layouts are sampled at 121 points per movement segment. XML, IDs, local sprite references and standalone markup are checked independently.
