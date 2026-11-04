# camera pose fit from point correspondences (full-res pixels) — pinhole, known 35mm-equiv focal
import math, numpy as np, sys
from scipy.optimize import least_squares
sys.path.insert(0, '.')
import roofobj as R
def lanpt(i, what):
    F = R.FRAMES[i - 1]; xc = F['xc']; zb = F['zb']; hw = 1.83
    y = F['y0'] if what[0] == 'S' else F['y1']
    if what[1:] == 'apex': return (xc, y, zb + 1.89)
    if what[1:] == 'W': return (xc - hw, y, R.roofZ(xc - hw))
    if what[1:] == 'E': return (xc + hw, y, R.roofZ(xc + hw))
def defl(n, part='top'):
    o = [d for d in R.DEFL if d['n'] == n][0]; z0 = R.roofZ(o['x'])
    return (o['x'], o['y'], z0 + (o['h'] if part == 'top' else 0))
def proj(p, W, H, F, X, Y, z, yaw, pitch, roll):
    fpx = F * math.hypot(W, H) / 43.27
    ps, th, ro = map(math.radians, (yaw, pitch, roll))
    f = np.array([math.sin(ps) * math.cos(th), math.cos(ps) * math.cos(th), math.sin(th)])
    r = np.array([math.cos(ps), -math.sin(ps), 0.0]); u = np.cross(r, f)
    r2 = r * math.cos(ro) + u * math.sin(ro); u2 = -r * math.sin(ro) + u * math.cos(ro)
    v = np.asarray(p, float) - np.array([X, Y, z]); zz = v @ f
    return np.array([W / 2 + fpx * (v @ r2) / zz, H / 2 - fpx * (v @ u2) / zz])
def fit(pairs, W=1200, H=1600, F=23, x0=(60, 5, 1.5, 0, -3, 0), hb=(1.2, 1.9), xyb=None, yawb=None):
    P = [np.array(p) for p, _ in pairs]; U = [np.array(u, float) for _, u in pairs]
    def res(q):
        X, Y, h, yaw, pitch, roll = q
        z = R.roofZ(min(max(X, -0.5), 96.4)) + h
        return np.concatenate([proj(p, W, H, F, X, Y, z, yaw, pitch, roll) - u for p, u in zip(P, U)])
    lo = [-5, -5, hb[0], -400, -30, -6]; hi = [100, 100, hb[1], 400, 15, 6]
    if xyb: lo[0], hi[0], lo[1], hi[1] = xyb
    if yawb: lo[3], hi[3] = yawb
    x0 = [min(max(v, l + 1e-3), h_ - 1e-3) for v, l, h_ in zip(x0, lo, hi)]
    s = least_squares(res, x0, bounds=(lo, hi), loss='soft_l1', f_scale=8)
    rr = res(s.x).reshape(-1, 2); err = np.hypot(rr[:, 0], rr[:, 1])
    return s.x, err
def fit_rot(pairs, X, Y, h, W=1200, H=1600, F=23, yaw0=0, free_pos=False, pos_r=3.0, hb=(1.2, 2.2)):
    """fit yaw/pitch/roll with camera position fixed (or loosely free within pos_r)"""
    P = [np.array(p) for p, _ in pairs]; U = [np.array(u, float) for _, u in pairs]
    def res(q):
        if free_pos: x_, y_, h_, yaw, pitch, roll = q
        else: (yaw, pitch, roll), x_, y_, h_ = q, X, Y, h
        z = R.roofZ(min(max(x_, -0.5), 96.4)) + h_
        return np.concatenate([proj(p, W, H, F, x_, y_, z, yaw, pitch, roll) - u for p, u in zip(P, U)])
    if free_pos:
        lo = [X - pos_r, Y - pos_r, hb[0], yaw0 - 60, -30, -8]; hi = [X + pos_r, Y + pos_r, hb[1], yaw0 + 60, 20, 8]; x0 = [X, Y, h, yaw0, -5, 0]
    else:
        lo = [yaw0 - 60, -30, -8]; hi = [yaw0 + 60, 20, 8]; x0 = [yaw0, -5, 0]
    s = least_squares(res, x0, bounds=(lo, hi), loss='soft_l1', f_scale=8)
    rr = res(s.x).reshape(-1, 2); return s.x, np.hypot(rr[:, 0], rr[:, 1])
