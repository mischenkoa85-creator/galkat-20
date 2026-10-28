# visibility of pipes from a photo camera: DSM as at photo time (lanterns 3,66 x 1,89, AC frame, parapets, west building), no deflectors
import os, sys, math, json, numpy as np
os.environ['NODEFL'] = '1'
W_ = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.argv = ['x']
_ns = {}
exec(open(W_ + 'v3/roof_v3.py', encoding='utf-8').read().split("if __name__ == '__main__':")[0], _ns)
Hat = _ns['Hat']; roofZ = _ns['roofZ']
sys.path.insert(0, W_)
import roofobj as R
def los(C, P, clear=0.05):
    """True if straight line C->P is above DSM (except the last 0.6 m near target)."""
    C = np.asarray(C, float); P = np.asarray(P, float); L = np.linalg.norm(P[:2] - C[:2])
    if L < 0.8: return True
    n = int(L / 0.2); t = np.linspace(0, 1, n)[1:]
    pts = C[None, :] + (P - C)[None, :] * t[:, None]
    keep = np.linalg.norm(pts[:, :2] - P[None, :2], axis=1) > 0.9
    keep &= np.linalg.norm(pts[:, :2] - C[None, :2], axis=1) > 0.6
    hz = Hat(pts[keep, 0], pts[keep, 1])
    return bool(np.all(pts[keep, 2] > hz + clear))
def pipe_vis(C, o):
    z0 = float(roofZ(o['x'])); top = (o['x'], o['y'], z0 + o['h']); mid = (o['x'], o['y'], z0 + o['h'] * 0.6)
    return 'top' if los(C, top) else 'none' if not los(C, (o['x'], o['y'], z0 + o['h'] - 0.05 + 0.3)) else 'top'
