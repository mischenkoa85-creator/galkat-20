"""«Кут і розміщення» для 3D-двійника: варіанти кута на даху цеху і фасадах (05.11.2026).

Клімат — паспорт Антареса в ses-uze-modul (Meteonorm, той самий, що в розрахунку поверхонь). Модель — ses_uze.soniachne:
радіація на площину з тінню рядів, виробіток (Huld, температура, кут падіння, втрати 14 %), крок рядів без тіні 21.12 опівдні.
Дах: поле розкладки В1 (1 826 модулів × крок 2,404 × 1,323 = площа поля), рахується як плаский — на арках фактична розкладка менша (оцінка).
Ціна СЕС до PCS, $/кВтп — лише де вузол уже пораховано (зведення 23.10: лага 0° і трикутники 15°, матеріали з Китаю + роботи, баласт за вітром);
для інших кутів ціни вузла немає — у двійнику «потрібно».
python3 kut_twin.py → ../../obj/src/kutdata.js
"""
import json, sys
from pathlib import Path
M = Path('/home/claude/ses-uze-modul'); sys.path.insert(0, str(M))
from ses_uze.pasport import Pasport
from ses_uze.poverkhni_zapusk import klimat_z_pasporta
from ses_uze import soniachne as S

P = M / 'obiekty' / 'antares'
pas = Pasport.load(P / 'pasport.csv'); K = klimat_z_pasporta(pas, P)
WP, L, W = 730, 2.384, 1.303
FIELD = 1826 * 2.404 * 1.323
DEG = sum((1 - 0.004) ** y for y in range(20))                     # кВт·год за 20 років на 1 кВт·год першого року
PRICE = {'laga0': 237, 'tri15': 261}                                 # $/кВтп СЕС до PCS, зведення 23.10 (Китай, без анкерів)
opt = S.optimum(K)
roof = [dict(k='laga0', n='Уздовж покрівлі', d='наш проєкт: лага 0°, модулі по арці', kut='0–16° по арці', mods=1826, kwh_kwp=942, h=1080,
             price=PRICE['laga0'], src='3D-двійник 04.11 (розкладка В1, з тінню)')]
rows = S.ploskyi_dakh(K, WP, L, W, 184, nahyly_pd=(10, 15, 20, 25, 30, round(opt['nahyl'])), nahyly_sz=(10, 15))
for r in rows:
    sz = r['rozkladka'].startswith('Схід')
    nah = r['nahyl']; az = 184 if not sz else 94
    h = S.radiatsiia(K, nah, az, ryady=(W, r['krok_m']))['h_rik'] if not sz else \
        (S.radiatsiia(K, nah, 94, ryady=(W, r['krok_m']))['h_rik'] + S.radiatsiia(K, nah, 274, ryady=(W, r['krok_m']))['h_rik']) / 2
    key = ('dom' if sz else 'pd') + str(nah)
    mods = int(FIELD * r['kwp_m2'] / (WP / 1000))
    roof.append(dict(k=key, n=('«Домик» схід–захід ' if sz else 'Ряди на південь ') + f'{nah}°' + (' — оптимум' if not sz and nah == round(opt['nahyl']) else ''),
                     d=f"крок рядів {r['krok_m']:.2f} м, заповнення {r['zapovnennia']*100:.0f} %", kut=f'{nah}°', mods=mods, kwh_kwp=round(r['kwh_kwp']), h=round(h),
                     price=PRICE['tri15'] if key == 'pd15' else None, src='оцінка як для плаского поля (ses_uze.soniachne)'))
for x in roof:
    x['kwp'] = round(x['mods'] * WP / 1000, 1); x['mwh'] = round(x['kwp'] * x['kwh_kwp'] / 1000, 1)
    x['usd'] = round(x['kwp'] * x['price']) if x['price'] else None
    x['c_kwh'] = round(x['price'] / (x['kwh_kwp'] * DEG), 4) if x['price'] else None
fac = []
for side, az, nm in (('S', 184, 'Південний фасад'), ('E', 94, 'Східний фасад')):
    for k, nah, n in (('v', 90, 'Вертикально по фасаду'), ('k15', 15, 'Козирок 15°'), ('k25', 25, 'Козирок 25°'), ('k35', 35, 'Козирок 35°')):
        y = S.vyrobitok(K, nah, az, 'pryliahlyi' if nah == 90 else 'vilnyi')
        fac.append(dict(f=side, fn=nm, k=k, n=n, kut=f'{nah}°', h=round(y['h_rik']), kwh_kwp=round(y['rik'])))
TW = {('S', 'v'): (772, 864, 264), ('E', 'v'): (568, 694, 132), ('E', 'k25'): (967, None, 33)}   # двійник: кВт·год/кВтп, кВт·год/м², модулів
for x in fac:
    t = TW.get((x['f'], x['k']))
    if t: x['tw'] = dict(kwh_kwp=t[0], h=t[1], mods=t[2])
out = dict(date='05.11.2026', opt=dict(nahyl=opt['nahyl'], azymut=opt['azymut'], h=round(opt['h_rik'])), ghi=round(K.ghi_rik), field=round(FIELD),
           deg20=round(DEG, 2), roof=roof, fac=fac,
           note='Дах: оцінка як для плаского поля площею розкладки В1; на арках (схили до 16°, ліхтарі, ендови) фактична розкладка під кутом менша. Фасади — один ряд без тіні від будівлі; «з двійника» — фактичні з тінню.')
dst = Path(__file__).resolve().parents[2] / 'obj' / 'src' / 'kutdata.js'
dst.write_text('// «Кут і розміщення»: calc/kut/kut_twin.py, ' + out['date'] + '\nconst KUT=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
for x in roof: print(f"{x['n']:38} {x['mods']:5} {x['kwp']:7} {x['kwh_kwp']:5} {x['mwh']:7} h{x['h']:5} {x['c_kwh']}")
for x in fac: print(x['fn'], x['n'], x['h'], x['kwh_kwp'], x.get('tw'))
print(out['opt'], out['ghi'], out['field'])
