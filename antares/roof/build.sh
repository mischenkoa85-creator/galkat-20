#!/bin/sh
# Збирає index.html із src/: tpl.html (розмітка, CSS) + app.js (сцена, модель тіней, графіки) + m3d.json (дані розрахунку)
cd "$(dirname "$0")" && python3 - <<'PY'
d = open('src/m3d.json').read()
app = open('src/app.js').read().replace('/*DATA*/null', d)
open('index.html', 'w').write(open('src/tpl.html').read().replace('/*APP*/', app))
print('built index.html')
PY
