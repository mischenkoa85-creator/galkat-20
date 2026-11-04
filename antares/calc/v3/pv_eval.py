# -*- coding: utf-8 -*-
"""Генерація для розкладки pv_layout.py (28.10.2026): та сама модель v3 (lan22, каркаси 13°, бортик 0,30, 11 труб).
Модулі даху — стрінги по 11, як roof_A (по гранях, змійкою по колонках; залишки — за схилом і ухилом).
Модулі каркасів — стрінг 11 сусідніх модулів одного схилу одного ліхтаря (через прохід — перемичка вздовж каркаса); залишок ліхтаря — Сх+Зх разом, якщо набирається 11.
вхід: CANDS (pv_cands.json) → вихід OUT (pv_eval.json)"""
import os, sys, json, math, numpy as np
os.environ.setdefault('TILT', '13'); os.environ.setdefault('CURB', '0.30')
V = '/home/claude/work/sun/v3/'; sys.path.insert(0, V)
import lan22 as L
CANDS = os.environ['CANDS']; OUT = os.environ.get('OUT', CANDS.replace('pv_cands', 'pv_eval'))
D = json.load(open(CANDS))
F = L.build_dsm('V1')
# ---------- дах
C = [c for c in D['cand'] if c['why'] is None]
P = []; N = []
for c in C:
    nv = np.array([-c['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
    for t in (-0.892, 0.0, 0.888): P.append((c['xm'], c['y'] + t, c['zm'] + 0.12 + 0.033 + 0.03))
ST, I = L.run_steps(np.array(P), np.array(N)); E = L.mod_kwh(ST, len(C))
for i, c in enumerate(C): c['kwh'] = float(E[i]); c['irr'] = float(I[i])
S_ = L.roof_strings(C); tot = 0; tot0 = 0
RS = []
for sid, ids in enumerate(S_):
    e, e0, emo = L.string_energy(ST, ids); tot += e; tot0 += e0; RS.append(dict(ids=ids, mwh=round(e / 1000, 3)))
inS = set(i for s in S_ for i in s)
roof = dict(free=len(C), n=len(inS), st=len(S_), kwp=round(len(inS) * L.PW, 2), mwh=round(tot / 1000, 2), mism=round((1 - tot / tot0) * 100, 2),
            y=round(tot / len(inS) / L.PW))
# ---------- каркаси
ct, st_ = L.ct, L.st_; LM, DM = L.LM, L.DM
M = [m for m in D['frame'] if not m['why']]
P = []; N = []
for m in M:
    Ln = F[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1; nrm = np.array([sg * st_, 0, ct]); N.append(nrm)
    for f_ in (0.2, 0.5, 0.8):
        um = 0.02 + LM * f_; P.append((Ln['xc'] + sg * um * ct + nrm[0] * 0.30, m['y'] + DM / 2, Ln['ridge'] - um * st_ + nrm[2] * 0.30))
ST2, I2 = L.run_steps(np.array(P), np.array(N)); E2 = L.mod_kwh(ST2, len(M))
for i, m in enumerate(M): m['kwh'] = round(float(E2[i]), 1)
FS = []; drop = []
for l in sorted(set(m['l'] for m in M)):
    rest = []
    for sd in 'EW':
        ii = sorted([i for i, m in enumerate(M) if m['l'] == l and m['side'] == sd], key=lambda i: M[i]['y'])
        k = len(ii) // 11; r = len(ii) - k * 11
        # залишок — біля торця з меншою генерацією
        cand_ = [(ii[r:], ii[:r]), (ii[:k * 11], ii[k * 11:])]
        best = max(cand_, key=lambda t: sum(M[i]['kwh'] for i in t[0]))
        FS += [best[0][s * 11:(s + 1) * 11] for s in range(k)]; rest += best[1]
    rest = sorted(rest, key=lambda i: -M[i]['kwh']); k = len(rest) // 11
    FS += [rest[s * 11:(s + 1) * 11] for s in range(k)]; drop += rest[k * 11:]
ft = 0; ft0 = 0
for ids in FS:
    e, e0, emo = L.string_energy(ST2, ids); ft += e; ft0 += e0
fin = set(i for s in FS for i in s)
frame = dict(places=len(D['frame']), free=len(M), n=len(fin), st=len(FS), kwp=round(len(fin) * L.PW, 2), mwh=round(ft / 1000, 2), y=round(ft / max(1, len(fin)) / L.PW), drop=len(drop))
R_ = dict(roof=roof, frame=frame, total=dict(n=roof['n'] + frame['n'], st=roof['st'] + frame['st'], kwp=round(roof['kwp'] + frame['kwp'], 2), mwh=round(roof['mwh'] + frame['mwh'], 2)),
          roof_mods=[dict(xa=c['xa'], xb=c['xb'], y=c['y'], f=c['f'], j=c['j'], kwh=round(c['kwh'], 1), s=next((si for si, s in enumerate(S_) if i in s), -1)) for i, c in enumerate(C)],
          frame_mods=[dict(l=m['l'], side=m['side'], y=m['y'], y1=m['y1'], kwh=m['kwh'], s=next((si for si, s in enumerate(FS) if i in s), -1)) for i, m in enumerate(M)])
json.dump(R_, open(OUT, 'w'), ensure_ascii=False)
print(json.dumps({k: R_[k] for k in ('roof', 'frame', 'total')}, ensure_ascii=False))
