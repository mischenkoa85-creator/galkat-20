# -*- coding: utf-8 -*-
"""PDF кошторису СЕС АБК, варіант «ДБН», українською й англійською — із перерахованого xlsx (ті самі числа, що в Excel)."""
import openpyxl, asyncio, html, json
from playwright.async_api import async_playwright
D = '/home/claude/work/abk_kosh/'
RJ = json.load(open(D + 'rows_dbn.json')); XN = RJ['XN']; KR = RJ['KR']; ROW = RJ['ROW']
wb = openpyxl.load_workbook(D + XN + '.xlsx', data_only=True)
K, P, T, SP = wb['Кошторис'], wb['Параметри'], wb['Стрінги'], wb['Специфікація']
e = lambda x: html.escape(str(x)) if x is not None else ''
def nf(x, d=0):
    if x is None or x == '': return ''
    if isinstance(x, str): return e(x)
    return f'{x:,.{d}f}'.replace(',', ' ').replace('.', ',')
def qty(x):
    if isinstance(x, (int, float)) and abs(x - round(x)) > 1e-9: return nf(x, 2).rstrip('0').rstrip(',')
    return nf(x)
def pct(x): return (nf(x * 100) if abs(x * 100 - round(x * 100)) < 1e-9 else nf(x * 100, 1)) + ' %'
h = lambda k: K[f'H{KR[k]}'].value
pv = lambda k: P[f'B{ROW[k]}'].value
rows = []
for r in range(6, KR['pkwp'] + 1):
    v = [K.cell(r, c).value for c in range(1, 10)]
    if all(a is None for a in v): continue
    no, uk, en, u, q, pr, mt, s, src = v
    if no and uk is None:
        rows.append(f'<tr class="sec"><td colspan="7">{e(no)}<span class="en">{e(en)}</span></td></tr>'); continue
    if no is None:
        cls = 'grand' if (uk.startswith('СОБІВАРТІСТЬ') or 'ПІД КЛЮЧ' in uk) else ('vat' if uk.startswith('ПДВ') else 'tot')
        rows.append(f'<tr class="{cls}"><td></td><td colspan="4">{e(uk)}<span class="en">{e(en)}</span></td><td class="n">{nf(s)}</td><td></td></tr>'); continue
    isp = q is None and isinstance(pr, float) and pr < 1.5
    prs = (pct(pr) if pr < 1 else nf(pr, 4)) if isp else ('—' if pr == 0 else nf(pr, 2) if isinstance(pr, float) and abs(pr - round(pr)) > 1e-9 and pr < 1000 else nf(pr))
    dstr = '' if no in ('6.1', '6.2', '2.1', '3.3', '3.4') or not isinstance(mt, (int, float)) or mt == 0 else pct(mt)
    rows.append(f'<tr><td>{e(no)}</td><td>{e(uk)}<span class="en">{e(en)}</span></td><td class="c">{e(u)}</td><td class="n">{qty(q) if q is not None else ""}</td>'
                f'<td class="n{" gap" if pr == 0 else ""}">{prs}</td><td class="n b">{nf(s) if s else "—"}</td><td class="bs">{e(src)}{(" · мито / duty " + dstr) if dstr else ""}</td></tr>')
SEC = [('Закупівля в Китаї', 'Purchase in China', 't1'), ('Комісія', 'Commission', 't2'), ('Доставка, страхування, мито', 'Delivery, insurance, duty', 't3'),
       ('Купуємо в Україні', 'Purchased in Ukraine', 't4'), ('Роботи', 'Works', 't5'), ('Запас і винагорода', 'Contingency and fee', 't6')]
tot = h('tot')
srow = ''.join(f'<tr><td>{a}<span class="en">{b}</span></td><td class="n">{nf(h(k))}</td><td class="n">{nf(h(k) / tot * 100, 1)} %</td></tr>' for a, b, k in SEC)
eff = ''
for uk, en, k, d in (('Генерація модулів за рік (DC)', 'Annual module yield (DC)', 'e_dc', 1), ('На виході інвертора', 'Inverter AC output', 'e_ac', 1), ('Питома генерація, кВт·год/кВтп', 'Specific yield, kWh/kWp', 'e_y', 0),
                     ('Економія за перший рік, $ без ПДВ', 'First-year savings, USD excl. VAT', 'e_rev', 0), ('Проста окупність, років', 'Simple payback, years', 'e_pb', 1), ('Під ключ на 1 МВт·год за рік, $', 'Turnkey per 1 MWh/year, USD', 'e_mwh', 0)):
    unit = ' МВт·год' if k in ('e_dc', 'e_ac') else ''
    eff += f'<tr><td>{uk}<span class="en">{en}</span></td><td class="n">{nf(h(k), d)}{unit}</td></tr>'
# специфікація
spr = []
for r in range(5, SP.max_row + 1):
    v = [SP.cell(r, c).value for c in range(1, 8)]
    if all(a is None for a in v): continue
    no, uk, en, u, q, ref, src = v
    if uk is None: spr.append(f'<tr class="sec"><td colspan="6">{e(no)}<span class="en">{e(en)}</span></td></tr>'); continue
    spr.append(f'<tr><td>{e(no)}</td><td>{e(uk)}<span class="en">{e(en)}</span></td><td class="c">{e(u)}</td><td class="n b">{qty(q)}</td><td class="c">{e(ref)}</td><td class="bs">{e(src)}</td></tr>')
# стрінги
r2 = RJ['r2']; v = [T.cell(r2 + 1, c).value for c in range(1, 13)]
ok = lambda s: f'<span class="{"ok" if s.startswith("так") else "no"}">{"✓" if s.startswith("так") else "✗"}</span>'
chk = (f'<tr><td>{e(v[0])}</td><td class="n">{v[1]}</td><td class="n">{nf(v[2], 1)} {ok(v[3])}</td><td class="n">{nf(v[4], 1)} {ok(v[5])}</td>'
       f'<td class="n">{nf(v[6], 1)} {ok(v[7])}</td><td class="n">{nf(v[8], 1)} {ok(v[9])}</td><td class="n">{nf(v[10], 1)} {ok(v[11])}</td></tr>')
st = ''
r = RJ['r3'] + 1
while T.cell(r, 1).value:
    v = [T.cell(r, c).value for c in range(1, 13)]
    if str(v[0]).startswith('Разом'):
        st += f'<tr class="tot"><td>Разом / Total</td><td></td><td class="n">{v[2]}</td><td></td><td></td><td></td><td class="n">{nf(v[6], 1)}</td><td></td><td class="n">{nf(v[8], 0)}</td><td class="n">{nf(v[9], 0)}</td><td class="n">{nf(v[10], 0)}</td><td class="n">{nf(v[11], 0)}</td></tr>'; break
    st += (f'<tr><td>{e(v[0])}</td><td class="c">{v[1]}</td><td class="n">{v[2]}</td><td>{e(v[3])}</td><td>{e(v[4])}</td><td class="n">{nf(v[5], 1)}</td><td class="n">{nf(v[6], 2)}</td>'
           f'<td class="n">{nf(v[7], 1)}</td><td class="n">{nf(v[8], 1)}</td><td class="n">{nf(v[9], 1)}</td><td class="n">{nf(v[10], 1)}</td><td class="n">{nf(v[11], 0)}</td></tr>')
    r += 1
notes = []
r = KR['e_mwh'] + 1
while r <= K.max_row:
    t = K[f'B{r}'].value
    if isinstance(t, str): notes.append(t)
    r += 1
nt = ''.join(f'<div class="note">• {e(notes[i])}<span class="en">{e(notes[i + 1])}</span></div>' for i in range(0, len(notes) - 1, 2))
HT = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Кошторис СЕС АБК Антарес ДБН</title><style>
@page {{ size:A4 landscape; margin:10mm 11mm 11mm 12mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:7.1pt; line-height:1.25; color:#1d2a33; margin:0; }}
h1 {{ font-size:12.5pt; margin:0; color:#123044; }} .h1en {{ font-size:10pt; color:#4d5c66; margin:1px 0 3px; font-weight:bold; }}
h2 {{ font-size:9.4pt; margin:9px 0 4px; color:#123044; }} h2 .en {{ display:inline; margin-left:6px; font-size:8pt; }}
.sub {{ color:#5b6b76; font-size:7.1pt; margin-bottom:5px; }}
.en {{ display:block; color:#6a7881; font-size:6.5pt; font-style:italic; font-weight:normal; }}
table {{ border-collapse:collapse; width:100%; }} td, th {{ border-bottom:0.4pt solid #d5dde2; padding:1.6px 4px; vertical-align:top; }}
th {{ background:#e8eef2; text-align:left; font-weight:bold; font-size:6.8pt; border-bottom:0.8pt solid #9fb1bd; }}
th .en {{ display:inline; font-size:6.2pt; }}
.n {{ text-align:right; white-space:nowrap; }} .c {{ text-align:center; }} .b {{ font-weight:bold; }}
.bs {{ color:#4d5c66; font-size:6.4pt; }}
tr.sec td {{ background:#f2f5f7; font-weight:bold; color:#123044; padding-top:3px; border-bottom:0.6pt solid #9fb1bd; }}
tr.sec .en {{ display:inline; margin-left:8px; }}
tr.tot td {{ font-weight:bold; border-bottom:0.8pt solid #9fb1bd; }} tr.tot .en, tr.grand .en, tr.vat .en {{ display:inline; margin-left:8px; }}
tr.grand td {{ font-weight:bold; background:#e3edf3; font-size:7.8pt; border-bottom:0.8pt solid #6f8796; }}
tr.vat td {{ color:#4d5c66; }} td.gap {{ background:#fff3c4; }}
.kpi {{ display:flex; gap:7px; margin:5px 0 7px; }} .k {{ flex:1; border:0.6pt solid #c9d4db; border-radius:4px; padding:4px 7px; }}
.k b {{ display:block; font-size:10.5pt; color:#123044; }} .k span {{ color:#5b6b76; font-size:6.6pt; }}
.two {{ display:flex; gap:14px; }} .two > div {{ flex:1; }}
.note {{ color:#4d5c66; font-size:6.8pt; margin:3px 0; }}
.ok {{ color:#1d6b40; font-weight:bold; }} .no {{ color:#b3261e; font-weight:bold; }}
.pb {{ page-break-before:always; }}
</style></head><body>
<h1>Кошторис будівництва під ключ — СЕС на даху АБК, ТОВ МК «Антарес», варіант «ДБН»</h1>
<div class="h1en">Turnkey construction estimate — rooftop PV plant on the administrative building, Antares LLC, DBN-compliant option</div>
<div class="sub">Інвертор Deye SUN-100K-G03 (100 кВт, 6 MPPT, DC до 1 000 В), {nf(pv("N"))} модулів ZNSHINE ZXN8-BD132-730 у {nf(pv("ST"))} стрінгах по {nf(pv("LS"))}; драбини П1, огородження 0,6 м, ходові доріжки. 28.10.2026, $ без ПДВ. E-Systems.
<span class="en">Inverter Deye SUN-100K-G03 (100 kW, 6 MPPT, DC up to 1000 V), {nf(pv("N"))} ZNSHINE modules in {nf(pv("ST"))} strings of {nf(pv("LS"))}; P1 ladders, 0.6 m guardrail, walkways. 28 Oct 2026, USD excl. VAT.</span></div>
<div class="kpi">
<div class="k"><span>Модулів / потужність · Modules / capacity</span><b>{nf(pv("N"))} шт. · {nf(pv("KWP"), 2)} кВтп</b><span>арка {nf(pv("NA"))}, нижній дах {nf(pv("NL"))}, надбудова {nf(pv("NN"))}, стіни {nf(pv("NW"))}</span></div>
<div class="k"><span>Під ключ без ПДВ · Turnkey excl. VAT</span><b>{nf(tot)} $</b><span>{nf(h("pkwp"))} $/кВтп · USD/kWp</span></div>
<div class="k"><span>З ПДВ 20 % · Incl. VAT 20 %</span><b>{nf(h("totv"))} $</b><span>з пільгою «245» · with "245": {nf(h("tot245"))} $</span></div>
<div class="k"><span>Генерація за рік · Annual yield</span><b>{nf(h("e_ac"), 1)} МВт·год</b><span>{nf(h("e_y"))} кВт·год/кВтп · kWh/kWp</span></div>
<div class="k"><span>Окупність без ПДВ · Payback excl. VAT</span><b>{nf(h("e_pb"), 1)} року · years</b><span>економія {nf(h("e_rev"))} $ за рік · savings per year</span></div>
</div>
<div class="two"><div>
<h2>Підсумок за розділами, $ без ПДВ<span class="en">Summary by section, USD excl. VAT</span></h2>
<table><tr><th>Розділ <span class="en">Section</span></th><th class="n">$</th><th class="n">Частка <span class="en">Share</span></th></tr>{srow}
<tr class="grand"><td>Разом під ключ без ПДВ<span class="en">Total turnkey excl. VAT</span></td><td class="n">{nf(tot)}</td><td class="n">100 %</td></tr></table>
</div><div>
<h2>Ефект для АБК<span class="en">Effect for the building</span></h2>
<table><tr><th>Показник <span class="en">Indicator</span></th><th class="n">«ДБН» · DBN</th></tr>{eff}</table>
<div class="note">1 кВт·год — {nf(pv("TAR"), 2)} грн з ПДВ ({nf(h("e_val") * 100, 2)} ¢ без ПДВ), {nf(pv("FX"), 2)} грн/$; ККД інвертора {pct(pv("ETA"))}. Генерація — повна модель K1: Meteonorm 8.1, тіні DSM, байпас-діоди.<span class="en">1 kWh = UAH {nf(pv("TAR"), 2)} incl. VAT; inverter Euro efficiency {pct(pv("ETA"))}. Yield from the full K1 model: Meteonorm 8.1, DSM shading, bypass diodes.</span></div>
</div></div>
<h2>Кошторис по позиціях<span class="en">Estimate by item</span></h2>
<table><tr><th style="width:3.5%">№</th><th style="width:41%">Позиція <span class="en">/ Item</span></th><th class="c" style="width:7%">Од. <span class="en">/ Unit</span></th><th class="n" style="width:5.5%">К-сть <span class="en">/ Qty</span></th><th class="n" style="width:7%">Ціна, $ <span class="en">/ Price</span></th><th class="n" style="width:7.5%">Сума, $ <span class="en">/ Amount</span></th><th>Підстава <span class="en">/ Basis</span></th></tr>
{''.join(rows)}</table>
{nt}
<div class="pb"></div>
<h2>Специфікація<span class="en">Bill of materials</span></h2>
<div class="sub">Кількості — з 3D-моделі АБК і розрахунку стрінгів; ціни — у кошторисі за рядком.<span class="en">Quantities from the 3D model and the string design; prices are in the estimate line shown.</span></div>
<table><tr><th style="width:3.5%">№</th><th style="width:47%">Позиція <span class="en">/ Item</span></th><th class="c" style="width:8%">Од. <span class="en">/ Unit</span></th><th class="n" style="width:5.5%">К-сть <span class="en">/ Qty</span></th><th class="c" style="width:7%">Рядок <span class="en">/ Line</span></th><th>Як пораховано <span class="en">/ Basis</span></th></tr>
{''.join(spr)}</table>
<div class="pb"></div>
<h2>Стрінги і MPPT інвертора Deye SUN-100K-G03<span class="en">Strings and MPPT of the Deye SUN-100K-G03</span></h2>
<div class="sub">Модуль: Voc 49,5 В, Vmp 41,7 В, Imp 17,51 А, Isc 18,51 А, Voc −0,25 %/K. Інвертор: DC до 1 000 В, старт 250 В, MPPT 200–850 В, 40 А (Isc 60 А) на MPPT, 6 MPPT по 2 стрінги.<span class="en">Module: Voc 49.5 V, Vmp 41.7 V, Imp 17.51 A, Isc 18.51 A. Inverter: DC up to 1000 V, start-up 250 V, MPPT 200–850 V, 40 A (Isc 60 A) per MPPT, 6 MPPT with 2 strings each.</span></div>
<table><tr><th>Перевірка <span class="en">Check</span></th><th class="n">Модулів <span class="en">Modules</span></th><th class="n">Voc −30 °C ≤ 1 000 В</th><th class="n">Vmp 70 °C ≥ 250 В</th><th class="n">Vmp −10 °C ≤ 850 В</th><th class="n">Imp на MPPT ≤ 40 А</th><th class="n">Isc на MPPT ≤ 60 А</th></tr>{chk}</table>
<table style="margin-top:6px"><tr><th>Стрінг</th><th class="c">MPPT</th><th class="n">Модулів</th><th>Де <span class="en">Where</span></th><th>Грані <span class="en">Faces</span></th><th class="n">Нахил, °</th><th class="n">МВт·год</th><th class="n">Невідп., %</th><th class="n">DC «+», м</th><th class="n">DC «−», м</th><th class="n">Перемички, м</th><th class="n">Не працює, модуле-год <span class="en">Bypassed, module-h</span></th></tr>{st}</table>
<div class="note">Не працює — модуль обходиться байпас-діодом, бо його струм нижчий за робочий струм стрінга (часткова тінь або інша орієнтація), за ясного неба, години на рік; стрінг працює, поки в роботі не менше 6 модулів (MPPT від 200 В). Пораховано для кожного кроку 10 хв розрахункових днів місяців (Meteonorm 8.1); по модулях і годинах — у 3D-моделі.<span class="en">Bypassed — the module current is below the string operating current (partial shade or different orientation), clear sky, hours per year; the string runs while at least 6 modules work (MPPT from 200 V). Computed for every 10-minute step of the monthly design days (Meteonorm 8.1); per module and hour — in the 3D model.</span></div>
</body></html>'''
open(D + 'abk_kosh_dbn.html', 'w', encoding='utf-8').write(HT)
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + D + 'abk_kosh_dbn.html'); await pg.wait_for_timeout(400)
        await pg.pdf(path=D + XN + '.pdf', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(run())
json.dump(dict(tot=tot, totv=h('totv'), tot245=h('tot245'), pkwp=h('pkwp'), e_ac=h('e_ac'), e_y=h('e_y'), e_rev=h('e_rev'), e_pb=h('e_pb'), cost=h('cost'),
               sec={k: h(k) for _, _, k in SEC}, lines={k: K[f'H{KR[k]}'].value for k in KR if K[f'A{KR[k]}'].value}),
          open('/home/claude/galkat-20/antares/abk/abk_est.json', 'w'), ensure_ascii=False, indent=0)
print('ok', D + XN + '.pdf')
