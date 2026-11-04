# -*- coding: utf-8 -*-
"""Фасадні панелі-козирки 25° на південному і східному фасадах — максимальна розкладка і генерація. Антарес, 26.10.2026.
Модуль ZNSHINE ZXN8-BD132-730 2384 × 1303: довгий бік уздовж стіни, короткий — від стіни (виліт 1,18 м, верх біля стіни, низ на 0,55 м нижче).
Ряди — по суцільних смугах стіни (не перед вікнами, вище воріт і людей), розриви — сходи, вентканал, спуски кабельних лотків УЗЕ.
Тінь: будівлі й предмети (DSM, горизонт 72 напрями для кожного модуля) + ряди над модулем (2D). Модель модуля — як у двійнику
(температура PVsyst U 29 — вільна установка, −0,30 %/°C, втрати 11,4 %); тильна сторона двостороннього модуля не врахована."""
import json, math, numpy as np
SRC = open('/home/claude/work/sun/irr.py', encoding='utf-8').read(); exec(SRC[:SRC.find('# ---------- точки')])
BETA = 25.0; DM, LM, GAP = 1.303, 2.384, 0.02; PM = LM + GAP; cb, sb = math.cos(math.radians(BETA)), math.sin(math.radians(BETA))
FAC = {
  'S': dict(nw=np.array([0, -1.0, 0]), wall=lambda s, h, o: (s, -0.5 - o, h), tops=[5.25, 7.4, 12.35, 14.7],
            segs=[(0.05, 58.2), (65.9, 96.55)], name='Південний фасад'),
  'E': dict(nw=np.array([1.0, 0, 0]), wall=lambda s, h, o: (96.64 + o, s, h), tops=[5.15, 6.5, 11.8, 14.0],
            segs=[(-0.4, 53.6), (54.6, 62.9), (64.2, 73.6), (74.4, 96.5)], name='Східний фасад')}
WHY = {'S': {5.25: 'над воротами й кабелями, під ґратками вентиляції', 7.4: 'під стрічковими вікнами', 12.35: 'над другим рядом вікон', 14.7: 'під парапетом'},
       'E': {5.15: 'над ТП-5913, воротами й нижніми вікнами, під кабелями на «лапках»', 6.5: 'над кабелями, під вікнами', 11.8: 'над вікнами', 14.0: 'під парапетом'}}
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA; ALB = 0.2
LOSS_A = 0.975 * 0.985 * 0.99 * 0.98 * 0.975 * 0.985 * 0.99; GAMT = -0.003; PW, U, ETA = 0.730, 29, 0.235
modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS_A, 0)
def horizon(P):
    HOR = np.zeros((len(P), NA), np.float32)
    for a in range(NA):
        X = P[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = P[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
        HOR[:, a] = np.maximum(np.arctan2(Hat(X, Y) - P[:, 2:3], DS[None, :]).max(axis=1), 0)
    return HOR
def seg_hit(x0, y0, dx, dy, offs):
    for k in offs:
        ax, ay, bx, by = 0.0, k, DM * cb, k - DM * sb; ex, ey = bx - ax, by - ay; den = dx * ey - dy * ex
        if abs(den) < 1e-12: continue
        s = ((ax - x0) * ey - (ay - y0) * ex) / den; u = ((ax - x0) * dy - (ay - y0) * dx) / den
        if s > 1e-6 and 0 <= u <= 1: return True
    return False
def lit2d(o, up, offs):
    if not offs: return 1.0
    L = math.hypot(o, up); dx, dy = o / L, up / L; n = 0; N = 21
    for t in np.linspace(0.02, 0.98, N):
        if not seg_hit(DM * cb * t, -DM * sb * t, dx, dy, offs): n += 1
    return n / N
def diff2d(offs):
    an = math.radians(90 - BETA)
    def F(rows):
        tot = 0
        for t in np.linspace(0.05, 0.95, 7):
            x0, y0 = DM * cb * t, -DM * sb * t
            for ps in np.radians(np.linspace(-89.5, 89.5, 180)):
                a = an + ps; dx, dy = math.cos(a), math.sin(a)
                if dy <= 0 or dx < 0: continue
                if rows and seg_hit(x0, y0, dx, dy, rows): continue
                tot += math.cos(ps)
        return tot
    return F(offs) / F([]) if offs else 1.0
MODS = []; ROWS = []
for k, F in FAC.items():
    nw = F['nw']; n = nw * sb + np.array([0, 0, 1.0]) * cb; tops = F['tops']
    for r, top in enumerate(tops):
        offs = [t2 - top for t2 in tops if t2 > top]                       # ряди вище — їхні відступи по висоті
        cnt = 0
        for a, b in F['segs']:
            m = int((b - a + GAP) // PM); s0 = a + ((b - a) - (m * PM - GAP)) / 2
            for i in range(m):
                sc = s0 + i * PM + LM / 2; c = np.array(F['wall'](sc, top - DM * sb / 2, DM * cb / 2))
                MODS.append(dict(f=k, row=r, top=top, s=round(sc, 3), c=c, n=n, offs=offs)); cnt += 1
        ROWS.append(dict(f=k, row=r, top=top, n=cnt, why=WHY[k][top], gap_above=round(min(offs), 2) if offs else None))
print('modules', len(MODS), {k: sum(1 for m in MODS if m['f'] == k) for k in FAC})
P = np.array([m['c'] for m in MODS]); N = np.array([m['n'] for m in MODS]); HOR = horizon(P)
SVF = np.zeros(len(P)); SVF0 = np.zeros(len(P))
for a in range(NA):
    for e in EL:
        v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); c = N @ v
        w = np.where(c > 0, c, 0) * math.cos(e) * dEl * dAz / math.pi; SVF0 += w; SVF += w * (e > HOR[:, a])
# діффузне від рядів — на ряд
RD = {};
for m in MODS:
    key = (m['f'], m['row']);
    if key not in RD: RD[key] = diff2d(m['offs'])
Rd = np.array([RD[(m['f'], m['row'])] for m in MODS])
NWv = np.array([FAC[m['f']]['nw'] for m in MODS]); OFFS = [m['offs'] for m in MODS]
Ekwh = np.zeros(len(P)); Eun = np.zeros(len(P)); POA = np.zeros(len(P)); POAun = np.zeros(len(P)); Emo = np.zeros((12, len(P)))
lit_cache = {}
for mo, Wm in enumerate(WX['mo']):
    wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
    for st in Wm['st']:
        h, ex, ey, sz, G, Dn, Dd, ext, ta = st; dv = np.array([ex, ey, sz]); cosb = np.maximum(N @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f)
        vis = el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t
        lit = np.ones(len(P))
        for key in RD:
            idx = [i for i, m in enumerate(MODS) if (m['f'], m['row']) == key]
            o = float(dv @ FAC[key[0]]['nw']); lit[idx] = lit2d(o, sz, MODS[idx[0]]['offs']) if (cosb[idx[0]] > 0) else 1.0
        beam = Dn * cosb + Dd * Ai * cosb / cz; iso = Dd * (1 - Ai); gr = G * ALB * (1 - cb) / 2; Go = c_ * G
        poa_c = beam * vis * lit + iso * SVF * Rd + gr; poa_o = Go * SVF * Rd + Go * ALB * (1 - cb) / 2
        un_c = beam + iso * SVF0 + gr; un_o = Go * SVF0 + Go * ALB * (1 - cb) / 2
        e = wt * (p_ * modP(poa_c, ta) + (1 - p_) * modP(poa_o, ta)); Ekwh += e; Emo[mo] += e
        Eun += wt * (p_ * modP(un_c, ta) + (1 - p_) * modP(un_o, ta))
        POA += wt / 1000 * (p_ * poa_c + (1 - p_) * poa_o); POAun += wt / 1000 * (p_ * un_c + (1 - p_) * un_o)
for R in ROWS:
    idx = [i for i, m in enumerate(MODS) if m['f'] == R['f'] and m['row'] == R['row']]
    R.update(kwh=round(float(Ekwh[idx].sum())), kwh_mod=round(float(Ekwh[idx].mean())), kwh_kwp=round(float(Ekwh[idx].mean() / PW)),
             poa=round(float(POA[idx].mean())), loss=round(float(1 - Ekwh[idx].sum() / Eun[idx].sum()) * 100, 1), rd=round(RD[(R['f'], R['row'])], 3))
    print(R)
TOT = {k: dict(n=sum(1 for m in MODS if m['f'] == k), kwh=round(float(sum(Ekwh[i] for i, m in enumerate(MODS) if m['f'] == k)))) for k in FAC}
for k in TOT: TOT[k]['kwp'] = round(TOT[k]['n'] * PW, 2); TOT[k]['kwh_kwp'] = round(TOT[k]['kwh'] / TOT[k]['kwp'])
allk = sum(t['kwh'] for t in TOT.values()); alln = sum(t['n'] for t in TOT.values())
TOT['all'] = dict(n=alln, kwp=round(alln * PW, 2), kwh=round(allk), kwh_kwp=round(allk / (alln * PW)))
print(TOT)
KEEP = np.array([not (m['f'] == 'E' and m['row'] < 3) for m in MODS])
OUT = dict(beta=BETA, rows=ROWS, tot=TOT, mo=[round(float(Emo[m].sum())) for m in range(12)], mo_keep=[round(float(Emo[m][KEEP].sum())) for m in range(12)],
           mods=[[m['f'], m['row'], m['top'], m['s'], round(float(Ekwh[i]), 1)] for i, m in enumerate(MODS)])
json.dump(OUT, open('/home/claude/work/sun/fac25.json', 'w'), ensure_ascii=False, indent=1)
