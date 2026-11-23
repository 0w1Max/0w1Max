"""Compile isolated concept sprites into the game's self-contained pixel vectors."""
from pathlib import Path
import base64
import gzip
import json
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    'desert': ('exec-05178e79-a483-483f-8d39-3ddfddf912b8.png', [0, 545, 1020, 1470, 2006], [0, 650, 1300, 2006]),
    'temple': ('exec-7562612f-11ea-403b-b916-eb8093082df7.png', [0, 550, 1050, 1500, 2079], [0, 650, 1310, 2079]),
    'coast': ('exec-36baeba7-f687-49f1-b6ee-60e43f634590.png', [0, 590, 1100, 1620, 2172], [0, 733, 1425, 2172]),
}


def compile_atlas(location, source, obstacle_edges, platform_edges):
    image = Image.open(source).convert('RGBA')
    revision = Image.open(ROOT / 'assets/location-kit-revision-2-source.png').convert('RGBA')
    revision_edges = [0, 550, 1090, 1650, 2172]
    replacements = {'obstacle-2': {'desert': 0, 'temple': 1, 'coast': 2}[location]}
    if location == 'coast':
        replacements['obstacle-0'] = 3
    split = round(image.height * .59)
    atlas = {}
    for row, edges in enumerate([obstacle_edges, platform_edges]):
        for index, (left, right) in enumerate(zip(edges, edges[1:])):
            name = f'{"obstacle" if row == 0 else "platform"}-{index}'
            tile = image.crop((left, 0 if row == 0 else split, right, split if row == 0 else image.height))
            if name in replacements:
                column = replacements[name]
                tile = revision.crop((revision_edges[column], 0, revision_edges[column + 1], revision.height))
            mask = tile.getchannel('A').point(lambda a: 255 if a >= 160 else 0)
            bounds = mask.getbbox()
            if bounds is None:
                raise ValueError(f'Empty sprite: {location}/{name}')
            tile = tile.crop(bounds)
            # The compiled resolution retains far more detail than the 30–150px game footprint.
            maximum = 240 if row == 0 else 400
            if tile.width > maximum:
                tile = tile.resize((maximum, round(tile.height * maximum / tile.width)), Image.Resampling.NEAREST)
            mask = tile.getchannel('A').point(lambda a: 255 if a >= 160 else 0)
            rgb = tile.convert('RGB').quantize(colors=64, method=Image.Quantize.MEDIANCUT).convert('RGB')
            pixels, alpha = rgb.load(), mask.load()
            paths = {}
            for y in range(tile.height):
                x = 0
                while x < tile.width:
                    if not alpha[x, y]:
                        x += 1
                        continue
                    color = pixels[x, y]
                    end = x + 1
                    while end < tile.width and alpha[end, y] and pixels[end, y] == color:
                        end += 1
                    key = '%02x%02x%02x' % color
                    paths.setdefault(key, []).append(f'M{x} {y}h{end-x}v1h-{end-x}z')
                    x = end
            atlas[name] = [tile.width, tile.height, [[color, ''.join(runs)] for color, runs in paths.items()]]
    output = ROOT / f'assets/{location}-kit-sprites.json.gz.b64'
    packed = gzip.compress(json.dumps(atlas, separators=(',', ':')).encode(), mtime=0)
    output.write_text(base64.b64encode(packed).decode() + '\n')
    print(location, {name: value[:2] for name, value in atlas.items()})


if __name__ == '__main__':
    for location, (filename, top, bottom) in SOURCES.items():
        source = ROOT.parent / 'generated_images' / filename
        target = ROOT / f'assets/{location}-kit-source.png'
        if source.exists():
            shutil.copyfile(source, target)
        compile_atlas(location, target, top, bottom)
