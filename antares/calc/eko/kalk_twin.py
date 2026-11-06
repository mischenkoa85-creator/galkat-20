"""Дані підрозділу «Гроші → Сценарії» 3D-двійника з калькулятора ses-uze-modul (ses_uze.kalkuliator, сценарії споживання).

У ses-uze-modul:  python3 -m ses_uze.kalkuliator obiekty/antares --stsenarii "spozhyvannia_kwh_rik=1100000|3000000|5000000"
Тут:              python3 kalk_twin.py [шлях до ses-uze-modul]  →  ../../obj/src/kalkdata.js
"""
import json
import sys
from pathlib import Path

M = Path(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ses-uze-modul')
S = json.loads((M / 'vyhid' / 'antares_kalk_stsenarii.json').read_text(encoding='utf-8'))
J0 = S['stsenarii'][0]
V = {k: d['znachennia'] for k, d in J0['vhid'].items()}
P = {k: d['prymitka'] for k, d in J0['vhid'].items()}
KEEP = ('n', 'rezhym', 'pilga', 'capex', 'efekt_usd', 'efekt_ses_usd', 'okupnist', 'npv', 'irr', 'tsykly_rik', 'dni', 'dni_2_po_misiatsiakh',
        'zamina_roky', 'spred_uah_kwh', 'pryrist')
dat = {
    'date': J0['data'], 'period': J0['period'], 'versiia': J0['versiia'], 'kliuch': S['kliuch'],
    'vidbytky': [J['vidbytok'] for J in S['stsenarii']], 'znos': J0['znos_uah_kwh'],
    'in': {k: V[k] for k in ('ses_kwp', 'kurs', 'capex_ses_usd_kwp', 'capex_uze_usd', 'capex_ems_usd', 'uze_zamina_usd', 'uze_resurs_tsykliv', 'uze_strok_rokiv',
                             'uze_kw', 'uze_kwh', 'uze_dod_pct', 'uze_kkd_pct', 'uze_tsykliv_doba', 'zyma_lito_pct', 'vydacha_stsenarii_kw', 'pilga_58_1',
                             'horyzont_rokiv', 'stavka_pct', 'dogovirna_kw')},
    'pr': {k: P[k] for k in ('capex_uze_usd', 'uze_zamina_usd', 'uze_resurs_tsykliv', 'pilga_58_1')},
    'dzh': J0['dzherela'],
    'sc': [{'mwh': J['spozhyvannia']['mwh'], 'kw': J['spozhyvannia']['kw_serednie'], 'kwm': J['spozhyvannia']['po_misiatsiakh_kw'],
            'var': [dict({k: x.get(k) for k in KEEP}, mwh={k: x['mwh'][k] for k in ('px', 'bx', 'pc', 'gb', 'pb', 'bl')}) for x in J['varianty']]}
           for J in S['stsenarii']],
}
out = Path(__file__).resolve().parents[2] / 'obj' / 'src' / 'kalkdata.js'
out.write_text('// Гроші → Сценарії: калькулятор ses-uze-modul ' + dat['date'] + ' (calc/eko/kalk_twin.py)\nconst KALK=' +
               json.dumps(dat, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(out, out.stat().st_size, 'B;', [s['mwh'] for s in dat['sc']], [(v['n'], v['rezhym']) for v in dat['sc'][0]['var']])
