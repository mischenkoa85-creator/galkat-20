# pose fit from points + 3D lines (point-to-projected-line residuals)
import math, numpy as np, sys
from scipy.optimize import least_squares
sys.path.insert(0, '.')
import roofobj as R
from fit import proj
D = {o['n']: o for o in R.DEFL}
def base(n): o = D[n]; return (o['x'], o['y'], R.roofZ(o['x']))
def top(n): o = D[n]; return (o['x'], o['y'], R.roofZ(o['x']) + o['h'])
def lfit(pts, lines, x0, W=1200, H=1600, F=23, hb=(1.4, 1.9), bounds_xy=None, wl=1.0, bear=()):
    """pts: [(P3, (u,v))]; lines: [((A3,B3), [(u,v),...])]; bear: [(P3, u)] bearing-only"""
    def res(q):
        X, Y, h, yaw, pitch, roll = q; z = R.roofZ(min(max(X, -0.5), 96.4)) + h
        r = []
        for P, uv in pts: r += list(proj(P, W, H, F, X, Y, z, yaw, pitch, roll) - np.array(uv))
        for (A, B), obs in lines:
            a = proj(A, W, H, F, X, Y, z, yaw, pitch, roll); b = proj(B, W, H, F, X, Y, z, yaw, pitch, roll)
            d = b - a; n = np.array([-d[1], d[0]]) / np.linalg.norm(d)
            for uv in obs: r.append(wl * float((np.array(uv) - a) @ n))
        for P, u in bear: r.append(proj(P, W, H, F, X, Y, z, yaw, pitch, roll)[0] - u)
        return r
    lo = [-1, -1, hb[0], -400, -30, -8]; hi = [96.4, 96.3, hb[1], 400, 20, 8]
    if bounds_xy: lo[0], hi[0], lo[1], hi[1] = bounds_xy
    x0 = [min(max(v, l + 1e-3), h_ - 1e-3) for v, l, h_ in zip(x0, lo, hi)]
    s = least_squares(res, x0, bounds=(lo, hi), loss='soft_l1', f_scale=10)
    return s.x, np.array(res(s.x))
def predict(q, W=1200, H=1600, F=23, maxd=90):
    X, Y, h, yaw, pitch, roll = q; z = R.roofZ(min(max(X, -0.5), 96.4)) + h; out = []
    for o in R.DEFL:
        d = math.hypot(o['x'] - X, o['y'] - Y)
        if d > maxd: continue
        try:
            b = proj(base(o['n']), W, H, F, X, Y, z, yaw, pitch, roll); t = proj(top(o['n']), W, H, F, X, Y, z, yaw, pitch, roll)
        except Exception: continue
        dirv = np.array([o['x'] - X, o['y'] - Y])
        f = np.array([math.sin(math.radians(yaw)), math.cos(math.radians(yaw))])
        if dirv @ f <= 0: continue
        if -60 < b[0] < W + 60: out.append((o['n'], o['st'][:6], o.get('cls'), int(b[0]), int(t[1]), int(b[1]), round(d, 1)))
    return sorted(out, key=lambda t: t[3])
