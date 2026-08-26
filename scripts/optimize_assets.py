from pathlib import Path
from tempfile import gettempdir

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
asset = ROOT / 'asset' / 'favicon.png'
temp_root = Path(gettempdir())
backup = temp_root / 'PowerChord-favicon-original.png'
output = temp_root / 'PowerChord-favicon-optimized.png'

if not asset.exists():
    raise SystemExit(f'Missing asset: {asset}')

backup.write_bytes(asset.read_bytes())
with Image.open(asset) as image:
    optimized = image.convert('RGBA')
    optimized.thumbnail((64, 64), Image.Resampling.LANCZOS)
    optimized.save(output, format='PNG', optimize=True, compress_level=9)

asset.write_bytes(output.read_bytes())
with Image.open(asset) as optimized:
    dimensions = optimized.size

print(f'original_bytes={backup.stat().st_size}')
print(f'optimized_bytes={asset.stat().st_size}')
print(f'optimized_dimensions={dimensions}')
