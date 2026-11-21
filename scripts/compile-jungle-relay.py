"""Compile the radio-relay RGBA atlas into standalone, palette-limited SVG paths.

Usage: python3 scripts/compile-jungle-relay.py atlas.png assets/jungle-sprites.json.gz.b64
The source bitmap is read only. Sampled pixels become horizontal SVG runs.
"""
import base64
import gzip
import json
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

# A small shared palette prevents photographic shading and gray-green wash.
PALETTE = [
    '061b28','0a141f','0d2630','143f47','225460','3c7277',
    '0c2524','16442d','26713b','57a343','96c458','686f38',
    '203546','425963','72877e','c4c4a0',
    '311e23','643727','965238','bd8752','c1b68a',
]
RGB_PALETTE = [(name, tuple(bytes.fromhex(name))) for name in PALETTE]

# Half-open source bounds in the approved 1536 x 1024 atlas.
BOUNDS = {
    'relay-bank': (8, 0, 872, 496),
    'relay-bunker': (944, 0, 1528, 496),
    'relay-horizon': (8, 504, 1528, 616),
    'relay-undergrowth': (8, 624, 1528, 768),
    'ground-strip': (12, 780, 612, 868),
    'concrete-ledge': (8, 920, 288, 1016),
    'relay-catwalk': (312, 920, 536, 1016),
    'bamboo-bridge': (696, 976, 952, 1016),
    'relay-boulder': (960, 912, 1112, 1016),
    'concrete-rubble': (520, 920, 680, 1016),
    'relay-crate': (1120, 928, 1264, 1016),
    'bamboo-barricade': (1280, 912, 1528, 1016),
}


def compile_atlas(source, destination):
    image = Image.open(source).convert('RGBA')
    if image.size != (1536, 1024):
        raise ValueError('Expected the approved 1536 x 1024 atlas')
    atlas = {}
    for name, (left, top, right, bottom) in BOUNDS.items():
        width, height = (right-left)//6, (bottom-top)//6
        paths = defaultdict(list)
        for y in range(height):
            row = []
            for x in range(width):
                r, g, b, alpha = image.getpixel((left+x*6+3, top+y*6+3))
                # Discard soft alpha fringe; foreground remains opaque pixel art.
                color = min(RGB_PALETTE, key=lambda p: sum((a-b)**2 for a, b in zip((r,g,b),p[1])))[0]
                row.append(color if alpha >= 210 else None)
            start = 0
            while start < width:
                end = start+1
                while end < width and row[end] == row[start]:
                    end += 1
                if row[start] is not None:
                    paths[row[start]].append(f'M{start} {y}h{end-start}v1h-{end-start}z')
                start = end
        # Align the visible landing surface with the physics baseline, y=0.
        if name in ('ground-strip', 'concrete-ledge', 'relay-catwalk', 'bamboo-bridge'):
            paths['bd8752' if name in ('relay-catwalk', 'bamboo-bridge') else 'c4c4a0'].append(f'M0 0h{width}v1H0z')
        atlas[name] = [width, height, [[color, ''.join(data)] for color, data in sorted(paths.items())]]
    # A snapped steel support is distinct from both bamboo cover and rubble.
    atlas['broken-post'] = [12, 12, [
        ['0a141f', 'M2 12V2h3V0h2v3h3v9z'],
        ['643727', 'M3 11V3h3V2h1v2h2v7z'],
        ['965238', 'M3 4h2v6H3z'],
        ['72877e', 'M5 2h2v2H5zM3 10h6v1H3z'],
        ['203546', 'M0 11h12v1H0z'],
    ]]
    encoded = base64.b64encode(gzip.compress(json.dumps(atlas, separators=(',', ':')).encode(), mtime=0))
    Path(destination).write_bytes(encoded+b'\n')
    print(f'Compiled {len(atlas)} jungle sprites ({len(encoded)} encoded bytes)')


if __name__ == '__main__':
    compile_atlas(*sys.argv[1:])
