# План даху: щити, лінії до контейнерів, спуски, лотки (рекомендований варіант)
import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from ep_opt import graph, dijk, path, DE, DN, LAN, YS, Y1, Y2, YN, XS_
F = json.load(open('final.json')); D = json.load(open('data.json'))
plt.rcParams['font.family'] = 'DejaVu Sans'
fig, ax = plt.subplots(figsize=(11.2, 9.6), dpi=170)
ax.add_patch(Rectangle((-0.15, -0.5), 96.79, 97.09, fc='#f3f4f2', ec='#555', lw=1.0))
for x in (18, 36, 54, 72): ax.plot([x, x], [-0.5, 96.59], color='#c9ccc8', lw=0.6, ls=':')
R = D['roof']
ax.scatter([(m[0] + m[1]) / 2 for m in R], [m[2] for m in R], s=1.2, c='#9fb4c8', marker='s', lw=0)
for _, xc, y0, y1, hw in LAN: ax.add_patch(Rectangle((xc - 1.83, y0), 3.66, y1 - y0, fc='#e6dcc3', ec='#a08b55', lw=0.8))
for y in (YS, Y1, Y2, YN): ax.plot([0.8, 95.75], [y, y], color='#cfd8cf', lw=4, alpha=0.5, solid_capstyle='butt')
for x in XS_: ax.plot([x, x], [YS, YN], color='#cfd8cf', lw=4 if x not in (18.0, 72.0) else 2, alpha=0.5)
COL = {'K-1': '#c0392b', 'K-3': '#e67e22', 'K-4': '#7b5bd6', 'K-5': '#1aa3b4'}
for r in F['rows']:
    if r['z'] not in ('roof', 'lan'): continue
    s = (r['X'], r['Y']); adj = graph([s]); dist, prev = dijk(adj, s); p = path(prev, s, DE if r.get('side', 'N') == 'E' else DN)
    ax.plot([q[0] for q in p], [q[1] for q in p], color=COL[r['K']], lw=0.9, alpha=0.55)
    ax.scatter([s[0]], [s[1]], s=18 + 7 * r['ns'], c=COL[r['K']], marker='s' if r['z'] == 'roof' else 'D', edgecolors='white', lw=0.6, zorder=5)
ax.add_patch(Rectangle((-0.5, 96.6), 20, 10.5, fc='#d9b26f', ec='#8a6a3a', lw=0.8)); ax.text(9.5, 101.8, 'ТП-6923', ha='center', fontsize=7)
ax.add_patch(Rectangle((-0.5, 107.1), 20, 1.8, fc='#7d8285', ec='none')); ax.add_patch(Rectangle((-0.5, 109.2), 34.5, 8, fc='#cfe0b8', ec='none'))
for x0, k in ((1.2, 'K-4'), (9.0, 'K-5')): ax.add_patch(Rectangle((x0, 110.4), 6.058, 2.438, fc=COL[k], ec='k', lw=0.6)); ax.text(x0 + 3, 111.6, k, ha='center', va='center', fontsize=7, color='white')
ax.add_patch(Rectangle((96.64, -0.4), 6.36, 35, fc='#d9b26f', ec='#8a6a3a', lw=0.8)); ax.text(99.8, 17, 'ТП-5913', rotation=90, ha='center', va='center', fontsize=7)
for k in D['bess']:
    if k['id'] == 'K-2': continue
    b = k['box']; ax.add_patch(Rectangle((b[0], b[2]), b[1] - b[0], b[3] - b[2], fc=COL[k['id']], ec='k', lw=0.6)); ax.text((b[0] + b[1]) / 2, (b[2] + b[3]) / 2, k['id'], ha='center', va='center', fontsize=7, color='white')
for d, t in ((DE, 'спуск Сх'), (DN, 'спуск ПнЗх')): ax.plot(*d, marker='v', color='k', ms=7); ax.text(d[0] + 1.2, d[1] + 1.2, t, fontsize=7)
ax.set_xlim(-3, 108); ax.set_ylim(-3, 118); ax.set_aspect('equal'); ax.set_xlabel('X, м (≈ схід)'); ax.set_ylabel('Y, м (≈ північ)')
from matplotlib.lines import Line2D
h = [Line2D([], [], color=c, marker='s', lw=1, label=f'{k}: {F["inp"].get(k, 0)} входів, {F["kwp"].get(k, 0):.0f} кВтп') for k, c in COL.items()]
h += [Line2D([], [], color='#666', marker='D', lw=0, label='щит ліхтаря (етап 1)'), Line2D([], [], color='#666', marker='s', lw=0, label='щит даху (етап 2), розмір — стрінгів')]
ax.legend(handles=h, loc='upper right', fontsize=7, framealpha=0.9)
ax.set_title('Дах цеху: щити PV 7/1, траси ліній Al до контейнерів (рекомендований розподіл)', fontsize=10)
plt.tight_layout(); plt.savefig('plan.png'); print('ok')
