# -*- coding: utf-8 -*-
"""Модулі рівно по схилах ліхтаря + ідея освітлення цеху від модулів поза стрінгами (27.10.2026) → PDF."""
import json, asyncio
from playwright.async_api import async_playwright
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_flush_v2.json')); GG = json.load(open(D + 'lan_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
K = G['1.5']['K']; KG = GG['0.10']['K']; gl = round(sum(m[3] for m in GG['0.10']['mods']) / 1000 - KG['mwh'], 1)
row = lambda name, lh, ori, k, left, lmwh, sel='': (f"<tr class='{sel}'><td>{name}</td><td class='n'>{lh}</td><td>{ori}</td><td class='n'>{k['places']}</td><td class='n'>{k['n']} / {k['st']}</td>"
      f"<td class='n'>{nf(k['mwh'], 1)}</td><td class='n'>{nf(k['y'])}</td><td class='n'>−{nf(k['roof_loss'], 1)}</td><td class='n'>+{nf(k['net'], 1)}</td><td class='n'>{left} · {nf(lmwh, 1)}</td></tr>")
VT = row('«Домік» над ліхтарем (розрахунок 07:29)', '1,5 (до ≈1,8)', 'книжково, 50°', KG, KG['places'] - KG['n'], gl)
for lh in ('1.0', '1.5', '2.0'):
    k = G[lh]['K']; g = k['geo'][1]
    VT += row('Рівно по схилах ліхтаря', nf(float(lh), 1) + (' — оцінка' if lh == '1.5' else ''), ('книжково' if g['por'] else 'альбомно') + f", {nf(g['tilt'], 0)}°", k, k['left'], k['left_mwh'], 'sel' if lh == '1.5' else '')
PT = ''.join(f"<tr><td>Л{p['no']}</td><td class='n'>{p['n']}</td><td class='n'>{nf(p['E'], 1)} %</td><td class='n'>{nf(p['W'], 1)} %</td><td class='n'>{nf(p['kE'])} / {nf(p['kW'])}</td><td class='n'>{nf(p['mwh'], 1)}</td></tr>" for p in K['perlan'])
# освітлення: середня потужність модуля 8–17 год (схід і захід навпіл), 150 лм/Вт, 300 лк, коефіцієнт використання 0,6, експлуатації 0,8
PR = G['PROF']; LMW, LUX, UF, MF = 150, 300, 0.6, 0.8; need = LUX / (UF * MF)
MN = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']
mix = [(PR['E'][i]['mix_day'] + PR['W'][i]['mix_day']) / 2 for i in range(12)]
clr = [(PR['E'][i]['clear_day'] + PR['W'][i]['clear_day']) / 2 for i in range(12)]
ovc = [PR['E'][i]['over_day'] for i in range(12)]
NL = K['left']
LT = ('<tr><th></th>' + ''.join(f'<th class="n">{m}</th>' for m in MN) + '</tr>'
      + '<tr><td>Ясний день, Вт</td>' + ''.join(f'<td class="n">{nf(v)}</td>' for v in clr) + '</tr>'
      + '<tr><td>Хмарний день, Вт</td>' + ''.join(f'<td class="n">{nf(v)}</td>' for v in ovc) + '</tr>'
      + '<tr class="sel"><td>У середньому, Вт</td>' + ''.join(f'<td class="n">{nf(v)}</td>' for v in mix) + '</tr>'
      + f'<tr><td>{NL} модулів: м² при {LUX} лк</td>' + ''.join(f'<td class="n">{nf(NL * v * LMW / need, -1 if False else 0)}</td>' for v in mix) + '</tr>')
jun = NL * mix[5] * LMW / need; dec = NL * mix[11] * LMW / need; per = mix[5] * LMW / need
zone = 18 * 54.7; zone1 = 18 * 47.8; zall = zone1 + 3 * zone
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Модулі по схилах ліхтаря — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 14mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:7.9pt; line-height:1.3; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3.5mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#f3f5f7; border:0.6pt solid #c4ccd3; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .warn ol {{ margin:0; }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:4mm; }}
table {{ border-collapse:collapse; width:100%; font-size:7.5pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:1.1mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; font-weight:700; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }} .pb {{ break-before:page; }}
</style></head><body>
<h1>Антарес — модулі рівно по схилах ліхтарів і освітлення цеху від модулів поза стрінгами</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 07:41: модулі не вище ліхтаря, «саме по доміку»; чи є тоді тіні; модулі, що не входять у стрінги, — напряму на світлодіоди в цеху замість світла ліхтаря. Геометрія — розріз 1-1, ліхтар 2,87 м.</div>
<div class="tiles"><div class="tile"><div class="v">{K['places']}</div><div class="k">місць на 4 ліхтарях при гребені 1,5 м (альбомно, по 1 на схил)</div></div>
<div class="tile"><div class="v">{nf(K['mwh'], 1)}</div><div class="k">МВт·год за рік — {K['n']} модулів у {K['st']} стрінгах</div></div>
<div class="tile"><div class="v">−{nf(K['roof_loss'], 1)}</div><div class="k">МВт·год тінь на модулі даху (у «доміку» −{nf(KG['roof_loss'], 1)})</div></div>
<div class="tile"><div class="v">{K['left']}</div><div class="k">модулів поза стрінгами — {nf(K['left_mwh'], 1)} МВт·год на освітлення</div></div></div>
<div class="key"><b>Коротко</b><ul>
<li><b>Чи влізе книжково, вирішує висота ліхтаря.</b> Схил = √(1,435² + h²). Модуль 2 384 мм лягає по схилу лише тоді, коли гребінь ліхтаря ≥ 1,93 м (схил ≥ 2,44 м). При нашій оцінці 1,5 м схил 2,08 м: книжково модуль вилазить за край ліхтаря на 0,3 м і впирається в покрівлю. Тому — <b>альбомно, один модуль на схил</b> (1 303 мм по схилу, 2 384 уздовж ліхтаря, крок 2 406): {K['places']} місць замість 318. Якщо ліхтар ≥ 1,93 м — книжково, 318 місць.</li>
<li><b>Тіні є, але малі.</b> Схили розходяться від гребеня — модулі сходу і заходу один одного не затіняють. Схід втрачає 0,2–0,3 %, захід на Л2–Л4 — 1,5–4 % (західна будівля ввечері). Західний схил Л1 — {nf(K['perlan'][0]['W'], 0)} %: до західної будівлі ≈10 м. Модулі даху: «по ліхтарю» додають до тіні самого ліхтаря лише висоту рейки й модуля (0,15 м) — −{nf(K['roof_loss'], 1)} МВт·год, найбільше {nf(K['roof_max'], 1)} % на модуль. У «доміку» було −{nf(KG['roof_loss'], 1)}.</li>
<li><b>Що виграємо без рами над ліхтарем:</b> вітер і сніг — як на самому ліхтарі (сніг з нього і так сходить на покрівлю), нічого не виступає вище ліхтаря; при альбомному розташуванні низ кожного схилу (0,74 м, третина) лишається відкритим — частина денного світла в цех.</li>
<li><b>Що втрачаємо:</b> при гребені 1,5 м — майже половину модулів: +{nf(K['net'], 1)} МВт·год чистими проти +{nf(KG['net'], 1)} у «доміку».</li></ul></div>
<img src="lan_flush_sec_v2.png" style="margin-bottom:2mm">
<table><tr><th>Варіант</th><th class="n">Гребінь ліхтаря, м</th><th>Модуль, кут</th><th class="n">Місць</th><th class="n">У стрінгах / стрінгів</th><th class="n">МВт·год</th><th class="n">кВт·год/кВтп</th><th class="n">Тінь на дах</th><th class="n">Чистими</th><th class="n">Поза стрінгами: шт · МВт·год</th></tr>{VT}</table>
<p class="src">«Домік» майже не залежить від висоти ліхтаря, поки гребінь нижче ≈1,8 м. «По схилах» залежить сильно — тому ліхтар треба обміряти: висота гребеня, ширина, чи однакові всі 4.</p>
<div class="pb"></div><div class="two"><div><b>По ліхтарях (гребінь 1,5 м, альбомно)</b>
<table><tr><th>Ліхтар</th><th class="n">Місць</th><th class="n">Тінь схід</th><th class="n">Тінь захід</th><th class="n">кВт·год/кВтп схід / захід</th><th class="n">МВт·год</th></tr>{PT}</table></div>
<div><b>Кріплення</b><p class="src" style="margin-top:1mm">Альбомно на схилі: 2 рейки вгору-вниз по схилу (поперек довгої сторони), притиски на довгих сторонах на 540 мм від кінців — за інструкцією ZNSHINE. Кріпити до каркаса ліхтаря (чи витримає — <b>немає в даних</b>) або до легкої рами на покрівлі, що повторює схили. Кут 46° — погодити з ZNSHINE.</p></div></div>
<h2>Ідея: модулі поза стрінгами — напряму на світлодіоди в цеху</h2>
<p>Модуль, що не входить у стрінг, через свій драйвер живить світильник під ліхтарем: є сонце — світить, нема — ні. Це відома схема «сонячної денної лампи» (модуль → MPPT → світлодіоди, без акумулятора), а гібридний варіант — драйвер бере спершу від модуля, решту доливає з мережі до заданої освітленості — описано в патенті US 10 652 964 (Energy Bank, 2020).</p>
<p><b>Скільки світла дає один модуль на схилі ліхтаря 46°</b> — середня потужність з 8 до 17 год, схід і захід навпіл, без тіні:</p>
<table>{LT}</table>
<p class="src">Оцінка: світлодіоди з драйвером 150 лм/Вт; {LUX} лк на робочій поверхні; коефіцієнт використання 0,6, експлуатації 0,8 → {nf(need)} лм на 1 м². Норма освітленості для цеху залежить від розряду зорових робіт (ДБН В.2.5-28) — <b>немає в даних</b>, 300 лк взято для прикладу. «У середньому» — з частками ясних і хмарних днів місяця (Meteonorm 8.1).</p>
<div class="key"><b>Моя оцінка</b><ul>
<li><b>Масштаб.</b> {NL} модулів поза стрінгами в середньому за червневий робочий день освітлюють ≈{nf(jun, -2 if False else 0)} м² на {LUX} лк — це приблизно зона під одним ліхтарем (≈{nf(zone1)}–{nf(zone)} м²). У грудні — ≈{nf(dec)} м². Щоб так само замінити світло всіх 4 ліхтарів (≈{nf(zall)} м²), улітку потрібно ≈{nf(zall / per)} модулів, узимку — у 5 разів більше. Тобто це доповнення, а не заміна основного освітлення.</li>
<li><b>Що справді добре:</b> (1) світло йде за сонцем, як від ліхтаря, без жодної автоматики; (2) не залежить від мережі, PCS і батареї — при відключеннях у цеху лишається «денне» світло; (3) кожен модуль працює сам на себе — тінь чи інша орієнтація одного не шкодить іншим, тому годяться і модулі поза стрінгами, і місця біля західної стіни, які ми прибрали через тінь (157 місць, тінь 15–51 %); (4) безпечна напруга: модуль дає Vmp 41,7 В, Voc 49,5 В (паспорт ZNSHINE) — у цех не заходить 600 В постійного.</li>
<li><b>Що заважає:</b> (1) світло стрибає з хмарами — основне освітлення з датчиками природного світла потрібне все одно; краще одразу гібридні драйвери з доливанням з мережі; (2) узимку, коли світла треба найбільше, модуль на 46° схід/захід дає в 5 разів менше; (3) у вихідні світло горітиме даремно або згасне разом з енергією, тоді як через основну систему ці кВт·год пішли б у навантаження чи батарею (режим роботи цеху — <b>немає в даних</b>); (4) драйверів з MPPT під один модуль без акумулятора серійно для промисловості мало — підбирати, ціна <b>немає в даних</b>; (5) окремий кабель і прохід крізь покрівлю від кожного модуля.</li>
<li><b>За енергією</b> різниці майже немає: ті самі ≈{nf(K['left_mwh'] * 1000 / K['left'])} кВт·год на модуль за рік або йдуть у світильник напряму (без інвертора — на ≈5–8 % менше втрат перетворення), або через PCS у мережу заводу. Виграш ідеї — не в кВт·год, а в тому, що вона повертає цеху «світло з даху» і працює без мережі.</li>
<li><b>Головне питання — норми.</b> Світло світлодіодів не зараховується як природне. Якщо ліхтарі світлопрозорі, а в цеху постійні робочі місця, повністю закрити ліхтарі може не дозволити проєктант (природне освітлення за ДБН В.2.5-28). Альбомний варіант «по схилах» лишає третину схилу відкритою — це на користь.</li></ul></div>
<div class="warn"><b>Що потрібно, щоб вибрати</b><ol>
<li>Обміряти ліхтар: висота гребеня (від неї — альбомно 170 чи книжково 318 місць), кут схилів, ширина, чи однакові всі 4.</li>
<li>Чим заповнені ліхтарі (скло, полікарбонат, метал) і чи є в них фрамуги чи клапани димовидалення. Якщо ліхтарі глухі — замінювати світло нема чого, тоді ліхтар — просто місце під модулі, і вигідніший «домік» (+{nf(KG['net'], 1)}).</li>
<li>Режим роботи цеху (зміни, вихідні) і потрібна освітленість — для оцінки освітлення від модулів.</li>
<li>Каркас ліхтаря — чи можна кріпити до нього, чи потрібна окрема рама на покрівлі.</li></ol></div>
<h2>Як рахували</h2><p class="src">Модель розкладки даху 27.10 (розріз 1-1): цифрова модель висот 0,25 м, ліхтар — двосхила призма 2,87 м з гребенем 1,0 / 1,5 / 2,0 м; модулі на схилах 0,12 м над ними додано в модель — пораховано тінь на них і від них на 1 936 модулів даху. Meteonorm 8.1, крок 10 хв; ZNSHINE ZXN8-BD132-730, U 20, втрати ≈13 %, без тильної сторони. Стрінги по 11 окремо для сходу й заходу; поза стрінгами — найслабші місця.</p>
</body></html>'''
open(D + 'lan_flush_v2.html', 'w', encoding='utf-8').write(H)
OUTF = '/home/claude/work/sun/Розрахунок_варіанта_модулі_по_схилах_ліхтарів_і_освітлення_від_модулів_Антарес_27.10.2026.pdf'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + D + 'lan_flush_v2.html'); await pg.wait_for_timeout(800)
        await pg.pdf(path=OUTF, format='A4', print_background=True, margin={'top': '13mm', 'bottom': '15mm', 'left': '15mm', 'right': '13mm'},
                     display_header_footer=True, header_template='<div></div>', footer_template='<div style="font-family:DejaVu Sans;font-size:6.5pt;color:#5b6770;width:100%;padding:0 13mm 0 15mm;display:flex;justify-content:space-between"><span>Антарес — модулі по схилах ліхтарів і освітлення від модулів · E-Systems · 27.10.2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')
        await b.close()
asyncio.run(main()); print('ok', OUTF, round(jun), round(dec), round(per, 1), round(zall), round(zall / per), mix[5], mix[11])
