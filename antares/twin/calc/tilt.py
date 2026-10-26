# -*- coding: utf-8 -*-
"""Панелі на фасадах під кутом: козирки 20° і 25° від горизонталі (виступають із фасаду, дивляться назовні),
відхилені від стіни на 20° і 25° (70° і 65° від горизонталі), вертикально впритул — для порівняння.
Тінь від будівель і предметів — як у irr.py (DSM 0,25 м, горизонт 72 напрями); тінь від сусіднього ряду — 2D-модель
(ряди нескінченні вздовж стіни), модуль 2384 × 1303 мм коротким боком від стіни. Антарес, 26.10.2026."""
import json, math, numpy as np
SRC = open('/home/claude/work/sun/irr.py', encoding='utf-8').read()
exec(SRC[:SRC.find('# ---------- точки')])                       # DSM, Hat(), roofZ, WX …
st_src = open('/home/claude/work/sun/stats.py', encoding='utf-8').read(); ns = {'np': np}
exec(st_src[st_src.find('up = lambda'):st_src.find('NAMES =')], ns); opening = ns['opening']
O = json.load(open('/home/claude/work/sun/rad.json'))
NWALL = {'S': np.array([0, -1.0, 0]), 'E': np.array([1.0, 0, 0]), 'N': np.array([0, 1.0, 0])}
WALLP = {'S': lambda s, h: (s, -0.5, h), 'E': lambda s, h: (96.64, s, h), 'N': lambda s, h: (s, 96.59, h)}
cells = {k: [(r[2], r[3]) for r in O['surf'][k] if r[5] is not None and not opening(k, r[2], r[3]) and r[3] > 1.0] for k in 'SEN'}
D = 1.303                                                               # виліт модуля від стіни (короткий бік)
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA; ALB = 0.2
def horizon(P):
    HOR = np.zeros((len(P), NA), np.float32)
    for b0 in range(0, len(P), 400):
        p = P[b0:b0 + 400]
        for a in range(NA):
            X = p[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = p[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
            HOR[b0:b0 + len(p), a] = np.maximum(np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1), 0)
    return HOR
def lit2d(o, up, beta, p, toward=False):
    """частка панелі, освітленої прямим сонцем з урахуванням рядів над нею (2D, профільна площина). o — складова сонця назовні від стіни."""
    if p is None: return 1.0
    cb, sb = math.cos(math.radians(beta)), math.sin(math.radians(beta))
    L = math.hypot(o, up); dx, dy = o / L, up / L
    seg = lambda k: ((0.0, k * p), (D * cb, k * p - D * sb))         # ряд k: від стіни (0, k·p) назовні й донизу
    n = 0; N = 21
    for t in np.linspace(0.02, 0.98, N):
        x0, y0 = D * cb * t, -D * sb * t; hit = False
        for k in (1, 2, 3, 4):
            (ax, ay), (bx, by) = seg(k); ex, ey = bx - ax, by - ay; den = dx * ey - dy * ex
            if abs(den) < 1e-12: continue
            s = ((ax - x0) * ey - (ay - y0) * ex) / den; u = ((ax - x0) * dy - (ay - y0) * dx) / den
            if s > 1e-6 and 0 <= u <= 1: hit = True; break
        if x0 + dx * 50 < 0 and dx < 0: pass
        n += 0 if hit else 1
    return n / N
def diff2d(beta, p):
    """відношення видимого неба (2D, ізотропне) з рядами над панеллю / без них; стіна закриває напрями до неї."""
    if p is None: return 1.0
    cb, sb = math.cos(math.radians(beta)), math.sin(math.radians(beta)); an = math.radians(90 - beta)
    def F(rows):
        tot = 0
        for t in np.linspace(0.05, 0.95, 7):
            x0, y0 = D * cb * t, -D * sb * t
            for ps in np.radians(np.linspace(-89.5, 89.5, 180)):
                a = an + ps; dx, dy = math.cos(a), math.sin(a)
                if dy <= 0 or dx < 0: continue                         # униз — земля; до стіни — стіна
                blk = False
                if rows:
                    for k in (1, 2, 3, 4):
                        ax, ay, bx, by = 0.0, k * p, D * cb, k * p - D * sb; ex, ey = bx - ax, by - ay; den = dx * ey - dy * ex
                        if abs(den) < 1e-12: continue
                        s = ((ax - x0) * ey - (ay - y0) * ex) / den; u = ((ax - x0) * dy - (ay - y0) * dx) / den
                        if s > 1e-6 and 0 <= u <= 1: blk = True; break
                if not blk: tot += math.cos(ps)
        return tot
    return F(True) / F(False)
def run(k, beta, off, p=None, toward=False):
    nw = NWALL[k]; up = np.array([0, 0, 1.0]); sb, cb = math.sin(math.radians(beta)), math.cos(math.radians(beta))
    n = (-nw if toward else nw) * sb + up * cb
    P = np.array([np.array(WALLP[k](s, h)) + nw * off for s, h in cells[k]])
    P[:, 2] = np.array([h for s, h in cells[k]])
    HOR = horizon(P); NP = len(P)
    SVF = np.zeros(NP)
    for a in range(NA):
        for e in EL:
            v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); c = float(n @ v)
            if c > 0: SVF += c * math.cos(e) * dEl * dAz / math.pi * (e > HOR[:, a])
    Rd = diff2d(beta, p) if not toward else 1.0; E = np.zeros(NP); Eb = 0
    for m, Wm in enumerate(WX['mo']):
        wt = Wm['nd'] / 6 / 1000; p_, c_ = Wm['p'], Wm['c']
        for st in Wm['st']:
            h, ex, ey, sz, G, Dn, Dd, ext, ta = st; dv = np.array([ex, ey, sz]); cosb = max(float(n @ dv), 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f)
            vis = el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t
            lit = lit2d(float(dv @ nw), sz, beta, p) if (cosb > 0 and not toward) else 1.0
            beam = (Dn * cosb + Dd * Ai * cosb / cz) * vis * lit; iso = Dd * (1 - Ai) * SVF * Rd; gr = G * ALB * (1 - cb) / 2
            E += wt * (p_ * (beam + iso + gr) + (1 - p_) * (c_ * G * SVF * Rd + c_ * G * ALB * (1 - cb) / 2))
    return E
RES = {}
for k in 'SEN':
    r = {}
    r['V'] = run(k, 90, 0.3)
    for b in (20, 25): r[f'K{b}'] = run(k, b, 0.65)
    for b in (70, 65): r[f'T{b}'] = run(k, b, 0.35)
    if k == 'N':
        for b in (20, 25): r[f'KS{b}'] = run(k, b, 0.65, toward=True)
    RES[k] = {c: (float(v.mean()), float(np.percentile(v, 10)), float(v.max())) for c, v in r.items()}
    # ряди: крок по висоті
    rows = {}
    for b, off, pits in ((20, 0.65, (1.0, 1.5, 2.0, 2.5, 3.0)), (25, 0.65, (1.0, 1.5, 2.0, 2.5, 3.0)), (70, 0.35, (1.25, 1.5, 2.0)), (65, 0.35, (1.2, 1.5, 2.0))):
        for p in pits:
            E = run(k, b, off, p); rows[f'{"K" if b < 45 else "T"}{b}@{p}'] = float(E.mean())
    RES[k]['rows'] = rows
    print(k, {c: round(v[0]) for c, v in RES[k].items() if c != 'rows'}); print('   rows', {c: round(v) for c, v in rows.items()})
json.dump(RES, open('/home/claude/work/sun/tilt.json', 'w'), ensure_ascii=False, indent=1)
