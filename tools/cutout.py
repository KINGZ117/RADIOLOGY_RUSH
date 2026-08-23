"""Turn the flat-white-background art into trimmed, feathered PNG cutouts."""
import sys, os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

KEY = (255, 0, 255)

def cutout(src, dst, size, thresh=38):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    work = im.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                 (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        try:
            ImageDraw.floodfill(work, seed, KEY, thresh=thresh)
        except ValueError:
            pass
    a = np.asarray(work).astype(np.int16)
    is_key = (np.abs(a[:, :, 0] - 255) < 6) & (a[:, :, 1] < 6) & (np.abs(a[:, :, 2] - 255) < 6)
    alpha = np.where(is_key, 0, 255).astype(np.uint8)
    mask = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert("RGBA")
    out.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        out = out.crop(bbox)
    # square-pad then resize so every tile shares one pixel grid
    s = max(out.size)
    pad = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    pad.paste(out, ((s - out.width) // 2, (s - out.height) // 2))
    pad = pad.resize((size, size), Image.LANCZOS)
    pad.save(dst, optimize=True)
    print(f"{os.path.basename(dst):24s} {pad.size}  {os.path.getsize(dst)//1024} KB")

if __name__ == "__main__":
    for spec in sys.argv[1:]:
        src, dst, size = spec.split(":")
        cutout(src, dst, int(size))
