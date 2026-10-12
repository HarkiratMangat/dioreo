# Board 4, saved 2026-09-24 14:44 EDT: the insert helper that asserts its line delta (the insert slice of 2026-09-24 cut ui/icons.js by 60 lines).
def insert_after(s, anchor, new):
    assert s.count(anchor) == 1, f'anchor {anchor[:50]!r}'
    n0 = len(s.split('\n')); i = s.index(anchor); j = s.index('\n', i)
    out = s[:j + 1] + new + s[j + 1:]
    assert len(out.split('\n')) - n0 == new.count('\n'), 'line delta'
    return out
