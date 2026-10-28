# -*- coding: utf-8 -*-
"""Кріплення СЕС АБК «Антарес», варіант «ДБН» — кожна деталь за типовими рішеннями «Елементи SES» (28.10.2026, 20:38).

Арка        — «Лага 0° / Арка» (variant-laga-0, arka-src, правила підрахунку даху цеху Б 25.10):
              лага 41×41×1,5 під кожним стиком колонок, 2 блоки на панель на кожній лазі (575 + 1 200·k) і блок під кожним кінцем лаги;
              3 притиски на довгий бік (0,17 · 0,5 · 0,83 L): на спільній лазі — середній, на крайній — Z33;
              між модулями в колонці — шпилька M10 1 299 права/ліва між муфтами гільз 200 на лагах; на кінцях колонок — крайній профіль
              41×41 1 263 на 2 кутниках 160/150 t = 8, 2 блоки без мата, 2 Z33; прохід ≤ 1,6 м — шпилька / профіль через прохід;
              ланцюжок тяг, що не переходить гребінь, — анкер на верхній лазі (як у КМ даху цеху).
Нижній дах, — «Домік» (variant-domik, гілка antares-domik): лага 2 750, 2 балки 1 450 з двох боків лаги, стійка, П-кронштейн,
надбудова    4 блоки з матом; дві опори на пару панелей (±0,70 м від центру панелі); 4 притиски на панель; діагональ між сусідніми доміками.
              Кут 15,36°, центр панелі 0,3076 м над покрівлею, від гребеня 0,6851 м (зазор на гребені ≈0,114 м).
Одиночні     — «Трикутник з шарніром 15°, модифікація Антарес» (variant-antares-41, t1568/a/ant_15): лага 1 550, балка 1 419, стійка 448,
схід          П-кронштейн; 2 трикутники на модуль (1 400), блоки під кінцями лаги; 4 притиски; діагональ між сусідніми модулями.
Стіни        — фасадні вузли «Вертикально, книжково» (спільні горизонтальні рейки на групу, як «Колонка») і «Вертикально, альбомно»:
              рейки 41×41×2,5 на 540 мм від торців модуля, кронштейни L 60×60×5 з анкером M10, притиски 80 мм, трос безпеки.
Лага до блока — болт M8×20 + шайба DIN 9021 у муфту блока («Баласт із муфтою»).
Вихід: abk_mount.json — пози модулів, кожна деталь (центр, вісь, нормаль, довжина) і кількості для специфікації."""
import json, math, os
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
K1 = json.load(open(os.path.join(HERE, 'abk_k1.json'), encoding='utf-8'))
DBN = json.load(open(os.path.join(HERE, 'abk_dbn.json'), encoding='utf-8'))
G = K1['geo']; AB = G['AB']; AL = G['AL']
XC = (AB['x0'] + AB['x1']) / 2; HW = (AB['x1'] - AB['x0']) / 2
LM, DM = G['lm'], G['dm']                      # 2,384 і 1,303
T = 0.033                                       # рама модуля ZXN8-BD132
def zA(x): return AB['h'] + AB['f'] * max(0.0, 1 - ((x - XC) / HW) ** 2)
def kA(x): return -2 * AB['f'] * (x - XC) / HW ** 2 if abs(x - XC) < HW else 0.0
def nrm(x):
    k = kA(x); q = math.hypot(1, k); return (-k / q, 0.0, 1 / q)
def add(a, b, s=1.0): return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]
def sub(a, b): return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
def unit(v):
    L = math.sqrt(sum(c * c for c in v)); return [c / L for c in v]
def r4(v): return [round(c, 4) for c in v]
P = defaultdict(list)                           # деталі: тип → [{c, u, n, L}]
CUR = {'k': 'arch'}                             # група деталей: arch / dom / one / wall
def part(t, c, u, n, L=None, **kw):
    d = {'c': r4(c), 'u': r4(unit(u)), 'n': r4(unit(n)), 'k': CUR['k']}
    if L is not None: d['L'] = round(L, 4)
    d.update(kw); P[t].append(d)
def bolt(c, ax, Ln, tg, d=10):
    """болт: c — центр стрижня, ax — вісь (голівка з боку +ax), Ln — номінальна довжина, мм (як у «Елементах SES»: t1568/ant_15, antares-domik)"""
    u = unit(ax); n = [1, 0, 0] if abs(u[2]) > 0.9 else [0, 0, 1]
    part('bolt', c, u, n, b=Ln, d=d, tg=tg)
Q = defaultdict(float)                          # кількості для специфікації
MODS = {}                                       # пози модулів: ключ → {c, u (уздовж 2 384), n (нормаль), w (ширина поперек), tilt}
UP, YN = [0, 0, 1], [0, 1, 0]

# ================================================================== АРКА — лага 0°
A = K1['archD']
cols = defaultdict(dict)
for i, m in enumerate(A): cols[m['col']][round(m['y0'], 3)] = (i, m)
NC = max(cols) + 1
ROWS = sorted({round(m['y0'], 3) for m in A}); RI = {y: i for i, y in enumerate(ROWS)}
PITCH = LM + 0.022
def contig(r0, r1): return abs((ROWS[r1] - ROWS[r0]) - PITCH * (r1 - r0)) < 0.01
xa = {c: min(m['xa'] for _, m in cols[c].values()) for c in cols}; xb = {c: max(m['xb'] for _, m in cols[c].values()) for c in cols}
LX = {}                                         # лінії лаг: j = 0…NC (між колонками j−1 і j)
for j in range(NC + 1):
    if j == 0: LX[j] = xa[0] - 0.012
    elif j == NC: LX[j] = xb[NC - 1] + 0.012
    else: LX[j] = (xb[j - 1] + xa[j]) / 2
H_LB, H_LC, H_LT = 0.063, 0.0835, 0.104          # низ, вісь, верх лаги над покрівлею (мат 3 + блок 60 + лага 41)
def onroof(x, y, h): n = nrm(x); return [x + n[0] * h, y, zA(x) + n[2] * h]
def has(c, r): return 0 <= c < NC and ROWS[r] in cols[c]
# модулі арки — на верхах лаг
for c in range(NC):
    for y0, (i, m) in cols[c].items():
        tl, tr = onroof(LX[c], 0, H_LT), onroof(LX[c + 1], 0, H_LT)
        u2 = unit([tr[0] - tl[0], 0, tr[2] - tl[2]]); n2 = [-u2[2], 0, u2[0]]
        mid = [(tl[0] + tr[0]) / 2, y0 + LM / 2, (tl[2] + tr[2]) / 2]
        MODS['archD:%d' % i] = {'c': r4(add(mid, n2, T / 2)), 'u': [0, 1, 0], 'n': r4(n2), 'x': r4(u2), 'tilt': round(math.degrees(math.atan2(u2[2], u2[0])), 2)}
# комірки лаг і прогони
runs = []                                       # {j, r0, r1, cells: [(r, shared)]}
for j in range(NC + 1):
    cells = [(r, has(j - 1, r) and has(j, r)) for r in range(len(ROWS)) if has(j - 1, r) or has(j, r)]
    cur = []
    for r, sh in cells:
        if cur and not (r == cur[-1][0] + 1 and contig(cur[-1][0], r)): runs.append({'j': j, 'cells': cur}); cur = []
        cur.append((r, sh))
    if cur: runs.append({'j': j, 'cells': cur})
CL = [0.17, 0.5, 0.83]
lag_pcs = {'4800': 0, '2400': 0}; splices = []
for rn in runs:
    j, cells = rn['j'], rn['cells']; x = LX[j]; ys, ye = ROWS[cells[0][0]], ROWS[cells[-1][0]] + LM
    n = nrm(x); L = ye - ys; rn.update(ys=ys, ye=ye, L=L)
    part('lag', onroof(x, (ys + ye) / 2, H_LC), YN, n, L)
    nc = len(cells); lag_pcs['4800'] += nc // 2; lag_pcs['2400'] += nc % 2
    for k in range(1, (nc + 1) // 2):
        if 2 * k < nc: splices.append((j, round(ROWS[cells[2 * k][0]] - 0.011, 3)))
    Q['arch_lag_m'] += L
    yb = [ys + 0.575 + 1.2 * k for k in range(100) if ys + 0.575 + 1.2 * k <= ye - 0.15] + [ys + 0.03, ye - 0.03]
    for y in yb:
        part('blk', onroof(x, y, 0.033), YN, n); part('mat', onroof(x, y, 0.0015), YN, n)
    Q['arch_blk'] += len(yb)
    for r, sh in cells:
        for f in CL:
            y = ROWS[r] + f * LM
            if sh: part('cm', onroof(x, y, H_LT + T + 0.006), YN, n); Q['arch_cm'] += 1
            else:
                side = 1 if has(j, r) else -1            # модуль праворуч (схід) чи ліворуч
                part('cz', add(onroof(x, y, H_LT + 0.016), [side * 0.004, 0, 0]), YN, n, side=side); Q['arch_cz'] += 1
Q['arch_lag4800'] = lag_pcs['4800']; Q['arch_lag2400'] = lag_pcs['2400']
def lag_at(j, y):
    for rn in runs:
        if rn['j'] == j and rn['ys'] - 0.2 <= y <= rn['ye'] + 0.2: return True
    return False
# лінії тяг: шпильки на стиках у колонці і крайні профілі на кінцях колонок
TIE = defaultdict(list)                         # y-лінія → [(j0, j1, вид)]
ends = []
for c in range(NC):
    rs = sorted(RI[y] for y in cols[c])
    seg = [rs[0]]
    for r in rs[1:] + [None]:
        if r is not None and r == seg[-1] + 1 and contig(seg[-1], r): seg.append(r); continue
        ends.append((c, ROWS[seg[0]] - 0.012, 's')); ends.append((c, ROWS[seg[-1]] + LM + 0.012, 'e'))
        for a in seg[:-1]: TIE[round(ROWS[a] + LM + 0.011, 2)].append((c, c + 1, 'rod'))
        if r is not None: seg = [r]
for c, y, k in ends: TIE[round(y, 2)].append((c, c + 1, 'prof'))
merged = defaultdict(list)                     # злити лінії, що відрізняються на ≤ 5 см (кінець однієї колонки й стик сусідньої)
for y in sorted(TIE):
    k = next((kk for kk in merged if abs(kk - y) < 0.05), y); merged[k] += TIE[y]
ANCH = []; PASS = []
for y, ties in sorted(merged.items()):
    par = list(range(NC + 1))
    def fnd(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for j0, j1, k in ties: par[fnd(j0)] = fnd(j1)
    used = sorted({j for t in ties for j in t[:2]})
    # прохід ≤ 1,6 м між сусідніми групами: шпилька (на стиках) або профіль (на кінцях)
    for a, b in zip(used, used[1:]):
        if fnd(a) != fnd(b) and LX[b] - LX[a] <= 1.6 and lag_at(a, y) and lag_at(b, y):
            thru = all(lag_at(j, y - 0.5) and lag_at(j, y + 0.5) for j in (a, b))      # обидві лаги тривають по обидва боки лінії
            kind = 'rod' if thru and any(t[2] == 'rod' for t in ties) else 'prof'
            PASS.append((y, a, b, kind)); par[fnd(a)] = fnd(b)
    comp = defaultdict(list)
    for j in used: comp[fnd(j)].append(j)
    for js in comp.values():
        xs = [LX[j] for j in js]
        if min(xs) < XC < max(xs): continue
        up = min(js, key=lambda j: abs(LX[j] - XC)); ANCH.append((y, up))
# деталі тяг
sleeves = set(); rods = []; profs = []; angles = []; m10x70 = set()
for y, ties in merged.items():
    for j0, j1, k in ties:
        if k == 'rod': rods.append((y, j0, j1, False)); sleeves.add((j0, y)); sleeves.add((j1, y))
        else: profs.append((y, j0, j1, False))
CUR['k'] = 'arch'
for y, a, b, k in PASS:
    if k == 'rod': rods.append((y, a, b, True)); sleeves.add((a, y)); sleeves.add((b, y))
    else: profs.append((y, a, b, True))
for j, y in splices:
    if not any(jj == j and abs(yy - y) < 0.05 for jj, yy in sleeves): sleeves.add((j, y))
HC = 0.0525                                     # вісь муфти і шпильки над покрівлею
for j, y in sleeves:
    x = LX[j]; n = nrm(x)
    k = kA(x); tg = [1 / math.hypot(1, k), 0, k / math.hypot(1, k)]
    part('slv', onroof(x, y, H_LB - 0.002 + 0.0185), YN, n); part('cpl', onroof(x, y, HC), tg, n)
for y, a, b, ps in rods:
    pa, pb = onroof(LX[a], y, HC), onroof(LX[b], y, HC)
    part('rod', [(pa[0] + pb[0]) / 2, y, (pa[2] + pb[2]) / 2], sub(pb, pa), [0, 0, 1], math.dist(pa, pb) - 0.026, ps=ps)
for y, a, b, ps in profs:
    pa, pb = onroof(LX[a], y, H_LC), onroof(LX[b], y, H_LC)
    d = unit(sub(pb, pa)); L = math.dist(pa, pb) - 0.062; mid = [(pa[0] + pb[0]) / 2, y, (pa[2] + pb[2]) / 2]
    nn = [-d[2], 0, d[0]]
    part('prof', mid, d, nn, L, ps=ps)
    iy = 1 if (lag_at(a, y + 0.5) or lag_at(b, y + 0.5)) and not (lag_at(a, y - 0.5) and lag_at(b, y - 0.5)) else -1   # у бік поля
    for s in (-1, 1):
        part('blkn', add(add(mid, d, s * 0.33), nn, -(H_LC - 0.03)), d, nn)
        if not ps: part('cz', add(add(mid, d, s * 0.30), nn, 0.0205 + 0.016), d, nn, side=0, fs=iy)   # fs — модуль з боку +Y (1) чи −Y (−1)
    for j, s in ((a, 1), (b, -1)):
        p0 = add(onroof(LX[j], y, H_LC), d, s * 0.0245); nj = nrm(LX[j])
        part('angP', add(add(p0, d, s * 0.075), [0, iy * 0.0245, 0]), [d[0] * s, 0, d[2] * s], nj, 0.15)   # полиця на грані профілю з боку поля
        part('angL', add(p0, [0, iy * (0.0205 + 0.08), 0]), [0, iy, 0], nj, 0.16)                        # полиця на грані лаги, від профілю в поле
        for e in (0.035, 0.115):                                                                         # 2 × M10×60 крізь кутник і профіль
            bolt(add(add(p0, d, s * (0.0045 + e)), [0, iy * 0.0005, 0]), [0, iy, 0], 60, 'ang')
        if (j, y) not in m10x70:                                                                         # M10×70 крізь кутник(и) і лагу
            bolt(add(onroof(LX[j], y + iy * 0.1005, H_LC), d, -s * 0.0045), [d[0] * s, 0, d[2] * s], 70, 'ang')
        m10x70.add((j, y))
    angles += [a, b]
Q['arch_slv'] = len(sleeves); Q['arch_rod'] = sum(1 for r in rods if not r[3]); Q['arch_rod_pass'] = sum(1 for r in rods if r[3])
Q['arch_rod_m'] = sum(math.dist(onroof(LX[a], y, 0), onroof(LX[b], y, 0)) - 0.026 for y, a, b, _ in rods)
Q['arch_prof'] = sum(1 for p in profs if not p[3]); Q['arch_prof_pass'] = sum(1 for p in profs if p[3])
Q['arch_prof_m'] = sum(math.dist(onroof(LX[a], y, 0), onroof(LX[b], y, 0)) - 0.062 for y, a, b, _ in profs)
Q['arch_ang'] = len(angles); Q['arch_m10x70'] = len(m10x70); Q['arch_m10x60a'] = 2 * len(angles)
Q['arch_blkn'] = 2 * len(profs); Q['arch_czp'] = 2 * sum(1 for p in profs if not p[3]); Q['arch_m10x60s'] = 2 * len(sleeves)
Q['arch_anchor'] = len(ANCH)
for y, j in ANCH:
    part('anc', onroof(LX[j] + (0.3 if LX[j] < XC else -0.3), y, 0.03), YN, nrm(LX[j]))
Q['arch_m8'] = Q['arch_blk'] + Q['arch_blkn']

# ================================================================== НИЖНІЙ ДАХ І НАДБУДОВА — «домік» і одиночні трикутники 15°
TILT = math.radians(15.36); DMD, HCD, TRI = 0.6851, 0.3076, 0.70
YLAG, YAP, HX, BE, YST0, YST1, YF, ZB = 0.0855, 0.4563, 1.35, 0.025, 0.111, 0.4763, 0.141, 0.0415
DBX = [-1.175, -0.165, 0.165, 1.175]
DROP = {(DBN['mods'][i]['src'], DBN['mods'][i]['i']) for i in DBN['drop']}
low = K1['low']; nad = K1['nad']['d6']
def pairs(lst, src, zr_of):
    """пари W+E навколо спільного гребеня («домік»); модуль без пари — одиночний трикутник"""
    by = defaultdict(dict)
    for i, m in enumerate(lst):
        if (src, i) in DROP or not m.get('used', True): continue
        ridge = round(m['xb'] if m['face'] == 'W' else m['xa'], 3)
        by[(ridge, round(m['y0'], 3))][m['face']] = (src, i, m)
    out = []
    for (ridge, y0), d in sorted(by.items()):
        zr = zr_of(next(iter(d.values()))[2])
        if 'W' in d and 'E' in d: out.append(('dom', ridge, y0, d, zr))
        else: out += [('one', ridge, y0, {f: v}, zr) for f, v in d.items()]
    return out
LOWS = pairs(low, 'low', lambda m: AL['h']) + pairs(nad, 'nad', lambda m: m['zr'])
def dom_tri(xr, yc, zr):
    """опора доміка (variant-domik): лага 2 750 уздовж X, балки з двох боків лаги, стійка посередині, П-кронштейн, 4 блоки з матом"""
    c = lambda s, h, dy=0.0: [xr + s, yc + dy, zr + h]
    part('dlag', c(0, YLAG), [1, 0, 0], UP, 2.75)
    for f in (-1, 1):                            # f = −1 — західна балка, +1 — східна; балка з боку лаги (зсув уздовж ряду f·ZB)
        a = c(f * (HX + BE * math.cos(TILT)), YLAG - BE * math.sin(TILT), f * ZB); b = c(-f * BE * math.cos(TILT), YAP + BE * math.sin(TILT), f * ZB)
        d = sub(b, a); nb = [-d[2], 0, d[0]] if d[0] > 0 else [d[2], 0, -d[0]]                 # паз балки догори, до панелі
        part('dbeam', [(a[i] + b[i]) / 2 for i in range(3)], d, nb, math.dist(a, b) + 0.05)
    part('dstrut', c(0, (YST0 + YST1) / 2), UP, [1, 0, 0], YST1 - YST0)
    part('dbrk', c(0, 0.106 + 0.0265), [1, 0, 0], UP)
    for x_, h_, z_, Ln in ((-HX, YLAG, -0.0275, 100), (HX, YLAG, 0.014, 100), (0, YAP, -0.006, 140), (0, YF, -0.0055, 65)):
        bolt(c(x_, h_, z_), YN, Ln, 'dfr')                       # 2 шарніри, вершина, низ стійки
    bolt(c(0, 0.081), UP, 60, 'dfr')                             # кронштейн до лаги, гайка під лагою
    for s in DBX:
        part('blk', c(s, 0.033), [1, 0, 0], UP, k='dom'); part('mat', c(s, 0.0015), [1, 0, 0], UP, k='dom')
def one_tri(xlag, dirx, yc, zr):
    """трикутник 15° модифікація Антарес (t1568/a/ant_15): lx — від нижнього торця лаги вгору по схилу, ly — висота, zc — поперек (вісь лаги 492), мм"""
    q = lambda lx, ly, zc=492.0: [xlag + dirx * lx / 1000, yc + (zc - 492.0) / 1000, zr + ly / 1000]
    part('slag', q(775, 83.5), [1, 0, 0], UP, 1.55)
    a, b = q(103, 127), q(1444, 503); d = sub(b, a); nb = [-d[2], 0, d[0]] if d[0] > 0 else [d[2], 0, -d[0]]
    part('sbeam', [(a[i] + b[i]) / 2 for i in range(3)], d, nb, 1.419)
    part('sstrut', q(1425, 289.5, 533.5), UP, [dirx, 0, 0], 0.4475)
    part('dbrk', q(121.5, 95), [dirx, 0, 0], UP)
    for lx, zc in ((125, 488.6), (1425, 486.6)): bolt(q(lx, 83.5, zc), YN, 60, 'sfr')       # шарнір кронштейна, низ стійки
    bolt(q(1425, 489.5, 486.6), YN, 60, 'sfr')                                              # верх стійки до балки
    sb, cb_ = math.sin(math.radians(15.66)), math.cos(math.radians(15.66))
    bolt(q(126.6, 124.6), [dirx * sb, 0, -cb_], 20, 'sfr')                                   # кронштейн до балки: голівка між вухами
    for lx in (25, 1525):
        part('blk', q(lx, 33), [1, 0, 0], UP, k='one'); part('mat', q(lx, 1.5), [1, 0, 0], UP, k='one')
CUR['k'] = 'dom'
NDOM = NONE = 0; dom_rows = defaultdict(list); one_rows = defaultdict(list)
for kind, ridge, y0, d, zr in LOWS:
    yc = y0 + LM / 2
    if kind == 'dom':
        NDOM += 1
        for f, face in ((-1, 'W'), (1, 'E')):
            src, i, m = d[face]; nn = [f * math.sin(TILT), 0, math.cos(TILT)]; CUR['k'] = 'dom'
            MODS['%s:%d' % (src, i)] = {'c': r4(add([ridge + f * DMD, yc, zr + HCD], nn, 0)), 'u': [0, 1, 0], 'n': r4(nn), 'x': r4([math.cos(TILT), 0, -f * math.sin(TILT)]), 'tilt': round(-f * math.degrees(TILT), 2)}
            for dy in (-TRI, TRI):                # 4 притиски на панель: на балках двох опор, нижній і верхній край
                for e in (-1, 1):
                    sc = f * DMD + f * e * DM / 2 * math.cos(TILT); h = HCD - e * DM / 2 * math.sin(TILT) + T / 2 + 0.006
                    part('ce', [ridge + sc, yc + dy + f * ZB, zr + h], [0, 1, 0], nn, k='dom', sd=-f * e, off=0)
        CUR['k'] = 'dom'
        for dy in (-TRI, TRI): dom_tri(ridge, yc + dy, zr)
        dom_rows[(ridge, zr)].append(yc)
    else:
        NONE += 1; CUR['k'] = 'one'
        face = next(iter(d)); src, i, m = d[face]
        f = 1 if face == 'E' else -1               # нахил: E — низ на сході, W — на заході
        xlo = (m['xb'] + 0.057) if face == 'E' else (m['xa'] - 0.057)   # нижній край рами — як у доміку з тим самим гребенем
        c15, s15 = math.cos(math.radians(15)), math.sin(math.radians(15))
        lo = [xlo, yc, zr + 0.166]; hi = [xlo - f * DM * c15, yc, zr + 0.166 + DM * s15]
        nn = [f * s15, 0, c15]; mid = [(lo[0] + hi[0]) / 2, yc, (lo[2] + hi[2]) / 2]
        MODS['%s:%d' % (src, i)] = {'c': r4(add(mid, nn, T / 2)), 'u': [0, 1, 0], 'n': r4(nn), 'x': r4(unit(sub(hi, lo))), 'tilt': round(-15.0 * f, 2)}
        xlag = xlo + f * 0.1392                    # нижній торець лаги — за 139 мм від нижнього краю рами (ant_15)
        for dy in (-TRI, TRI):
            one_tri(xlag, -f, yc + dy, zr)
            for pnt, e in ((lo, 1), (hi, -1)):
                part('ce', add([pnt[0], yc + dy, pnt[2]], nn, T + 0.006), [0, 1, 0], nn, k='one', sd=-f * e, off=0)
        one_rows[(round(xlag, 3), -f, zr)].append(yc)
# діагоналі вздовж ряду: від верху стійки однієї опори до низу стійки сусідньої (ОС-108, розріз Б-Б)
NDIAG_D = NDIAG_S = 0
CUR['k'] = 'dom'
for (ridge, zr), ycs in dom_rows.items():
    ycs.sort()
    for p, q in zip(ycs, ycs[1:]):
        if abs(q - p - PITCH) > 0.05: continue
        a = [ridge + 0.041, p + TRI + 0.03, zr + YAP - 0.06]; b = [ridge + 0.041, q - TRI - 0.03, zr + YF + 0.06]
        d = sub(b, a); part('ddiag', [(a[i] + b[i]) / 2 for i in range(3)], d, [1, 0, 0], math.dist(a, b)); NDIAG_D += 1
        for yy, pt in ((p + TRI, a), (q - TRI, b)): bolt([ridge + 0.015, yy, pt[2]], [1, 0, 0], 20, 'diag')   # у стійці (вісь стійки — центр опори)
CUR['k'] = 'one'
for (xlag, dirx, zr), ycs in one_rows.items():
    ycs.sort()
    for p, q in zip(ycs, ycs[1:]):
        if abs(q - p - PITCH) > 0.05: continue
        xs = xlag + dirx * 1.4665
        a = [xs, p + TRI + 0.02, zr + 0.161]; b = [xs, q - TRI - 0.02, zr + 0.411]
        d = sub(b, a); part('ddiag', [(a[i] + b[i]) / 2 for i in range(3)], d, [1, 0, 0], math.dist(a, b)); NDIAG_S += 1
        for yy, pt in ((p + TRI + 0.0415, a), (q - TRI + 0.0415, b)): bolt([xlag + dirx * 1.440, yy, pt[2]], [dirx, 0, 0], 20, 'diag')   # у стійці
Q.update(dom=NDOM, dom_tri=2 * NDOM, dom_pan=2 * NDOM, one=NONE, one_tri=2 * NONE, dom_diag=NDIAG_D, one_diag=NDIAG_S)

# ================================================================== СТІНИ — фасадні вузли
GAPW = 0.022; ZR_ = 0.119
s0, s1, s2, s3 = G['stair']; lad = G['ladder']
def fill(a, b, w):
    n = int((b - a + GAPW) // (w + GAPW)); st = a + (b - a - (n * (w + GAPW) - GAPW)) / 2; return [st + i * (w + GAPW) for i in range(n)]
zb = AL['h'] + 0.5
WG = [('P', AB['y0'], fill(AB['x0'] + 0.5, s0 - 0.5, DM)), ('P', AB['y0'], fill(max(s1 + 0.5, lad['x1'] + lad['clr']), AB['x1'] - 0.5, DM)), ('L', s2, fill(s0 + 0.2, s1 - 0.2, LM))]
wi = 0; WQ = defaultdict(int); CUR['k'] = 'wall'
for how, yw, xs in WG:
    w, h = (DM, LM) if how == 'P' else (LM, DM)
    yr = yw - ZR_ - 0.0205; ym = yw - 0.160 - T / 2
    for x in xs:
        MODS['wall:%d' % wi] = {'c': r4([x + w / 2, ym, zb + h / 2]), 'u': [0, 0, 1] if how == 'P' else [1, 0, 0], 'n': [0, -1, 0], 'x': [1, 0, 0] if how == 'P' else [0, 0, 1], 'tilt': 90, 'how': how, 'w': w, 'h': h}; wi += 1
        WQ['rope'] += 1; WQ['gnd'] += 1
    if how == 'P':                                   # спільні горизонтальні рейки на групу (як «Колонка»), 540 від торців модуля
        x0, x1 = xs[0] - 0.05, xs[-1] + w + 0.05; L = x1 - x0
        for z in (zb + 0.54, zb + h - 0.54):
            part('wrail', [(x0 + x1) / 2, yr, z], [1, 0, 0], [0, -1, 0], L); WQ['rail_m'] += L; WQ['rail_n'] += 1
            nb = math.ceil((L - 0.34) / 1.2) + 1
            for k in range(nb):
                xx = x0 + 0.17 + k * (L - 0.34) / (nb - 1); part('wbrk', [xx, yw - 0.06, z], [1, 0, 0], [0, -1, 0]); WQ['brk'] += 1
            part('ce', [xs[0] - 0.02, yw - 0.160 - T - 0.006, z], [0, 0, 1], [0, -1, 0], sd=1, off=0.02); part('ce', [xs[-1] + w + 0.02, yw - 0.160 - T - 0.006, z], [0, 0, 1], [0, -1, 0], sd=-1, off=0.02); WQ['ce'] += 2
            for x in xs[1:]: part('cm', [x - GAPW / 2, yw - 0.160 - T - 0.006, z], [0, 0, 1], [0, -1, 0]); WQ['cm'] += 1
    else:                                            # «Вертикально, альбомно»: на модуль 2 вертикальні рейки 1 400, 4 кронштейни, 4 притиски
        for x in xs:
            for xx in (x + 0.54, x + w - 0.54):
                part('wrail', [xx, yr, zb + h / 2], [0, 0, 1], [0, -1, 0], 1.40); WQ['rail_m'] += 1.40; WQ['rail_n'] += 1
                for dz in (-0.45, 0.45): part('wbrk', [xx, yw - 0.06, zb + h / 2 + dz], [0, 0, 1], [0, -1, 0]); WQ['brk'] += 1
                for z, sd in ((zb - 0.02, -1), (zb + h + 0.02, 1)): part('ce', [xx, yw - 0.160 - T - 0.006, z], [1, 0, 0], [0, -1, 0], sd=sd, off=0.02); WQ['ce'] += 1
Q.update({'wall_' + k: v for k, v in WQ.items()})

# ================================================================== вирівнювання потенціалів (як том 7 СЕС цеху): механічно зв'язані блоки, по 2 приєднання
TRAYS = [[tuple(pt) for pt in t['pts']] for t in DBN['trays'].values()]
def near_tray(q):
    best = (1e9, None)
    for pl in TRAYS:
        for a_, b_ in zip(pl, pl[1:]):
            d = [b_[i] - a_[i] for i in range(3)]; L2 = sum(c * c for c in d) or 1e-9
            t = max(0.0, min(1.0, sum((q[i] - a_[i]) * d[i] for i in range(3)) / L2)); pt = [a_[i] + d[i] * t for i in range(3)]
            dd = math.dist(q, pt)
            if dd < best[0]: best = (dd, pt)
    return best
class UF:
    def __init__(s_, n): s_.p = list(range(n))
    def f(s_, a_):
        while s_.p[a_] != a_: s_.p[a_] = s_.p[s_.p[a_]]; a_ = s_.p[a_]
        return a_
    def u(s_, a_, b_): s_.p[s_.f(a_)] = s_.f(b_)
def run_at(j, y):
    for i, rn in enumerate(runs):
        if rn['j'] == j and rn['ys'] - 0.2 <= y <= rn['ye'] + 0.2: return i
    return None
uf = UF(len(runs))
for y, ties in merged.items():
    for j0, j1, k in ties:
        a_, b_ = run_at(j0, y), run_at(j1, y)
        if a_ is not None and b_ is not None: uf.u(a_, b_)
for y, a0, b0, k in PASS:
    a_, b_ = run_at(a0, y), run_at(b0, y)
    if a_ is not None and b_ is not None: uf.u(a_, b_)
GROUPS = defaultdict(list)                       # назва → точки приєднання (на кріпленні)
for i, rn in enumerate(runs):
    x = LX[rn['j']]
    for y in (rn['ys'] + 0.3, (rn['ys'] + rn['ye']) / 2, rn['ye'] - 0.3): GROUPS['arch-%d' % uf.f(i)].append(onroof(x, y, H_LT - 0.02))
def chains(rows, key):
    for (k0, *rest), ycs in rows.items():
        ycs = sorted(ycs); cur = [ycs[0]]
        for yy in ycs[1:] + [None]:
            if yy is not None and abs(yy - cur[-1] - PITCH) < 0.05: cur.append(yy); continue
            yield k0, rest, cur
            if yy is not None: cur = [yy]
for ridge, (zr,), ycs in chains(dom_rows, 'dom'):
    for yc in ycs:
        for dy in (-TRI, TRI): GROUPS['dom-%.2f-%.2f-%.2f' % (ridge, zr, ycs[0])].append([ridge, yc + dy, zr + YLAG + 0.02])
for xlag, (dirx, zr), ycs in chains(one_rows, 'one'):
    for yc in ycs:
        for dy in (-TRI, TRI): GROUPS['one-%.2f-%.2f' % (xlag, ycs[0])].append([xlag + dirx * 0.775, yc + dy, zr + 0.104])
for gi, (how, yw, xs) in enumerate(WG):
    w, h = (DM, LM) if how == 'P' else (LM, DM)
    for x in xs: GROUPS['wall-%d' % gi].append([x + w / 2, yw - ZR_ - 0.0205, zb + 0.54])
BOND = []
for g, pts in GROUPS.items():
    cand = sorted(((near_tray(q), q) for q in pts), key=lambda z: z[0][0])
    first = cand[0]                                   # друге приєднання — найближча до лотка точка іншої деталі блоку (≥ 1 м від першої)
    far = [c for c in cand[1:] if math.dist(first[1], c[1]) >= 1.0] or cand[1:2] or cand[:1]
    second = min(far, key=lambda z: z[0][0])
    con = []
    for (dd, tp), q in (first, second):
        path = [q, [q[0], q[1], max(tp[2], q[2] - 0.08)], [tp[0], tp[1], tp[2]]] if g.startswith('wall') else [q, [tp[0], tp[1], tp[2] + 0.02]]
        L = sum(math.dist(a_, b_) for a_, b_ in zip(path, path[1:])) + 1.0
        con.append({'len': round(L, 1), 'pts': [r4(p_) for p_ in path]})
    BOND.append({'g': g, 'n': len(pts), 'con': con})
TRAY_LEN = DBN['tray_len']
Q['bond_groups'] = len(BOND); Q['bond_con'] = 2 * len(BOND)
Q['bond6'] = round(TRAY_LEN * 1.1 + sum(c['len'] for b_ in BOND for c in b_['con']), 1)

# ================================================================== AC: інвертор → лоток → підвіс СІП-4 4×70 через проїзд → ТП-5913 (рішення власника 28.10, 21:58)
IV = DBN['inv']['pos']; TRK = DBN['trays']
p_pass, p_wall = TRK['pass']['pts'], TRK['wallW']['pts']
XA, YA = AL['x0'], 20.0                            # гак на західній стіні південного блоку АБК
TPX = 103.0                                        # східна стіна ТП-5913 (двійник: X 96,64…103,0)
hookA, hookB = [XA - 0.05, YA, AL['h'] + 0.25], [TPX + 0.05, YA, 4.0]
def off(pl, dx, dy, dz): return [[p_[0] + dx, p_[1] + dy, p_[2] + dz] for p_ in pl]
sip_roof = [[IV['x'] + IV['w'] / 2 - 0.05, IV['y'] + 0.06, IV['z0'] + 0.15], [IV['x'] + IV['w'] / 2 - 0.05, IV['y'] + 0.12, 10.2]] \
    + off([p_pass[0], p_pass[-1]], -0.03, 0, 0.03) + off([p_wall[1], p_wall[0]], 0, -0.03, 0.03) \
    + [[AL['x0'] + 0.32, YA + 0.09, AL['h'] + 0.18], [AL['x0'] + 0.32, YA + 0.09, AL['h'] + 0.62], [AL['x0'] - 0.08, YA + 0.09, AL['h'] + 0.62], [AL['x0'] - 0.06, YA, hookA[2] + 0.05]]
NS = 12; SAG = 0.12
span = [[hookA[0] + (hookB[0] - hookA[0]) * t, YA, hookA[2] + (hookB[2] - hookA[2]) * t - 4 * SAG * t * (1 - t)] for t in [i / NS for i in range(NS + 1)]]
sip_tp = [[TPX + 0.06, YA, 3.95], [TPX + 0.06, YA, 2.6], [TPX - 0.45, YA, 2.6], [TPX - 0.45, YA, 1.95]]
BOARD = [TPX - 0.45, YA, 1.6]; GZSH = [TPX - 0.35, YA - 0.6, 0.45]
dist = lambda pl: sum(math.dist(a_, b_) for a_, b_ in zip(pl, pl[1:]))
L_sip = dist(sip_roof) + dist(span) + dist(sip_tp) + 1.0           # +1,0 м на розробку кінців
pe = off(sip_roof, 0.04, -0.04, -0.01) + off(span, 0, -0.05, -0.04) + [[TPX + 0.06, YA - 0.05, 3.9], [TPX + 0.06, YA - 0.05, 2.55], [TPX - 0.35, YA - 0.05, 2.55], GZSH]
L_pe = dist(pe) + 1.0
BRK = [[XA - 0.06, YA, AL['h'] + 0.45]] + [[TPX + 0.07, YA, z] for z in (3.5, 3.05, 2.65)]
AC = {'sip': [r4(p_) for p_ in sip_roof], 'span': [r4(p_) for p_ in span], 'tp': [r4(p_) for p_ in sip_tp], 'pe': [r4(p_) for p_ in pe], 'hooks': [r4(hookA), r4(hookB)],
      'brk': [r4(p_) for p_ in BRK], 'board': r4(BOARD), 'gzsh': r4(GZSH), 'len': round(L_sip, 1), 'pe_len': round(L_pe, 1), 'span_len': round(dist(span), 1)}
Q.update(sip_m=round(L_sip, 1), pe16_m=round(L_pe, 1), sip_span=AC['span_len'], sip_hooks=2, sip_clamps=2, sip_brk=len(BRK))

# ================================================================== кількості
for t in ('blk', 'mat'): Q['n_' + t] = len(P[t])
Q['n_blkn'] = len(P['blkn'])
for t in ('blk', 'ce', 'dbrk', 'mat'):
    for g in ('arch', 'dom', 'one', 'wall'): Q[f'{g}_{t}'] = sum(1 for p in P[t] if p['k'] == g)
out = {'note': 'mount.py 28.10.2026: кріплення за «Елементи SES»', 'mods': MODS, 'parts': P, 'q': {k: (round(v, 3) if isinstance(v, float) else v) for k, v in sorted(Q.items())},
       'lagx': {str(j): round(x, 4) for j, x in LX.items()}, 'bond': BOND, 'ac': AC, 'anch': [[round(y, 3), j] for y, j in ANCH], 'pass': [[round(y, 3), a, b, k] for y, a, b, k in PASS]}
json.dump(out, open(os.path.join(HERE, 'abk_mount.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(json.dumps(out['q'], ensure_ascii=False, indent=0))
print('parts', {k: len(v) for k, v in P.items()}, 'mods', len(MODS))
print('anchors', out['anch']); print('pass', out['pass'])
