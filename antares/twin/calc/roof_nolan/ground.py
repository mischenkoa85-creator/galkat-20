import math, numpy as np, sys
sys.path.insert(0, '.')
import roofobj as R
def ray(u, v, W, H, F, yaw, pitch, roll=0.0):
    fpx = F * math.hypot(W, H) / 43.27; ps, th, ro = map(math.radians, (yaw, pitch, roll))
    f = np.array([math.sin(ps) * math.cos(th), math.cos(ps) * math.cos(th), math.sin(th)]); r = np.array([math.cos(ps), -math.sin(ps), 0.0]); uu = np.cross(r, f)
    r2 = r * math.cos(ro) + uu * math.sin(ro); u2 = -r * math.sin(ro) + uu * math.cos(ro)
    d = f + (u - W / 2) / fpx * r2 - (v - H / 2) / fpx * u2; return d / np.linalg.norm(d)
def ground(u, v, X, Y, h, yaw, pitch, F=23, W=1200, H=1600, roll=0.0, dz=0.0):
    """intersection of pixel ray with roof surface (+dz)"""
    C = np.array([X, Y, R.roofZ(X) + h]); d = ray(u, v, W, H, F, yaw, pitch, roll)
    if d[2] >= 0: return None
    for t in np.arange(0.5, 200, 0.05):
        p = C + t * d
        if p[2] <= R.roofZ(min(max(p[0], -0.5), 96.4)) + dz: return p.round(2), round(t, 1)
    return None
def near(p, k=3):
    L = sorted(R.DEFL, key=lambda o: math.hypot(o['x'] - p[0], o['y'] - p[1]))[:k]
    return [(o['n'], o['st'][:5], round(math.hypot(o['x'] - p[0], o['y'] - p[1]), 1)) for o in L]
