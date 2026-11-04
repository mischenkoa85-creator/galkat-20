# -*- coding: utf-8 -*-
"""Звіт: ліхтарі розібрати, модулі вертикально на каркасі ≈13°, розкладка зручна для монтажу → рисунки + PDF."""
import json, math, base64, asyncio, numpy as np, sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon
V = '/home/claude/work/sun/v3/'
R = json.load(open(V + 'lan13_mount.json')); J22 = json.load(open(V + 'lan22_sum.json')); J13 = json.load(open(V + 'lan22_t13.json'))['modes']
s = open('/home/claude/work/twin/roofv2data.js', encoding='utf-8').read(); R2 = json.loads(s[s.find('{'):s.rfind('}') + 1]); K46 = R2['C']['flush']['K']; FACV = R2['fac']['tot']['all']
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.2})
INK, MUT, BL = '#1d2a33', '#5b6770', '#2a5db0'
LM, DM = 2.384, 1.303; t = math.radians(R['tilt']); ct, st_ = math.cos(t), math.sin(t)
MODS = R['mods']; used = set(R['used']); F = J13['V1']['F']
VAL = 7.00 / 1.2 / 44.89 * 0.975; COST = 250.0
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
# ---------- 1. план ліхтарів зі стрінгами
pal = ['#2a5db0', '#e8892a', '#2e8b57', '#b0306a', '#7b5bd6', '#0f8b8d', '#c8691c']
sid = {}
for s_ in R['strings']:
    for k in s_['ids']: sid[k] = s_
fig, ax = plt.subplots(figsize=(7.6, 6.2), dpi=220)
ax.add_patch(Rectangle((0, 18), 76, 64, color='#f3f5f7', zorder=0))
for c in J13['V1']['roof']['C']:
    if 0 <= c['xa'] <= 76 and 18 <= c['y'] <= 82: ax.add_patch(Rectangle((c['xa'], c['y'] - 1.192), c['xb'] - c['xa'], 2.384, color='#dfe3e7', lw=0))
for f in F: ax.add_patch(Rectangle((f['xc'] - 1.83, f['y0']), 3.66, f['y1'] - f['y0'], fill=False, ec='#8a6f4d', lw=0.5, ls='--'))
for k, m in enumerate(MODS):
    x0 = m['x'] - LM * ct / 2; w = LM * ct
    if k in used:
        s_ = sid[k]; j = int(s_['id'].split('-')[1]) - 1; col = pal[j % len(pal)]
        ax.add_patch(Rectangle((x0, m['y']), w, m['y1'] - m['y'], color=col, ec='white', lw=0.2, alpha=0.95 if '+' not in s_['side'] else 0.6))
    else:
        ax.add_patch(Rectangle((x0, m['y']), w, m['y1'] - m['y'], fill=False, ec='#9aa3a8', lw=0.4, hatch='////'))
for s_ in R['strings']:
    ids = s_['ids']; ys = [MODS[k]['y'] for k in ids]; xs = [MODS[k]['x'] for k in ids]
    if '+' in s_['side']:
        ax.text(F[s_['l'] - 1]['xc'], (min(ys) + max(ys)) / 2 + 0.6, s_['id'], ha='center', va='center', fontsize=5.2, color=INK, weight='bold', rotation=90)
    else:
        ax.text(np.mean(xs) + (2.1 if MODS[ids[0]]['side'] == 'E' else -2.1), (min(ys) + max(ys) + DM) / 2, s_['id'], ha='center', va='center', fontsize=5.2, color=INK, rotation=90)
for l, f in enumerate(F, 1): ax.text(f['xc'], f['y1'] + 1.2, f'Ліхтар {l}', ha='center', fontsize=6.5, weight='bold', color=INK)
ax.annotate('', xy=(73, 78), xytext=(73, 72), arrowprops=dict(arrowstyle='->', lw=0.8)); ax.text(73, 78.6, 'Пн', ha='center', fontsize=6.5)
ax.set_xlim(0, 76); ax.set_ylim(18, 82); ax.set_aspect('equal'); ax.tick_params(labelsize=5.5)
ax.set_title(f"Модулі на ліхтарях вертикально: {R['n']} шт. = {R['st']} стрінги × 11, {nf(R['mwh'], 1)} МВт·год/рік", fontsize=8, loc='left', weight='bold', color=INK)
fig.text(0.07, 0.035, 'Колір — номер стрінга в ліхтарі (Л2-3 — ліхтар 2, стрінг 3); блідіші — спільний стрінг схід + захід біля торця; заштриховані — порожні місця. '
         'Пунктир — нинішні ліхтарі 3,66 м; сірі — модулі даху (варіант А). Схід — праворуч від гребеня.', fontsize=5.6, color=MUT, wrap=True)
fig.savefig(V + 'lan13_plan.png', bbox_inches='tight'); plt.close(fig)
# ---------- 2. розріз: каркас ≈13°, рейки, модулі
fig, ax = plt.subplots(figsize=(7.6, 3.1), dpi=220)
ze = 0.30; zr = ze + R['half'] * math.tan(t); hfr = 1.55; zfr = lambda x: zr - 0.16 - abs(x) * math.tan(t)
xs = np.linspace(-3.0, 3.3, 50); ax.fill_between(xs, -0.2, 0, color='#d9dde1'); ax.plot(xs, 0 * xs, color=INK, lw=0.8)
ax.add_patch(Polygon([(-1.83, 0), (0, 1.89), (1.83, 0)], closed=True, fill=False, ec='#5a8fa8', lw=0.7, ls='--'))
ax.annotate('нинішній ліхтар 3,66 × 1,89 — розібрати скління', xy=(0.55, 1.32), xytext=(0.9, 2.05), fontsize=5.8, color='#1f5f78', arrowprops=dict(arrowstyle='-', lw=0.5, color='#1f5f78'))
ax.plot([-hfr, 0, hfr], [zfr(-hfr), zfr(0), zfr(hfr)], color='#8a3b1e', lw=2.2)
ax.plot([-hfr - 0.05, 0, hfr + 0.05], [zfr(-hfr) + 0.06, zfr(0) + 0.06, zfr(hfr) + 0.06], color='#c9a76a', lw=1.6)
ax.plot([-hfr, hfr], [zfr(hfr) - 0.14, zfr(hfr) - 0.14], color='#9aa3a8', lw=0.8, ls=':')
for sg in (1, -1):
    u0, u1 = 0.02, 0.02 + LM
    p0 = (sg * u0 * ct, zr - u0 * st_); p1 = (sg * u1 * ct, zr - u1 * st_)
    ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color=BL, lw=3.4, solid_capstyle='butt')
    for u in (0.02 + R['clamp'], 0.02 + LM - R['clamp']):
        x = sg * u * ct; z = zr - u * st_ - 0.06
        ax.add_patch(Rectangle((x - 0.045, z - 0.05), 0.09, 0.05, color='#3b3f44'))
        zf = zfr(min(abs(x), hfr)) + 0.06; ax.plot([x, x], [zf, z - 0.05], color='#3b3f44', lw=0.9)
        if abs(x) > hfr: ax.plot([sg * hfr, x], [zfr(hfr) + 0.06, zf], color='#3b3f44', lw=1.4)
ax.annotate(f"модуль 2 384 мм вгору по схилу; притиски\nна {int(R['clamp'] * 1000)} мм від торців (ZNSHINE: 477–596)", xy=(1.3, zr - 1.3 / ct * st_ + 0.02), xytext=(1.75, 1.45), fontsize=5.8, color=BL, arrowprops=dict(arrowstyle='-', lw=0.5, color=BL))
ax.annotate('рейки вздовж ліхтаря (2 на схил)\nна кронштейнах до поперечних балок', xy=(-R['rail_lo'], zr - (0.02 + LM - R['clamp']) * st_ - 0.1), xytext=(-3.0, 1.55), fontsize=5.8, color='#3b3f44', arrowprops=dict(arrowstyle='-', lw=0.5, color='#3b3f44'))
ax.annotate('нова покрівля прорізу (у КМ)', xy=(-0.9, zfr(-0.9) + 0.07), xytext=(-3.0, 1.15), fontsize=5.8, color='#8a6f4d', arrowprops=dict(arrowstyle='-', lw=0.5, color='#8a6f4d'))
ax.annotate('наявний каркас ≈13° (за фото),\nпроліт ≈3,1 м — виміряти', xy=(-0.5, zfr(-0.5)), xytext=(-3.0, 0.62), fontsize=5.8, color='#8a3b1e', arrowprops=dict(arrowstyle='-', lw=0.5, color='#8a3b1e'))
ax.annotate('сітка (лишається)', xy=(-1.2, zfr(hfr) - 0.14), xytext=(-3.0, 0.2), fontsize=5.6, color=MUT, arrowprops=dict(arrowstyle='-', lw=0.4, color=MUT))
for x, lbl in zip([R['rail_up'], R['rail_lo'], R['edge']], ('рейка 1', 'рейка 2', 'низ модуля')):
    ax.plot([x, x], [-0.16, -0.04], color=MUT, lw=0.5); ax.text(x, -0.5, f"{lbl}\n{nf(x, 2)} м", ha='center', fontsize=5.4, color=MUT)
ax.plot([0, 0], [-0.16, -0.04], color=MUT, lw=0.5); ax.text(0.0, -0.3, '0', ha='center', fontsize=5.4, color=MUT)
ax.annotate('консоль 0,27 м до нижньої рейки,\nякщо проліт каркаса 3,1 м', xy=(-1.7, zfr(hfr) + 0.12), xytext=(-3.0, -0.6), fontsize=5.4, color='#3b3f44', arrowprops=dict(arrowstyle='-', lw=0.4, color='#3b3f44'))
ax.text(2.45, 0.08, f"низ модуля ≈{nf(ze, 2)} м\nнад покрівлею (оцінка)", fontsize=5.4, color=MUT)
ax.set_xlim(-3.05, 3.4); ax.set_ylim(-0.75, 2.25); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('Розріз поперек ліхтаря (на північ): модулі вертикально, по 2 рейки на схил', fontsize=7.5, loc='left', weight='bold', color=INK)
fig.savefig(V + 'lan13_sec.png', bbox_inches='tight'); plt.close(fig)
# ---------- 3. зведення
base = R['roof']['base']; dR = R['roof']['mwh'] - base; add = R['mwh'] + dR
rows = [('Модулі на нинішніх ліхтарях, книжково 46° (v3)', K46['n'], K46['st'], K46['mwh'], K46['y'], -K46['roof_loss']),
        ('Розібрати, 13°, горизонтально (1 ряд, наявний каркас)', J13['G1']['lan']['n'], J13['G1']['lan']['st'], J13['G1']['lan']['mwh'], J13['G1']['lan']['y'], J13['G1']['roof']['mwh'] - base),
        ('Розібрати, 13°, вертикально — максимум (залишки між ліхтарями)', R['max']['n'], R['max']['st'], R['max']['mwh'], round(R['max']['mwh'] * 1000 / R['max']['n'] / 0.73), dR),
        ('<b>Розібрати, 13°, вертикально — зручно для монтажу (обрано)</b>', R['n'], R['st'], R['mwh'], R['y'], dR),
        ('Розібрати, 13°, вертикально — лише цілі стрінги на схилі', R['pure']['n'], R['pure']['n'] // 11, R['pure']['mwh'], round(R['pure']['mwh'] * 1000 / R['pure']['n'] / 0.73), dR)]
T = ''
for nm, n_, st, mwh, y, dr in rows:
    a = mwh + dr; cost = n_ * COST; pb = cost / (a * 1000 * VAL)
    T += f"<tr{' class=sel' if 'обрано' in nm else ''}><td>{nm}</td><td class=n>{n_} = {st}</td><td class=n>{nf(mwh, 1)}</td><td class=n>{y}</td><td class=n>{('+' if dr > 0 else '') + nf(dr, 1)}</td><td class=n><b>+{nf(a, 1)}</b></td><td class=n>{nf(cost)}</td><td class=n>{nf(pb, 1)}</td></tr>"
SL = ''
for l in range(1, 5):
    ss = [x for x in R['strings'] if x['l'] == l]; nn = sum(x['n'] for x in ss); mw = sum(x['mwh'] for x in ss)
    mixed = [x for x in ss if '+' in x['side']]; empty = sum(1 for k, m in enumerate(MODS) if m['l'] == l and k not in used)
    SL += (f"<tr><td>Ліхтар {l}</td><td class=n>{nn} = {len(ss)}</td><td>{', '.join(x['id'] for x in ss if x['side'] == 'E')}</td><td>{', '.join(x['id'] for x in ss if x['side'] == 'W')}</td>"
           f"<td>{(mixed[0]['id'] + ' — ' + ('біля північного торця' if mixed[0]['rest_end'] == 'N' else 'біля південного торця') + f', {nf(mixed[0][chr(109)+chr(105)+chr(115)+chr(109)], 1)} % на різну освітленість') if mixed else '—'}</td><td class=n>{empty}</td><td class=n>{nf(mw, 1)}</td></tr>")
TOT_N = R['roof']['n'] + R['n'] + FACV['n'] + 176; TOT = R['roof']['mwh'] + R['mwh'] + FACV['kwh'] / 1000 + 148.7
OPEN = 2 * 1.55 / ct * sum(f['y1'] - f['y0'] for f in F)
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(V + f, 'rb').read()).decode()
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Ліхтарі — модулі вертикально</title><style>
@page {{ size:A4; margin:12mm 13mm 13mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.2pt; line-height:1.38; color:#1d2a33; margin:0; }}
h1 {{ font-size:13.5pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.3pt; margin:3.2mm 0 1.4mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:7.8pt; margin-bottom:3mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:14.5pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.3pt; color:#5b6770; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.4mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2mm 4mm; border-radius:1.5mm; margin-bottom:2mm; font-size:7.8pt; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.3pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:0.9mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; }} img {{ width:100%; display:block; }} .src {{ font-size:7pt; color:#5b6770; }}
</style></head><body>
<h1>Антарес — модулі на місці ліхтарів: вертикально, каркас ≈13°, розкладка зручна для монтажу</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 20:26: «розклади по найкращому варіанту з урахуванням зручності монтажу». Кут каркаса — ≈13° за фото 112242, 112246 (власник на око — 20–22°).</div>
<div class="tiles"><div class="tile"><div class="v">{R['n']}</div><div class="k">модулів на 4 ліхтарях = {R['st']} стрінги × 11, {nf(R['kwp'], 1)} кВтп</div></div>
<div class="tile"><div class="v">{nf(R['mwh'], 1)}</div><div class="k">МВт·год за рік ({R['y']} кВт·год/кВтп)</div></div>
<div class="tile"><div class="v">+{nf(add, 1)}</div><div class="k">МВт·год разом із даху (дах +{nf(dR, 1)}: ліхтар нижчий — менше тіні)</div></div>
<div class="tile"><div class="v">{nf(TOT_N)}</div><div class="k">модулів на всій станції, {nf(TOT_N * 0.73, 1)} кВтп, ≈{nf(TOT, 1)} МВт·год</div></div></div>
<div class="key"><b>Обрано: вертикально, по одному ряду на схил, стрінги в межах свого ліхтаря.</b><ul>
<li><b>Чому вертикально:</b> на тій самій довжині ліхтаря модулів удвічі більше, ніж горизонтально ({R['n']} проти {J13['G1']['lan']['n']}), а генерація на модуль майже та сама ({R['y']} проти {J13['G1']['lan']['y']} кВт·год/кВтп). Додаткові {R['n'] - J13['G1']['lan']['n']} модулі окуповуються за ≈{nf((R['n'] - J13['G1']['lan']['n']) * COST / ((R['mwh'] - J13['G1']['lan']['mwh']) * 1000 * VAL), 1)} р.</li>
<li><b>Монтаж:</b> на схил — 2 рейки вздовж ліхтаря в зоні притисків ZNSHINE ({int(R['clamp'] * 1000)} мм від торців модуля). Верхня рейка — на {nf(R['rail_up'], 2)} м від осі гребеня, нижня — на {nf(R['rail_lo'], 2)} м; модуль звисає за нижню рейку на 0,54 м, як дозволяє інструкція. Нижня рейка — майже по краю нинішнього ліхтаря (1,83 м); якщо проліт каркаса 3,1 м — до неї коротка консоль 0,27 м, ширшого каркаса не треба. Під модулем лишаються сітка й нова покрівля прорізу.</li>
<li><b>Стрінги:</b> 11 сусідніх модулів одного схилу; кабелів між ліхтарями немає; кінці стрінгів — біля торців ліхтаря. У ліхтарях 2–4 залишки сходу й заходу зібрано в один спільний стрінг біля торця (−7,5 % на різну освітленість лише в ньому). Проти «максимуму» з кабелями між ліхтарями — на {R['max']['n'] - R['n']} модулів і {nf(R['max']['mwh'] - R['mwh'], 1)} МВт·год менше; проти «лише цілих стрінгів» — на {R['n'] - R['pure']['n']} модулів і {nf(R['mwh'] - R['pure']['mwh'], 1)} МВт·год більше.</li>
<li><b>Кут:</b> за фото каркас ≈13°; при 22° ця сама розкладка дала б на ≈3 % менше. Розкладку це не змінює — змінюється лише висота гребеня.</li></ul></div>
<h2>Варіанти (додаток до даху: 1 639 модулів, {nf(base, 1)} МВт·год)</h2>
<table><tr><th style="width:36%">Варіант</th><th class=n>Модулів = стрінгів</th><th class=n>МВт·год</th><th class=n>кВт·год/кВтп</th><th class=n>Дах, МВт·год</th><th class=n>Разом, МВт·год</th><th class=n>Модулі, $</th><th class=n>Окупн., р.</th></tr>{T}</table>
<p class="src">Ціна — ≈{nf(COST)} $ на модуль під ключ без ПДВ (оцінка з кошторису 26.10), 1 кВт·год — 7,00 грн з ПДВ (оцінка власника), ККД PCS 97,5 %, 44,89 грн/$. Окупність — без розбирання ліхтарів, нової покрівлі прорізу й освітлення цеху (вартості немає в даних).</p>
<h2>Стрінги по ліхтарях</h2>
<table><tr><th>Ліхтар</th><th class=n>Модулів = стрінгів</th><th>Схід (по 11)</th><th>Захід (по 11)</th><th>Спільний схід + захід</th><th class=n>Порожніх місць</th><th class=n>МВт·год</th></tr>{SL}</table>
<img src="{img('lan13_plan.png')}" style="width:92%;margin:0 auto">
<h2>Розріз і кріплення</h2>
<img src="{img('lan13_sec.png')}">
<table><tr><th style="width:60%">Що потрібно на ліхтарі (кількість — за розкладкою)</th><th class=n>Кількість</th></tr>
<tr><td>Модулі ZNSHINE ZXN8-BD132-730 (виводи 1,2–1,4 м: стандартні +300/−200 мм не дістають до сусіднього модуля в ряду)</td><td class=n>{R['n']} шт.</td></tr>
<tr><td>Рейки вздовж ліхтаря, по 2 на схил (довжина ряду + 0,1 м з кожного кінця)</td><td class=n>{nf(R['rail_m'], 1)} м</td></tr>
<tr><td>Притиски середні (спільні на два модулі) / кінцеві</td><td class=n>{R['clamps_mid']} / {R['clamps_end']} шт.</td></tr>
<tr><td>Кронштейни рейок до поперечних балок каркаса</td><td class=n>за кроком балок — виміряти</td></tr>
<tr><td>Нова покрівля над прорізом при прольоті 3,1 м і 13° (без торців)</td><td class=n>≈{nf(OPEN)} м²</td></tr></table>
<div class="warn"><b>Що виміряти і вирішити до КМ</b><ol>
<li>Кут і проліт каркаса, крок поперечних балок, висота бічних балок над покрівлею — рівень на телефоні і рулетка біля відкритого торця.</li>
<li>Несуча здатність каркаса під модулі ({R['n']} × 36,5 кг ≈ {nf(R['n'] * 36.5 / 1000, 1)} т), рейки й сніг — перевірка КМ.</li>
<li>Нова покрівля прорізу і примикання до покрівлі цеху; розбирання скління — вартості немає в даних.</li>
<li>Денне світло в цеху після розбирання ліхтарів — потреба в освітленні.</li>
<li>Погодження ZNSHINE: монтаж на 2 рейках, звис 0,54 м за рейку — як в інструкції; ухил 13°.</li>
<li>Вільні входи щитів PV для {R['st']} нових стрінгів.</li></ol></div>
<p class="src">Модель — та сама, що v3 (Meteonorm 8.1, крок 10 хв, DSM 0,25 м з дефлекторами, рамою кондиціонерів, парапетами, західною будівлею й АБК; горизонт 72 напрями; U 20, втрати 13,2 %; різна освітленість у стрінгу — покроково). Низ модуля — 0,30 м над покрівлею (оцінка). Скрипти: calc/v3/lan13_mount.py, lan13_report.py.</p>
</body></html>'''
open(V + 'lan13.html', 'w', encoding='utf-8').write(H)
OUT = V + 'Розрахунок_розкладки_модулів_на_ліхтарях_вертикально_каркас_13°_зручний_монтаж_Антарес_27.10.2026.pdf'
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + V + 'lan13.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(main())
print(OUT, 'add', round(add, 1), 'tot', TOT_N, round(TOT, 1), 'open m2', round(OPEN))
