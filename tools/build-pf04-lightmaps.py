"""PF04: downsample *linear irradiance*, then encode RGBM16 (alpha is data)."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, hashlib

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / '調整紀錄/20261028載入與手機優化PF04'
rows = []
for version in range(6):
    base = ROOT / ('assets/blender-v1/bw03' if version == 1 else f'assets/blender-home/bw04/v{version}')
    for detail in ('', 'sf01-'):
        for name in ('daylight', 'general', 'display', 'rgb'):
            source = base / f'{detail}{name}.webp'
            image = Image.open(source).convert('RGBA')
            raw = np.asarray(image, dtype=np.float32) / 255
            linear = raw[:, :, :3] * raw[:, :, 3:4] * 16
            for profile, limit in [('desktop', 2048), ('mobile', 1024)]:
                size = min(image.width, limit // (2 if detail else 1))
                filtered = np.stack([np.asarray(Image.fromarray(linear[:, :, c], 'F').resize((size, size), Image.Resampling.BOX)) for c in range(3)], axis=-1)
                multiplier = np.maximum(1 / 255, np.ceil(np.max(filtered, axis=-1, keepdims=True) / 16 * 255) / 255)
                encoded = np.concatenate([np.clip(filtered / (multiplier * 16), 0, 1), multiplier], axis=-1)
                encoded = np.rint(encoded * 255).astype(np.uint8)
                target = base / 'pf04' / profile / source.name
                target.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(encoded, 'RGBA').save(target, lossless=True, method=4, exact=True)
                decoded = encoded[:, :, :3] / 255 * encoded[:, :, 3:4] / 255 * 16
                rows.append(dict(version=f'v{version}', profile=profile, path=target.relative_to(ROOT).as_posix(), sourceBytes=source.stat().st_size, bytes=target.stat().st_size, size=size, meanEncodingError=float(np.abs(decoded-filtered).mean()), sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest()))
    print(f'v{version} done', flush=True)
(REPORT / '光照資產.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
for p in ('desktop', 'mobile'):
    r = [i for i in rows if i['profile'] == p]
    print(p, sum(i['sourceBytes'] for i in r), '->', sum(i['bytes'] for i in r), flush=True)
