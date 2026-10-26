# -*- coding: utf-8 -*-
"""Південний фасад — щільніша розкладка вертикальних модулів (низ ≥ 4 м). Антарес, 26.10.2026.
Растр 0,01 м. Етап 1: фасад ділиться на смуги по краях вікон; у кожній смузі — свої висоти рядів (динамічне програмування,
альбомно або книжково), розбиття на смуги — теж динамічне програмування. Етап 2: дозаповнення дірок жадібно (знизу вгору,
зліва направо, обидві орієнтації). Обходимо вікна, ворота, жалюзі (+0,10 м), сходи; верх — під парапетом −0,10 м (по арках)."""
import json, math, time, numpy as np
T0 = time.time()
st = open('/home/claude/work/sun/stats.py', encoding='utf-8').read(); ns = {'np': np}; exec(st[st.find('up = lambda'):st.find('NAMES =')], ns); OPN = ns['OPN']
HV, FL, SPANS = 13.81, 0.75, [[0, 18, 1.19], [18, 36, 1.19], [36, 54, 1.19], [54, 72, 1.19], [72, 96, 1.6]]
def arch(X):
    X = min(96, max(0, X))
    for a, b, r in SPANS:
        if a <= X <= b:
            c = (a + b) / 2; h = (b - a) / 2 - FL; d = X - c; return 0 if abs(d) >= h else r * (1 - d * d / h / h)
    return 0
R = 0.01; X0, X1, H1 = -0.15, 96.64, 17.5; NX = int(round((X1 - X0) / R)); NH = int(round(H1 / R))
xs = X0 + (np.arange(NX) + 0.5) * R; hs = (np.arange(NH) + 0.5) * R
LM, DM, G2, MRG, HMIN = 2.384, 1.303, 0.02, 0.10, 4.0
SEGS = [(0.05, 58.2), (65.9, 96.55)]
top = np.array([HV + arch(x) + 1.2 - 0.10 for x in xs])
B = np.ones((NH, NX), bool)                                  # True = зайнято / не можна
for a, b in SEGS: B[:, int((a - X0) / R):int((b - X0) / R)] = False
B[hs < HMIN, :] = True; B |= hs[:, None] > top[None, :]
for a, b, h0, h1 in OPN['S']:
    B[max(0, int((h0 - MRG) / R)):int(math.ceil((h1 + MRG) / R)), max(0, int((a - MRG - X0) / R)):int(math.ceil((b + MRG - X0) / R))] = True
ORI = {'L': (int(math.ceil((LM + G2) / R)), int(math.ceil((DM + G2) / R))), 'P': (int(math.ceil((DM + G2) / R)), int(math.ceil((LM + G2) / R)))}   # (ширина, висота) у клітинках з зазором
def integral(M):
    I = np.zeros((M.shape[0] + 1, M.shape[1] + 1), np.int32); I[1:, 1:] = M.astype(np.int32).cumsum(0).cumsum(1); return I
def valid(I, w, h):  # V[i,j] — модуль з лівим нижнім кутом у клітинці (i,j) вільний
    S = I[h:, w:] - I[:-h, w:] - I[h:, :-w] + I[:-h, :-w]; V = np.zeros((NH, NX), bool); V[:NH - h + 1, :NX - w + 1] = S == 0; return V
I = integral(B); VAL = {o: valid(I, *ORI[o]) for o in ORI}
print('raster', NH, NX, round(time.time() - T0, 1), 's')
# ---------- етап 1: смуги + ряди
import sys
STEP = int(sys.argv[1]) if len(sys.argv) > 1 else 5; EXTRA = float(sys.argv[2]) if len(sys.argv) > 2 else 0
HB = np.arange(int(HMIN / R), NH, STEP)                           # висоти рядів через 0,05 м
NF = {}
for o in ORI:
    V = VAL[o][HB, :]; nf = np.full(V.shape, NX, np.int32); idx = np.where(V, np.arange(NX)[None, :], NX)
    NF[o] = np.minimum.accumulate(idx[:, ::-1], axis=1)[:, ::-1]       # наступна вільна позиція ≥ j
def rowcount(o, k, ja, jb):
    w = ORI[o][0]; nf = NF[o][k]; j = ja; c = [];
    while j < NX:
        p = nf[j]
        if p + w > jb: break
        c.append(p); j = p + w
    return c
def band(ja, jb):
    nb = len(HB); f = [(0, [])] * (nb + 400)
    for k in range(nb - 1, -1, -1):
        best = f[k + 1]
        for o in ORI:
            c = rowcount(o, k, ja, jb)
            if c:
                kk = k + int(math.ceil(ORI[o][1] / STEP)); v = f[kk] if kk < len(f) else (0, [])
                if v[0] + len(c) > best[0]: best = (v[0] + len(c), [(o, HB[k], p) for p in c] + v[1])
        f[k] = best
    return f[0]
cuts = sorted(set([int((a - X0) / R) for a, b in SEGS] + [int((b - X0) / R) for a, b in SEGS] +
                  [int((a - MRG - X0) / R) for a, b, h0, h1 in OPN['S'] if h1 > HMIN] + [int(math.ceil((b + MRG - X0) / R)) for a, b, h0, h1 in OPN['S'] if h1 > HMIN]))
cuts += [int((x - X0) / R) for x in (18, 36, 54, 72)]
if EXTRA: cuts += [int((x - X0) / R) for x in np.arange(0, 96.6, EXTRA)]
cuts = [c for c in cuts if 0 <= c <= NX]; cuts = sorted(set(cuts + [0, NX]))
print('cuts', len(cuts))
BAND = {}
best = {0: (0, [])}
for j in range(1, len(cuts)):
    bj = (-1, [])
    for i in range(j):
        if (i, j) not in BAND: BAND[(i, j)] = band(cuts[i], cuts[j])
        v = best[i][0] + BAND[(i, j)][0]
        if v > bj[0]: bj = (v, best[i][1] + BAND[(i, j)][1])
    best[j] = bj
mods = best[len(cuts) - 1][1]
whole = band(0, NX)
print('stage1 bands', len(mods), 'whole-facade rows', whole[0], round(time.time() - T0, 1), 's')
if whole[0] > len(mods): mods = whole[1]
# ---------- етап 2: дозаповнення
Occ = B.copy()
def mark(o, hi, ji): w, h = ORI[o]; Occ[hi:hi + h, ji:ji + w] = True
for o, hi, ji in mods: mark(o, hi, ji)
added = 0
while True:
    I2 = integral(Occ); cand = []
    for o in ORI:
        V = valid(I2, *ORI[o]); ii, jj = np.nonzero(V)
        if len(ii): k = np.lexsort((jj, ii))[0]; cand.append((ii[k], jj[k], o))
    if not cand: break
    hi, ji, o = min(cand); mods.append((o, hi, ji)); mark(o, hi, ji); added += 1
print('stage2 added', added, 'total', len(mods), round(time.time() - T0, 1), 's')
out = []
for o, hi, ji in mods:
    W, H = (LM, DM) if o == 'L' else (DM, LM); out.append((round(X0 + ji * R, 3), round(hi * R, 3), W, H))
json.dump(out, open('/home/claude/work/sun/s_opt.json', 'w'))
print('L', sum(1 for m in out if m[2] > 2), 'P', sum(1 for m in out if m[2] < 2))
