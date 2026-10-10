# His lightning is a SMOOTH SWELLING RIBBON — sinuous bezier curves that thicken and thin, almost liquid, with
# small detached droplets. Ten attempts of mine drew ANGULAR ZIGZAGS, which is the emoji idea of lightning and is
# exactly why he said it looks like a child drew it. Same subject, different visual language.
# So: his language, built at badge scale. A spine of smooth curves; a width profile that swells and tapers; the
# outline is the offset of the spine by that width. No strokes, no corners, no noise fields.
import math, random, json

def spine(pts, n=80):
    """Catmull-Rom through the control points -> a smooth sampled centre-line."""
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(len(P) - 3):
        p0, p1, p2, p3 = P[i], P[i+1], P[i+2], P[i+3]
        for j in range(n // (len(P) - 3)):
            t = j / (n // (len(P) - 3)); t2, t3 = t*t, t*t*t
            x = 0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y = 0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x, y))
    return out

def ribbon(ctrl, wmax, rnd, swell=(0.34, 0.68)):
    """A filled calligraphic ribbon: taper at both tips, swelling through the middle, with a slow secondary wobble."""
    S = spine(ctrl)
    left, right = [], []
    for i, (x, y) in enumerate(S):
        t = i / (len(S) - 1)
        # two swells rather than one — that is what gives his strokes their liquid, un-mechanical read
        w = wmax * (math.sin(math.pi * t) ** 0.7) * (0.55 + 0.45 * math.sin(t * math.pi * 2.6 + rnd))
        w = max(w, 0.05)
        j = min(i + 1, len(S) - 1); k = max(i - 1, 0)
        dx, dy = S[j][0] - S[k][0], S[j][1] - S[k][1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        left.append((x + nx * w, y + ny * w)); right.append((x - nx * w, y - ny * w))
    pts = left + right[::-1]
    return 'M' + 'L'.join('%.2f %.2f' % p for p in pts) + 'Z'

def droplets(near, rnd, k=3):
    r = random.Random(rnd)
    out = []
    for _ in range(k):
        x, y = r.choice(near)
        out.append('<ellipse cx="%.1f" cy="%.1f" rx="%.2f" ry="%.2f"/>' % (x + r.uniform(-5, 5), y + r.uniform(-4, 4), r.uniform(.5, 1.2), r.uniform(.4, .9)))
    return ''.join(out)

r = random.Random(7)
W, H = 116.0, 44.0
shapes = {}
# The badge's top edge coming alive as a ribbon, and the bottom, and two arcs jumping between the letters.
shapes['top']  = ribbon([(6, 3), (30, -2.5), (58, 4.5), (86, -1.5), (110, 3)], 2.8, 0.7)
shapes['bot']  = ribbon([(110, 41), (84, 46), (56, 39.5), (28, 45), (6, 41)], 2.4, 2.1)
shapes['jumpA'] = ribbon([(24, 24), (38, 15), (50, 27), (64, 17)], 1.5, 1.3)
shapes['jumpB'] = ribbon([(66, 20), (80, 29), (92, 17), (100, 25)], 1.3, 3.0)
shapes['arcL'] = ribbon([(4, 14), (13, 22), (6, 31)], 1.6, 0.4)
shapes['arcR'] = ribbon([(112, 13), (103, 22), (110, 32)], 1.5, 2.6)
drops = droplets([(30, 6), (58, 38), (88, 8), (46, 20), (76, 26)], 11, 6)
print(json.dumps({'shapes': shapes, 'drops': drops}))
