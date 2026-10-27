# Геометрія і розкладка К1 — дослівно за calc/v3/abk.py (без енергетичної частини)
import json, math, numpy as np
LM, DM, GAP = 2.384, 1.303, 0.022
AL = dict(x0=108.3, x1=127.5, y0=6.6, y1=20.3, h=10.0); AB = dict(x0=108.5, x1=128.0, y0=20.3, y1=45.2, h=13.2, f=1.3)
XC, HW = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
zA = lambda x: AB['h'] + AB['f'] * np.clip(1 - ((np.asarray(x) - XC) / HW) ** 2, 0, 1)
STAIR = (116.3, 121.5, 8.0, 17.8); ZST = 12.6
VENTS = [(111.4, 40.4), (120.8, 40.4), (116.6, 27.8), (119.6, 21.9), (122.2, 21.9)]; VR, VH = 0.6, 0.74
BOXES = [(116.8, 42.3, 0.6, 0.7, 1.5), (118.0, 43.0, 0.9, 0.6, 0.45)]
PAR_LO, PAR_W, PAR_E, PAR_G = 0.5, 0.5, 0.7, 0.5
MRG, MV, MST = 0.5, 0.3, 1.0
TG = math.radians(15); C15, S15 = math.cos(TG), math.sin(TG); DEP = DM * C15; RISE = DM * S15; HLOW = 0.15
def hits_obst(x0, x1, y0, y1):
    for vx, vy in VENTS:
        dx = max(x0 - vx, 0, vx - x1); dy = max(y0 - vy, 0, vy - y1)
        if dx * dx + dy * dy < (VR + MV) ** 2: return True
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
# 2 місця поза стрінгами (за звітом К1, рисунок «Розкладки»): західний схил правої пари, два північні ряди
for m in low:
    m['used'] = not (m['face'] == 'W' and m['xa'] > 120 and m['y0'] > 14)
print('arch', len(arch), 'ncol', ncol, 'rows', len(ys), 'faces', {f: sum(1 for m in arch if m['face'] == f) for f in 'EW'}, 'tilt max', max(m['tilt'] for m in arch))
print('low', len(low), 'used', sum(m['used'] for m in low), sorted({(m['xa'], m['face']) for m in low}))
geo = dict(AL=AL, AB=AB, stair=STAIR, zst=ZST, vents=VENTS, vr=VR, vh=VH, boxes=BOXES, par=dict(lo=PAR_LO, w=PAR_W, e=PAR_E, g=PAR_G), hlow=HLOW, dep=round(DEP, 4), rise=round(RISE, 4), lm=LM, dm=DM)
json.dump(dict(geo=geo, arch=arch, low=low), open('abk_k1.json', 'w'), ensure_ascii=False)
