# -*- coding: utf-8 -*-
"""Додатковий баласт — лише там, де він потрібен: зони покрівлі (EN 1991-1-4, плоский дах: e = min(b, 2h)), бортики по краю поля,
зв'язки до каркасів ліхтарів; усереднення в зв'язаних блоках (шпильки на кожному стику). c_net за зонами — прийнято для оцінки."""
import json, math, collections
D = json.load(open('data.json')); W = json.load(open('wind.json'))
QP, g, A = W['qp'], W['g'], W['A']
GW, GG = 1.5, 0.9; BLK_KN = 13 * 9.81 / 1000
ONLY_FG = True                                               # 07.11 (власник): блоки під крайніми профілями прибрано, додаткові — лише F/G
X0, X1, Y0, Y1 = -0.15, 96.64, -0.5, 96.59; H = 15.9
e = min(X1 - X0, Y1 - Y0, 2 * H); s10, s4 = e / 10, e / 4
P = [((m[0] + m[1]) / 2, m[2]) for m in D['roof']]
def zone(x, y):
    dx = min(x - X0, X1 - x); dy = min(y - Y0, Y1 - y); d = min(dx, dy)
    if d < s10:
        along = max(dx, dy) if False else (min(y - Y0, Y1 - y) if dx < dy else min(x - X0, X1 - x))   # відстань уздовж краю до кута
        return 'F' if along < s4 else 'G'
    return 'H' if d < e / 2 else 'I'
Z = collections.Counter(zone(x, y) for x, y in P)
SETS = {'без бортиків': {'F': 0.60, 'G': 0.40, 'H': 0.25, 'I': 0.18}, 'з бортиками по краю поля': {'F': 0.45, 'G': 0.30, 'H': 0.22, 'I': 0.18}}
def need_blocks(c):   # додаткових блоків на модуль у зоні з c
    dk = (GW * QP * c / GG - g) * A
    return dk / BLK_KN
res = {}
for nm, C in SETS.items():
    per = {z: need_blocks(C[z]) for z in C}
    add_F = Z['F'] * max(0, math.ceil(per['F'])) ; add_G = Z['G'] * max(0, math.ceil(per['G']))
    # H — у зв’язаних блоках зону H тримає надлишок зони I (смуга між проходами — один блок шпильками)
    defH = Z['H'] * max(0, per['H']); surI = Z['I'] * max(0, -per['I'])
    H_def = max(0, math.ceil(defH - surI))                  # нестача зони H після надлишку зони I (у блоках на все зв'язане поле)
    add_H = 0 if ONLY_FG else H_def                         # 07.11 (власник): додаткові блоки — лише F і G; нестачу H показуємо, не додаємо
    tot = add_F + add_G + add_H
    res[nm] = dict(per={z: round(v, 2) for z, v in per.items()}, F=add_F, G=add_G, H=add_H, H_def=H_def, tot=tot, t=tot * 13 / 1000, cost=tot * (3.34 + 0.0396 * 15.59))
# бортики: периметр поля біля парапетів (смуги F/G), сталевий скіс 0,15 м на кінцях лаг (оцінка 6 $/м з кріпленням)
per_len = 2 * (X1 - X0 - 2 * 1.83) + 2 * (Y1 - Y0 - 2.53 - 2.46)
skirt_cost = per_len * 6.0
OUT = dict(e=e, s10=s10, s4=s4, Z=dict(Z), res=res, per_len=per_len, skirt_cost=skirt_cost)
json.dump(OUT, open('wind2.json', 'w'), ensure_ascii=False)
print(f'e = {e:.1f} м, смуга e/10 = {s10:.1f} м, кут e/4 = {s4:.1f} м; модулів за зонами: {dict(Z)}')
for nm, r in res.items(): print(nm, r)
print(f'бортики: {per_len:.0f} м, ≈{skirt_cost:,.0f} $')
