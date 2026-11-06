"""Дані розділу «Економіка» 3D-двійника з розрахунку ses-uze-modul (obiekty/antares → vyhid).

python3 eko_twin.py [шлях до ses-uze-modul]  →  ../../obj/src/ekodata.js
"""
import csv, json, sys
from pathlib import Path

M = Path(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ses-uze-modul')
V = M / 'vyhid'
J = json.loads((V / 'antares_rezultat.json').read_text(encoding='utf-8'))
rows = list(csv.DictReader(open(V / 'antares_varianty.csv', encoding='utf-8')))[1:]
en = {(r['variant'], r['rezhym']): r for r in rows}
pas = {r['field_code']: r for r in csv.DictReader(open(M / 'obiekty/antares/pasport.csv', encoding='utf-8'))}
num = lambda k: float(pas[k]['value']) if pas[k]['value'] else None
MODES = [('zero', 'Нульовий експорт'), ('lim', 'Обмежена видача'), ('full', 'Повна видача')]
NAME = {'min': 'Лише СЕС', 'half': 'Половина СЕС', 'max': 'Весь об\'єкт', 'opt': 'Оптимальний', 'plan': 'Етап 1'}
var = {}
for v in J['varianty']:
    m = next(k for k, t in MODES if t == v['rezhym'])
    e = en[(v['nazva'], v['rezhym'])]
    f = lambda k: round(float(e[k]), 1)
    var.setdefault(m, {})[v['kod']] = {
        'n': NAME.get(v['kod'], v['nazva']), 'pv': v['pv_kwp'], 'nb': v['n_bess'], 'cap': v['capex'], 'ef': v['efekt'], 'npv': v['npv'],
        'irr': round(v['irr'] * 100, 1) if v['irr'] is not None else None, 'ok': round(v['okupnist'], 2) if v['okupnist'] else None,
        'om': v['roky'][0][2], 'cum': [-v['capex']['razom']] + [r[4] for r in v['roky']], 'zam': [r[0] for r in v['roky'] if r[3]],
        'ses': f('ses_mwh'), 'vl': f('ses_vlasne_mwh'), 'out': f('vidpusk_mwh'), 'grid': f('vidbir_mwh'), 'dis': f('uze_rozriad_mwh'), 'cyc': round(float(e['tsykly_rik']))}
R = J['rekomendovano_z_vydacheiu']
dat = {
    'date': J['data'], 'period': J['period'], 'rec': {'mode': next(k for k, t in MODES if t == R['rezhym']), 'kod': 'max'},
    'modes': MODES, 'var': var, 'cons': num('annual_consumption_mwh'),
    'sens': J['chutlyvist'], 'hist': J['istoriia'],
    'ass': [
        ['Споживання', f"{num('annual_consumption_mwh'):,.0f} МВт·год на рік зі слів власника — рівномірно {num('annual_consumption_mwh')*1000/8760:,.0f} кВт щогодини; погодинних даних і графіка роботи немає".replace(',', ' ')],
        ['Ціни', f"РДН погодинно {J['period'][0]} – {J['period'][1]} + передача, диспетчеризація і розподіл на дату кожної доби; надбавки постачальника немає в даних"],
        ['Курс', f"{num('fx_rate_uah_usd'):.2f} грн/$ (НБУ, {pas['fx_rate_date']['value'] if 'fx_rate_date' in pas else '01.10.2026'})".replace('.', ',', 1)],
        ['Капвитрати', f"СЕС {num('capex_pv_usd_kwp'):,.0f} $/кВтп, контейнер УЗЕ {num('capex_bess_usd_unit'):,.0f} $, EMS {num('capex_ems_usd'):,.0f} $ — кошторис під ключ 26.10.2026, без ПДВ".replace(',', ' ')],
        ['Накопичувачі', f"{int(num('plan_bess_units'))} × {num('bess_unit_kw'):.0f} кВт / {num('bess_unit_kwh'):,.0f} кВт·год, розряд до {num('bess_dod_pct'):.0f} %, ККД циклу {num('bess_rte_pct'):.0f} %, {num('bess_cycles_per_day'):.0f} цикл на добу; заміна через {num('bess_life_years'):.0f} років; заряд з мережі вважається дозволеним — потрібне підтвердження ДТЕК".replace(',', ' ')],
        ['Видача в мережу', f"ТУ немає — обмежена видача рахується як сценарій до {num('export_limit_scenario_kw'):,.0f} кВт за ціною РДН".replace(',', ' ')],
        ['Фінанси', f"горизонт {num('horizon_years'):.0f} років, ставка {num('discount_rate_pct'):.0f} %, деградація модулів {num('pv_degradation_pct_yr'):.1f} % на рік, експлуатація {num('om_pct_capex_yr'):.2f} % капвитрат на рік".replace('.', ',')],
        ['Не враховано', 'реактивна енергія, резерв від відключень, ПДВ, мито, кредит, небаланси, власне споживання УЗЕ'],
    ],
    'need': ['Погодинні дані АСКОЕ за 12–36 місяців по трьох точках обліку', 'Договір постачання і рахунки: тип ціни, надбавка, що входить у ціну',
             'Дозвіл ДТЕК на заряд УЗЕ з мережі і договірна потужність', 'ТУ на видачу або відповідь ОСР', 'Паспорт контейнера Golen: глибина розряду, ККД, ресурс'],
}
L58 = V / 'antares_58_1.json'   # арбітраж з пільгою ч. 10 ст. 58-1 (ses_uze/pilga_58_1.py)
if L58.exists(): dat['law'] = json.loads(L58.read_text(encoding='utf-8'))
out = Path(__file__).resolve().parents[2] / 'obj' / 'src' / 'ekodata.js'
out.write_text('// Розділ «Економіка»: розрахунок ses-uze-modul ' + J['data'] + ' (calc/eko/eko_twin.py)\nconst EKO=' + json.dumps(dat, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(out, out.stat().st_size, 'B;', {m: list(v) for m, v in var.items()})
