# Cocopilot Sounds

## Overview

All sounds in Cocopilot are procedurally generated using pure Python — no external audio libraries needed. Each sound is built from basic synthesis primitives: sine waves, noise, envelopes, and frequency sweeps.

## Sound Inventory

| Sound          | Duration | Used For                                      |
| -------------- | -------- | --------------------------------------------- |
| ambient-island | 30s loop | Island mode background (waves + bird chirps)  |
| ambient-ocean  | 16s loop | Ocean mode background (deep rumble + bubbles) |
| monkey-call    | 1.5s     | Session start (Island mode)                   |
| dolphin-call   | 0.8s     | Session start (Ocean mode)                    |
| bubble         | 0.2s     | Bubble effect sounds                          |
| chime          | 1.2s     | User message / notification                   |
| typewriter     | 1.5s     | Edit/create tool execution                    |
| coconut-crack  | 0.8s     | Bash tool execution                           |
| error          | 0.6s     | Tool execution failure                        |
| success        | 0.8s     | Tool execution success / turn end             |
| goodbye        | 2.5s     | Session shutdown                              |

## Synthesis Techniques

### Sine Waves
Pure tones at specific frequencies. Used for chimes, dolphin calls, and error tones.

### Filtered Noise
Random noise smoothed with a running-average low-pass filter. Creates ocean wave textures and wind sounds.

### Frequency Sweeps
Changing pitch over time. Bubbles sweep upward (400→1200 Hz), monkey calls sweep down.

### Envelopes
Attack-decay-release shapes control amplitude. Bell sounds use exponential decay, clicks use sharp transients.

### Harmonics
Multiple sine waves at integer multiples of the fundamental frequency add richness. Chimes use partials at 880, 1760, 2640, 3520 Hz.

## Generation

Regenerate all sounds:
```bash
cd resources/audio
python3 generate_sounds.py
```

## Visualizations

Generate spectrograms and waveforms:

```bash
cd resources/audio
python3 visualize_sounds.py
open visualizations/index.html
```

The `visualizations/` directory contains SVG spectrograms and waveforms for each sound.
Each spectrogram shows frequency (0–8 kHz) over time. Brighter colors = louder frequencies.

The HTML index page (`visualizations/index.html`) provides an interactive view of all sound visualizations.
