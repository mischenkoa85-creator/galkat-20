# Збирає index.html: tpl.html + дані розкладки К1 (abk_k1.json ← layout.py) + варіанти (abk_var.json ← calc/v3/abk_var.py)
import json, os
d = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(d, 'abk_k1.json'), encoding='utf-8'))
D['v'] = json.load(open(os.path.join(d, 'abk_var.json'), encoding='utf-8'))      # генерація і стрінги варіантів — calc/v3/abk_var.py
data = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
html = open(os.path.join(d, 'tpl.html'), encoding='utf-8').read().replace('__DATA__', data)
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html))
