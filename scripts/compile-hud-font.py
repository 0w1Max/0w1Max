"""Preserve Oxanium Regular's actual outlines for standalone GitHub SVG rendering."""
from pathlib import Path
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent

from fontTools.varLib.instancer import instantiateVariableFont
FONTS = [
    ("Oxanium", "Oxanium-Regular.ttf", "oxanium", "Oxanium-OFL.txt"),
    ("JetBrains Mono", "JetBrainsMono-Regular.ttf", "jetbrains-mono", "JetBrainsMono-OFL.txt"),
    ("IBM Plex Mono", "IBMPlexMono-Regular.ttf", "ibm-plex-mono", "IBMPlexMono-OFL.txt"),
    ("Manrope", "Manrope-Variable.ttf", "manrope", "Manrope-OFL.txt"),
    ("Space Grotesk", "SpaceGrotesk-Variable.ttf", "space-grotesk", "SpaceGrotesk-OFL.txt"),
]
for family, source, key, license_file in FONTS:
    source = ROOT / "assets/fonts" / source
    font = TTFont(source)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 400}, inplace=False)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    result = {
        "family": family, "style": "Regular", "weight": 400,
        "unitsPerEm": font["head"].unitsPerEm,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "license": license_file, "glyphs": {},
    }
    for codepoint in range(32, 127):
        name = cmap[codepoint]
        pen, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
        glyphs[name].draw(pen)
        glyphs[name].draw(bounds)
        result["glyphs"][chr(codepoint)] = {
            "advance": font["hmtx"].metrics[name][0],
            "path": pen.getCommands(), "bounds": bounds.bounds,
        }
    target = ROOT / "assets/fonts" / (key + "-regular-glyphs.json")
    target.write_text(json.dumps(result, separators=(",", ":")) + "\n")
    print(f"{family} Regular: {target.stat().st_size} bytes")
