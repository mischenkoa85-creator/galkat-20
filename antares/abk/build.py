# Збирає index.html: tpl.html + дані розкладки К1 (abk_k1.json ← layout.py)
import json, os
d = os.path.dirname(os.path.abspath(__file__))
data = json.dumps(json.load(open(os.path.join(d, 'abk_k1.json'), encoding='utf-8')), ensure_ascii=False, separators=(',', ':'))
html = open(os.path.join(d, 'tpl.html'), encoding='utf-8').read().replace('__DATA__', data)
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html))
