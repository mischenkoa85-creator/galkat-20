# -*- coding: utf-8 -*-
"""Дах адмінкорпусу (АБК) Антарес: карта радіації 0,5 м і варіанти розкладки модулів (27.10.2026, 21:44 — запит власника).
Геометрія — як у двійнику (src/fasad.js): план за супутником Google 27.10 (±0,5 м), висоти — оцінка за поверхами (рулеткою не міряно):
  південний блок АЛ 108,3–127,5 × 6,6–20,3 м, плаский дах +10,0, парапети 0,5 м (Пд, Зх, Сх), надбудова сходів 116,3–121,5 × 8,0–17,8, верх +12,6;
  основний блок АБ 108,5–128,0 × 20,3–45,2 м, арка вздовж Пн–Пд: карниз +13,2, стріла 1,3 м; парапети: зх 0,5, сх 0,7, торці 0,5 над аркою;
  5 круглих вентшахт Ø1,2 (висота 0,74), високий вентвихід 0,6 × 0,7 × 1,5, низький 0,9 × 0,6 × 0,45.
Тіні: цех на заході (з ліхтарями, перебудованими на каркас 13° — план 27.10), ТП-5913, контейнери УЗЕ, власні парапети, надбудова, вентшахти,
а для трикутників — сусідні ряди модулів (додаються в DSM). Модель — та сама, що для даху цеху (Meteonorm 8.1, крок 10 хв, горизонт 72 напрями,
DSM 0,25 м, U 20, втрати 13,2 %, модель байпас-діодів у стрінгах).
Варіанти:
  арка: «по даху, як на цеху» (модуль вертикально, довгою стороною вздовж арки, на лагах 0,12 м) або трикутники 15° на південь, кожен модуль окремо по дузі;
  нижній дах: трикутники 15° на південь (крок рядів 2,1 м, як у РП), «домік» схід–захід 15°, або плоско 0° (довідково).
Відступи: 0,5 м від парапетів (ринви з водою біля парапетів — фото 27.10), 0,3 м навколо вентшахт і вентвиходів, 1,0 м навколо надбудови сходів (вихід на дах).
→ v3/abk.json"""
import os, sys, json, math, collections, numpy as np
os.environ['TILT'] = '13'
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
V = L.V; LM, DM, GAP = L.LM, L.DM, L.GAP; PW = L.PW
L.build_dsm('V1')                                   # ліхтарі цеху — на каркасі 13° (план 27.10); на АБК майже не впливає
H, XX, YY, box = L.H, L.XX, L.YY, L.box
AL = dict(x0=108.3, x1=127.5, y0=6.6, y1=20.3, h=10.0); AB = dict(x0=108.5, x1=128.0, y0=20.3, y1=45.2, h=13.2, f=1.3)
XC, HW = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
zA = lambda x: AB['h'] + AB['f'] * np.clip(1 - ((np.asarray(x) - XC) / HW) ** 2, 0, 1)
dzA = lambda x: -2 * AB['f'] * (x - XC) / HW ** 2
STAIR = (116.3, 121.5, 8.0, 17.8); ZST = 12.6
VENTS = [(111.4, 40.4), (120.8, 40.4), (116.6, 27.8), (119.6, 21.9), (122.2, 21.9)]; VR, VH = 0.6, 0.74
BOXES = [(116.8, 42.3, 0.6, 0.7, 1.5), (118.0, 43.0, 0.9, 0.6, 0.45)]      # x, y, dx, dy, h над аркою
PAR_LO, PAR_W, PAR_E, PAR_G = 0.5, 0.5, 0.7, 0.5
MRG, MV, MST = 0.5, 0.3, 1.0
def put(m, v): H[m] = np.maximum(H[m], v[m] if np.ndim(v) else v)
# ---------- DSM АБК (замість коробок у roof_v3.py)
H[box(108.0, 128.3, 6.3, 45.5)] = 0
ZL = np.float32(AL['h']); put(box(AL['x0'], AL['x1'], AL['y0'], AL['y1']), ZL)
for b in [(AL['x0'], AL['x1'], AL['y0'], AL['y0'] + 0.25), (AL['x0'], AL['x0'] + 0.25, AL['y0'], AL['y1']), (AL['x1'] - 0.25, AL['x1'], AL['y0'], AL['y1'])]:
    put(box(*b), np.float32(AL['h'] + PAR_LO))
put(box(*STAIR), np.float32(ZST))
ZAB = zA(XX).astype(np.float32); put(box(AB['x0'], AB['x1'], AB['y0'], AB['y1']), ZAB)
put(box(AB['x0'], AB['x0'] + 0.25, AB['y0'], AB['y1']), np.float32(AB['h'] + PAR_W)); put(box(AB['x1'] - 0.25, AB['x1'], AB['y0'], AB['y1']), np.float32(AB['h'] + PAR_E))
put(box(AB['x0'], AB['x1'], AB['y0'], AB['y0'] + 0.25), ZAB + PAR_G); put(box(AB['x0'], AB['x1'], AB['y1'] - 0.25, AB['y1']), ZAB + PAR_G)
for x, y in VENTS: put((XX - x) ** 2 + (YY - y) ** 2 <= VR ** 2, np.float32(float(zA(x)) + VH))
for x, y, dx, dy, h in BOXES: put(box(x - dx / 2, x + dx / 2, y - dy / 2, y + dy / 2), np.float32(float(zA(x)) + h))
H_ABK = H.copy()
# ---------- карта радіації 0,5 м (площина покрівлі; нижній дах — горизонталь)
mp = []
for x in np.arange(AL['x0'] + 0.25 + 0.25, AL['x1'] - 0.25, 0.5):
    for y in np.arange(AL['y0'] + 0.25 + 0.25, AL['y1'], 0.5):
        if STAIR[0] - 0.1 <= x <= STAIR[1] + 0.1 and STAIR[2] - 0.1 <= y <= STAIR[3] + 0.1: continue
        mp.append((x, y, AL['h'] + 0.1, 0.0, 'L'))
for x in np.arange(AB['x0'] + 0.25 + 0.25, AB['x1'] - 0.25, 0.5):
    for y in np.arange(AB['y0'] + 0.25 + 0.25, AB['y1'] - 0.25, 0.5):
        if any((x - vx) ** 2 + (y - vy) ** 2 <= (VR + 0.1) ** 2 for vx, vy in VENTS): continue
        if any(abs(x - bx) <= dx / 2 + 0.1 and abs(y - by) <= dy / 2 + 0.1 for bx, by, dx, dy, h in BOXES): continue
        mp.append((x, y, float(zA(x)) + 0.1, float(dzA(x)), 'A'))
P = np.array([(a, b, c) for a, b, c, d, e in mp]); N = np.array([(-d, 0, 1) for a, b, c, d, e in mp], float); N /= np.linalg.norm(N, axis=1)[:, None]
_, I = L.run_steps(P, N, k=1)
L.horizon_ = L.horizon; L.horizon = lambda P_: np.zeros((len(P_), L.NA), np.float32); _, I0 = L.run_steps(P, N, k=1); L.horizon = L.horizon_
MAP = [[round(a, 2), round(b, 2), e, round(float(I[i]), 1), round(float(I0[i]), 1)] for i, (a, b, c, d, e) in enumerate(mp)]
print('map', len(MAP), 'L', np.mean([m[3] for m in MAP if m[2] == 'L']).round(1), 'A', np.mean([m[3] for m in MAP if m[2] == 'A']).round(1))
# ---------- варіанти
TG = math.radians(15); C15, S15, T15 = math.cos(TG), math.sin(TG), math.tan(TG)
DEP = DM * C15; RISE = DM * S15; HLOW = 0.15                  # трикутник 15°: модуль 1303 по ухилу, нижній край ≈0,15 м над покрівлею (оцінка за ГалКат 15°)
PITCH = 2.1                                                  # крок рядів трикутників — як у РП (план покрівлі ≈2 100 мм)
def hits_obst(x0, x1, y0, y1, low):
    if low:
        return x0 < STAIR[1] + MST and STAIR[0] - MST < x1 and y0 < STAIR[3] + MST and STAIR[2] - MST < y1
    for vx, vy in VENTS:
        dx = max(x0 - vx, 0, vx - x1); dy = max(y0 - vy, 0, vy - y1)
        if dx * dx + dy * dy < (VR + MV) ** 2: return True
    return any(x0 < bx + dx / 2 + MV and bx - dx / 2 - MV < x1 and y0 < by + dy / 2 + MV and by - dy / 2 - MV < y1 for bx, by, dx, dy, h in BOXES)
def segs(lo, hi, w, pitch):
    n = int((hi - lo + (pitch - w)) // pitch); s = lo + (hi - lo - (n * pitch - (pitch - w))) / 2; return [s + i * pitch for i in range(n)]
# --- арка, «по даху» (як на цеху): колонки по дузі, модуль вертикально (2384 уздовж Пн–Пд)
def arch_flush():
    xs = np.linspace(AB['x0'] + 0.25 + MRG, AB['x1'] - 0.25 - MRG, 4001); sl = np.concatenate([[0], np.cumsum(np.hypot(np.diff(xs), np.diff(zA(xs))))])
    S_ = sl[-1]; ncol = int((S_ + GAP) // (DM + GAP)); s0 = (S_ - (ncol * (DM + GAP) - GAP)) / 2
    ys = segs(AB['y0'] + 0.25 + MRG, AB['y1'] - 0.25 - MRG, LM, LM + GAP)
    out = []
    for j in range(ncol):
        a, b = s0 + j * (DM + GAP), s0 + j * (DM + GAP) + DM; xa, xb = np.interp(a, sl, xs), np.interp(b, sl, xs); za, zb = float(zA(xa)), float(zA(xb))
        k = (zb - za) / (xb - xa); xm, zm = (xa + xb) / 2, (za + zb) / 2; n = np.array([-k, 0, 1.0]); n /= np.linalg.norm(n)
        for y in ys:
            if hits_obst(xa, xb, y, y + LM, False): continue
            pts = [(xm, y + LM / 2 + t, zm + 0.12 + 0.033 + 0.03) for t in (-0.892, 0.0, 0.888)]
            out.append(dict(part='A', how='flush', x0=xa, x1=xb, y0=y, y1=y + LM, n=n, pts=pts, face='E' if k < 0 else 'W', tilt=math.degrees(math.atan(abs(k))), col=j))
    return out, None
# --- трикутники 15° на південь, модуль горизонтально (2384 уздовж Сх–Зх); на арці — кожен модуль окремо, нахилений разом з дугою
def south(part):
    if part == 'L':
        x0, x1, y0, y1 = AL['x0'] + 0.25 + MRG, AL['x1'] - 0.25 - MRG, AL['y0'] + 0.25 + MRG, AL['y1'] - MRG
    else:
        x0, x1, y0, y1 = AB['x0'] + 0.25 + MRG, AB['x1'] - 0.25 - MRG, AB['y0'] + 0.25 + MRG, AB['y1'] - 0.25 - MRG
    rows = [y0 + i * PITCH for i in range(int((y1 - y0 - DEP) // PITCH) + 1)]
    out = []
    for r, yl in enumerate(rows):
        # сегменти ряду, вільні від перешкод
        cand = []
        if part == 'L' and yl < STAIR[3] + MST and STAIR[2] - MST < yl + DEP:
            for a, b in ((x0, STAIR[0] - MST), (STAIR[1] + MST, x1)): cand += segs(a, b, LM, LM + GAP)
        else: cand = segs(x0, x1, LM, LM + GAP)
        for xa in cand:
            xb = xa + LM; xm = (xa + xb) / 2
            if part == 'A' and hits_obst(xa, xb, yl, yl + DEP, False): continue
            zb_ = AL['h'] if part == 'L' else float(zA(xm)); kx = 0.0 if part == 'L' else float(dzA(xm)); ph = -math.atan(kx)
            n = np.array([C15 * math.sin(ph), -S15, C15 * math.cos(ph)])
            pts = [(xm, yl + f * DEP, zb_ + HLOW + f * RISE + 0.05) for f in (0.17, 0.5, 0.83)]
            out.append(dict(part=part, how='south', x0=xa, x1=xb, y0=yl, y1=yl + DEP, n=n, pts=pts, face='S', tilt=15.0, row=r, zb=zb_, kx=kx, xm=xm))
    def dsm():
        for m in out:
            mm = box(m['x0'], m['x1'], m['y0'], m['y1'])
            put(mm, (m['zb'] + m['kx'] * (XX - m['xm']) + HLOW + (YY - m['y0']) * T15).astype(np.float32))
    return out, dsm
# --- «домік» схід–захід 15° на нижньому даху: гребінь уздовж Пн–Пд, модуль горизонтально (1303 по ухилу), пара + прохід 0,4 м
def ew():
    x0, x1, y0, y1 = AL['x0'] + 0.25 + MRG, AL['x1'] - 0.25 - MRG, AL['y0'] + 0.25 + MRG, AL['y1'] - MRG
    ys = segs(y0, y1, LM, LM + GAP); out = []; PAIR = 2 * DEP; PP = PAIR + 0.4
    for a, b in ((x0, STAIR[0] - MST), (STAIR[1] + MST, x1)):
        npr = int((b - a + 0.4) // PP); rem = (b - a) - (npr * PP - 0.4); one = rem >= 0.4 + DEP
        st = a + (rem - (0.4 + DEP if one else 0)) / 2
        sl = [(st + i * PP, 'W') for i in range(npr)] + [(st + i * PP + DEP, 'E') for i in range(npr)]
        if one: sl.append((st + npr * PP, 'E'))                       # ще один схил на схід
        for xa, fc in sl:
            xb = xa + DEP; sg = -1 if fc == 'W' else 1; n = np.array([sg * S15, 0, C15]); lo = xa if fc == 'W' else xb
            for y in ys:
                pts = [(lo - sg * f * DEP, y + LM / 2, AL['h'] + HLOW + f * RISE + 0.05) for f in (0.17, 0.5, 0.83)]
                out.append(dict(part='L', how='ew', x0=xa, x1=xb, y0=y, y1=y + LM, n=n, pts=pts, face=fc, tilt=15.0, low=lo, sg=sg, col=round(xa, 2)))
    def dsm():
        for m in out:
            mm = box(m['x0'], m['x1'], m['y0'], m['y1'])
            put(mm, (AL['h'] + HLOW + np.abs(XX - m['low']) * T15).astype(np.float32))
    return out, dsm
# --- плоско 0° на нижньому даху (довідково): модуль вертикально на лагах, як на цеху
def flat0():
    x0, x1, y0, y1 = AL['x0'] + 0.25 + MRG, AL['x1'] - 0.25 - MRG, AL['y0'] + 0.25 + MRG, AL['y1'] - MRG
    ys = segs(y0, y1, LM, LM + GAP); out = []
    for a, b in ((x0, STAIR[0] - MST), (STAIR[1] + MST, x1)):
        for xa in segs(a, b, DM, DM + GAP):
            for y in ys:
                pts = [(xa + DM / 2, y + LM / 2 + t, AL['h'] + 0.12 + 0.033 + 0.03) for t in (-0.892, 0.0, 0.888)]
                out.append(dict(part='L', how='flat', x0=xa, x1=xa + DM, y0=y, y1=y + LM, n=np.array([0, 0, 1.0]), pts=pts, face='H', tilt=0.0))
    return out, None
# ---------- енергія, стрінги по 11
def strings(M, E):
    """стрінги по 11 у межах однієї орієнтації (бік і клас нахилу), змійкою по колонках; залишки однієї орієнтації об'єднуємо; що не набирає 11 — не ставимо (найслабші)."""
    grp = collections.defaultdict(list)
    for i, m in enumerate(M):
        if m['how'] == 'flush': key = m['face'] + ('<5' if m['tilt'] < 5 else '5-10' if m['tilt'] < 10 else '>10')
        elif m['how'] == 'south' and m['part'] == 'A':                       # на арці модуль нахилений разом з дугою — групуємо за боком і ухилом дуги
            r_ = math.degrees(math.atan(abs(m['kx']))); key = 'S' + ('E' if m['kx'] < 0 else 'W') + ('<5' if r_ < 5 else '5-10' if r_ < 10 else '>10')
        else: key = m['face']
        grp[key].append(i)
    S_ = []; left = collections.defaultdict(list)
    for key, ii in grp.items():
        ii = sorted(ii, key=lambda i: (M[i].get('col', M[i].get('row', 0)), M[i]['x0'], M[i]['y0']))
        m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]; left[key[0]] += ii[m * 11:]
    drop = []
    for f, ii in left.items():
        ii = sorted(ii, key=lambda i: -E[i]); m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]; drop += ii[m * 11:]
    return S_, drop
def evaluate(name, M, dsm):
    H[:] = H_ABK
    if dsm: dsm()
    P = np.array([p for m in M for p in m['pts']]); N = np.array([m['n'] for m in M])
    ST, Ir = L.run_steps(P, N); E = L.mod_kwh(ST, len(M))
    L.horizon_ = L.horizon; L.horizon = lambda P_: np.zeros((len(P_), L.NA), np.float32); ST0, _ = L.run_steps(P, N); E0 = L.mod_kwh(ST0, len(M)); L.horizon = L.horizon_
    S_, drop = strings(M, E)
    # дрібні залишки різних боків (схід + захід) — ще один спільний стрінг, якщо разом ≥ 11 (як на ліхтарях)
    if len(drop) >= 11:
        dd = sorted(drop, key=lambda i: -E[i]); extra = dd[:11]; e, e0, _ = L.string_energy(ST, extra)
        if e / e0 > 0.88: S_.append(extra); drop = dd[11:]
    tot = tot0 = 0.0; mo = np.zeros(12); SR = []
    for ids in S_:
        e, e0, emo = L.string_energy(ST, ids); tot += e; tot0 += e0; mo += emo
        SR.append(dict(ids=ids, mwh=round(e / 1000, 3), mism=round((1 - e / e0) * 100, 2), faces=''.join(sorted(set(M[i]['face'] for i in ids)))))
    n = sum(len(s) for s in S_); H[:] = H_ABK
    mods = [dict(part=m['part'], how=m['how'], x0=round(m['x0'], 3), x1=round(m['x1'], 3), y0=round(m['y0'], 3), y1=round(m['y1'], 3), face=m['face'], tilt=round(m['tilt'], 1), roll=round(math.degrees(math.atan(abs(m.get('kx', 0)))) * (1 if m.get('kx', 0) < 0 else -1), 1) if m['how'] == 'south' else 0,
                 kwh=round(float(E[i]), 1), kwh0=round(float(E0[i]), 1), irr=round(float(Ir[i]), 1), st=next((j for j, s in enumerate(S_) if i in s), -1)) for i, m in enumerate(M)]
    r = dict(name=name, places=len(M), n=n, st=len(S_), kwp=round(n * PW, 2), mwh=round(tot / 1000, 2), y=round(tot / n / PW) if n else 0,
             mism=round((1 - tot / tot0) * 100, 2) if tot0 else 0, shade=round((1 - sum(E[i] for s in S_ for i in s) / sum(E0[i] for s in S_ for i in s)) * 100, 1) if n else 0,
             irr=round(float(np.mean([Ir[i] for s in S_ for i in s]))) if n else 0, mo=[round(x / 1000, 3) for x in mo], drop=len(drop), mods=mods, strings=SR)
    print(f"{name}: місць {r['places']}, модулів {n} = {r['st']} стрінгів, {r['kwp']} кВтп, {r['mwh']} МВт·год, {r['y']} кВт·год/кВтп, тінь {r['shade']} %, mism {r['mism']} %, поза стрінгами {r['drop']}")
    return r
VAR = {}
for key, name, fn in (('A_flush', 'Арка — по даху, як на цеху', arch_flush), ('A_south', 'Арка — трикутники 15° на південь', lambda: south('A')),
                      ('L_south', 'Нижній дах — трикутники 15° на південь', lambda: south('L')), ('L_ew', 'Нижній дах — «домік» схід–захід 15°', ew),
                      ('L_flat', 'Нижній дах — плоско 0° (довідково)', flat0)):
    M, dsm = fn(); VAR[key] = evaluate(name, M, dsm)
OUT = dict(map=MAP, var=VAR, geo=dict(AL=AL, AB=AB, stair=STAIR, zst=ZST, vents=VENTS, boxes=BOXES, mrg=MRG, mv=MV, mst=MST, hlow=HLOW, pitch=PITCH))
json.dump(OUT, open(V + 'abk.json', 'w'), ensure_ascii=False)
