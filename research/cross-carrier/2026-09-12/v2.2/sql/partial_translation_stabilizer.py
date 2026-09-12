def stabilizers(points):
    m = len(points)
    if m == 0 or m % 2:
        return set()
    counts = {}
    items = sorted(points.items())
    for i, (x, bx) in enumerate(items):
        for y, by in items[i+1:]:
            if bx == by:
                t = x ^ y
                if t:
                    counts[t] = counts.get(t, 0) + 1
    return {t for t, c in counts.items() if 2*c == m}
