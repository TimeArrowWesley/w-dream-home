"""Package the six DOM-observed #planTexture PNGs exported from the real viewer.

Capture each version after material loading, via its Plan tab. This script does
not render or infer geometry; recapture after layout changes before packaging.
"""
from pathlib import Path
from PIL import Image
import hashlib, json, sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / '調整紀錄/20261002AI取景定位VP01/plans'
output = root / '成品圖集/20260914暗色現代工業/plans'
output.mkdir(exist_ok=True)
records = []
for i in range(6):
    name = f'v{i}-vp01'
    path = source / f'{name}.png'
    target = output / f'{name}.webp'
    with Image.open(path) as original:
        assert original.size == (1924, 1417), (path, original.size)
        image = original.convert('RGB')
        image.thumbnail((1184, 872), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=88, method=6)
    records.append({'version': f'v{i}', 'viewBox': [-250, -70, 1480, 1090],
                    'sourceSize': [1924, 1417], 'displaySize': list(image.size),
                    'sourceSHA256': hashlib.sha256(path.read_bytes()).hexdigest(),
                    'webpSHA256': hashlib.sha256(target.read_bytes()).hexdigest(),
                    'bytes': target.stat().st_size})
(source / 'sources.json').write_text(json.dumps({
    'method': 'Real browser WebGL capturePlan; DOM #planTexture PNG, 100cm section, model XY in cm',
    'revision': 'VP01', 'records': records}, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print(json.dumps({'plans': len(records), 'bytes': sum(e['bytes'] for e in records)}))
