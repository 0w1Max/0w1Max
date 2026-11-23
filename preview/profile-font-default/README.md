# Published profile typography restored

All locations use the typography observed in the published profile SVG on 2026-11-24: native `monospace`, bold, nickname 21 px, month labels 15 px. Calendar cells remain 18 px with a 2 px gap.

The nickname baseline moves 28 screen units upward compared with the preceding default. An additional 32 units of sky above the scene protect it from clipping. Every released location now uses the factory viewport (1200 × 469, viewBox 0 -32 1200 469), without coast zoom. Nickname baseline -8, month baseline 46, and calendar origin (72, 60) are identical across locations. Calendar, terrain, soldier and shot coordinates retain their relative positions.

| Location | Live SVG |
|---|---|
| Factory | [industrial.svg](industrial.svg) |
| Canyon | [desert.svg](desert.svg) |
| Temple | [temple.svg](temple.svg) |
| Coast | [coast.svg](coast.svg) |

Run `node scripts/preview-profile-font.mjs` to rebuild the four animations from the verified real calendar snapshot. This is the renderer default; font auditions remain archived separately.
