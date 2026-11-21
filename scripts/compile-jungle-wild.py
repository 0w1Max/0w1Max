"""Compile the natural jungle gorge RGBA atlas into standalone, palette-limited SVG paths.

Usage: python3 scripts/compile-jungle-wild.py atlas.png assets/jungle-sprites.json.gz.b64
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
    '081928','112b32','103e32','17533a','2b7141','469343','77ad44','b2c672',
    '0e4e60','237b89','5faeb1','bdd5c4',
    '292a43','45415b','6d6177','a49a9b','d0c1a3',
    '34282c','674334','97613d','b78a53',
]
RGB_PALETTE = [(name, tuple(bytes.fromhex(name))) for name in PALETTE]

# Half-open source bounds in the approved 1536 x 1024 atlas.
BOUNDS = {
    'wild-waterfall-cliff': (8, 0, 704, 440),
    'wild-fallen-trunk': (728, 0, 1536, 440),
    'wild-distant-forest': (8, 448, 1528, 608),
    'wild-undergrowth': (8, 616, 1528, 760),
    'ground-strip': (12, 780, 612, 868),
    'wild-stone-ledge': (8, 896, 280, 1012),
    'wild-root-platform': (300, 896, 544, 1012),
    'wild-log-platform': (724, 944, 972, 1008),
    'wild-moss-boulder': (980, 896, 1136, 1012),
    'wild-rock-pile': (552, 916, 712, 1012),
    'wild-root-bundle': (1144, 900, 1312, 1012),
    'wild-broken-log': (1320, 916, 1528, 1012),
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
        if name in ('ground-strip', 'wild-stone-ledge', 'wild-root-platform', 'wild-log-platform'):
            paths['b78a53' if name in ('wild-root-platform', 'wild-log-platform') else 'd0c1a3'].append(f'M0 0h{width}v1H0z')
        atlas[name] = [width, height, [[color, ''.join(data)] for color, data in sorted(paths.items())]]
    # A separate splintered natural stump with buttress roots.
    atlas['wild-stump'] = [16, 14, [
        ['34282c','M0 14v-2h2v-2h2V3h2V1h5v2h2v7h1v2h2v2z'],
        ['674334','M3 12h2V4h6v7h2v2H3z'],
        ['97613d','M5 4h2v7H5zM10 5h1v6h-1zM2 12h3v1H2z'],
        ['b78a53','M6 1h5v3H6z'],
        ['77ad44','M0 13h4v1H0zM12 13h4v1h-4z'],
    ]]
    encoded = base64.b64encode(gzip.compress(json.dumps(atlas, separators=(',', ':')).encode(), mtime=0))
    Path(destination).write_bytes(encoded+b'\n')
    print(f'Compiled {len(atlas)} jungle sprites ({len(encoded)} encoded bytes)')


if __name__ == '__main__':
    compile_atlas(*sys.argv[1:])
