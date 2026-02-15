#!/usr/bin/env python3
"""Generate synthesized placeholder audio assets for Cocopilot Island Mode."""

import math
import os
import random
import struct
import subprocess
import wave

SAMPLE_RATE = 44100
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_wav(filename: str, samples: list[float], sample_rate: int = SAMPLE_RATE):
    """Write mono float samples [-1,1] to a WAV file."""
    path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for s in samples:
            s = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack("<h", int(s * 32767)))
    return path


def convert_to_mp3(wav_path: str):
    """Convert WAV to MP3 using ffmpeg, then remove WAV."""
    mp3_path = wav_path.replace(".wav", ".mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-b:a", "128k", "-q:a", "2", mp3_path],
        capture_output=True,
    )
    os.remove(wav_path)
    return mp3_path


def envelope(t: float, attack: float, decay: float, duration: float) -> float:
    """Simple attack-decay envelope."""
    if t < attack:
        return t / attack
    elif t > duration - decay:
        return max(0, (duration - t) / decay)
    return 1.0


def noise() -> float:
    return random.uniform(-1, 1)


# --- Sound generators ---

def gen_ambient_ocean():
    """Underwater ambient loop: deep rumble, bubbles, shimmer, ~16s."""
    duration = 16.0
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n
    random.seed(99)

    # Deep ocean rumble: low-frequency filtered noise
    for i in range(n):
        t = i / SAMPLE_RATE
        rumble_env = 0.2 + 0.1 * math.sin(2 * math.pi * t / 8.0)
        samples[i] += noise() * rumble_env * 0.1

    # Low-pass filter (running average with wide window)
    filtered = [0.0] * n
    window = 40
    running = 0.0
    for i in range(n):
        running += samples[i]
        if i >= window:
            running -= samples[i - window]
        filtered[i] = running / min(i + 1, window)
    samples = filtered

    # Bubble clusters: short rising tones at random intervals
    bubble_times = sorted([random.uniform(0.5, 15) for _ in range(20)])
    for bt in bubble_times:
        bub_dur = random.uniform(0.03, 0.1)
        freq_start = random.uniform(200, 500)
        freq_end = freq_start * random.uniform(1.3, 1.8)
        vol = random.uniform(0.03, 0.08)
        si = int(bt * SAMPLE_RATE)
        ei = min(si + int(bub_dur * SAMPLE_RATE), n)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            frac = lt / bub_dur
            freq = freq_start + (freq_end - freq_start) * frac
            env = math.sin(math.pi * frac)
            samples[i] += math.sin(2 * math.pi * freq * lt) * env * vol

    # Gentle water movement: low-frequency swells
    for i in range(n):
        t = i / SAMPLE_RATE
        # Slow deep swells instead of high-pitched shimmer
        swell = math.sin(2 * math.pi * 80 * t) * 0.015
        swell *= 0.5 + 0.5 * math.sin(2 * math.pi * t / 5.0)
        samples[i] += swell

    # Fade in/out for looping
    fade = int(SAMPLE_RATE * 1.5)
    for i in range(fade):
        f = i / fade
        samples[i] *= f
        samples[n - 1 - i] *= f

    return samples, duration


def gen_bubble():
    """Single rising bubble pop, ~0.2s."""
    duration = 0.2
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    for i in range(n):
        t = i / SAMPLE_RATE
        frac = t / duration
        freq = 400 + 800 * frac  # rising pitch
        env = math.sin(math.pi * frac) ** 0.5
        val = math.sin(2 * math.pi * freq * t) * env * 0.4
        # Add pop at the end
        if frac > 0.8:
            pop_frac = (frac - 0.8) / 0.2
            val += noise() * (1 - pop_frac) * 0.3
        samples[i] = val

    return samples, duration


def gen_dolphin_call():
    """Dolphin whistle/chirp: frequency sweep with harmonics, ~0.8s."""
    duration = 0.8
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Main whistle: ascending then descending frequency sweep
    for i in range(n):
        t = i / SAMPLE_RATE
        frac = t / duration
        # Bell-curve frequency sweep
        freq = 2000 + 3000 * math.sin(math.pi * frac)
        env = math.sin(math.pi * frac) ** 0.7 * 0.35
        val = math.sin(2 * math.pi * freq * t) * env
        # Add vibrato
        val += math.sin(2 * math.pi * (freq * 1.01) * t) * env * 0.2
        samples[i] = val

    return samples, duration


def gen_ambient_island():
    """Tropical ambient loop: layered noise (waves) + bird chirps, ~30s."""
    duration = 30.0
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n
    random.seed(42)

    # Ocean waves: slow amplitude-modulated filtered noise
    for i in range(n):
        t = i / SAMPLE_RATE
        # Slow wave envelope (~6 second cycle)
        wave_env = 0.3 + 0.2 * math.sin(2 * math.pi * t / 6.0)
        # Simple low-pass approximation: average nearby noise
        raw = noise() * wave_env * 0.15
        samples[i] += raw

    # Simple low-pass filter (running average)
    filtered = [0.0] * n
    window = 20
    running = 0.0
    for i in range(n):
        running += samples[i]
        if i >= window:
            running -= samples[i - window]
        filtered[i] = running / min(i + 1, window)
    samples = filtered

    # Bird chirps: short sine sweeps at random intervals
    chirp_times = sorted([random.uniform(1, 29) for _ in range(25)])
    for ct in chirp_times:
        chirp_dur = random.uniform(0.05, 0.15)
        freq_start = random.uniform(2000, 4000)
        freq_end = random.uniform(3000, 6000)
        vol = random.uniform(0.05, 0.12)
        start_i = int(ct * SAMPLE_RATE)
        end_i = min(start_i + int(chirp_dur * SAMPLE_RATE), n)
        for i in range(start_i, end_i):
            lt = (i - start_i) / SAMPLE_RATE
            frac = lt / chirp_dur
            freq = freq_start + (freq_end - freq_start) * frac
            env = math.sin(math.pi * frac)  # bell envelope
            samples[i] += math.sin(2 * math.pi * freq * lt) * env * vol

    # Gentle breeze: very low freq modulated noise
    for i in range(n):
        t = i / SAMPLE_RATE
        breeze = noise() * 0.03 * (0.5 + 0.5 * math.sin(2 * math.pi * t / 10))
        samples[i] += breeze

    # Fade in/out for looping
    fade = int(SAMPLE_RATE * 2)
    for i in range(fade):
        f = i / fade
        samples[i] *= f
        samples[n - 1 - i] *= f

    return samples, duration


def gen_monkey_call():
    """Excited monkey vocalization: frequency-modulated bursts, ~1.5s."""
    duration = 1.5
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Series of 4-5 short "oo-oo-ah" calls
    calls = [(0.0, 0.2, 800, 600), (0.25, 0.2, 900, 700),
             (0.55, 0.15, 1000, 800), (0.75, 0.15, 1100, 850),
             (1.0, 0.35, 1200, 500)]

    for start, dur, f1, f2 in calls:
        si = int(start * SAMPLE_RATE)
        ei = min(si + int(dur * SAMPLE_RATE), n)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            frac = lt / dur
            freq = f1 + (f2 - f1) * frac
            # Add vibrato
            freq += 30 * math.sin(2 * math.pi * 25 * lt)
            env = math.sin(math.pi * frac) ** 0.5
            val = math.sin(2 * math.pi * freq * lt) * env * 0.4
            # Add harmonics for richness
            val += math.sin(2 * math.pi * freq * 2 * lt) * env * 0.15
            val += math.sin(2 * math.pi * freq * 3 * lt) * env * 0.08
            samples[i] += val

    return samples, duration


def gen_chime():
    """Soft notification chime: bell-like tone with harmonics, ~1s."""
    duration = 1.2
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Bell: fundamental + inharmonic partials with different decay rates
    partials = [
        (880, 0.4, 2.0),    # fundamental
        (1760, 0.2, 3.0),   # 2nd harmonic
        (2640, 0.1, 4.0),   # 3rd harmonic
        (3520, 0.05, 5.0),  # 4th
        (1320, 0.15, 2.5),  # inharmonic
    ]

    for freq, amp, decay in partials:
        for i in range(n):
            t = i / SAMPLE_RATE
            env = math.exp(-decay * t)
            samples[i] += math.sin(2 * math.pi * freq * t) * env * amp

    return samples, duration


def gen_typewriter():
    """Typewriter key clicks: short noise bursts, ~1.5s."""
    duration = 1.5
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n
    random.seed(123)

    # Generate 8-10 key clicks at varying intervals
    click_times = [0.0]
    t = 0.0
    for _ in range(9):
        t += random.uniform(0.1, 0.18)
        if t < duration - 0.05:
            click_times.append(t)

    for ct in click_times:
        click_dur = random.uniform(0.008, 0.015)
        si = int(ct * SAMPLE_RATE)
        ei = min(si + int(click_dur * SAMPLE_RATE), n)
        vol = random.uniform(0.3, 0.5)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            frac = lt / click_dur
            env = (1 - frac) ** 2  # fast decay
            samples[i] += noise() * env * vol
            # Add a tiny resonance
            samples[i] += math.sin(2 * math.pi * 3500 * lt) * env * vol * 0.3

    return samples, duration


def gen_coconut_crack():
    """Coconut impact: sharp transient + resonant body, ~0.8s."""
    duration = 0.8
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n
    random.seed(77)

    for i in range(n):
        t = i / SAMPLE_RATE
        # Initial sharp crack (noise burst)
        if t < 0.01:
            crack = noise() * (1 - t / 0.01) * 0.7
        else:
            crack = 0
        # Hollow resonance
        res_env = math.exp(-8 * t)
        resonance = (
            math.sin(2 * math.pi * 350 * t) * 0.3 +
            math.sin(2 * math.pi * 700 * t) * 0.15 +
            math.sin(2 * math.pi * 1100 * t) * 0.08
        ) * res_env
        # Secondary smaller crack
        if 0.05 < t < 0.065:
            crack += noise() * 0.2 * (1 - (t - 0.05) / 0.015)

        samples[i] = crack + resonance

    return samples, duration


def gen_error():
    """Error sound: two descending tones, ~0.6s."""
    duration = 0.6
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Two descending buzzy tones
    tones = [(0.0, 0.25, 520, 480), (0.3, 0.25, 480, 380)]

    for start, dur, f1, f2 in tones:
        si = int(start * SAMPLE_RATE)
        ei = min(si + int(dur * SAMPLE_RATE), n)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            frac = lt / dur
            freq = f1 + (f2 - f1) * frac
            env = envelope(lt, 0.01, 0.05, dur)
            # Square-ish wave for urgency
            val = math.sin(2 * math.pi * freq * lt)
            val = max(-1, min(1, val * 3)) * 0.3  # soft clip
            samples[i] += val * env

    return samples, duration


def gen_success():
    """Success sound: ascending tone pair, ~0.8s."""
    duration = 0.8
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Two ascending chime tones (major third interval)
    tones = [(0.0, 0.5, 523.25), (0.2, 0.6, 659.25)]  # C5, E5

    for start, dur, freq in tones:
        si = int(start * SAMPLE_RATE)
        ei = min(si + int(dur * SAMPLE_RATE), n)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            env = math.exp(-3.0 * lt) * envelope(lt, 0.005, 0.01, dur)
            val = math.sin(2 * math.pi * freq * lt) * env * 0.35
            val += math.sin(2 * math.pi * freq * 2 * lt) * env * 0.1
            samples[i] += val

    return samples, duration


def gen_goodbye():
    """Goodbye melody: gentle descending arpeggio, ~2.5s."""
    duration = 2.5
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n

    # Descending notes: E5 -> C5 -> A4 -> F4 (gentle resolution)
    notes = [
        (0.0, 0.8, 659.25),   # E5
        (0.5, 0.8, 523.25),   # C5
        (1.0, 0.8, 440.00),   # A4
        (1.5, 1.0, 349.23),   # F4
    ]

    for start, dur, freq in notes:
        si = int(start * SAMPLE_RATE)
        ei = min(si + int(dur * SAMPLE_RATE), n)
        for i in range(si, ei):
            lt = (i - si) / SAMPLE_RATE
            env = math.exp(-2.0 * lt) * envelope(lt, 0.02, 0.1, dur)
            val = math.sin(2 * math.pi * freq * lt) * env * 0.3
            # Soft harmonics
            val += math.sin(2 * math.pi * freq * 2 * lt) * env * 0.08
            val += math.sin(2 * math.pi * freq * 3 * lt) * env * 0.03
            samples[i] += val

    # Fade out
    fade = int(SAMPLE_RATE * 0.5)
    for i in range(fade):
        samples[n - 1 - i] *= i / fade

    return samples, duration


def main():
    sounds = {
        "ambient-island": gen_ambient_island,
        "ambient-ocean": gen_ambient_ocean,
        "monkey-call": gen_monkey_call,
        "dolphin-call": gen_dolphin_call,
        "bubble": gen_bubble,
        "chime": gen_chime,
        "typewriter": gen_typewriter,
        "coconut-crack": gen_coconut_crack,
        "error": gen_error,
        "success": gen_success,
        "goodbye": gen_goodbye,
    }

    for name, generator in sounds.items():
        print(f"Generating {name}...")
        samples, duration = generator()
        wav_path = write_wav(f"{name}.wav", samples)
        mp3_path = convert_to_mp3(wav_path)
        print(f"  -> {mp3_path} ({duration:.1f}s)")

    print("\nDone! All audio files generated.")


if __name__ == "__main__":
    main()
