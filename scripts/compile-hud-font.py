"""Preserve Oxanium Regular's actual outlines for standalone GitHub SVG rendering."""
from pathlib import Path
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/fonts/Oxanium-Regular.ttf'
font = TTFont(SOURCE)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
result = {
    'family': 'Oxanium', 'style': 'Regular', 'weight': 400,
    'unitsPerEm': font['head'].unitsPerEm,
    'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'license': 'Oxanium-OFL.txt', 'glyphs': {},
}
for codepoint in range(32, 127):
    name = cmap[codepoint]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    result['glyphs'][chr(codepoint)] = {
        'advance': font['hmtx'].metrics[name][0],
        'path': pen.getCommands(), 'bounds': bounds.bounds,
    }
target = ROOT / 'assets/fonts/oxanium-regular-glyphs.json'
target.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Oxanium Regular: {len(result["glyphs"])} glyphs, {target.stat().st_size} bytes')
