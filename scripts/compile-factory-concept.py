"""Compile the approved-style alpha sprite atlas into standalone vector pixel runs."""
from pathlib import Path
import base64, gzip, json, sys
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])
image = Image.open(source).convert('RGBA')
boxes = {
    'cargo-crate': (40, 180, 350, 455),
    'cable-reel': (365, 180, 735, 455),
    'pipe-bundle': (740, 180, 1140, 455),
    'electric-motor': (1160, 180, 1525, 455),
    'steel-catwalk': (0, 620, 505, 810),
    'stopped-conveyor': (508, 620, 1012, 810),
    'service-deck': (1016, 620, 1530, 810),
}
small = '--small' in sys.argv
if small:
    existing = json.loads(gzip.decompress(base64.b64decode((root / 'assets/factory-v8-sprites.json.gz.b64').read_text())))
    atlas = {name: existing[name] for name in ['cargo-crate', 'steel-catwalk', 'stopped-conveyor', 'service-deck']}
    boxes = {
        'concrete-rubble': (510, 0, 900, image.height),
        'maintenance-barrier': (910, 0, 1360, image.height),
        'toolbox': (1380, 0, 1730, image.height),
    }
else:
    atlas = {}
for name, box in boxes.items():
    tile = image.crop(box)
    # Background pixels from alpha isolation are effectively transparent;
    # compile the solid sprite silhouette, never the faint background RGB.
    mask = tile.getchannel('A').point(lambda a: 255 if a >= 160 else 0)
    bounds = mask.getbbox()
    if not bounds:
        raise ValueError(name)
    tile, mask = tile.crop(bounds), mask.crop(bounds)
    # Retain the source detail. Compression only groups repeated RGB pixel runs.
    rgb = tile.convert('RGB').quantize(colors=80, method=Image.Quantize.MEDIANCUT).convert('RGB')
    paths = {}
    for y in range(tile.height):
        x = 0
        while x < tile.width:
            if mask.getpixel((x, y)) == 0:
                x += 1
                continue
            color = rgb.getpixel((x, y))
            end = x + 1
            while end < tile.width and mask.getpixel((end, y)) and rgb.getpixel((end, y)) == color:
                end += 1
            key = '%02x%02x%02x' % color
            paths.setdefault(key, []).append(f'M{x} {y}h{end-x}v1h-{end-x}z')
            x = end
    atlas[name] = [tile.width, tile.height, [[c, ''.join(runs)] for c, runs in paths.items()]]
encoded = base64.b64encode(gzip.compress(json.dumps(atlas, separators=(',', ':')).encode(), mtime=0)).decode()
(root / 'assets/factory-v8-sprites.json.gz.b64').write_text(encoded + '\n')
print(json.dumps({name: values[:2] for name, values in atlas.items()}))
