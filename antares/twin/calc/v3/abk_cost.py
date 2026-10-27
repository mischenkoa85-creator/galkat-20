# -*- coding: utf-8 -*-
"""Кошторис варіантів даху АБК за ставками кошторису під ключ 27.10 (дах цеху + ліхтарі + склад, 2 112 модулів).
Ставки — з аркушів «Кошторис» і «Параметри» файлу кошторису 27.10; для трикутників — розрахунок кріплення ГалКат 15° (22.10, 1 260 модулів).
→ v3/abk_cost.json"""
import json, math, openpyxl
V = '/home/claude/work/sun/v3/'
K27 = '/home/claude/work/kosh27/Кошторис_будівництва_під_ключ_СЕС_і_УЗЕ_Антарес_дах_і_ліхтарі_27.10.2026.xlsx'
wb = openpyxl.load_workbook(K27, data_only=True); K = wb['Кошторис']
row = {K.cell(r, 1).value: r for r in range(5, 75) if K.cell(r, 1).value}
g = lambda no, c=7: K.cell(row[no], c).value
J = json.load(open(V + 'abk.json'))['var']
NMOD, NSTR, NBOX, KWP = 2112, 192, 31, 1541.76
R = dict(
    mod=g('1.2', 5),                                   # $ FOB за модуль
    spare=1.02,
    flush=21500 / 1925,                                # кріплення «по даху» (лаги, гільзи, шпильки, кутники, притиски, метизи) — КП 26.10 на 1 925 модулів
    tri=11211 / 1260 + 4 * 0.50,                       # трикутники ГалКат 15°: метал, П-кронштейни, метизи (22.10, FOB) + 4 притиски по 0,50 $
    dc=g('1.4') / NSTR, tray=g('1.7') / NSTR, bz=g('1.8') / NMOD,
    box=437.0,                                         # щит PV 7/1 (Параметри, BOXP)
    line_m=26328 / (942 + 3214 + 3532),                # $ за 1 м лінії Al з наконечниками — середнє КП 26.10
    duty=dict(mount=0.008, dc=0.067, box=0.052, line=0.069, tray=0.001, bz=0.05), duty_k=None,
    comm=0.05, c_mod=g('3.2', 5) / 594, c_oth=g('3.3') / NMOD, ins=0.003,
    blk=3.0 * 1.01, blk_del=g('4.9') / g('4.5', 4), blk_flush=(g('4.1', 4) + g('4.2', 4)) / 1639, blk_tri=4,
    work=g('5.1', 5), mech=g('5.2') / NMOD, res=0.04, fee=0.18, vat=0.2,
    val=7.00 / 1.2 / 44.89 * 0.975)
# коефіцієнт мита (база — митна вартість з доставкою): як у кошторисі 27.10
base_duty = sum(g(no) * r for no, r in (('1.3.1', 0.008), ('1.3.2', 0.008), ('1.4', 0.067), ('1.5', 0.052), ('1.6', 0.069), ('1.7', 0.001), ('1.8', 0.05), ('1.9', 0.05)))
R['duty_k'] = g('3.6') / base_duty
LINE_M = 2 * 32.0          # м на щит: + і −, щит на даху АБК біля північно-західного кута → по стіні вниз → контейнер K-3 (≈29 м + 10 %), оцінка за планом
def cost(n, st, how):
    nb = math.ceil(st / 7) if st else 0
    ch = dict(mod=math.ceil(n * R['spare']) * R['mod'], mount=n * (R['flush'] if how in ('flush', 'flat') else R['tri']), dc=st * R['dc'], box=nb * R['box'],
              line=nb * LINE_M * R['line_m'], tray=st * R['tray'], bz=n * R['bz'])
    china = sum(ch.values()); comm = china * R['comm']
    deliv = math.ceil(n * R['spare']) * R['c_mod'] + n * R['c_oth'] + (china - ch['mod']) * R['ins']
    duty = sum(ch[k] * R['duty'][k] for k in R['duty']) * R['duty_k']
    blocks = math.ceil(n * (R['blk_flush'] if how in ('flush', 'flat') else R['blk_tri']) * 1.01)
    ua = blocks * 3.0 + blocks * R['blk_del']
    works = n * 0.73 * R['work'] + n * R['mech']
    c = china + comm + deliv + duty + ua + works; tot = c * (1 + R['res'] + R['fee'])
    vat = tot * R['vat']; vat245 = (tot - ch['mod']) * R['vat']
    return dict(n=n, st=st, boxes=nb, blocks=blocks, china=round(china), comm=round(comm), deliv=round(deliv + duty), ua=round(ua), works=round(works), cost=round(c),
                tot=round(tot), vat=round(tot + vat), vat245=round(tot + vat245), per_mod=round(tot / n, 1) if n else 0, per_kwp=round(tot / (n * 0.73)) if n else 0, ch={k: round(v) for k, v in ch.items()})
OUT = dict(R={k: (round(v, 4) if isinstance(v, float) else v) for k, v in R.items()}, line_m=LINE_M, var={})
for k, v in J.items():
    how = 'flush' if k == 'A_flush' else 'flat' if k == 'L_flat' else 'tri'
    c = cost(v['n'], v['st'], how); c['mwh'] = v['mwh']; c['kwp'] = v['kwp']; c['y'] = v['y']
    c['rev'] = round(v['mwh'] * 1000 * R['val']); c['pb'] = round(c['tot'] / c['rev'], 1) if c['rev'] else None
    c['usd_mwh'] = round(c['tot'] / v['mwh']) if v['mwh'] else None
    OUT['var'][k] = c
COMB = [('K1', 'Арка по даху + нижній дах «домік» схід–захід', ['A_flush', 'L_ew']), ('K2', 'Лише арка по даху', ['A_flush']),
        ('K3', 'Арка трикутники + нижній дах трикутники (на південь)', ['A_south', 'L_south']), ('K4', 'Арка трикутники + нижній дах «домік»', ['A_south', 'L_ew'])]
OUT['comb'] = {}
for key, name, parts in COMB:
    n = sum(J[p]['n'] for p in parts); st = sum(J[p]['st'] for p in parts); mwh = sum(J[p]['mwh'] for p in parts)
    # щити рахуємо на весь дах АБК разом (стрінги обох дахів — в одні щити)
    cs = [OUT['var'][p] for p in parts]; nb_all = math.ceil(st / 7); nb_sep = sum(c['boxes'] for c in cs)
    tot = sum(c['tot'] for c in cs) - (nb_sep - nb_all) * (R['box'] + LINE_M * R['line_m']) * (1 + R['comm']) * (1 + R['res'] + R['fee'])
    mods_fob = sum(c['ch']['mod'] for c in cs); vat = tot * 1.2; vat245 = tot + (tot - mods_fob) * 0.2
    rev = mwh * 1000 * R['val']
    OUT['comb'][key] = dict(name=name, parts=parts, n=n, st=st, boxes=nb_all, kwp=round(n * 0.73, 2), mwh=round(mwh, 2), y=round(mwh * 1000 / (n * 0.73)),
                            tot=round(tot), vat=round(vat), vat245=round(vat245), per_kwp=round(tot / (n * 0.73)), rev=round(rev), pb=round(tot / rev, 1), usd_mwh=round(tot / mwh))
json.dump(OUT, open(V + 'abk_cost.json', 'w'), ensure_ascii=False, indent=1)
for k, c in OUT['var'].items(): print(k, c['n'], c['st'], c['boxes'], c['tot'], c['per_mod'], c['per_kwp'], c['mwh'], c['rev'], c['pb'], c['usd_mwh'])
for k, c in OUT['comb'].items(): print(k, c['name'], c['n'], c['st'], c['boxes'], c['kwp'], c['mwh'], c['tot'], c['vat'], c['vat245'], c['per_kwp'], c['pb'], c['usd_mwh'])
print({k: OUT['R'][k] for k in ('mod', 'flush', 'tri', 'dc', 'tray', 'bz', 'line_m', 'c_mod', 'c_oth', 'blk_del', 'blk_flush', 'work', 'mech', 'duty_k', 'val')})
