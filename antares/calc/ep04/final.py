# Рекомендований варіант: S3 (Л4 → ТП-5913), переріз за NPV з обмеженням du ≤ 2,5 %, баланс входів у парі ≤ 12; лотки за маршрутами; втрати
from ep_opt import *
# VAR=1 — етап 1 на обидві ТП (Л1–Л3 → К-4 / К-5, Л4 → К-1); VAR=2 (власник 04.11, 18:04) — увесь етап 1 (фасади, склад, ліхтарі) → К-3 / К-1 (ТП-5913),
# К-4 / К-5 (ТП-6923) в етапі 1 — без PV, лише мережа (заряд / розряд); дах етапу 2 — решта входів К-3 / К-1 і К-4 / К-5
import os
VAR = os.environ.get('VAR', '2')
if VAR == '1':
    lan_to = {'ЩЛ-4': 'E'}
    capE = 24 - (len(FB) + len(WB) + 1); capN = 24 - (len(LB) - 1)
else:
    lan_to = {b['id']: 'E' for b in LB}
    capE = 24 - (len(FB) + len(WB) + len(LB)); capN = 24
a = assign_opt(capE, capN)
rows = eval_all(a, 'npv', lan_to=lan_to)
# du ≤ 2,5 %: якщо більше — наступний переріз
for r in rows:
    if r['du'] > 2.5:
        for S in (185, 240, 300):
            pk = loss_kw(S, r['L'], r['ns']); du = pk * 1000 / (r['ns'] * IMP) / VOP * 100
            if du <= 2.5: r.update(S=S, pk=pk, du=du, e=pk * TAU_F.get(r['z'], TAU), cab=line_cost(S, r['L'])); r['npv'] = r['e'] * TARIFF * PVF; break
# VAR=2: ліхтарі між К-3 і К-1 — так, щоб кВтп етапу 1 на контейнерах були близькі (енергія від панелей за добу ≈ рівна); далі вони не переставляються
FIX = ('fac', 'wh', 'lan') if VAR == '2' else ('fac', 'wh')
if VAR == '2':
    kw1 = {k: sum(r['ns'] for r in rows if r['K'] == k and r['z'] in ('fac', 'wh')) for k in ('K-3', 'K-1')}
    for r in sorted([r for r in rows if r['z'] == 'lan'], key=lambda r: -r['ns']):
        k = min(kw1, key=lambda k: kw1[k]); r['L'] += OFF['E'][k] - OFF['E'][r['K']]; r['K'] = k; kw1[k] += r['ns']
        pk = loss_kw(r['S'], r['L'], r['ns']); du = pk * 1000 / (r['ns'] * IMP) / VOP * 100
        if du > 2.5:
            for S in (185, 240, 300):
                pk = loss_kw(S, r['L'], r['ns']); du = pk * 1000 / (r['ns'] * IMP) / VOP * 100
                if du <= 2.5: r['S'] = S; break
        r.update(pk=pk, du=du, e=pk * TAU_F['lan'], cab=line_cost(r['S'], r['L'])); r['npv'] = r['e'] * TARIFF * PVF
# баланс входів у парі
for pair in (('K-3', 'K-1'), ('K-4', 'K-5')):
    rr = sorted([r for r in rows if r['K'] in pair], key=lambda r: -r['L'])
    cnt = {pair[0]: 0, pair[1]: 0}
    fixed = [r for r in rr if r['z'] in FIX]
    for r in fixed: cnt[r['K']] += 1
    for r in rr:
        if r['z'] in FIX: continue
        k = min(pair, key=lambda k: cnt[k]); dl = OFF['E' if pair[0] == 'K-3' else 'N'][k] - OFF['E' if pair[0] == 'K-3' else 'N'][r['K']]
        if cnt[r['K']] < 12 and cnt[r['K']] <= cnt[k] + 1: k = r['K']; dl = 0
        r['L'] += dl; r['K'] = k; cnt[k] += 1
        pk = loss_kw(r['S'], r['L'], r['ns']); r.update(pk=pk, du=pk * 1000 / (r['ns'] * IMP) / VOP * 100, e=pk * TAU_F.get(r['z'], TAU), cab=line_cost(r['S'], r['L'])); r['npv'] = r['e'] * TARIFF * PVF
inp = collections.Counter(r['K'] for r in rows); kwp = collections.Counter()
for r in rows: kwp[r['K']] += r['ns'] * 8.0311
print('входи', dict(sorted(inp.items())), 'кВтп', {k: round(v) for k, v in sorted(kwp.items())})
al = collections.Counter(); 
for r in rows: al[(r['st'], r['S'])] += 2 * r['L']
print('Al', dict(al))
print('max du', max(r['du'] for r in rows), 'лінії', len(rows))
E_line = sum(r['e'] for r in rows)
# ---------- лотки: маршрути по коридорах, об’єднання відрізків з кількістю ліній
seg = collections.defaultdict(lambda: [0, 0, set()])   # (a,b) -> [ліній етапу1, ліній етапу2, ...]
def add_path(b, desc, stg):
    extra = [(b['X'], b['Y'])]; adj = graph(extra); dist, prev = dijk(adj, (b['X'], b['Y'])); p = path(prev, (b['X'], b['Y']), desc)
    for u, v in zip(p, p[1:]):
        k = (min(u, v), max(u, v)); seg[k][0 if stg == 1 else 1] += 1
for r in rows:
    if r['z'] in ('roof', 'lan'): add_path(r, DE if r.get('side', 'N') == 'E' else DN, r['st'])
    elif r['z'] == 'fac' and r.get('roof'): add_path(r, DE, r['st'])
# 05.11: відрізки різних трас, що йдуть одним коридором, мають різні вузли (місця щитів) і перекриваються — лоток рахуємо по елементарних
# ділянках між усіма вузлами коридору, з сумою ліній (раніше перекриття рахувались двічі)
def partition(sg):
    Hh = collections.defaultdict(list); Vv = collections.defaultdict(list); out = {}
    for (u, v), (n1, n2, _) in sg.items():
        if abs(u[1] - v[1]) < 1e-6: Hh[round(u[1], 4)].append((min(u[0], v[0]), max(u[0], v[0]), n1, n2))
        else: Vv[round(u[0], 4)].append((min(u[1], v[1]), max(u[1], v[1]), n1, n2))
    for c, L, hor in [(c, L, True) for c, L in Hh.items()] + [(c, L, False) for c, L in Vv.items()]:
        ps = sorted({round(p, 4) for a, b, _, _ in L for p in (a, b)})
        for a, b in zip(ps, ps[1:]):
            m1 = sum(t[2] for t in L if t[0] <= a + 1e-6 and t[1] >= b - 1e-6); m2 = sum(t[3] for t in L if t[0] <= a + 1e-6 and t[1] >= b - 1e-6)
            if m1 + m2: out[((a, c), (b, c)) if hor else ((c, a), (c, b))] = [m1, m2, set()]
    return out
seg = partition(seg)
def tray_w(n):   # ліній (по 2 жили Al 120 ≈ Ø19)
    for w, cap in (('100×50', 3), ('200×50', 6), ('300×100', 18), ('400×100', 24), ('600×100', 36)):
        if n <= cap: return w
    return '600×100'
T = collections.defaultdict(lambda: collections.Counter())
# 05.11: спосіб кріплення лотка — на парапеті (кронштейни: смуги Пд, Пн і схід) або на траверсах на блоках (захід, проходи)
def on_par(u, v): return (abs(u[1] - v[1]) < 1e-6 and abs(u[1] - YS) < 1e-6) or (abs(u[1] - v[1]) < 1e-6 and abs(u[1] - YN) < 1e-6) or (abs(u[0] - v[0]) < 1e-6 and abs(u[0] - XS_[-1]) < 1e-6)
MNT = {1: collections.Counter(), 2: collections.Counter()}   # м лотка: 'par' / 'blk'
SEGS = []
for (u, v), (n1, n2, _) in seg.items():
    l = abs(u[0] - v[0]) + abs(u[1] - v[1]); st = 1 if n1 else 2; w = tray_w(n1 + n2) if n1 else tray_w(n2)
    T[st][w] += l; MNT[st]['par' if on_par(u, v) else 'blk'] += l      # етап 1: одразу під кінцеву кількість ліній
    SEGS.append({'a': list(u), 'b': list(v), 'n1': n1, 'n2': n2, 'w': w, 'st': st, 'mnt': 'par' if on_par(u, v) else 'blk'})
# переходи через лоток на ходових смугах і проходах (перехідний місток): лоток на блоках, що перетинає зону впоперек або перекриває її вихід
ZONES = [z for z in D['rules'].get('zones', [])] if isinstance(D['rules'], dict) and D['rules'].get('zones') else None
def walk_zones():
    out = []
    PER = D['rules']['perimeter']; RI = (-0.13, 96.49, -0.25, 96.34)
    out.append(('Пд', 'y', RI[2], RI[2] + 2.54)); out.append(('Пн', 'y', 93.88, RI[3])); out.append(('Зх', 'x', RI[0], 2.185)); out.append(('Сх', 'x', 93.785, RI[1]))
    for p in D['rules']['paths_y']: out.append(('Сх–Зх', 'y', p['yc'] - 1.255, p['yc'] + 1.255))
    for p in D['rules']['paths_x']: out.append(('Пн–Пд', 'x', {7: 35.74, 10: 53.35}[p['valley']], {7: 37.78, 10: 56.11}[p['valley']]))
    return out
WZ = walk_zones(); CROSS = []
for sg in SEGS:
    if sg['mnt'] == 'par': continue
    (x0, y0), (x1, y1) = sg['a'], sg['b']
    for nm, ax, lo, hi in WZ:
        if ax == 'y' and abs(x0 - x1) < 1e-6 and min(y0, y1) < lo + 0.3 and max(y0, y1) > hi - 0.3:
            CROSS.append((nm, round(x0, 2), round((lo + hi) / 2, 2), sg['st']))          # вертикальний лоток упоперек горизонтальної смуги
        if ax == 'x' and abs(y0 - y1) < 1e-6 and min(x0, x1) < lo + 0.3 and max(x0, x1) > hi - 0.3:
            CROSS.append((nm, round((lo + hi) / 2, 2), round(y0, 2), sg['st']))          # горизонтальний лоток упоперек вертикальної смуги / проходу
# короткі вертикальні відрізки між лотком на блоках і лотком на парапеті (захід ↔ Пд/Пн, проходи ↔ Пд/Пн) — теж через ходову смугу
_cr = {}
for nm, x, y, st in CROSS:
    k = (nm, x, y); _cr[k] = min(st, _cr.get(k, 9))
CROSS = sorted((k[0], k[1], k[2], v) for k, v in _cr.items())
# щити на парапеті (смуги Пд, Пн): стрінги з краю поля — коротким лотком через смугу, з переходом; щити в проходах Сх–Зх — стрінги з північного поля так само
NBX_CROSS = {1: 0, 2: 0}
for r in rows:
    if r['z'] in ('roof', 'lan') or (r['z'] == 'fac' and r.get('roof')):
        if r['z'] == 'roof' and (abs(r['Y'] - YS) < 1e-6 or abs(r['Y'] - YN) < 1e-6 or abs(r['Y'] - Y1) < 1e-6 or abs(r['Y'] - Y2) < 1e-6): NBX_CROSS[r['st']] += 1
print('переходи через лотки:', len(CROSS), [c for c in CROSS], 'щити з переходом стрінгів:', NBX_CROSS)
# підводи від щитів до коридору і стрінгові 1×6 — у лотку 100×50 біля щита (≈6 м на щит)
T[1]['100×50'] += 6 * len([r for r in rows if r['z'] == 'lan']); T[2]['100×50'] += 6 * len([r for r in rows if r['z'] == 'roof'])
# спуски і ділянка: ТП-6923 (стіна цеху → дах ТП → місток на берму) під кінцеву кількість ліній; схід — як у Б (600×100 14,7 м + 3,9 м)
nN = len([r for r in rows if r['K'] in ('K-4', 'K-5')]); nE = len([r for r in rows if r['K'] in ('K-3', 'K-1') and (r['z'] in ('roof', 'lan') or r.get('roof'))])
nE1 = len([r for r in rows if r['K'] == 'K-1' and (r['z'] in ('roof', 'lan') or r.get('roof'))])
n1N = len([r for r in rows if r['K'] in ('K-4', 'K-5') and r['st'] == 1])
# спуск ПнЗх (X 11,95): стіна цеху → дах ТП-6923 → місток над приямком → берма → ШВ К-4 (захід) / К-5 (схід) — під кінцеву кількість ліній; в етапі 1 — лише якщо туди йде щось з етапу 1
T[1 if n1N else 2][tray_w(nN)] += 28.0
# спуск Сх (Y 53,9): через парапет і по фасаду до ШВ К-3 (Y 53,3); гілка К-1 — по фасаду на 3,5 м до ШВ К-1 (Y 62,7)
# щити східного фасаду (Y > 34,6, на 3,0 м): лоток на 3,5 м уздовж фасаду до ШВ К-1; від Y 53,9 до К-1 — спільний з гілкою спуску; склад — як у Б
FE = [b for b in FB if not b.get('roof')]; yK1 = SHV['K-1'][1]
FEs = [b for b in FE if b['s'] < DE[1]]; FEn = [b for b in FE if b['s'] >= DE[1]]
L_fe = sum(DE[1] - b['s'] for b in FEs) + sum(abs(b['s'] - yK1) for b in FEn)
T[1][tray_w(nE)] += 17.0; T[1][tray_w(nE1 + len(FEs))] += (yK1 - DE[1]) + 2.0
T[1]['100×50'] += L_fe; T[1]['100×50'] += 48.9; T[1]['200×50'] += 20.0
MNT[1]['fac'] = 17.0 + (yK1 - DE[1]) + 2.0 + L_fe
for k in (1, 2): print('лотки етап', k, {w: round(l, 1) for w, l in sorted(T[k].items())})
json.dump({'var': VAR, 'rows': rows, 'T': {k: dict(v) for k, v in T.items()}, 'E_line': E_line, 'inp': dict(inp), 'kwp': dict(kwp),
           'segs': SEGS, 'mnt': {k: dict(v) for k, v in MNT.items()}, 'cross': CROSS, 'nbx_cross': NBX_CROSS, 'shv': SHV, 'DE': DE, 'DN': DN}, open('final.json' if VAR == os.environ.get('WORK', '2') else f'final_v{VAR}.json', 'w'), ensure_ascii=False, default=float)
for r in sorted(rows, key=lambda r: (r['st'], r['K'], -r['L'])): print(r['st'], r['z'], r.get('id') or '', r.get('f', ''), r['X'] if 'X' in r else r.get('s', ''), r['Y'] if 'Y' in r else '', r['ns'], r['K'], round(r['L'], 1), r['S'], round(r['du'], 2))
