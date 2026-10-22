# Keep / Keyway

Keep is a personal API-key vault for developers. The mark combines a protective
enclosure with a negative-space key. It belongs to the website's existing calm,
orderly visual language.

## Artwork

- `keep-horizontal.svg`: primary logo on light surfaces.
- `keep-horizontal-dark.svg`: sage symbol and light wordmark for dark surfaces.
- `keep-symbol.svg`: primary standalone mark.
- `keep-symbol-small.svg`: wider opening for 16–24 px applications.
- `keep-symbol-white.svg`: reversed artwork, using the wider opening.
- `keep-horizontal-black.svg` / `keep-horizontal-white.svg`: single-colour logos.
- `keep-wordmark.svg` / `keep-stacked.svg`: secondary compositions.
- `web/`: ICO, touch icons, app icons and SVG derivatives.
- `keep-social.png`: 1200 × 630 social-share artwork.

All master artwork uses filled paths, true transparent cutouts and outlined
custom lettering. No fonts, strokes, clipping masks or raster images are needed
to render the logo. The lettering is original construction developed for Keep;
the surrounding app continues to use its existing Geist typeface.

## Palette

| Role | HEX | RGB | Approximate CMYK |
| --- | --- | --- | --- |
| Olive | #526447 | 82, 100, 71 | 18, 0, 29, 61 |
| Ink | #282B25 | 40, 43, 37 | 7, 0, 14, 83 |
| Paper | #FBFBF9 | 251, 251, 249 | 0, 0, 1, 2 |
| Sage | #B6C6A2 | 182, 198, 162 | 8, 0, 18, 22 |
| Dark surface | #171A17 | 23, 26, 23 | 12, 0, 12, 90 |

CMYK values are arithmetic starting points, not press-profile proofs. No Pantone
match has been verified. Use the screen HEX values for this website.

## Sizes and spacing

Use the symbol from 16 px upward with the small cut at 16–24 px. Use the full
horizontal logo at 100 px wide or larger; that is the mobile header minimum.
The desktop header is 146 px wide. Leave at least 24/256 of the standalone
symbol canvas around it, approximately the width of a key tooth. For standalone
marketing placements, allow more space instead of filling the whole frame.

Do not stretch, rotate, add outlines/shadows/gradients, close the keyway, or
rearrange its teeth. The key counter must remain transparent so it takes the
background colour. Use sage or white on dark surfaces; avoid olive on dark
olive. The SVG favicon responds to the browser's colour scheme.

## Verification and limits

Two geometry passes were rendered and audited. The second pass rebalanced the
symbol against the wordmark's lowercase body and widened the small/reversed
opening. See `test.html` for scale, monochrome, reversal, mirror, rotation and
reference-library comparisons. Actual website checks cover desktop/mobile,
both themes, login and the app header. The final test results are recorded in
`verification.md` after the rendered pass.

The existing showcase film remains a historical recording; no screenshots or
video content were regenerated as part of the logo change. The previous
favicon is preserved as `previous-favicon.ico`. This design work is not a legal
trademark-clearance search; arrange one before a public brand launch.
