# ============================================================
# generate_landing_voice.py
#
# SAVE HERE:
# D:\allabouttalkora\live_talkora\talkora1\talkora\
# ai-service\generate_landing_voice.py
#
# RUN:
# (.venv) python generate_landing_voice.py
#
# This DOES NOT reinstall anything.
# It uses your EXISTING Priya / Indic Parler service.
#
# I listened to the current miss-julie-welcome.wav.
# This version deliberately makes the line:
# - shorter
# - quicker
# - sweeter
# - more joyful
# - more Indian-English
# - more child-friendly
# ============================================================

import asyncio
import shutil
from pathlib import Path

import app.tts.parler_service as parler_module

from app.tts.cache import (
    audio_path,
    cache_key,
)

from app.tts.text_cleaner import (
    clean_tts_text,
)

from app.tts.voice_profiles import (
    PRIYA_STYLE_VERSION,
)

from app.config import settings


# ============================================================
# MUCH SHORTER LANDING WELCOME
#
# DON'T make the landing intro 20+ seconds.
# Kid should understand the page immediately.
# ============================================================

WELCOME_TEXT = (
    "Hi! I'm Miss Julie. Welcome to Talkora! "
    "Ready to speak English, play, and have fun? "
    "Come on, let's go!"
)


# ============================================================
# LANDING-SPECIFIC PRIYA PERFORMANCE
#
# Your normal Talkora lessons can keep their existing
# PRIYA_STYLE.
#
# This override exists ONLY while this little offline
# generation script is running.
# ============================================================

LANDING_PRIYA_STYLE = """
Priya speaks in a sweet, warm, youthful Indian English voice.

She sounds like a cheerful and caring Indian school teacher
welcoming children into a fun learning adventure.
Her Indian English accent is clear, natural and immediately
recognisable, but soft and polished.

She sounds genuinely happy and smiling while she speaks.

The delivery is lively, playful, friendly and energetic.

Speak at a brisk natural conversational pace.
Do not speak slowly.

Keep pauses short.

The opening "Hi!" should feel bright and exciting.

"Welcome to Talkora!" should sound happy and proud.

The question should feel playful and inviting.

"Come on, let's go!" should be quick, joyful and enthusiastic.

Her voice is sweet and child-friendly rather than mature,
formal, dramatic or narrator-like.

Use expressive natural intonation.

Pronunciation is very clear for children.

Avoid:
slow narration,
long pauses,
robotic rhythm,
deep voice,
serious tone,
American accent,
British narration,
customer-service tone,
overacting,
breathy whispering.

The recording is close, clean, warm and studio quality.
""".strip()


async def main():
    print()
    print("=" * 60)
    print(" TALKORA — MISS JULIE LANDING VOICE")
    print("=" * 60)
    print()

    # --------------------------------------------------------
    # Override the style imported inside parler_service.py.
    #
    # _generate_sync() uses parler_module.PRIYA_STYLE,
    # so this affects ONLY this script/process.
    # --------------------------------------------------------

    parler_module.PRIYA_STYLE = (
        LANDING_PRIYA_STYLE
    )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Your cache key currently uses PRIYA_STYLE_VERSION.
    # Because we're intentionally changing the performance
    # direction, delete the old cached version of THIS line
    # so Priya actually creates a fresh WAV.
    # --------------------------------------------------------

    normalized = clean_tts_text(
        WELCOME_TEXT
    )

    key = cache_key(
        normalized,
        settings.tts_voice,
        settings.tts_language,
        PRIYA_STYLE_VERSION,
        settings.tts_model,
    )

    cached_path = audio_path(
        key,
        settings.tts_voice,
        settings.tts_language,
    )

    if cached_path.exists():
        print(
            "Removing previous cached landing voice:"
        )

        print(
            cached_path
        )

        cached_path.unlink(
            missing_ok=True
        )

    print()
    print("Generating:")
    print(WELCOME_TEXT)
    print()

    # --------------------------------------------------------
    # EXISTING TALKORA PRIYA SERVICE
    # --------------------------------------------------------

    result = (
        await parler_module
        .parler_service
        .synthesize(
            WELCOME_TEXT
        )
    )

    print()
    print("Priya generation complete.")
    print(
        "Cached:",
        result.cached,
    )

    print(
        "Latency:",
        result.latency_ms,
        "ms",
    )

    print(
        "Duration:",
        round(
            result.duration_seconds,
            2,
        ),
        "seconds",
    )

    print(
        "Generated file:",
        result.path,
    )

    # --------------------------------------------------------
    # COPY DIRECTLY INTO NEXT.JS PUBLIC
    #
    # ai-service/
    # backend/
    # client/
    #
    # generate_landing_voice.py sits inside ai-service,
    # so .parent.parent gives us the Talkora root.
    # --------------------------------------------------------

    talkora_root = (
        Path(__file__)
        .resolve()
        .parent
        .parent
    )

    destination = (
        talkora_root
        / "client"
        / "public"
        / "assets"
        / "audio"
        / "miss-julie-welcome.wav"
    )

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copy2(
        result.path,
        destination,
    )

    print()
    print("=" * 60)
    print(" DONE")
    print("=" * 60)

    print()
    print(
        "Landing WAV:"
    )

    print(
        destination
    )

    print()
    print(
        "Browser URL:"
    )

    print(
        "http://localhost:3000/"
        "assets/audio/"
        "miss-julie-welcome.wav"
    )

    print()


if __name__ == "__main__":
    asyncio.run(
        main()
    )