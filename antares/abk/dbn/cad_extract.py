# -*- coding: utf-8 -*-
"""П-кронштейни з моделей «Елементи SES» (CadQuery, тесельовані) → abk_cad.json для 3D АБК.
- brkD — «Домік» (гілка antares-domik, calculator/mesh_d.json, t = 1,5): центр (1375; 132,5; 0) мм, x — уздовж лаги, y — вгору.
- brkO — «Трикутник 15° модифікація Антарес» (calculator/t1568/a/ant_15.json): центр (121,5; 95; 492) мм, x — від нижнього торця лаги.
Запуск: python3 cad_extract.py /шлях/до/elements-ses (гілку antares-domik читає git show)."""
import base64, json, os, struct, subprocess, sys
ES = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/elements-ses'
HERE = os.path.dirname(os.path.abspath(__file__))
def f32(b): return list(struct.unpack('<%df' % (len(b) // 4), b))
def pack(pos, idx, c):
    p = [pos[i] - c[i % 3] for i in range(len(pos))]
    return {'p': base64.b64encode(struct.pack('<%df' % len(p), *p)).decode(), 'i': base64.b64encode(struct.pack('<%dH' % len(idx), *idx)).decode(), 'n': len(idx) // 3}
md = json.loads(subprocess.run(['git', '-C', ES, 'show', 'origin/antares-domik:calculator/mesh_d.json'], capture_output=True, text=True, check=True).stdout)
t15 = next(x for x in md if abs(x['t'] - 1.5) < 1e-6)
bd = next(p for p in t15['parts'] if p['id'] == 'bracket')
posD = f32(base64.b64decode(bd['pos'])); idxD = list(struct.unpack('<%dI' % (len(base64.b64decode(bd['idx'])) // 4), base64.b64decode(bd['idx'])))
a15 = json.load(open(os.path.join(ES, 'calculator/t1568/a/ant_15.json')))['meshes']['bracket']
posO = f32(base64.b64decode(a15['p'])); bi = base64.b64decode(a15['i']); idxO = list(struct.unpack('<%dH' % (len(bi) // 2), bi))
out = {'note': 'П-кронштейни з «Елементи SES», мм, відносно центру деталі', 'brkD': pack(posD, idxD, (1375.0, 132.5, 0.0)), 'brkO': pack(posO, idxO, (121.5, 95.0, 492.0))}
json.dump(out, open(os.path.join(HERE, 'abk_cad.json'), 'w'), separators=(',', ':'))
print({k: v['n'] for k, v in out.items() if k != 'note'}, os.path.getsize(os.path.join(HERE, 'abk_cad.json')))
