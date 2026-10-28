# Геометрія і розкладка К1 — дослівно за calc/v3/abk.py (без енергетичної частини)
import json, math, numpy as np
LM, DM, GAP = 2.384, 1.303, 0.022
AL = dict(x0=108.3, x1=127.5, y0=6.6, y1=20.3, h=10.0); AB = dict(x0=108.5, x1=128.0, y0=20.3, y1=45.2, h=13.2, f=1.3)
XC, HW = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
zA = lambda x: AB['h'] + AB['f'] * np.clip(1 - ((np.asarray(x) - XC) / HW) ** 2, 0, 1)
STAIR = (116.3, 121.5, 8.0, 17.8); ZST = 12.6
# Вентшахти на арці (x, y, радіус, висота, тип, джерело). Тип: v — кругла тумба в бітумі, o — низька з рудою кришкою, h — оцинкований ковпак на тумбі.
# 28.10: додано 3 за фото 27.10 (110750–110806, 110837, 110909–110912) і супутником Google (темні плями): Пд-Зх кут, руда біля Пд-Сх кута, поруч з ковпаком на півночі.
VENTS = [(111.0, 22.0, 0.6, 0.74, 'v', 'new'), (119.6, 21.9, 0.6, 0.74, 'v', ''), (122.2, 21.9, 0.6, 0.74, 'v', ''), (126.1, 21.4, 0.45, 0.45, 'o', 'new'),
         (116.6, 27.8, 0.6, 0.74, 'v', ''), (111.4, 40.4, 0.6, 0.74, 'v', ''), (120.8, 40.4, 0.6, 0.75, 'h', ''), (119.6, 39.7, 0.6, 0.74, 'v', 'new')]
VR, VH = 0.6, 0.74
# Сталева драбина з дугами (фото 27.10 110806, 110837, 111154; 26.10 123523): стоїть на даху південного блоку біля Пн-Сх кута надбудови,
# спирається на південний парапет основного блоку; оцінка ±0,5 м. Біля неї модулів не ставимо: смуга X ±1,0 м від верху на стіні і коридор на нижньому даху.
LADDER = dict(x0=123.2, y0=16.5, z0=10.0, x1=122.6, y1=20.3, z1=14.75, ext=0.9, w=0.5, clr=1.0)
BOXES = [(116.8, 42.3, 0.6, 0.7, 1.5), (118.0, 43.0, 0.9, 0.6, 0.45)]
PAR_LO, PAR_W, PAR_E, PAR_G = 0.5, 0.5, 0.7, 0.5
MRG, MV, MST = 0.5, 0.3, 1.0
TG = math.radians(15); C15, S15 = math.cos(TG), math.sin(TG); DEP = DM * C15; RISE = DM * S15; HLOW = 0.15
def hits_obst(x0, x1, y0, y1):
    for vx, vy, vr, *_ in VENTS:
        dx = max(x0 - vx, 0, vx - x1); dy = max(y0 - vy, 0, vy - y1)
        if dx * dx + dy * dy < (vr + MV) ** 2: return True
    return any(x0 < bx + dx / 2 + MV and bx - dx / 2 - MV < x1 and y0 < by + dy / 2 + MV and by - dy / 2 - MV < y1 for bx, by, dx, dy, h in BOXES)
def segs(lo, hi, w, pitch):
    n = int((hi - lo + (pitch - w)) // pitch); s = lo + (hi - lo - (n * pitch - (pitch - w))) / 2; return [s + i * pitch for i in range(n)]
arch = []
xs = np.linspace(AB['x0'] + 0.25 + MRG, AB['x1'] - 0.25 - MRG, 4001); sl = np.concatenate([[0], np.cumsum(np.hypot(np.diff(xs), np.diff(zA(xs))))])
S_ = sl[-1]; ncol = int((S_ + GAP) // (DM + GAP)); s0 = (S_ - (ncol * (DM + GAP) - GAP)) / 2
ys = segs(AB['y0'] + 0.25 + MRG, AB['y1'] - 0.25 - MRG, LM, LM + GAP)
for j in range(ncol):
    a, b = s0 + j * (DM + GAP), s0 + j * (DM + GAP) + DM; xa, xb = float(np.interp(a, sl, xs)), float(np.interp(b, sl, xs)); za, zb = float(zA(xa)), float(zA(xb))
    k = (zb - za) / (xb - xa)
    for y in ys:
        if hits_obst(xa, xb, y, y + LM): continue
        arch.append(dict(xa=round(xa, 3), xb=round(xb, 3), za=round(za, 3), zb=round(zb, 3), y0=round(y, 3), y1=round(y + LM, 3), face='E' if k < 0 else 'W', tilt=round(math.degrees(math.atan(abs(k))), 1), col=j))
low = []
x0, x1, y0, y1 = AL['x0'] + 0.25 + MRG, AL['x1'] - 0.25 - MRG, AL['y0'] + 0.25 + MRG, AL['y1'] - MRG
ysl = segs(y0, y1, LM, LM + GAP); PP = 2 * DEP + 0.4
for a, b in ((x0, STAIR[0] - MST), (STAIR[1] + MST, x1)):
    npr = int((b - a + 0.4) // PP); rem = (b - a) - (npr * PP - 0.4); one = rem >= 0.4 + DEP
    st = a + (rem - (0.4 + DEP if one else 0)) / 2
    sl2 = [(st + i * PP, 'W') for i in range(npr)] + [(st + i * PP + DEP, 'E') for i in range(npr)]
    if one: sl2.append((st + npr * PP, 'E'))
    for xa, fc in sl2:
        xb = xa + DEP; lo = xa if fc == 'W' else xb
        for y in ysl:
            low.append(dict(xa=round(xa, 3), xb=round(xb, 3), lo=round(lo, 3), y0=round(y, 3), y1=round(y + LM, 3), face=fc))
# 2 місця поза стрінгами (за звітом К1, рисунок «Розкладки»): західний схил правої пари, два північні ряди.
# 28.10: саме там стоїть драбина — ці 2 місця прибрано зовсім (коридор драбини X ±0,25+0,6 м від осі, Y від основи −1,0 м до стіни).
for m in low:
    m['used'] = not (m['face'] == 'W' and m['xa'] > 120 and m['y0'] > 14)
L_ = LADDER; lx0, lx1 = min(L_['x0'], L_['x1']) - L_['w'] / 2 - 0.6, max(L_['x0'], L_['x1']) + L_['w'] / 2 - 0.0
lad_hit = lambda m: m['xa'] < lx1 and m['xb'] > lx0 and m['y1'] > L_['y0'] - 1.0
removed_low = [m for m in low if lad_hit(m)]
assert all(not m['used'] for m in removed_low), 'драбина зачепила б модуль у стрінгу'
low = [m for m in low if not lad_hit(m)]
print('arch', len(arch), 'ncol', ncol, 'rows', len(ys), 'faces', {f: sum(1 for m in arch if m['face'] == f) for f in 'EW'}, 'tilt max', max(m['tilt'] for m in arch))
print('low', len(low), 'used', sum(m['used'] for m in low), 'removed for ladder', len(removed_low), sorted({(m['xa'], m['face']) for m in low}))
# ================= варіант «ДБН» (28.10): ходові доріжки на арці, стаціонарна драбина П1, огородження ≥ 0,6 м
# ДБН В.2.6-220:2017 п. 7.1.3 — ходові доріжки до обладнання, що потребує обслуговування (ширини в прочитаному тексті немає;
# беремо 0,8 м — наше рішення). Дві доріжки схід–захід (після 3-го і 6-го ряду): кожен модуль — не далі 2 рядів від доріжки;
# зв'язка північ–південь від драбини — колонка 10 (X 121,6–122,9) у рядах 1–6.
WW = 0.8
def rows_with_walks(walk_after):
    lo, hi = AB['y0'] + 0.25 + MRG, AB['y1'] - 0.25 - MRG; n = 9
    tot = n * LM + (n - 1) * GAP + len(walk_after) * (WW - GAP); y = lo + (hi - lo - tot) / 2; out = []
    for i in range(n):
        out.append(y); y += LM + (WW if i in walk_after else GAP)
    return out
archD, walksD = [], []
ysD = rows_with_walks({2, 5}); COR = 9
for j in range(ncol):
    a_, b_ = s0 + j * (DM + GAP), s0 + j * (DM + GAP) + DM; xa, xb = float(np.interp(a_, sl, xs)), float(np.interp(b_, sl, xs)); za, zb = float(zA(xa)), float(zA(xb))
    k = (zb - za) / (xb - xa)
    for i, y in enumerate(ysD):
        if j == COR and i <= 5: continue
        if hits_obst(xa, xb, y, y + LM): continue
        archD.append(dict(xa=round(xa, 3), xb=round(xb, 3), za=round(za, 3), zb=round(zb, 3), y0=round(y, 3), y1=round(y + LM, 3), face='E' if k < 0 else 'W', tilt=round(math.degrees(math.atan(abs(k))), 1), col=j, row=i))
cx_a = float(np.interp(s0 + COR * (DM + GAP), sl, xs)); cx_b = float(np.interp(s0 + COR * (DM + GAP) + DM, sl, xs))
for i in (2, 5):
    walksD.append(dict(kind='arch', x0=AB['x0'] + 0.25 + MRG, x1=AB['x1'] - 0.25 - MRG, y0=round(ysD[i] + LM, 3), y1=round(ysD[i + 1], 3)))
walksD.append(dict(kind='archN', x0=round(cx_a, 3), x1=round(cx_b, 3), y0=AB['y0'] + 0.25, y1=round(ysD[6], 3)))
# нижній дах: прохід від надбудови до драбини — смуга між східною стіною надбудови і першим «доміком» сходу, до стіни основного блоку
xr = min(m['xa'] for m in low if m['xa'] > STAIR[1])
walksD.append(dict(kind='low', x0=STAIR[1], x1=round(xr, 3), y0=AL['y0'] + 0.25 + MRG, y1=AB['y0']))
walksD.append(dict(kind='low', x0=STAIR[0], x1=STAIR[1], y0=STAIR[3], y1=AB['y0']))
# П1 — по осі зв'язки (колонка 10), щоб площадка і вихід не затуляли модулі; від стіни надбудови (X 121,5) ≥ 0,4 м
XP1 = round((cx_a + cx_b) / 2, 3)
LADP1 = dict(x=XP1, w=0.6, off=0.2, ztop=round(float(zA(XP1)) + PAR_G, 3), cx0=round(cx_a, 3), cx1=round(cx_b, 3))
# п. 5.1.3: обладнання на покритті — не більше 30 % поверхні (якщо модулі вважати обладнанням)
eq_arch = sum(math.pi * v[2] ** 2 for v in VENTS) + sum(b[2] * b[3] for b in BOXES) + 0.8 * 0.8
A_arch = (AB['x1'] - AB['x0']) * (AB['y1'] - AB['y0']); A_low = (AL['x1'] - AL['x0']) * (AL['y1'] - AL['y0']) - (STAIR[1] - STAIR[0]) * (STAIR[3] - STAIR[2])
N30 = dict(arch=int((0.3 * A_arch - eq_arch) // (DM * LM)), low=int((0.3 * A_low) // (DEP * LM)), A_arch=round(A_arch, 1), A_low=round(A_low, 1), eq_arch=round(eq_arch, 1),
           mod_arch=round(DM * LM, 3), mod_low=round(DEP * LM, 3))
# ---------- надбудова сходів: «домік» схід–захід 15° (запит 28.10, 14:30 і 14:55); модуль 2384 уздовж Пн–Пд, пара спина до спини по центру
SPLIT, WT, PARH, HN, HS = 13.95, 0.38, 0.3, 3.3, 2.25          # як у 3D-моделі: межа частин, парапет 0,38 × 0,3, висоти над нижнім дахом
ZRN, ZRS = AL['h'] + HN - PARH, AL['h'] + HS - PARH             # покрівля: пн. частина +13,0, пд. +11,95
XM = (STAIR[0] + STAIR[1]) / 2
yN = STAIR[3] - WT - (STAIR[3] - WT - SPLIT - WT - LM) / 2 - LM                      # пн.: 1 ряд по центру між парапетами
yS0 = STAIR[2] + WT + (SPLIT - STAIR[2] - WT - (2 * LM + GAP)) / 2; ySN = [yS0, yS0 + LM + GAP]   # пд.: 2 ряди
def dom(slopes, y, zr, part):
    return [dict(xa=round(xa, 3), xb=round(xa + DEP, 3), y0=round(y, 3), y1=round(y + LM, 3), face=fc, lo=round(xa if fc == 'W' else xa + DEP, 3), zr=round(zr, 3), part=part, tilt=15.0) for xa, fc in slopes]
PAIR = [(XM - DEP, 'W'), (XM, 'E')]
NAD6 = dom(PAIR, yN, ZRN, 'N') + dom(PAIR, ySN[0], ZRS, 'S') + dom(PAIR, ySN[1], ZRS, 'S')
NAD5 = dom(PAIR, yN, ZRN, 'N') + dom(PAIR, ySN[0], ZRS, 'S') + dom([(XM - DEP / 2, 'W')], ySN[1], ZRS, 'S')    # у межах 30 % кожної частини
N30.update(A_nadN=round((STAIR[1] - STAIR[0]) * (STAIR[3] - SPLIT), 2), A_nadS=round((STAIR[1] - STAIR[0]) * (SPLIT - STAIR[2]), 2))
# варіант ДБН: П1 з нижнього даху на пд. частину — на західній стіні біля межі частин (там смуга 1,0 м без модулів, прохід на сході не звужуємо);
# з пд. частини на пн. (перепад 1,05 м) — коротка П1 на південній стіні пн. частини в західній смузі 0,96 м між парапетом і доміком
LADN = [dict(axis='x', x=round(STAIR[0] - 0.2, 3), y=round(SPLIT - 0.9, 3), z0=AL['h'], ztop=round(ZRS + PARH, 3), side=-1, roof=round(ZRS, 3)),
        dict(axis='y', x=round((STAIR[0] + WT + XM - DEP) / 2, 3), y=round(SPLIT - 0.2, 3), z0=round(ZRS, 3), ztop=round(ZRN + PARH, 3), side=1, roof=round(ZRN, 3))]
NAD = dict(split=SPLIT, wt=WT, parh=PARH, zrn=round(ZRN, 3), zrs=round(ZRS, 3), d6=NAD6, d5=NAD5, lad=LADN)
print('ДБН: arch', len(archD), 'walks', walksD, 'N30', N30)
print('надбудова: d6', [(m['part'], m['face'], m['xa'], m['y0']) for m in NAD6], 'd5', len(NAD5), 'драбини', LADN)
geo = dict(AL=AL, AB=AB, stair=STAIR, zst=ZST, vents=VENTS, vr=VR, vh=VH, boxes=BOXES, ladder=LADDER, par=dict(lo=PAR_LO, w=PAR_W, e=PAR_E, g=PAR_G), hlow=HLOW, dep=round(DEP, 4), rise=round(RISE, 4), lm=LM, dm=DM)
json.dump(dict(geo=geo, arch=arch, low=low, archD=archD, walks=walksD, ladP1=LADP1, n30=N30, nad=NAD), open('abk_k1.json', 'w'), ensure_ascii=False)
