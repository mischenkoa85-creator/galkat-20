"""Східний фасад без вертикальних модулів — лишається лише козирок 25° (власник 06.11.2026).

Власник 06.11, 11:28: «прибери з восточної фасади повністю панелі… тільки козирок залишити — вони там нічого не генерують».
Вертикальні модулі сходу — 132 шт., 96,36 кВтп, 568 кВт·год/кВтп (козирок — 967, південний фасад — 772).

Бере поточний розрахунок фасадів (obj/src/facpvdata.js, calc/fac_v2.py) і прибирає вертикальні модулі сходу:
- obj/src/facpvdata.js — модулі, підсумки, стрінги, помісячна генерація, кріплення вертикальних модулів;
- calc/ep04/data.json → fac — те саме для розрахунку електрики і кошторису (ep_opt.py і далі).
Повторний запуск нічого не змінює. Далі — порядок calc/ep04 (README, «06.11 — східний фасад»).

python3 fac_bez_skhodu_vert.py
"""
import json
from pathlib import Path

R = Path(__file__).resolve().parents[1]
JS = R / 'obj' / 'src' / 'facpvdata.js'
DJ = R / 'calc' / 'ep04' / 'data.json'
MP = 0.73
NOTE = '06.11.2026: власник — східний фасад вертикально прибрано, лишився козирок 25° (132 модулі, 96,36 кВтп, 568 кВт·год/кВтп)'


def chystyty(F: dict) -> dict:
    F = dict(F)
    ev = [m for m in F['vert'] if m[0] == 'E']
    if not ev and F.get('ev_off'):
        return F
    F['vert'] = [m for m in F['vert'] if m[0] != 'E']
    T = {k: dict(v) for k, v in F['tot'].items()}
    T['Ev'] = dict(n=0, kwp=0.0, kwh=0, kwh_kwp=0)
    sm = lambda n, kwh: dict(n=n, kwp=round(n * MP, 2), kwh=kwh, kwh_kwp=round(kwh / max(1, n * MP)))
    T['E'] = sm(T['Ec']['n'], T['Ec']['kwh'])
    T['all'] = sm(T['S']['n'] + T['Ec']['n'], T['S']['kwh'] + T['Ec']['kwh'])
    if 'rm' in T:
        T['rm'] = dict(T['rm'], Ev_str=0, E_bottom=0, E_between=0, E_rows_kwh=0)
    F['tot'] = T
    if 'strings' in F:
        F['strings'] = dict(F['strings'], Ev=0)
    if 'mo' in F:
        F['mo'] = dict(F['mo'], Ev=[0] * 12)
    nV = len(F['vert']); nL = sum(1 for m in F['vert'] if m[3] > 2)
    F['vmount'] = dict(F['vmount'], rails=nV * 2, rail_m=round(nV * 2.8), anchors=nV * 4, nL=nL, nP=nV - nL)
    F['ev_off'] = NOTE
    return F


s = JS.read_text(encoding='utf-8')
F = json.loads(s[s.index('=') + 1:s.rstrip().rindex(';')])
F2 = chystyty(F)
JS.write_text('const FACPV=' + json.dumps(F2, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
D = json.loads(DJ.read_text(encoding='utf-8'))
fac = chystyty(D['fac'])
D['fac'] = {k: fac[k] for k in D['fac']}           # той самий склад ключів, що був у data.json
DJ.write_text(json.dumps(D, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
T = F2['tot']
print(f"фасади: південь {T['S']['n']} + козирок {T['Ec']['n']} = {T['all']['n']} модулів, {T['all']['kwp']} кВтп, {T['all']['kwh'] / 1000:.1f} МВт·год; "
      f"стрінги {F2['strings']}; вертикальних {len(F2['vert'])}")
