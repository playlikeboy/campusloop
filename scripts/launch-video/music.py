#!/usr/bin/env python3
"""Original 120 bpm score + SFX for the CampusLoop launch film (numpy only).

usage: python3 music.py film.json out.wav
film.json comes from `node render.mjs --dump` and holds the SFX cue list and duration.
Everything is synthesised here: additive pads and plucks, sine bass, synthetic drums,
noise risers and whooshes. Loudness is set later with ffmpeg loudnorm (-14 LUFS).
"""
import json
import sys
import wave

import numpy as np

SR = 48000
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.RandomState(7)

film = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
DUR = float(film['duration']) + 0.5
N = int(DUR * SR)
dry = np.zeros((2, N))
wet = np.zeros((2, N))  # reverb send
kbus = np.zeros((2, N))  # kicks, added after the sidechain duck


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def add(sig, start, gain=1.0, pan=0.0, send=0.0, bus=None):
    """Mix a mono or stereo signal at start seconds; constant-power pan."""
    i = int(round(start * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        a = np.pi / 4 * (pan + 1)
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    j0 = max(0, -i)
    n = min(sig.shape[1] - j0, N - max(i, 0))
    if n <= 0:
        return
    seg = sig[:, j0:j0 + n] * gain
    if bus is not None:
        bus[:, max(i, 0):max(i, 0) + n] += seg
        return
    dry[:, max(i, 0):max(i, 0) + n] += seg
    if send:
        wet[:, max(i, 0):max(i, 0) + n] += seg * send


def fft_filter(x, lo=0.0, hi=None, soft=1.0):
    """Zero-phase band filter with smooth (Butterworth-like) shoulders."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1.0 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1.0 / (1.0 + (lo / np.maximum(f, 1e-3)) ** (4 * soft))
    if hi:
        g *= 1.0 / (1.0 + (f / hi) ** (4 * soft))
    return np.fft.irfft(X * g, len(x))


def sweep_noise(sec, lo0, lo1, hi0, hi1, env):
    """Noise through a band that moves over time (chunked overlap-add)."""
    n = int(sec * SR)
    x = rng.randn(n + 4096)
    out = np.zeros(n + 4096)
    win = np.hanning(2048)
    for s in range(0, n, 1024):
        p = s / max(1, n)
        lo = lo0 * (lo1 / lo0) ** p
        hi = hi0 * (hi1 / hi0) ** p
        out[s:s + 2048] += fft_filter(x[s:s + 2048] * win, lo, hi)
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9) * env(np.arange(n) / n)


# ---------------- instruments ----------------
def kick(big=False):
    t = tvec(0.9 if big else 0.45)
    f = 44 + (130 if big else 115) * np.exp(-t * (22 if big else 32))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (3.2 if big else 7.5))
    click = fft_filter(rng.randn(len(t)), 1500, 8000) * np.exp(-t * 300) * 0.25
    return np.tanh((body + click) * 1.4) * 0.9


def clap():
    t = tvec(0.35)
    n = fft_filter(rng.randn(len(t)), 900, 5200)
    env = np.zeros_like(t)
    for k, d in enumerate([0, 0.011, 0.022]):
        env += (t >= d) * np.exp(-(t - d).clip(0) * (140 if k < 2 else 22))
    return n / np.abs(n).max() * env * 0.6


def hat(open_=False):
    t = tvec(0.28 if open_ else 0.07)
    n = fft_filter(rng.randn(len(t)), 7500, 16000)
    return n / np.abs(n).max() * np.exp(-t * (14 if open_ else 70)) * 0.35


def pad_note(m, sec, cutoff, voices=(-0.09, 0.0, 0.08)):
    """Detuned additive saw with a soft spectral roll-off at cutoff."""
    t = tvec(sec)
    out = np.zeros((2, len(t)))
    for vi, det in enumerate(voices):
        f0 = midi(m + det)
        sig = np.zeros(len(t))
        for h in range(1, 26):
            fh = f0 * h
            if fh > 9000:
                break
            w = (1.0 / h ** 1.15) / (1.0 + (fh / cutoff) ** 4) / (1.0 + (220.0 / fh) ** 2)
            if w < 1e-3:
                continue
            sig += w * np.sin(2 * np.pi * fh * t + rng.rand() * 6.28)
        pan = (-0.6, 0.0, 0.6)[vi]
        a = np.pi / 4 * (pan + 1)
        out[0] += sig * np.cos(a)
        out[1] += sig * np.sin(a)
    att = np.minimum(1, t / 0.25)
    rel = np.minimum(1, (sec - t) / 0.3)
    return out * att * rel * 0.12


def pluck(m, sec=0.6, bright=1.0):
    t = tvec(sec)
    f0 = midi(m)
    sig = np.zeros(len(t))
    for h in range(1, 10):
        sig += (1.0 / h) * np.sin(2 * np.pi * f0 * h * t) * np.exp(-t * (5 + h * 4.5 / bright))
    sig *= np.minimum(1, t / 0.004)
    return sig * 0.22


def bell(m, sec=1.2):
    t = tvec(sec)
    f0 = midi(m)
    sig = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 3), (2.0, .5, 5), (3.01, .25, 7), (4.2, .12, 9)])
    return sig * np.minimum(1, t / 0.003) * 0.25


def bass_note(m, sec):
    t = tvec(sec)
    f0 = midi(m)
    sig = np.sin(2 * np.pi * f0 * t) + 0.35 * np.sin(4 * np.pi * f0 * t) + 0.12 * np.sin(6 * np.pi * f0 * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 3.0) * np.minimum(1, (sec - t) / 0.02)
    return np.tanh(sig * 1.2) * env * 0.42


# ---------------- arrangement ----------------
# D major, vi-IV-I-V: Bm | G | D | A
CHORDS = [[59, 62, 66], [55, 59, 62], [57, 62, 66], [57, 61, 64]]
ROOTS = [35, 31, 38, 33]  # B1 G1 D2 A1
ARP = [0, 1, 2, 1, 2, 0, 1, 2]
LEAD = {0: [(0, 78, 1), (1.5, 76, .5), (2, 74, 1), (3, 73, 1)], 1: [(0, 74, 1.5), (2, 71, 1), (3, 74, 1)],
        2: [(0, 78, 1), (1, 81, 1), (2, 78, 1), (3, 76, 1)], 3: [(0, 76, 2), (2, 73, 1), (3, 76, 1)]}


def section(t):
    if t < 2.0: return 'cold'
    if t < 8.0: return 'intro'
    if t < 39.0: return 'groove'
    if t < 43.0: return 'break'
    if t < 49.0: return 'lift'
    return 'end'


CUT = {'cold': 500, 'intro': 900, 'groove': 2600, 'break': 1300, 'lift': 4200, 'end': 2200}
K = kick(); KB = kick(True); CL = clap(); HC = hat(); HO = hat(True)
kick_times = []
bars = int(np.ceil(DUR / BAR))
for b in range(bars):
    t0 = b * BAR
    ci = b % 4
    sec = section(t0 + 0.01)
    if t0 >= 54.0:
        break
    # pad: one chord per bar (end section holds a D chord)
    chord = CHORDS[ci] if sec != 'end' else [57, 62, 66]
    if sec == 'end' and t0 > 49.5:
        continue
    plen = BAR + 0.3 if sec != 'end' else DUR - t0
    for m in chord + [chord[0] + 12]:
        add(pad_note(m, plen, CUT[sec]), t0, gain=0.7 if sec != 'cold' else 0.6, send=0.35)
    if sec in ('groove', 'lift', 'break', 'intro'):
        for k in range(8):
            tt = t0 + k * BEAT / 2
            m = chord[ARP[k]] + 12
            g = 0.55 if sec != 'intro' else 0.35
            add(pluck(m, 0.5, 1.4 if sec == 'lift' else 1.0), tt, gain=g, pan=(-0.35 if k % 2 else 0.35), send=0.25)
            for d, fb in ((0.375, 0.32), (0.75, 0.12)):  # dotted-eighth echoes
                add(pluck(m, 0.4, 0.8), tt + d, gain=g * fb, pan=(0.6 if k % 2 else -0.6), send=0.3)
    if sec in ('groove', 'lift'):
        for k in range(8):
            if k % 2 == 1:
                add(bass_note(ROOTS[ci] + 12 * (k == 7), BEAT / 2 * 0.9), t0 + k * BEAT / 2, gain=0.72)
    if sec == 'lift':
        for (bt, m, ln) in LEAD[ci]:
            add(pad_note(m, ln * BEAT, 5000, voices=(-0.05, 0.05)) * 1.4, t0 + bt * BEAT, send=0.4)
    # drums
    for q in range(4):
        tq = t0 + q * BEAT
        s2 = section(tq + 0.01)
        if s2 in ('groove', 'lift') or (s2 == 'intro' and tq >= 2.0 and tq < 7.5):
            add(K, tq, gain=0.85 if s2 != 'intro' else 0.65, bus=kbus)
            kick_times.append(tq)
        if s2 in ('groove', 'lift') and q in (1, 3):
            add(CL, tq, gain=0.7, send=0.22)
        if s2 in ('groove', 'lift') or (s2 == 'intro' and tq >= 4.0 and tq < 7.5):
            add(HO, tq + BEAT / 2, gain=1.0, pan=0.25)
        if s2 in ('groove', 'lift'):
            for e in (0, 0.25, 0.75):
                add(HC, tq + e * BEAT, gain=0.6 + 0.25 * (e == 0.75), pan=-0.3)

# end card: one held D chord and a slow bell arpeggio
for m in (50, 57, 62, 66, 69):
    add(pad_note(m, DUR - 49.0, 2400), 49.0, gain=0.75, send=0.45)
for i, m in enumerate((74, 78, 81, 86, 81, 78)):
    add(bell(m, 1.6), 49.5 + i * 0.5, gain=0.5, pan=(-0.4 if i % 2 else 0.4), send=0.5)
# sidechain pump on pads/bass from kicks (applied to whole bus, gentle)
duck = np.ones(N)
for tk in kick_times:
    i = int(tk * SR)
    L = int(0.3 * SR)
    seg = 1 - 0.45 * np.exp(-np.arange(L) / (0.09 * SR))
    j = min(N, i + L)
    duck[i:j] = np.minimum(duck[i:j], seg[:j - i])
dry *= duck
wet *= duck
dry += kbus


# ---------------- SFX from the film cue list ----------------
def whoosh(sec=0.7, up=True, bright=1.0):
    env = lambda p: np.sin(np.pi * np.clip(p, 0, 1)) ** 2
    lo0, lo1 = (300, 1800) if up else (1800, 300)
    s = sweep_noise(sec, lo0, lo1, lo0 * 3 * bright, lo1 * 4 * bright, env)
    st = np.vstack([s, np.roll(s, 240)])
    return st * 0.38


def riser(sec=2.0):
    env = lambda p: p ** 2.2
    s = sweep_noise(sec, 200, 5000, 900, 14000, env) * 0.35
    t = tvec(sec)
    f = 180 * (8 ** (t / sec))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / sec) ** 2 * 0.12
    return s[:len(t)] + tone


def pop():
    t = tvec(0.09)
    f = 520 + 700 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.5


def click():
    t = tvec(0.04)
    n = fft_filter(rng.randn(len(t)), 2500, 9000)
    return (n / np.abs(n).max() * 0.5 + np.sin(2 * np.pi * 1800 * t)) * np.exp(-t * 160) * 0.35


def tick():
    t = tvec(0.08)
    return (np.sin(2 * np.pi * 1250 * t) + 0.4 * np.sin(2 * np.pi * 2500 * t)) * np.exp(-t * 70) * 0.35


def blip():
    t = tvec(0.14)
    f = np.where(t < 0.05, 880, 1320)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.3


def impact():
    t = tvec(1.6)
    sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 0.8) + 25) / SR) * np.exp(-t * 2.2)
    n = fft_filter(rng.randn(len(t)), 60, 2500) * np.exp(-t * 6) * 0.08
    return np.tanh(sub * 1.3) * 0.6 + n + np.pad(KB, (0, len(t) - len(KB))) * 0.6


def stamp():
    t = tvec(0.35)
    body = np.sin(2 * np.pi * np.cumsum(70 + 140 * np.exp(-t * 40)) / SR) * np.exp(-t * 12)
    n = fft_filter(rng.randn(len(t)), 300, 3000) * np.exp(-t * 50) * 0.1
    return body * 0.7 + n


def strike():
    env = lambda p: np.exp(-p * 5) * np.minimum(1, p * 30)
    return sweep_noise(0.3, 3000, 1200, 9000, 5000, env) * 0.25


def progress():
    t = tvec(1.15)
    f = 420 * (2.2 ** (t / 1.15))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * 0.07 * np.minimum(1, t / 0.1)


def hit():
    return K * 0.8 + fft_filter(rng.randn(len(K)), 4000, 14000) * np.exp(-tvec(len(K) / SR) * 9) * 0.05


SFX = {
    'whoosh': lambda: whoosh(0.7), 'swoosh': lambda: whoosh(0.5, True, 1.6), 'riser': lambda: riser(2.0),
    'pop': pop, 'click': click, 'tick': tick, 'blip': blip, 'impact': impact, 'stamp': stamp,
    'strike': strike, 'progress': progress, 'hit': hit,
    'done': lambda: bell(88, 1.0) + np.pad(bell(95, 0.9), (int(0.1 * SR), 0))[:int(1.0 * SR)],
}
OFFSET = {'whoosh': -0.25, 'swoosh': -0.15, 'riser': 0.0}
cache = {}
for c in film['cues']:
    k = c['kind']
    if k not in SFX:
        print('unknown sfx', k)
        continue
    if k not in ('whoosh', 'swoosh', 'riser') and k in cache:
        s = cache[k]
    else:
        s = SFX[k]()
        cache[k] = s
    g = {'pop': 0.55, 'click': 0.6, 'tick': 0.6, 'blip': 0.6, 'whoosh': 0.75, 'swoosh': 0.75}.get(k, 0.9) * c.get('gain', 1)
    add(s, c['t'] + OFFSET.get(k, 0), gain=g, send=0.25)
# risers into the two big moments
add(riser(1.9), 47.1, gain=0.6, send=0.2)
add(riser(2.0), 41.0, gain=0.55, send=0.2)

# ---------------- reverb + master ----------------
L_ir = int(1.6 * SR)
ti = np.arange(L_ir) / SR
ir = np.vstack([fft_filter(rng.randn(L_ir), 200, 6000), fft_filter(rng.randn(L_ir), 200, 6000)]) * np.exp(-ti * 3.6)
ir /= np.abs(ir).sum(axis=1, keepdims=True) ** 0.5 * 30
nf = 1 << int(np.ceil(np.log2(N + L_ir)))
rev = np.vstack([np.fft.irfft(np.fft.rfft(wet[c], nf) * np.fft.rfft(ir[c], nf), nf)[:N] for c in range(2)])
mix = dry + rev * 0.9
mix = fft_filter(mix[0], 28), fft_filter(mix[1], 28)
mix = np.vstack(mix)
# fades
fi = int(0.02 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
fo0 = int((DUR - 2.0) * SR)
mix[:, fo0:] *= np.linspace(1, 0, N - fo0) ** 1.5
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.15) / np.tanh(1.15) * 0.8
pcm = (mix.T * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', OUT, '%.1fs' % DUR)
