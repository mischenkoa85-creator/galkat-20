# -*- coding: utf-8 -*-
"""Стрінги всіх груп → щити PV → контейнери: дані для однакового показу в 3D-двійнику (04.11.2026).
Дах В1 — стрінги D['roof'][4], щити — rb_merged.json (рядки final.json); ліхтарі — D['frame'][5], щит — ліхтар; фасади — мітки стрінгів, щити — групування ep_opt.
Склад і АБК двійник бере зі своїх даних (EPD, модель АБК). → ../../obj/src/elecstrdata.js (const ELECSTR)."""
import json, os, collections, math
os.environ.setdefault('MERGED', '1')
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
import ep_opt as E
D = E.D; F = json.load(open('final.json')); s4 = open('../../obj/src/elec04data.js', encoding='utf-8').read(); E4 = json.loads(s4[s4.find('{'):s4.rfind('}') + 1])
B4 = E4['boxes']
# ---- дах: RB (порядок = рядки final з z == 'roof') → id щита з elec04data за координатами
rb = E.RB; froof = [r for r in F['rows'] if r['z'] == 'roof']; b4roof = [b for b in B4 if b['z'] == 'roof']
def near(b, L): return min(L, key=lambda q: (q['X'] - b['X']) ** 2 + (q['Y'] - b['Y']) ** 2)
roof_box = {}
for g, r in zip(rb, froof):
    q = near(g, b4roof)
    for k in g['strings']: roof_box[k] = (q['id'], q['K'])
ss = collections.defaultdict(list)
for m in D['roof']:
    if m[4] >= 0: ss[m[4]].append([round((m[0] + m[1]) / 2, 3), round(m[2], 3)])
roof = [dict(id=f'Д-{k + 1:03d}', box=roof_box[k][0], K=roof_box[k][1], m=v) for k, v in sorted(ss.items()) if k in roof_box]
lost = [k for k in ss if k not in roof_box]
# ---- ліхтарі: стрінг (ліхтар, індекс) → щит ЩЛ-ліхтар
b4lan = {b['id']: b for b in B4 if b['z'] == 'lan'}
ls = collections.defaultdict(list)
for m in D['frame']:
    if m[5] >= 0: ls[(m[0], m[5])].append([m[1], round((m[2] + m[3]) / 2, 3)])
lan = []
for (fr, k), v in sorted(ls.items()):
    bid = f'ЩЛ-{fr}'; b = b4lan.get(bid)
    lan.append(dict(id=f'Л{fr}-{k + 1:02d}', box=bid, K=b['K'] if b else None, fr=fr, m=v))
lit_lan = sum(1 for m in D['frame'] if m[5] < 0)
# ---- фасади: мітка стрінга → щит (групування як у ep_opt: за фасадом, по 7, рівно)
b4fac = [b for b in B4 if b['z'] == 'fac']; fac = {}; i = 0
for f, lst_ in E.fac_groups.items():
    lst_ = sorted(lst_); n = len(lst_); nb = math.ceil(n / 7); per = math.ceil(n / nb)
    for j in range(nb):
        g = lst_[j * per:(j + 1) * per]
        if not g: continue
        b = b4fac[i]; i += 1
        for t in g: fac[t[1]] = dict(box=b['id'], K=b['K'], f=f)
OUT = dict(roof=roof, lan=lan, fac=fac, boxes={b['id']: dict(K=b['K'], ns=b['ns'], z=b['z'], st=b['st']) for b in B4},
           n=dict(roof=len(roof), lan=len(lan), fac=len(fac), lit_lan=lit_lan, roof_lost=len(lost)))
open('../../obj/src/elecstrdata.js', 'w', encoding='utf-8').write('const ELECSTR=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';')
cnt = collections.Counter(s['box'] for s in roof); print('дах: стрінгів', len(roof), 'щитів', len(cnt), 'без щита', lost)
print('ліхтарі:', len(lan), collections.Counter(s['box'] for s in lan), 'на освітлення', lit_lan)
print('фасади:', len(fac), collections.Counter(v['box'] for v in fac.values()))
print('перевірка ns щитів даху:', sum(1 for b in b4roof if cnt[b['id']] != b['ns']), 'розбіжностей')
