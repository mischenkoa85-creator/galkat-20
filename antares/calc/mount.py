# -*- coding: utf-8 -*-
"""Кріплення фасадних козирків 25° — навантаження, зусилля в консолі й анкерах, оцінка металу (концепція, орієнтовно).
Антарес, 26.10.2026. Остаточний розрахунок — розділ КМ за ДБН В.1.2-2:2006 і ДБН В.2.6-198:2014 після обстеження стіни."""
import json, math
B = math.radians(25); DM, LM, GAP = 1.303, 2.384, 0.02
A_OUT = DM * math.cos(B); DROP = DM * math.sin(B)                 # виліт 1,181 м, перепад 0,551 м
SP = (LM + GAP) / 2                                               # консолі в точках ¼ довжини модуля → ≈1,20 м на консоль
S0, W0 = 1.55, 0.370                                              # кПа — Київ, ДБН В.1.2-2:2006, дод. Е
# вітер: піковий тиск на 15 м (EN 1991-1-4, місцевість III), швидкість з W0
vb = math.sqrt(2 * W0 * 1000 / 1.25); kr = 0.19 * (0.3 / 0.05) ** 0.07; cr = kr * math.log(15 / 0.3); Iv = 1 / math.log(15 / 0.3)
qp = 0.5 * 1.25 * vb ** 2 * cr ** 2 * (1 + 7 * Iv) / 1000           # кПа
CP_DN, CP_UP = 1.0, -1.5                                          # навіс 25°: +1,0; відрив −1,2 загальний, −1,5 з урахуванням крайових зон (оцінка)
G_MOD = 36.5 * 9.81 / 1000 / 2; G_ST = 0.10                       # кН на консоль: пів модуля + консоль, рейки, затиски (оцінка)
A_PLAN = SP * A_OUT; A_SL = SP * DM
G = G_MOD + G_ST; S = S0 * A_PLAN; Wd = qp * CP_DN * A_SL; Wu = qp * abs(CP_UP) * A_SL
V1 = 1.35 * G + 1.5 * S + 1.5 * 0.6 * Wd * math.cos(B)            # сніг провідний (вертикально, наближено)
V2 = 1.0 * G - 1.5 * Wu * math.cos(B)                              # відрив
# консоль: верхній вузол A (0,0) — шарнір, рейка під модулем з ухилом 25°, підкіс від B (0,−d) до рейки на o_c
d, oc = 0.90, 0.93
yc = -0.06 - math.tan(B) * oc; ux, uy = oc, yc + d; L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
xg = A_OUT / 2
def forces(V):
    M = V * xg; arm = oc * uy - yc * ux; F = M / arm                # F > 0 — стиск підкосу
    return dict(V=V, M=M, F=F, A_ten=F * ux, A_shear=V - F * uy, B_comp=F * ux, B_shear=F * uy, strut_len=math.hypot(oc, yc + d))
f1, f2 = forces(V1), forces(V2)
# на 1 м стіни (характеристично) і на панель 6 м
q_char = (G + S) / SP
OUT = dict(qp=round(qp, 3), vb=round(vb, 1), S0=S0, W0=W0, A_OUT=round(A_OUT, 3), DROP=round(DROP, 3), SP=round(SP, 3), G=round(G, 3), S=round(S, 3), Wd=round(Wd, 3), Wu=round(Wu, 3),
           V1=round(V1, 2), V2=round(V2, 2), f1={k: round(v, 2) for k, v in f1.items()}, f2={k: round(v, 2) for k, v in f2.items()}, d=d, oc=oc, q_char=round(q_char, 2), panel6=round(q_char * 6, 1))
# метал (оцінка): варіант А — консолі в панелі; Б — прогони 6 м по колонах + консолі
n_mod = 181; n_cons = 2 * n_mod
cons_kg = 1.35 * 2.0 + f1['strut_len'] * 2.0 + 2 * (0.2 * 0.12 * 0.008 * 7850) + 0.6   # рейка С 41×41 ≈2 кг/м, підкіс, 2 пластини, затиски/метизи
girt_m = 4 * (58.25 + 30.65) + (54.0 + 8.3 + 9.4 + 22.1)                                   # довжина рядів (Пд 4 ряди, Сх верхній)
OUT['steel'] = dict(n_cons=n_cons, cons_kg=round(cons_kg, 1), A_t=round(n_cons * cons_kg / 1000, 2), anchors_A=n_cons * 4,
                    girt_m=round(girt_m), girt_kg_m=26.4, B_t=round((girt_m * 26.4 + n_cons * cons_kg) / 1000 + 1.0, 1))
json.dump(OUT, open('/home/claude/work/sun/mount.json', 'w'), ensure_ascii=False, indent=1)
for k, v in OUT.items(): print(k, v)
