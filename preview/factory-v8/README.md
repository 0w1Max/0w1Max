# Abandoned Factory V8.2 — consistent obstacle scale

Draft only. Production v2.6.0 and the other locations remain unchanged.

## Ground obstacles

The reinforced cargo crate is the largest obstacle. Large reels, engines and pipe bundles are removed from the active factory set. The replacements use the same detailed pixel-art material style.

| Visible sprite | Internal compatibility key | Fixed collision size |
| --- | --- | --- |
| Cargo crate | supply-crate | 40 × 34 |
| Concrete rubble | stone-ruin | 32 × 20 |
| Folding maintenance barrier | sandbags | 36 × 26 |
| Compact toolbox | fallen-log | 26 × 18 |

Each object has a fixed size. Random generation changes types and positions, never scales the objects independently. The SVG symbol preserves its native proportions with bottom alignment. The small transparent padding inside the collision box prevents stretching.

The complete object sheet uses exactly 3× scale for all four obstacle previews on a common baseline. Labels state game dimensions. They are not enlarged individually to fill matching cards.

## Platforms

Steel catwalk, stopped conveyor and service deck retain the detailed V8.1 artwork. A map contains at most two platforms, with matching type and width. Adaptive jumps, safe ground landings and firing geometry remain in the engine.

## Review files

- `factory-v8-random-live.svg`: fresh random-map animation with the verified published real calendar snapshot.
- `factory-v8-random-live.json`: selected seed, real-data provenance, exact object dimensions and SHA256.
- `factory-v8-objects.svg` / `.png`: complete kit with all four obstacles at one scale.
- `steel-catwalk.svg`, `stopped-conveyor.svg`, `service-deck.svg`: additional real-calendar examples.

The snapshot contains 366 dates and 620 contributions, through 2026-11-23. It is a snapshot, not a claim of a new API fetch.

## Rebuild

Detailed source for the three compact replacements: `assets/factory-v8-small-source.png`. Base crate and platforms: `assets/factory-v8-source.png`. Compile the base using `python scripts/compile-factory-concept.py assets/factory-v8-source.png`, then merge the compact set using `python scripts/compile-factory-concept.py assets/factory-v8-small-source.png --small`. The checked-in compressed vector atlas has all seven active sprites and no legacy motor/reel/pipe sprites.

Run `node scripts/preview-factory-v8.mjs --real` for the full kit and seeded examples. Run `node scripts/preview-factory-live.mjs` for a fresh random, populated layout. Pass `--seed` to reproduce a recorded layout.

## Checks

78 tests cover the engine, calendar, all active sprites, fixed-size hierarchy over 1000 random seeds, aspect-ratio preservation and sampled jump clearance in the prepared layouts. Source sprite compilation is deterministic.
