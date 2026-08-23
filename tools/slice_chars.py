"""Slice each 3-pose strip into frames, cut the white away, trim and size for the game."""
import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

KEY = (255, 0, 255)

def keep_largest(mask, min_frac=0.08):
    """Keep only blobs at least min_frac of the biggest one (iterative flood fill, no scipy)."""
    m = mask > 8
    h, w = m.shape
    seen = np.zeros_like(m, dtype=bool)
    blobs = []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if not m[y, x] or seen[y, x]:
                continue
            stack = [(y, x)]; seen[y, x] = True; cells = []
            while stack:
                cy, cx = stack.pop()
                cells.append((cy, cx))
                for ny, nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
            blobs.append(cells)
    if not blobs:
        return mask
    biggest = max(len(b) for b in blobs)
    out = np.zeros_like(mask)
    for b in blobs:
        if len(b) >= biggest * min_frac:
            ys, xs = zip(*b)
            out[np.array(ys), np.array(xs)] = 255
    return out


def cut(im, thresh=40):
    w, h = im.size
    work = im.convert("RGB")
    for seed in [(0,0),(w-1,0),(0,h-1),(w-1,h-1),(w//2,0),(w//2,h-1),(0,h//2),(w-1,h//2)]:
        try: ImageDraw.floodfill(work, seed, KEY, thresh=thresh)
        except ValueError: pass
    a = np.asarray(work).astype(np.int16)
    is_key = (np.abs(a[:,:,0]-255) < 6) & (a[:,:,1] < 6) & (np.abs(a[:,:,2]-255) < 6)
    solid = np.where(is_key, 0, 255).astype(np.uint8)
    solid = keep_largest(solid)          # drop specks bled in from the neighbouring pose
    mask = Image.fromarray(solid).filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert("RGBA"); out.putalpha(mask)
    bb = mask.point(lambda v: 255 if v > 10 else 0).getbbox()
    return out.crop(bb) if bb else out

def strip(src, name, height=520):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    for i in range(3):
        frame = im.crop((i*w//3, 0, (i+1)*w//3, h))
        f = cut(frame)
        scale = height / f.height
        f = f.resize((max(1,round(f.width*scale)), height), Image.LANCZOS)
        dst = f"media/chars/{name}-{i+1}.png"
        f.save(dst, optimize=True)
        print(f"{os.path.basename(dst):16s} {f.size}  {os.path.getsize(dst)//1024} KB")

os.makedirs("media/chars", exist_ok=True)
for n in ("marco", "rosa", "kim"):
    strip(f"assets/chars/{n}-strip.png", n)

# UI flourishes
foil = Image.open("assets/chars/foil.png").convert("RGB").resize((640, 640), Image.LANCZOS)
foil.save("media/chars/foil.jpg", quality=78, optimize=True)
print("foil.jpg", os.path.getsize("media/chars/foil.jpg")//1024, "KB")
seal = cut(Image.open("assets/chars/seal.png"))
s = max(seal.size); pad = Image.new("RGBA", (s, s), (0,0,0,0))
pad.paste(seal, ((s-seal.width)//2, (s-seal.height)//2))
pad.resize((256,256), Image.LANCZOS).save("media/chars/seal.png", optimize=True)
print("seal.png", os.path.getsize("media/chars/seal.png")//1024, "KB")
