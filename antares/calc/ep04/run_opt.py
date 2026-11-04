from ep_opt import *
def summ(rows, name):
    al = collections.Counter(); cab = npv = e = 0; pk = 0
    for r in rows: al[r['S']] += 2 * r['L']; cab += r['cab']; npv += r['npv']; e += r['e']; pk += r['pk']
    byst = collections.defaultdict(lambda: [0, 0, 0, 0])
    for r in rows: s = byst[r['st']]; s[0] += r['cab']; s[1] += r['e']; s[2] += 2 * r['L']; s[3] += 1
    inp = collections.Counter(r['K'] for r in rows)
    print(f"\n{name}: ліній {len(rows)}; Al 120/185/240/300 = {al[120]:.0f}/{al[185]:.0f}/{al[240]:.0f}/{al[300]:.0f} м; кабель {cab:,.0f} $; втрати {e/1000:.1f} МВт·год/рік ({e*TARIFF:,.0f} $/рік, NPV {npv:,.0f}); P_stc {pk:.1f} кВт; разом {cab+npv:,.0f}")
    for k, s in sorted(byst.items()): print(f"   етап {k}: ліній {s[3]}, Al {s[2]:.0f} м, кабель {s[0]:,.0f} $, втрати {s[1]/1000:.1f} МВт·год")
    print('   входи:', dict(sorted(inp.items())))
    return dict(al=al, cab=cab, npv=npv, e=e, rows=rows)
half = ['N' if b['X'] < 48 else 'E' for b in RB]
r0 = summ(eval_all(half, 'du25'), 'S0 · половини даху (X<48 → ТП-6923), переріз за du ≤ 2,5 % (правило Б)')
r1 = summ(eval_all(half, 'npv'), 'S1 · половини даху, переріз за NPV')
capE = 24 - (len(FB) + len(WB)); capN = 24 - len(LB)
a2 = assign_opt(capE, capN); r2 = summ(eval_all(a2, 'npv'), f'S2 · оптимальне призначення (сх ≤ {capE}, пн-зх ≤ {capN}), переріз за NPV')
a3 = assign_opt(capE - 1, capN + 1); r3 = summ(eval_all(a3, 'npv', lan_to={'ЩЛ-4': 'E'}), 'S3 · як S2, ліхтар Л4 — до ТП-5913')
allE = ['E'] * len(RB); 
# довідково: усе на схід (як у Б) — перевищує входи, лише для порівняння довжин
r4 = summ(eval_all(allE, 'du25', lan_to={b['id']: 'E' for b in LB}), 'Довідково · усе до сходу (як Б 26.10), du ≤ 2,5 %')
# баланс DC/AC за парами
for nm, rr in (('S2', r2), ('S3', r3)):
    kw = collections.Counter()
    for r in rr['rows']: kw['ТП-5913' if r['K'] in ('K-1', 'K-3') else 'ТП-6923'] += r['ns'] * 8.0311
    print(nm, {k: round(v) for k, v in kw.items()}, 'кВтп')
json.dump({'S2': [dict((k, v) for k, v in r.items() if k != 'kwh') for r in r2['rows']], 'S3': [dict((k, v) for k, v in r.items() if k != 'kwh') for r in r3['rows']], 'a3': a3}, open('opt.json', 'w'), ensure_ascii=False, default=float)
