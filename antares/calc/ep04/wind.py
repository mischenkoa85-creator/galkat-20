# -*- coding: utf-8 -*-
"""Попередня перевірка поля даху (варіант Б на В1, модулі паралельно покрівлі, 0,12 м) на відрив вітром і сповзання.
Вітер — як у calc/mount.py двійника: Київ W0 = 0,370 кПа (ДБН В.1.2-2:2006, дод. Е), піковий тиск за EN 1991-1-4, місцевість III.
Коефіцієнти відриву для такої системи невідомі (потрібні дані виробника / труби) — тому таблиця чутливості по c_net."""
import math, json, collections
D = json.load(open('data.json'))
W0, S0 = 0.370, 1.55
vb = math.sqrt(2 * W0 * 1000 / 1.25)
def qp(z, z0=0.3, zmin=5):
    z = max(z, zmin); kr = 0.19 * (z0 / 0.05) ** 0.07; cr = kr * math.log(z / z0); Iv = 1 / math.log(z / z0)
    return 0.5 * 1.25 * vb ** 2 * cr ** 2 * (1 + 7 * Iv) / 1000
Z = 17.6; QP = qp(Z); QP4 = qp(Z, z0=1.0, zmin=10)
GW, GG = 1.5, 0.9                                            # γ вітру; γ сприятливої постійної
# вага на панель (крок 2,406 × 1,325 м)
A = 2.406 * 1.325; k = 1831 / 1749
mod = 36.5; metal = (5282.7 * 1.45 + 1989.8 * 0.45 + 2202.1 * 0.48 + 579.3 * 1.45 + 935.2 * 1.2 + (3979.5 + 3091.2) * 0.06 + 5884.2 * 0.02 + 7622 * 0.1) / 1749
blk = (4803.6 + 856.5) / 1749 * 13.0
g = (mod + metal + blk) * 9.81 / 1000 / A                     # кПа
R_d = GG * g; cnet_ok = R_d / (GW * QP)
# крайові модулі: немає сусіда хоча б з одного боку (крок X ≈1,32, Y ≈2,41)
R = D['roof']; P = [((m[0] + m[1]) / 2, m[2]) for m in R]
from bisect import bisect_left
grid = collections.defaultdict(list)
for x, y in P: grid[(round(x / 1.32), round(y / 2.41))].append((x, y))
def has(x, y):
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for (a, b) in grid.get((round(x / 1.32) + dx, round(y / 2.41) + dy), []):
                if abs(a - x) < 0.7 and abs(b - y) < 1.3: return True
    return False
edge = sum(1 for x, y in P if not (has(x + 1.32, y) and has(x - 1.32, y) and has(x, y + 2.41) and has(x, y - 2.41)))
Afield = len(P) * A
# чутливість
rows = []
for c in (0.2, 0.3, 0.4, 0.5):
    need = GW * QP * c / GG; dg = max(0, need - g)            # кПа додаткової ваги
    extra_t = dg * Afield / 9.81; blocks = extra_t * 1000 / 13
    defl = max(0, GW * QP * c - R_d) * Afield                  # кН нестачі на все поле (для кріплення)
    anchors = defl / 3.0                                       # 3 кН розрахункова на точку (оцінка)
    rows.append(dict(c=c, need=need, dg=dg, extra_t=extra_t, blocks=blocks, bl_cost=blocks * 3.34 + blocks * 0.0396 * 15.59, anchors=anchors, an_cost=anchors * (44.99 + 0.75 * 15.59)))
# сповзання: смуга між ліхтарем і ендовою, ухил ≈10°, сніг μ = 0,8 (оцінка)
alpha = math.radians(10); seg_w = 6.5; lan_len = sum(f['y1'] - f['y0'] for f in D['frames']); seg_A = seg_w * lan_len * 2
F_slide = (g + 0.8 * S0) * seg_A * math.sin(alpha)            # кН на всі 8 боків ліхтарів, без тертя
per_m = F_slide / (lan_len * 2); per_tie = per_m * 2.06
ties = 194; tie_cost = ties * (12.0 + 0.5 * 15.59); anc_cost = 194 * (44.99 + 0.75 * 15.59)
# тиск блока на утеплювач під снігом
p_blk = ((0.8 * S0 + g) * A / ((4803.6 + 856.5) / 1749)) / 0.09
OUT = dict(qp=QP, qp4=QP4, vb=vb, g=g, R_d=R_d, cnet_ok=cnet_ok, mod=mod, metal=metal, blk=blk, A=A, edge=edge, n=len(P), Afield=Afield, rows=rows,
           F_slide=F_slide, per_m=per_m, per_tie=per_tie, tie_cost=tie_cost, anc_cost=anc_cost, p_blk=p_blk, lan_len=lan_len)
json.dump(OUT, open('wind.json', 'w'), ensure_ascii=False)
print(f"vb {vb:.1f} м/с, qp({Z} м, III) = {QP:.3f} кПа (IV: {QP4:.3f}); вага на панель: модуль {mod} + метал {metal:.1f} + блоки {blk:.1f} кг → g = {g:.3f} кПа ({g*1000/9.81:.0f} кг/м²)")
print(f"опір відриву (γ 0,9) {R_d:.3f} кПа → допустимий c_net ≤ {cnet_ok:.3f}")
print(f"крайових модулів {edge} з {len(P)}; поле {Afield:.0f} м²")
for r in rows: print(r)
print(f"сповзання: {F_slide:.0f} кН на {lan_len*2:.0f} м боків ліхтарів → {per_m:.2f} кН/м, {per_tie:.2f} кН на точку через 2,06 м; зв'язки {tie_cost:,.0f} $ проти анкерів {anc_cost:,.0f} $")
print(f"тиск блока на утеплювач під снігом ≈{p_blk:.1f} кПа")
