"""Compile the approved RGBA atlas into standalone, palette-limited SVG paths.

Usage: python3 scripts/compile-jungle-atlas.py atlas.png assets/jungle-sprites.json.gz.b64
The source bitmap is read only. Sampled pixels become horizontal SVG runs.
"""
import base64
import gzip
import json
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

# Half-open source bounds in the approved 1536 x 1024 atlas.
BOUNDS = {
    'palm-bank': (76, 0, 716, 480),
    'root-escarpment': (876, 0, 1468, 480),
    'ridge': (12, 488, 1524, 612),
    'grove': (8, 624, 1524, 752),
    'ground-strip': (20, 780, 620, 872),
    'moss-ledge': (12, 900, 312, 1020),
    'vine-ledge': (344, 908, 536, 1020),
    'rope-bridge': (712, 948, 920, 1016),
    'moss-boulder': (948, 904, 1108, 1008),
    'temple-block': (572, 912, 680, 1016),
    'army-crate': (1140, 908, 1264, 1008),
    'broken-log': (1300, 920, 1516, 1008),
}


def compile_atlas(source, destination):
    image = Image.open(source).convert('RGBA')
    if image.size != (1536, 1024):
        raise ValueError('Expected the approved 1536 x 1024 atlas')
    atlas = {}
    for name, (left, top, right, bottom) in BOUNDS.items():
        width, height = (right-left)//4, (bottom-top)//4
        paths = defaultdict(list)
        for y in range(height):
            row = []
            for x in range(width):
                r, g, b, alpha = image.getpixel((left+x*4+2, top+y*4+2))
                # Discard soft alpha fringe; foreground remains opaque pixel art.
                color = tuple(min(255, (v//12)*12+6) for v in (r, g, b))
                row.append(''.join(f'{v:02x}' for v in color) if alpha >= 210 else None)
            start = 0
            while start < width:
                end = start+1
                while end < width and row[end] == row[start]:
                    end += 1
                if row[start] is not None:
                    paths[row[start]].append(f'M{start} {y}h{end-start}v1h-{end-start}z')
                start = end
        # Align the visible landing surface with the physics baseline, y=0.
        if name in ('ground-strip', 'moss-ledge', 'vine-ledge', 'rope-bridge'):
            paths['889365'].append(f'M0 0h{width}v1H0z')
        atlas[name] = [width, height, [[color, ''.join(data)] for color, data in sorted(paths.items())]]
    # A separate modular stump; it must not duplicate the timber barricade.
    atlas['tree-stump'] = [12, 12, [
        ['25372e', 'M1 12V9h2V3h6v6h2v3z'],
        ['65584a', 'M3 3h6v8H3zM1 10h2v2H1zM9 10h2v2H9z'],
        ['9a8c68', 'M3 2h6v3H3z'],
        ['514b3c', 'M5 3h3v1H5zM4 6h1v4H4zM7 6h1v5H7z'],
        ['65724b', 'M0 11h4v1H0zM8 11h4v1H8z'],
    ]]
    encoded = base64.b64encode(gzip.compress(json.dumps(atlas, separators=(',', ':')).encode(), mtime=0))
    Path(destination).write_bytes(encoded+b'\n')
    print(f'Compiled {len(atlas)} jungle sprites ({len(encoded)} encoded bytes)')


if __name__ == '__main__':
    compile_atlas(*sys.argv[1:])
