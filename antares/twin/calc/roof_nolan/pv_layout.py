# -*- coding: utf-8 -*-
"""Розкладка модулів на даху цеху Антарес без ліхтарів (28.10.2026) з урахуванням проходів, відступів і протипожежних розривів.
Геометрія — roofobj.py (остаточне креслення ЕСЕ-2610-01-ПК: 11 труб, лівневки, рама кондиціонерів, вихід, каркаси Л1–Л4).
Модулі ZNSHINE 730 Вт 2 384 × 1 303: на гранях — короткою стороною поперек грані (як у v3), рядами вздовж Y з кроком 2 406;
на каркасах ліхтарів 13° — книжково, 1 ряд на схил, крок 1 325 уздовж ліхтаря.
Правила — RULES (кожне з підставою в RULES_SRC); генерація — модель v3 (lan22: Meteonorm 8.1, DSM 0,25 м, тінь, стрінги по 11).
→ pv_cands.json (env RULES — файл правил, OUT — вихід)"""
import os, sys, json, math, collections
W = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, W)
import roofobj as R
LM, DM, GAP, MRG = 2.384, 1.303, 0.022, 0.12          # модуль, зазор, відступ від краю грані (як v3)
PY, PL = 2.406, 1.325                                 # крок рядів на гранях (Y), крок модулів на каркасі (Y)
FR_EDGE = (0.02 + LM) * math.cos(math.radians(13))    # край модуля на каркасі від осі ліхтаря, 2,34 м
RULES = json.load(open(os.environ.get('RULES', W + 'pv_rules.json'), encoding='utf-8'))
ov = lambda a0, a1, b0, b1: a0 < b1 - 1e-9 and b0 < a1 - 1e-9
def hitc(xa, xb, ya, yb, cx, cy, r):
    dx = max(xa - cx, 0, cx - xb); dy = max(ya - cy, 0, cy - yb); return dx * dx + dy * dy < r * r
# ---------- зони, вільні від модулів
def keepout():
    Z = []; P = RULES['perimeter']
    Z.append(dict(k='perimeter', n=f"від стіни західної будівлі {P['W']} м", x=(-1, R.XWin + P['W']), y=(-1, 98)))
    Z.append(dict(k='perimeter', n=f"від східного парапету {P['E']} м", x=(R.XE_in - P['E'], 99), y=(-1, 98)))
    Z.append(dict(k='perimeter', n=f"від південного парапету {P['S']} м", x=(-1, 99), y=(-1, R.YS_in + P['S'])))
    Z.append(dict(k='perimeter', n=f"від північного парапету {P['N']} м", x=(-1, 99), y=(R.YN_in - P['N'], 98)))
    for p in RULES['paths_y']:
        Z.append(dict(k='path', n=f"прохід Сх–Зх {p['w']} м, Y {p['yc']}", x=(-1, 99), y=(p['yc'] - p['w'] / 2, p['yc'] + p['w'] / 2)))
    for p in RULES['paths_x']:
        if 'valley' in p:                     # прохід уздовж ендови: пласка смуга + w з одного боку (side E / W)
            v = next(v for v in R.VALLEYS if v['ax'] == p['valley'])
            x0, x1 = (v['x0'] - 0.01, v['x1'] + p['w']) if p.get('side', 'E') == 'E' else (v['x0'] - p['w'], v['x1'] + 0.01)
            p['xc'] = round((x0 + x1) / 2, 3)
        else: x0, x1 = p['xc'] - p['w'] / 2, p['xc'] + p['w'] / 2
        Z.append(dict(k='path', n=f"прохід Пн–Пд {p['w']} м" + (f", ендова осі {p['valley']}" if 'valley' in p else f", X {p['xc']}"), x=(x0, x1), y=(p.get('y0', -1), p.get('y1', 98))))
    c = RULES['clear']
    A = R.AC; Z.append(dict(k='ac', n=f"рама кондиціонерів + {c['ac']} м", x=(A['x0'] - c['ac'], A['x1'] + c['ac']), y=(A['y0'] - c['ac'], A['y1'] + c['ac'])))
    E = RULES['exit']; Z.append(dict(k='exit', n='вихід на дах, портал', x=tuple(E['x']), y=tuple(E['y'])))
    for z in RULES.get('extra', []): Z.append(dict(k=z['k'], n=z['n'], x=tuple(z['x']), y=tuple(z['y'])))
    D = R.DOOR; Z.append(dict(k='door', n=f"двері західної будівлі ± {c['door']} м", x=(-1, R.XWin + c['door_depth']), y=(D['y'] - D['w'] / 2 - c['door'], D['y'] + D['w'] / 2 + c['door'])))
    return Z
def rows_y():
    """ряди модулів (центри) у смугах між проходами і периметром"""
    P = RULES['perimeter']; ys = [R.YS_in + P['S']] ; ye = []
    cuts = sorted(RULES['paths_y'], key=lambda p: p['yc'])
    bands = []; lo = R.YS_in + P['S']
    for p in cuts: bands.append((lo, p['yc'] - p['w'] / 2)); lo = p['yc'] + p['w'] / 2
    bands.append((lo, R.YN_in - P['N']))
    out = []
    for b0, b1 in bands:
        n = int((b1 - b0 + GAP) // PY); used = n * PY - GAP; s = b0 + (b1 - b0 - used) / 2
        out += [round(s + LM / 2 + k * PY, 3) for k in range(n)]
    return out, bands
def roof_cands():
    Z = keepout(); ROWS, bands = rows_y(); c = RULES['clear']
    FAC = [p for p in R.PR if p['what'].startswith('грань')]
    cand = []
    for fi, p in enumerate(FAC):
        dx, dz = p['x1'] - p['x0'], p['z1'] - p['z0']; Ls = math.hypot(dx, dz); cs, sn = dx / Ls, dz / Ls; k = dz / dx
        n = int((Ls - 2 * MRG + GAP) // (DM + GAP)); used = n * DM + (n - 1) * GAP; st = (Ls - used) / 2
        for j in range(n):
            u0 = st + j * (DM + GAP); u1 = u0 + DM; xa, xb = p['x0'] + u0 * cs, p['x0'] + u1 * cs; um = (u0 + u1) / 2
            xm, zm = p['x0'] + um * cs, p['z0'] + um * sn
            for y in ROWS:
                ya, yb = y - LM / 2, y + LM / 2; why = None
                for F in R.FRAMES:                                     # каркаси з модулями: край модулів ± зазор
                    if ov(xa, xb, F['xc'] - FR_EDGE - c['frame'], F['xc'] + FR_EDGE + c['frame']) and ov(ya, yb, F['y0'] - c['frame_end'], F['y1'] + c['frame_end']): why = 'frame'
                if not why:
                    for o in R.DEFL:
                        if o['cls'] == 'є' and hitc(xa, xb, ya, yb, o['x'], o['y'], o['d'] / 2 + c['pipe']): why = 'pipe'; break
                if not why:
                    for d in R.DRAINS:
                        if hitc(xa, xb, ya, yb, d['x'], d['y'], c['drain']): why = 'drain'; break
                if not why: why = next((z['k'] for z in Z if ov(xa, xb, *z['x']) and ov(ya, yb, *z['y'])), None)
                cand.append(dict(f=fi, sp=p['sp'], j=j, xa=round(xa, 3), xb=round(xb, 3), xm=round(xm, 3), zm=round(zm, 3), y=y, k=k,
                                 tilt=round(math.degrees(math.atan(abs(k))), 1), face='W' if k > 0 else 'E', why=why))
    return cand, Z, ROWS, bands
def frame_mods():
    """модулі на каркасах: по 1 ряду книжково на кожен схил; якщо RULES.paths_y_frames ≠ false — сегменти між проходами Сх–Зх"""
    c = RULES['clear']; out = []
    cut = RULES['paths_y'] if RULES.get('paths_y_frames', True) else []   # false — каркас з модулями суцільний, прохід Сх–Зх переривається на ліхтарі
    for li, F in enumerate(R.FRAMES):
        segs = [(F['y0'], F['y1'])]
        for p in cut:
            a, b = p['yc'] - p['w'] / 2, p['yc'] + p['w'] / 2; ns = []
            for s0, s1 in segs:
                if b <= s0 or a >= s1: ns.append((s0, s1))
                else:
                    if a - s0 > PL: ns.append((s0, a))
                    if s1 - b > PL: ns.append((b, s1))
            segs = ns
        for s0, s1 in segs:
            n = int((s1 - s0 + GAP) // PL); used = n * PL - GAP; ys = s0 + (s1 - s0 - used) / 2
            for i in range(n):
                y0 = ys + i * PL
                for side, sg in (('E', 1), ('W', -1)):
                    blk = None
                    for o in R.DEFL:
                        if o['cls'] == 'є' and hitc(F['xc'] + min(0, sg) * FR_EDGE, F['xc'] + max(0, sg) * FR_EDGE, y0, y0 + DM, o['x'], o['y'], o['d'] / 2 + c['pipe']): blk = 'pipe'
                    out.append(dict(l=li + 1, side=side, y=round(y0, 3), y1=round(y0 + DM, 3), seg=(round(s0, 2), round(s1, 2)), why=blk))
    return out
if __name__ == '__main__':
    cand, Z, ROWS, bands = roof_cands(); FM = frame_mods()
    free = [c_ for c_ in cand if c_['why'] is None]
    print('roof cand', len(cand), 'free', len(free), dict(collections.Counter(c_['why'] for c_ in cand)))
    print('frame places', len(FM), 'free', sum(1 for m in FM if not m['why']))
    print('rows', len(ROWS), 'bands', [(round(a, 2), round(b, 2)) for a, b in bands])
    json.dump(dict(rules=RULES, Z=Z, ROWS=ROWS, bands=bands, cand=cand, frame=FM), open(os.environ.get('OUT', W + 'pv_cands.json'), 'w'), ensure_ascii=False)
