# Live font comparison

Four regular-weight (400) fonts on the reviewed location maps and the same real calendar snapshot. These are comparison drafts; no final font has been selected.

| Location | Typeface | Live SVG |
|---|---|---|
| Factory | JetBrains Mono Regular | [industrial.svg](industrial.svg) |
| Canyon | IBM Plex Mono Regular | [desert.svg](desert.svg) |
| Temple | Manrope Regular | [temple.svg](temple.svg) |
| Coast | Space Grotesk Regular | [coast.svg](coast.svg) |

Rebuild with `python scripts/compile-hud-font.py` and `node scripts/preview-font-audition.mjs`. Original fonts and OFL licenses are in `assets/fonts`. Variable fonts are instantiated at weight 400 before compiling outlines. The SVG embeds paths, so fonts work without external requests.
