# -*- coding: utf-8 -*-
"""Надбудова сходів АБК: чи ставити модулі на трикутниках 15° на південь (аналіз 28.10, 13:41).
Модель — як у K1 (calc/v3/abk.py): Meteonorm 8.1, крок 10 хв, горизонт 72 напрями, DSM 0,25 м, байпас-діоди.
Геометрія надбудови — як у 3D-моделі 28.10: 116,3–121,5; пн. частина 13,95–17,8, покрівля +13,0, парапет +13,3;
пд. частина 8,0–13,95, покрівля +11,95, парапет +12,25 (без парапету з боку вищої частини); парапет 0,38 × 0,3 м."""
import os, sys, json, math, numpy as np
os.environ['TILT'] = '13'
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
L.build_dsm('V1')
H, XX, YY, box = L.H, L.XX, L.YY, L.box
J = json.load(open('/home/claude/galkat-20/antares/abk/abk_k1.json')); G = J['geo']
AL, AB = G['AL'], G['AB']
XC, HW = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
zA = lambda x: AB['h'] + AB['f'] * np.clip(1 - ((np.asarray(x) - XC) / HW) ** 2, 0, 1)
def put(m, v): H[m] = np.maximum(H[m], v[m] if np.ndim(v) else v)
S0, S1, S2, S3, SPLIT, WT, PARH = 116.3, 121.5, 8.0, 17.8, 13.95, 0.38, 0.3
ZN, ZS = 13.0, 11.95                                  # покрівля пн. і пд. частин
H[box(108.0, 128.3, 6.3, 45.5)] = 0
put(box(AL['x0'], AL['x1'], AL['y0'], AL['y1']), np.float32(AL['h']))
for b in [(AL['x0'], AL['x1'], AL['y0'], AL['y0'] + 0.25), (AL['x0'], AL['x0'] + 0.25, AL['y0'], AL['y1']), (AL['x1'] - 0.25, AL['x1'], AL['y0'], AL['y1'])]:
    put(box(*b), np.float32(AL['h'] + G['par']['lo']))
put(box(S0, S1, S2, SPLIT), np.float32(ZS)); put(box(S0, S1, SPLIT, S3), np.float32(ZN))
for b in [(S0, S1, S2, S2 + WT), (S0, S0 + WT, S2, SPLIT), (S1 - WT, S1, S2, SPLIT)]: put(box(*b), np.float32(ZS + PARH))
for b in [(S0, S1, SPLIT, SPLIT + WT), (S0, S1, S3 - WT, S3), (S0, S0 + WT, SPLIT, S3), (S1 - WT, S1, SPLIT, S3)]: put(box(*b), np.float32(ZN + PARH))
ZAB = zA(XX).astype(np.float32); put(box(AB['x0'], AB['x1'], AB['y0'], AB['y1']), ZAB)
put(box(AB['x0'], AB['x0'] + 0.25, AB['y0'], AB['y1']), np.float32(AB['h'] + G['par']['w'])); put(box(AB['x1'] - 0.25, AB['x1'], AB['y0'], AB['y1']), np.float32(AB['h'] + G['par']['e']))
put(box(AB['x0'], AB['x1'], AB['y0'], AB['y0'] + 0.25), ZAB + G['par']['g']); put(box(AB['x0'], AB['x1'], AB['y1'] - 0.25, AB['y1']), ZAB + G['par']['g'])
for x, y, r, h, *_ in G['vents']: put((XX - x) ** 2 + (YY - y) ** 2 <= r ** 2, np.float32(float(zA(x)) + h))
for x, y, dx, dy, h in G['boxes']: put(box(x - dx / 2, x + dx / 2, y - dy / 2, y + dy / 2), np.float32(float(zA(x)) + h))
H_BASE = H.copy()
LM, DM, GAP, PW = 2.384, 1.303, 0.022, L.PW
HLOW = 0.15                                           # низ модуля над покрівлею, як у K1 (ГалКат 15°)
def tri(xs, ys, zb, orient, tilt=15.0):
    """модулі на трикутниках на південь; xs — лівий край кожного модуля, ys — південний край кожного ряду"""
    t = math.radians(tilt); slope = DM if orient == 'L' else LM; wx = LM if orient == 'L' else DM
    dep, rise = slope * math.cos(t), slope * math.sin(t); n = np.array([0, -math.sin(t), math.cos(t)]); out = []
    for y0 in ys:
        for x0 in xs:
            xm = x0 + wx / 2
            pts = [(xm, y0 + f * dep, zb + HLOW + f * rise + 0.05) for f in (0.17, 0.5, 0.83)]
            out.append(dict(x0=x0, x1=x0 + wx, y0=y0, y1=y0 + dep, zb=zb, n=n, pts=pts, tg=math.tan(t), how=orient, tilt=tilt))
    return out
def row_x(orient, k):
    wx = LM if orient == 'L' else DM; w = k * wx + (k - 1) * GAP; a = S0 + WT + (S1 - S0 - 2 * WT - w) / 2
    return [a + i * (wx + GAP) for i in range(k)]
MG = 0.30                                             # прохід уздовж парапету / стіни вищої частини
def variant(orient, rowsN, rowsS, tilt=15.0):
    t = math.radians(tilt); dep = (DM if orient == 'L' else LM) * math.cos(t); k = 1 if orient == 'L' else 3
    yN = [S3 - WT - MG - dep] if rowsN else []                                    # один ряд, притиснутий на північ
    yS = []
    if rowsS == 1: yS = [SPLIT - MG - dep]
    elif rowsS == 2: yS = [S2 + WT + MG, SPLIT - MG - dep]
    return tri(row_x(orient, k), yN, ZN, orient, tilt) + tri(row_x(orient, k), yS, ZS, orient, tilt)
def dsm_add(M):
    for m in M: put(box(m['x0'], m['x1'], m['y0'], m['y1']), (m['zb'] + HLOW + (YY - m['y0']) * m['tg'] + 0.04).astype(np.float32))
# ---------- існуючі модулі, яким надбудова може затінити: нижній дах (K1, 33) і вертикальні на південних стінах (9)
DEP15, RISE15 = DM * math.cos(math.radians(15)), DM * math.sin(math.radians(15))
EX = []
for m in J['low']:
    if not m['used']: continue
    sg = -1 if m['face'] == 'W' else 1; lo = m['lo']; n = np.array([sg * math.sin(math.radians(15)), 0, math.cos(math.radians(15))])
    EX.append(dict(g='low', face=m['face'], n=n, pts=[(lo - sg * f * DEP15, (m['y0'] + m['y1']) / 2, AL['h'] + G['hlow'] + f * RISE15 + 0.05) for f in (0.17, 0.5, 0.83)]))
def fill(a, b, w):
    n = int((b - a + GAP) // (w + GAP)); st = a + (b - a - (n * (w + GAP) - GAP)) / 2; return [st + i * (w + GAP) for i in range(n)]
zb = AL['h'] + 0.5; ns = np.array([0, -1.0, 0])
for x in fill(AB['x0'] + 0.5, S0 - 0.5, DM) + fill(max(S1 + 0.5, G['ladder']['x1'] + G['ladder']['clr']), AB['x1'] - 0.5, DM):
    EX.append(dict(g='wallA', face='S', n=ns, pts=[(x + DM / 2, AB['y0'] - 0.16, zb + f * LM) for f in (0.17, 0.5, 0.83)]))
for x in fill(S0 + 0.2, S1 - 0.2, LM):
    EX.append(dict(g='wallN', face='S', n=ns, pts=[(x + LM / 2, S2 - 0.16, zb + f * DM) for f in (0.17, 0.5, 0.83)]))
def run(M):
    P = np.array([p for m in M for p in m['pts']]); N = np.array([m['n'] for m in M]); ST, I = L.run_steps(P, N); return ST, L.mod_kwh(ST, len(M)), I
out = {}
H[:] = H_BASE; st0, e0, _ = run(EX)
out['base'] = dict(low=float(e0[[i for i, m in enumerate(EX) if m['g'] == 'low']].sum()), wall=float(e0[[i for i, m in enumerate(EX) if m['g'] != 'low']].sum()), n_low=sum(m['g'] == 'low' for m in EX), n_wall=sum(m['g'] != 'low' for m in EX))
print('база: нижній дах', round(out['base']['low'] / 1000, 2), 'МВт·год,', out['base']['n_low'], 'мод.; стіни', round(out['base']['wall'] / 1000, 2), out['base']['n_wall'])
VARS = [('T', 'Стандартний трикутник 15° (1303 по ухилу): пн. 1 ряд, пд. 2 ряди', 'L', 1, 2, 15),
        ('P1', 'Книжково 15° (2384 по ухилу), по 3 в ряд: пн. 1 ряд, пд. 1 ряд', 'P', 1, 1, 15),
        ('P2', 'Книжково 15°, по 3 в ряд: пн. 1 ряд, пд. 2 ряди', 'P', 1, 2, 15),
        ('P1_30', 'Книжково 30°, по 3 в ряд: пн. 1 ряд, пд. 1 ряд (довідково)', 'P', 1, 1, 30)]
for key, name, orient, rn, rs, tilt in VARS:
    M = variant(orient, rn, rs, tilt)
    H[:] = H_BASE; dsm_add(M)                                     # модулі надбудови в DSM — тінь і на себе (ряди), і на сусідів
    st, e, I = run(M); H[:] = H_BASE; dsm_add(M); _, e1, _ = run(EX)
    H[:] = H_BASE; _, eun, _ = (lambda r: r)(run(M))              # без власних рядів у DSM — для оцінки взаємного затінення
    part = ['N' if m['zb'] == ZN else 'S' for m in M]
    res = dict(name=name, n=len(M), kwp=round(len(M) * PW, 2), mwh=round(float(e.sum()) / 1000, 3), y=round(float(e.sum()) / len(M) / PW),
               per=[round(float(x)) for x in e], part=part, irr=[round(float(x)) for x in I], rows_loss=round((1 - float(e.sum()) / float(eun.sum())) * 100, 1),
               low_d=round(float((e1 - e0)[[i for i, m in enumerate(EX) if m['g'] == 'low']].sum())), wall_d=round(float((e1 - e0)[[i for i, m in enumerate(EX) if m['g'] != 'low']].sum())),
               mods=[dict(x0=round(m['x0'], 3), x1=round(m['x1'], 3), y0=round(m['y0'], 3), y1=round(m['y1'], 3), zb=m['zb'], how=m['how'], tilt=m['tilt']) for m in M])
    # стрінг 11: 9 вертикальних на стінах + 2 найкращі з надбудови
    if len(M) >= 2:
        H[:] = H_BASE; dsm_add(M); ALL = EX + M; stA, eA, _ = run(ALL)
        wi = [i for i, m in enumerate(ALL) if m.get('g') in ('wallA', 'wallN')]; ni = sorted(range(len(EX), len(ALL)), key=lambda i: -eA[i])[:2]
        es, es0, _ = L.string_energy(stA, wi + ni); res['str11'] = dict(mwh=round(es / 1000, 3), mism=round((1 - es / es0) * 100, 1), sep=round(float(eA[wi + ni].sum()) / 1000, 3))
    out[key] = res
    print(f"{key}: {name}\n   {res['n']} мод., {res['kwp']} кВтп, {res['mwh']} МВт·год, {res['y']} кВт·год/кВтп; по модулях {res['per']} ({''.join(part)}); тінь рядів {res['rows_loss']} %;"
          f" втрати сусідів: нижній дах {res['low_d']} кВт·год, стіни {res['wall_d']} кВт·год; стрінг 9+2: {res.get('str11')}")
H[:] = H_BASE
json.dump(out, open('nad.json', 'w'), ensure_ascii=False)
