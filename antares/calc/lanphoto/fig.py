# -*- coding: utf-8 -*-
import sys, json, math, numpy as np, cv2
sys.path.insert(0, '/home/claude/work/lanphoto'); from pv import *
from PIL import Image, ImageDraw, ImageFont
f = 23 / 43.27 * 2500
G = {'112242': dict(va=(1000.4, 820.7), gW=[6, 80, 34, 71, 28, 22, 21, 39, 122, 8, 16, 35, 45], gE=[12, 15, 19, 25, 3], rW=[32, 54, 59, 61, 1, 37, 83, 60], rE=[89, 73, 85, 48, 56, 63, 49, 36],
                       pW=(1050, 1051), pE=(1251, 946)),
     '112246': dict(va=(553.5, 802.2), gW=[16, 20, 44, 6, 37, 26, 49, 87, 34, 29, 19], gE=[41, 15, 17, 12, 24, 42, 35, 3, 81, 70, 93, 39], rW=[64, 65, 56, 58], rE=[59, 48, 60, 61, 89, 10, 51, 40, 67, 54, 83],
                       pW=(374, 871), pE=(397, 997)),
     '112235': dict(va=(299.7, 798.7), gW=[37, 94, 55, 68, 75, 80, 65, 72, 59], gE=[39, 60, 77, 52, 49, 38, 30, 46, 57, 98, 25, 66, 44], rW=[22, 71, 81, 88, 28, 93, 21, 48, 73], rE=[96, 15, 53, 36, 41, 95, 67, 100, 23, 74, 78, 64, 2, 5],
                       pW=(368, 930), pE=(578, 988)),
     '112237': dict(va=(392.9, 912.4), gW=[34, 70, 91, 79, 73, 47, 46, 64, 57, 60], gE=[33, 51, 61, 31, 77, 96, 36, 38, 50, 32, 66], rW=[17, 69, 82, 22, 40, 63, 15, 93], rE=[92, 85, 11, 59, 14, 23, 74, 1, 4],
                       pW=(424, 976), pE=(626, 950))}
def measure(n, f=f):
    g = G[n]; out, et, ev, da = inplane(n, g['va'], f); P = {o[0]: (o[1], o[2]) for o in out}
    wm = lambda ids: sum(P[i][0] * P[i][1] for i in ids if i in P) / sum(P[i][1] for i in ids if i in P)
    sd = lambda ids, m: math.sqrt(sum((P[i][0] - m) ** 2 * P[i][1] for i in ids if i in P) / sum(P[i][1] for i in ids if i in P))
    gw, ge, rw, re_ = wm(g['gW']), wm(g['gE']), wm(g['rW']), wm(g['rE']); vb = (gw + ge) / 2
    return dict(glass=90 - (ge - gw) / 2,   # кут скла від горизонталі (бісектриса двох схилів — вертикаль); 28.10: раніше помилково брав кут від вертикалі
                 vb=vb, rW=rw - (vb - 90), rE=(vb + 90) - re_, sW=sd(g['rW'], rw), sE=sd(g['rE'], re_), nW=len(g['rW']), nE=len(g['rE'])), et, ev, da
RES = {}
for n in G:
    r, et, ev, da = measure(n); RES[n] = r
    rr = [measure(n, ff)[0] for ff in (1150, 1550)]
    r['f_rng'] = [round(min(x['rW'] + x['rE'] for x in rr + [r]) / 2, 1), round(max(x['rW'] + x['rE'] for x in rr + [r]) / 2, 1)]
    print(n, {k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()})
json.dump(RES, open('/home/claude/work/lanphoto/angles.json', 'w'), indent=1)
# ---------- рисунки: виміряні кутники + як виглядали б 12° і 17°
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
FONTs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
def clipline(p, q):
    # продовжити від p у напрямку q до краю 1500×2000
    d = np.array(q, float) - np.array(p, float); d /= np.linalg.norm(d); t = 1e9
    for k, lim in ((0, 0), (0, W - 1), (1, 0), (1, H - 1)):
        if abs(d[k]) > 1e-9:
            tt = (lim - p[k]) / d[k]
            if tt > 0: t = min(t, tt)
    return (p[0] + d[0] * t, p[1] + d[1] * t)
for n in ('112246', '112242'):
    g = G[n]; r, et, ev, da = measure(n); Kf = K(f); S = segs(n)
    im = Image.open(D + f'f_{n}.jpg').convert('RGB'); dr = ImageDraw.Draw(im, 'RGBA')
    for i in g['rW'] + g['rE']:
        s = S[i]; dr.line([(s[0], s[1]), (s[2], s[3])], fill=(255, 220, 0, 255), width=7)
    vb = math.radians(r['vb'])
    def dirimg(p, beta, east):
        phi = (r['vb'] + 90 - beta) if east else (r['vb'] - 90 + beta)   # східний кутник піднімається на захід (до гребеня), західний — на схід
        ph = math.radians(phi); d = math.cos(ph) * et + math.sin(ph) * ev
        v = Kf @ d; q = (v[0] / v[2], v[1] / v[2]) if abs(v[2]) > 1e-6 else (p[0] + v[0] * 1e4, p[1] + v[1] * 1e4)
        # потрібна гілка: «униз від гребеня» до свого боку
        cand = [q, (2 * p[0] - q[0], 2 * p[1] - q[1])]
        pick = max(cand, key=lambda c: (c[0] - p[0]) * (1 if east else -1))
        return clipline(p, pick)
    for beta, col, lab in ((12, (0, 200, 255, 255), '12°'), (17, (255, 60, 60, 255), '17°'), (22, (255, 0, 200, 220), '22°')):
        for east, p in ((True, g['pE']), (False, g['pW'])):
            e = dirimg(p, beta, east); dr.line([p, e], fill=col, width=4)
            t = 0.55; x, y = p[0] + (e[0] - p[0]) * t, p[1] + (e[1] - p[1]) * t
            dr.text((x, y - 34), lab, fill=col, font=FONT, stroke_width=3, stroke_fill=(0, 0, 0))
    va = g['va']; dr.ellipse([va[0] - 12, va[1] - 12, va[0] + 12, va[1] + 12], outline=(0, 255, 0, 255), width=5)
    dr.rectangle([0, 0, 1500, 120], fill=(0, 0, 0, 150))
    dr.text((20, 12), f'Фото {n}: жовті — сталеві кутники каркаса (знайдено автоматично)', fill=(255, 220, 0), font=FONTs)
    dr.text((20, 44), f'виміряно: захід {r["rW"]:.1f}°, схід {r["rE"]:.1f}°; скло ліхтаря {r["glass"]:.1f}°', fill=(255, 255, 255), font=FONTs)
    dr.text((20, 76), 'лінії: блакитна — 12°, червона — 17°, рожева — 22° (з тієї самої точки, у перспективі фото)', fill=(255, 255, 255), font=FONTs)
    im.resize((900, 1200), Image.LANCZOS).save(f'/home/claude/work/lanphoto/ovl_{n}.jpg', quality=90)
    box = (0, 560, 1500, 1330) if n == '112246' else (0, 620, 1500, 1390)
    im.crop(box).save(f'/home/claude/work/lanphoto/crop_{n}.jpg', quality=90)
