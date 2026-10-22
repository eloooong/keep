"""Generate an original understated electronic score. Requires numpy."""
from pathlib import Path
import wave
import numpy as np

RATE = 48000
DURATION = 18
rng = np.random.default_rng(42)
score = np.zeros((RATE * DURATION, 2), dtype=np.float64)


def add(signal, start, gain=1, pan=0):
    begin = round(start * RATE)
    end = min(len(score), begin + len(signal))
    if begin >= end:
        return
    signal = signal[:end-begin] * gain
    score[begin:end, 0] += signal * np.sqrt((1-pan)/2)
    score[begin:end, 1] += signal * np.sqrt((1+pan)/2)


def tone(freq, duration, decay=4):
    t = np.arange(round(duration * RATE)) / RATE
    env = np.minimum(t / .018, 1) * np.exp(-t * decay)
    env *= np.minimum((duration-t) / .08, 1)
    return (np.sin(2*np.pi*freq*t) + .21*np.sin(2*np.pi*freq*2*t)) * env


# Dmaj7 / Bm7 / Gmaj7 / Asus2. A soft, wide pad underneath the product rhythm.
chords = [[146.83, 220, 277.18, 369.99], [123.47, 185, 220, 293.66],
          [98, 146.83, 185, 246.94], [110, 164.81, 220, 293.66]]
for bar in range(8):
    start = bar * 4
    dur = min(4.5, DURATION-start)
    if dur <= 0:
        break
    t = np.arange(round(dur*RATE)) / RATE
    env = np.minimum(t/.8, 1) * np.minimum((dur-t)/1.1, 1)
    for j, f in enumerate(chords[bar % 4]):
        pad = (np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*(f+.7)*t)) * env
        add(pad, start, .024, (j-1.5)/2)

for beat in range(32):
    start = beat * .5
    # Rounded kick, gentle offbeat tick, sparse marimba-like motif.
    t = np.arange(round(.28*RATE)) / RATE
    kick = np.sin(2*np.pi*(49*t+2.5*(1-np.exp(-t*24)))) * np.exp(-t*20)
    add(kick, start, .15 if beat % 4 == 0 else .095)
    t = np.arange(round(.07*RATE)) / RATE
    noise = rng.normal(0, 1, len(t))
    tick = np.diff(noise, prepend=0) * np.exp(-t*90) * np.minimum(t/.004, 1)
    add(tick, start+.25, .014, .3 if beat % 2 else -.3)
    if beat % 2 == 0:
        chord = chords[(beat//8) % 4]
        add(tone(chord[(beat//2) % 4]*4, .9, 5), start+.25, .041, -.3 if beat % 4 else .3)

# Scene-change accents, then a resolved brand chord.
for start in [0, 1.9, 5, 7.6, 10.3, 12.9, 15.4]:
    t = np.arange(round(.5*RATE))/RATE
    noise = rng.normal(0, 1, len(t))
    filtered = np.convolve(noise, np.ones(24)/24, mode='same')
    whoosh = filtered * np.sin(np.pi*t/.5)**2
    add(whoosh, max(0, start-.23), .065, -.2)
    add(tone(880, .6, 8), start+.05, .025, .2)
for j, f in enumerate([293.66, 440, 554.37, 739.99]):
    add(tone(f, 5, .65), 15.6+j*.06, .046, (j-1.5)/2)

t = np.arange(len(score))/RATE
score *= (np.minimum(t/.12, 1) * np.minimum((DURATION-t)/1.7, 1))[:, None]
score = np.tanh(score*1.7)
peak = np.max(np.abs(score))
score *= .75 / max(peak, .75)
output = Path('public/showcase/assets/soundtrack.wav')
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes((score*32767).astype('<i2').tobytes())
print(f'Original score: {output} — {DURATION}s stereo / {RATE}Hz')
