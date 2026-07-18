#!/usr/bin/env python3
"""Render a fast-paced vertical intro video for Lian Nar."""

from __future__ import annotations

import math
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
PREVIEW = ROOT / "preview"
OUTPUT = ROOT / "练哪儿_核心卖点视频_v3.mp4"

WIDTH = 720
HEIGHT = 1280
FPS = 24
DURATION = 10.8

BLACK = (8, 9, 10)
PANEL = (24, 25, 27)
WHITE = (246, 246, 244)
MUTED = (174, 177, 180)
GOLD = (221, 174, 86)
GOLD_DARK = (132, 96, 42)
RED = (213, 83, 72)
GREEN = (90, 204, 153)

FONT_PATHS = [
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for path in FONT_PATHS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size=size, index=1 if bold else 0)
    return ImageFont.load_default()


F12 = font(12)
F18 = font(18)
F20 = font(20)
F22 = font(22)
F24 = font(24, True)
F28 = font(28, True)
F32 = font(32, True)
F38 = font(38, True)
F46 = font(46, True)
F54 = font(54, True)
F68 = font(68, True)
F82 = font(82, True)
F104 = font(104, True)


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def ease(value: float) -> float:
    value = clamp(value)
    return 1 - (1 - value) ** 3


def ease_out_back(value: float) -> float:
    value = clamp(value)
    c1 = 1.28
    c3 = c1 + 1
    return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2


def pulse(value: float) -> float:
    return (math.sin(value * math.pi * 2) + 1) / 2


def text_width(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=selected_font)
    return box[2] - box[0]


def center_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    selected_font: ImageFont.ImageFont,
    fill: tuple[int, int, int] | tuple[int, int, int, int] = WHITE,
) -> None:
    width = text_width(draw, text, selected_font)
    draw.text(((WIDTH - width) // 2, y), text, font=selected_font, fill=fill)


def split_center_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    parts: list[tuple[str, tuple[int, int, int]]],
    selected_font: ImageFont.ImageFont,
) -> None:
    total = sum(text_width(draw, part, selected_font) for part, _ in parts)
    x = (WIDTH - total) // 2
    for part, color in parts:
        draw.text((x, y), part, font=selected_font, fill=color)
        x += text_width(draw, part, selected_font)


def scale_text(
    frame: Image.Image,
    center: tuple[int, int],
    text: str,
    selected_font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    scale: float = 1.0,
    alpha: int = 255,
) -> None:
    probe = ImageDraw.Draw(frame)
    box = probe.textbbox((0, 0), text, font=selected_font)
    width = box[2] - box[0] + 16
    height = box[3] - box[1] + 16
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    layer_draw.text((8 - box[0], 8 - box[1]), text, font=selected_font, fill=(*fill, alpha))
    target = (max(1, int(width * scale)), max(1, int(height * scale)))
    layer = layer.resize(target, Image.Resampling.LANCZOS)
    x = int(center[0] - target[0] / 2)
    y = int(center[1] - target[1] / 2)
    frame.alpha_composite(layer, (x, y))


def draw_corner_label(draw: ImageDraw.ImageDraw, text: str) -> None:
    rounded_box(draw, (46, 48, 242, 94), (8, 9, 10, 210), (235, 235, 232, 115), 1, 23)
    draw.ellipse((62, 63, 76, 77), fill=GOLD)
    draw.text((90, 58), text, font=F18, fill=WHITE)


def draw_shutter(frame: Image.Image, progress: float, reverse: bool = False) -> None:
    progress = ease(progress)
    draw = ImageDraw.Draw(frame)
    width = int(WIDTH * progress)
    color = (245, 245, 242, 235)
    if reverse:
        draw.rectangle((WIDTH - width, 0, WIDTH, HEIGHT), fill=color)
    else:
        draw.rectangle((0, 0, width, HEIGHT), fill=color)


def fit_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    max_width: int,
    start_size: int,
    minimum: int = 24,
    bold: bool = True,
) -> ImageFont.FreeTypeFont:
    size = start_size
    while size > minimum:
        candidate = font(size, bold)
        if text_width(draw, text, candidate) <= max_width:
            return candidate
        size -= 2
    return font(minimum, bold)


def rounded_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int] | tuple[int, int, int, int],
    outline: tuple[int, int, int] | tuple[int, int, int, int] | None = None,
    width: int = 1,
    radius: int = 18,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def cover_motion(image: Image.Image, zoom: float, pan_x: float = 0.5, pan_y: float = 0.5) -> Image.Image:
    source = ImageOps.exif_transpose(image).convert("RGB")
    base_scale = max(WIDTH / source.width, HEIGHT / source.height)
    target_width = max(WIDTH, int(source.width * base_scale * zoom))
    target_height = max(HEIGHT, int(source.height * base_scale * zoom))
    resized = source.resize((target_width, target_height), Image.Resampling.LANCZOS)
    left = int((target_width - WIDTH) * clamp(pan_x))
    top = int((target_height - HEIGHT) * clamp(pan_y))
    return resized.crop((left, top, left + WIDTH, top + HEIGHT))


def grade_background(image: Image.Image, darkness: int = 135, blur: int = 0) -> Image.Image:
    graded = ImageEnhance.Color(image).enhance(0.78)
    graded = ImageEnhance.Contrast(graded).enhance(1.12)
    if blur:
        graded = graded.filter(ImageFilter.GaussianBlur(blur))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, darkness))
    return Image.alpha_composite(graded.convert("RGBA"), overlay)


def draw_logo(draw: ImageDraw.ImageDraw, x: int, y: int, compact: bool = False) -> None:
    size = 84 if compact else 104
    rounded_box(draw, (x, y, x + size, y + size), WHITE, radius=22)
    mark_font = F46 if compact else F54
    mark = "练"
    mark_w = text_width(draw, mark, mark_font)
    draw.text((x + (size - mark_w) // 2, y + 13), mark, font=mark_font, fill=BLACK)
    name_x = x + size + 22
    draw.text((name_x, y + 6), "练哪儿", font=F32 if compact else F38, fill=WHITE)
    draw.text((name_x, y + 50), "广州健身房真实评分系统", font=F18, fill=MUTED)


def draw_badge(draw: ImageDraw.ImageDraw, y: int, number: str, label: str) -> None:
    badge_width = 250
    x = (WIDTH - badge_width) // 2
    rounded_box(draw, (x, y, x + badge_width, y + 52), (18, 18, 19, 225), GOLD_DARK, 2, 26)
    draw.text((x + 24, y + 12), number, font=F20, fill=GOLD)
    draw.line((x + 66, y + 13, x + 66, y + 39), fill=(106, 83, 45), width=2)
    draw.text((x + 86, y + 12), label, font=F20, fill=WHITE)


def draw_progress(draw: ImageDraw.ImageDraw, t: float) -> None:
    x1, x2, y = 72, WIDTH - 72, HEIGHT - 58
    draw.rounded_rectangle((x1, y, x2, y + 4), radius=2, fill=(75, 77, 80))
    draw.rounded_rectangle((x1, y, x1 + int((x2 - x1) * clamp(t / DURATION)), y + 4), radius=2, fill=GOLD)


def scene_one(local_t: float) -> Image.Image:
    duration = 2.15
    progress = clamp(local_t / duration)
    frame = Image.new("RGBA", (WIDTH, HEIGHT), BLACK + (255,))

    # A restrained light field keeps the opening text-only while giving the
    # two opposing entrances enough depth to feel intentional.
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = 210 + int(35 * pulse(local_t * 0.72))
    glow_draw.ellipse(
        (
            WIDTH // 2 - glow_radius,
            HEIGHT // 2 - glow_radius,
            WIDTH // 2 + glow_radius,
            HEIGHT // 2 + glow_radius,
        ),
        fill=(221, 174, 86, 34),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(92))
    frame = Image.alpha_composite(frame, glow)

    first = ease_out_back(local_t / 0.48)
    second = ease_out_back((local_t - 0.18) / 0.52)
    first_x = int(WIDTH // 2 - (1 - first) * 520)
    second_x = int(WIDTH // 2 + (1 - second) * 520)
    first_alpha = int(255 * ease(local_t / 0.30))
    second_alpha = int(255 * ease((local_t - 0.18) / 0.34))

    scale_text(frame, (first_x, 515), "健身房评分", F82, WHITE, 1.08 - first * 0.08, first_alpha)

    # Keep the actual question optically centered. The punctuation sits outside
    # the centered word so its narrow glyph does not pull the line to the left.
    question_scale = 1.12 - second * 0.12
    scale_text(frame, (second_x, 650), "可信吗", F104, GOLD, question_scale, second_alpha)
    question_width = text_width(ImageDraw.Draw(frame), "可信吗", F104) * question_scale
    scale_text(
        frame,
        (int(second_x + question_width / 2 + 34), 650),
        "？",
        F68,
        GOLD,
        question_scale,
        int(second_alpha * 0.82),
    )

    # One synchronized impact pulse makes the question feel decisive without
    # adding any copy or visual ornament that competes with it.
    impact = clamp(1 - abs(local_t - 0.82) / 0.16)
    if impact > 0:
        flash = Image.new("RGBA", (WIDTH, HEIGHT), (246, 246, 244, int(44 * impact)))
        frame = Image.alpha_composite(frame, flash)

    if 1.78 < local_t < duration:
        exit_progress = ease((local_t - 1.78) / (duration - 1.78))
        fade = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, int(255 * exit_progress)))
        frame = Image.alpha_composite(frame, fade)
    return frame


def scene_two(local_t: float) -> Image.Image:
    duration = 3.45
    frame = Image.new("RGBA", (WIDTH, HEIGHT), BLACK + (255,))

    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((120, 180, 600, 660), fill=(221, 174, 86, 28))
    frame = Image.alpha_composite(frame, glow.filter(ImageFilter.GaussianBlur(110)))

    # Three short statements replace the old photographic montage. Each line
    # enters from a different direction, so the mechanism reads in one glance.
    stages = [
        ("平台自费", 350, GOLD, F82, -520, 0.00),
        ("体验官到店", 545, WHITE, F68, 520, 0.45),
        ("统一实测", 710, WHITE, F68, -520, 0.90),
    ]
    for text, y, color, selected_font, start_offset, delay in stages:
        enter = ease_out_back((local_t - delay) / 0.52)
        x = WIDTH // 2 + int((1 - enter) * start_offset)
        alpha = int(255 * ease((local_t - delay) / 0.30))
        scale_text(frame, (x, y), text, selected_font, color, 1.08 - enter * 0.08, alpha)

    draw = ImageDraw.Draw(frame)
    line_show = ease((local_t - 1.30) / 0.46)
    line_width = int(520 * line_show)
    draw.line(
        (WIDTH // 2 - line_width // 2, 835, WIDTH // 2 + line_width // 2, 835),
        fill=(*GOLD, int(220 * line_show)),
        width=3,
    )

    detail_show = ease((local_t - 1.48) / 0.46)
    center_text(draw, 875, "价格 · 器械 · 拥挤 · 卫生", F24, (*MUTED, int(255 * detail_show)))

    proof_enter = ease_out_back((local_t - 1.86) / 0.52)
    proof_y = int(1010 + (1 - proof_enter) * 90)
    scale_text(
        frame,
        (WIDTH // 2, proof_y),
        "不是随手点评",
        F38,
        WHITE,
        1.10 - proof_enter * 0.10,
        int(255 * proof_enter),
    )

    impact = clamp(1 - abs(local_t - 2.42) / 0.16)
    if impact > 0:
        frame = Image.alpha_composite(
            frame,
            Image.new("RGBA", (WIDTH, HEIGHT), (221, 174, 86, int(30 * impact))),
        )
    return frame


def scene_three(local_t: float) -> Image.Image:
    duration = 3.05
    frame = Image.new("RGBA", (WIDTH, HEIGHT), BLACK + (255,))
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((180, 330, 540, 690), fill=(213, 83, 72, 22))
    frame = Image.alpha_composite(frame, glow.filter(ImageFilter.GaussianBlur(90)))

    title_enter = ease_out_back(local_t / 0.48)
    scale_text(
        frame,
        (WIDTH // 2, 355),
        "商家合作",
        F68,
        WHITE,
        1.10 - title_enter * 0.10,
        int(255 * title_enter),
    )
    zero_enter = ease_out_back((local_t - 0.34) / 0.46)
    scale_text(
        frame,
        (WIDTH // 2, 585),
        "= 0",
        F104,
        GOLD,
        1.35 - zero_enter * 0.35,
        int(255 * zero_enter),
    )

    draw = ImageDraw.Draw(frame)
    rules = [("不接排名", 805), ("不改评分", 920)]
    for index, (label, y) in enumerate(rules):
        show = ease_out_back((local_t - 0.82 - index * 0.28) / 0.45)
        x = int(WIDTH // 2 - (1 - show) * (420 if index == 0 else -420))
        scale_text(frame, (x, y), label, F38, WHITE, 1.05 - show * 0.05, int(255 * show))
        strike_width = int(300 * ease((local_t - 1.12 - index * 0.28) / 0.30))
        draw.line(
            (WIDTH // 2 - strike_width // 2, y + 4, WIDTH // 2 + strike_width // 2, y + 4),
            fill=(*RED, 225),
            width=5,
        )

    conclusion = ease((local_t - 1.65) / 0.52)
    center_text(draw, 1060, "评分只对用户负责", F32, (*GOLD, int(255 * conclusion)))
    return frame


def scene_four(local_t: float) -> Image.Image:
    base = Image.new("RGBA", (WIDTH, HEIGHT), BLACK + (255,))
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    radius = 180 + int(ease(local_t / 1.8) * 170)
    glow_draw.ellipse((WIDTH // 2 - radius, 480 - radius, WIDTH // 2 + radius, 480 + radius), fill=(221, 174, 86, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(100))
    frame = Image.alpha_composite(base, glow)
    draw = ImageDraw.Draw(frame)
    enter = ease_out_back(local_t / 0.68)
    offset = int((1 - enter) * 55)
    draw_logo(draw, 140, 250 - offset, compact=False)
    scale_text(frame, (WIDTH // 2, 580), "真实，才有用", F68, WHITE, 1.2 - enter * 0.2, int(255 * enter))
    message = ease((local_t - 0.42) / 0.52)
    center_text(draw, 680, "体验官实测 · 独立评分", F24, (*GOLD, int(255 * message)))
    bar_width = int(470 * ease((local_t - 0.72) / 0.48))
    draw.line((WIDTH // 2 - bar_width // 2, 770, WIDTH // 2 + bar_width // 2, 770), fill=GOLD, width=3)
    brand = ease_out_back((local_t - 0.92) / 0.52)
    scale_text(frame, (WIDTH // 2, 875), "练哪儿", F46, WHITE, 1.10 - brand * 0.10, int(255 * brand))
    return frame


SCENES = [
    (0.0, 2.15, scene_one),
    (2.15, 5.60, scene_two),
    (5.60, 8.65, scene_three),
    (8.65, 10.8, scene_four),
]


def timeline_frame(t: float) -> Image.Image:
    active: list[tuple[float, Image.Image]] = []
    for start, end, renderer in SCENES:
        if start <= t <= end:
            local = t - start
            weight = 1.0
            fade = 0.4
            if t < start + fade:
                weight = clamp((t - start) / fade)
            if t > end - fade:
                weight = min(weight, clamp((end - t) / fade))
            active.append((weight, renderer(local)))
    if not active:
        return Image.new("RGB", (WIDTH, HEIGHT), BLACK)
    if len(active) == 1:
        frame = active[0][1]
    else:
        first_weight, first = active[0]
        second_weight, second = active[1]
        blend = second_weight / max(0.001, first_weight + second_weight)
        frame = Image.blend(first, second, clamp(blend))
    draw = ImageDraw.Draw(frame)
    draw_progress(draw, t)
    return frame.convert("RGB")


def build_contact_sheet(paths: list[Path]) -> None:
    thumbs = []
    for path in paths:
        image = Image.open(path).convert("RGB")
        image.thumbnail((270, 480), Image.Resampling.LANCZOS)
        thumbs.append(image.copy())
    sheet = Image.new("RGB", (600, 1020), (18, 18, 19))
    positions = [(20, 20), (310, 20), (20, 520), (310, 520)]
    for image, position in zip(thumbs, positions):
        sheet.paste(image, position)
    sheet.save(PREVIEW / "练哪儿视频关键帧总览.png", quality=95)


def render_video() -> None:
    PREVIEW.mkdir(parents=True, exist_ok=True)
    try:
        import imageio_ffmpeg
    except ImportError as exc:
        raise SystemExit(
            "imageio-ffmpeg is required. Add /private/tmp/gym_video_deps to PYTHONPATH."
        ) from exc

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUTPUT),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert process.stdin is not None

    key_times = [1.05, 3.85, 7.0, 9.65]
    key_paths: list[Path] = []
    saved: set[int] = set()
    total_frames = int(DURATION * FPS)
    for index in range(total_frames):
        t = index / FPS
        frame = timeline_frame(t)
        process.stdin.write(frame.tobytes())
        for key_index, key_time in enumerate(key_times):
            if key_index not in saved and t >= key_time:
                path = PREVIEW / f"关键帧_{key_index + 1}.png"
                frame.save(path, quality=95)
                key_paths.append(path)
                saved.add(key_index)
    process.stdin.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    code = process.wait()
    if code != 0:
        print(stderr, file=sys.stderr)
        raise SystemExit(f"ffmpeg failed with code {code}")
    build_contact_sheet(key_paths)
    print(OUTPUT)


IMAGES = {
    "dark": Image.open(ASSETS / "gym-dark.jpg"),
    "light": Image.open(ASSETS / "gym-light.jpg"),
    "training": Image.open(ASSETS / "gym-training.jpg"),
}


if __name__ == "__main__":
    render_video()
