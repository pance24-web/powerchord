from pathlib import Path
from PIL import Image

asset = Path('asset/favicon.png')
backup = Path('/tmp/PowerChord-favicon-original.png')
output = Path('/tmp/PowerChord-favicon-optimized.png')

if not asset.exists():
    raise SystemExit(f'Missing asset: {asset}')

backup.write_bytes(asset.read_bytes())
with Image.open(asset) as image:
    image = image.convert('RGBA')
    image.thumbnail((64, 64), Image.Resampling.LANCZOS)
    image.save(output, format='PNG', optimize=True, compress_level=9)

asset.write_bytes(output.read_bytes())
print(f'original_bytes={backup.stat().st_size}')
print(f'optimized_bytes={asset.stat().st_size}')
print(f'optimized_dimensions={Image.open(asset).size}')
