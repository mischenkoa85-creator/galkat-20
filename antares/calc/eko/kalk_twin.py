"""Дані розділу «Гроші» 3D-двійника з калькулятора ses-uze-modul (ses_uze.kalkuliator) — окупність, арбітраж, сценарії, обладнання.

У ses-uze-modul (генерація по етапах — obiekty/antares/ryady_etapiv.py, з груп цього двійника):
  D=2026-03-21,2026-06-21,2026-09-23,2025-12-21
  python3 -m ses_uze.kalkuliator obiekty/antares --stsenarii "spozhyvannia_kwh_rik=1100000|3000000|5000000" --doby $D
  python3 -m ses_uze.kalkuliator obiekty/antares --stsenarii "spozhyvannia_kwh_rik=1100000|3000000|5000000" --doby $D \\
      --zamist pv_ryad_fail=ryady_etap1.json --zamist ses_kwp=843.2 --zamist uze_n=0,4 --kod antares_etap1
Тут:  python3 kalk_twin.py [шлях до ses-uze-modul]  →  ../../obj/src/kalkdata.js
"""
import json
import sys
from pathlib import Path

M = Path(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ses-uze-modul')
VSE = json.loads((M / 'vyhid' / 'antares_kalk_stsenarii.json').read_text(encoding='utf-8'))
E1 = json.loads((M / 'vyhid' / 'antares_etap1_kalk_stsenarii.json').read_text(encoding='utf-8'))
J0 = VSE['stsenarii'][0]
V = {k: d['znachennia'] for k, d in J0['vhid'].items()}
P = {k: d['prymitka'] for k, d in J0['vhid'].items()}
KEEP = ('ses_kwp', 'n', 'rezhym', 'pilga', 'capex', 'efekt_usd', 'efekt_ses_usd', 'okupnist', 'npv', 'irr', 'tsykly_rik', 'dni',
        'dni_2_po_misiatsiakh', 'zamina_roky', 'spred_uah_kwh', 'pryrist')


def var(x):
    o = {k: x.get(k) for k in KEEP}
    o['mwh'] = x['mwh']
    o['om'] = x['roky'][0][2]
    o['cum'] = [-x['capex']['razom']] + [r[5] for r in x['roky']]
    if x['n']:                                   # погодинні потоки характерних діб — лише для варіантів з накопичувачами
        o['doby'] = {d: {k: f[k] for k in ('gb', 'pb', 'bl', 'bx', 'px', 'pc', 'soc')} for d, f in x['doby'].items()}
    return o


assert [J['spozhyvannia']['mwh'] for J in VSE['stsenarii']] == [J['spozhyvannia']['mwh'] for J in E1['stsenarii']]
dat = {
    'date': J0['data'], 'period': J0['period'], 'versiia': J0['versiia'], 'znos': J0['znos_uah_kwh'],
    'vidbytky': {'vse': [J['vidbytok'] for J in VSE['stsenarii']], 'e1': [J['vidbytok'] for J in E1['stsenarii']]},
    'in': {k: V[k] for k in ('ses_kwp', 'kurs', 'capex_ses_usd_kwp', 'capex_uze_usd', 'capex_ems_usd', 'uze_zamina_usd', 'uze_resurs_tsykliv', 'uze_strok_rokiv',
                             'uze_kw', 'uze_kwh', 'uze_dod_pct', 'uze_kkd_pct', 'uze_tsykliv_doba', 'zyma_lito_pct', 'grafik', 'vydacha_stsenarii_kw', 'pilga_58_1',
                             'horyzont_rokiv', 'stavka_pct', 'ekspl_pct', 'degr_ses_pct', 'dogovirna_kw')},
    'kwp': {'vse': VSE['stsenarii'][0]['varianty'][0]['ses_kwp'], 'e1': E1['stsenarii'][0]['varianty'][0]['ses_kwp']},
    'pr': {k: P[k] for k in ('capex_uze_usd', 'uze_zamina_usd', 'uze_resurs_tsykliv', 'pilga_58_1')},
    'dzh': {**J0['dzherela'], 'sontse_e1': E1['stsenarii'][0]['dzherela']['sontse']},
    'doby': {d: {k: x[k] for k in ('rdn', 'kupivlia', 'prodazh')} for d, x in J0['doby'].items()},
    'sc': [{'mwh': J['spozhyvannia']['mwh'], 'kw': J['spozhyvannia']['kw_serednie'], 'kwm': J['spozhyvannia']['po_misiatsiakh_kw'],
            'dl': {d: x['spozhyvannia'] for d, x in J['doby'].items()},
            'vse': [var(x) for x in J['varianty']], 'e1': [var(x) for x in J1['varianty']]}
           for J, J1 in zip(VSE['stsenarii'], E1['stsenarii'])],
}
L58 = M / 'vyhid' / 'antares_58_1.json'            # текст закону і перевірка — з ses_uze.pilga_58_1 (ZAKON)
if L58.exists():
    dat['zakon'] = json.loads(L58.read_text(encoding='utf-8'))['zakon']
out = Path(__file__).resolve().parents[2] / 'obj' / 'src' / 'kalkdata.js'
out.write_text('// Гроші: калькулятор ses-uze-modul ' + dat['date'] + ' (calc/eko/kalk_twin.py)\nconst KALK=' +
               json.dumps(dat, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(out, out.stat().st_size // 1024, 'KB;', [s['mwh'] for s in dat['sc']], [(v['n'], v['rezhym']) for v in dat['sc'][0]['vse']],
      [(v['n'], v['rezhym']) for v in dat['sc'][0]['e1']])
