# Збирає 3D-модель АБК, варіант «ДБН», UA / EN.
#   index.html   = p1_head.html + abk_model.js + abk_app.js + дані        — окрема сторінка (артефакт)
#   abk_data.js  = window.ABK_DATA = {...}                                — дані для збирання всього об'єкта
#   abk_model.js — window.ABKModel(THREE, D, opts)                        — модуль моделі для двійника (див. ZBIRKA.md)
# дані: abk_k1.json (layout.py), abk_dbn.json (calc/v3/abk_dbn.py), abk_bom.json (calc/abk_kosh/bom.py), abk_est.json (calc/abk_kosh/pdf.py)
# old/ — попередні p2_geo / p3_el / p4_ui до розділення на модуль і сторінку (28.10), у збірку не входять
import json, os
d = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(d)
D = json.load(open(os.path.join(A, 'abk_k1.json'), encoding='utf-8'))
D.pop('arch', None)                                                   # «як є» не потрібне
D['dbn'] = json.load(open(os.path.join(A, 'abk_dbn.json'), encoding='utf-8'))
D['bom'] = json.load(open(os.path.join(A, 'abk_bom.json'), encoding='utf-8'))
D['est'] = json.load(open(os.path.join(A, 'abk_est.json'), encoding='utf-8'))
M = json.load(open(os.path.join(A, 'abk_mount.json'), encoding='utf-8')); D['mount'] = {'mods': M['mods'], 'parts': M['parts'], 'q': M['q']}   # mount.py — кріплення за «Елементи SES»
data = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
rd = lambda f: open(os.path.join(d, f), encoding='utf-8').read()
html = rd('p1_head.html').replace('__DATA__', data) + rd('abk_model.js') + '\n' + rd('abk_app.js')
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(d, 'abk_data.js'), 'w', encoding='utf-8').write('// дані АБК «ДБН» для abk_model.js — генерує build.py, не редагувати\nwindow.ABK_DATA = ' + data + ';\n')
print('index.html', len(html) // 1024, 'KB; abk_data.js', len(data) // 1024, 'KB')
