# Зведення малих щитів даху: стрінги з малих щитів — на інший кінець (у щит із вільним місцем ≤ 15 м) або злиття малих на одній лінії ≤ 20 м
import ep_opt as E, collections, json
att = {}   # стрінг -> (лінія, x)
ends = {}
for k, v in E.ss.items():
    xs = [a for a, b, c in v]; ys = [b for a, b, c in v]; x = sum(xs) / len(xs); ya, yb = min(ys), max(ys)
    ends[k] = [(min(abs(ya - L), abs(yb - L)), L) for L in E.LINES_Y if min(abs(ya - L), abs(yb - L)) < 4.0 and not E.blocked(L, x - 0.3, x + 0.3)]
G = [list(g) for g in E.boxes]
def bx(g): return sorted(t[1] for t in g)[len(g) // 2]
extra = 0.0
for it_ in range(50):
    G = [g for g in G if g]; G.sort(key=len); changed = False
    for g in G:
        if len(g) > 4: continue
        # 1) злиття з іншим малим/неповним на тій самій лінії
        L = g[0][0]
        cands = [h for h in G if h is not g and h and h[0][0] == L and len(h) + len(g) <= 7 and abs(bx(h) - bx(g)) <= 20 and not E.blocked(L, min(bx(h), bx(g)), max(bx(h), bx(g)))]
        if cands:
            h = min(cands, key=lambda h: abs(bx(h) - bx(g))); extra += 2 * abs(bx(h) - bx(g)) * len(g); h += g; g.clear(); changed = True; break
        # 2) перенесення кожного стрінга на інший кінець
        for t in list(g):
            for d, L2 in ends[t[2]]:
                if L2 == t[0]: continue
                tg = [h for h in G if h is not g and h and h[0][0] == L2 and len(h) < 7 and abs(bx(h) - t[1]) <= 15 and not E.blocked(L2, min(bx(h), t[1]), max(bx(h), t[1]))]
                if tg:
                    h = min(tg, key=lambda h: abs(bx(h) - t[1])); extra += 2 * abs(bx(h) - t[1]); h.append((L2, t[1], t[2], d, t[4])); g.remove(t); changed = True; break
        if changed: break
    if not changed: break
G = [g for g in G if g]
print('щитів', len(G), sorted(len(g) for g in G), 'стрінгів', sum(len(g) for g in G), 'додатково 1×6 ≈', round(extra), 'м')
RB = [{'id': None, 'X': round(bx(g), 2), 'Y': g[0][0], 'ns': len(g), 'kwh': sum(t[4] for t in g), 'z': 'roof', 'st': 2, 'strings': sorted(t[2] for t in g)} for g in G]
json.dump({'RB': RB, 'extra16': extra}, open('rb_merged.json', 'w'), ensure_ascii=False)
