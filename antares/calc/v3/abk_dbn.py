# -*- coding: utf-8 -*-
"""АБК, лише варіант «ДБН» (рішення власника 28.10, 17:52): дані для 3D-моделі і повної специфікації.
- Стрінги під Deye SUN-100K-G03 — як abk_deye.py (повна модель K1, довжина стрінга 12, 11 стрінгів, 6 MPPT по 2 стрінги).
- Коли кожен модуль працює: для кожного кроку 10 хв розрахункових днів місяців (Meteonorm 8.1, ясне небо) — освітленість 3 точок модуля,
  струм стрінга як у string_energy (байпас-діоди): модуль зі струмом нижче за робочий струм стрінга обходиться діодом — «не працює».
  Стрінг не опускається нижче 6 модулів у роботі (MPPT від 200 В: 6 × ≈37 В).
- Траси DC: лотки по доріжках арки, зв'язці, спуск по південній стіні основного блоку, уздовж стін на нижньому даху, з надбудови;
  кабель стрінга — від кінцевого модуля до лотка (під модулями вздовж лаги) і лотками до інвертора; перемички між віддаленими модулями.
- Вирівнювання потенціалів (без зовнішньої СБЗ, як том 7 цеху): провідник Cu 1×6 ж-з у лотках, по 2 приєднання на механічно зв'язаний блок
  кріплення, Cu 1×16 до PE інвертора і до наявного прутка на парапеті в місці переходу лотка.
→ antares/abk/abk_dbn.json"""
import os, json, math, collections, heapq
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'abk_deye.py'), encoding='utf-8').read()
exec(src.rsplit("NADJ = J['nad']; OUT = {}", 1)[0])              # модель, strings_L, WALLS, M_arch, M_dom, dsm_nad
NADJ = J['nad']
XC_, HW_ = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
za = lambda x: AB['h'] + AB['f'] * max(0.0, 1 - ((x - XC_) / HW_) ** 2)
# ---------------- модель і стрінги «ДБН»
A_ = M_arch(J['archD'], 'archD'); LW_ = M_dom(LOWU, 'low', 'L'); NADL = NADJ['d6']
M = A_ + LW_ + WALLS + M_dom(NADL, 'nad', 'N')
H[:] = H_BASE; dsm_nad(NADL)
P = np.array([p for m in M for p in m['pts']]); NRM = np.array([m['n'] for m in M])
ST, Ir = L.run_steps(P, NRM); E = L.mod_kwh(ST, len(M))
best = None
for Lm in range(10, 18):
    S_, drop = strings_L(M, E, ST, Lm)
    if len(S_) > 12: continue
    tot = sum(L.string_energy(ST, s)[0] for s in S_)
    if best is None or tot > best['tot'] + 1e-6: best = dict(L=Lm, S=S_, drop=drop, tot=tot)
S_, LS = best['S'], best['L']
assert LS == 12 and len(S_) == 11, (LS, len(S_))
# ---------------- по кроках: освітленість точок, струм, стан модуля
HOR = L.horizon(P); N3 = np.repeat(NRM, 3, axis=0); SVF, _ = L.svf(HOR, N3); SVFm = SVF.reshape(-1, 3).mean(1)
sid = np.zeros(len(M), int)
for k, ids in enumerate(S_):
    for i in ids: sid[i] = k + 1
NMIN = 6
OFF = np.zeros((len(M), 12, 24)); PRT = np.zeros((len(M), 12, 24)); BCK = np.zeros((len(M), 12, 24)); CNT = np.zeros((12, 24))
offh = np.zeros(len(M)); offh_p = np.zeros(len(M)); prth = np.zeros(len(M))
HOUR_OFF = np.zeros((12, 24)); HOUR_N = np.zeros((12, 24))
for mo, Wm in enumerate(L.WX['mo']):
    wt = Wm['nd'] / 6; p_ = Wm['p']
    for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
        if sz < 0.035 or Dn < 50: continue                           # сонце нижче 2° або без прямого — стан не визначаємо
        bx, by = L.tobld(ex, ey); dv = np.array([bx, by, sz]); cosb = NRM @ dv; Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(bx, by); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * L.NA; a0 = int(fa) % L.NA; a1 = (a0 + 1) % L.NA; t = fa - int(fa)
        lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, 3)
        cb = np.maximum(cosb, 0); beam = Dn * cb + Dd * Ai * cb / cz; gr = Gh * L.ALB * (1 - NRM[:, 2]) / 2
        litm = 0.5 * (lit.mean(1) + lit.min(1)); pc = beam * litm + Dd * (1 - Ai) * SVFm + gr
        st = np.zeros(len(M), int)                                     # 0 працює, 1 частково, 2 не працює (обхід), 3 сонце позаду
        st[(litm < 0.999) & (cosb > 0.02)] = 1; st[cosb <= 0.02] = 3
        for ids in S_:
            ids = np.array(ids); I = pc[ids]
            if I.sum() <= 0: continue
            Is = np.sort(I)[::-1]; n0 = min(NMIN, len(Is)) - 1
            nb = max(range(n0, len(Is)), key=lambda n: Is[n] * (n + 1)); cur = Is[nb]
            byp = ids[I < cur * 0.985]
            st[byp] = 2
        hh = int(h)
        CNT[mo, hh] += 1
        OFF[:, mo, hh] += st == 2; PRT[:, mo, hh] += st == 1; BCK[:, mo, hh] += st == 3
        offh += wt * (st == 2); offh_p += wt * p_ * (st == 2); prth += wt * (st == 1)
        HOUR_OFF[mo, hh] += (st[sid > 0] == 2).sum(); HOUR_N[mo, hh] += 1
den = np.maximum(CNT, 1)
enc = lambda a: ''.join('0123456789a'[int(round(v * 10))] for v in a.ravel())
# ---------------- MPPT: пари стрінгів однієї грані, змішаний — окремо (як abk_deye.py)
SR = []
for k, ids in enumerate(S_):
    e, e0, emo = L.string_energy(ST, ids)
    SR.append(dict(k=k + 1, n=len(ids), ids=list(map(int, ids)), parts=''.join(sorted(set(M[i]['part'] for i in ids))), faces=''.join(sorted(set(M[i]['face'] for i in ids))),
                   tilt=round(float(np.mean([M[i]['tilt'] for i in ids])), 1), mwh=round(e / 1000, 3), mism=round((1 - e / e0) * 100, 1), mo=[round(x / 1000, 3) for x in emo]))
need = len(SR) - 6; pairs = []; left = []
for f in ('E', 'W'):
    g = sorted([x for x in SR if x['faces'] == f], key=lambda x: (x['parts'], x['tilt']))
    while len(g) >= 2 and len(pairs) < need: pairs.append([g.pop(0)['k'], g.pop(0)['k']])
    left += g
left += [x for x in SR if x['faces'] not in ('E', 'W')]
left = sorted(left, key=lambda x: (len(x['faces']) > 1, x['mism']))
while len(pairs) < need and len(left) >= 2: pairs.append([left.pop(0)['k'], left.pop(0)['k']])
MPPT = pairs + [[x['k']] for x in left]
mppt_of = {k: j + 1 for j, g in enumerate(MPPT) for k in g}
# ---------------- центри модулів (план X, Y і висота) і зона трас
GEO = J['geo']; S0_, S1_, S2_, S3_ = GEO['stair']; DEP15, RISE15 = GEO['dep'], GEO['rise']
def center(m):
    if m['src'] == 'archD':
        q = J['archD'][m['i']]; return ((q['xa'] + q['xb']) / 2, (q['y0'] + q['y1']) / 2, (q['za'] + q['zb']) / 2 + 0.14)
    if m['src'] in ('low', 'nad'):
        q = LOWU[m['i']] if m['src'] == 'low' else NADL[m['i']]; zr = q.get('zr', AL['h'])
        return ((q['xa'] + q['xb']) / 2, (q['y0'] + q['y1']) / 2, zr + GEO['hlow'] + RISE15 / 2)
    p = np.mean(np.array(m['pts']), axis=0); return (float(p[0]), float(m['y0']) - 0.12, float(p[2]))
def area(m):
    x, y, z = center(m)
    if m['src'] == 'archD': return 'arch'
    if m['src'] == 'nad': return 'nad'
    if m['src'] == 'wall' and abs(m['y0'] - S2_) < 0.01: return 'stE'
    return 'lowW' if x < 116.3 else 'lowE'
C = [center(m) for m in M]; AR = [area(m) for m in M]
# ---------------- лотки: ламані (X, Y, висота); 100×50 з кришкою
ZR = AL['h'] + 0.15
def arch_line(y, x0, x1, step=1.0):
    n = max(1, int(abs(x1 - x0) / step)); return [(x0 + (x1 - x0) * i / n, y, za(x0 + (x1 - x0) * i / n) + 0.1) for i in range(n + 1)]
XT, YW1, YW2 = 121.65, 28.43, 36.43                                   # зв'язка; доріжки після 3-го і 6-го рядів
XD = 120.9                                                            # спуск по південній стіні основного блоку (за надбудовою, 1 м від П1)
INVN = (119.0, 18.15, ZR); INV = dict(x=119.0, y=17.8 + 0.05 + 0.157, z0=10.6, w=0.824, h=0.516, d=0.313)
TRAYS = {
    'pass': dict(pts=[INVN, (119.0, 20.12, ZR)], area='low', note='crossing'),
    'wallW': dict(pts=[(110.0, 20.12, ZR), (116.3, 20.12, ZR), (119.0, 20.12, ZR)], area='lowW'),
    'wallD': dict(pts=[(119.0, 20.12, ZR), (XD, 20.12, ZR)], area='low'),
    'desc': dict(pts=[(XD, 20.12, ZR), (XD, 20.18, ZR + 0.1), (XD, 20.18, za(XD) + 0.55), (XD, 20.85, za(XD) + 0.55), (XD, 20.85, za(XD) + 0.1)], area='wall'),
    'archS': dict(pts=[(XD, 20.85, za(XD) + 0.1), (XD, 21.5, za(XD) + 0.1)] + arch_line(21.5, XD, XT)[1:] + [(XT, 28.43, za(XT) + 0.1), (XT, 36.43, za(XT) + 0.1)], area='arch'),
    'w1W': dict(pts=arch_line(YW1, 109.4, XT), area='arch'), 'w1E': dict(pts=arch_line(YW1, 127.1, XT), area='arch', note='crossing'),
    'w2W': dict(pts=arch_line(YW2, 109.4, XT), area='arch'), 'w2E': dict(pts=arch_line(YW2, 127.1, XT), area='arch', note='crossing'),
    'lowE': dict(pts=[(126.9, 20.12, ZR), (123.2, 20.12, ZR), (123.2, 17.4, ZR), (S1_ + 0.12, 17.4, ZR), (S1_ + 0.12, 17.95, ZR), (120.6, 17.95, ZR), (119.0, 17.95, ZR), INVN], area='lowE'),
    'stE': dict(pts=[(S1_ - 0.2, S2_ - 0.15, ZR), (S1_ + 0.12, S2_ - 0.15, ZR), (S1_ + 0.12, 17.4, ZR)], area='stE'),
    'nad': dict(pts=[(120.6, 9.0, 11.95 + 0.15), (120.6, SPLIT - 0.1, 11.95 + 0.15), (120.6, SPLIT - 0.1, 13.0 + 0.45), (120.6, SPLIT + 0.45, 13.0 + 0.45), (120.6, SPLIT + 0.45, 13.0 + 0.15),
                     (120.6, S3_ - 0.5, 13.0 + 0.15), (120.6, S3_ - 0.5, 13.0 + 0.45), (120.6, S3_ + 0.15, 13.0 + 0.45), (120.6, S3_ + 0.15, ZR + 0.05), (120.6, 17.95, ZR)], area='nad'),
}
r3 = lambda p: (round(p[0], 3), round(p[1], 3), round(p[2], 3))
GR = collections.defaultdict(dict); NODES = collections.defaultdict(set)
def link(a, b):
    a, b = r3(a), r3(b); d = math.dist(a, b)
    if d < 1e-6: return
    GR[a][b] = d; GR[b][a] = d
for key, t in TRAYS.items():
    pts = t['pts']
    for a, b in zip(pts, pts[1:]):                                    # підвузли через 0,5 м — для приєднання кабелів
        n = max(1, int(math.dist(a, b) / 0.5)); prev = a
        for i in range(1, n + 1):
            q = tuple(a[j] + (b[j] - a[j]) * i / n for j in range(3)); link(prev, q); NODES[t['area']].add(r3(q)); prev = q
        NODES[t['area']].add(r3(a))
# стики ламаних (точки однієї ламаної на іншій): зшити найближчі вузли < 5 см
allp = list(GR.keys())
for i, a in enumerate(allp):
    for b in allp[i + 1:]:
        if 0 < math.dist(a, b) < 0.05: link(a, b)
def dijkstra(src):
    D = {src: 0.0}; PR = {}; q = [(0.0, src)]
    while q:
        d, u = heapq.heappop(q)
        if d > D[u]: continue
        for v, w in GR[u].items():
            nd = d + w
            if nd < D.get(v, 1e18): D[v] = nd; PR[v] = u; heapq.heappush(q, (nd, v))
    return D, PR
DI, PRI = dijkstra(r3(INVN))
def path_to_inv(n):
    out = [n]
    while out[-1] != r3(INVN): out.append(PRI[out[-1]])
    return out
CAND = {'arch': NODES['arch'], 'lowW': NODES['lowW'] | NODES['low'], 'lowE': NODES['lowE'], 'nad': NODES['nad'], 'stE': NODES['stE']}
def stub(i):
    """кабель від модуля до найближчого вузла лотка своєї зони: під модулями вздовж лаги (Манхеттен), для стін — униз і вздовж стіни"""
    x, y, z = C[i]; best = None
    for n in CAND[AR[i]]:
        d = abs(n[0] - x) + abs(n[1] - y) + abs(n[2] - z)
        if best is None or d < best[0]: best = (d, n)
    d, n = best
    pts = [(x, y, z), (x, n[1], z) if AR[i] == 'arch' else (n[0], y, z), (n[0], n[1], z), n]
    return d, n, pts
STB = [stub(i) for i in range(len(M))]
dist_inv = lambda i: STB[i][0] + DI[STB[i][1]]
LEAD = 2.4                                                            # виводи 2 × 1,2 м
def jumper(a, b):
    xa, ya, za_ = C[a]; xb, yb, zb_ = C[b]
    d = abs(xa - xb) + abs(ya - yb) + abs(za_ - zb_)
    if math.dist(C[a], C[b]) <= 2.6: return None
    if AR[a] == AR[b] and d < 8: return dict(len=round(d - LEAD + 0.5, 1), pts=[C[a], (xb, ya, za_), C[b]])
    Da, _ = dijkstra(STB[a][1]); g = Da[STB[b][1]]
    return dict(len=round(STB[a][0] + g + STB[b][0] - LEAD + 0.5, 1), pts=STB[a][2] + [STB[b][1]] + STB[b][2][::-1], via=True)
for s in SR:
    ids = s['ids']; byA = collections.defaultdict(list)
    for i in ids: byA[AR[i]].append(i)
    order = sorted(byA, key=lambda a: -max(dist_inv(i) for i in byA[a]))      # зони: від найдальшої до інвертора
    chain = []
    for a in order:                                                   # «змійка» в зоні: колонками (X), у колонці — то вгору, то вниз
        cols = collections.defaultdict(list)
        for i in byA[a]: cols[round(C[i][0] * 2) / 2 if a != 'arch' else J['archD'][M[i]['i']]['col']].append(i)
        keys = sorted(cols, key=lambda c: -abs(np.mean([C[i][0] for i in cols[c]]) - INVN[0]))
        prev_y = None
        for n, c in enumerate(keys):
            col = sorted(cols[c], key=lambda i: (C[i][1], C[i][2]))
            if prev_y is not None and abs(C[col[-1]][1] - prev_y) < abs(C[col[0]][1] - prev_y): col = col[::-1]
            elif prev_y is None and dist_inv(col[-1]) > dist_inv(col[0]): col = col[::-1]
            chain += col; prev_y = C[col[-1]][1]
    s['chain'] = chain; s['mppt'] = mppt_of[s['k']]
    hr = []
    for e in (chain[0], chain[-1]):
        d, n, sp = STB[e]; pth = path_to_inv(n)
        hr.append(dict(m=e, len=round(d + DI[n] + 0.45 + 1.5, 1), pts=[list(map(lambda v: round(v, 3), p)) for p in sp + pth[1:] + [(INV['x'], INV['y'], INV['z0'])]]))
    s['plus'], s['minus'] = hr
    s['jump'] = []
    for a, b in zip(chain, chain[1:]):
        j = jumper(a, b)
        if j: s['jump'].append(dict(a=a, b=b, len=j['len'], via=bool(j.get('via')), pts=[[round(v, 3) for v in p] for p in j['pts']]))
    s['dc'] = round(s['plus']['len'] + s['minus']['len'] + sum(j['len'] for j in s['jump']), 1)
    s['vmp70'] = round(len(ids) * 37.0); s['voc30'] = round(len(ids) * 49.5 * (1 + 0.0025 * 55), 1)
# ---------------- кількості: лотки
def tray_stats():
    out = dict(h=0.0, v=0.0, roof=0.0, wall=0.0, corners_h=0, corners_v=0, ends=0, crossings=0)
    for key, t in TRAYS.items():
        pts = t['pts']
        for a, b in zip(pts, pts[1:]):
            dh = math.hypot(b[0] - a[0], b[1] - a[1]); dz = abs(b[2] - a[2]); L_ = math.dist(a, b)
            if dz > 0.3 and dz > dh: out['v'] += L_; out['wall'] += L_
            else: out['h'] += L_; out['roof'] += L_
        for a, b, c in zip(pts, pts[1:], pts[2:]):
            u = np.subtract(b, a); w = np.subtract(c, b)
            if np.linalg.norm(u) < 1e-6 or np.linalg.norm(w) < 1e-6: continue
            cosang = float(np.dot(u, w) / np.linalg.norm(u) / np.linalg.norm(w))
            if cosang < 0.9:
                if abs(u[2]) > 0.3 * np.linalg.norm(u) or abs(w[2]) > 0.3 * np.linalg.norm(w): out['corners_v'] += 1
                else: out['corners_h'] += 1
        if t.get('note') == 'crossing': out['crossings'] += 1
    return out
TS = tray_stats()
TEES = 7                                                              # стики: w1W/w1E/w2W/w2E на зв'язці (2 хрестовини = 4 трійники), wallD/pass, stE/lowE, nad/lowE
TS['tees'] = TEES; TS['ends'] = 6
# ---------------- кріплення і вирівнювання потенціалів: механічно зв'язані блоки
def arch_groups():
    G_ = collections.defaultdict(list)
    for i, m in enumerate(M):
        if m['src'] != 'archD': continue
        q = J['archD'][m['i']]; y = q['y0']
        band = 'S' if y < YW1 else 'M' if y < YW2 else 'N'
        side = '' if band == 'N' else ('W' if q['col'] <= 8 else 'E')
        G_['arch-' + band + side].append(i)
    return G_
GRP = arch_groups()
for i, m in enumerate(M):
    if m['src'] == 'low':
        x = C[i][0]; key = 'low-W1' if x < 112.0 else 'low-W2' if x < 116 else 'low-E1' if x < 125.1 else 'low-E2'; GRP[key].append(i)
    elif m['src'] == 'nad': GRP['nad-' + ('N' if C[i][1] > 13.95 else 'S')].append(i)
    elif m['src'] == 'wall': GRP['wall-' + ('st' if AR[i] == 'stE' else 'W' if C[i][0] < 116 else 'E')].append(i)
LPS = []
for g, ids in GRP.items():
    ids = [i for i in ids if sid[i]]                                 # лише модулі в стрінгах
    if not ids: continue
    ends = [min(ids, key=lambda i: STB[i][0]), max(ids, key=lambda i: math.dist(C[i], C[min(ids, key=lambda j: STB[j][0])]))]
    con = []
    for e in ends:
        d, n, sp = STB[e]; con.append(dict(m=e, len=round(d + 1.0, 1), pts=[[round(v, 3) for v in p] for p in sp]))
    LPS.append(dict(g=g, n=len(ids), con=con))
TRAY_LEN = TS['h'] + TS['v']
BOND6 = TRAY_LEN * 1.1 + sum(c['len'] for g in LPS for c in g['con'])
# ---------------- вивід
mods = []
for i, m in enumerate(M):
    q = dict(src=m['src'], i=int(m['i']) if m['src'] != 'low' else int(LOW_IDX[m['i']]), part=m['part'], face=m['face'], tilt=round(float(m['tilt']), 1), area=AR[i],
             c=[round(v, 3) for v in C[i]], k=int(sid[i]), mppt=mppt_of.get(int(sid[i]), 0), kwh=round(float(E[i])), offh=round(float(offh[i])), offp=round(float(offh_p[i])), prth=round(float(prth[i])),
             off=enc(OFF[i] / den), prt=enc(PRT[i] / den), bck=enc(BCK[i] / den))
    if sid[i]: q['ord'] = SR[sid[i] - 1]['chain'].index(i) + 1
    mods.append(q)
NIN = int((sid > 0).sum())
OUT = dict(
    L=LS, nmin=NMIN, n=NIN, places=len(M), drop=[i for i in range(len(M)) if not sid[i]], kwp=round(NIN * 0.73, 2), mwh=round(best['tot'] / 1000, 1),
    inv=dict(model='Deye SUN-100K-G03', vmax=1000, start=250, mppt_v=[200, 850], nmppt=6, imax=40, isc=60, pac=100, iac=159.4, eta=0.982, pos=INV, node=list(INVN)),
    mppt=MPPT, strings=[{k: v for k, v in s.items() if k != 'ids'} for s in SR], mods=mods,
    trays={k: dict(pts=[[round(v, 3) for v in p] for p in t['pts']], area=t['area'], note=t.get('note', '')) for k, t in TRAYS.items()},
    tray_stats={k: (round(v, 1) if isinstance(v, float) else v) for k, v in TS.items()}, tray_len=round(TRAY_LEN, 1),
    lps=dict(groups=LPS, bond6=round(BOND6, 1), bond16=6.0, tie=[XD, 20.42, za(XD) + 0.5]),
    hour=dict(off=[[round(float(HOUR_OFF[mo, h] / max(HOUR_N[mo, h], 1)), 1) for h in range(24)] for mo in range(12)], n=[[int(CNT[mo, h]) for h in range(24)] for mo in range(12)]),
    dc=dict(plus=round(sum(s['plus']['len'] for s in SR), 1), minus=round(sum(s['minus']['len'] for s in SR), 1), jump=round(sum(j['len'] for s in SR for j in s['jump']), 1), njump=sum(len(s['jump']) for s in SR)),
    days=[Wm['nd'] for Wm in L.WX['mo']])
json.dump(OUT, open('/home/claude/galkat-20/antares/abk/abk_dbn.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(f"ДБН: L={LS}, {len(SR)} стрінгів, у стрінгах {NIN} з {len(M)}, {OUT['kwp']} кВтп, {OUT['mwh']} МВт·год; MPPT {MPPT}")
for s in SR: print(f"  S{s['k']} MPPT{s['mppt']} {s['n']} {s['parts']} {s['faces']} {s['mwh']} МВт·год, невідп. {s['mism']} %, DC {s['dc']} м (+{s['plus']['len']} −{s['minus']['len']}, перемичок {len(s['jump'])})")
print('лотки', TS, 'разом', round(TRAY_LEN, 1)); print('DC', OUT['dc']); print('вирівнювання: блоків', len(LPS), 'Cu 1×6', round(BOND6, 1))
print('найдовше не працює (год/рік, ясно):', sorted([(round(float(offh[i])), M[i]['src'], int(M[i]['i'])) for i in range(len(M)) if sid[i]], reverse=True)[:8])
print('загалом модуле-годин не працює:', round(float(offh[sid > 0].sum())), 'частково:', round(float(prth[sid > 0].sum())))
