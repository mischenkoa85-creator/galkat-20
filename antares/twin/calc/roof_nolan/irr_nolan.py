# -*- coding: utf-8 -*-
"""Дах цеху Антарес без ліхтарів (28.10.2026): лишаються тільки сталеві каркаси — центральний профіль уздовж ліхтаря
і поперечні кутники з ухилом 13° на обидва боки (ширина каркаса 3,0 м — власник; кут 13° — власник, фото 12,2° ± 0,5°).
Панелей немає. Сонячне опромінення кВт·год/м² за рік на клітинках 0,5 × 0,5 м:
 - покрівля — у площині грані покрівлі;
 - смуга каркаса (|X − Xц| ≤ 1,5 м) — у площині схилу каркаса 13° (схід / захід), тобто там, де лягатимуть модулі.
Тінь — від усього, що є в моделі v3, крім ліхтарів: парапети, західна будівля (+6,8 м), рама кондиціонерів, дефлектори
(49, що видно на знімку Google; 13 з РП, яких там не видно, вважаємо прибраними — власник 28.10), сходи, стійки порталу, АБК, ТП, контейнери УЗЕ. Тонкі кутники й профіль тіні не дають (менші за крок DSM 0,25 м).
Модель та сама: Meteonorm 8.1, крок 10 хв, горизонт 72 напрями, небо з урахуванням закритої частини, Hay, альбедо 0,2.
→ irr_nolan.json"""
import json, math, sys, os, numpy as np
W = os.path.dirname(os.path.abspath(__file__)) + '/'
SRC = open(W + 'v3/roof_v3.py', encoding='utf-8').read()
TOP = SRC.split("if __name__ == '__main__':")[0]
LOOP = """for L in LAN:
    m = box(L['x0'], L['x1'], L['y0'], L['y1'])
    H[m] = np.maximum(RZ[m], L['zb'] + L['h'] * (1 - np.abs(XX[m] - L['xc']) / (LW / 2)))"""
assert LOOP in TOP
POSTS = """
for px, py in [(58.0, 0.6), (60.6, 0.6), (58.0, 2.6), (60.6, 2.6)]:          # стійки порталу 0,15 × 0,15, H 3,4 (obst.js, оцінка за фото)
    put(box(px - 0.13, px + 0.13, py - 0.13, py + 0.13), np.float32(float(roofZ(59.3)) + 3.4))"""
ns = {}
exec(TOP.replace(LOOP, POSTS), ns)
roofZ, LAN, DF, AC, run, WX = ns['roofZ'], ns['LAN'], ns['DF'], ns['AC'], ns['run'], ns['WX']
TILT = 13.0; HALF = 1.5; CURB = 0.30            # кут (власник), півширина каркаса (3,0 м — власник), низ кутників над покрівлею (оцінка)
tg = math.tan(math.radians(TILT))
FR = []
for i, L in enumerate(LAN):
    ze = L['zb'] + CURB
    FR.append(dict(n=i + 1, xc=round(L['xc'], 3), y0=L['y0'], y1=L['y1'], zb=round(L['zb'], 3), ze=round(ze, 3), zr=round(ze + HALF * tg, 3),
                   half=HALF, tilt=TILT))
RES = 0.5; XG0, YG0 = -0.5, -0.25
xs = np.arange(XG0 + RES / 2, 96.5, RES); ys = np.arange(YG0 + RES / 2, 96.34, RES); nx, ny = len(xs), len(ys)
def slope(x):
    e = 0.05; return (float(roofZ(x + e)) - float(roofZ(x - e))) / (2 * e)
pts, nrm, kind = [], [], []
for y in ys:
    for x in xs:
        k = 'r'; z = float(roofZ(x)); sl = slope(x)
        for F in FR:
            dx = x - F['xc']
            if abs(dx) <= HALF and F['y0'] <= y <= F['y1']:
                k = 'f'; z = F['ze'] + (HALF - abs(dx)) * tg; sl = tg * (1 if dx < 0 else -1)
        occ = AC['x0'] <= x <= AC['x1'] and AC['y0'] <= y <= AC['y1']
        for o in DF:
            if (x - o['x']) ** 2 + (y - o['y']) ** 2 <= (o['d'] / 2) ** 2: occ = True
        if occ: k = 'o'
        nv = np.array([-sl, 0, 1.0]); nv /= np.linalg.norm(nv)
        pts.append((x, y, z + 0.05)); nrm.append(nv); kind.append(k)
P = np.array(pts); N = np.array(nrm); K = np.array(kind)
use = K != 'o'
R_ = run(P[use], N[use], k=1, irr_only=True)
I = np.full(len(P), np.nan); Iu = np.full(len(P), np.nan); Imo = np.full((12, len(P)), np.nan)
I[use] = R_['I']; Iu[use] = R_['Iun']; Imo[:, use] = R_['Imo']
GHI = sum(sum(wm['nd'] / 6 * (wm['p'] * st[4] + (1 - wm['p']) * wm['c'] * st[4]) for st in wm['st']) for wm in WX['mo']) / 1000
st = {}
for nm, m in (('roof', K == 'r'), ('frame', K == 'f')):
    v = I[m]; st[nm] = dict(n=int(m.sum()), mean=round(float(np.nanmean(v)), 1), p10=round(float(np.nanpercentile(v, 10))), p50=round(float(np.nanpercentile(v, 50))),
                            p90=round(float(np.nanpercentile(v, 90))), min=round(float(np.nanmin(v))), max=round(float(np.nanmax(v))),
                            shade=round(float(1 - np.nansum(v) / np.nansum(Iu[m])) * 100, 1))
fe = (K == 'f') & (N[:, 0] > 0); fw = (K == 'f') & (N[:, 0] < 0)
st['frameE'] = round(float(np.nanmean(I[fe])), 1); st['frameW'] = round(float(np.nanmean(I[fw])), 1)
print('cells', len(P), dict(zip(*np.unique(K, return_counts=True))), 'GHI', round(GHI, 1)); print(json.dumps(st, ensure_ascii=False))
OUT = dict(res=RES, nx=nx, ny=ny, x0=XG0, y0=YG0, ghi=round(GHI, 1), k=''.join(K), FR=FR, stats=st,
           e=[None if np.isnan(v) else int(round(v)) for v in I], u=[None if np.isnan(v) else int(round(v)) for v in Iu],
           mo=[[None if np.isnan(v) else round(float(v), 1) for v in Imo[m]] for m in range(12)])
json.dump(OUT, open(W + 'irr_nolan.json', 'w'))
print('saved')
