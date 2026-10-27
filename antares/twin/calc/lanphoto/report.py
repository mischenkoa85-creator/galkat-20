# -*- coding: utf-8 -*-
"""Звіт 27.10 (23:08): кут сталевих кутників каркаса ліхтаря за 4 фото зсередини; каркас 3,0 м; 12° (фото) і 17° (на око) — генерація і тіні."""
import json, math, base64, asyncio
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
V = '/home/claude/work/sun/v3/'; P = '/home/claude/work/lanphoto/'
A = json.load(open(P + 'angles.json')); SH = json.load(open(V + 'shade_lan.json'))
M = {t: json.load(open(V + f'lan{t}_mount.json')) for t in (12, 17, 22)}; LF = {t: json.load(open(V + f'lanf{t}.json')) for t in (12, 17)}
B = 1092.94
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.2}); INK, MUT = '#1d2a33', '#5b6770'
# ---------- розріз: каркас 3,0 м, 12° і 17°
fig, axs = plt.subplots(1, 2, figsize=(7.6, 2.7), dpi=220, sharey=True)
LM = 2.384
for ax, t in zip(axs, (12, 17)):
    R = M[t]; tg = math.tan(math.radians(t)); hw = R['edge']; zr = 0.30 + hw * tg; fe = zr - 1.5 * tg
    ax.add_patch(Polygon([(-1.83, 0), (1.83, 0), (0, 1.89)], fill=False, ec='#8a6f4d', lw=0.7, ls='--'))
    ax.text(0, 1.93, 'ліхтар зараз 3,66 × 1,89', ha='center', fontsize=6, color='#8a6f4d')
    ax.plot([-2.7, 2.7], [0, 0], color=INK, lw=1.0); ax.fill_between([-2.7, 2.7], -0.15, 0, color='#d9d4cc')
    for sg in (-1, 1):
        ax.plot([0, sg * 1.5], [zr, fe], color='#7a3b1f', lw=2.4)                                 # кутник каркаса
        ax.plot([sg * 1.5, sg * 1.5], [0, fe], color='#7a3b1f', lw=1.2, ls=':')                  # опора / борт — виміряти
        ax.plot([0, sg * hw], [zr + 0.12, zr + 0.12 - hw * tg], color='#2a5db0', lw=3.2, solid_capstyle='butt')   # модуль
        for x in (R['rail_up'], R['rail_lo']):
            z = zr - x * tg; ax.add_patch(Rectangle((sg * x - 0.03, z), 0.06, 0.09, color='#9aa3a8'))
        xl = R['rail_lo']; zl = zr - xl * tg
        ax.plot([sg * 1.5, sg * xl], [fe, zl], color='#c8691c', lw=1.8)                         # консоль під нижню рейку
    ax.annotate('', xy=(1.5, -0.32), xytext=(-1.5, -0.32), arrowprops=dict(arrowstyle='<->', lw=0.6)); ax.text(0, -0.43, 'каркас 3,0 м (власник)', ha='center', fontsize=6)
    ax.annotate('', xy=(hw, -0.62), xytext=(-hw, -0.62), arrowprops=dict(arrowstyle='<->', lw=0.6, color='#2a5db0')); ax.text(0, -0.73, f'модулі {nf(2 * hw, 2)} м', ha='center', fontsize=6, color='#2a5db0')
    ax.text(1.62, fe + 0.03, f'консоль\n{nf(R["console"] * 100)} см', fontsize=5.6, color='#c8691c')
    ax.text(0.08, zr + 0.25, f'гребінь каркаса +{nf(1.5 * tg, 2)} м\nвід низу каркаса', fontsize=5.6, color='#7a3b1f')
    ax.set_title(f'Каркас {t}° ({"за фото" if t == 12 else "на око власника"}): {R["n"]} модулів, {nf(R["mwh"], 1)} МВт·год за рік', fontsize=7, loc='left', color=INK, weight='bold')
    ax.set_xlim(-2.75, 2.75); ax.set_ylim(-0.85, 2.15); ax.set_aspect('equal'); ax.axis('off')
fig.tight_layout(); fig.savefig(P + 'sec.png'); plt.close(fig)
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode() if f.endswith('png') else 'data:image/jpeg;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
rows = ''
for n in ('112242', '112246', '112235', '112237'):
    r = A[n]; rows += (f"<tr><td>{n}</td><td class=n>{r['nW']} / {r['nE']}</td><td class=n>{nf(r['rW'], 1)}°</td><td class=n>{nf(r['rE'], 1)}°</td><td class=n><b>{nf((r['rW'] + r['rE']) / 2, 1)}°</b></td>"
                       f"<td class=n>{nf(r['f_rng'][0], 1)}–{nf(r['f_rng'][1], 1)}°</td><td class=n>{nf(r['glass'], 1)}°</td></tr>")
allv = [x for n in A for x in (A[n]['rW'], A[n]['rE'])]; avg = sum(allv) / len(allv)
lan = lambda k: SH['none']['mwh'] - SH[k]['mwh']
def col(t):
    R = M[t]; return R
cmp = [('Гребінь каркаса над його низом (каркас 3,0 м)', '—', *(f"{nf(1.5 * math.tan(math.radians(t)), 2)} м" for t in (12, 17, 22))),
       ('Звис модулів за край каркаса / консоль під нижню рейку', '—', *(f"{nf(M[t]['edge'] - 1.5, 2)} / {nf(M[t]['console'], 2)} м" for t in (12, 17, 22))),
       ('Модулі на місці ліхтарів, МВт·год (кВт·год/кВтп)', '—', *(f"<b>{nf(M[t]['mwh'], 1)}</b> ({M[t]['y']})" for t in (12, 17, 22))),
       ('Тінь від ліхтарів на модулі даху, МВт·год', f"−{nf(lan('base'), 1)}", *(f"−{nf(lan('t%d' % t), 1)}" for t in (12, 17, 22))),
       ('Дах цеху, 1 639 модулів, МВт·год', nf(B, 1), *(nf(M[t]['roof']['mwh'], 1) for t in (12, 17, 22))),
       ('<b>Дах + ліхтарі (1 936 модулів), МВт·год</b>', nf(B, 1), *(f"<b>{nf(M[t]['roof']['mwh'] + M[t]['mwh'], 1)}</b>" for t in (12, 17, 22)))]
CT = ''.join(f"<tr{' class=sel' if i == 5 else ''}><td>{a}</td>" + ''.join(f"<td class=n>{x}</td>" for x in xs) + '</tr>' for i, (a, *xs) in enumerate(cmp))
d1712 = (M[12]['roof']['mwh'] + M[12]['mwh']) - (M[17]['roof']['mwh'] + M[17]['mwh'])
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Кут каркаса ліхтаря</title><style>
@page {{ size:A4; margin:11mm 12mm 12mm 14mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.1pt; line-height:1.36; color:#1d2a33; margin:0; }}
h1 {{ font-size:13pt; margin:0 0 1.5mm; }} h2 {{ font-size:10pt; margin:3mm 0 1.3mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:7.7pt; margin-bottom:2.5mm; }} p {{ margin:0 0 1.8mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.4mm 4mm; border-radius:1.5mm; margin-bottom:2.5mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2mm 4mm; border-radius:1.5mm; margin-bottom:2mm; font-size:7.7pt; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.2pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:0.9mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; }} img {{ width:100%; display:block; }} .src {{ font-size:6.9pt; color:#5b6770; }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:3mm; }}
</style></head><body>
<h1>Антарес — кут сталевого каркаса ліхтаря за фото зсередини</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · 27.10.2026 · запит власника 23:08: «по ширині при землі конструкції залишиться 3 000 мм, з них сходяться приблизно 16–18° металеві кути у домик — ще раз проаналізуй усі фото ліхтаря»</div>
<div class="key"><b>За всіма чотирма фото кутники каркаса піднімаються до середньої балки під ≈{nf(avg, 0)}° ({nf(min(allv), 1)}–{nf(max(allv), 1)}°), а не 16–18°.</b><ul>
<li>На кожному фото знайдено 4–14 кутників з кожного боку балки; усі паралельні між собою з розкидом ≤0,5°. Схід і захід однакові (≈12° і ≈12°) — каркас симетричний «домік».</li>
<li>Перевірка тим самим методом: скло ліхтаря на тих самих фото — 47–48° (зовні рулетка дає 46° для полікарбонату). Якщо змінити фокусну відстань камери на ±15 %, середній кут кутників змінюється лише в межах 12,0–12,6°.</li>
<li>На фото нижче поверх кутників проведено, як виглядали б 12°, 17° і 22° з тієї самої точки: з кутниками збігається лише 12°. Знизу «на око» кут здається крутішим через перспективу.</li>
<li>Ширину 3,0 м з фото не визначити — на них немає мірки; беру ваші 3,0 м. Тоді гребінь каркаса — на 0,32 м вище його низу.</li>
<li>Для розкладки це майже не важливо: та сама розкладка (297 модулів, 27 стрінгів), між 12° і 17° різниця — {nf(d1712, 1)} МВт·год за рік (≈0,3 %). У 3D-двійнику є обидва варіанти.</li></ul></div>
<div class="two"><img src="{img(P + 'ovl_112246.jpg')}"><img src="{img(P + 'ovl_112242.jpg')}"></div>
<p class="src">Жовті — кутники, знайдені програмою на фото (детектор відрізків). Блакитна, червона й рожева — 12°, 17° і 22° з тієї самої точки на середній балці, побудовані в перспективі цього фото.</p>
<h2>Як виміряно</h2>
<table><tr><th>Фото</th><th class=n>Кутників зх / сх</th><th class=n>Захід</th><th class=n>Схід</th><th class=n>Середнє</th><th class=n>Фокус ±15 %</th><th class=n>Скло ліхтаря</th></tr>{rows}</table>
<p class="src">Метод — геометрія перспективи: (1) точка сходу осі ліхтаря — з поздовжніх ліній (середня балка, борти, прогони скління; 31–32 лінії на фото 112242 і 112246); (2) кутники й кроквини скління лежать у площинах поперек ліхтаря — для кожного відрізка знайдено його точку сходу на лінії сходу цієї площини і напрям у площині; (3) вертикаль — бісектриса двох схилів скління (схили однакові). Камера Galaxy S25 Ultra, 23 мм екв. Кут не залежить від того, де стояла камера, і майже не залежить від фокусної відстані. Розрахунок — calc/lanphoto (pv.py, fig.py).</p>
<h2>Каркас 3,0 м: 12° (фото) і 17° (на око)</h2>
<img src="{img(P + 'sec.png')}">
<table><tr><th style="width:38%"></th><th class=n>Ліхтарі як зараз</th><th class=n>Каркас 12° · фото</th><th class=n>Каркас 17° · на око</th><th class=n>22° (довідково)</th></tr>{CT}</table>
<div class="warn"><b>Що з цього для монтажу і що виміряти</b><ol>
<li>Модулі (2 384 мм вертикально) ширші за каркас: з кожного боку звис ≈0,85 м, нижня рейка — за краєм каркаса, на консолях ≈0,3 м. У розрахунку нижній край модуля ≈0,4 м над покрівлею, низ каркаса ≈0,5 м. Якщо низ кутників лежить на рівні покрівлі, рейки треба ставити на стійки ≈0,4–0,5 м, інакше модулі опустяться до покрівлі.</li>
<li>Виміряти: висоту низу кутників над покрівлею, крок поперечних кутників уздовж ліхтаря, кут — рівнем на телефоні, прикладеним до кутника біля відкритого щипця.</li>
<li>Несучу здатність кутників під модулі, рейки і сніг (297 модулів × 36,5 кг ≈ 10,8 т на 4 ліхтарі) — перевірити в КМ.</li></ol></div>
<p class="src">Генерація — та сама модель, що v3 (Meteonorm 8.1, крок 10 хв, DSM 0,25 м, горизонт 72 напрями, U 20, втрати 13,2 %, стрінги з моделлю байпас-діодів). Тінь від ліхтарів — сума по 1 639 модулях даху без стрінгів.</p>
</body></html>'''
open(P + 'report.html', 'w', encoding='utf-8').write(H)
OUT = V + 'Розрахунок_кута_каркаса_ліхтаря_за_фото_зсередини_і_розкладки_12°_і_17°_Антарес_27.10.2026.pdf'
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + P + 'report.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(main()); print(OUT)
