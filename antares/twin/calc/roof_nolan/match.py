import math, numpy as np, sys, itertools
sys.path.insert(0,'.')
import roofobj as R
from scipy.optimize import linear_sum_assignment, least_squares
def cam(X,Y,h,yaw,pitch,roll=0.0):
    ps,th,ro=map(math.radians,(yaw,pitch,roll))
    f=np.array([math.sin(ps)*math.cos(th),math.cos(ps)*math.cos(th),math.sin(th)]); r=np.array([math.cos(ps),-math.sin(ps),0.0]); u=np.cross(r,f)
    r2=r*math.cos(ro)+u*math.sin(ro); u2=-r*math.sin(ro)+u*math.cos(ro)
    return np.array([X,Y,R.roofZ(min(max(X,-0.5),96.4))+h]),f,r2,u2
def P(pts,C,f,r,u,fpx,W=1200,H=1600):
    v=np.asarray(pts,float)-C; z=v@f; return np.stack([W/2+fpx*(v@r)/z, H/2-fpx*(v@u)/z, z],1)
DX=np.array([[o['x'],o['y'],R.roofZ(o['x'])] for o in R.DEFL]); DH=np.array([o['h'] for o in R.DEFL]); DN=[o['n'] for o in R.DEFL]
def score(q,obs,lines=(),F=23,W=1200,H=1600,wv=1.0,miss=60.0):
    X,Y,h,yaw,pitch,roll=q; C,f,r,u=cam(X,Y,h,yaw,pitch,roll); fpx=F*math.hypot(W,H)/43.27
    B=P(DX,C,f,r,u,fpx); ok=B[:,2]>1
    cost=np.full((len(obs),len(DX)),1e4)
    for i,(uo,vo) in enumerate(obs):
        d=np.hypot(B[:,0]-uo,(B[:,1]-vo)*wv); d[~ok]=1e4; cost[i]=np.minimum(d,1e4)
    ri,ci=linear_sum_assignment(cost); m=[(i,DN[j],cost[i,j]) for i,j in zip(ri,ci)]
    c=sum(min(x[2],miss) for x in m)
    for (A,Bp),pts in lines:
        a,b=P(np.array([A,Bp]),C,f,r,u,fpx)[:,:2]; d=b-a; n=np.array([-d[1],d[0]])/np.linalg.norm(d)
        c+=sum(abs(float((np.array(p)-a)@n)) for p in pts)
    return c,m
