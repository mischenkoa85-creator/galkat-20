# -*- coding: utf-8 -*-
"""АБК і склад → контейнери К-3 / К-1 (ТП-5913): щити PV, стрінги, лотки, траншея, лінії Al до ШВ (05.11.2026).

Рішення власника 05.11: АБК без інвертора Deye — у найближчі контейнери (К-3 / К-1 біля ТП-5913). Розробити, як ідуть кабелі, лотки, щити — і по складу теж.

АБК (calc/v3/abk_dc.py → abk/abk_dc.json): 12 стрінгів по 11 (вхід PV контейнера ≤ 660 В), щити ЩА-1 / ЩА-2 (по 6 стрінгів) на північній стіні надбудови,
  на нижньому даху (+10,55) — там, де сходяться лотки стрінгів. Лінії Al: лоток уздовж стіни основного блоку на нижньому даху на захід → через західний парапет →
  спуск по західній стіні нижнього блоку (X 108,3, Y ≈20) → траншея вздовж західної стіни АБК на північ → на захід через двір до траншеї AC контейнерів (X 98,4) →
  ШВ К-3 (Y 53,3) / ШВ К-1 (Y 62,7) на стіні цеху.
Склад: щити ЩС-С1…С3 — на північній стіні складу на висоті 1,0–1,5 м (із проїзду); стрінги — з торців рядів угору під модулями до верху скату (A, B — до верхнього
  північного краю; C1, C2 — до гребеня), лотком уздовж краю / гребеня до щита, по північному скату і стіні вниз. Лінії Al — у траншеї вздовж північної стіни складу
  → через проїзд → спільна траншея з лініями АБК у проїзді між ТП-5913 і АБК → ШВ. Лоток по східному фасаду цеху на 5,0 м (варіант 05.11) не потрібен.
Місце щитів на стіні складу вибирається за найменшою вартістю: кабелі стрінгів 1×6 + лінія Al.
→ wh_abk.json (рядки ліній для ep_opt / final; траси, лотки, траншея і кількості для bom і двійника)."""
import json, math, os, collections
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, '../..')
t = open(os.path.join(R, 'obj/src/ep.js'), encoding='utf-8').read(); i = t.find('{'); EPD, _ = json.JSONDecoder().raw_decode(t[i:])
AD = json.load(open(os.path.join(R, 'abk/abk_dc.json'), encoding='utf-8'))
IMP, ISC, VOP = 17.51, 18.51, 430.0
RHO = 0.0316; PRICE = {120: 2.04, 185: 3.12, 240: 4.07}; K_IMP = 1.2; LUG = {120: 1.54, 185: 2.04, 240: 2.54}
TARIFF, DISC, YEARS = 0.13, 0.10, 25; PVF = (1 - (1 + DISC) ** -YEARS) / DISC
TAU = 551.0; TAUF = {'wh': 0.95 * TAU, 'abk': 0.95 * TAU}
C16 = 0.68 * 1.2                                     # $/м кабелю 1×6 на об'єкті
SHV = {'K-3': (96.89, 53.3), 'K-1': (96.89, 62.7)}
SLACK = lambda l: l * 1.05 + 4.0
D2R = math.pi / 180; T11, T17, T22 = math.tan(11 * D2R), math.tan(17 * D2R), math.tan(22 * D2R); HE = 5.0
# ---------------- траншея: спільна магістраль
XT, YC, XA = 107.6, 36.0, 98.4      # уздовж західної стіни АБК (0,7 м від стіни); перехід на захід на Y 36,0 (північніше ТП-5913); траншея AC контейнерів на X 98,4
YW = -5.9                           # уздовж північної стіни складу C1 / C2 (0,6 м від стіни)
DEP = 0.7                           # глибина труб
MODE = os.environ.get('MODE', 'air')  # 05.11, 23:20 (власник): «навіщо копати — пустимо повітряну лінію» → 'air'; 'trench' — попередній варіант для порівняння
# повітряний варіант: склад — лоток під карнизом складу → стійка на куті C1 → трос через проїзд → південна стіна цеху → лоток на 5,0 м по східному фасаду над ТП-5913 → ШВ;
# АБК — лоток по західній стіні на 10,0 м (між рядами вікон, як траса СІП варіанта 3) → кут → трос через двір південніше К-3 → той самий лоток по фасаду → ШВ
HR, HF, XF = 6.6, 5.0, 96.64 + 0.15  # висота кріплення троса (≥ 6 м над проїздом із провисом 0,3 м), лоток по фасаду цеху, його вісь
POST = (98.3, -6.35)                 # стійка троса на північно-західному куті C1 (карниз 5,0 м → 6,6 м)
XSW = 95.6                           # кріплення троса на південній стіні цеху (західніше кута і прибудови ТП-5913)
YAB = 47.5                           # кріплення троса АБК на східній стіні цеху: південніше майданчика К-3 (Y 49,4), модулі фасаду тут від 10,3 м
XAW, HAW, YAN = 108.15, 10.0, 44.6   # лоток ліній АБК по західній стіні: X, висота, до північного кута
ABKR = os.environ.get('ABKR', 'roof')  # 05.11, 23:57 (власник): «з даху АБК одразу кидати на фасад цеха і спускати до контейнера» → 'roof'; 'wall' — по західній стіні на 10 м і трос 6,6 м (05.11)
YR, HA, HS = 22.0, 10.0, 9.6         # трос АБК 'roof': з кута нижнього блоку (під парапетом, 10,0 м) на східний фасад цеху на Y 22,0 (модулі фасаду тут від 10,3 м) на 9,6 м — над дахом прибудови ТП-5913 (4,5 м)
HE_T = 4.8                           # лоток під карнизом складу
def plen(P): return sum(math.dist(P[i], P[i + 1]) for i in range(len(P) - 1))
def best(L, ns, tau):
    out = []
    for S in (120, 185, 240):
        I = ns * IMP; pk = I * I * 2 * RHO * L / S / 1000; du = pk * 1000 / I / VOP * 100
        if ns * ISC * 1.25 > {120: 250, 185: 320, 240: 380}[S] or du > 2.5: continue
        cab = 2 * L * PRICE[S] * K_IMP + 4 * LUG[S]; npv = pk * tau * TARIFF * PVF
        out.append(dict(S=S, pk=pk, du=du, e=pk * tau, cab=cab, npv=npv, tot=cab + npv))
    return min(out, key=lambda o: o['tot'])
def to_shv(K):                       # від вузла (XT, YC) на дні траншеї до ШВ
    sx, sy = SHV[K]
    return [(XT, YC, -DEP), (XA, YC, -DEP), (XA, sy - 0.2, -DEP), (sx + 0.06, sy - 0.2, -DEP), (sx + 0.06, sy - 0.2, 0.0), (sx + 0.06, sy - 0.2, 1.0)]
# ================= СКЛАД
WM = EPD['wh']; WS = [s for s in EPD['strings'] if s['r'] == 0]
def part(x): return 'A' if x < 73.5 else 'B' if x < 98.1 else 'C1' if x < 146.1 else 'C2'
def zmod(x, y):
    p = part(x)
    if p == 'A': return HE + (y + 25.05) * T11
    if p == 'B': return HE + (y + 24.5) * T11
    return HE + (9 - abs(y + 15.5)) * (T22 if p == 'C1' else T17)
NAB = [(53.75, -18.65), (73.5, -15.5), (92.4, -12.5), (98.1, -12.5)]     # північний (верхній) край скатів A, B
def yN(x):
    for (x0, y0), (x1, y1) in zip(NAB, NAB[1:]):
        if x0 - 1e-9 <= x <= x1 + 1e-9: return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return NAB[0][1] if x < NAB[0][0] else NAB[-1][1]
def hN(x): return HE + (yN(x) + (25.05 if part(x) == 'A' else 24.5)) * T11
def sAB(x):                          # довжина по краю A/B від X 53,75 до x
    s = 0.0
    for (x0, y0), (x1, y1) in zip(NAB, NAB[1:]):
        if x <= x0: break
        xe = min(x, x1); s += math.hypot(xe - x0, (y1 - y0) * (xe - x0) / (x1 - x0))
    return s
BOXH = (1.0, 1.5)                    # низ і верх щита на стіні, м
WHN = os.environ.get('WHN', '1') == '1'   # 06.11 (власник): «додавай варіант 2 до першого етапу … з можливістю прибрати» — модулі на північних скатах C1 / C2; WHN=0 — прибрати
XG = 98.55                                 # WHN: спуск лотка з гребеня — на західному торці C1 (між краєм даху X 98,1 і першим стовпчиком модулів 98,76), щоб звільнити стовпчик X 103,4
def end_len(j, xp, wall):
    """кабель від кінцевого модуля стрінга до щита на стіні: під модулями вгору по скату → лотком уздовж краю / гребеня → по північному скату → по стіні до щита"""
    x, y = WM[j]
    if wall == 'AB':
        up = (yN(x) - y) / math.cos(11 * D2R); along = abs(sAB(x) - sAB(xp)); down = hN(xp) - BOXH[1]
        return up + along + down + 0.6
    sl = 22 if part(x) == 'C1' else 17; sl2 = 22 if part(xp) == 'C1' else 17
    if WHN: sl2 = 22                 # спуск на західному торці C1, далі під карнизом до щита
    along = abs(x - XG) + abs(xp - XG) if WHN else abs(x - xp)
    up = (-15.5 - y) / math.cos(sl * D2R); down = 9.0 / math.cos(sl2 * D2R) + (HE - BOXH[1]); return up + along + down + 0.6
def air_tail(K, from_pt):            # від точки на фасадному лотку цеху до ШВ
    sx, sy = SHV[K]
    return [(XF, sy - 0.7, HF), (XF, sy - 0.7, 2.0), (sx + 0.06, sy - 0.2, 1.6)]
def line_pts_wh(xp, wall, K):
    if MODE == 'air':
        if wall == 'AB':
            y0 = yN(xp) + 0.15
            P = [(xp, y0, BOXH[1]), (xp, y0, HE_T)]
            for (x0, yy0), (x1, yy1) in zip(NAB, NAB[1:]):
                if x1 > xp + 1e-6 and x1 <= 97.95: P.append((x1, yy1 + 0.15, HE_T))
            P += [(97.95, -12.35, HE_T), (97.95, -6.65, HE_T), (POST[0], POST[1], HE_T)]
        else:
            P = [(xp, -6.35, BOXH[1]), (xp, -6.35, HE_T), (POST[0], POST[1], HE_T)]
        return P + [(POST[0], POST[1], HR), (XSW, -0.65, HR), (XSW, -0.65, HF), (XF, -0.65, HF)] + air_tail(K, None)
    if wall == 'AB':
        y0 = yN(xp) + 0.15
        P = [(xp, y0, BOXH[0]), (xp, y0, 0.0), (xp, y0 + 0.6, -DEP)]
        if xp < 97.5:
            for (x0, yy0), (x1, yy1) in zip(NAB, NAB[1:]):          # уздовж краю A/B на 0,6 м від стіни до кута X 97,5
                if x1 > xp + 1e-6 and x1 <= 97.5: P.append((x1, yy1 + 0.6, -DEP))
            P.append((97.5, -11.9, -DEP))
        P += [(97.5, YW, -DEP)]
    else:
        P = [(xp, -6.35, BOXH[0]), (xp, -6.35, 0.0), (xp, YW, -DEP)]
    P += [(XT, YW, -DEP), (XT, YC, -DEP)]
    return P + to_shv(K)[1:]
def trench_own(P):                   # до вузла (XT, YW)
    if MODE == 'air':                # повітря: лоток уздовж стіни складу до стійки
        k = next(i for i, p in enumerate(P) if abs(p[0] - POST[0]) < 1e-6 and abs(p[1] - POST[1]) < 1e-6)
        return plen([q for q in P[1:k + 1]]) - (HE_T - BOXH[1])
    k = next(i for i, p in enumerate(P) if abs(p[0] - XT) < 1e-6 and abs(p[1] - YW) < 1e-6)
    return plen([q for q in P[2:k + 1]])
BXW = {23: ('ЩС-С1', 'AB', 'K-3'), 24: ('ЩС-С2', 'C', 'K-1'), 25: ('ЩС-С3', 'C', 'K-1')}
CT, CTR = 19.7, 20.0                 # $/м: лоток 100×50 на профнастилі / на стіні з кріпленням і роботою; нова траншея з піском, засипкою і покриттям (без труб)
def box_cost(b, xp):
    nm, wall, K = BXW[b]; ss = [s for s in WS if s['b'] == b]
    sc = sum(end_len(s['pe'], xp, wall) + end_len(s['me'], xp, wall) for s in ss)
    P = line_pts_wh(xp, wall, K); L = SLACK(plen(P)); ln = 2 * L * PRICE[120] * K_IMP + 2 * L * 0.3 + plen(P) * 1.93
    xs = [WM[s['pe']][0] for s in ss] + [WM[s['me']][0] for s in ss]
    edge = (abs(sAB(max(xs + [xp])) - sAB(min(xs + [xp]))) if wall == 'AB' else 0.0)
    fix = ((hN(xp) - BOXH[1]) if wall == 'AB' else (9.3 + HE - 0.1 - BOXH[1] + (abs(xp - XG) if WHN else 0.0))) * CT
    xr = XG if (WHN and wall == 'C') else xp
    return sc * C16 + ln + fix + edge * CT, (min(xs + [xr]), max(xs + [xr])), P
def opt_ab():
    best_ = None
    for xp in [x / 2 for x in range(int(54.5 * 2), int(97.5 * 2) + 1)]:
        c, iv, P = box_cost(23, xp); c += trench_own(P) * (CT if MODE == 'air' else CTR)
        if best_ is None or c < best_[0]: best_ = (c, xp)
    return best_[1]
def opt_c():                          # ЩС-С2 і ЩС-С3 разом: спільний лоток по гребеню (об'єднання), спільна траншея вздовж стіни, щити не ближче 1,0 м
    cand = [x / 2 for x in range(int((99.5 if WHN else 98.8) * 2), int(154.4 * 2) + 1)]   # WHN: щити не ближче 1,4 м до кута C1 зі стійкою троса
    C2_ = {x: box_cost(24, x) for x in cand}; C3_ = {x: box_cost(25, x) for x in cand}; best_ = None
    for x2 in cand:
        c2, i2, _ = C2_[x2]
        for x3 in cand:
            if abs(x2 - x3) < 1.0: continue
            c3, i3, _ = C3_[x3]
            ridge = (i2[1] - i2[0]) + (i3[1] - i3[0]) - max(0.0, min(i2[1], i3[1]) - max(i2[0], i3[0]))
            XN = POST[0] if MODE == 'air' else XT
            tr = max(abs(x2 - XN), abs(x3 - XN)) if (x2 - XN) * (x3 - XN) > 0 else abs(x2 - XN) + abs(x3 - XN)
            c = c2 + c3 + ridge * CT + tr * (CT if MODE == 'air' else CTR)
            if best_ is None or c < best_[0]: best_ = (c, x2, x3)
    return best_[1], best_[2]
XB = {23: opt_ab()}; XB[24], XB[25] = opt_c()
WH = []
for b in (23, 24, 25):
    nm, wall, K = BXW[b]; xp = XB[b]; ss = [s for s in WS if s['b'] == b]
    P = line_pts_wh(xp, wall, K); Lr = plen(P); L = SLACK(Lr); r = best(L, len(ss), TAUF['wh'])
    sts = []
    for s in ss:
        pl, mi = end_len(s['pe'], xp, wall), end_len(s['me'], xp, wall); jm = sum(s['jm'])
        sts.append(dict(id=s['id'], plus=round(pl, 1), minus=round(mi, 1), jm=round(jm, 1), tot=round(pl + mi + jm, 1), old=round(s['pc'] + s['mc'] + jm, 1),
                        ends=[[round(v, 2) for v in WM[s['pe']]], [round(v, 2) for v in WM[s['me']]]], m=s['m']))
    xs = [WM[s['pe']][0] for s in ss] + [WM[s['me']][0] for s in ss]
    if wall == 'AB':
        x0, x1 = min(xs + [xp]), max(xs + [xp])
        edge = [(x0, yN(x0) - 0.25, hN(x0) + 0.1)] + [(x_, y_ - 0.25, HE + (y_ + (25.05 if part(x_) == 'A' else 24.5)) * T11 + 0.1) for x_, y_ in NAB if x0 < x_ < x1] + [(x1, yN(x1) - 0.25, hN(x1) + 0.1)]
        trays = dict(edge=[list(map(lambda v: round(v, 3), p)) for p in edge], wall=[[xp, round(yN(xp) + 0.12, 3), round(hN(xp), 2)], [xp, round(yN(xp) + 0.12, 3), BOXH[1]]])
        L_edge = plen(edge); L_slope = 0.0; L_wall = hN(xp) - BOXH[1]
    else:
        xd = XG if WHN else xp          # спуск з гребеня: WHN — на західному торці C1, інакше — над щитом
        x0, x1 = min(xs + [xd]), max(xs + [xd]); zr = lambda x: HE + 9 * (T22 if part(x) == 'C1' else T17)
        ridge = [(x0, -15.3, zr(x0) + 0.05), (x1, -15.3, zr(x1) + 0.05)]
        slope = [(xd, -15.3, zr(xd) + 0.05), (xd, -6.7, HE + 0.12)]
        wl = ([[XG, -6.4, HE - 0.1]] if WHN else []) + [[xp, -6.4, HE - 0.1], [xp, -6.4, BOXH[1]]]
        trays = dict(ridge=[list(map(lambda v: round(v, 3), p)) for p in ridge], slope=[list(map(lambda v: round(v, 3), p)) for p in slope], wall=wl)
        L_edge = x1 - x0; L_slope = plen(slope); L_wall = HE - 0.1 - BOXH[1] + (abs(xp - XG) if WHN else 0.0)
    WH.append(dict(id=nm, b=b, K=K, wall=wall, ns=len(ss), kwp=round(len(ss) * 11 * 0.73, 2), X=xp, Y=round(yN(xp) + 0.2, 2) if wall == 'AB' else -6.3, h=BOXH,
                   pts=[[round(v, 3) for v in p] for p in P], Lr=round(Lr, 1), L=round(L, 1), trench_own=round(trench_own(P), 1),
                   str_m=round(sum(s['tot'] for s in sts), 1), str_old=round(sum(s['old'] for s in sts), 1), strings=sts, trays=trays,
                   tray_m=dict(edge=round(L_edge, 1), slope=round(L_slope, 1), wall=round(L_wall, 1)),
                   **{k: round(v, 3) if isinstance(v, float) else v for k, v in r.items()}))
# ================= 06.11: північні скати складу C1 (22°) і C2 (17°) — варіант 2: 121 модуль, 11 стрінгів, щити ЩС-Пн1 / Пн2 → окремі входи MPPT К-1 / К-3
WHNO = None
if WHN:
    _t = open(os.path.join(R, 'obj/src/raddata.js'), encoding='utf-8').read(); RAD = json.loads(_t[_t.index('=') + 1:].strip().rstrip(';'))
    def _cell(k, x, y):
        c = RAD['cells'][k]; i = int((x - c['s0']) // 1); j = int((y - c['t0']) // 1)
        return c['e'][j * c['nx'] + i] if 0 <= i < c['nx'] and 0 <= j < c['ny'] else None
    def _foot(k, x, y, tl):          # радіація за рік під модулем (книжково), середнє по клітинках 1 × 1 м
        hy = 2.384 * math.cos(tl * D2R) / 2; v = [_cell(k, x + dx, y + dy) for dx in (-0.45, 0, 0.45) for dy in [(-hy + 0.2) + (2 * hy - 0.4) * t / 3 for t in range(4)]]
        v = [q for q in v if q is not None]; return sum(v) / len(v)
    TLT = {'A': 11, 'B': 11, 'C1': 22, 'C2': 17}
    def _poa(x, y):                  # C2 у сітці радіації немає — як C1 з поправкою на кут (pvlib, Perez, Київ: Пд 17°/22° = 1 297 / 1 316, Пн 17°/22° = 1 006 / 948)
        p = part(x)
        if p in ('A', 'B'): return _foot('wh' + p, x, y, 11)
        v = _foot('whC1', min(x, 146.0), y, 22)
        return v if p == 'C1' else v * ((1297 / 1316) if y < -15.5 else (1006 / 948))
    PRW = 1157 / (sum(_poa(x, y) for x, y in WM) / len(WM))     # 1 157 кВт·год/кВтп складу (26.10) ↔ радіація під модулями → коефіцієнт системи
    NP = [(x, round(-31 - y, 3)) for x, y in WM if part(x) in ('C1', 'C2')]       # дзеркало рядів південного скату відносно гребеня Y −15,5
    rows_ = [sorted([q for q in NP if abs(q[1] - yr) < 0.01]) for yr in sorted({q[1] for q in NP}, key=lambda v: -v)]
    SS, left = [], []
    for r_ in rows_:
        k_ = len(r_) // 11; SS += [r_[i * 11:(i + 1) * 11] for i in range(k_)]; left += r_[k_ * 11:]
    while len(left) >= 11:            # залишки з кінців рядів — стрінги через ряди (перемички), найслабші місця лишаються вільними
        left.sort(key=lambda q: -_poa(*q)); SS.append(sorted(left[:11], key=lambda q: (q[1], q[0]))); left = left[11:]
    SS.sort(key=lambda s_: sum(q[0] for q in s_) / len(s_))
    xb0 = max(XB[24], XB[25]); NB = [('ЩС-Пн1', round(xb0 + 1.0, 2), 'K-1', SS[:6]), ('ЩС-Пн2', round(xb0 + 2.0, 2), 'K-3', SS[6:])]
    def _end(q, xb):
        x, y = q; tl = 22 if part(x) == 'C1' else 17
        return abs(y + 15.5) / math.cos(tl * D2R) + abs(x - XG) + abs(xb - XG) + 9.0 / math.cos(22 * D2R) + (HE - BOXH[1]) + 0.6
    WMOD, WSTR, WBOX = [], [], []; sid = 0
    for bid, xb, K, ss in NB:
        ids = []
        for s_ in ss:
            sid += 1; nm = f'СП-{sid:02d}'; ids.append(nm)
            jm = sum(2.7 for a, b in zip(s_, s_[1:]) if abs(a[1] - b[1]) > 0.01) + sum(abs(a[0] - b[0]) - 1.34 for a, b in zip(s_, s_[1:]) if abs(a[1] - b[1]) < 0.01 and abs(a[0] - b[0]) > 1.5)
            pl, mi = _end(s_[0], xb), _end(s_[-1], xb)
            WSTR.append(dict(id=nm, box=bid, K=K, plus=round(pl, 1), minus=round(mi, 1), jm=round(jm, 1), tot=round(pl + mi + jm, 1), m=[len(WMOD) + i for i in range(len(s_))],
                             ends=[list(s_[0]), list(s_[-1])]))
            WMOD += [[q[0], q[1], part(q[0]), round(_poa(*q)), nm] for q in s_]
        P = line_pts_wh(xb, 'C', K); Lr = plen(P); L = SLACK(Lr); r = best(L, len(ss), TAUF['wh'] * 0.55)
        WBOX.append(dict(id=bid, z='whn', K=K, ns=len(ss), kwp=round(len(ss) * 11 * 0.73, 2), X=xb, Y=-6.3, z0=BOXH[0], h=BOXH, strings=ids,
                         pts=[[round(v, 3) for v in p] for p in P], Lr=round(Lr, 1), L=round(L, 1),
                         trays=dict(wall=[[xb, -6.4, HE - 0.1], [xb, -6.4, BOXH[1]]], line=[[xb, -6.35, BOXH[1]], [xb, -6.35, HE_T]]),
                         **{k: round(v, 3) if isinstance(v, float) else v for k, v in r.items()}))
    WMOD += [[q[0], q[1], part(q[0]), round(_poa(*q)), None] for q in left]       # вільні місця (без модуля)
    ext = max(b_['X'] for b_ in WBOX) - xb0                                          # подовження лотків під карнизом (стрінги і лінії) до нових щитів
    tr = sum(2 * (HE - 0.1 - BOXH[1]) for _ in WBOX) + 2 * ext
    n_ = sum(len(s_['m']) for s_ in WSTR); kwp_ = n_ * 0.73
    yld = sum(PRW * q[3] for q in WMOD if q[4]) / n_
    WHNO = dict(on=True, XG=XG, n=n_, ns=len(WSTR), kwp=round(kwp_, 2), y=round(yld), mwh=round(kwp_ * yld / 1000, 1), PR=round(PRW, 3), free=len(left),
                mods=WMOD, strings=WSTR, boxes=WBOX,
                q=dict(str_m=round(sum(s_['tot'] for s_ in WSTR), 1), tray=round(tr, 1), brk=math.ceil(tr) + 2 * len(WBOX), pe=round(tr, 1), clamps=4, lift=1, kits=len(WSTR)))
# ================= АБК
TR = AD['trays']; BX = AD['inv']['boxes']; NODE = tuple(AD['inv']['node'])
ZR = NODE[2]; XP = 108.3 + 0.5 + 0.05                        # внутрішня грань західного парапету нижнього блоку
YD = 20.12                                                   # лоток уздовж південної стіни основного блоку (wallW)
def abk_pts(bi, K):
    b = BX[bi]
    roof = [(b['x'], b['y'] + 0.12, b['z0']), (b['x'], NODE[1], ZR + 0.1), (NODE[0], NODE[1], ZR + 0.1), (NODE[0], YD - 0.25, ZR + 0.1), (XP, YD - 0.25, ZR + 0.1)]
    par = [(XP, YD - 0.25, 10.0 + 0.5 + 0.2), (108.3 - 0.15, YD - 0.25, 10.0 + 0.5 + 0.2)]          # через парапет (0,5 м) і на стіну
    if MODE == 'air' and ABKR == 'roof':
        wall = [(XAW, YD - 0.25, HA)]
        P = roof + par + wall + [(XF, YR, HS), (XF, YR, HF)] + air_tail(K, None)
        return P, roof + par + wall
    if MODE == 'air':
        wall = [(XAW, YD - 0.25, HAW), (XAW, YAN, HAW), (XAW, YAN, HR)]
        P = roof + par + wall + [(XF, YAB, HR), (XF, YAB, HF)] + air_tail(K, None)
        return P, roof + par + wall
    wall = [(108.3 - 0.15, YD - 0.25, 0.0), (XT, YD - 0.25, -DEP)]
    P = roof + par + wall + [(XT, YC, -DEP)] + to_shv(K)[1:]
    return P, roof + par + [wall[0]]
AB = []; NOABK = os.environ.get('NOABK') == '1'       # NOABK=1 — лише склад (для розкладу різниці за причинами)
SK = {s['k']: s for s in AD['strings']}
for bi, K in (() if NOABK else ((0, 'K-3'), (1, 'K-1'))):
    ks = [s['k'] for s in AD['strings'] if s['mppt'] == bi + 1]
    P, tr = abk_pts(bi, K); Lr = plen(P); L = SLACK(Lr); r = best(L, len(ks), TAUF['abk'])
    AB.append(dict(id=BX[bi]['id'], K=K, ns=len(ks), kwp=round(len(ks) * 11 * 0.73, 2), X=BX[bi]['x'], Y=BX[bi]['y'], z0=BX[bi]['z0'], strings=ks,
                   faces=''.join(sorted(set(''.join(SK[k]['faces'] for k in ks)))), mwh=round(sum(SK[k]['mwh'] for k in ks), 2),
                   pts=[[round(v, 3) for v in p] for p in P], tray=[[round(v, 3) for v in p] for p in tr], Lr=round(Lr, 1), L=round(L, 1),
                   **{k: round(v, 3) if isinstance(v, float) else v for k, v in r.items()}))
# лоток ліній АБК: від щитів до парапету (на даху на опорах з блоком через 1,5 м), перехід через парапет, спуск по стіні (кронштейни через 1,0 м)
L_abk_roof = plen([(BX[0]['x'], NODE[1]), (NODE[0], NODE[1]), (NODE[0], YD - 0.25), (XP, YD - 0.25)]) + 1.0
L_abk_wall = (0.7 if ABKR == 'roof' else 0.7 + (YAN - YD + 0.25) + (HAW - HR)) if MODE == 'air' else 10.0 + 0.5 + 0.2
if NOABK: L_abk_roof = L_abk_wall = 0.0
# ================= траншея: ділянки з кількістю ліній (нова і спільна з траншеєю AC)
seg = collections.Counter(); shared = collections.Counter()
def add_line(P):
    for a, b in zip(P, P[1:]):
        if a[2] > -DEP + 1e-6 or b[2] > -DEP + 1e-6: continue
        if abs(a[0] - XA) < 1e-6 and abs(b[0] - XA) < 1e-6:            # уздовж траншеї AC контейнерів
            ys = sorted((a[1], b[1])); shared[(round(ys[0], 2), round(ys[1], 2))] += 1; continue
        k = (tuple(round(v, 2) for v in a[:2]), tuple(round(v, 2) for v in b[:2])); k = tuple(sorted(k)); seg[k] += 1
for w in WH: add_line(w['pts'])
for a in AB: add_line(a['pts'])
for a in (WHNO['boxes'] if WHNO else []): add_line(a['pts'])
def part_seg(S):                     # елементарні ділянки (як final.partition): колінеарні відрізки → частини з сумою ліній
    Hh = collections.defaultdict(list); Vv = collections.defaultdict(list); O = []
    for (u, v), n in S.items():
        if abs(u[1] - v[1]) < 1e-6: Hh[u[1]].append((min(u[0], v[0]), max(u[0], v[0]), n))
        elif abs(u[0] - v[0]) < 1e-6: Vv[u[0]].append((min(u[1], v[1]), max(u[1], v[1]), n))
        else: O.append((u, v, n))
    out = []
    for c, L_, hor in [(c, L_, True) for c, L_ in Hh.items()] + [(c, L_, False) for c, L_ in Vv.items()]:
        ps = sorted({p for a, b, _ in L_ for p in (a, b)})
        for a, b in zip(ps, ps[1:]):
            m = sum(t[2] for t in L_ if t[0] <= a + 1e-6 and t[1] >= b - 1e-6)
            if m: out.append(dict(a=[a, c] if hor else [c, a], b=[b, c] if hor else [c, b], n=m, L=round(b - a, 2)))
    for u, v, n in O: out.append(dict(a=list(u), b=list(v), n=n, L=round(math.dist(u, v), 2)))
    return out
TS = part_seg(seg)
ROPES, FAC = [], []
if MODE == 'air':
    rp = collections.Counter(); fs = collections.Counter()
    RST = [(POST[0], POST[1], HR), (XAW, YAN, HR), (XAW, YD - 0.25, HA)]          # початки тросів: стійка складу; АБК 'wall'; АБК 'roof'
    for o in WH + AB + (WHNO['boxes'] if WHNO else []):
        P = o['pts']
        for a, b in zip(P, P[1:]):
            if any(math.dist(a, r_) < 1e-6 for r_ in RST) and min(a[2], b[2]) >= 6 and math.dist(a[:2], b[:2]) > 3: rp[(tuple(a), tuple(b))] += 1
            if abs(a[2] - HF) < 1e-6 and abs(b[2] - HF) < 1e-6: fs[tuple(sorted((tuple(round(v, 2) for v in a[:2]), tuple(round(v, 2) for v in b[:2]))))] += 1
    for (a, b), n in rp.items(): ROPES.append(dict(a=list(a), b=list(b), n=n, L=round(math.dist(a[:2], b[:2]), 2), who='склад' if a[1] < 0 else 'АБК'))
    FAC = part_seg(fs)
    TS = []
SH = []
ys = sorted({y for k in shared for y in k})
for a, b in zip(ys, ys[1:]):
    n = sum(v for (y0, y1), v in shared.items() if y0 <= a + 1e-6 and y1 >= b - 1e-6)
    if n: SH.append(dict(a=[XA, a], b=[XA, b], n=n, L=round(b - a, 2)))
T_new = sum(s['L'] for s in TS); T_pipe = sum(s['L'] * s['n'] for s in TS) + sum(s['L'] * s['n'] for s in SH)
# ================= кількості для кошторису (етап 1)
L_fac = sum(f['L'] for f in FAC); L_fac2 = sum(f['L'] for f in FAC if f['n'] > 3)
L_eave = sum(trench_own(w['pts']) for w in WH) if MODE == 'air' else 0.0
drop_abk = 0.0 if NOABK else ((HS if ABKR == 'roof' else HR) - HF)                     # з троса АБК вниз до лотка 5,0 м
q_air = dict(mode=MODE, ropes=ROPES, fac=FAC, L_fac=round(L_fac, 1), L_fac2=round(L_fac2, 1), L_eave=round(L_eave, 1),
             tray_air=round((L_fac + 2 * 3.0 + (HR - HF) + drop_abk + L_eave) * 1.05, 1) if MODE == 'air' else 0.0,   # лоток по фасаду, спуски до ШВ, з троса на стіну, під карнизом складу
             brk_air=math.ceil(L_fac + 2 * 3.0 + (HR - HF) + drop_abk + L_eave) + 4 if MODE == 'air' else 0,
             hang=math.ceil(sum(r_['L'] for r_ in ROPES) / 0.5) + 2 * len(ROPES), post=1 if MODE == 'air' else 0, node=2 * len(ROPES),
             lift_air=(3 if NOABK else 5) if MODE == 'air' else 0)
q = dict(**q_air,
    tray_prof=round(sum(w['tray_m']['edge'] + w['tray_m']['slope'] for w in WH) * 1.05, 1),         # лоток 100×50 на профнастилі складу (край / гребінь, північний скат)
    tray_wall=round((sum(w['tray_m']['wall'] for w in WH) + L_abk_wall) * 1.05, 1),               # вертикальні лотки на стінах (склад, АБК)
    tray_roofA=round(L_abk_roof * 1.05, 1),                                                     # нижній дах АБК, на опорах з блоком
    fix_prof=math.ceil(sum(w['tray_m']['edge'] + w['tray_m']['slope'] for w in WH) / 1.5 * 1.1),
    brk_wall=math.ceil(sum(w['tray_m']['wall'] for w in WH) + L_abk_wall) + 3,
    blk_abk=math.ceil(L_abk_roof / 1.5),
    trench=round(T_new, 1), pipe=round(T_pipe * 1.03, 1), shared=round(sum(s['L'] for s in SH), 1),
    exc=round(T_new * 0.4 * 0.8, 1), sand=round(T_new * 0.4 * 0.3, 1), back=round(T_new * 0.4 * 0.5, 1), spoil=round(T_new * 0.4 * 0.3, 1), tape=round(T_new + sum(s['L'] for s in SH), 1),
    lift=(1 if NOABK else 2) if MODE == 'trench' else 0, par_cross=0 if NOABK else 1, wall_pass=2, nabk=len(AB),
    str_wh=round(sum(w['str_m'] for w in WH), 1), str_wh_old=round(sum(w['str_old'] for w in WH), 1),
    str_abk=round(AD['dc']['plus'] + AD['dc']['minus'] + AD['dc']['jump'], 1), str_abk_old=973.2)
if MODE == 'air': SH = []; T_new = T_pipe = 0.0; q.update(trench=0.0, pipe=0.0, shared=0.0, exc=0.0, sand=0.0, back=0.0, spoil=0.0, tape=0.0)
OUT = dict(wh=WH, abk=AB, whn=WHNO, trench=TS, shared=SH, ropes=ROPES, fac=FAC, mode=MODE, q=q, consts=dict(XT=XT, YC=YC, XA=XA, YW=YW, DEP=DEP, HR=HR, HF=HF, XF=XF, POST=POST, XSW=XSW, YAB=YAB, XAW=XAW, HAW=HAW, YAN=YAN, ABKR=ABKR, YR=YR, HA=HA, HS=HS, YD=YD),
           note=('Повітряні переходи на тросі: склад — кріплення 6,6 м, провис ≤ 0,3 м — над проїздом ≥ 6 м; АБК — з даху (10,0 м) прямо на фасад цеху (9,6 м) над прибудовою ТП-5913; кабель Al з УФ-стійкою оболонкою; точки кріплення на стінах — погодити на місці.' if MODE == 'air' else 'Траншея — за обстеженням ділянки: підземні мережі ТП-5913 у проїзді між ТП і АБК, покриття проїзду; місця щитів складу — з урахуванням воріт і дверей.'))
json.dump(OUT, open(os.path.join(H, 'wh_abk.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if not NOABK and not os.environ.get('NOTWIN'):   # дані двійника: траси складу і АБК (ELECWA) і модель АБК на 12 стрінгів по 11 зі щитами (ABK_DC — замість dbn у ABK_DATA)
    open(os.path.join(R, 'obj/src/elecwadata.js'), 'w', encoding='utf-8').write('const ELECWA=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';')
    open(os.path.join(R, 'obj/src/abkdcdata.js'), 'w', encoding='utf-8').write('// АБК без інвертора: 12 стрінгів по 11, щити ЩА-1 / ЩА-2 → К-3 / К-1 (calc/v3/abk_dc.py)\nconst ABK_DC=' + json.dumps(AD, ensure_ascii=False, separators=(',', ':')) + ';')
if __name__ == '__main__':
    for w in WH: print(w['id'], w['wall'], 'X', w['X'], 'Y', w['Y'], w['K'], 'L', w['L'], 'S', w['S'], 'du', round(w['du'], 2), 'стрінги 1×6', w['str_m'], '(було', w['str_old'], ') лотки', w['tray_m'], 'траншея своя', w['trench_own'])
    for a in AB: print(a['id'], a['K'], 'стрінги', a['strings'], a['faces'], a['kwp'], 'кВтп', a['mwh'], 'МВт·год', 'L', a['L'], 'S', a['S'], 'du', round(a['du'], 2))
    print('режим', MODE, 'траншея нова', round(T_new, 1), 'м; спільна з AC', q['shared'], 'м; труби ПНД Ø63', q['pipe'], 'м'); print('q', {k: v for k, v in q.items() if k not in ('ropes', 'fac')})
    for r_ in ROPES: print('  трос', r_)
    for f_ in FAC: print('  фасад', f_)
    for s in TS: print('  ', s)
    for s in SH: print('  AC', s)
