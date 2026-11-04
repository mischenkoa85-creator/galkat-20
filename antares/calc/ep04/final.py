# Рекомендований варіант: S3 (Л4 → ТП-5913), переріз за NPV з обмеженням du ≤ 2,5 %, баланс входів у парі ≤ 12; лотки за маршрутами; втрати
from ep_opt import *
lan_to = {'ЩЛ-4': 'E'}
capE = 24 - (len(FB) + len(WB) + 1); capN = 24 - (len(LB) - 1)
a = assign_opt(capE, capN)
rows = eval_all(a, 'npv', lan_to=lan_to)
# du ≤ 2,5 %: якщо більше — наступний переріз
for r in rows:
    if r['du'] > 2.5:
        for S in (185, 240, 300):
            pk = loss_kw(S, r['L'], r['ns']); du = pk * 1000 / (r['ns'] * IMP) / VOP * 100
            if du <= 2.5: r.update(S=S, pk=pk, du=du, e=pk * TAU_F.get(r['z'], TAU), cab=line_cost(S, r['L'])); r['npv'] = r['e'] * TARIFF * PVF; break
# баланс входів у парі
for pair in (('K-3', 'K-1'), ('K-4', 'K-5')):
    rr = sorted([r for r in rows if r['K'] in pair], key=lambda r: -r['L'])
    cnt = {pair[0]: 0, pair[1]: 0}
    fixed = [r for r in rr if r['z'] in ('fac', 'wh')]
    for r in fixed: cnt[r['K']] += 1
    for r in rr:
        if r['z'] in ('fac', 'wh'): continue
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
def tray_w(n):   # ліній (по 2 жили Al 120 ≈ Ø19)
    for w, cap in (('100×50', 3), ('200×50', 6), ('300×100', 18), ('400×100', 24), ('600×100', 36)):
        if n <= cap: return w
    return '600×100'
T = collections.defaultdict(lambda: collections.Counter())
for (u, v), (n1, n2, _) in seg.items():
    l = abs(u[0] - v[0]) + abs(u[1] - v[1])
    if n1: T[1][tray_w(n1 + n2)] += l          # етап 1: одразу під кінцеву кількість ліній
    elif n2: T[2][tray_w(n2)] += l
# підводи від щитів до коридору і стрінгові 1×6 — у лотку 100×50 біля щита (≈6 м на щит)
T[1]['100×50'] += 6 * len([r for r in rows if r['z'] == 'lan']); T[2]['100×50'] += 6 * len([r for r in rows if r['z'] == 'roof'])
# спуски і ділянка: ТП-6923 (стіна цеху → дах ТП → місток на берму) під кінцеву кількість ліній; схід — як у Б (600×100 14,7 м + 3,9 м)
nN = len([r for r in rows if r['K'] in ('K-4', 'K-5')]); nE = len([r for r in rows if r['K'] in ('K-3', 'K-1') and r['z'] in ('roof', 'lan')])
T[1][tray_w(nN)] += 26.0; T[1][tray_w(nE)] += 18.6
# фасади: південний (≈ від крайнього щита до кута) + східний до K-3 / K-1; склад — як у Б
T[1]['200×50'] += 96.64 - min(b['s'] for b in FB if b['f'] == 'S') ; T[1]['300×100'] += 52.0; T[1]['100×50'] += 48.9; T[1]['200×50'] += 20.0
for k in (1, 2): print('лотки етап', k, {w: round(l, 1) for w, l in sorted(T[k].items())})
json.dump({'rows': rows, 'T': {k: dict(v) for k, v in T.items()}, 'E_line': E_line, 'inp': dict(inp), 'kwp': dict(kwp)}, open('final.json', 'w'), ensure_ascii=False, default=float)
for r in sorted(rows, key=lambda r: (r['st'], r['K'], -r['L'])): print(r['st'], r['z'], r.get('id') or '', r.get('f', ''), r['X'] if 'X' in r else r.get('s', ''), r['Y'] if 'Y' in r else '', r['ns'], r['K'], round(r['L'], 1), r['S'], round(r['du'], 2))
