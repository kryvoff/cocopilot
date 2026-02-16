#!/usr/bin/env python3
"""Generate spectrograms and waveform visualizations for all Cocopilot sounds."""

import os
import struct
import wave
import math
import json

SAMPLE_RATE = 44100
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "visualizations")


def read_wav_samples(filename):
    """Read WAV file and return float samples [-1, 1]."""
    path = os.path.join(SCRIPT_DIR, filename)
    if not os.path.exists(path):
        return None, 0
    with wave.open(path, "r") as wf:
        n = wf.getnframes()
        data = wf.readframes(n)
        samples = []
        for i in range(n):
            val = struct.unpack_from("<h", data, i * 2)[0]
            samples.append(val / 32767.0)
        return samples, wf.getframerate()


def compute_spectrogram(samples, sample_rate, window_size=1024, hop=512):
    """Compute FFT-based spectrogram using numpy. Returns 2D array of magnitudes."""
    import numpy as np
    arr = np.array(samples)
    n = len(arr)
    num_windows = max(1, (n - window_size) // hop)
    freq_bins = window_size // 2
    hann = np.hanning(window_size)
    spectrogram = []
    
    for w in range(num_windows):
        start = w * hop
        windowed = arr[start:start + window_size] * hann
        fft = np.fft.rfft(windowed)
        magnitudes = (np.abs(fft[:freq_bins]) / window_size).tolist()
        spectrogram.append(magnitudes)
    
    return spectrogram, freq_bins, sample_rate / 2


def spectrogram_to_svg(spectrogram, max_freq, duration, title, width=800, height=300):
    """Convert spectrogram data to an SVG heatmap."""
    if not spectrogram:
        return f'<svg width="{width}" height="{height}"><text x="50%" y="50%" text-anchor="middle" fill="#aaa">No data</text></svg>'
    
    num_time = len(spectrogram)
    num_freq = len(spectrogram[0]) if spectrogram else 0
    
    # Only show up to 8kHz
    max_bin = min(num_freq, int(8000 / max_freq * num_freq))
    
    cell_w = width / num_time
    cell_h = height / max_bin
    
    # Find max magnitude for normalization (use log scale for better visibility)
    max_mag = max(max(row[:max_bin]) for row in spectrogram) if spectrogram else 1
    if max_mag == 0:
        max_mag = 1
    
    rects = []
    for t in range(num_time):
        for f in range(max_bin):
            raw = spectrogram[t][f] / max_mag
            if raw < 0.005:
                continue
            # Aggressive gamma correction for visibility
            mag = min(1.0, raw ** 0.3)
            # Viridis-inspired color ramp: dark purple → teal → green → yellow
            if mag < 0.33:
                t2 = mag / 0.33
                r = int(68 + t2 * (33 - 68))
                g = int(1 + t2 * (145 - 1))
                b = int(84 + t2 * (140 - 84))
            elif mag < 0.66:
                t2 = (mag - 0.33) / 0.33
                r = int(33 + t2 * (94 - 33))
                g = int(145 + t2 * (201 - 145))
                b = int(140 + t2 * (98 - 140))
            else:
                t2 = (mag - 0.66) / 0.34
                r = int(94 + t2 * (253 - 94))
                g = int(201 + t2 * (231 - 201))
                b = int(98 + t2 * (37 - 98))
            x = t * cell_w
            y = height - (f + 1) * cell_h
            rects.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell_w + 0.5:.1f}" height="{cell_h + 0.5:.1f}" fill="rgb({r},{g},{b})"/>')
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height + 60}" viewBox="0 0 {width} {height + 60}">
  <rect width="{width}" height="{height + 60}" fill="#0f0f1a"/>
  <text x="{width / 2}" y="20" text-anchor="middle" fill="#e0e0e0" font-size="14" font-family="sans-serif">{title}</text>
  <g transform="translate(0, 30)">
    {''.join(rects)}
    <!-- Axes -->
    <text x="5" y="{height + 15}" fill="#888" font-size="10">0s</text>
    <text x="{width - 30}" y="{height + 15}" fill="#888" font-size="10">{duration:.1f}s</text>
    <text x="5" y="12" fill="#888" font-size="10">8kHz</text>
    <text x="5" y="{height - 2}" fill="#888" font-size="10">0Hz</text>
  </g>
</svg>'''
    return svg


def waveform_to_svg(samples, duration, title, width=800, height=120):
    """Create SVG waveform visualization."""
    if not samples:
        return ''
    
    # Downsample for visualization
    step = max(1, len(samples) // width)
    points = []
    mid = height // 2
    
    for i in range(0, min(len(samples), width * step), step):
        x = (i / len(samples)) * width
        # Get min/max in this window
        window = samples[i:i + step]
        y_min = mid - min(window) * mid * 0.9
        y_max = mid - max(window) * mid * 0.9
        points.append(f'{x:.1f},{y_max:.1f}')
    
    # Reverse path for the bottom half
    for i in range(min(len(samples), width * step) - step, -1, -step):
        x = (i / len(samples)) * width
        window = samples[i:i + step]
        y = mid - min(window) * mid * 0.9
        points.append(f'{x:.1f},{y:.1f}')
    
    path = ' '.join(points)
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height + 40}" viewBox="0 0 {width} {height + 40}">
  <rect width="{width}" height="{height + 40}" fill="#0f0f1a"/>
  <text x="{width / 2}" y="16" text-anchor="middle" fill="#e0e0e0" font-size="12" font-family="sans-serif">{title} — Waveform</text>
  <g transform="translate(0, 25)">
    <line x1="0" y1="{mid}" x2="{width}" y2="{mid}" stroke="#333" stroke-width="0.5"/>
    <polygon points="{path}" fill="#4ecca3" opacity="0.6"/>
  </g>
</svg>'''


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # First generate WAV files temporarily for analysis
    print("Generating temporary WAV files for analysis...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("gen", os.path.join(SCRIPT_DIR, "generate_sounds.py"))
    gen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gen)
    
    sounds = {
        "ambient-island": gen.gen_ambient_island,
        "ambient-ocean": gen.gen_ambient_ocean,
        "monkey-call": gen.gen_monkey_call,
        "dolphin-call": gen.gen_dolphin_call,
        "bubble": gen.gen_bubble,
        "chime": gen.gen_chime,
        "typewriter": gen.gen_typewriter,
        "coconut-crack": gen.gen_coconut_crack,
        "error": gen.gen_error,
        "success": gen.gen_success,
        "goodbye": gen.gen_goodbye,
    }
    
    all_svgs = []
    
    for name, generator in sounds.items():
        print(f"Analyzing {name}...")
        samples, duration = generator()
        
        # Generate spectrogram
        spec_data, freq_bins, max_freq = compute_spectrogram(
            samples, SAMPLE_RATE,
            window_size=512 if duration < 2 else 1024,
            hop=256 if duration < 2 else 512
        )
        
        svg_spec = spectrogram_to_svg(spec_data, max_freq, duration, f"{name} — Spectrogram")
        svg_wave = waveform_to_svg(samples, duration, name)
        
        # Save individual SVGs
        with open(os.path.join(OUTPUT_DIR, f"{name}-spectrogram.svg"), "w") as f:
            f.write(svg_spec)
        with open(os.path.join(OUTPUT_DIR, f"{name}-waveform.svg"), "w") as f:
            f.write(svg_wave)
        
        all_svgs.append((name, duration, svg_spec, svg_wave))
    
    # Generate combined HTML page
    html_parts = ['''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cocopilot Sound Visualizations</title>
<style>
  body { background: #0f0f1a; color: #e0e0e0; font-family: -apple-system, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
  h1 { color: #4ecca3; }
  h2 { color: #5b9bd5; border-bottom: 1px solid #2a2a4a; padding-bottom: 8px; margin-top: 40px; }
  .sound-card { background: #16213e; border: 1px solid #2a2a4a; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .sound-card h3 { color: #e0e0e0; margin: 0 0 4px 0; }
  .duration { color: #a0a0a0; font-size: 13px; }
  svg { max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; }
  p { color: #a0a0a0; line-height: 1.6; }
  code { color: #4ecca3; background: #1a1a2e; padding: 2px 6px; border-radius: 3px; }
</style>
</head>
<body>
<h1>🔊 Cocopilot Sound Visualizations</h1>
<p>All sounds are procedurally generated using pure Python (sine waves, noise, envelopes). 
No external audio libraries required — just math and the standard library's <code>wave</code> module.</p>

<h2>How the sounds are made</h2>
<p>Each sound is built from basic building blocks:</p>
<ul style="color: #a0a0a0; line-height: 2;">
  <li><strong>Sine waves</strong> — pure tones at specific frequencies</li>
  <li><strong>Noise</strong> — random values for percussive/textural sounds</li>
  <li><strong>Envelopes</strong> — attack-decay shapes that control volume over time</li>
  <li><strong>Frequency sweeps</strong> — changing pitch over time (bubbles, chirps)</li>
  <li><strong>Harmonics</strong> — multiple sine waves at integer multiples of base frequency</li>
  <li><strong>Filtering</strong> — running averages to smooth noise into rumble/waves</li>
</ul>

<h2>Ambient Sounds</h2>
''']
    
    ambient_names = ["ambient-island", "ambient-ocean"]
    effect_names = [n for n, _, _, _ in all_svgs if n not in ambient_names]
    
    for name, duration, svg_spec, svg_wave in all_svgs:
        if name in ambient_names:
            html_parts.append(f'''<div class="sound-card">
  <h3>🎵 {name}</h3>
  <span class="duration">{duration:.1f}s loop</span>
  {svg_wave}
  {svg_spec}
</div>''')
    
    html_parts.append('<h2>Effect Sounds</h2>')
    
    for name, duration, svg_spec, svg_wave in all_svgs:
        if name not in ambient_names:
            html_parts.append(f'''<div class="sound-card">
  <h3>🔔 {name}</h3>
  <span class="duration">{duration:.1f}s</span>
  {svg_wave}
  {svg_spec}
</div>''')
    
    html_parts.append('</body></html>')
    
    html_path = os.path.join(OUTPUT_DIR, "index.html")
    with open(html_path, "w") as f:
        f.write('\n'.join(html_parts))
    
    print(f"\nVisualizations saved to {OUTPUT_DIR}/")
    print(f"Open {html_path} in a browser to view.")


if __name__ == "__main__":
    main()
