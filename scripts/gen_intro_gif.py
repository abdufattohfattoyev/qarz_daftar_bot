"""Brendli intro GIF generatori — bot /start uchun. bot/assets/intro.gif yaratadi."""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 640, 360
OUT = os.path.join(os.path.dirname(__file__), '..', 'bot', 'assets', 'intro.gif')
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def font(size, bold=True):
    for name in (('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'), 'DejaVuSans.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


TOP = (10, 77, 38)      # #0a4d26
MID = (22, 163, 74)     # #16a34a
BOT = (34, 197, 94)     # #22c55e


def bg():
    img = Image.new('RGB', (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        c = lerp(TOP, MID, t * 2) if t < 0.5 else lerp(MID, BOT, (t - 0.5) * 2)
        for x in range(W):
            px[x, y] = c
    return img


def center(d, text, fnt, y, fill, x=W // 2):
    w = d.textbbox((0, 0), text, font=fnt)[2]
    d.text((x - w // 2, y), text, font=fnt, fill=fill)


def ease(t):
    return 1 - (1 - t) ** 3


TARGET = 5_000_000
frames = []
N = 22
for i in range(N):
    img = bg()
    d = ImageDraw.Draw(img)
    # brand
    d.text((36, 30), 'Qarz Daftar', font=font(30), fill=(255, 255, 255))
    d.text((38, 70), "Qarzlaringiz — bir joyda", font=font(16, False), fill=(220, 252, 231))

    t = ease((i + 1) / N)
    val = int(TARGET * t)
    center(d, 'SOF BALANS', font(18, False), 150, (220, 252, 231))
    num = f"+{val:,}".replace(',', ' ')
    center(d, num, font(58), 178, (255, 255, 255))
    center(d, 'UZS', font(18, False), 250, (200, 240, 215))
    frames.append(img)

# oxirgi kadrlar — pillalar bilan ushlab turamiz
for _ in range(10):
    img = bg()
    d = ImageDraw.Draw(img)
    d.text((36, 30), 'Qarz Daftar', font=font(30), fill=(255, 255, 255))
    d.text((38, 70), "Qarzlaringiz — bir joyda", font=font(16, False), fill=(220, 252, 231))
    center(d, 'SOF BALANS', font(18, False), 150, (220, 252, 231))
    center(d, f"+{TARGET:,}".replace(',', ' '), font(58), 178, (255, 255, 255))
    center(d, 'UZS', font(18, False), 250, (200, 240, 215))
    # pillalar
    d.rounded_rectangle([120, 295, 305, 335], radius=20, fill=(255, 255, 255))
    d.text((140, 305), "Berdim", font=font(16), fill=(22, 163, 74))
    d.rounded_rectangle([335, 295, 520, 335], radius=20, fill=(255, 255, 255))
    d.text((355, 305), "Oldim", font=font(16), fill=(220, 38, 38))
    frames.append(img)

frames[0].save(
    OUT, save_all=True, append_images=frames[1:],
    duration=70, loop=0, optimize=True,
)
print('Saved', OUT, os.path.getsize(OUT), 'bytes')
