# -*- coding: utf-8 -*-
"""АБК: варіанти «Як є» / «ДБН» з доміком на надбудові — генерація і стрінги по 11 повною моделлю K1 (запит 28.10, 14:55).
Модель — як у abk.py / abk_nad.py (Meteonorm 8.1, крок 10 хв, тіні DSM 0,25 м, горизонт, байпас-діоди), геометрія — antares/abk/abk_k1.json (layout.py).
Надбудова: домік 6 модулів (пара по центру, пн 1 ряд, пд 2 ряди). Варіант «ДБН + 30 %» прибрано 28.10 (рішення власника).
Стрінги: по 11 у межах орієнтації, залишки — спільні стрінги, поки втрати від різної освітленості ≤ 12 % (як на ліхтарях); решта — поза стрінгами.
→ antares/abk/abk_var.json"""
import os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'abk_nad.py'), encoding='utf-8').read().split('# ---------- існуючі модулі')[0])
C15, S15, T15 = math.cos(math.radians(15)), math.sin(math.radians(15)), math.tan(math.radians(15)); DEP, RISE = DM * C15, DM * S15
def M_arch(lst, src):
    out = []
    for i, m in enumerate(lst):
        k = (m['zb'] - m['za']) / (m['xb'] - m['xa']); xm, zm = (m['xa'] + m['xb']) / 2, (m['za'] + m['zb']) / 2; n = np.array([-k, 0, 1.0]); n /= np.linalg.norm(n)
        out.append(dict(src=src, i=i, part='A', how='flush', x0=m['xa'], y0=m['y0'], n=n, face=m['face'], tilt=m['tilt'], col=m['col'], pts=[(xm, m['y0'] + LM / 2 + t, zm + 0.12 + 0.033 + 0.03) for t in (-0.892, 0.0, 0.888)]))
    return out
def M_dom(lst, src, part, zr_key=None):
    out = []
    for i, m in enumerate(lst):
        sg = -1 if m['face'] == 'W' else 1; lo = m['lo']; zr = m.get('zr', AL['h'])
        out.append(dict(src=src, i=i, part=part, how='ew', x0=m['xa'], x1=m['xb'], y0=m['y0'], y1=m['y1'], lo=lo, zr=zr, n=np.array([sg * S15, 0, C15]), face=m['face'], tilt=15.0, col=round(m['xa'], 2),
                        pts=[(lo - sg * f * DEP, (m['y0'] + m['y1']) / 2, zr + G['hlow'] + f * RISE + 0.05) for f in (0.17, 0.5, 0.83)]))
    return out
LOWU = [m for m in J['low'] if m['used']]; LOW_IDX = [i for i, m in enumerate(J['low']) if m['used']]
def fill(a, b, w):
    n = int((b - a + GAP) // (w + GAP)); st = a + (b - a - (n * (w + GAP) - GAP)) / 2; return [st + i * (w + GAP) for i in range(n)]
WALLS = []; zb_ = AL['h'] + 0.5; ns = np.array([0, -1.0, 0])
for x in fill(AB['x0'] + 0.5, S0 - 0.5, DM) + fill(max(S1 + 0.5, G['ladder']['x1'] + G['ladder']['clr']), AB['x1'] - 0.5, DM):
    WALLS.append(dict(part='W', how='wall', x0=x, y0=AB['y0'], n=ns, face='S', tilt=90.0, col=round(x, 2), pts=[(x + DM / 2, AB['y0'] - 0.16, zb_ + f * LM) for f in (0.17, 0.5, 0.83)]))
for x in fill(S0 + 0.2, S1 - 0.2, LM):
    WALLS.append(dict(part='W', how='wall', x0=x, y0=S2, n=ns, face='S', tilt=90.0, col=round(x, 2), pts=[(x + LM / 2, S2 - 0.16, zb_ + f * DM) for f in (0.17, 0.5, 0.83)]))
for i, w in enumerate(WALLS): w.update(src='wall', i=i)
assert len(WALLS) == 9
def strings(M, E, ST):
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
    while len(drop) >= 11:
        dd = sorted(drop, key=lambda i: -E[i]); best = None
        for f in ('W', 'E', 'S', None):
            pool = [i for i in dd if M[i]['face'] == f] if f else []
            ex = (pool + [i for i in dd if i not in pool])[:11]; e, e0, _ = L.string_energy(ST, ex)
            if e / e0 > 0.88 and (best is None or e > best[1]): best = (ex, e)
        if not best: break
        S_.append(best[0]); drop = [i for i in dd if i not in best[0]]
    return S_, drop
def dsm_nad(lst):
    for m in lst: put(box(m['xa'], m['xb'], m['y0'], m['y1']), (m['zr'] + HLOW + np.abs(XX - m['lo']) * T15 + 0.04).astype(np.float32))
def run_var(name, A, LW, NADL):
    M = A + LW + WALLS + M_dom(NADL, 'nad', 'N')
    H[:] = H_BASE; dsm_nad(NADL)
    P = np.array([p for m in M for p in m['pts']]); N = np.array([m['n'] for m in M]); ST, Ir = L.run_steps(P, N); E = L.mod_kwh(ST, len(M))
    S_, drop = strings(M, E, ST); H[:] = H_BASE
    tot = 0.0; SR = []; sid = {}
    for k, ids in enumerate(S_):
        e, e0, emo = L.string_energy(ST, ids); tot += e
        SR.append(dict(n=len(ids), parts=''.join(sorted(set(M[i]['part'] for i in ids))), faces=''.join(sorted(set(M[i]['face'] for i in ids))), mwh=round(e / 1000, 2), mism=round((1 - e / e0) * 100, 1)))
        for i in ids: sid[i] = k + 1
    cnt = collections.Counter(m['part'] for m in M)
    kwh = collections.defaultdict(dict); st = collections.defaultdict(dict)
    for i, m in enumerate(M): kwh[m['src']][m['i']] = round(float(E[i])); st[m['src']][m['i']] = sid.get(i, 0)
    n = sum(len(s) for s in S_)
    r = dict(name=name, arch=cnt['A'], low=cnt['L'], nad=cnt['N'], wall=cnt['W'], places=len(M), n=n, st=len(S_), kwp=round(n * PW, 1), mwh=round(tot / 1000, 1),
             drop=len(drop), drop_by=dict(collections.Counter(M[i]['part'] for i in drop)), y=round(tot / n / PW) if n else 0,
             nad_y=round(sum(E[i] for i, m in enumerate(M) if m['part'] == 'N') / max(cnt['N'], 1) / PW), strings=SR,
             kwh={k: [v[i] for i in sorted(v)] for k, v in kwh.items()}, sid={k: [v[i] for i in sorted(v)] for k, v in st.items()}, idx={k: sorted(v) for k, v in kwh.items()})
    print(f"{name}: місць {r['places']} (арка {r['arch']}, нижній {r['low']}, надбудова {r['nad']}, стіни {r['wall']}); у стрінгах {n} = {r['st']}, {r['kwp']} кВтп, {r['mwh']} МВт·год, {r['y']} кВт·год/кВтп; поза {r['drop']} {r['drop_by']}; надбудова {r['nad_y']} кВт·год/кВтп")
    return r, E, M
NADJ = J['nad']; OUT = {}
OUT['as'], _, _ = run_var('Як є', M_arch(J['arch'], 'arch'), M_dom(LOWU, 'low', 'L'), NADJ['d6'])
OUT['as0'], _, _ = run_var('Як є без надбудови', M_arch(J['arch'], 'arch'), M_dom(LOWU, 'low', 'L'), [])
OUT['dbn'], _, _ = run_var('ДБН', M_arch(J['archD'], 'archD'), M_dom(LOWU, 'low', 'L'), NADJ['d6'])
OUT['dbn0'], _, _ = run_var('ДБН без надбудови', M_arch(J['archD'], 'archD'), M_dom(LOWU, 'low', 'L'), [])
for k in ('as', 'as0', 'dbn', 'dbn0'):                                # low-індекси → у повному списку J['low']
    if 'low' in OUT[k]['idx']: OUT[k]['idx']['low'] = [LOW_IDX[i] for i in OUT[k]['idx']['low']]
json.dump(OUT, open('/home/claude/galkat-20/antares/abk/abk_var.json', 'w'), ensure_ascii=False)
