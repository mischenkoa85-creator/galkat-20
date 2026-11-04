# -*- coding: utf-8 -*-
"""Розрахунок кріплення фасадних модулів і козирків 25° (Антарес, 04.11.2026).
Навантаження — ДБН В.1.2-2:2006 зі Зміною № 1: W0 = 370 Па, S0 = 1 550 Па (Київ, дод. Е), γfm за табл. 9.1 / 8.1, Ch — табл. 9.02, місцевість III.
Для вузлів кріплення додатково — піковий тиск EN 1991-1-4 (cpe,1…cpe,10); вузли підбираються під більше з двох.
Розкладка — facpvdata.js двійника (429 модулів: південь 264, схід вертикально 132, козирок 33). Рішення власника 04.11: козирки 25° робимо,
профіль 41×41 з Китаю, трос безпеки лишаємо, стіни цеху — ФБС або залізобетон."""
import json, math, os, bisect
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(HERE, '../../obj/src/facpvdata.js'), encoding='utf-8').read(); F = json.loads(s[s.find('{'):s.rfind('}') + 1])

# ---------- вихідні
W0, S0 = 0.370, 1.550                   # кПа, ДБН дод. Е (Київ)
T = 100                                  # років — середній період повторюваності (запас: споруда CC2, термін 100 років)
GFM_W = {5: .55, 10: .69, 15: .77, 25: .87, 40: .96, 50: 1.0, 70: 1.07, 100: 1.14, 150: 1.22}   # табл. 9.1
GFM_S = {5: .55, 10: .69, 20: .83, 40: .96, 50: 1.0, 60: 1.04, 80: 1.10, 100: 1.14, 150: 1.22} # табл. 8.1
gW, gS = GFM_W[T], GFM_S[T]
CH_Z = [5, 10, 20, 40]; CH_III = [0.90, 1.20, 1.55, 2.00]                                        # табл. 9.02 (Зміна № 1), тип III
def Ch(z): z = max(z, 5); i = min(bisect.bisect_right(CH_Z, z) - 1, len(CH_Z) - 2); return CH_III[i] + (CH_III[i + 1] - CH_III[i]) * (z - CH_Z[i]) / (CH_Z[i + 1] - CH_Z[i])
CAER = dict(A=-1.0, B=-0.8, C=-0.5, D=0.8)          # ДБН дод. І, схема 1 (вертикальні стіни)
# EN 1991-1-4 (перевірка): vb з W0, місцевість III z0 = 0,3; cpe за площею модуля між cpe,1 і cpe,10
vb = math.sqrt(2 * W0 * 1000 / 1.25)
def qp(z, z0=0.3, zmin=5):
    z = max(z, zmin); kr = 0.19 * (z0 / 0.05) ** 0.07; cr = kr * math.log(z / z0); Iv = 1 / math.log(z / z0)
    return 0.5 * 1.25 * vb ** 2 * cr ** 2 * (1 + 7 * Iv) / 1000
AM = 2.384 * 1.303
def cpe(c1, c10, A=AM): return c1 - (c1 - c10) * math.log10(max(1, min(10, A)))
CPE = dict(A=cpe(-1.4, -1.2), B=cpe(-1.1, -0.8), C=-0.5, D=cpe(1.0, 0.8))
GQ = 1.5                                  # EN γQ

# ---------- геометрія стін і зони
LW = dict(S=96.64, E=96.74); H_B = 18.6; E_W = min(96.64, 2 * H_B); ZA, ZB = E_W / 5, E_W
def zone(f, s0, w):
    d = min(s0, LW[f] - (s0 + w)); return 'A' if d < ZA else 'B' if d < ZB else 'C'

# ---------- переріз 41×41×t (C-профіль з відгинами 9 мм) — числово
def strut(t, b=41.0, h=41.0, lip=9.0):
    R = [(0, b, 0, t), (0, t, 0, h), (b - t, b, 0, h), (t, t + lip, h - t, h), (b - t - lip, b - t, h - t, h)]   # прямокутники x0,x1,y0,y1 (y — від стінки до відгинів)
    A = sum((x1 - x0) * (y1 - y0) for x0, x1, y0, y1 in R); yc = sum((x1 - x0) * (y1 - y0) * (y0 + y1) / 2 for x0, x1, y0, y1 in R) / A
    Ix = sum((x1 - x0) * (y1 - y0) ** 3 / 12 + (x1 - x0) * (y1 - y0) * ((y0 + y1) / 2 - yc) ** 2 for x0, x1, y0, y1 in R)
    Iy = sum((y1 - y0) * (x1 - x0) ** 3 / 12 + (x1 - x0) * (y1 - y0) * ((x0 + x1) / 2 - b / 2) ** 2 for x0, x1, y0, y1 in R)
    Wx = Ix / max(yc, h - yc); return dict(t=t, A=A, Ix=Ix, Iy=Iy, Wx=Wx, iy=math.sqrt(min(Ix, Iy) / A), kgm=A * 1e-6 * 7850)
SEC = {t: strut(t) for t in (1.5, 2.0, 2.5)}
RY = 225.0                                 # МПа, Q235 (ДБН В.2.6-198: Ryn 235 / γm 1,025 ≈ 229, з округленням униз)

# ---------- вага
G_MOD = 36.5 * 9.81 / 1000                 # кН
def rail_kg(t, L=1.4): return SEC[t]['kgm'] * L
BR_KG = (0.06 + 0.18 - 0.005) * 0.08 * 0.005 * 7850 * 0.95   # 60×180×5, ширина 80, з пазом (−5 %)

# ---------- вертикальні модулі
V = F['vert']; rows = []
for f, s0, h, w, hh, kwh, lab in V:
    z = h + hh; zn = zone(f, s0, w); ch = Ch(z)
    wD = gW * W0 * ch * CAER[zn]; wDp = gW * W0 * ch * CAER['D']               # ДБН граничні, кПа
    wE = GQ * qp(z) * CPE[zn]; wEp = GQ * qp(z) * CPE['D']                      # EN розрахункові
    rows.append(dict(f=f, s=s0, h=h, z=z, w=w, hh=hh, zn=zn, ch=ch, wD=wD, wDp=wDp, wE=wE, wEp=wEp, lab=lab, kind='L' if w > 2 else 'P'))
def env(r): return max(abs(r['wD']), abs(r['wE']))
# вузол «модуль на 2 рейках, 4 кронштейни L 60×60×5 з 1 анкером M10, 4 крайні притиски»: найгірший модуль
worst = max(rows, key=env)
def vnode(w_suc, t=2.0):
    Fm = abs(w_suc) * AM                    # кН на модуль
    Nc = Fm / 4                             # на притиск і кронштейн
    a, c = 30.0, 60.0                       # мм: анкер від п'яти кутника, носок
    Na_w = Nc * c / a                       # анкер з урахуванням відгину полиці (важіль носка)
    Gn = (G_MOD + 2 * rail_kg(t) * 9.81e-3 + 4 * BR_KG * 9.81e-3) * 1.1 / 4     # кН на кронштейн, γf 1,1
    e_off = 0.18; z_lev = 0.053             # м: центр ваги модуля від стіни (рейка 119 + 41 + ½ рами), плече пари на полиці 80 мм
    Na = Na_w + Gn * e_off / z_lev
    sig_leg = Nc * 1000 * a / (80 * 5 ** 2 / 6)                                # МПа, полиця кутника 80×5
    M_rail = Nc * 0.2015                    # кН·м: притиск на краю модуля (651,5 мм від центру), кронштейни на ±450 мм — консоль 201,5 мм
    sig_rail = M_rail * 1e6 / SEC[t]['Wx']
    sig_out = Gn * 0.18 * 1e6 / (80 * 5 ** 2 / 6)                         # МПа: винос кутника 180 мм, вага поперек полиці (рейки горизонтально, книжкові модулі)
    return dict(sig_out=sig_out, k_out=sig_out / RY, Fm=Fm, Nc=Nc, Na=Na, Va=Gn, sig_leg=sig_leg, sig_rail=sig_rail, k_leg=sig_leg / RY, k_rail=sig_rail / RY)
VN = {k: vnode(v) for k, v in dict(dbn=abs(worst['wD']), en=abs(worst['wE'])).items()}
VNP = {k: vnode(v) for k, v in dict(dbn=max(r['wDp'] for r in rows), en=max(r['wEp'] for r in rows)).items()}   # тиск
ZN_CNT = {z: sum(1 for r in rows if r['zn'] == z) for z in 'ABC'}

# ---------- козирок 25° (схід): консоль 41×41 від верхньої пластини вниз під 25°, підкіс від нижньої пластини (на 0,9 м нижче) до консолі на виносі 0,93 м
A25 = math.radians(25); ZC = 16.2; LC = 1.41; DPL = 0.9; XB = 0.93
ux, uy = math.cos(A25), -math.sin(A25)
sB = XB / math.cos(A25); PB = (XB, -sB * math.sin(A25))                     # точка підкосу на консолі
LBR = math.hypot(PB[0], PB[1] + DPL); ub = (PB[0] / LBR, (PB[1] + DPL) / LBR)
m0, m1 = 0.05, 0.05 + 1.303                                                    # модуль уздовж консолі, м
def canopy(qn, qv, t=2.5):
    """qn — тиск по нормалі до модуля (+ донизу), кН/м² площі модуля; qv — вертикальне (сніг на горизонтальну проекцію + вага), кН/м² проекції.
    На консоль — половина модуля (2,384 / 2 = 1,192 м смуга)."""
    b = 2.384 / 2; Lm = m1 - m0
    # рівномірні навантаження на консоль: вертикальне на 1 м довжини консолі і нормальне
    fv = qv * b * math.cos(A25); fn = qn * b                                   # кН/м вздовж консолі (вертикаль → на 1 м довжини: проекція cos)
    nx, ny = -math.sin(A25), -math.cos(A25)                                    # нормаль до модуля донизу (від неба до стіни)
    Fx = fn * Lm * nx; Fy = -fv * Lm + fn * Lm * ny                            # рівнодійна, кН
    sc = (m0 + m1) / 2; px, py = sc * ux, sc * uy
    Mload = px * Fy - py * Fx                                                  # момент навантаження відносно верхнього шарніра
    Mb = PB[0] * ub[1] - PB[1] * ub[0]                                         # момент одиничного зусилля підкосу (стиск штовхає по ub)
    Nb = -Mload / Mb                                                           # + стиск у підкосі
    Rx, Ry_ = -(Fx + Nb * ub[0]), -(Fy + Nb * ub[1])                           # реакція верхнього шарніра на консоль
    # згинальний момент у консолі (поперечна складова), балка на шарнірі (0) і опорі (sB) з консоллю до LC
    q_t = -fv * math.cos(A25) - fn                                             # поперечна до консолі, кН/м (+ — від стіни догори, по нормалі t)
    def M_at(x):  # чисельно: від навантаження праворуч від x
        n = 200; M = 0
        for i in range(n):
            a_ = x + (LC - x) * (i + .5) / n; d = (LC - x) / n
            if m0 <= a_ <= m1: M += q_t * d * (a_ - x)
        if x < sB: M += Nb * (ub[0] * math.sin(A25) + ub[1] * math.cos(A25)) * (sB - x)   # поперечна складова підкосу
        return M
    Mmax = max(abs(M_at(i * LC / 100)) for i in range(100))
    Nc_ax = abs(Rx * ux + Ry_ * uy)                                            # осьове в консолі біля стіни
    S = SEC[t]; sig = Mmax * 1e6 / S['Wx'] + Nc_ax * 1e3 / S['A']
    lam = LBR * 1000 / S['iy']; lb = lam * math.sqrt(RY / 2.06e5)
    phi = 1 if lb < 0.4 else max(0.2, 1 - (0.073 - 5.53 * RY / 2.06e5) * lb ** 1.5) if lb <= 2.5 else 1.47 - 13.0 * RY / 2.06e5 - (0.371 - 27.3 * RY / 2.06e5) * lb + (0.0275 - 5.53 * RY / 2.06e5) * lb ** 2
    Nb_rd = phi * S['A'] * RY / 1000 * 0.9                                     # кН, γc 0,9 (сплющені кінці)
    # анкери: верхня пластина 2 × M12 (розтяг = −Rx, якщо консоль тягне від стіни; зріз = |Ry|); нижня — +Nb·ub[0] (притискає) / розтяг при відриві
    topT = max(0, -Rx) / 2; topV = abs(Ry_) / 2; botT = max(0, -Nb * ub[0]) / 2; botV = abs(Nb * ub[1]) / 2
    return dict(Fx=Fx, Fy=Fy, Nb=Nb, Rx=Rx, Ry=Ry_, Mmax=Mmax, sig=sig, k=sig / RY, Nb_rd=Nb_rd, kb=abs(min(Nb, 0) if Nb < 0 else Nb) / Nb_rd, topT=topT, topV=topV, botT=botT, botV=botV, lam=lam)
chC = Ch(ZC); qpC = qp(ZC)
Sm = gS * S0 * 1.0                         # μ = 1 при 25° (ДБН дод. Ж, схема 2: α ≤ 25°)
g_can = (G_MOD + (LC + LBR) * 2 * SEC[2.5]['kgm'] * 9.81e-3 + (0.12 * 0.22 + 0.12 * 0.16) * 0.012 * 7850 * 2 * 9.81e-3) / (2.384 * 1.303)   # кН/м² модуля
CASES = {
    'сніг μ = 1 + вага (ДБН)':                   canopy(0, Sm + 1.1 * g_can / math.cos(A25)),
    'сніг μ = 2 + вага (чутливість: мішок / сповзання з даху)': canopy(0, 2 * Sm + 1.1 * g_can / math.cos(A25)),
    'сніг + вітер донизу (ДБН, ψ 0,9)':           canopy(0.9 * gW * W0 * chC * 1.2, 0.9 * Sm + 1.1 * g_can / math.cos(A25)),
    'відрив вітром (ДБН, Caer −1,5)':             canopy(-gW * W0 * chC * 1.5, 0.9 * g_can / math.cos(A25)),
    'відрив вітром (EN, cp,net −1,5)':            canopy(-GQ * qpC * 1.5, 0.9 * g_can / math.cos(A25)),
    'сніг (EN, μ 0,8, γ 1,5) + вітер 0,6':        canopy(0.6 * GQ * qpC * 0.9, 1.5 * 0.8 * 1.25 + 1.35 * g_can / math.cos(A25)),
}
# ---------- трос безпеки
ROPE_MBL = 5.0; rope_k = ROPE_MBL / (G_MOD * 2.0)                            # кН; динаміка ×2

# ---------- кількості на 429
nL = sum(1 for r in rows if r['kind'] == 'L'); nP = len(rows) - nL; nV = len(rows); nC = len(F['can'])
R_ST, R_MT = 1.03, 1.05
Q = [
 ('Рейка 41×41×2,0, L 1 400, перфорація Ø10,5 / паз, гаряче цинкування', 'шт', 2 * nV, 'вертикальні: 2 на модуль, 540 мм від торців (ZNSHINE 477–596)'),
 ('Кронштейн 60×180×5, ширина 80, паз 13×53 (регулювання ±20 мм)', 'шт', 4 * nV, '4 на модуль'),
 ('Анкер M10 (клиновий або хімічний — за типом стіни і випробуваннями) + шайба DIN 125 + гайка', 'шт', 4 * nV, '1 на кронштейн'),
 ('Болт M10×60 DIN 933 8.8 Zn + гайка M10 DIN 934 + 2 шайби DIN 9021 M10', 'компл.', 4 * nV, 'крізь паз кронштейна і обидві стінки рейки'),
 ('Притиск крайній Al 6005-T6, 80 мм, під раму 33 мм', 'шт', 4 * nV + 4 * nC, 'вертикальні 4 + козирок 4 на модуль'),
 ('Болт M8×50 DIN 912 A2 + шайба DIN 125 + пружинна DIN 127', 'компл.', 4 * nV + 4 * nC, 'притиски, до гайки в пазу'),
 ('Гайка M8 з пружиною під паз 41×41', 'шт', 4 * nV + 4 * nC, 'притиски'),
 ('Пластина заземлювальна під притиск', 'шт', nV + nC, '1 на модуль'),
 ('Трос Ø3 7×19 AISI 316 у ПВХ, відрізок ≈0,6 м', 'м', round(0.6 * (nV + nC), 1), '1 петля на модуль'),
 ('Коуш Ø3 нерж.', 'шт', nV + nC, ''),
 ('Втулка обтискна Cu луджена Ø3', 'шт', 2 * (nV + nC), '2 на петлю'),
 ('Гайка-вушко M8 DIN 582 + болт M8×20 DIN 933 Zn', 'компл.', nV + nC, 'вушко на рейці / консолі'),
 ('Консоль 41×41×2,5, L 1 410, сплющений кінець', 'шт', 2 * nC, 'козирок: 2 на модуль'),
 ('Підкіс 41×41×2,5, L 1 100 (між отворами 1 040), сплющені кінці', 'шт', 2 * nC, 'збоку консолі, болт крізь обидві стінки'),
 ('Пластина верхня 120×220×12 зі щоками 6 мм', 'шт', 2 * nC, ''),
 ('Пластина нижня 120×160×12 зі щоками 6 мм', 'шт', 2 * nC, ''),
 ('Анкер M12 (хімічний, шпилька 8.8) + шайба DIN 125 + гайка', 'шт', 8 * nC, '2 на пластину'),
 ('Болт M10×70 DIN 933 8.8 Zn + гайка + 2 шайби (вузли консолі)', 'компл.', 3 * 2 * nC, 'консоль — щоки, підкіс — щоки, підкіс — консоль'),
]
QR = [(n, u, q, round(q * (R_ST if ('Рейка' in n or 'Кронштейн' in n or 'Консоль' in n or 'Підкіс' in n or 'Пластина в' in n or 'Пластина н' in n) else R_MT) + .499), c) for n, u, q, c in Q]

OUT = dict(T=T, gW=gW, gS=gS, W0=W0, S0=S0, vb=vb, e=E_W, ZA=ZA, ZB=ZB, CAER=CAER, CPE=CPE, AM=AM, SEC=SEC, RY=RY, worst=worst, VN=VN, VNP=VNP, ZN_CNT=ZN_CNT,
           nL=nL, nP=nP, nV=nV, nC=nC, chC=chC, qpC=qpC, Sm=Sm, g_can=g_can, LBR=LBR, CASES=CASES, rope_k=rope_k, Q=Q, QR=QR,
           tbl_z=[(z, Ch(z), gW * W0 * Ch(z), GQ * qp(z)) for z in (5, 10, 12.7, 15.1, 16.2, 18.6)])
json.dump(OUT, open(os.path.join(HERE, 'fac_dbn.json'), 'w'), ensure_ascii=False, indent=1, default=float)
if __name__ == '__main__':
    print(f"γfm вітер {gW}, сніг {gS}; e = {E_W:.1f} м, A < {ZA:.1f} м від кута; зони {ZN_CNT}")
    for z, c, wd, we in OUT['tbl_z']: print(f"z {z:5.1f}: Ch {c:.3f} → ДБН Wm(Caer 1) {wd:.3f} кПа; EN 1,5·qp {we:.3f} кПа")
    print('найгірший', {k: (round(v, 3) if isinstance(v, float) else v) for k, v in worst.items()})
    for k, v in VN.items(): print('відрив', k, {a: round(b, 3) for a, b in v.items()})
    for k, v in VNP.items(): print('тиск', k, {a: round(b, 3) for a, b in v.items()})
    for t, S in SEC.items(): print('переріз', t, {a: round(b, 3) for a, b in S.items()})
    print(f"козирок: Ch {chC:.3f}, qp {qpC:.3f}, Sm {Sm:.3f} кПа, g {g_can:.3f} кПа, підкіс {LBR:.3f} м")
    for k, v in CASES.items(): print(' ', k, {a: round(b, 2) for a, b in v.items()})
    print('трос запас', round(rope_k, 1)); print('модулів', nV, nL, nP, nC)
    for r in QR: print(r)
