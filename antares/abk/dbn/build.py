# Збирає 3D-модель АБК, лише варіант «ДБН», UA / EN: p1_head.html + p2_geo.js + p3_el.js + p4_ui.js + дані
# дані: abk_k1.json (layout.py), abk_dbn.json (calc/v3/abk_dbn.py), abk_bom.json (calc/abk_kosh/bom.py), abk_est.json (calc/abk_kosh/pdf.py)
import json, os
d = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(d)
D = json.load(open(os.path.join(A, 'abk_k1.json'), encoding='utf-8'))
D.pop('arch', None)                                                   # «як є» не потрібне
D['dbn'] = json.load(open(os.path.join(A, 'abk_dbn.json'), encoding='utf-8'))
B = json.load(open(os.path.join(A, 'abk_bom.json'), encoding='utf-8')); B['groups'] = {k: v for k, v in B['groups'].items()}
D['bom'] = B; D['est'] = json.load(open(os.path.join(A, 'abk_est.json'), encoding='utf-8'))
data = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
src = ''.join(open(os.path.join(d, f), encoding='utf-8').read() for f in ('p1_head.html', 'p2_geo.js', 'p3_el.js', 'p4_ui.js'))
html = src.replace('__DATA__', data)
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html) // 1024, 'KB')
