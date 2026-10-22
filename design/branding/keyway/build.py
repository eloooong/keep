from pathlib import Path

ROOT = Path(__file__).resolve().parent
INK = '#282b25'
OLIVE = '#526447'
LIGHT = '#e6e8e0'
SAGE = '#b6c6a2'

MARK = 'M72 24H184A48 48 0 0 1 232 72V108H120A36 36 0 1 0 120 140H136V164H160V140H184V172H208V140H232V184A48 48 0 0 1 184 232H72A48 48 0 0 1 24 184V72A48 48 0 0 1 72 24Z'
K = 'M0 8H27V108L81 54H115L60 109L135 184H97L41 128L27 142V184H0Z'
E = 'M118 128H28C31 149 43 162 63 162C78 162 90 155 100 144L116 160C102 178 84 185 62 185C24 185 0 158 0 119C0 80 24 52 60 52C96 52 118 79 118 116Z M28 106H90C87 86 76 75 60 75C43 75 32 86 28 106Z'
P = 'M0 54H26V68C36 56 49 50 64 50C97 50 120 78 120 118C120 158 97 186 64 186C49 186 36 180 26 169V240H0Z M26 118C26 146 39 162 60 162C81 162 94 146 94 118C94 90 81 74 60 74C39 74 26 90 26 118Z'

def wordmark(color):
    return f'<g fill="{color}"><path d="{K}"/><path fill-rule="evenodd" transform="translate(152 0)" d="{E}"/><path fill-rule="evenodd" transform="translate(288 0)" d="{E}"/><path fill-rule="evenodd" transform="translate(426 0)" d="{P}"/></g>'

def svg(title, body, width=256, height=256):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>\n'

def symbol(color, path=MARK):
    return f'<path fill="{color}" d="{path}"/>'

# This first construction is retained so later optical corrections are reviewable.
(ROOT/'keep-symbol-v1.svg').write_text(svg('Keep keyway, construction study', symbol('#000000')), encoding='utf-8')
(ROOT/'keep-horizontal-v1.svg').write_text(svg('Keep, construction study', symbol('#000000')+'<g transform="translate(284 28) scale(.78)">'+wordmark('#000000')+'</g>', 734), encoding='utf-8')
print('Construction studies written.')

# Second pass: widen the keyway for the small/reversed cut, and rebalance the
# symbol against the lowercase x-height instead of aligning to the descender.
SMALL = MARK.replace('V108H120', 'V104H120').replace('120 140H136V164H160V140H184V172H208V140', '120 144H136V168H160V144H184V176H208V144')

def horizontal(mark_color, type_color, path=MARK):
    return '<g transform="translate(0 20) scale(.76)">'+symbol(mark_color, path)+'</g><g transform="translate(224 0)">'+wordmark(type_color)+'</g>'

assets = {
    'keep-symbol.svg': svg('Keep keyway symbol', symbol(OLIVE)),
    'keep-symbol-black.svg': svg('Keep keyway, black', symbol('#000000')),
    'keep-symbol-white.svg': svg('Keep keyway, reversed', symbol('#ffffff', SMALL)),
    'keep-symbol-sage.svg': svg('Keep keyway, dark theme', symbol(SAGE, SMALL)),
    'keep-symbol-small.svg': svg('Keep keyway, small-size cut', symbol(OLIVE, SMALL)),
    'keep-horizontal.svg': svg('Keep logo', horizontal(OLIVE, INK), 794),
    'keep-horizontal-dark.svg': svg('Keep logo, dark theme', horizontal(SAGE, LIGHT, SMALL), 794),
    'keep-horizontal-black.svg': svg('Keep logo, black', horizontal('#000000', '#000000'), 794),
    'keep-horizontal-white.svg': svg('Keep logo, reversed', horizontal('#ffffff', '#ffffff', SMALL), 794),
    'keep-wordmark.svg': svg('Keep wordmark', '<g transform="translate(16 0)">'+wordmark(INK)+'</g>', 578),
    'keep-stacked.svg': svg('Keep stacked logo', '<g transform="translate(189 0)">'+symbol(OLIVE)+'</g><g transform="translate(44 275)">'+wordmark(INK)+'</g>', 634, 540),
    'keep-social.svg': svg('Keep — API key vault', '<path fill="#fbfbf9" d="M0 0H1200V630H0Z"/><g transform="translate(124 162) scale(1.2)">'+horizontal(OLIVE, INK)+'</g>', 1200, 630),
}
for name, content in assets.items():
    (ROOT/name).write_text(content, encoding='utf-8')

ui = Path(__file__).resolve().parents[3] / 'src/components/brand'
ui.mkdir(parents=True, exist_ok=True)
# Drawing data shared by the runtime component and the delivered SVG masters.
(ui/'geometry.ts').write_text(
    f'export const keyway = "{MARK}";\nexport const smallKeyway = "{SMALL}";\n'
    f'export const keepK = "{K}";\nexport const keepE = "{E}";\nexport const keepP = "{P}";\n', encoding='utf-8')
print('Refined SVG masters and UI geometry written.')
