"""Build three original vector concepts. No installed font is used in artwork."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def svg(name, body, width=256):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 256" width="{width}" height="256" role="img" aria-labelledby="title"><title id="title">Keep — {name}</title><g fill="#20251d">{body}</g></svg>\n'

# A: 44-unit stem, two exact 45-degree diagonals, and a deliberate open joint.
latch = '<path d="M32 24H76V104L156 24H212L112 124L76 160V232H32Z M112 152L144 120L224 200L192 232Z"/>'

# B: a folded perimeter with a true transparent counter. The diagonal is 45°.
tuck = '<path fill-rule="evenodd" d="M40 24H144L216 96V184A48 48 0 0 1 168 232H88A48 48 0 0 1 40 184Z M80 64V184A8 8 0 0 0 88 192H168A8 8 0 0 0 176 184V112H144A16 16 0 0 1 128 96V64Z"/>'

# Shared custom lowercase letters. Round bowls overshoot the baseline by 1 unit.
k = 'M0 8H27V108L81 54H115L60 109L135 184H97L41 128L27 142V184H0Z'
e = 'M118 128H28C31 149 43 162 63 162C78 162 90 155 100 144L116 160C102 178 84 185 62 185C24 185 0 158 0 119C0 80 24 52 60 52C96 52 118 79 118 116Z M28 106H90C87 86 76 75 60 75C43 75 32 86 28 106Z'
p = 'M0 54H26V68C36 56 49 50 64 50C97 50 120 78 120 118C120 158 97 186 64 186C49 186 36 180 26 169V240H0Z M26 118C26 146 39 162 60 162C81 162 94 146 94 118C94 90 81 74 60 74C39 74 26 90 26 118Z'

def wordmark(joined=False):
    # Optical spacing: the diagonal k needs more room than the repeated bowls.
    return (f'<path d="{k}"/><path fill-rule="evenodd" transform="translate(152 0)" d="{e}"/>'
            f'<path fill-rule="evenodd" transform="translate(288 0)" d="{e}"/>'
            f'<path fill-rule="evenodd" transform="translate(426 0)" d="{p}"/>'
            + ('<path d="M266 106H298V128H266Z"/>' if joined else ''))

# C: a lowercase k companion derived directly from the wordmark's geometry.
continuity = f'<path transform="translate(48.35 14.16) scale(1.185)" d="{k}"/>'

concepts = [('a-latch', 'Latch', latch), ('b-tuck', 'Tuck', tuck), ('c-continuity', 'Continuity', continuity)]
for slug, name, symbol in concepts:
    (ROOT / f'{slug}-v2.svg').write_text(svg(name, symbol), encoding='utf-8')
    if slug == 'c-continuity':
        body = '<g transform="translate(16 0)">' + wordmark(True) + '</g>'
        width = 578
    else:
        body = '<g transform="translate(0 0)">' + symbol + '</g><g transform="translate(292 28) scale(.78)">' + wordmark() + '</g>'
        width = 750
    (ROOT / f'{slug}-lockup-v2.svg').write_text(svg(name + ' wordmark', body, width), encoding='utf-8')
print('Built six vector concept files.')
