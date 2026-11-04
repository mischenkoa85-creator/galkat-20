# -*- coding: utf-8 -*-
"""Фото ліхтаря 4 зсередини (27.10, 112235–112246): кут сталевих кутників каркаса «доміком».
Метод: точка сходу осі ліхтаря (поздовжні лінії) → лінія сходу поперечної площини (K, ω);
для кожного поперечного відрізка — його точка сходу на цій лінії → напрям у поперечній площині;
вертикаль — бісектриса двох схилів скління (схили симетричні); кут скління — перевірка (рулетка: 1,89 над 1,83 → 45,9°)."""
import json, math, sys, numpy as np, random
D = '/tmp/claude-0/-home-claude/a46e64fa-3229-5beb-8862-98d878ef89e1/scratchpad/lan/'
W, H = 1500, 2000
def K(f): return np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1.0]])
def segs(n): return [np.array(s) for s in json.load(open(D + f'seg_{n}.json'))]
def hline(s): p = np.array([s[0], s[1], 1.0]); q = np.array([s[2], s[3], 1.0]); l = np.cross(p, q); return l / np.linalg.norm(l[:2])
def vp_ls(S):
    A = np.array([hline(s) for s in S]); w = np.array([math.hypot(s[2] - s[0], s[3] - s[1]) for s in S])
    _, _, vt = np.linalg.svd(A * w[:, None]); v = vt[-1]; return v / v[2]
def seg_vp_err(s, v):   # кут (град) між відрізком і прямою від його середини до точки сходу
    m = np.array([(s[0] + s[2]) / 2, (s[1] + s[3]) / 2]); d1 = np.array([s[2] - s[0], s[3] - s[1]]); d2 = v[:2] - m
    c = abs(d1 @ d2) / np.linalg.norm(d1) / np.linalg.norm(d2); return math.degrees(math.acos(min(1, c)))
def ransac_vp(S, it=4000, tol=1.0, seed=1):
    random.seed(seed); best = None
    for _ in range(it):
        a, b = random.sample(S, 2); v = np.cross(hline(a), hline(b))
        if abs(v[2]) < 1e-9: continue
        v = v / v[2]; inl = [i for i, s in enumerate(S) if seg_vp_err(s, v) < tol]
        sc = sum(math.hypot(S[i][2] - S[i][0], S[i][3] - S[i][1]) for i in inl)
        if best is None or sc > best[0]: best = (sc, v, inl)
    return best
def plane_dir(s, va, f):
    """напрям поперечного відрізка в 3D (камера), як точка сходу на лінії сходу поперечної площини"""
    Ki = np.linalg.inv(K(f)); da = Ki @ va; da /= np.linalg.norm(da)
    l = np.linalg.inv(K(f)).T @ da          # лінія сходу площини, перпендикулярної до da: l = K^-T * da
    v = np.cross(hline(s), l); d = Ki @ v; d /= np.linalg.norm(d)
    # знак: напрям від першого кінця до другого в зображенні
    p0 = Ki @ np.array([s[0], s[1], 1.0]); p1 = Ki @ np.array([s[2], s[3], 1.0])
    return d, da
def inplane(n, va, f, excl=()):
    S = segs(n); Ki = np.linalg.inv(K(f)); da = Ki @ np.array([va[0], va[1], 1.0]); da /= np.linalg.norm(da)
    l = K(f) @ np.zeros(3)  # placeholder
    l = np.linalg.inv(K(f)).T @ da
    et = np.array([1.0, 0, 0]) - da * da[0]; et /= np.linalg.norm(et)          # горизонталь поперек (приблизно — вісь x камери)
    ev = np.cross(da, et); ev = ev if ev[1] < 0 else -ev                         # «угору» ≈ −y камери
    out = []
    for i, s in enumerate(S):
        if i in excl: continue
        if seg_vp_err(s, np.array([va[0], va[1], 1.0])) < 3: continue           # поздовжні
        v = np.cross(hline(s), l); d = Ki @ v; d /= np.linalg.norm(d)
        a, b = d @ et, d @ ev
        if b < 0: a, b = -a, -b
        phi = math.degrees(math.atan2(b, a)); L = math.hypot(s[2] - s[0], s[3] - s[1])
        out.append((i, round(phi, 1), round(L), [int(x) for x in s]))
    return out, et, ev, da
