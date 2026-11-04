import math, numpy as np, sys, itertools
from scipy.optimize import least_squares
sys.path.insert(0,'.')
import roofobj as R
D = {o['n']: o for o in R.DEFL}
def bearing(u, W=1200, F=23, H=1600):
    fpx = F*math.hypot(W,H)/43.27; return math.degrees(math.atan((u-W/2)/fpx))
def resect(obs, F=23, x0=(93,24,0)):
    """obs: list of (u, n) — pixel u and pipe number; solve camera X,Y,yaw from bearings"""
    def res(q):
        X,Y,yaw=q; r=[]
        for u,n in obs:
            o=D[n]; az=math.degrees(math.atan2(o['x']-X,o['y']-Y)); d=((az-yaw-bearing(u,F=F))+180)%360-180; r.append(d)
        return r
    s=least_squares(res,x0); return s.x, np.array(res(s.x))
def predict(X,Y,yaw,F=23,W=1200,H=1600,maxd=80):
    fpx=F*math.hypot(W,H)/43.27; out=[]
    for o in R.DEFL:
        az=math.degrees(math.atan2(o['x']-X,o['y']-Y)); d=math.hypot(o['x']-X,o['y']-Y); dl=((az-yaw)+180)%360-180
        if abs(dl)<math.degrees(math.atan(W/2/fpx)) and d<maxd: out.append((o['n'],o['st'][:5],round(W/2+fpx*math.tan(math.radians(dl))),round(d,1)))
    return sorted(out,key=lambda t:t[2])
