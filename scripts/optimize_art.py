"""Encode existing artwork for delivery; never replace the source illustrations."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
public = root / "public"
output = public / "art" / "optimized"
output.mkdir(exist_ok=True)
sources = ["art/menu/mountain-moon.png"]
sources += [f"reference/figure-{n}.jpg" for n in [8, 9, 10, 15, 18]]
sources += [f"art/equipment/{name}.png" for name in ["sword", "saber", "robe", "boots", "oldSword"]]
manifest = {}
for source in sources:
    image = Image.open(public / source)
    target = output / (Path(source).stem + ".webp")
    image.save(target, "WEBP", quality=90, method=6, exact=True)
    data = target.read_bytes()
    digest = hashlib.sha256(data).hexdigest()[:12]
    versioned = target.with_name(f"{target.stem}.{digest}.webp")
    target.replace(versioned)
    manifest[source] = {"file": versioned.relative_to(public).as_posix(), "bytes": len(data)}
    print(f"{source}: {(public/source).stat().st_size} -> {len(data)}")
(root / "src" / "data" / "art-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("Total:", sum((public / path).stat().st_size for path in sources), "->", sum(item["bytes"] for item in manifest.values()))
