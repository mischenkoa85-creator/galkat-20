# -*- coding: utf-8 -*-
"""Опція етапу 1 «склад, північні скати C1 / C2» (06.11.2026): повна вартість і окупність.

Вартість = різниця кошторису bom.json (WHN=1) і bom_whn0.json (WHN=0: та сама станція без опції) + модулі, механізація, роботи,
за правилом кошторису станції: Китай FOB × 1,2 (у bom уже), 5 % комісії від FOB, запас 4 % і 18 % від собівартості без робіт, ПДВ 20 %.
Окупність — при ціні електроенергії для цеху 8–9 грн/кВт·год (власник 06.11), без ПДВ.
Прибрати опцію: WHN=0 python3 abk_wh.py → MERGED=1 python3 final.py → python3 bom.py → … (README).
→ whn_price.json"""
import json, math
t = lambda B: sum(x['cost'] for L in B['items'].values() for x in L)
src = lambda B, s: sum(x['cost'] for L in B['items'].values() for x in L if x['src'] == s)
B1, B0 = json.load(open('bom.json', encoding='utf-8')), json.load(open('bom_whn0.json', encoding='utf-8'))
W = json.load(open('wh_abk.json', encoding='utf-8'))['whn']
import sys, os
JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../obj/src/whnprice.js')
if not W:                                                  # WHN=0: опції немає — двійник нічого не показує
    open(JS, 'w', encoding='utf-8').write('const WHNP=null;\n'); print('опцію вимкнено (WHN=0)'); sys.exit(0)
n, kwp, mwh = W['n'], W['kwp'], W['mwh']
FOB, SPARE, MPC, COM, INS, MECH, CONS, WRK = 73, 0.02, 594, 0.05, 0.003, 1.46, 1.22, 50     # параметри кошторису 04.11 (xlsx_build.py)
DF = json.load(open('data.json', encoding='utf-8'))['fac']
N1 = len(DF['vert']) + len(DF['can']) + 316 + 176           # модулі етапу 1 з Китаю без АБК: фасади (06.11: 264 + 33 козирок) + ліхтарі 316 + склад 176
o0, o1 = math.ceil(N1 * (1 + SPARE)), math.ceil((N1 + n) * (1 + SPARE))
cont = math.ceil(o1 / MPC) - math.ceil(o0 / MPC)
d_cn, d_ua = src(B1, 'cn') - src(B0, 'cn'), src(B1, 'ua') - src(B0, 'ua')
mods = (o1 - o0) * FOB; ins = mods * INS; mc = n * (MECH + CONS); works = WRK * kwp
com = d_cn / 1.2 * COM + mods * COM
c = mods + ins + d_cn + d_ua + mc + com + works + cont * 7000
net = c * 1.04 + 0.18 * (c - works); vat = net * 1.2
FX, DEG, OM, RATE, YRS, DELIV = 45.04, 0.004, 0.0177, 0.10, 20, 0.95
eco = {}
for pr in (8.0, 8.5, 9.0):
    e1 = mwh * 1000 * DELIV; cf = [-net] + [e1 * (1 - DEG) ** (k - 1) * pr / FX - OM * net for k in range(1, YRS + 1)]
    cum, pb = -net, None
    for k in range(1, YRS + 1):
        if pb is None and cum + cf[k] >= 0: pb = k - 1 + (-cum) / cf[k]
        cum += cf[k]
    npv = sum(v / (1 + RATE) ** k for k, v in enumerate(cf))
    eco[str(pr)] = dict(e_mwh=round(e1 / 1000, 1), save_uah=round(e1 * pr), save_usd=round(e1 * pr / FX), payback=round(pb, 2), npv20=round(npv))
items = [x for x in B1['items']['1'] if x['grp'].startswith('Склад, північні')]
out = dict(n=n, ns=W['ns'], kwp=kwp, y=W['y'], mwh=mwh, order=[o0, o1], cont_add=cont,
           cost=dict(mods=round(mods, 1), ins=round(ins, 1), bom_cn=round(d_cn, 1), bom_ua=round(d_ua, 1), bom_group=round(sum(x['cost'] for x in items), 1),
                     mech=round(mc, 1), com=round(com, 1), works=round(works, 1), c=round(c, 1), reserve=round(c * 0.04, 1), gen=round(0.18 * (c - works), 1), net=round(net, 1), vat=round(vat, 1)),
           eco=eco)   # 06.11: підсумок станції під ключ — у калькуляторі (424 $/кВтп × кВтп), не тут
json.dump(out, open('whn_price.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(JS, 'w', encoding='utf-8').write('// Опція етапу 1 «склад, північні скати» — ціна і окупність (calc/ep04/whn_price.py)\nconst WHNP=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
if __name__ == '__main__':
    print(f"опція: {n} модулів, {W['ns']} стрінгів, {kwp} кВтп, {W['y']} кВт·год/кВтп, {mwh} МВт·год; модулі в замовленні етапу 1 {o0} → {o1}, контейнерів +{cont}")
    print({k: round(v) for k, v in out['cost'].items()}); print(eco)
