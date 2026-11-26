"""Generates the installer artwork (NSIS sidebar/header BMPs and the app icon) from renderer/logo.png.
Run: python build/make-assets.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOGO = Image.open(os.path.join(ROOT, "renderer", "logo.png")).convert("RGBA")
FONTS = r"C:\Windows\Fonts"


def font(name, size):
    for f in (name, "segoeui.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(os.path.join(FONTS, f), size)
        except OSError:
            pass
    return ImageFont.load_default()


def gradient(w, h, top=(28, 30, 34), bottom=(14, 15, 17)):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def glow(base, center, radius, color=(60, 130, 220), strength=70):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color + (strength,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.6))
    out = base.convert("RGBA")
    out.alpha_composite(layer)
    return out


def paste_logo(img, size, center):
    logo = LOGO.resize((size, size), Image.LANCZOS)
    img.alpha_composite(logo, (center[0] - size // 2, center[1] - size // 2))


def centered_text(d, w, y, text, f, fill):
    tw = d.textlength(text, font=f)
    d.text(((w - tw) / 2, y), text, font=f, fill=fill)


W, H = 164, 314
side = gradient(W, H)
side = glow(side, (W // 2, 112), 70)
paste_logo(side, 104, (W // 2, 112))
d = ImageDraw.Draw(side)
centered_text(d, W, 182, "Codec", font("segoeuib.ttf", 30), (240, 240, 242))
centered_text(d, W, 222, "Code Editor", font("segoeui.ttf", 13), (150, 155, 162))
d.line((44, 250, W - 44, 250), fill=(60, 64, 70), width=1)
centered_text(d, W, 262, "Version 1.0.0", font("segoeui.ttf", 11), (120, 124, 130))
side.convert("RGB").save(os.path.join(HERE, "installerSidebar.bmp"))
side.convert("RGB").save(os.path.join(HERE, "uninstallerSidebar.bmp"))

HW, HH = 150, 57
head = Image.new("RGBA", (HW, HH), (255, 255, 255, 255))
hd = ImageDraw.Draw(head)
hd.rounded_rectangle((HW - 54, 6, HW - 8, HH - 6), radius=10, fill=(24, 25, 28, 255))
paste_logo(head, 38, (HW - 31, HH // 2))
head.convert("RGB").save(os.path.join(HERE, "installerHeader.bmp"))

LOGO.save(os.path.join(HERE, "icon.ico"), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
LOGO.resize((512, 512), Image.LANCZOS).save(os.path.join(HERE, "icon.png"))
print("assets ok")
