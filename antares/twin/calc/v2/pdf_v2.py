# -*- coding: utf-8 -*-
"""Розкладка модулів на даху цеху за розрізом 1-1 з урахуванням тіней (27.10.2026) → PDF."""
import json, asyncio
from playwright.async_api import async_playwright
D = '/home/claude/work/sun/v2/'; R = json.load(open(D + 'final_v2.json')); B = R['base']; O = R['old']; CN = R['cnt']
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
SP = {'1–4': '18 м, біля західної будівлі', '4–7': '18 м', '7–10': '18 м', '10–13': '18 м, рама кондиціонерів', '13–17': '24 м'}
SPT = ''.join(f"<tr><td>{s['sp']}</td><td>{SP[s['sp']]}</td><td class='n'>{s['cols']}</td><td class='n'>{s['n']}</td><td class='n'>{s['E']} / {s['W']}</td><td class='n'>{nf(s['kwp'], 1)}</td><td class='n'>{nf(s['mwh'], 1)}</td><td class='n'>{nf(s['y'])}</td></tr>" for s in R['span'])
SPT += f"<tr class='sel'><td colspan='3'>Разом</td><td class='n'>{nf(B['n'])}</td><td class='n'>{sum(s['E'] for s in R['span'])} / {sum(s['W'] for s in R['span'])}</td><td class='n'>{nf(B['kwp'], 1)}</td><td class='n'>{nf(B['mwh'], 1)}</td><td class='n'>{nf(B['y'])}</td></tr>"
VT = ''.join(f"<tr class='{'sel' if (v['LH'] == 1.5 and v['lcx'] == 0.25 and v['thr'] == 15) else ''}'><td class='n'>{nf(v['LH'], 1)}</td><td class='n'>{nf(v['lcx'], 2)}</td><td class='n'>{v['thr']} %</td><td class='n'>{nf(v['n'])} / {v['st']}</td><td class='n'>{nf(v['kwp'], 1)}</td><td class='n'>{nf(v['mwh'], 1)}</td><td class='n'>{nf(v['y'])}</td></tr>"
             for v in sorted(R['var'], key=lambda v: (v['lcx'], v['LH'], v['thr'])))
WT = ''.join(f"<tr class='{'rm' if w['kept'] == 0 else ''}'><td class='n'>{i + 1}</td><td class='n'>{nf(w['xa'], 2)}</td><td>{nf(w['tilt'], 1)}° на {'захід' if w['face'] == 'W' else 'схід'}</td><td class='n'>{w['n']}</td><td class='n'>{nf(w['loss'], 1)} %</td><td class='n'>{nf(w['y'])}</td><td class='n'>{w['kept']}</td></tr>" for i, w in enumerate(R['west']))
v05 = next(v for v in R['var'] if v['lcx'] == 0.5 and v['thr'] == 15)
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Дах цеху за розрізом 1-1 — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 14mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.3pt; line-height:1.36; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3.5mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#f3f5f7; border:0.6pt solid #c4ccd3; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.6pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:1.1mm 1.5mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; font-weight:700; }} tr.rm td {{ color:#b4461b; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }} .pb {{ break-before:page; }}
</style></head><body>
<h1>Антарес — дах цеху: розкладка модулів за кресленням (розріз 1-1) з урахуванням тіней</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 07:17 «робимо розрахунок, як розташувати на даху з урахуванням тіней»; ред. 11:40 — рама кондиціонерів за розмірами власника (14,5 × 2,4 × 2,2 м). Основа — розріз 1-1 від замовника (26.10): профіль покрівлі гранями по ≈3 м.</div>
<div class="tiles"><div class="tile"><div class="v">{nf(B['n'])}</div><div class="k">модулів 730 Вт = {B['st']} стрінгів × 11</div></div>
<div class="tile"><div class="v">{nf(B['kwp'], 1)}</div><div class="k">кВтп на даху цеху</div></div>
<div class="tile"><div class="v">{nf(B['mwh'], 1)}</div><div class="k">МВт·год за рік (до поправки на різну освітленість)</div></div>
<div class="tile"><div class="v">{nf(B['y'])}</div><div class="k">кВт·год на 1 кВтп</div></div></div>
<div class="key"><b>Що дало креслення і як розкладено</b><ul>
<li><b>Покрівля — не гладка дуга, а грані по ≈3 м</b> (П-подібні плити по сегментних фермах): ухили 13–15° біля ендов, 5,7° біля ліхтаря, на прольоті 24 м — 14,2° · 13,5° · 11,7° · 4,0° з кожного боку; злами між гранями до 7–8°. Ендови +15,90, гребінь 24 м +18,15 — на ≈2 м вище, ніж у моделі.</li>
<li><b>Модулі — на гранях, не через злам:</b> довгою стороною вздовж будівлі, по 2 на грань (1 303 + 20 + 1 303 = 2 626 мм), від зламу 0,12 м — найвужчі грані 2,87–2,93 м якраз уміщують два. Уздовж будівлі — крок 2 406 мм (зазор 20 мм за ZNSHINE), 3 блоки по 12 рядів із проходами ≈2,5 м, як 25.10. На гребені 18-метрових прольотів (плита 2,87 м) — теж по 2 модулі там, де немає ліхтаря.</li>
<li><b>Ліхтарі</b> — за кресленням 2,87 м завширшки і зміщені від середини прольоту (9,09–11,96 м від ендови); уздовж будівлі — як у кресленнях РП. На розрізі ліхтар показано плитою (верх 17,93), на фото він двосхилий — у розрахунку гребінь +{nf(R['LH'], 1)} м над основою (оцінка). Модулі біля ліхтаря — на 0,29 м від його основи; тінь ліхтаря забирає в них у середньому {nf(R['lanadj'], 1)} %.</li>
<li><b>Тіні:</b> західна будівля (+6,8 м над покрівлею, фото), торцеві парапети (+1,2 м), сусідні грані й прольоти, ліхтарі, рама кондиціонерів, сходи. Прибрано модулі з втратою від тіні понад 15 % ({CN['shade']}: 4 колонки біля західної стіни — 23–51 %, кілька модулів 5–6-ї колонок і поруч із рамою кондиціонерів), раму кондиціонерів 14,5 × 2,4 м з відступом 1 м і прохід від виходу на дах ({CN['ac']}), стійки порталу ({CN['portal']}), прохід від дверей західної будівлі ({CN['door']}){(' і ' + str(CN['str']) + ' найслабших — під стрінги по 11') if CN.get('str') else ' (під стрінги по 11 ділиться без залишку)'}.</li>
<li><b>Порівняно з розкладкою 26.10</b> (гладка дуга, {nf(O['n'])} модулів, {nf(O['mwh'], 1)} МВт·год): <b>+{nf(B['n'] - O['n'])} модулів, +{nf(B['kwp'] - O['kwp'], 1)} кВтп, +{nf(B['mwh'] - O['mwh'], 1)} МВт·год</b>. Головне — на гранях уміщується по 2 модулі, і ліхтарі вужчі (2,87 замість 3,4 м).</li></ul></div>
<table><tr><th>Проліт (осі)</th><th></th><th class="n">Колонок</th><th class="n">Модулів</th><th class="n">На схід / захід</th><th class="n">кВтп</th><th class="n">МВт·год за рік</th><th class="n">кВт·год/кВтп</th></tr>{SPT}</table>
<p class="src">«На схід / захід» — куди нахилена грань. Модулі на гранях 24-метрового прольоту дають найбільше: там немає ліхтаря і далеко до західної будівлі.</p>
<h2>Як рахували</h2><p class="src">Профіль покрівлі — таблиця граней із розрізу 1-1 (DXF замовника, 27.10): X від осі 1, висоти від ±0,000. Уздовж будівлі профіль сталий; ліхтарі — двосхилі призми на основі 2,87 м з гребенем +{nf(R['LH'], 1)} м (оцінка), уздовж — як у кресленнях РП. Цифрова модель висот 0,25 м: покрівля, парапети торців +1,2 м і сходу +0,5 м, західна будівля +6,8 м над покрівлею біля стіни (фото), рама кондиціонерів 14,5 × 2,4 м, верх +2,2 м (розміри — власник 27.10; положення — за фото, ±2 м), сходи, ТП, адмінкорпус, контейнери УЗЕ. Модуль ZNSHINE ZXN8-BD132-730 на 0,12 м над гранню, 3 точки вздовж модуля, горизонт 72 напрями. Клімат і модель модуля — як у генерації 3D-двійника: Meteonorm 8.1 з PVsyst проєкту, ясні й хмарні дні під місячні суми, крок 10 хв; −0,30 %/°C, U 20, втрати ≈13 %; тильна сторона не врахована; без поправки на різну освітленість модулів у стрінгах. Тінь модуля — втрата річної генерації порівняно з тим самим модулем без жодних перешкод.</p>
<div class="pb"></div><h2 style="margin-top:0">Розріз і план</h2><img src="sec_v2.png"><img src="plan_v2.png" style="width:93%;margin:1mm auto 0">
<div class="pb"></div><h2 style="margin-top:0">Варіанти: висота ліхтаря, відступ від ліхтаря, поріг тіні</h2>
<table><tr><th class="n">Гребінь ліхтаря, м</th><th class="n">Відступ від ліхтаря, м</th><th class="n">Поріг тіні</th><th class="n">Модулів / стрінгів</th><th class="n">кВтп</th><th class="n">МВт·год</th><th class="n">кВт·год/кВтп</th></tr>{VT}</table>
<ul><li><b>Висота ліхтаря</b> майже не змінює кількість (1 914–1 947), але змінює тінь на сусідніх модулях: від 1,0 до 2,0 м — ±20 МВт·год. Обміряти ліхтар.</li>
<li><b>Відступ від ліхтаря:</b> якщо потрібен прохід 0,5 м для обслуговування ліхтаря, біля кожного ліхтаря випадає ряд модулів: {nf(v05['n'])} модулів ({v05['st']} стрінги), −{nf(B['n'] - v05['n'])} модулів і −{nf(B['mwh'] - v05['mwh'], 1)} МВт·год.</li>
<li><b>Поріг тіні 10 / 15 / 20 %</b> змінює лише кількість модулів біля західної стіни.</li></ul>
<h2>Колонки біля західної будівлі (проліт 1–4)</h2>
<table><tr><th class="n">Колонка</th><th class="n">X від осі 1, м</th><th>Грань</th><th class="n">Місць</th><th class="n">Тінь, середня</th><th class="n">кВт·год/кВтп</th><th class="n">Лишилось</th></tr>{WT}</table>
<p class="src">Грані біля стіни нахилені на захід (≈13–14°) — саме туди по обіді падає тінь будівлі. Грані цього ж прольоту за ліхтарем (на схід) майже не затінені: 1–4 %.</p>
<h2>Що з цього випливає</h2>
<ul><li><b>Кріплення (КМ):</b> модулі не переходять через злам — злам 7–8° між гранями більше не проблема. Рейки поперек довгої сторони модуля лягають уздовж грані (по ухилу) і в межах грані прямі — це схема 1а ZNSHINE, тобто кріплення за їхньою інструкцією. Перерахувати КМ: ухили до 15°, зсув по граням, кріплення до плит.</li>
<li><b>Вітер:</b> висота покрівлі 15,9–18,15 м (було 13,8–15,4) — навантаження більші, перерахувати.</li>
<li><b>Фасади:</b> стіни на ≈2 м вищі, ніж у моделі (ендови +15,90) — розкладку фасадів (319 модулів) і висоту козирка перерахувати; ймовірно, модулів на фасадах буде більше.</li>
<li><b>Уся станція:</b> дах {nf(B['n'])} + склад 176 + фасади 319 = {nf(R['total']['n'])} модулів = {R['total']['st']} стрінг, {nf(R['total']['kwp'], 1)} кВтп (фасади — до перерахунку). Потужність PCS — перевірити.</li>
<li><b>3D-двійник</b> поки з гладкими арками і карнизом 13,81 м — перебудувати під креслення.</li></ul>
<div class="warn"><b>Звірити на даху</b><ol>
<li>Ліхтарі: висота і форма (двосхилий, кут), довжина і положення вздовж будівлі, чи однакові всі 4.</li>
<li>Чи грані справді плоскі по ≈3 м, ширина пласкої смуги в ендовах (0,26–0,57 м за кресленням).</li>
<li>Західна будівля: висота над покрівлею біля стіни, довжина; парапети торців і сходу.</li>
<li>Рама кондиціонерів: відстань від виходу на дах і від ліхтаря 4 (у розрахунку X 67,2–69,6, Y 6,5–21,0 м від осі 1 / осі А); портал; двері із західної будівлі.</li></ol></div>

</body></html>'''
open(D + 'roof_v2.html', 'w', encoding='utf-8').write(H)
OUTF = '/home/claude/work/sun/Розрахунок_розкладки_модулів_на_даху_за_розрізом_1-1_з_тінями_Антарес_27.10.2026.pdf'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + D + 'roof_v2.html'); await pg.wait_for_timeout(800)
        await pg.pdf(path=OUTF, format='A4', print_background=True, margin={'top': '13mm', 'bottom': '15mm', 'left': '15mm', 'right': '13mm'},
                     display_header_footer=True, header_template='<div></div>', footer_template='<div style="font-family:DejaVu Sans;font-size:6.5pt;color:#5b6770;width:100%;padding:0 13mm 0 15mm;display:flex;justify-content:space-between"><span>Антарес — дах цеху за розрізом 1-1, розкладка з тінями · E-Systems · 27.10.2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')
        await b.close()
asyncio.run(main()); print('ok', OUTF)
