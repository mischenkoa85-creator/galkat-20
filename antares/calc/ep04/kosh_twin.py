# -*- coding: utf-8 -*-
"""bom.json (позиції по етапах) → ../../obj/src/koshdata.js (const KOSH): items, mass; вітер (wind) — без змін з попереднього файла."""
import json, os
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
B = json.load(open('bom.json')); p = '../../obj/src/koshdata.js'; s = open(p, encoding='utf-8').read(); K = json.loads(s[s.find('{'):s.rfind('}') + 1])
r = lambda v, n=1: round(v, n)
K['items'] = {st: [[x['grp'], x['name'], x['unit'], r(x['q'], 1) if isinstance(x['q'], float) else x['q'], x['p'], r(x['cost']), r(x['h']), x['src']] for x in L] for st, L in B['items'].items()}
K['mass'] = B['mass']
# 07.11: вітер — з wind.json / wind2.json (після зняття блоків під крайніми профілями: менша власна вага поля, додаткові лише F/G, нестача зони H)
W1 = json.load(open('wind.json')); W2 = json.load(open('wind2.json')); RB = W2['res']['з бортиками по краю поля']
K['wind'].update(g=round(W1['g'], 4), R_d=round(W1['R_d'], 4), per=RB['per'], extra=dict(F=RB['F'], G=RB['G'], H=RB['H'], tot=RB['tot'], H_def=RB.get('H_def', 0)), p_blk=round(W1['p_blk'], 2))
open(p, 'w', encoding='utf-8').write('// Кошторис і специфікація по етапах (calc/ep04/bom.json; траси і лотки — перевірка проходів 05.11.2026) і вітер на дах (calc/ep04/wind*.json)\nconst KOSH=' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('KOSH', {st: len(v) for st, v in K['items'].items()}, round(sum(x[5] for v in K['items'].values() for x in v)))
