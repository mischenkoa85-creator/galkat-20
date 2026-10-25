#!/bin/sh
# Збирає index.html із src/: tpl.html (розмітка, CSS) + data.js (геометрія обох проєктів) + tri.js (трикутник РП за АБ арк. 6)
# + wx.js (клімат з PVsyst РП) + year.js (генерація за рік і місяці) + app.js (сцена, розділи, сонце, невідповідності)
cd "$(dirname "$0")" && python3 - <<'PY'
r = lambda f: open('src/' + f, encoding='utf-8').read()
body = r('tpl.html').replace('<script>/*DATA*/</script>', ''.join('<script>' + r(f) + '</script>' for f in ('data.js', 'tri.js', 'wx.js', 'year.js'))).replace('<script>/*APP*/</script>', '<script>' + r('app.js') + '</script>')
head = '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w', encoding='utf-8').write(head + body + '\n</html>\n')
print('built index.html', len(head + body) // 1024, 'KB')
PY
