# -*- coding: utf-8 -*-
"""Надбудова сходів АБК: «домік» схід–захід 15° (питання 28.10, 14:30) — і як модулі надбудови лягають у стрінги разом з усім АБК.
Геометрія і модель — як у nad.py (= calc/v3/abk_nad.py)."""
import collections, os
SRC = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'abk_nad.py'), encoding='utf-8').read(); exec(SRC.split('# ---------- існуючі модулі')[0])
C15, S15, T15 = math.cos(math.radians(15)), math.sin(math.radians(15)), math.tan(math.radians(15))
DEP, RISE = DM * C15, DM * S15
def dom(x_parts, ys, zb):
    """x_parts: [(xa, 'W'|'E')] схили; ys — південні краї рядів (модуль 2384 уздовж Пн–Пд)"""
    out = []
    for y in ys:
        for xa, fc in x_parts:
            xb = xa + DEP; sg = -1 if fc == 'W' else 1; lo = xa if fc == 'W' else xb; n = np.array([sg * S15, 0, C15])
            pts = [(lo - sg * f * DEP, y + LM / 2, zb + HLOW + f * RISE + 0.05) for f in (0.17, 0.5, 0.83)]
            out.append(dict(part='N', how='ew', x0=xa, x1=xb, y0=y, y1=y + LM, n=n, pts=pts, face=fc, tilt=15.0, lo=lo, zb=zb, col=round(xa, 2)))
    return out
XI0, XI1 = S0 + WT, S1 - WT; XM = (S0 + S1) / 2
PAIR_C = [(XM - DEP, 'W'), (XM, 'E')]                                          # пара по центру, до парапетів ≈0,96 м
w3 = 2 * DEP + 0.4 + DEP; a3 = XI0 + (XI1 - XI0 - w3) / 2
PAIR_S = [(a3, 'W'), (a3 + DEP, 'E'), (a3 + 2 * DEP + 0.4, 'E')]               # пара + ще один схил на схід через прохід 0,4 (як на нижньому даху)
yN = [S3 - WT - (S3 - WT - SPLIT - WT - LM) / 2 - LM]
yS = [S2 + WT + (SPLIT - S2 - WT - (2 * LM + GAP)) / 2]; yS.append(yS[0] + LM + GAP)
def dsm_dom(M):
    for m in M:
        if m['how'] == 'ew': put(box(m['x0'], m['x1'], m['y0'], m['y1']), (m['zb'] + HLOW + np.abs(XX - m['lo']) * T15 + 0.04).astype(np.float32))
        else: put(box(m['x0'], m['x1'], m['y0'], m['y1']), (m['zb'] + HLOW + (YY - m['y0']) * m['tg'] + 0.04).astype(np.float32))
# ---------- увесь АБК: арка (як є 95 / ДБН 86), нижній дах 33, стіни 9
def arch_set(lst):
    out = []
    for m in lst:
        k = (m['zb'] - m['za']) / (m['xb'] - m['xa']); xm, zm = (m['xa'] + m['xb']) / 2, (m['za'] + m['zb']) / 2; n = np.array([-k, 0, 1.0]); n /= np.linalg.norm(n)
        out.append(dict(part='A', how='flush', x0=m['xa'], x1=m['xb'], y0=m['y0'], y1=m['y1'], n=n, face=m['face'], tilt=m['tilt'], col=m['col'],
                        pts=[(xm, m['y0'] + LM / 2 + t, zm + 0.12 + 0.033 + 0.03) for t in (-0.892, 0.0, 0.888)]))
    return out
LOWS = []
for m in J['low']:
    if not m['used']: continue
    sg = -1 if m['face'] == 'W' else 1; lo = m['lo']
    LOWS.append(dict(part='L', how='ew', x0=m['xa'], x1=m['xb'], y0=m['y0'], y1=m['y1'], n=np.array([sg * S15, 0, C15]), face=m['face'], tilt=15.0, col=round(m['xa'], 2),
                     pts=[(lo - sg * f * DEP, (m['y0'] + m['y1']) / 2, AL['h'] + G['hlow'] + f * RISE + 0.05) for f in (0.17, 0.5, 0.83)]))
def fill(a, b, w):
    n = int((b - a + GAP) // (w + GAP)); st = a + (b - a - (n * (w + GAP) - GAP)) / 2; return [st + i * (w + GAP) for i in range(n)]
WALLS = []; zb_ = AL['h'] + 0.5; ns = np.array([0, -1.0, 0])
for x in fill(AB['x0'] + 0.5, S0 - 0.5, DM) + fill(max(S1 + 0.5, G['ladder']['x1'] + G['ladder']['clr']), AB['x1'] - 0.5, DM):
    WALLS.append(dict(part='W', how='wall', x0=x, x1=x + DM, y0=AB['y0'], y1=AB['y0'], n=ns, face='S', tilt=90.0, col=round(x, 2), pts=[(x + DM / 2, AB['y0'] - 0.16, zb_ + f * LM) for f in (0.17, 0.5, 0.83)]))
for x in fill(S0 + 0.2, S1 - 0.2, LM):
    WALLS.append(dict(part='W', how='wall', x0=x, x1=x + LM, y0=S2, y1=S2, n=ns, face='S', tilt=90.0, col=round(x, 2), pts=[(x + LM / 2, S2 - 0.16, zb_ + f * DM) for f in (0.17, 0.5, 0.83)]))
def strings(M, E):                                    # як у calc/v3/abk.py
    grp = collections.defaultdict(list)
    for i, m in enumerate(M):
        key = m['face'] + ('<5' if m['tilt'] < 5 else '5-10' if m['tilt'] < 10 else '>10') if m['how'] == 'flush' else m['face']
        grp[key].append(i)
    S_ = []; left = collections.defaultdict(list)
    for key, ii in grp.items():
        ii = sorted(ii, key=lambda i: (M[i].get('col', 0), M[i]['x0'], M[i]['y0'])); m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]; left[key[0]] += ii[m * 11:]
    drop = []
    for f, ii in left.items():
        ii = sorted(ii, key=lambda i: -E[i]); m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]; drop += ii[m * 11:]
    return S_, drop
def whole(name, arch, extra):
    M = arch + LOWS + WALLS + extra
    H[:] = H_BASE; dsm_dom(extra)
    P = np.array([p for m in M for p in m['pts']]); N = np.array([m['n'] for m in M]); ST, Ir = L.run_steps(P, N); E = L.mod_kwh(ST, len(M))
    S_, drop = strings(M, E)
    while len(drop) >= 11:                             # залишки різних боків — ще спільні стрінги, поки втрати ≤ 12 %
        dd = sorted(drop, key=lambda i: -E[i]); best = None
        for f in ('W', 'E', 'S', None):                # спершу пробуємо стрінг, у якому якомога більше однієї орієнтації
            pool = [i for i in dd if M[i]['face'] == f] if f else []
            ex = (pool + [i for i in dd if i not in pool])[:11]; e, e0, _ = L.string_energy(ST, ex)
            if e / e0 > 0.88 and (best is None or e > best[1]): best = (ex, e)
        if not best: break
        S_.append(best[0]); drop = [i for i in dd if i not in best[0]]
    tot = 0.0; SR = []
    for ids in S_:
        e, e0, _ = L.string_energy(ST, ids); tot += e
        SR.append(dict(n=len(ids), parts=''.join(sorted(set(M[i]['part'] for i in ids))), faces=''.join(sorted(set(M[i]['face'] for i in ids))), mwh=round(e / 1000, 2), mism=round((1 - e / e0) * 100, 1)))
    ix = range(len(M) - len(extra), len(M)); H[:] = H_BASE
    r = dict(name=name, n=sum(len(s) for s in S_), st=len(S_), mwh=round(tot / 1000, 2), drop=len(drop),
             drop_parts=dict(collections.Counter(M[i]['part'] for i in drop)), extra_n=len(extra),
             extra_kwh=[round(float(E[i])) for i in ix], extra_y=round(float(sum(E[i] for i in ix)) / max(len(extra), 1) / PW) if extra else 0,
             in_str=sum(1 for s in S_ for i in s if i in ix), strings_with_N=[s for s in SR if 'N' in s['parts']])
    print(f"{name}: у стрінгах {r['n']} = {r['st']} стр., {r['mwh']} МВт·год; поза стрінгами {r['drop']} {r['drop_parts']}; надбудова {r['extra_n']} мод., {r['extra_y']} кВт·год/кВтп, у стрінгах {r['in_str']}; {r['extra_kwh']}")
    for s in SR:
        if 'N' in s['parts'] or 'W' in s['parts']: print('     стрінг:', s)
    return r
T3 = variant('L', 1, 2)
for m in T3: m.update(part='N', face='S', col=round(m['x0'], 2))
OPT = {'none': [], 'T3': T3, 'D6': dom(PAIR_C, yN, ZN) + dom(PAIR_C, yS, ZS), 'D9': dom(PAIR_S, yN, ZN) + dom(PAIR_S, yS, ZS),
       'D5': dom(PAIR_C, yN, ZN) + dom(PAIR_C, yS[:1], ZS) + dom([(XM - DEP / 2, 'W')], yS[1:], ZS)}
RES = {}
for vn, arch in (('as', arch_set(J['arch'])), ('dbn', arch_set(J['archD']))):
    for k, ex in OPT.items(): RES[vn + '_' + k] = whole(f'{vn} + {k}', arch, ex)
json.dump(RES, open('abk_nad2.json', 'w'), ensure_ascii=False, default=float)
print('Пн: усередині', round(XI1 - XI0, 2), '×', round(S3 - WT - SPLIT - WT, 2), '; Пд:', round(XI1 - XI0, 2), '×', round(SPLIT - S2 - WT, 2), '; пара', round(2 * DEP, 3), 'відступ', round((XI1 - XI0 - 2 * DEP) / 2, 2), '; пара+1', round(w3, 3), 'відступ', round((XI1 - XI0 - w3) / 2, 2), '; yN', [round(y, 2) for y in yN], 'yS', [round(y, 2) for y in yS])
