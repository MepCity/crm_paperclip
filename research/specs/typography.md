# Typography candidate research

## Method

- Evidence is restricted to existing local screenshots and network logs. No live reference CRM request or capture was made; no reference font file was downloaded or used. Measurement and rendering scripts live in the local research workspace at `tools/typography/` and are deliberately outside this repository.
- Screenshots are 2940 × 1670 for a 1470 × 835 CSS px viewport; 2 image pixels = 1 CSS px. The same PNG decoder and ink function process captured and candidate screenshots. Each text-only box samples its flat background and darkest solid text pixels. A pixel counts as ink when its projected colour distance from the background reaches 50% of the sampled background-to-core-text distance. This relative threshold handles light placeholders over coloured surfaces. Width is the inclusive first-to-last ink pixel span, in CSS px.
- Candidate fonts and SIL OFL license files remain in the local research font cache, downloaded from each family project's official repository. Each family's local `source.json` records the URL, embedded version, license, axis range, coverage result, and SHA-256. The variable `wght` axis includes 400 and 600; all requested Turkish glyphs were checked.
- A local HTML page loads the candidate files through `@font-face`. Repository Playwright launches its separate headless Chromium at `deviceScaleFactor: 2`. It renders the same labels in the individually sampled reference foreground and background colours. DOM `getBoundingClientRect()` advance widths are recorded separately; visible pixel widths determine the ranking. The shared reference browser and capture tool are not used.
- For each measurable style and family, 0.5 px size steps spanning the app-shell estimate ±2 px are rasterized. Eligible sizes keep both cap and x-height within 0.5 CSS px of the relative-threshold reference measurement. Only tiny utility and Help styles use the `app-shell.md` Type summary as their height target because their captured lowercase glyph cannot be isolated reliably. Among eligible sizes, the one minimizing that style's mean absolute ink-width error is selected; ties minimize summed cap and x-height error, then choose the smaller size. Styles with no eligible generic text retain the app-shell estimate and are excluded from width ranking.
- Cap and x-height use the first isolated capital and following lowercase letter in a generic label. For tiny utility text, glyph overlap makes direct reference isolation unreliable, so the app-shell Type summary remains the canonical height target; a standalone candidate `x` gives the comparable lowercase height. Measured and fitted height targets are stored separately in `reference-glyphs.json`. The measured 10.5/7.5 CSS px targets for group headings and menu items supersede the 11/7.5 and 11/8 values in `app-shell.md`; their source-spec correction is tracked in MEP-61. A scanline-only glyph can differ by 0.5 CSS px under antialiasing. Straight `l` stems are measured by summing normalized ink coverage across each horizontal row through the middle 45–65% of the glyph and averaging those rows; the script retains unrounded subpixel thickness and the tables show two decimals. The captured `l` comes from regular “Calls” and semibold “Sales”; candidate `l` glyphs use the same coverage function and the fitted style size.

## Reference measurements

**Loaded font:** not determinable from capture. None of four shell network logs records a font request or font MIME response. Each does contain a JSON response with a static-file listing that names one icon font and one web font file; a filename in a response does not establish that it loaded, which weights loaded, its family, or whether it is static or variable. No filename or URL is reproduced here.

| Style | App-shell size / weight | Fit target cap / x height (CSS px) | Relative-threshold check |
| --- | --- | --- | --- |
| Product / teamspace selector | approx. 16 / 600 | 11 / 8 | No eligible generic selector text |
| Page title | approx. 20 / 600 | 13 / 10 | 4 glyph runs; extracted first-pair 13/10 |
| Rail fixed link | approx. 15 / 400 | 10.5 / 7.5 | 9 glyph runs; extracted first-pair 10.5/7.5 |
| Rail active link | approx. 15 / 600 | 10.5 / 7.5 | 4 glyph runs; extracted first-pair 10.5/7.5 |
| Group heading | approx. 15 / 600 | 10.5 / 7.5 | 5 glyph runs; measured 10.5 / 7.5 |
| Rail child link | approx. 15 / 400 | 10.5 / 7.5 | 5 glyph runs; extracted first-pair 10.5/7.5 |
| Rail Search placeholder | approx. 15 / 400 | 10.5 / 7.5 | 6 glyph runs; sampled height within 0.5 px |
| Top-bar search placeholder | approx. 14 / 400 | 9.5 / 7 | 11 glyph runs; extracted first-pair 9.5/7 |
| Menu item | approx. 15 / 400 | 10.5 / 7.5 | 12 glyph runs; measured 10.5 / 7.5 |
| Utility label | approx. 8 / 400 | 6 / 4.5 | Tiny / coloured utility glyphs: retained app-shell height target |
| Help utility label | approx. 12 / 600 | 8 / 5.5 | Tiny / coloured utility glyphs: retained app-shell height target |

The relative-threshold measurement is the fit target for all styles with separable glyphs. The group-heading and menu-item targets are 10.5/7.5 CSS px, while `app-shell.md` currently states 11/7.5 and 11/8; that source-spec correction is tracked in MEP-61. Tiny utility and Help text retain the app-shell targets because the captured lowercase glyphs overlap at this resolution. The local `reference-glyphs.json` stores both the raw measured pair and the selected fit target.

Regular `l` stem: **1.46 CSS px**. Semibold `l` stem: **1.69 CSS px**. The reference `a` appears double-storey, `g` single-storey, `l` straight without a visible tail, dots softly squared, and terminals softly squared. Equal numeral widths cannot be established from eligible generic labels.

### Generic interface label ink widths

| Capture | Style | Label | Width (CSS px) |
| --- | --- | --- | ---: |
| `home-main` | Rail active link | Home (active) | 38.5 |
| `home-main` | Rail fixed link | Workqueue | 74.5 |
| `home-main` | Rail fixed link | Reports | 49.5 |
| `home-main` | Rail fixed link | Analytics | 58.5 |
| `home-main` | Rail fixed link | Agents | 45.5 |
| `home-main` | Rail fixed link | MCP Server | 74.5 |
| `home-main` | Rail Search placeholder | Search (rail) | 44.0 |
| `home-main` | Group heading | Sales | 34.0 |
| `home-main` | Group heading | Activities | 60.5 |
| `home-main` | Group heading | Integrations | 78.5 |
| `home-main` | Rail child link | Leads | 37.0 |
| `home-main` | Rail child link | Contacts | 58.5 |
| `home-main` | Rail child link | Accounts | 61.5 |
| `home-main` | Rail child link | Deals | 34.0 |
| `home-main` | Rail child link | Documents | 74.0 |
| `home-main` | Rail child link | Campaigns | 73.5 |
| `home-main` | Rail child link | Tasks | 35.0 |
| `home-main` | Rail child link | Meetings | 59.0 |
| `home-main` | Rail child link | Calls | 30.5 |
| `home-main` | Rail child link | Visits | 33.5 |
| `home-main` | Page title | Home (title) | 49.0 |
| `home-main` | Top-bar search placeholder | Search records | 89.0 |
| `home-main` | Utility label | My Pins | 27.5 |
| `home-main` | Utility label | Chats | 21.0 |
| `home-main` | Utility label | Channels | 34.0 |
| `home-main` | Utility label | Threads | 29.0 |
| `home-main` | Utility label | Contacts (utility) | 33.0 |
| `home-main` | Help utility label | Help | 23.0 |
| `home-more-actions` | Menu item | New Teamspace | 105.0 |
| `home-more-actions` | Menu item | Create Folder | 86.5 |
| `home-more-actions` | Menu item | Add Modules | 84.5 |
| `home-more-actions` | Menu item | Manage CRM Teamspace | 162.5 |
| `home-more-actions` | Menu item | View All Teamspace | 127.5 |
| `home-leads-navigation` | Rail active link | Leads (active) | 37.5 |
| `home-leads-navigation` | Page title | Leads (title) | 48.0 |

## Candidates

All five sources are the typeface project or designer repositories, not font collection sites. Their checked license text is SIL OFL 1.1. All files are variable with both 400 and 600 available, and each passes the full Turkish character check.

| Family | Official font source and license | Embedded version | 400 / 600 | Turkish coverage |
| --- | --- | --- | --- | --- |
| Figtree | [Font](https://github.com/erikdkennedy/figtree/blob/master/fonts/variable/Figtree%5Bwght%5D.ttf) · [SIL OFL 1.1](https://github.com/erikdkennedy/figtree/blob/master/OFL.txt) | 2.001 | Variable `wght` 300–900 | 14/14 |
| Mulish | [Font](https://github.com/googlefonts/mulish/blob/main/fonts/variable/Mulish%5Bwght%5D.ttf) · [SIL OFL 1.1](https://github.com/googlefonts/mulish/blob/main/OFL.txt) | 3.603 | Variable `wght` 200–1000 | 14/14 |
| Inter | [Font](https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.ttf) · [SIL OFL 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt) | 4.001 | Variable `wght` 100–900 | 14/14 |
| Source Sans 3 | [Font](https://github.com/adobe-fonts/source-sans/blob/release/VF/SourceSans3VF-Upright.ttf) · [SIL OFL 1.1](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md) | 3.052 | Variable `wght` 200–900 | 14/14 |
| Nunito Sans | [Font](https://github.com/googlefonts/NunitoSans/blob/main/fonts/variable/NunitoSans%5BYTLC,opsz,wdth,wght%5D.ttf) · [SIL OFL 1.1](https://github.com/googlefonts/NunitoSans/blob/main/OFL.txt) | 3.101 | Variable `wght` 200–1000 | 14/14 |

## Comparison

Ranking is lexicographic by visible width fit, then x/cap-height ratio, then stem thickness. The width score for sorting is mean absolute ink-width difference + 0.2 × maximum absolute difference (CSS px), across the same 35 generic-label instances for every family. “Ratio gap” is the mean absolute percentage-point gap between candidate and the relative-threshold target x/cap ratios across ten measurable styles; tiny utility and Help use their app-shell targets. Stem deltas are candidate minus reference, in CSS px.

| Rank / family | Width score | Width mean / max abs. (CSS px) | Width mean / max abs. (%) | Signed mean (CSS px) | Ratio gap (pp) | Stem Δ 400 / 600 (CSS px) | Letter-form differences |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1. Figtree | 1.01 | 0.61 / 2.00 | 1.27 / 5.97 | +0.30 | 0.94 | +0.02 / +0.25 | Double-storey a and single-storey g match; dot and terminals are slightly rounder; straight l. |
| 2. Inter | 1.30 | 0.80 / 2.50 | 1.81 / 7.14 | +0.06 | 3.17 | +0.01 / +0.36 | Double-storey a and single-storey g match; rounder dot and sharper terminals. |
| 3. Source Sans 3 | 1.44 | 0.84 / 3.00 | 1.44 / 4.88 | -0.30 | 3.01 | +0.17 / +0.31 | Double-storey a matches; double-storey g and small foot on l differ; sharper terminals. |
| 4. Mulish | 1.56 | 0.96 / 3.00 | 2.00 / 7.46 | +0.39 | 3.02 | +0.00 / -0.07 | Single-storey a differs; single-storey g and straight l match; round dot. |
| 5. Nunito Sans | 1.84 | 0.94 / 4.50 | 1.83 / 5.88 | +0.34 | 1.30 | -0.01 / +0.02 | Double-storey a and single-storey g match; dot and terminals are rounder. |

### Fitted font sizes (CSS px)

| Candidate | Product / teamspace selector | Page title | Rail fixed link | Rail active link | Group heading |
| --- | ---: | ---: | ---: | ---: | ---: |
| Figtree | provisional | 18.5 | 14.5 | 14.5 | 14.5 |
| Inter | provisional | 18 | 13.5 | 13.5 | 13.5 |
| Source Sans 3 | provisional | 20 | 15.5 | 15.5 | 15.5 |
| Mulish | provisional | 18 | 14 | 14 | 14 |
| Nunito Sans | provisional | 18.5 | 14.5 | 14.5 | 14.5 |

| Candidate | Rail child link | Rail Search placeholder | Top-bar search placeholder | Menu item | Utility label | Help utility label |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Figtree | 14.5 | 14.5 | 13.5 | 14.5 | 8.5 | 11.5 |
| Inter | 14 | 13.5 | 12.5 | 13.5 | 8 | 10.5 |
| Source Sans 3 | 15.5 | 16 | 14.5 | 16 | 9 | 12 |
| Mulish | 14.5 | 14 | 13 | 14 | 8 | 11 |
| Nunito Sans | 14.5 | 15 | 13.5 | 14.5 | 7.5 | 11 |

For product and teamspace selectors, generic text is unavailable. The app-shell 16 px / 600 estimate is provisional for every candidate and was excluded from fit and ranking.

### Signed ink-width differences for recommendation and backup

Candidate minus reference, CSS px. These are visible pixel extents, distinct from DOM advance widths.

| Label | Reference width | Figtree Δ | Inter Δ | Figtree DOM width | Inter DOM width |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home (active) | 38.5 | +0.0 | -1.5 | 39.81 | 38.42 |
| Workqueue | 74.5 | -1.0 | -2.0 | 73.91 | 73.09 |
| Reports | 49.5 | +0.0 | -1.5 | 51.09 | 49.44 |
| Analytics | 58.5 | +0.5 | -0.5 | 59.55 | 58.52 |
| Agents | 45.5 | +0.5 | -1.0 | 46.47 | 44.86 |
| MCP Server | 74.5 | +1.0 | +1.0 | 76.59 | 76.58 |
| Search (rail) | 44.0 | +0.0 | -0.5 | 45.06 | 44.81 |
| Sales | 34.0 | +0.0 | +0.5 | 34.61 | 35.47 |
| Activities | 60.5 | +2.0 | +0.0 | 62.77 | 60.95 |
| Integrations | 78.5 | +0.5 | -1.5 | 80.03 | 78.25 |
| Leads | 37.0 | -0.5 | +1.5 | 38.11 | 40.05 |
| Contacts | 58.5 | +0.5 | -0.5 | 59.86 | 59.23 |
| Accounts | 61.5 | +0.5 | +0.5 | 62.22 | 62.44 |
| Deals | 34.0 | +0.0 | +1.5 | 35.23 | 37.05 |
| Documents | 74.0 | -0.5 | -0.5 | 74.89 | 75.31 |
| Campaigns | 73.5 | -1.5 | +0.0 | 72.88 | 74.56 |
| Tasks | 35.0 | -0.5 | +2.5 | 35.06 | 38.34 |
| Meetings | 59.0 | +0.0 | +0.5 | 60.30 | 61.20 |
| Calls | 30.5 | -0.5 | +0.5 | 30.98 | 32.27 |
| Visits | 33.5 | +2.0 | +1.0 | 35.75 | 35.67 |
| Home (title) | 49.0 | +0.0 | +0.0 | 50.80 | 50.67 |
| Search records | 89.0 | +1.0 | +0.0 | 91.09 | 90.17 |
| My Pins | 27.5 | +1.0 | +1.5 | 29.36 | 30.02 |
| Chats | 21.0 | +0.5 | +0.0 | 22.39 | 21.83 |
| Channels | 34.0 | +0.5 | +0.5 | 35.17 | 35.34 |
| Threads | 29.0 | +1.0 | +1.0 | 30.23 | 31.14 |
| Contacts (utility) | 33.0 | +1.5 | +0.0 | 35.09 | 33.86 |
| Help | 23.0 | +0.0 | -0.5 | 24.55 | 23.34 |
| New Teamspace | 105.0 | +0.5 | +0.0 | 107.14 | 106.41 |
| Create Folder | 86.5 | +1.0 | -1.5 | 88.30 | 86.28 |
| Add Modules | 84.5 | +0.5 | -1.0 | 85.39 | 84.45 |
| Manage CRM Teamspace | 162.5 | -0.5 | -0.5 | 163.75 | 163.58 |
| View All Teamspace | 127.5 | +1.0 | +0.0 | 129.08 | 128.47 |
| Leads (active) | 37.5 | +0.0 | +0.5 | 38.61 | 39.36 |
| Leads (title) | 48.0 | -0.5 | +2.0 | 49.27 | 51.78 |

At the corrected sizes, Figtree’s top-bar “Search records” and menu “View All Teamspace” each differ by +1.0 CSS px. The earlier opposite-direction 6.5/5.5 px outliers arose from selecting sizes using heights alone and a fixed contrast threshold. The largest remaining Figtree error is Activities and Visits at 2.0 CSS px. No global letter-spacing correction is supported.

### Variable-weight stem check

The reference regular and semibold stems measure **1.46 / 1.69 CSS px**. Figtree at 400 / 600 measures **1.48 / 1.94 CSS px**. With fitted sizes held fixed, the following Figtree `wght` sweep changes only the semibold labels; the width statistics cover all 35 labels. The script retains unrounded stem values before presentation.

| `wght` | Semibold stem (CSS px) | Width mean abs. (CSS px) | Width max abs. (CSS px) |
| ---: | ---: | ---: | ---: |
| 500 | 1.67 | 0.66 | 2.00 |
| 510 | 1.69 | 0.64 | 2.00 |
| 520 | 1.70 | 0.64 | 2.00 |
| 530 | 1.71 | 0.64 | 2.00 |
| 540 | 1.72 | 0.66 | 2.00 |
| 550 | 1.75 | 0.66 | 2.00 |
| 560 | 1.79 | 0.63 | 2.00 |
| 570 | 1.82 | 0.63 | 2.00 |
| 580 | 1.86 | 0.61 | 2.00 |
| 590 | 1.90 | 0.60 | 2.00 |
| 600 | 1.94 | 0.61 | 2.00 |

At `wght` 510, Figtree’s semibold stem matches the reference to two decimals and the mean width error increases from 0.61 to 0.64 CSS px; the maximum remains 2.0 CSS px. `wght` 590 has the lowest mean width error, 0.60 CSS px, but its 1.90 CSS px stem is farther from the reference. The comparison tables above use 600; the adopted weight is 510 (MEP-66, 2026-10-04).

## Recommendation

**Recommend Figtree** for board review. Its width mean/maximum error is **0.61 / 2.0 CSS px** (1.27% / 5.97%), x/cap ratio gap **0.94 percentage points**, and regular/semibold stem deltas **+0.02 / +0.25 CSS px**. Its `a` and `g` constructions match the reference. **Backup: Inter** under the width-first score: **0.80 / 2.5 CSS px** (1.81% / 7.14%), ratio gap **3.17 percentage points**, and stem deltas **+0.01 / +0.36 CSS px**. Mulish fits the semibold stem more closely (**−0.07 CSS px**) but has width mean/maximum **0.96 / 3.0 CSS px** under the same height targets.

The second through fifth candidates differ in mean absolute width by only about 0.16 CSS px, below the 0.5 CSS px bitmap width step. Their backup order is therefore weakly determined by width; the score also accounts for the maximum error.

Adopted Figtree values (`letter-spacing: normal`). The board selected Figtree on 2026-10-04 (MEP-66). Bold weight is 510: at that weight the bold stem equals the reference's 1.69 CSS px, and the width error is 0.64 mean / 2.0 maximum CSS px.

| Style | `font-size` | `font-weight` |
| --- | ---: | ---: |
| Product selector | 16px (provisional) | 510 |
| Page title | 18.5px | 510 |
| Rail fixed link | 14.5px | 400 |
| Rail active link | 14.5px | 510 |
| Teamspace selector | 16px (provisional) | 510 |
| Group heading | 14.5px | 510 |
| Rail child link | 14.5px | 400 |
| Rail Search placeholder | 14.5px | 400 |
| Top-bar search placeholder | 13.5px | 400 |
| Menu item | 14.5px | 400 |
| Utility label | 8.5px | 400 |
| Help utility label | 11.5px | 510 |

No font or application code is changed by this research task.

## List and detail text roles

The measurements below use only existing local captures and extend the Method above: 2 image pixels equal 1 CSS px; the same 50% relative foreground-to-background distance defines visible ink, not a DOM advance box. Backgrounds are sampled as the most common color across the text scanlines (excluding core text pixels), or at the vertical center of the label bounding box for vertical gradients (such as primary buttons); text color is sampled from the darkest solid core pixels (or `#FFFFFF` for white text). Cap and x-height targets use the vertical ink spans of isolated first capitals and lowercase x-height glyphs. Straight lowercase `l` stems use normalized coverage averaged through the middle 45–65% of that glyph, in CSS px. Where a generic label has no lowercase `l`, the straight vertical stem of lowercase `i` (below the dot, in the middle 45–65% of the glyph) is measured and marked with `(i)` in the table; Figtree's straight vertical `i` and `l` strokes have identical thickness. For thick headings that exceeded the previous 600 ceiling, the variable-weight scan was extended from 600 up to 800 in steps of 10. Record, owner, and event values contribute heights and stems only; their customer strings and widths are excluded.

For each role, Figtree was rendered at 0.5 px size steps across the entire eligible height band (where both cap and x-height are within 0.5 CSS px of the capture). Generic labels were rendered across all sizes in their height band at weights 400, 500, 600, and at the role's fitted weight. A candidate size is chosen only when it forms an interior local minimum (mean absolute ink-width error is strictly lower than both adjacent 0.5 px neighbors in the band). If error is monotonic across the band or minimizes at the boundary, the size is reported as `not measurable: width fit has no minimum inside the height band (<band>)`. Size selection follows a two-step cycle: initial size fit at starting weight, stem measurement to identify the closest Figtree variable weight, and a re-evaluation of width fit at that fitted weight. Roles lacking an isolated `l` or `i` report the size range obtained across weights 400 and 600. Value-only roles report their height band and suggest the token of the label role with that height (`--text-md` or `--text-sm`), without inventing unsupported size tokens.

| Role | Spec estimate | Measured cap / x height | Figtree font-size | `wght` (reference → Figtree stem) | Suggested token | Evidence (capture slug, generic labels / ink widths) |
| --- | --- | --- | ---: | --- | --- | --- |
| List view tab | ~13 / semibold | 9.5 / 7 | 13.5 | 640 (1.75 → 1.75) | --text-sm | list-default, list-converted (2; 55, 104) |
| List toolbar Filter / Sort | ~14 / medium | 10–10.5 / 7.5 | 14 | 560 (1.61 → 1.61) | --text-md or new value needed: 14px | list-default (2; 32, 26.5) |
| List primary button | ~14 / unspecified | 10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (14–15.5 px) | not measurable: no isolated lowercase `l` or `i` (14.5px at 400, 14px at 600) | --text-md | list-default (1; 77) |
| Filter panel title | ~15 / semibold | 10 / 7.5 | 14.5 | 660 (1.92 → 1.93) | --text-md | list-default (1; 95.5) |
| Filter group heading | ~14 / semibold | 11 / 8 | 15.5 | 650 (2.06 → 2.04) | new value needed: 15.5px | list-default (1; 102) |
| Filter checkbox row | ~14 / regular | 10–10.5 / 7.5 | 14.5 | 410 (1.32 → 1.32) | --text-md | list-default (3; 59, 73.5, 120.5) |
| Table column header | ~14 / medium | 10–10.5 / 7.5 | 14.5 | 410 (1.32 → 1.32) | --text-md | list-default (3; 71.5, 63, 33.5) |
| Table cell value | ~14 / regular | 10 / 7.5 | 13.5–15 px (height band 10 / 7.5) | not measurable: no isolated lowercase `l` or `i` | --text-md | list-default (2 value crops; widths omitted) |
| Footer fixed label | ~13 / unspecified | 10 / 7.5 | 14.5 | 400 (1.31 → 1.30) | --text-md | list-default (1; 87) |
| Footer connector `to` | ~13 / unspecified | not measurable | not measurable: adjacent endpoints enter the crop; no separable glyphs | not measurable | not measurable | list-default (unmeasurable) |
| Filter search placeholder | unspecified | 10.5 / 7.5 | 14.5 | not measurable: no isolated lowercase `l` or `i` (14.5px at 400, 14px at 600) | --text-md | list-default (1; 43.5) |
| Empty-list message | unspecified | 10 / 7.5 | 14.5 | not measurable: no isolated lowercase `l` or `i` (14.5px at 400, 14px at 600) | --text-md | list-converted (1; 103.5) |
| Record title value | 18.5 / 600 candidate | 14.5 / 11 | 20.5–21 px (height band 14.5 / 11) | not measurable: no isolated lowercase `l` or `i` | new value needed: 20.5–21px | detail-main (1 value crop; widths omitted) |
| Record primary command | unspecified | 10.5 / 7.5 | 14.5 | 620 (1.81 → 1.81) | --text-md | detail-main (1; 71.5) |
| Record secondary button | unspecified | 10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (14–15.5 px) | not measurable: no isolated lowercase `l` or `i` (14.5px at 400/600) | --text-md | detail-main (1; 52.5) |
| Related-list rail heading | 14.5 / 600 candidate | 11 / 8 | 15.5 | 640 (2.02 → 2.01) | new value needed: 15.5px | detail-main (1; 81.5) |
| Related-list rail row | 14.5 / 400 candidate | 10–10.5 / 7.5 | 14.5 | not measurable: no isolated lowercase `l` or `i` (14.5px at 400/600) | --text-md | detail-main (2; 36.5, 128.5) |
| Selected Overview tab | unspecified | 11.5 / 8 | not measurable: width fit has no minimum inside the height band (14.5–16.5 px) | 520–540 (i) (1.68 → 1.68) | new value needed: 15.5px | detail-main (1; 65.5) |
| Inactive Timeline tab | unspecified | 11 / 8 | not measurable: width fit has no minimum inside the height band (14.5–16.5 px) | 410 (1.44 → 1.43) | new value needed: 15.5px | detail-main (1; 58.5) |
| Status stage value | unspecified | 9.5 / 7 | 13–14 px (height band 9.5 / 7) | not measurable: no isolated lowercase `l` or `i` | --text-sm | detail-main (1 value crop; widths omitted) |
| Business/details field label | 14.5 / 400 candidate | 10 / 7.5 | 14.5 | 450 (1.41 → 1.40) | --text-md | detail-main (2; 77, 33.5) |
| Business/details field value | unspecified | 10 / 7.5 | 13.5–15 px (height band 10 / 7.5) | not measurable: no isolated lowercase `l` or `i` | --text-md | detail-main (2 value crops; widths omitted) |
| Details divider heading | unspecified | 11 / 8 | 15.5 | 650 (2.06 → 2.04) | new value needed: 15.5px | detail-main (1; 84.5) |
| Details subsection heading | unspecified | 10 / 7.5 | 14.5 | 650 (i) (1.89 → 1.90) | --text-md | detail-main (1; 112.5) |
| Header tag command | unspecified | not measurable | not measurable: tag icon overlaps the available label crop | not measurable | not measurable | detail-main (unmeasurable) |
| Header recency text | unspecified | 9.5 / 7 | not measurable: width fit has no minimum inside the height band (13–14 px) | not measurable: no isolated lowercase `l` or `i` (14px at 400/600) | --text-sm | detail-main (1; 76.5) |
| Timeline active subtab | 14.5 / 600 candidate | 11 / 8.5 | 15 | 560 (i) (1.71 → 1.72) | new value needed: 15px | detail-timeline-filter (1; 48.5) |
| Timeline inactive subtab | 14.5 / 600 candidate (conflicts: measured regular 400) | 11 / 8 | 15.5 | 400 (i) (1.38 → 1.41) | new value needed: 15.5px | detail-timeline-filter (1; 81.5) |
| Timeline heading | unspecified | 11 / 8 | 15.5 | 640 (2.01 → 2.01) | new value needed: 15.5px | detail-timeline-filter (1; 116) |
| Timeline filter label | unspecified | 10–10.5 / 7.5 | 14.5 | 410 (1.32 → 1.32) | --text-md | detail-timeline-filter (2; 54, 52) |
| Timeline filter selected text | unspecified | 10 / 7.5 | 14.5 | 470 (1.45 → 1.45) | --text-md | detail-timeline-filter (1; 74) |
| Disabled Apply Filter button | unspecified | 10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (14–15.5 px) | 570 (1.70 → 1.69) | --text-md | detail-timeline-filter (1; 74) |
| Timeline event title value | unspecified | 10 / 7.5 | 13.5–15 px (height band 10 / 7.5) | not measurable: no isolated lowercase `l` or `i` | --text-md | detail-timeline-filter (1 value crop; widths omitted) |
| Timeline date, time, byline | unspecified | not measurable | not measurable: date/time lack cap/x pair; byline mixes clipped value and date | not measurable | not measurable | detail-timeline-filter (unmeasurable) |
| Interactions heading | unspecified | 11 / 8 | 15.5 | 650 (i) (2.04 → 2.04) | new value needed: 15.5px | detail-interactions (1; 156.5) |
| Interactions legend | unspecified | 9.5 / 7 | not measurable: width fit has no minimum inside the height band (13–14 px) | 440 (1.29 → 1.28) | --text-sm | detail-interactions (2; 43, 73) |
| Interactions empty text | unspecified | 9.5 / 7 | 13.5 | 450 (1.31 → 1.30) | --text-sm | detail-interactions (1; 99.5) |
| More Options menu | 14.5 / 400 candidate | 10.5 / 7.5 | 14.5 | 410 (1.32 → 1.32) | --text-md | detail-more (2; 37, 36) |
| Create form title | 18.5 / 600 candidate | 14.5 / 11 | not measurable: width fit has no minimum inside the height band (20.5–21 px) | not measurable: no isolated lowercase `l` or `i` (21px at 400, 20.5px at 600) | new value needed: 20.5–21px | detail-create (1; 113) |
| Create form button | unspecified | 10–10.5 / 7.5 | 14.5 | 530 (1.61 → 1.60) | --text-md | detail-create (2; 30.5, 44.5) |
| Create form section heading | 14.5 / 600 candidate | 10 / 7.5 | 14.5 | 650 (i) (1.89 → 1.90) | --text-md | detail-create (2; 112.5, 76) |
| Create form field label | 14.5 / 400 candidate | 10–10.5 / 7.5 | 14.5 | 430 (1.36 → 1.36) | --text-md | detail-create (2; 62.5, 33) |
| Filled form value | unspecified | 10 / not measurable | 13.5–15 px (height band 10 / not measurable) | not measurable: no isolated lowercase `l` or `i` | --text-md | detail-create (1 value crop; widths omitted) |
| Empty form picklist text | unspecified | 10 / 7.5 | not measurable: width fit has no minimum inside the height band (13.5–15 px) | not measurable: no isolated lowercase `l` or `i` (13.5px at 400/600) | --text-md | detail-create (1; 42.5) |
| Selected dropdown option | unspecified | 10 / 7.5 | 14 | not measurable: no isolated lowercase `l` or `i` (14px at 400/600) | new value needed: 14px | detail-create-salutation-panel (1; 44.5) |
| Ordinary dropdown option value | unspecified | 10 / 7.5 | 13.5–15 px (height band 10 / 7.5) | 400 (1.31 → 1.30) | --text-md | detail-create-country (1 value crop; widths omitted) |
| Owner picker primary value | unspecified | 10 / not measurable | 13.5–15 px (height band 10 / not measurable) | not measurable: no isolated lowercase `l` or `i` | --text-md | detail-create-owner-panel (1 value crop; widths omitted) |
| Owner picker secondary value | unspecified | not measurable | not measurable: clipped text overlaps row boundary | not measurable | not measurable | detail-create-owner-panel (unmeasurable) |
| Select User dialog title | unspecified | 14.5 / 11 | not measurable: width fit has no minimum inside the height band (20.5–21 px) | 640 (2.71 → 2.73) | new value needed: 20.5–21px | detail-create-owner (1; 107) |
| Select User table header | unspecified | 10 / 7.5 | 14.5 | 530 (1.61 → 1.60) | --text-md | detail-create-owner (2; 70.5, 27.5) |
| Select User summary label | unspecified | 10.5 / 7.5 | 14.5 | 430 (1.37 → 1.36) | --text-md | detail-create-owner (1; 92.5) |
| Select User search placeholder | unspecified | 10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (14–15.5 px) | not measurable: no isolated lowercase `l` or `i` (14px at 400/600) | --text-md | detail-create-owner (1; 83) |
| Select User footer button | unspecified | 10.5 / 7.5 | 14.5 | 520 (1.59 → 1.58) | --text-md | detail-create-owner (2; 34, 43.5) |
| Related-list card heading | unspecified | 11 / 8 | 15 | not measurable: no isolated lowercase `l` or `i` (15.5px at 400, 15px at 600) | new value needed: 15px | detail-notes-card (1; 40.5) |
| Related-list card action | unspecified | 9.5 / 7 | not measurable: width fit has no minimum inside the height band (13–14 px) | not measurable: no isolated lowercase `l` or `i` (13px at 400/600) | --text-sm | detail-attachments-card (1; 39.5) |
| Related-list input placeholder | unspecified | 10 / 7.5 | 14 | not measurable: no isolated lowercase `l` or `i` (14px at 400/600) | new value needed: 14px | detail-notes-card (1; 69) |
| Related-list empty message | unspecified | 10 / 7.5 | not measurable: width fit has no minimum inside the height band (13.5–15 px) | not measurable: no isolated lowercase `l` or `i` (14px at 400/600) | --text-md | detail-notes-card (1; 110.5) |
| Related-list loading message | unspecified | 10 / 7.5 | not measurable: width fit has no minimum inside the height band (13.5–15 px) | 450 (i) (1.40 → 1.40) | --text-md | detail-notes-card (1; 64.5) |
| Sort dialog heading | ~14 / medium | 10.5 / 7.5 | 14 | not measurable: no isolated lowercase `l` or `i` (14px at 400, 13.5px at 600) | --text-md or new value needed: 14px | list-sort (1; 45.5) |
| Sort dialog field selector value | unspecified | 9.5 / 7 | not measurable: width fit has no minimum inside the height band (13–14 px) | not measurable: no isolated lowercase `l` or `i` (13px at 400/600) | --text-sm | list-sort (1; 30.5) |
| Sort dialog order selector option | unspecified | 9.5–10 / 7 | 13.5 | 400 (i) (1.21 → 1.21) | --text-sm | list-sort (1; 63.5) |
| Sort dialog footer button | ~13.5 / unspecified | 9.5–10 / 7 | 13.5 | 530 (1.47 → 1.47) | --text-sm | list-sort (1; 41) |
| Sort dialog disabled Apply button | ~13.5 / unspecified | 9.5–10 / 7 | not measurable: width fit has no minimum inside the height band (13–14 px) | 620 (1.70 → 1.71) | --text-sm | list-sort (1; 35.5) |
| Manage Columns dialog title | 18.5 / semibold candidate | 14.5 / 11 | 21 | 630–650 (2.70 → 2.69) | new value needed: 20.5–21px | list-columns (1; 164.5) |
| Manage Columns search placeholder | unspecified | 10.5 / 7.5 | 14.5 | not measurable: no isolated lowercase `l` or `i` (14.5px at 400/600) | --text-md | list-columns (1; 44) |
| Manage Columns checkbox row | ~14 / regular | 10.5–11 / 7.5 | 14.5 | 410 (1.32 → 1.32) | --text-md | list-columns (10; 93, 75, 62.5, 33.5, 40, 79, 77.5, 67.5, 27, 51.5) |
| Manage Columns footer button | unspecified | 10.5 / 7.5 | 14.5 | 530 (1.61 → 1.60) | --text-md | list-columns (1; 44.5) |
| Manage Columns primary Save button | unspecified | 10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (13.5–15.5 px) | not measurable: no isolated lowercase `l` or `i` (14.5px at 400, 14px at 600) | --text-md | list-columns (1; 30.5) |
| List menu item | 14.5 / 400 candidate | 10–10.5 / 7.5 | 14.5 | 410 (1.31 → 1.32) | --text-md | list-more, list-actions, list-view-options (11; 18, 83, 125, 117, 101, 76.5, 84, 114.5, 37.5, 69.5, 63.5) |
| List menu item (hovered) | 14.5 / 400 candidate | 10–10.5 / 7.5 | 14.5 | 400 (1.30 → 1.30) | --text-md | list-more, list-actions, list-view-options, list-settings (4; 83.5, 87.5, 23, 110) |
| List menu item (disabled) | unspecified | 10–10.5 / 7.5 | 14 | 430 (1.32 → 1.31) | --text-md or new value needed: 14px | list-view-options, list-settings (4; 37, 70, 75, 118) |
| Table settings row label | unspecified | 10.5–11 / 7.5 | 14 | 420 (i) (1.29 → 1.29) | --text-md or new value needed: 14px | list-settings (2; 110.5, 69) |
| Table settings row value | unspecified | 10–10.5 / 7.5 | not measurable: width fit has no minimum inside the height band (13.5–15.5 px) | 640–660 (r, t) (1.88–1.92 → 1.87–1.93) | --text-md | list-settings (2; 13.5, 66.5) |
| View selector menu item | unspecified | not measurable | not measurable: view selector dropdown menu was not opened in capture (only tab focus state captured) | not measurable | --text-md | list-view-selector (unmeasurable) |

Measured straight stems partition list and detail typography into three distinct weight classes rather than a separate 'medium' tier: regular body, column headers, menu items, and field labels at stems 1.21–1.45 CSS px (Figtree `wght` 400–470); semibold controls, form/dialog buttons, and active subtabs at stems 1.47–1.71 CSS px (`wght` 520–560; 1.47 CSS px for 13.5px Sort footer button, 1.59–1.71 CSS px at 14–15.5px); and bold headings, panel titles, and list view tabs at stems 1.75 CSS px at 13.5px, 1.89–1.92 CSS px at 14.5px, 2.01–2.06 CSS px at 15.5px, and 2.70–2.71 CSS px at 21px (`wght` 630–660). No generic roles fall in the gaps between 470 and 520 or between 560 and 630 (aside from three isolated white-on-fill buttons: Disabled Apply Filter at 570, Record primary command at 620 and Sort dialog disabled Apply at 620). 'Medium' is not a separate weight: the two roles previously estimated as 'medium' divide into regular (column headers) and semibold (toolbar controls). The semibold group directly aligns with the app shell's adopted 510 token region, while the bold heading group currently has no existing token (suggested token: `new value needed: 650`).

### Size and weight classes

The evidence supports six distinct size tiers and three weight groups across the list and detail screens:

#### Size classes

| Size | Height target (cap / x) | Supported roles | Suggested token | Notes |
| ---: | --- | --- | --- | --- |
| 13.5px | 9.5 / 7 | List view tab, Interactions empty text, Sort dialog order selector option, Sort dialog footer button; height band for Status stage value, Interactions legend, Header recency, Card action, Sort dialog field selector value, Sort dialog disabled Apply button | `--text-sm` (13.5px) | Existing token `--text-sm` (13.5px) fits all 9.5/7 roles. |
| 14.0px | 10 / 7.5 | List toolbar Filter/Sort, Selected dropdown option, Related-list input placeholder, Sort dialog heading, List menu item (disabled), Table settings row label | `--text-md` or `new value needed: 14px` | Supported by 1–2 generic labels per role (toolbar MAE is 0.25 at 14px vs 0.50 at 14.5px). If 14px is not added, `--text-md` (14.5px) differs by only 0.5 CSS px. |
| 14.5px | 10–10.5 / 7.5 | Column header, Filter title & checkbox row, Footer fixed, Details subsection & Create section headings, Field labels, Command & buttons, Timeline labels, Select User table header & footer buttons, Manage Columns search placeholder, Manage Columns checkbox row, Manage Columns footer button, List menu item, List menu item (hovered); height band for all table/field values, Manage Columns primary Save button, Table settings row value | `--text-md` (14.5px) | Dominant body, control, and section-heading size. Fully covered by existing token `--text-md`. |
| 15.0px | 11 / 8.5 (and 11 / 8 for Notes) | Timeline active subtab (History), Related-list card heading (Notes) | `new value needed: 15px` | Supported by single-label samples (Timeline subtab targets 11 / 8.5, while Related-list card heading is 11 / 8; both minimize at 15px). |
| 15.5px | 11 / 8 | Filter group heading, Related-list rail heading, Timeline inactive subtab (Interactions), Timeline heading, Details divider heading, Customer Interactions heading; height class only (width fit has no interior minimum): Selected Overview tab (11.5 / 8), Inactive Timeline tab | `new value needed: 15.5px` | Consistent interior minimum for all 11 / 8 headings and subtabs. |
| 20.5–21.0px | 14.5 / 11 | Create form title, Select User dialog title, Manage Columns dialog title; height band for Record title value | `new value needed: 20.5–21px` | Distinct large title tier. Exceeds existing `--text-xl` (18.5px) by 2–2.5 CSS px. |

#### Weight classes

| Group | Stem range (CSS px) | Figtree `wght` | Representative roles | Relationship to shell tokens | Suggested token |
| --- | --- | ---: | --- | --- | --- |
| **Regular** | 1.21–1.45 (at 13.5–15.5px) | 400–470 | Table column header (410), Filter checkbox (410), Footer fixed (400), Timeline filter label (410), Field labels (430–450), Inactive Timeline tab (410), Timeline inactive subtab (400), Timeline filter selected text (470), Dropdown options (400), Related-list loading (450), Select User summary label (430), Sort dialog order selector option (400), Manage Columns checkbox row (410), List menu item (410), List menu item (hovered) (400), List menu item (disabled) (430), Table settings row label (420) | Matches `--font-weight-normal` (400); variation up to 470 reflects antialiasing on single-label samples. | `--font-weight-normal` |
| **Semibold** | 1.47–1.71 (at 13.5–15.5px) | 520–560 | List toolbar Filter/Sort (530–560), Form Cancel button (530), Select User table header Role (530), Select User footer button Cancel (520), Overview tab (520–540), Timeline active subtab History (560), Sort dialog footer button (530), Manage Columns footer button (530) | Tightly clusters with the app shell's adopted semibold weight **510**. | `--font-weight-semibold` (510; measured 520–560) |
| **Bold headings** | 1.75 at 13.5px; 1.89–1.92 at 14.5px; 2.01–2.06 at 15.5px; 2.70–2.71 at 21px | 630–660 | List view tab (640), Filter panel title (660), Filter group heading (650), Related-list rail heading (640), Details divider heading (650), Details subsection heading (650), Create form section heading (650), Timeline heading (640), Customer Interactions heading (650), Select User dialog title (640), Manage Columns dialog title (630–650), Table settings row value (640–660) | Heavy section dividers, major panel headings, modal titles, and list view tabs; no existing token. | `new value needed: 650` |

### Open questions for list and detail typography

- In `record-detail.md`, the heading entries specify "cap/x 13/10, 18.5 px", but the direct measurement on the capture shows cap/x 14.5 / 11 px (matching Figtree 20.5–21 px). `record-detail.md` was corrected to the measured values afterwards; the measured rows in this file remain the source.
- In `list-views.md`, the common dialog title was estimated as ~18.5 px / semibold, but the direct measurement on `list-columns` (Manage Columns) shows cap/x 14.5 / 11 px, which fits Figtree 21 px (MAE 1.0) with a bold stem of 2.70 CSS px (`wght` 630–650). This aligns directly with `Select User dialog title` (20.5–21 px / `wght` 640). Modal overlay dialog titles across list and record screens form a consistent 20.5–21 px / bold tier.
- Sort dialog buttons in `list-sort` measure cap/x 9.5–10 / 7 px and fit the smaller 13.5 px tier (`--text-sm`) with Cancel at `wght` 530 (stem 1.47 CSS px) and disabled Apply at `wght` 620 (stem 1.70 CSS px), in contrast to standard form and modal buttons which use 14.5 px (`--text-md`).
- White text rendered over solid background fills (Disabled Apply Filter button at `wght` 570 / stem 1.70 CSS px; Record primary command at `wght` 620 / stem 1.81 CSS px; Sort dialog disabled Apply button at `wght` 620 / stem 1.70 CSS px; Manage Columns primary Save button (weight not measurable)) sits between the semibold (520–560) and bold (630–660) clusters. Because each is supported by only a single label, whether button fills introduce a distinct intermediate weight or should map to semibold/bold remains an open question.
- Disabled menu items and table settings row labels minimize at 14 px, but appear in the same menus and share the same cap / x-height (10–10.5 / 7.5 px) as ordinary menu items measured at 14.5 px. Because the 14 px fit is supported by only 4 and 2 labels respectively, this 0.5 px difference may fall within single-capture fitting variation; unless a wider multi-capture sample establishes an intentional distinction, all items within a menu should adopt `--text-md`.
- The list footer connector, header tag command, and timeline byline require an isolated, generic-label crop before a defensible cap/x-height and width fit can be measured.
- In `list-view-selector`, clicking the view tab produced only tab focus and revealed the tab's options ellipsis without opening the view selector dropdown menu; view selector dropdown menu options remain unobservable in this capture.
- Record and owner values without an isolated lowercase `l` support height-only sizes. Their weights remain unmeasured; no customer string or width is retained here.
- For roles whose width fit has no interior minimum inside the height band (e.g. List primary button, Related-list empty/loading, Create form title, Sort dialog field selector value, Manage Columns primary Save button, Table settings row value), the value of the size class with the same cap / x height is suggested (`--text-sm`, `--text-md`, 15.5 px, or 20.5–21 px); establishing a subpixel distinction would require wider multi-label captures.

## Open questions

- The loaded reference family, number of source weights, and static/variable format remain not determinable from capture. A static-file listing in a JSON response is insufficient evidence of loading.
- Product and teamspace selector text cannot be used under the generic-label rule; their provisional size is based on app-shell heights, without a direct width match.
- Equal numeral widths cannot be established from eligible generic labels.
- The small utility captions and Help provide low-resolution height evidence; a future customer-free capture at a higher device scale could reduce their uncertainty.

## Capture refs

Existing local `home-main`, `home-leads-navigation`, and `home-more-actions` screenshots provide all measurements. Their `network.json` files plus `home-search/network.json` provide the font-request check. No new capture or live reference CRM access occurred.
