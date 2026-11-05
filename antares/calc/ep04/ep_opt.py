# -*- coding: utf-8 -*-
"""Антарес, 2 етапи — оптимізація електричної частини DC: стрінги → щити PV → лінії Al → ШВ → входи DC/DC контейнерів.
Дані — з двійника (roof28 В1, ліхтарі, фасади, склад варіанта Б, контейнери). Ціни — кошторис Б 26.10 (Китай FOB × 1,2 з доставкою/митом/комісією).
Втрати: τ з моделі погоди двійника (WX.mo, горизонтальна площина): τ = Σ(G/1000)²Δt."""
import json, math, heapq, collections, itertools
D = json.load(open('data.json'))
# ---------------- параметри
IMP, ISC, VMP_STC = 17.51, 18.51, 41.69 * 11          # A, A, В (рядок 11 модулів)
VOP = 430.0                                           # робоча напруга рядка, В (≈50 °C)
RHO = {'Al': 0.0316, 'Cu': 0.0196}                    # Ом·мм²/м при ≈50 °C
PRICE = {120: 2.04, 185: 3.12, 240: 4.07, 300: 5.10}   # $/м FOB (300 — оцінка за ціною Al LME пропорційно перерізу)
K_IMP = 1.2                                            # FOB → на об'єкті (доставка, мито 7 %, комісія 5 %)
LUG = {120: 1.54, 185: 2.04, 240: 2.54, 300: 3.2}
TARIFF, DISC, YEARS = 0.13, 0.10, 25
PVF = (1 - (1 + DISC) ** -YEARS) / DISC                 # 9,08
# ---------------- τ
E_h = TAU = 0
for m in D['wx']:
    st = m['st']; dt = st[1][0] - st[0][0]
    for s in st:
        G = s[1]; p = m['p']; c = m['c']
        E_h += m['nd'] * (p * G + (1 - p) * c * G) / 1000 * dt
        TAU += m['nd'] * (p * G * G + (1 - p) * (c * G) ** 2) / 1e6 * dt
TAU_F = {'roof': TAU, 'lan': 0.80 * TAU, 'fac': 0.60 * TAU, 'wh': 0.95 * TAU, 'abk': 0.95 * TAU}   # фасади вертикально і скло 41–46° — нижчі піки (оцінка)
# ---------------- коридори даху (план X, Y)
# 05.11.2026 (перевірка проходів на моделі): лотки не посередині проходів, а біля краю — так, щоб лишалась потрібна ширина
#   смуга Пд і Пн — лоток і щити на парапеті (кронштейни, без блоків на ходовій смузі); схід — на парапеті (край поля зайнятий трубами Д36, Д57);
#   захід — на блоках біля краю поля; проходи Пн–Пд — біля східного краю проходу; Сх–Зх — біля південного краю (щит не затіняє модулі; власник 05.11:
#   «біля краю поля»); уздовж ендов X 18 і X 72 лотків немає (власник 05.11: лінії К-4 — у західну смугу)
YS, Y1, Y2, YN = -0.17, 31.34, 62.70, 96.26
# X 18,7 — уздовж ендови X 18 між ліхтарями Л1 і Л2: проходи Сх–Зх тут з обох боків перекриті ліхтарями, іншого виходу з цієї ділянки немає;
# лоток на підставках біля східного краю ендови (вісь стоку X 18,0 і лівневка ЛВ-2 лишаються вільними), лише від Y1 на північ
XS_ = [1.985, 18.7, 37.58, 55.91, 96.31]
PEN = {}
XRANGE = {18.7: (31.34, 96.26)}
PIPES = [(p[1], p[2], p[3]) for p in D.get('pipes', [])]   # труби даху: X, Y, діаметр
def pipe_hit(x0, y0, x1, y1, half=0.15):
    for px, py, d in PIPES:
        r = d / 2 + 0.05 + half
        if min(x0, x1) - r <= px <= max(x0, x1) + r and min(y0, y1) - r <= py <= max(y0, y1) + r: return True
    return False
LAN = [(f['id'], f['xc'], f['y0'], f['y1'], f['hw']) for f in D['frames']]
def blocked(y, xa, xb):
    for _, xc, y0, y1, hw in LAN:
        if y0 - 0.5 <= y <= y1 + 0.5 and not (xb <= xc - hw or xa >= xc + hw): return True
    return False
nodes = set()
for y in (YS, Y1, Y2, YN):
    for x in XS_: nodes.add((x, y))
def graph(extra):
    N = set(nodes) | set(extra); adj = collections.defaultdict(list)
    for y in (YS, Y1, Y2, YN):
        row = sorted(n for n in N if abs(n[1] - y) < 1e-6)
        for a, b in zip(row, row[1:]):
            if not blocked(y, a[0], b[0]) and not pipe_hit(a[0], y, b[0], y): d = b[0] - a[0]; adj[a].append((b, d)); adj[b].append((a, d))
    for x in XS_:
        col = sorted((n for n in N if abs(n[0] - x) < 1e-6), key=lambda n: n[1])
        for a, b in zip(col, col[1:]):
            if pipe_hit(x, a[1], x, b[1]): continue
            if x in XRANGE and (min(a[1], b[1]) < XRANGE[x][0] - 0.01 or max(a[1], b[1]) > XRANGE[x][1] + 0.01): continue
            d = (b[1] - a[1]) * PEN.get(x, 1.0); adj[a].append((b, d)); adj[b].append((a, d))
    return adj
def dijk(adj, s):
    dist = {s: 0}; prev = {}; q = [(0, s)]
    while q:
        d, u = heapq.heappop(q)
        if d > dist.get(u, 1e9): continue
        for v, w in adj[u]:
            if d + w < dist.get(v, 1e9): dist[v] = d + w; prev[v] = u; heapq.heappush(q, (d + w, v))
    return dist, prev
def path(prev, s, t):
    p = [t]
    while p[-1] != s: p.append(prev[p[-1]])
    return p[::-1]
# спуски — у простінках між вікнами (05.11): схід Y 53,9 — проміжок у модулях фасаду (10,3 / 12,7 м) і в козирку, навпроти К-3; північ X 11,95
DE, DN = (96.31, 53.9), (11.95, YN)
nodes |= {DE, DN}
# спуск і земля до ШВ, м: схід — з парапету +16,5 до ШВ на стіні навпроти торця К-3 (Y 53,3) і, по фасаду на 3,5 м, К-1 (Y 62,7);
# північ — стіна цеху → дах ТП-6923 → місток над приямком → берма: ШВ К-4 біля західного торця, К-5 — біля східного (не в проміжку між контейнерами)
OFF = {'E': {'K-3': 17.0, 'K-1': 25.0}, 'N': {'K-4': 32.0, 'K-5': 28.1}}
SHV = {'K-3': (96.89, 53.3), 'K-1': (96.89, 62.7), 'K-4': (0.6, 110.9), 'K-5': (15.66, 110.9)}
# ---------------- щити даху В1 (етап 2): стрінги стовпчиками вздовж Y; кінці — на проходах / смугах
R = D['roof']; ss = collections.defaultdict(list)
for m in R:
    if m[4] >= 0: ss[m[4]].append(((m[0] + m[1]) / 2, m[2], m[3]))
LINES_Y = [YS, Y1, Y2, YN]
att = []
for k, v in ss.items():
    xs = [a for a, b, c in v]; ys = [b for a, b, c in v]; x = sum(xs) / len(xs); ya, yb = min(ys), max(ys)
    cand = []
    for L in LINES_Y:
        d = min(abs(ya - L), abs(yb - L))
        if blocked(L, x - 0.3, x + 0.3): continue
        cand.append((d, L))
    d, L = min(cand); att.append((L, x, k, d, sum(c for a, b, c in v)))
boxes = []
for L in LINES_Y:
    a = sorted(t for t in att if t[0] == L)
    grp = []
    for t in a:
        if grp and (len(grp) == 7 or t[1] - grp[-1][1] > 6.0 or blocked(L, grp[-1][1], t[1])):
            boxes.append(grp); grp = []
        grp.append(t)
    if grp: boxes.append(grp)
# злиття малих щитів із сусідами на тій самій лінії (разом ≤ 7, відстань між крайніми стрінгами ≤ 14 м, без ліхтаря між ними)
merged = True
while merged:
    merged = False
    boxes.sort(key=lambda g: (g[0][0], g[0][1]))
    for i in range(len(boxes) - 1):
        a, b = boxes[i], boxes[i + 1]
        if a[0][0] == b[0][0] and len(a) + len(b) <= 7 and b[-1][1] - a[0][1] <= 14.0 and not blocked(a[0][0], a[-1][1], b[0][1]):
            boxes[i] = a + b; del boxes[i + 1]; merged = True; break
# малі щити (≤ 3 стрінги): стрінг переводимо на інший кінець (інша лінія), якщо там є щит із вільним місцем у межах 10 м
ends = {}
for k, v in ss.items():
    ys = [b for a, b, c in v]; ya, yb = min(ys), max(ys); ends[k] = [L for L in LINES_Y if min(abs(ya - L), abs(yb - L)) < 4.0]
moved = True
while moved:
    moved = False
    for g in sorted(boxes, key=len):
        if len(g) > 3: continue
        for t in list(g):
            for L in ends[t[2]]:
                if L == t[0]: continue
                tg = [h for h in boxes if h is not g and h[0][0] == L and len(h) < 7 and min(abs(u[1] - t[1]) for u in h) < 10.0 and not blocked(L, min(u[1] for u in h + [t]), max(u[1] for u in h + [t]))]
                if tg:
                    h = tg[0]; nt = (L, t[1], t[2], t[3], t[4]); h.append(nt); h.sort(key=lambda u: u[1]); g.remove(t); moved = True; break
        boxes[:] = [h for h in boxes if h]
        if moved: break
RB = []
for g in boxes:
    x = sorted(t[1] for t in g)[len(g) // 2]
    RB.append({'id': None, 'X': round(x, 2), 'Y': g[0][0], 'ns': len(g), 'kwh': sum(t[4] for t in g), 'dstr': sum(t[3] for t in g), 'z': 'roof', 'st': 2})
import os
if os.environ.get('MERGED') and os.path.exists('rb_merged.json'):
    RB = json.load(open('rb_merged.json'))['RB']
    # rb_merged.json — розподіл стрінгів 04.11 (лінії Y 0,9 / 32,395 / 63,757 / 95,4); 05.11 лотки біля краю — ті самі щити, нові лінії
    _MY = {0.9: YS, 32.395: Y1, 63.757: Y2, 95.4: YN}
    for b in RB: b['Y'] = _MY.get(b['Y'], b['Y'])
# ---------------- ліхтарі (етап 1): щит біля ліхтаря на проході Y2, з боку, що має вихід
FR = D['frame']; lst = collections.defaultdict(lambda: collections.Counter()); lkwh = collections.Counter()
for m in FR:
    if m[5] >= 0: lst[m[0]][m[5]] += 1; lkwh[m[0]] += m[4] * 0.876   # 0,876 — перерахунок 13° → скло 41–46° (lan28: 183,0 / 208,9)
side = {1: -1, 2: 1, 3: 1, 4: 1}
LB = []
for i, (lid, xc, y0, y1, hw) in enumerate(LAN, 1):
    LB.append({'id': f'ЩЛ-{i}', 'X': round(xc + side[i] * (hw + 0.4), 2), 'Y': Y2, 'ns': len(lst[i]), 'kwh': lkwh[i], 'z': 'lan', 'st': 1})
# 04.11 (17:19, перевірка стрінгів по модулях двійника): на ліхтарях 297 модулів у стрінгах = 27 стрінгів по 11 (Л1 — 6, Л2–Л4 — по 7) і 19 модулів на освітлення;
# попереднє «по 7 на щит (28)» рахувало стрінг, якого немає, — прибрано, ns — з розкладки
# ---------------- фасади (етап 1)
FV = D['fac']['vert']; FC = D['fac']['can']; fs = collections.defaultdict(list)
for m in FV: fs[m[6]].append((m[0], m[1] + m[3] / 2, m[5]))
for m in FC: fs[m[5]].append((m[0] + 'c', m[3], m[4]))
fac_groups = collections.defaultdict(list)
for k, v in fs.items():
    f = v[0][0]; s = sum(a[1] for a in v) / len(v); fac_groups[f].append((s, k, sum(a[2] for a in v)))
FB = []
for f, lst_ in fac_groups.items():
    lst_.sort(); n = len(lst_); nb = math.ceil(n / 7); per = math.ceil(n / nb)
    for i in range(nb):
        g = lst_[i * per:(i + 1) * per]
        if not g: continue
        s = sum(t[0] for t in g) / len(g)
        FB.append({'id': None, 'f': f, 's': round(s, 1), 'ns': len(g), 'kwh': sum(t[2] for t in g), 'z': 'fac', 'st': 1})
# 05.11 (власник): щити південного фасаду і щит східного фасаду за прибудовою ТП-5913 (Y < 34,6) — на даху біля парапету; стрінги — угору за модулями
# (зазор 0,16 м), лінії — разом з лініями даху до спуску; на фасаді лотка немає (5 воріт, тамбур, вікно, прибудова ТП-5913 на куті)
for b in FB:
    if b['f'] == 'S': b.update(roof=True, X=b['s'], Y=YS)
    elif b['f'] == 'E' and b['s'] < 34.6: b.update(roof=True, X=XS_[-1], Y=b['s'])
def fac_len(b, K):   # щити на східному фасаді (Y > 34,6): лоток на 3,5 м уздовж фасаду до ШВ на стіні
    return abs(SHV[K][1] - b['s']) + 1.5 + 2.0 + 2 * 3.0
# ---------------- склад (етап 1): лінії варіанта Б (152–172 м до K-2/K-1) → до K-3/K-1
WB = [{'id': b['n'], 'L0': b['L'], 'ns': b['ns'], 'z': 'wh', 'st': 1, 'K0': b['K']} for b in D['ep']['boxes'] if b['zone'] == 'склад']
import os as _os
WHN = {w['id']: w for w in json.load(open('wh_abk.json', encoding='utf-8'))['wh']} if _os.path.exists('wh_abk.json') else {}
# 05.11 (власник): АБК без Deye — 2 щити ЩА-1 / ЩА-2 у найближчі контейнери К-3 / К-1 (траси і довжини — abk_wh.py)
AB_ = [{'id': a['id'], 'z': 'abk', 'st': 1, 'ns': a['ns'], 'X': a['X'], 'Y': a['Y'], 'K0': a['K'], 'L0': a['L']}
       for a in json.load(open('wh_abk.json', encoding='utf-8')).get('abk', [])] if _os.path.exists('wh_abk.json') else []
# 06.11 (власник): північні скати складу (опція етапу 1) — щити ЩС-Пн1 / Пн2, кожен на свій вхід MPPT К-1 / К-3; немає в wh_abk.json — немає й рядків
AB_ += [{'id': a['id'], 'z': 'whn', 'st': 1, 'ns': a['ns'], 'X': a['X'], 'Y': a['Y'], 'K0': a['K'], 'L0': a['L']}
        for a in ((json.load(open('wh_abk.json', encoding='utf-8')).get('whn') or {}).get('boxes', []) if _os.path.exists('wh_abk.json') else [])]
# ---------------- економіка перерізу
def line_cost(S, L): return 2 * L * PRICE[S] * K_IMP + 4 * LUG[S]
def loss_kw(S, L, ns, mat='Al'): I = ns * IMP; Rl = 2 * RHO[mat] * L / S; return I * I * Rl / 1000
def best(L, ns, tau, rule='npv'):
    out = []
    for S in (120, 185, 240, 300):
        pk = loss_kw(S, L, ns); du = pk * 1000 / (ns * IMP) / VOP * 100
        if du > 3.0 or ns * ISC * 1.25 > {120: 250, 185: 320, 240: 380, 300: 430}[S]: continue
        e = pk * tau; npv = e * TARIFF * PVF
        out.append((line_cost(S, L) + (npv if rule == 'npv' else 0), S, pk, du, e, line_cost(S, L), npv))
    if rule == 'du25':
        ok = [o for o in out if o[3] <= 2.5]; return min(ok, key=lambda o: o[1]) if ok else min(out, key=lambda o: o[3])
    return min(out)
def route_len(b, desc):
    extra = [(b['X'], b['Y'])]; adj = graph(extra); dist, prev = dijk(adj, (b['X'], b['Y']))
    return dist.get(desc, 1e9), (prev, (b['X'], b['Y']))
SLACK = lambda l: l * 1.05 + 4.0
def eval_all(assign_roof, rule='npv', lan_to=None):
    rows = []
    # етап 1
    for b in FB:
        K = 'K-3' if b['f'] == 'S' else 'K-1'
        L = SLACK(route_len(b, DE)[0] + OFF['E'][K]) if b.get('roof') else SLACK(fac_len(b, K))
        r = best(L, b['ns'], TAU_F['fac'], rule); rows.append(dict(b, K=K, L=L, S=r[1], pk=r[2], du=r[3], e=r[4], cab=r[5], npv=r[6]))
    for b in WB:
        L = b['L0'] - (12.0 if b['K0'] == 'K-2' else 0); K = 'K-3' if b['K0'] == 'K-2' else 'K-1'
        if b['id'] in WHN: L, K = WHN[b['id']]['L'], WHN[b['id']]['K']      # 04.11: траса до нових місць К-3 / К-1 (wh_abk.py)
        r = best(L, b['ns'], TAU_F['wh'], rule); rows.append(dict(b, K=K, L=L, S=r[1], pk=r[2], du=r[3], e=r[4], cab=r[5], npv=r[6]))
    for b in AB_:
        L, K = b['L0'], b['K0']; r = best(L, b['ns'], TAU_F['abk'], rule); rows.append(dict(b, K=K, L=L, S=r[1], pk=r[2], du=r[3], e=r[4], cab=r[5], npv=r[6]))
    for b in LB:
        side_ = (lan_to or {}).get(b['id'], 'N')
        rl, _ = route_len(b, DN if side_ == 'N' else DE)
        K = ('K-4' if b['X'] < 30 else 'K-5') if side_ == 'N' else 'K-1'
        L = SLACK(rl + OFF[side_][K]); r = best(L, b['ns'], TAU_F['lan'], rule); rows.append(dict(b, K=K, L=L, S=r[1], pk=r[2], du=r[3], e=r[4], cab=r[5], npv=r[6], side=side_))
    # етап 2
    for i, b in enumerate(RB):
        side_ = assign_roof[i]
        rl, _ = route_len(b, DE if side_ == 'E' else DN)
        K = ('K-1' if b['Y'] > 40 else 'K-3') if side_ == 'E' else ('K-4' if b['X'] < 40 else 'K-5')
        L = SLACK(rl + OFF[side_][K]); r = best(L, b['ns'], TAU_F['roof'], rule); rows.append(dict(b, K=K, L=L, S=r[1], pk=r[2], du=r[3], e=r[4], cab=r[5], npv=r[6], side=side_))
    return rows
# призначення даху: кожен щит — до дешевшої пари (з урахуванням втрат), з обмеженням входів
def assign_opt(capE, capN, rule='npv'):
    opt = []
    for i, b in enumerate(RB):
        c = {}
        for s_, d_ in (('E', DE), ('N', DN)):
            rl, _ = route_len(b, d_); K = list(OFF[s_])[0]; L = SLACK(rl + OFF[s_][K]); r = best(L, b['ns'], TAU_F['roof'], rule); c[s_] = r[0]
        opt.append((c['E'] - c['N'], i))
    opt.sort()   # від’ємне — вигідніше схід
    a = ['N'] * len(RB); nE = 0
    for dlt, i in opt:
        if (dlt < 0 and nE < capE) or (len(RB) - nE > capN): a[i] = 'E'; nE += 1
    return a
if __name__ == '__main__':
    print(f'τ = {TAU:.0f} год, E_h = {E_h:.0f} кВт·год/м², κ = {TAU / E_h:.3f}; PVF = {PVF:.2f}')
    print('щитів даху', len(RB), [b['ns'] for b in RB], 'стрінгів', sum(b['ns'] for b in RB))
    print('щитів ліхтарів', [(b['id'], b['X'], b['ns']) for b in LB]); print('щитів фасадів', [(b['f'], b['s'], b['ns']) for b in FB]); print('склад', [(b['id'], b['L0'], b['ns']) for b in WB])
    json.dump({'RB': RB, 'LB': LB, 'FB': FB, 'WB': WB, 'TAU': TAU, 'E_h': E_h}, open('boxes.json', 'w'), ensure_ascii=False)
