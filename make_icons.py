#!/usr/bin/env python3
"""Draw the app's mark: favicon.ico plus the three PNGs the manifest names.

    python3 make_icons.py

THE MARK EXISTS TWICE and the two must stay one picture: this script, and the
inline SVG data URI in index.html's <head>. The SVG is what every current browser
shows in the tab and it needs no sibling file, so it survives file://; the .ico is
the fallback a browser fetches from the site root on its own, and what a bookmark
and the header <img> use. Change the geometry here and change it there.

RE-RUNNING THIS MEANS BUMPING ?v= ON EVERY favicon.ico REFERENCE — index.html's
<link>, the header <img>, and privacy.html's — or the old icon stays cached for
months.

THE MARK IS A DARTBOARD: three rings on the family tile — the midnight page as a
rounded square with the soft disc in a corner, as every mark in the family has.
A dartboard rather than a dart because it reads at 16px, where a dart is a
diagonal line, and because the app is about the board rather than the throw:
it will run cornhole and shuffleboard leagues too, and a target is the one
picture all of them share.

THREE ICONS, THREE JOBS, and the differences are not decoration:

  * icon-192 / icon-512 (`purpose: any`) and favicon.ico are ROUNDED, because
    nothing masks them.
  * icon-512-maskable is FULL BLEED with SQUARE corners, because a launcher crops
    it to its own shape — rounding a picture that is about to be rounded again
    leaves a pale seam inside the curve.
  * The maskable SAFE ZONE is a disc of radius 25.6 in the 64 viewport. This
    mark's furthest point is the outer edge of the outer ring: radius 21 plus
    half its 4.5 stroke = 23.25 from the centre — inside. WIDEN THE OUTER RING
    OR ITS STROKE AND RE-CHECK THAT SUM.

Everything is drawn at 8x and reduced with Lanczos, which is what gives the 16px
version clean edges.

The two extra tints are ARTWORK, NOT PALETTE. They are copied byte-for-byte from
the family's other marks rather than re-picked, so nothing new ever enters the
theme pack — the pack gates colours that carry meaning, and an icon does not.
"""

from PIL import Image, ImageDraw

# The mark, in the SVG's own 64x64 coordinates. Keep in step with index.html.
BG = (10, 14, 26, 255)        # #0a0e1a — midnight, the default theme's page
GLOW = (20, 28, 51, 255)      # #141c33 — the soft disc in the corner
RING_OUT = (129, 140, 248)    # #818cf8 — midnight's accent
RING_IN = (165, 180, 252)     # #a5b4fc

CENTRE = (32, 32)
RINGS = [(21, 4.5, RING_OUT), (13, 4.5, RING_IN)]   # radius, stroke, colour
BULL = (5, RING_OUT)                                  # radius, colour
DISC = (50, 14, 18)                                   # cx, cy, r — the corner glow
CORNER = 14                                           # rounded-square radius

SCALE = 8
S = 64 * SCALE


def draw(rounded):
    """The whole mark at 8x. `rounded` is False for the maskable variant."""
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=CORNER * SCALE, fill=BG)
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=BG)

    cx, cy, r = DISC
    d.ellipse([(cx - r) * SCALE, (cy - r) * SCALE, (cx + r) * SCALE, (cy + r) * SCALE],
              fill=GLOW)

    # The rings are drawn as OUTLINES, centred on their radius the way an SVG
    # stroke is, so the two pictures measure the same.
    bx, by = CENTRE
    for (radius, stroke, colour) in RINGS:
        outer = radius + stroke / 2
        d.ellipse([(bx - outer) * SCALE, (by - outer) * SCALE,
                   (bx + outer) * SCALE, (by + outer) * SCALE],
                  outline=colour + (255,), width=round(stroke * SCALE))
    r, colour = BULL
    d.ellipse([(bx - r) * SCALE, (by - r) * SCALE, (bx + r) * SCALE, (by + r) * SCALE],
              fill=colour + (255,))
    return img


def save(img, path, size):
    img.resize((size, size), Image.LANCZOS).save(path)
    print('wrote', path, size)


if __name__ == '__main__':
    rounded = draw(rounded=True)
    square = draw(rounded=False)

    # favicon.ico carries several sizes; a browser picks the one it wants.
    rounded.resize((64, 64), Image.LANCZOS).save(
        'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print('wrote favicon.ico')

    save(rounded, 'icon-192.png', 192)
    save(rounded, 'icon-512.png', 512)
    save(square, 'icon-512-maskable.png', 512)
