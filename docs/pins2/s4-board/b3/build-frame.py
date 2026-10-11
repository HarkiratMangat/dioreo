# Builds the META badge's surge: THE FRAME ITSELF MORPHS, and sparks jump between the letters.
# 2026-09-17 15:01 EDT, his spec: "why don't you just make the badges frame morph into a surge/lightning, with a
# subtle glow and sparks dynamically jumping between the letters/icon? Like you literally have a perfect example how
# to craft a lightning animation from the reference material and that was done in pure svg."
# He is right about the reference too: its quality comes from HAND-AUTHORED FILLED SHAPES with real taper and
# branching — not from strokes and not from filters. So every spark here is a filled tapered polygon, and the frame
# is one closed path whose POINT COUNT NEVER CHANGES, which is what makes `d` interpolate instead of jumping.
import json, math, random

W, H, R = 116.0, 44.0, 12.0          # viewBox units: 2 per CSS px over a 58x22 badge
N = 72                                # perimeter samples — fixed for every keyframe, or the morph cannot tween

def base_point(i):
    """Point i of the badge's own rounded rectangle, walked clockwise from the top-left arc."""
    per_straight_x, per_straight_y = W - 2 * R, H - 2 * R
    arc = math.pi * R / 2
    total = 2 * (per_straight_x + per_straight_y) + 4 * arc
    u = (i / N) * total
    segs = [('t', per_straight_x), ('a', arc), ('r', per_straight_y), ('b', arc),
            ('B', per_straight_x), ('c', arc), ('l', per_straight_y), ('d', arc)]
    for kind, L in segs:
        if u <= L:
            t = u / L if L else 0
            if kind == 't': return (R + per_straight_x * t, 0.0), (0.0, -1.0)
            if kind == 'a':
                a = -math.pi / 2 + t * math.pi / 2
                return (W - R + R * math.cos(a), R + R * math.sin(a)), (math.cos(a), math.sin(a))
            if kind == 'r': return (W, R + per_straight_y * t), (1.0, 0.0)
            if kind == 'b':
                a = t * math.pi / 2
                return (W - R + R * math.cos(a), H - R + R * math.sin(a)), (math.cos(a), math.sin(a))
            if kind == 'B': return (W - R - per_straight_x * t, H), (0.0, 1.0)
            if kind == 'c':
                a = math.pi / 2 + t * math.pi / 2
                return (R + R * math.cos(a), H - R + R * math.sin(a)), (math.cos(a), math.sin(a))
            if kind == 'l': return (0.0, H - R - per_straight_y * t), (-1.0, 0.0)
            a = math.pi + t * math.pi / 2
            return (R + R * math.cos(a), R + R * math.sin(a)), (math.cos(a), math.sin(a))
        u -= L
    return (R, 0.0), (0.0, -1.0)

BASE = [base_point(i) for i in range(N)]

def frame_path(zones, jag):
    """zones: list of (centre 0..1 along the perimeter, half-width, amplitude). Outside them the frame is ITSELF."""
    pts = []
    for i, ((x, y), (nx, ny)) in enumerate(BASE):
        t = i / N
        push = 0.0
        for c, hw, amp in zones:
            dd = min(abs(t - c), 1 - abs(t - c))
            if dd < hw:
                fall = math.cos((dd / hw) * math.pi / 2) ** 2
                # \u26a0\ufe0f THE ALTERNATING SIGN WAS THE WHOLE UGLINESS. `(1 if i%2 else -0.55)` is a SAWTOOTH, so the
                # border came out ruffled like a torn sticker. His reference has no corners anywhere \u2014 it is a smooth
                # swelling ribbon. One smooth lobe per zone, with a slow secondary swell, and no sign flip at all.
                lobe = math.sin(math.pi * (0.5 + (t - c) / (2 * hw)))
                push += amp * fall * lobe * (0.72 + 0.28 * math.sin(t * 17.0 + jag[i % len(jag)] * 6.28))
        pts.append((x + nx * push, y + ny * push))
    return 'M' + 'L'.join('%.2f %.2f' % p for p in pts) + 'Z'

rnd = random.Random(20260917)
jag = [rnd.random() for _ in range(N)]
CALM = frame_path([], jag)

# The loop: calm, a surge that travels the frame, a second smaller one, calm again. Percentages are the CSS stops.
def surge(at, amp, spread=0.085, extra=None):
    z = [(at, spread, amp)]
    if extra: z += extra
    return frame_path(z, jag)

FRAME = [
    (0,   CALM), (30, CALM),
    (34,  surge(0.18, 1.1)),
    (38,  surge(0.26, 2.9, 0.10, [(0.72, 0.08, 1.7)])),
    (42,  surge(0.40, 2.2, 0.09, [(0.78, 0.07, 2.4)])),
    (46,  surge(0.55, 3.3, 0.11, [(0.05, 0.07, 1.5)])),
    (50,  surge(0.68, 1.8, 0.09)),
    (54,  CALM), (62, CALM),
    (66,  surge(0.88, 2.7, 0.10, [(0.35, 0.07, 1.4)])),
    (70,  surge(0.96, 1.6, 0.09)),
    (74,  CALM), (100, CALM),
]

# Sparks jumping the gaps between the glyph and the four letters of META.
ANCH = [22.0, 50.0, 66.0, 82.0, 98.0]        # glyph, M, E, T, A — in viewBox units
def spark(a, b, up, seed):
    r = random.Random(seed)
    y0 = 22 + (-1 if up else 1) * r.uniform(1.0, 3.0)
    y1 = 22 + (-1 if up else 1) * r.uniform(1.0, 3.0)
    mx = (a + b) / 2 + r.uniform(-2.5, 2.5)
    my = 22 + (-1 if up else 1) * r.uniform(5.5, 9.0)
    # a calligraphic arc: tapered at both tips, swelling through the middle. Curves, never corners.
    pts_hi, pts_lo, STEPS = [], [], 14
    for i in range(STEPS + 1):
        t = i / STEPS
        x = (1 - t) ** 2 * a + 2 * (1 - t) * t * mx + t * t * b
        y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1
        w = 1.35 * (math.sin(math.pi * t) ** 0.65)
        dx = 2 * (1 - t) * (mx - a) + 2 * t * (b - mx); dy = 2 * (1 - t) * (my - y0) + 2 * t * (y1 - my)
        L = math.hypot(dx, dy) or 1
        pts_hi.append((x - dy / L * w, y + dx / L * w)); pts_lo.append((x + dy / L * w, y - dx / L * w))
    ring = pts_hi + pts_lo[::-1]
    return '<polygon points="' + ' '.join('%.1f,%.1f' % q for q in ring) + '"/>'

SPARKS = []
for i in range(len(ANCH) - 1):
    for k in (0, 1):
        SPARKS.append({'id': 'sp%d%d' % (i, k), 'svg': spark(ANCH[i], ANCH[i + 1], k == 0, 900 + i * 7 + k),
                       'on': [36 + i * 4 + k * 2, 66 + i * 3 + k]})
print(json.dumps({'frame': FRAME, 'sparks': SPARKS}))
