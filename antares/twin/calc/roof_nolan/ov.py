# -*- coding: utf-8 -*-
"""Накладання моделі даху (ліхтарі як були, рама кондиціонерів, парапети, дефлектори Д1–Д62) на фото обстеження.
ov(photo, X, Y, yaw, pitch=-4, F=23, h=1.5, out=..., scale=0.5) → PNG: фото + контури моделі, підписані дефлектори."""
import json, math, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
W_ = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, W_)
import roofobj as R
FD = '/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/artifact-files/9faf1b11-04e1-4470-acaf-f54d7b58cfce/foto/'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
FONTs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
COL = {'є': (40, 230, 90), 'уточнити': (255, 170, 0), 'немає': (255, 60, 60), 'під': (255, 60, 220)}
def dcol(o):
    st = o['st']
    return COL['є'] if st == 'є' else COL['уточнити'] if st == 'уточнити' else COL['під'] if st.startswith('під') else COL['немає']
def cam(X, Y, yaw, pitch, h):
    ps, th = math.radians(yaw), math.radians(pitch)
    f = np.array([math.sin(ps) * math.cos(th), math.cos(ps) * math.cos(th), math.sin(th)])
    r = np.array([math.cos(ps), -math.sin(ps), 0.0])
    u = np.array([-math.sin(ps) * math.sin(th), -math.cos(ps) * math.sin(th), math.cos(th)])
    C = np.array([X, Y, R.roofZ(min(max(X, -0.5), 96.4)) + h])
    return C, f, r, u
def ov(name, X, Y, yaw, pitch=-4.0, F=23, h=1.5, scale=0.5, out=None, label='', show=('defl', 'lan', 'ac', 'par', 'west', 'portal', 'drain'), only=None, maxd=32, roll=0.0, vis=True, band=None):
    fn = FD + name + '.jpg'; im = Image.open(fn).convert('RGB'); Wf, Hf = im.size
    fpx = F * math.hypot(Wf, Hf) / 43.27
    C, f, r, u = cam(X, Y, yaw, pitch, h)
    if roll:
        ro = math.radians(roll); r, u = r * math.cos(ro) + u * math.sin(ro), -r * math.sin(ro) + u * math.cos(ro)
    if vis:
        import vis as V_
    im = im.resize((int(Wf * scale), int(Hf * scale)))
    ov_ = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov_)
    def P(p):
        v = np.asarray(p, float) - C; z = v @ f
        if z < 0.4: return None
        return ((Wf / 2 + fpx * (v @ r) / z) * scale, (Hf / 2 - fpx * (v @ u) / z) * scale, z)
    def line(pts, col, w=2):
        prev = None
        for p in pts:
            q = P(p)
            if q and prev: d.line([prev[:2], q[:2]], fill=col, width=w)
            prev = q
    def seg(a, b, col, w=2, n=30):
        line([np.array(a) + (np.array(b) - np.array(a)) * t for t in np.linspace(0, 1, n)], col, w)
    # горизонт
    hz = [P(C + np.array([math.sin(math.radians(a)), math.cos(math.radians(a)), 0]) * 500) for a in np.linspace(yaw - 60, yaw + 60, 50)]
    hz = [q for q in hz if q]
    if len(hz) > 1: d.line([q[:2] for q in hz], fill=(255, 255, 255, 110), width=1)
    if 'par' in show:
        xs = np.linspace(R.XW, R.XE_in, 200)
        line([(x, -0.375, R.roofZ(x) + 1.37) for x in xs], (0, 200, 255, 220)); line([(x, 96.465, R.roofZ(x) + 1.37) for x in xs], (0, 200, 255, 220))
        seg((96.65, -0.5, 16.56), (96.65, 96.6, 16.56), (0, 200, 255, 220), n=200)
    if 'west' in show:
        seg((-0.58, -0.5, 22.7), (-0.58, 96.6, 22.7), (255, 255, 0, 200), n=200); seg((-0.58, -0.5, 15.9), (-0.58, 96.6, 15.9), (255, 255, 0, 120), n=200)
    if 'lan' in show:
        for F_ in R.FRAMES:
            xc, y0, y1 = F_['xc'], F_['y0'], F_['y1']; zb = F_['zb']; zr = zb + 1.89; hw = 1.83
            for yy in (y0, y1):
                line([(xc - hw, yy, zb), (xc, yy, zr), (xc + hw, yy, zb)], (255, 140, 0, 230))
            seg((xc, y0, zr), (xc, y1, zr), (255, 140, 0, 230), n=120)
            seg((xc - hw, y0, zb), (xc - hw, y1, zb), (255, 140, 0, 150), n=120); seg((xc + hw, y0, zb), (xc + hw, y1, zb), (255, 140, 0, 150), n=120)
    if 'ac' in show:
        A = R.AC; z0 = max(R.roofZ(A['x0']), R.roofZ(A['x1'])); z1 = z0 + A['h']
        for zz in (z0, z1):
            line([(A['x0'], A['y0'], zz), (A['x1'], A['y0'], zz), (A['x1'], A['y1'], zz), (A['x0'], A['y1'], zz), (A['x0'], A['y0'], zz)], (255, 0, 255, 230))
        for x, y in ((A['x0'], A['y0']), (A['x1'], A['y0']), (A['x1'], A['y1']), (A['x0'], A['y1'])): seg((x, y, z0), (x, y, z1), (255, 0, 255, 230), n=5)
    if 'portal' in show:
        for x, y in R.PORTAL_POSTS: seg((x, y, R.roofZ(59.3)), (x, y, R.roofZ(59.3) + 3.4), (200, 200, 200, 230), n=5)
    if 'drain' in show:
        for dr in R.DRAINS:
            q = P((dr['x'], dr['y'], dr['z']))
            if q and 0 <= q[0] < im.size[0] and 0 <= q[1] < im.size[1]: d.ellipse([q[0] - 4, q[1] - 2, q[0] + 4, q[1] + 2], outline=(80, 160, 255, 255), width=2)
    vis_ = []
    if 'defl' in show:
        for o in R.DEFL:
            if only and o['n'] not in only: continue
            z0 = R.roofZ(o['x']); rr = o['d'] / 2; col = dcol(o) + (235,)
            seen = (not vis) or V_.los(C, (o['x'], o['y'], z0 + o['h']))
            if not seen: col = (150, 150, 150, 150)
            qb = P((o['x'], o['y'], z0)); qt = P((o['x'], o['y'], z0 + o['h']))
            if not qb or not qt: continue
            if qb[2] > maxd: continue
            if not (-50 < qb[0] < im.size[0] + 50 and -50 < qt[1] < im.size[1] + 50): continue
            ring = [P((o['x'] + rr * math.cos(a), o['y'] + rr * math.sin(a), z0 + o['h'])) for a in np.linspace(0, 2 * math.pi, 25)]
            ring = [q[:2] for q in ring if q]
            if len(ring) > 2: d.line(ring, fill=col, width=1)
            for s_ in (-1, 1):
                a_ = P((o['x'] + s_ * rr * r[0], o['y'] + s_ * rr * r[1], z0)); b_ = P((o['x'] + s_ * rr * r[0], o['y'] + s_ * rr * r[1], z0 + o['h']))
                if a_ and b_: d.line([a_[:2], b_[:2]], fill=col, width=1)
            t = f"{o['n']}" + ('' if seen else 'з'); tx, ty = qt[0] - 6, qt[1] - 30 - 12 * (o['n'] % 3)
            d.line([(qt[0], qt[1] - 2), (qt[0], ty + 13)], fill=col, width=1)
            d.text((tx, ty), t, fill=col, font=FONT)
            vis_.append((o['n'], round(qb[2], 1), int(qt[0] / scale), int(qt[1] / scale), int(qb[1] / scale), seen))
    im = Image.alpha_composite(im.convert('RGBA'), ov_).convert('RGB')
    if band: im = im.crop((0, int(band[0] * scale), im.size[0], int(band[1] * scale)))
    dd = ImageDraw.Draw(im); dd.rectangle([0, 0, im.size[0], 20], fill=(0, 0, 0)); dd.text((4, 2), f'{name}  X{X} Y{Y} yaw{yaw} pitch{pitch} F{F} {label}', fill=(255, 255, 255), font=FONTs)
    out = out or W_ + 'ph/ov_' + name + '.jpg'; im.save(out, quality=88)
    return out, sorted(vis_, key=lambda v: v[1])
if __name__ == '__main__':
    a = sys.argv[1:]
    o, v = ov(a[0], float(a[1]), float(a[2]), float(a[3]), float(a[4]) if len(a) > 4 else -4, float(a[5]) if len(a) > 5 else 23)
    print(o); print(v)
