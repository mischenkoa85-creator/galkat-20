#!/bin/sh
# Збирає index.html із src/ (part1.html + data.json, part2.js, part3.js + node.js + energy.js)
cd "$(dirname "$0")" && python3 - <<'PY'
import os
d=open('src/data.json').read()
p1=open('src/part1.html').read().replace('/*DATA*/',d)
p3=open('src/part3.js').read()
extra=''.join(open('src/'+f).read()+'\n' for f in ['node.js','energy.js'] if os.path.exists('src/'+f))
i=p3.rindex('})();')
p3=p3[:i]+extra+p3[i:]
open('index.html','w').write(p1+'<script>\n'+open('src/part2.js').read()+p3+'</script>\n')
print('built index.html')
PY
