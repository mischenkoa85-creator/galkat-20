# -*- coding: utf-8 -*-
"""Звіт v3 → PDF: план об'єктів (супутник), карта опромінення, варіанти розкладки А / Б / В."""
import json, asyncio, base64
from playwright.async_api import async_playwright
V = '/home/claude/work/sun/v3/'
L3 = json.load(open(V + 'layout_v3.json')); J = json.load(open(V + 'roof_v3.json')); IR = json.load(open(V + 'irr_v3.json'))
ND = json.load(open(V + 'layout_v3_nodefl.json'))['VARS']; WS_ = json.load(open(V + 'west_v3.json')); DF = json.load(open(V + 'defl_v3.json'))
s = open('/home/claude/work/twin/raddata.js', encoding='utf-8').read(); RD = json.loads(s[s.find('{'):s.rfind('}') + 1]); RS = RD['st']['roof']; TX = RD['v3txt']
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
A, B_, C_ = L3['VARS']; LV = L3['LAN']; COST = L3['COST']; VAL = L3['VAL']
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(V + f, 'rb').read()).decode()
import collections
cnt = collections.Counter(c['why'] for c in J['cand'])
dAB = A['n'] - B_['n']; eAB = A['mwh'] - B_['mwh']; dBC = B_['n'] - C_['n']; eBC = B_['mwh'] - C_['mwh']
nd = ND[0]; st = collections.Counter(o['st'] for o in DF)
FAC_N, FAC_MWH, WH_N, WH_MWH = 429, 227.1, 176, 148.7
TOT_N = A['n'] + FAC_N + WH_N; TOT_MWH = A['mwh'] + FAC_MWH + WH_MWH
row = lambda nm, v, cls='': f"<tr class='{cls}'><td>{nm}</td><td class='n'>{nf(v['n'])} = {v['st']}</td><td class='n'>{nf(v['kwp'], 1)}</td><td class='n'><b>{nf(v['mwh'], 1)}</b></td><td class='n'>{nf(v['y'])}</td><td class='n'>{nf(v['irr'])}</td><td class='n'>−{nf(v['mism'], 2)} %</td><td class='n'>≈{nf(v['cost'] / 1000)}</td><td class='n'>{nf(v['pb'], 1)}</td></tr>"
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Розкладка даху за картою опромінення — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 13mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.3pt; line-height:1.38; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.7mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.6pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:1.1mm 1.5mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; font-weight:700; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }} .pb {{ break-before:page; }}
</style></head><body>
<h1>Антарес — дах цеху: обміри, карта сонячного опромінення і розкладка модулів (v3)</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 14:42: «переміряти увесь дах, що де розташовано… запропонувати розкладку, виходячи із сонячної активності на квадратний метр, і найоптимальніший варіант»</div>
<div class="tiles"><div class="tile"><div class="v">{nf(A['n'])}</div><div class="k">модулів 730 Вт = {A['st']} стрінги × 11 (варіант А)</div></div>
<div class="tile"><div class="v">{nf(A['kwp'], 1)}</div><div class="k">кВтп на даху цеху</div></div>
<div class="tile"><div class="v">{nf(A['mwh'], 1)}</div><div class="k">МВт·год за рік на виході PV</div></div>
<div class="tile"><div class="v">{nf(RS['mean'])}</div><div class="k">кВт·год/м² у середньому на покрівлі (максимум {nf(RS['max'])}; горизонталь без тіні {nf(RD['ghi'])})</div></div></div>
<div class="key"><b>Рекомендація — варіант А: модулі на всі вільні місця.</b> Карта опромінення показує, де кожен м² отримує більше сонця, і варіанти Б і В беруть лише кращі м². Але кожен «гірший» шар місць теж окупається: від В до Б — ще {nf(dBC)} модулів і {nf(eBC, 1)} МВт·год ({nf(eBC * 1000 / dBC / 0.73)} кВт·год/кВтп, окупність ≈{nf(dBC * COST / (eBC * 1000 * VAL), 1)} р.), від Б до А — ще {nf(dAB)} модулів і {nf(eAB, 1)} МВт·год ({nf(eAB * 1000 / dAB / 0.73)} кВт·год/кВтп, ≈{nf(dAB * COST / (eAB * 1000 * VAL), 1)} р.). Тому найбільше енергії і грошей дає А. Найслабша частина А — смуга 7,5 м біля західної будівлі: {nf(WS_['dn'])} модулів, {nf(WS_['de'], 1)} МВт·год ({nf(WS_['yd'])} кВт·год/кВтп, ≈{nf(WS_['pb'], 1)} р.); її можна не ставити, якщо там снігова зона біля вищої стіни або будівля виявиться ширшою.</div>
<h2>Варіанти</h2>
<table><tr><th style="width:31%">Варіант</th><th class="n">Модулів = стрінгів</th><th class="n">кВтп</th><th class="n">МВт·год</th><th class="n">кВт·год/кВтп</th><th class="n">кВт·год/м²</th><th class="n">Різна освітленість</th><th class="n">тис. $ (оцінка)</th><th class="n">Окупність, р.</th></tr>
{row('А — усі вільні місця', A, 'sel')}{row('Б — від 1 050 кВт·год/м²', B_)}{row('В — від 1 100 кВт·год/м²', C_)}
<tr><td>А без смуги 7,5 м біля західної будівлі</td><td class="n">{nf(WS_['n'])} = {WS_['st']}</td><td class="n">{nf(WS_['kwp'], 1)}</td><td class="n"><b>{nf(WS_['mwh'], 1)}</b></td><td class="n">{nf(WS_['y'])}</td><td colspan="4"></td></tr>
<tr><td>Для порівняння: А, якщо дефлектори приберуть</td><td class="n">{nf(nd['n'])} = {nd['st']}</td><td class="n">{nf(nd['kwp'], 1)}</td><td class="n">{nf(nd['mwh'], 1)}</td><td class="n">{nf(nd['y'])}</td><td class="n">{nf(nd['irr'])}</td><td class="n">−{nf(nd['mism'], 2)} %</td><td class="n">≈{nf(nd['cost'] / 1000)}</td><td class="n">{nf(nd['pb'], 1)}</td></tr>
<tr><td>+ на ліхтарях книжково (окремо)</td><td class="n">{nf(LV['n'])} = {LV['st']}</td><td class="n">{nf(LV['kwp'], 1)}</td><td class="n">{nf(LV['mwh'], 1)}</td><td class="n">{nf(LV['y'])}</td><td colspan="2">кут {nf(LV['tilt'], 0)}°, схід і захід</td><td class="n">≈{nf(LV['n'] * COST / 1000)}</td><td class="n">{nf(LV['pb'], 1)}</td></tr></table>
<p class="src">Окупність — лише модулів цього варіанта: ≈{nf(COST)} $ на модуль під ключ без ПДВ (частина СЕС кошторису 26.10 без УЗЕ, EMS, фундаментів і мідних ліній AC, поділена на 1 925 модулів — оцінка) проти ефекту {nf(VAL * 100, 2)} ¢ з 1 кВт·год (7,00 грн з ПДВ — оцінка власника, ККД PCS 97,5 %). Різна освітленість — модулі одного стрінга в тіні по-різному; пораховано по кроках 10 хв (обхідні діоди на рівні модуля).</p>
<p>Уся станція з варіантом А: дах {nf(A['n'])} + фасади {FAC_N} + склад {WH_N} = <b>{nf(TOT_N)} модулів, {nf(TOT_N * 0.73, 1)} кВтп, ≈{nf(TOT_MWH, 1)} МВт·год</b> на виході PV (фасади і склад — з розрахунків 26–27.10). PCS 3 × 12 входів по 60 кВтп = 2 160 кВтп — вміщується.</p>
<h2>Що змінилося проти розкладки ранку 27.10 (1 771 модуль, 1 239,3 МВт·год)</h2>
<ul><li><b>Дефлектори є.</b> 26.10 їх прибрали з розрахунку («вентиляцію прибрано»), але на супутнику Google і фото 27.10 вони на даху: {st['є']} видно на знімку, ще {st['уточнити']} малих труб — з РП. Під них і 0,3 м навколо — {cnt['defl']} місць. Якщо при заміні покрівлі дефлектори приберуть або перенесуть до парапетів: +{nf(nd['n'] - A['n'])} модулів, +{nf(nd['mwh'] - A['mwh'], 1)} МВт·год.</li>
<li><b>Ліхтарі 3,66 × 1,89 м за рулеткою</b> (було 3,40 × 1,74): вища тінь на сусідні грані, від ліхтаря до модуля — 0,25 м.</li>
<li><b>Торцеві парапети 1,37 м</b> (було 1,2): трохи більше тіні в крайніх рядах.</li>
<li><b>Стрінги — у межах грані</b> (однаковий бік і кут), різна освітленість пораховано, а не оцінено.</li>
<li>Поворот будівлі на супутнику — 3,8° за годинниковою стрілкою; у кліматі моделі вже закладено 4°, тож без змін.</li></ul>
<div class="warn"><b>Рішення і заміри, від яких залежить розкладка</b><ol>
<li>Які дефлектори лишаються після заміни покрівлі (номери — на плані, с. 2). Якщо частину перенести до парапетів або об'єднати — повертаються місця під модулі.</li>
<li>Рама кондиціонерів — рулеткою від виходу на дах (зараз ±2 м; під нею на знімку 2 дефлектори — мабуть, знято).</li>
<li>Вихід і портал: за фото й супутником X ≈62–70 м — виміряти від східного краю даху.</li>
<li>Північний парапет (прийнято як південний, 1,37 м) і ширина західної будівлі.</li>
<li>Модулі на ліхтарях — ліхтарі світлопрозорі, цех стане темнішим: ставити чи ні.</li></ol></div>
<h2>1. Що де стоїть на даху — супутник Google і модель</h2>
<img src="{img('v3_sat.png')}" style="width:86%;margin:0 auto">
<p class="src">Знімок Google (дата не вказана — до 2026: рами кондиціонерів на ньому ще немає) прив'язано до креслення за краями даху й ліхтарями: поворот 3,8°, масштаб 0,19 м/пкс; дефлектори з РП, видимі на знімку, збігаються з ним здебільшого в межах 0,6 м (найбільше — 1,4 м), тож прив'язка надійна. Ліхтарі по X — з розрізу 1-1, по Y — з РП, на знімку збігаються ±0,5 м; трикутники на північних кінцях — тінь щипців. Між ліхтарями 2 і 3 (X 31–44 м) на знімку 17 дефлекторів, яких у РП немає; усього лише на знімку — 20. Висота дефлекторів — з РП (1,3–1,9 м) або 1,6 м типово.</p>
<div class="pb"></div>
<h2>2. Сонячне опромінення на кожні 0,5 × 0,5 м</h2>
<img src="{img('v3_irr.png')}" style="width:92%">
<table><tr><th>Покрівля (без ліхтарів, рами, дефлекторів)</th><th class="n">м²</th><th class="n">середнє</th><th class="n">10 % площі менше за</th><th class="n">максимум</th><th class="n">тінь і закрите небо</th></tr>
<tr><td>Дах цеху</td><td class="n">{nf(RS['area'])}</td><td class="n">{nf(RS['mean'])}</td><td class="n">{nf(RS['p10'])}</td><td class="n">{nf(RS['max'])}</td><td class="n">−{nf(RS['shade'], 1)} %</td></tr></table>
<ul><li>Найкраще — проліт 24 м (X 72–96): пологі грані 4–14°, без ліхтаря; і пологі грані біля гребенів 18-метрових арок (5,7°).</li>
<li>Біля західної будівлі: біля стіни −{TX['w0']} %, за 4 м −{TX['w4']} %, за 7 м −{TX['w7']} %. Під південним парапетом 0,5 м −{TX['s0']} %, наступний метр −{TX['s1']} %; під північним −{TX['n0']} %; під східним −{TX['e0']} %.</li>
<li>Грані на захід (ліві схили арок 18 м, до 15°) — трохи менше, ніж на схід; за кожним дефлектором — тінь на північ і вздовж.</li>
<li>≥ 1 100 кВт·год/м² — {nf(TX['good'])} м² з {nf(TX['area'])}.</li></ul>
<p class="src">Опромінення — у площині покрівлі (грані за розрізом 1-1), за рік, з тінями від західної будівлі, парапетів, ліхтарів, рами кондиціонерів, дефлекторів і з урахуванням закритого неба. У 3D-двійнику: «Сонце і генерація» → «Радіація, м²» — та сама карта, натискання на клітинку показує її значення.</p>
<div class="pb"></div>
<h2>3. Розкладка за картою</h2>
<img src="{img('v3_lay_A.png')}" style="width:94%">
<img src="{img('v3_lay_BV.png')}">
<p class="src">Сітка місць — як у варіанті Б (лаги вздовж будівлі, 3 блоки по 12 рядів з проходами; модуль 2 384 × 1 303 довгою стороною вздовж Y, по 2 на грань). Місця, зайняті: ліхтар + 0,25 м — {cnt['lan']}, дефлектори — {cnt['defl']}, рама кондиціонерів — {cnt['ac']}, вихід і прохід — {cnt['exit']}, двері — {cnt['door']}. Вільних — {nf(cnt[None])}. Стрінг по 11 збирається вздовж колонки на одній грані; залишки граней з тим самим боком і кутом об'єднуються; що не набирає 11 — не ставиться (у А — {A['drop']}).</p>
<h2>Як рахували</h2>
<p class="src">Клімат і модель — як у генерації 3D-двійника: Meteonorm 8.1 з PVsyst проєкту, ясні і хмарні дні під місячні суми, крок 10 хв, альбедо 0,2; цифрова модель висот 0,25 м, горизонт для кожної точки в 72 напрямах; модуль ZNSHINE ZXN8-BD132-730, U 20, втрати 13,2 %, тильна сторона не врахована. Опромінення — сітка 0,5 м (37 249 клітинок); генерація — 3 точки на модуль. Код: GitHub galkat-20/antares/twin/calc/v3 (roof_v3.py, irr_v3.py, layout_v3.py, twin_v3_export.py), супутник — calc/v3/sat. Таблиця — «Таблиця_розкладка_даху_за_картою_опромінення_Антарес_27.10.2026.xlsx».</p>
</body></html>'''
open(V + 'pdf_v3.html', 'w', encoding='utf-8').write(H)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto('file://' + V + 'pdf_v3.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=V + 'Розрахунок_розкладки_даху_за_картою_опромінення_Антарес_27.10.2026.pdf', format='A4', print_background=True, margin=dict(top='12mm', bottom='13mm', left='15mm', right='13mm'))
        await b.close()
asyncio.run(main()); print('pdf ok')
