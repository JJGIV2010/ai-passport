"""Generate artistic passport QR cards — gradient QR with branded footer."""
from __future__ import annotations
from pathlib import Path
from typing import Any


# Passport brand colours
_NAVY   = (10,  22,  40)
_VIOLET = (109, 40, 217)
_CARD_BG  = (248, 249, 255)   # very light blue-white
_TEXT_DK  = (15,  23,  42)    # near-black
_TEXT_MD  = (100, 116, 139)   # slate
_BAR_H    = 8                  # px — gradient accent bars


def _find_font(size: int, bold: bool = False) -> Any:
    """Return a PIL font, falling back to the default bitmap font."""
    from PIL import ImageFont
    import platform

    if platform.system() == "Windows":
        candidates = (
            ["segoeuib.ttf", "arialbd.ttf"] if bold
            else ["segoeui.ttf", "arial.ttf", "calibri.ttf"]
        )
        roots = [r"C:\Windows\Fonts", r"C:\Windows\Fonts"]
    elif platform.system() == "Darwin":
        candidates = (
            ["/System/Library/Fonts/Helvetica.ttc"]
            if bold else ["/System/Library/Fonts/Helvetica.ttc"]
        )
        roots = [""]
    else:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        ]
        roots = [""]

    import os
    for root in roots:
        for name in candidates:
            path = os.path.join(root, name) if root else name
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size=size)
                except Exception:
                    continue
    return ImageFont.load_default()


def _gradient_strip(width: int, height: int) -> Any:
    """Horizontal navy→violet gradient as a PIL Image."""
    from PIL import Image
    strip = Image.new("RGB", (width, height))
    pixels = []
    for _y in range(height):
        for x in range(width):
            t = x / max(width - 1, 1)
            pixels.append((
                int(_NAVY[0] + t * (_VIOLET[0] - _NAVY[0])),
                int(_NAVY[1] + t * (_VIOLET[1] - _NAVY[1])),
                int(_NAVY[2] + t * (_VIOLET[2] - _NAVY[2])),
            ))
    strip.putdata(pixels)
    return strip


def _make_qr_gradient_mask(width: int, height: int) -> Any:
    """Diagonal navy→violet gradient for colouring QR modules."""
    from PIL import Image
    # Compute via two 1-D strips and blend for a diagonal effect
    h_strip = Image.new("RGB", (width, 1))
    pixels = []
    for x in range(width):
        t = x / max(width - 1, 1)
        pixels.append((
            int(_NAVY[0] + t * (_VIOLET[0] - _NAVY[0])),
            int(_NAVY[1] + t * (_VIOLET[1] - _NAVY[1])),
            int(_NAVY[2] + t * (_VIOLET[2] - _NAVY[2])),
        ))
    h_strip.putdata(pixels)
    img_h = h_strip.resize((width, height), Image.NEAREST)

    v_strip = Image.new("RGB", (1, height))
    pixels = []
    for y in range(height):
        t = y / max(height - 1, 1)
        pixels.append((
            int(_NAVY[0] + t * (_VIOLET[0] - _NAVY[0])),
            int(_NAVY[1] + t * (_VIOLET[1] - _NAVY[1])),
            int(_NAVY[2] + t * (_VIOLET[2] - _NAVY[2])),
        ))
    v_strip.putdata(pixels)
    img_v = v_strip.resize((width, height), Image.NEAREST)

    from PIL import Image as _I
    return _I.blend(img_h, img_v, 0.5)


def generate_qr(
    url: str,
    output_path: str | Path,
    *,
    name: str = "",
    score: int | None = None,
) -> Path:
    """
    Generate a passport-branded QR card PNG.

    Layout:
      [gradient bar]
      [artistic QR — gradient modules, rounded, white bg]
      [footer: left=name+score | centre=aipassport.web.app | right=install commands]
      [gradient bar]

    The QR encodes `url` (typically https://aipassport.web.app — the full
    profile URL is too long for any QR version; share that link digitally).
    """
    import qrcode
    from qrcode.image.styledpil import StyledPilImage
    from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
    from qrcode.image.styles.colormasks import ImageColorMask
    from PIL import Image, ImageDraw

    # ── Build QR ────────────────────────────────────────────────────────────
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    approx = (qr.modules_count + 8) * 10
    gradient_mask = _make_qr_gradient_mask(approx, approx)

    qr_img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=ImageColorMask(
            back_color=(255, 255, 255),
            color_mask_image=gradient_mask,
        ),
    ).convert("RGB")

    qr_w, qr_h = qr_img.size

    # ── Card dimensions ──────────────────────────────────────────────────────
    pad       = 24           # side/top padding around QR
    footer_h  = 88           # footer height
    card_w    = qr_w + pad * 2
    card_h    = _BAR_H + pad + qr_h + pad + footer_h + _BAR_H

    card = Image.new("RGB", (card_w, card_h), _CARD_BG)
    draw = ImageDraw.Draw(card)

    # ── Gradient bars (top + bottom) ─────────────────────────────────────────
    bar = _gradient_strip(card_w, _BAR_H)
    card.paste(bar, (0, 0))
    card.paste(bar, (0, card_h - _BAR_H))

    # ── QR code ─────────────────────────────────────────────────────────────
    card.paste(qr_img, (pad, _BAR_H + pad))

    # ── Footer ───────────────────────────────────────────────────────────────
    fy = _BAR_H + pad + qr_h + pad    # y-start of footer area

    # Separator line
    line_y = fy + 10
    draw.line([(pad, line_y), (card_w - pad, line_y)], fill=(220, 225, 240), width=1)
    fy += 18

    # Fonts
    font_name  = _find_font(15, bold=True)
    font_score = _find_font(12)
    font_small = _find_font(11)
    font_url   = _find_font(11)

    # Left — name + score
    left_x = pad
    if name:
        draw.text((left_x, fy), name, font=font_name, fill=_TEXT_DK)
        fy_score = fy + 20
    else:
        fy_score = fy
    if score is not None:
        score_label = f"AI Score: {score}/100"
        draw.text((left_x, fy_score), score_label, font=font_score, fill=_TEXT_MD)

    # Right — install commands
    right_lines = ["npx ai-passport", "pip install ai-passport"]
    max_rw = max(
        draw.textlength(l, font=font_small) for l in right_lines
    )
    rx = card_w - pad - int(max_rw)
    draw.text((rx, fy),      right_lines[0], font=font_small, fill=_TEXT_DK)
    draw.text((rx, fy + 18), right_lines[1], font=font_small, fill=_TEXT_MD)

    # Centre — URL
    url_label = "aipassport.web.app"
    uw = draw.textlength(url_label, font=font_url)
    ux = (card_w - uw) // 2
    draw.text((ux, fy + 9), url_label, font=font_url, fill=_TEXT_MD)

    out = Path(output_path)
    card.save(str(out), format="PNG")
    return out
