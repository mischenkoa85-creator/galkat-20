# -*- coding: utf-8 -*-
"""Обсяги матеріалів і робіт для фундаментів BESS і PCS (обидва варіанти), кабельного каналу, заземлення,
майданчика обслуговування і робіт, що їм передують. Джерела: draw.py (через kreslennya.load_variant), route_data.json.
Запуск для перевірки:  python3 spec_calc.py"""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kreslennya as K

D = K.DATA
S0 = D['bess'][0]
HL, HB = 3.079, 1.269                    # половини фундаменту 6158 × 2538, м
BX = S0['bess'][0]
EAST = BX + HL
GD, AP, RT, GR = D['gnd'], D['apron'], D['route'], D['gasr']

# ---- параметри котловану (пропозиція, до вишукувань)
WS = 0.6          # робочий простір від краю бетонної підготовки, м (ДБН А.3.2-2-2009: між опалубкою і укосом ≥ 0,6 м)
WS_E = 0.3        # зі сходу — вертикальна стінка з кріпленням: уздовж неї за 0,72 м від фундаменту йдуть вставки КЛ
SLOPE = 0.5       # укіс 1 : 0,5 (суглинок, глибина до 3 м) — уточнити за вишукуваннями
D_AP = 0.40       # основа майданчика: бетон 150 + щебінь 150 + пісок 100
CH_DEPTH = 0.63   # кабельний канал: 550 бетону + плита 80, верх урівень з майданчиком
CH_WS = 0.3       # робочий простір траншеї каналу з кожного боку
MAN_GAS, MAN_CAB = 2.0, 1.0   # ручна розробка: ближче 2 м до газопроводу (охоронна зона), ближче 1 м до кабелів
STEP = 0.05


def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
    t = np.clip(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1) if L2 else 0
    return np.hypot(px - (ax + t * dx), py - (ay + t * dy))


def poly_dist(px, py, pts):
    d = np.full(px.shape, 1e9)
    for a, b in zip(pts, pts[1:]):
        d = np.minimum(d, seg_dist(px, py, a[:2], b[:2]))
    return d


def earth(v):
    m = VAR[v]
    h = (m.PREP - m.BEAM_BOT) / 1000.0                     # глибина котловану від ±0,000 до низу підготовки
    x = np.arange(21.0, 36.0, STEP) + STEP / 2; y = np.arange(-1.0, 19.0, STEP) + STEP / 2
    X, Y = np.meshgrid(x, y); A = STEP * STEP
    pit = np.zeros(X.shape); bottoms = []
    for c in (S0['bess'], S0['pcs']):
        x0, x1 = c[0] - HL - 0.1 - WS, c[0] + HL + 0.1 + WS_E
        y0, y1 = c[1] - HB - 0.1 - WS, c[1] + HB + 0.1 + WS
        bottoms.append((x1 - x0) * (y1 - y0))
        dxo = np.maximum(np.maximum(x0 - X, 0), 0); dyo = np.maximum(np.maximum(y0 - Y, Y - y1), 0)
        d = np.where(X > x1, 0.0, np.clip(h - np.maximum(dxo, dyo) / SLOPE, 0, h))
        pit = np.maximum(pit, d)
    in_found = np.zeros(X.shape, bool)
    for c in (S0['bess'], S0['pcs']):
        in_found |= (np.abs(X - c[0]) <= HL) & (np.abs(Y - c[1]) <= HB)
    ya, yb = S0['bess'][1] + HB, S0['pcs'][1] - HB
    in_ch = (np.abs(X - BX) <= 0.4) & (Y > ya) & (Y < yb)
    in_chw = (np.abs(X - BX) <= 0.4 + CH_WS) & (Y > ya) & (Y < yb)
    ax0, ay0 = AP['outer'][0]; ax1, ay1 = AP['outer'][2]
    in_ap = (X >= ax0) & (X <= ax1) & (Y >= ay0) & (Y <= ay1) & ~in_found
    dig = np.maximum(pit, np.where(in_ap, D_AP, 0.0))
    dig = np.maximum(dig, np.where(in_chw, CH_DEPTH, 0.0))
    # ручна розробка: охоронна зона газопроводів (2 м) і 1 м від кабелів (вставки, існуючі)
    gas = [l['p'] for l in D['lines'] if l['c'] == 'gas' and not l.get('rel')]
    cab = [r['p'] for r in RT['reroute']] + [l['p'] for l in D['lines'] if l['c'] in ('cable6', 'cable') and not l.get('rel')]
    dg = np.full(X.shape, 1e9); dc = np.full(X.shape, 1e9)
    for P in gas:
        if max(q[0] for q in P) < 20 or min(q[0] for q in P) > 37 or max(q[1] for q in P) < -2 or min(q[1] for q in P) > 20: continue
        dg = np.minimum(dg, poly_dist(X, Y, P))
    for P in cab:
        if max(q[0] for q in P) < 20 or min(q[0] for q in P) > 37 or max(q[1] for q in P) < -2 or min(q[1] for q in P) > 20: continue
        dc = np.minimum(dc, poly_dist(X, Y, P))
    manual_zone = (dg < MAN_GAS) | (dc < MAN_CAB)
    V = float((dig * A).sum())
    V_man_zone = float((dig * A)[manual_zone].sum())
    bottom_area = float(sum(bottoms))
    V_finish = 0.10 * bottom_area                            # доробка дна вручну, 0,1 м
    V_mech = V - V_man_zone - V_finish
    # зворотна засипка: поза фундаментами і каналом — до низу основи майданчика (у межах майданчика) або до землі
    cover = np.where(in_ap | in_chw, D_AP, 0.0)
    fill_out = np.where(~in_found & ~in_ch, np.clip(pit - cover, 0, None), 0.0)
    fill_under_ch = np.where(in_ch, np.clip(pit - CH_DEPTH, 0, None), 0.0)   # під каналом — у межах котлованів
    V_fill = float(((fill_out + fill_under_ch) * A).sum())
    inner = (6.158 - 0.7) * (2.538 - 0.7)                    # 5,458 × 1,838 у світлі
    V_inner_fill = inner * ((m.PREP + (m.COL_BOT - m.BEAM_BOT)) / 1000.0)  # усередині кільця: від низу підготовки до низу колон
    ring_area = 6.158 * 2.538 - inner
    V_struct_below = 2 * (ring_area * (-m.BEAM_BOT) / 1000.0 + m.V_PREP) + 5.46 * 0.8 * CH_DEPTH
    shore = 0.0
    for c in (S0['bess'], S0['pcs']):
        Lb = 2 * HB + 0.2 + 2 * WS; Lt = Lb + 2 * h * SLOPE
        shore += (Lb + Lt) / 2 * h
    return {'h': h, 'V': V, 'V_mech': V_mech, 'V_man': V_man_zone + V_finish, 'V_man_zone': V_man_zone, 'V_finish': V_finish,
            'bottom': bottom_area, 'V_fill': V_fill, 'V_inner_fill': 2 * V_inner_fill, 'inner_area': 2 * inner,
            'V_away': V - V_fill - 2 * V_inner_fill, 'shore': shore, 'V_struct_below': V_struct_below,
            'ap_dig_area': float(A * in_ap.sum())}


VAR = {v: K.load_variant(v, (0, 0)) for v in (1, 2)}
KGM = VAR[1].KGM


def steel(m):
    """кг за (клас, Ø) на весь обсяг: 2 фундаменти, канал, плити, перемички."""
    out = {}
    def add(d, k):
        for kk, vv in d.items(): out[kk] = out.get(kk, 0) + vv * k
    add(m.steel_by('f'), 2); add(m.steel_by('c'), 1); add(m.steel_by('s'), m.SLAB_N); add(m.steel_by('l'), 2)
    return out


def quant(v):
    m = VAR[v]; E = earth(v)
    hcol = (m.F_TOP - m.COL_BOT) / 1000.0
    q = {'v': v, 'bot': m.BEAM_BOT / 1000.0, 'hcol': hcol, 'E': E,
         'c_beam': 2 * m.V_BEAM, 'c_cols': 2 * m.V_COLS, 'c_found': 2 * (m.V_BEAM + m.V_COLS), 'c_prep': 2 * m.V_PREP,
         'c_chan': m.V_CHAN, 'c_slab': m.V_SLABS, 'c_lint': m.V_LINT, 'n_slab': m.SLAB_N, 'slab_l': m.SLAB_L, 'ch_l': m.CH_L,
         'brick_v': 2 * m.BRICK_V, 'wall_area': 2 * m.W_LEN * (m.F_TOP - m.COL_BOT) / 1e6,
         'steel': steel(m), 'mn_n': 16, 'mn_plate': 16 * m.MN_PLATE, 'mn_anch': 16 * m.MN_ANCH,
         'st_found': 2 * (sum(m.steel_by('f').values())), 'pos4': m.POS4}
    q['bricks'] = q['brick_v'] * 394          # цегла 250 × 120 × 65: 394 шт. на 1 м³ кладки
    q['mortar'] = q['brick_v'] * 0.24         # розчин: 0,24 м³ на 1 м³ кладки
    per_out, per_in = 2 * (6.158 + 2.538), 2 * (5.458 + 1.838)
    q['fw_beam'] = 2 * (per_out + per_in) * 0.35
    q['fw_cols'] = 2 * 8 * 4 * 0.35 * hcol
    q['fw_chan'] = (2 * 0.55 + 2 * 0.45) * m.CH_L / 1000.0
    q['wp'] = 2 * (per_out * (-m.BEAM_BOT / 1000.0) + per_in * 0.35)            # гідроізоляція поверхонь, що контактують із ґрунтом
    q['compact_bottom'] = E['bottom']
    q['rebar_tot'] = sum(q['steel'].values()) + q['mn_anch']
    return q


Q = {v: quant(v) for v in (1, 2)}
# ---- майданчик і сходинки
apq = AP['q']
L_ap_x = AP['outer'][2][0] - AP['outer'][0][0]; L_ap_y = AP['outer'][2][1] - AP['outer'][0][1]
STEPS_GOLEN = {'L': 1.6, 'V': 1.6 * (0.3 * 0.15 + 0.3 * 0.30)}
APRON = {'area': AP['area'], 'conc': apq['conc'], 'gravel': apq['gravel'], 'sand': apq['sand'], 'mesh': apq['mesh'], 'mesh_kg': apq['mesh_kg'],
         'seam': apq['seam_found'], 'cut': round(2 * (L_ap_x + L_ap_y) + 6 * 1.5), 'steps_V': apq['steps_V'] + STEPS_GOLEN['V'], 'steps_L': apq['steps_L'] + STEPS_GOLEN['L'],
         'edge_fw': 2 * (L_ap_x + L_ap_y) * 0.15, 'steps_fw': (apq['steps_L'] + STEPS_GOLEN['L']) * 0.30 + 2 * 5 * 0.3 * 0.3}
# ---- заземлення
Ls = GD['len']; L_strip = round((Ls['loop'] + Ls['bar'] + Ls['ris'] + Ls['bond']) * 1.05)
GND = {'strip': L_strip, 'strip_kg': L_strip * 0.04 * 0.004 * 7850, 'rods': len(GD['rods']), 'secs': 2 * len(GD['rods']), 'rod_kg': 2 * len(GD['rods']) * 3.0 * math.pi * 0.009 ** 2 * 7850,
       'wire': 2 * len(GD['risers']), 'lugs': 2 * len(GD['risers']), 'pipe32': len(GD['risers']), 'loop': Ls['loop'] + Ls['bar'], 'bond': Ls['bond'], 'ris': Ls['ris'],
       'bond_trench': sum(abs(b[0][0] - b[-1][0]) for b in GD['bond']), 'R': GD['calc']['r100']}
# ---- роботи, що передують (за окремими проєктами)
RR = {r['cab']: r for r in RT['reroute']}
PRE = {'gas_new': GR['L_new'], 'gas_old': GR['L_old'], 'ins_L': RR['a']['L'] + RR['b']['L'], 'ins_cable': round((RR['a']['L'] + RR['b']['L']) * 1.03 + 4),
       'ins_pipe': round(RR['a']['L'] + RR['b']['L'] - 2), 'old': RR['a']['Lold'] + RR['b']['Lold'], 'joints': 4, 'trench': round(max(RR['a']['L'], RR['b']['L']) + 2.0, 1)}

if __name__ == '__main__':
    for v in (1, 2):
        q = Q[v]; E = q['E']
        print('=== variant', v, 'bottom', q['bot'], 'hcol', q['hcol'])
        print(' concrete found %.2f (beam %.2f cols %.2f) prep %.2f chan %.2f slabs %.3f lint %.3f' % (q['c_found'], q['c_beam'], q['c_cols'], q['c_prep'], q['c_chan'], q['c_slab'], q['c_lint']))
        print(' brick %.2f m3 = %d pcs, mortar %.2f, wall %.1f m2' % (q['brick_v'], q['bricks'], q['mortar'], q['wall_area']))
        print(' steel', {'%s Ø%d' % k: round(vv, 1) for k, vv in sorted(q['steel'].items())}, 'MN plate %.1f anch %.1f' % (q['mn_plate'], q['mn_anch']), 'tot %.1f' % q['rebar_tot'])
        print(' formwork beam %.1f cols %.1f chan %.1f  wp %.1f' % (q['fw_beam'], q['fw_cols'], q['fw_chan'], q['wp']))
        print(' earth', {k: (round(vv, 1) if isinstance(vv, float) else vv) for k, vv in E.items()})
    print('APRON', APRON); print('GND', GND); print('PRE', PRE)
