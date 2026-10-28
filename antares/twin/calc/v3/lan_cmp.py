# -*- coding: utf-8 -*-
"""28.10: порівняння «ліхтарі лишити (скління ≈46°) і покласти модулі книжково на скління» проти «скління прибрати, каркас 12–13° на бортику».
Однакова логіка для обох: ті самі місця (318), ті самі стрінги — «максимум» (lan22.lan_mods: залишки сходу й заходу між ліхтарями)
і «зручний монтаж» (як lan13_mount: стрінг лише в межах одного ліхтаря). Дах — розкладка А з тінню від ліхтарів разом з модулями.
MODE=K46 (TILT = atan(1,89 / 1,83) = 45,9°) або MODE=V1 (TILT=12/13, CURB). Труби — DFFILE (11 за фото 28.10). → cmp_<MODE>_t<TILT>.json"""
import os, sys, json, math, numpy as np
MODE = os.environ.get('MODE', 'K46')
if MODE == 'K46': os.environ['TILT'] = str(math.degrees(math.atan2(1.89, 1.83)))
V = '/home/claude/work/sun/v3/'; sys.path.insert(0, V)
import lan22 as L
LM, DM, GAP = L.LM, L.DM, L.GAP; ct, st_ = L.ct, L.st_
if MODE == 'K46':
    L.MODES['K46'] = dict(name='Модулі книжково на нинішніх ліхтарях (скління ≈46°)', half=L.LW0 / 2, rows=1, orient='P')
    F = L.build_dsm('base'); H, XX, YY = L.H, L.XX, L.YY
    for Ln in F:                                   # шар модулів над склінням: товщина 0,153 м по нормалі
        Ly = Ln['y1'] - Ln['y0']; pitch = DM + GAP; n = int((Ly + GAP) // pitch); ys = (Ln['y0'] + Ln['y1']) / 2 - (n * pitch - GAP) / 2
        ax_ = np.abs(XX - Ln['xc']); m = (ax_ >= 0.02 * ct) & (ax_ <= (0.02 + LM) * ct) & (YY >= ys) & (YY <= ys + n * pitch)
        H[m] = np.maximum(H[m], (Ln['ridge'] - ax_[m] * math.tan(math.radians(L.TILT)) + 0.153 / ct).astype(np.float32))
else:
    F = L.build_dsm('V1')
roof = L.roof_A(F)
lan = L.lan_mods(F, MODE)
# «зручний монтаж»: стрінг — 11 сусідніх модулів одного схилу одного ліхтаря; залишок ліхтаря — спільний стрінг Сх+Зх, якщо набирається 11
MODS = lan['mods']
P = []; N = []
for m in MODS:
    Ln = F[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1; nrm = np.array([sg * st_, 0, ct]); N.append(nrm)
    for f_ in (0.2, 0.5, 0.8):
        um = 0.02 + LM * f_; P.append((Ln['xc'] + sg * um * ct + nrm[0] * 0.30, m['y'] + DM / 2, Ln['ridge'] - um * st_ + nrm[2] * 0.30))
ST, I = L.run_steps(np.array(P), np.array(N))
idx = lambda l, s: sorted([k for k, m in enumerate(MODS) if m['l'] == l and m['side'] == s], key=lambda k: MODS[k]['y'])
seng = lambda ids: L.string_energy(ST, ids)
tot = 0; n_used = 0; nst = 0
for l in range(1, len(F) + 1):
    Ei, Wi = idx(l, 'E'), idx(l, 'W'); n = len(Ei); k = n // 11; rest = n - k * 11; best = None
    for end in ('S', 'N'):
        if end == 'N': bE, bW, rE, rW = Ei[:k * 11], Wi[:k * 11], Ei[k * 11:], Wi[k * 11:]
        else: bE, bW, rE, rW = Ei[rest:], Wi[rest:], Ei[:rest][::-1], Wi[:rest][::-1]
        S = [bE[s * 11:(s + 1) * 11] for s in range(k)] + [bW[s * 11:(s + 1) * 11] for s in range(k)]
        cands = [S]
        if 2 * rest >= 11:
            for ne in range(max(0, 11 - rest), min(rest, 11) + 1):
                if 11 - ne <= rest: cands.append(S + [rE[:ne] + rW[:11 - ne]])
        for SS in cands:
            t = sum(seng(ids)[0] for ids in SS)
            if best is None or t > best[0]: best = (t, SS)
    tot += best[0]; nst += len(best[1]); n_used += sum(len(s) for s in best[1])
OUT = dict(mode=MODE, tilt=round(L.TILT, 2), curb=L.CURB, roof=dict(n=roof['n'], st=roof['st'], kwp=roof['kwp'], mwh=roof['mwh']),
           max=dict(places=lan['places'], n=lan['n'], st=lan['st'], kwp=lan['kwp'], mwh=lan['mwh'], y=lan['y'], irrE=lan['irrE'], irrW=lan['irrW']),
           conv=dict(n=n_used, st=nst, kwp=round(n_used * L.PW, 2), mwh=round(tot / 1000, 2), y=round(tot / n_used / L.PW)))
json.dump(OUT, open(V + f"cmp_{MODE}_t{round(L.TILT)}_c{L.CURB:.2f}.json", 'w'), ensure_ascii=False)
print(json.dumps(OUT, ensure_ascii=False))
