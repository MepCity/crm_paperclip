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

## Open questions

- The loaded reference family, number of source weights, and static/variable format remain not determinable from capture. A static-file listing in a JSON response is insufficient evidence of loading.
- Product and teamspace selector text cannot be used under the generic-label rule; their provisional size is based on app-shell heights, without a direct width match.
- Equal numeral widths cannot be established from eligible generic labels.
- The small utility captions and Help provide low-resolution height evidence; a future customer-free capture at a higher device scale could reduce their uncertainty.

## Capture refs

Existing local `home-main`, `home-leads-navigation`, and `home-more-actions` screenshots provide all measurements. Their `network.json` files plus `home-search/network.json` provide the font-request check. No new capture or live reference CRM access occurred.
