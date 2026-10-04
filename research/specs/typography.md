# Typography candidate research

## Method

- Evidence is restricted to existing local screenshots and network logs. No live reference CRM request or capture was made; no reference font file was downloaded or used. Measurement and rendering scripts live in the local research workspace at `tools/typography/` and are deliberately outside this repository.
- Screenshots are 2940 × 1670 for a 1470 × 835 CSS px viewport; 2 image pixels = 1 CSS px. The same PNG decoder and ink function process captured and candidate screenshots. Each text-only box samples its flat background and darkest solid text pixels. A pixel counts as ink when its projected colour distance from the background reaches 50% of the sampled background-to-core-text distance. This relative threshold handles light placeholders over coloured surfaces. Width is the inclusive first-to-last ink pixel span, in CSS px.
- Candidate fonts and SIL OFL license files remain in the local research font cache, downloaded from each family project's official repository. Each family's local `source.json` records the URL, embedded version, license, axis range, coverage result, and SHA-256. The variable `wght` axis includes 400 and 600; all requested Turkish glyphs were checked.
- A local HTML page loads the candidate files through `@font-face`. Repository Playwright launches its separate headless Chromium at `deviceScaleFactor: 2`. It renders the same labels in the individually sampled reference foreground and background colours. DOM `getBoundingClientRect()` advance widths are recorded separately; visible pixel widths determine the ranking. The shared reference browser and capture tool are not used.
- For each measurable style and family, 0.5 px size steps spanning the app-shell estimate ±2 px are rasterized. Eligible sizes keep both cap and x-height within 0.5 CSS px of the canonical `app-shell.md` Type summary. Among eligible sizes, the one minimizing that style's mean absolute ink-width error is selected; ties minimize summed cap and x-height error, then choose the smaller size. Styles with no eligible generic text retain the app-shell estimate and are excluded from width ranking.
- Cap and x-height use the first isolated capital and following lowercase letter in a generic label. For tiny utility text, glyph overlap makes direct reference isolation unreliable, so the app-shell Type summary remains the canonical height target; a standalone candidate `x` gives the comparable lowercase height. A scanline-only glyph can differ by 0.5 CSS px under antialiasing; see the reconciliation below. Straight `l` stems are measured by summing normalized ink coverage across each horizontal row through the middle 45–65% of the glyph and averaging those rows; this measures subpixel thickness to 0.1 CSS px. The captured `l` comes from regular “Calls” and semibold “Sales”; candidate `l` glyphs use the same coverage function and the fitted style size.

## Reference measurements

**Loaded font:** not determinable from capture. None of four shell network logs records a font request or font MIME response. Each does contain a JSON response with a static-file listing that names one icon font and one web font file; a filename in a response does not establish that it loaded, which weights loaded, its family, or whether it is static or variable. No filename or URL is reproduced here.

| Style | App-shell size / weight | Canonical cap / x height (CSS px) | Relative-threshold check |
| --- | --- | --- | --- |
| Product / teamspace selector | approx. 16 / 600 | 11 / 8 | No eligible generic selector text |
| Page title | approx. 20 / 600 | 13 / 10 | 4 glyph runs; extracted first-pair 13/10 |
| Rail fixed link | approx. 15 / 400 | 10.5 / 7.5 | 9 glyph runs; extracted first-pair 10.5/7.5 |
| Rail active link | approx. 15 / 600 | 10.5 / 7.5 | 4 glyph runs; extracted first-pair 10.5/7.5 |
| Group heading | approx. 15 / 600 | 11 / 7.5 | 5 glyph runs; sampled 10.5 / 7.5 (within 0.5 px) |
| Rail child link | approx. 15 / 400 | 10.5 / 7.5 | 5 glyph runs; extracted first-pair 10.5/7.5 |
| Rail Search placeholder | approx. 15 / 400 | 10.5 / 7.5 | 6 glyph runs; sampled height within 0.5 px |
| Top-bar search placeholder | approx. 14 / 400 | 9.5 / 7 | 11 glyph runs; extracted first-pair 9.5/7 |
| Menu item | approx. 15 / 400 | 11 / 8 | 12 glyph runs; sampled 10.5 / 7.5 (within 0.5 px) |
| Utility label | approx. 8 / 400 | 6 / 4.5 | Tiny / coloured utility glyphs: retained app-shell height target |
| Help utility label | approx. 12 / 600 | 8 / 5.5 | Tiny / coloured utility glyphs: retained app-shell height target |

The relative-threshold check reproduces the app-shell cap/x values exactly for rail links, page title, and top search. “Sales” and “Create Folder” yield cap/x values 0.5 CSS px below the Type summary due to their specific letter edge pixels; the app-shell values remain canonical and the fit tolerance includes that half pixel. Tiny utility text cannot isolate a trustworthy lowercase glyph from the captured label, so its app-shell values are retained. This is the same height definition across both specs.

Regular `l` stem: **1.5 CSS px**. Semibold `l` stem: **1.7 CSS px**. The reference `a` appears double-storey, `g` single-storey, `l` straight without a visible tail, dots softly squared, and terminals softly squared. Equal numeral widths cannot be established from eligible generic labels.

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

Ranking is lexicographic by visible width fit, then x/cap-height ratio, then stem thickness. The width score for sorting is mean absolute ink-width difference + 0.2 × maximum absolute difference (CSS px), across the same 35 generic-label instances for every family. All widths below use the corrected fitted sizes. “Ratio gap” is the mean absolute percentage-point gap between candidate and canonical x/cap ratios across ten measurable styles. Stem deltas are candidate minus reference, in CSS px.

| Rank / family | Width score | Width mean / max abs. (CSS px) | Width mean / max abs. (%) | Signed mean (CSS px) | Ratio gap (pp) | Stem Δ 400 / 600 (CSS px) | Letter-form differences |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1. Figtree | 1.01 | 0.61 / 2.00 | 1.27 / 5.97 | +0.30 | 1.39 | +0.0 / +0.2 | Double-storey a and single-storey g match; dot and terminals are slightly rounder; straight l. |
| 2. Source Sans 3 | 1.44 | 0.84 / 3.00 | 1.44 / 4.88 | -0.30 | 3.20 | +0.1 / +0.3 | Double-storey a matches; double-storey g and small foot on l differ; sharper terminals. |
| 3. Nunito Sans | 1.84 | 0.94 / 4.50 | 1.83 / 5.88 | +0.34 | 1.76 | -0.1 / +0.0 | Double-storey a and single-storey g match; dot and terminals are rounder. |
| 4. Inter | 2.43 | 1.33 / 5.50 | 2.38 / 7.14 | +0.84 | 3.60 | +0.0 / +0.4 | Double-storey a and single-storey g match; rounder dot and sharper terminals. |
| 5. Mulish | 3.03 | 1.53 / 7.50 | 2.55 / 7.46 | +1.16 | 2.76 | +0.0 / +0.0 | Single-storey a differs; single-storey g and straight l match; round dot. |

### Fitted font sizes (CSS px)

| Candidate | Product / teamspace selector | Page title | Rail fixed link | Rail active link | Group heading |
| --- | ---: | ---: | ---: | ---: | ---: |
| Figtree | provisional | 18.5 | 14.5 | 14.5 | 14.5 |
| Source Sans 3 | provisional | 20 | 15.5 | 15.5 | 15.5 |
| Nunito Sans | provisional | 18.5 | 14.5 | 14.5 | 14.5 |
| Inter | provisional | 18 | 13.5 | 13.5 | 14 |
| Mulish | provisional | 18 | 14 | 14 | 14.5 |

| Candidate | Rail child link | Rail Search placeholder | Top-bar search placeholder | Menu item | Utility label | Help utility label |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Figtree | 14.5 | 14.5 | 13.5 | 14.5 | 8.5 | 11.5 |
| Source Sans 3 | 15.5 | 16 | 14.5 | 16 | 9 | 12 |
| Nunito Sans | 14.5 | 15 | 13.5 | 14.5 | 7.5 | 11 |
| Inter | 14 | 13.5 | 12.5 | 14 | 8 | 10.5 |
| Mulish | 14.5 | 14 | 13 | 14.5 | 8 | 11 |

For product and teamspace selectors, generic text is unavailable. The app-shell 16 px / 600 estimate is provisional for every candidate and was excluded from fit and ranking.

### Signed ink-width differences for recommendation and backup

Candidate minus reference, CSS px. These are visible pixel extents, distinct from DOM advance widths.

| Label | Reference width | Figtree Δ | Source Sans 3 Δ | Figtree DOM width | Source Sans 3 DOM width |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home (active) | 38.5 | +0.0 | +0.0 | 39.81 | 39.72 |
| Workqueue | 74.5 | -1.0 | -1.0 | 73.91 | 74.19 |
| Reports | 49.5 | +0.0 | -0.5 | 51.09 | 50.33 |
| Analytics | 58.5 | +0.5 | -0.5 | 59.55 | 58.55 |
| Agents | 45.5 | +0.5 | -2.0 | 46.47 | 43.78 |
| MCP Server | 74.5 | +1.0 | -1.5 | 76.59 | 73.97 |
| Search (rail) | 44.0 | +0.0 | +0.0 | 45.06 | 45.72 |
| Sales | 34.0 | +0.0 | +0.5 | 34.61 | 35.19 |
| Activities | 60.5 | +2.0 | +0.5 | 62.77 | 61.23 |
| Integrations | 78.5 | +0.5 | +1.0 | 80.03 | 80.80 |
| Leads | 37.0 | -0.5 | -0.5 | 38.11 | 37.73 |
| Contacts | 58.5 | +0.5 | -2.5 | 59.86 | 56.95 |
| Accounts | 61.5 | +0.5 | -3.0 | 62.22 | 58.80 |
| Deals | 34.0 | +0.0 | +0.0 | 35.23 | 35.28 |
| Documents | 74.0 | -0.5 | -1.5 | 74.89 | 74.03 |
| Campaigns | 73.5 | -1.5 | -2.0 | 72.88 | 72.33 |
| Tasks | 35.0 | -0.5 | +0.0 | 35.06 | 35.67 |
| Meetings | 59.0 | +0.0 | -2.0 | 60.30 | 58.33 |
| Calls | 30.5 | -0.5 | +0.0 | 30.98 | 31.08 |
| Visits | 33.5 | +2.0 | +0.0 | 35.75 | 33.70 |
| Home (title) | 49.0 | +0.0 | +0.0 | 50.80 | 51.25 |
| Search records | 89.0 | +1.0 | -0.5 | 91.09 | 89.59 |
| My Pins | 27.5 | +1.0 | +0.5 | 29.36 | 28.56 |
| Chats | 21.0 | +0.5 | -0.5 | 22.39 | 21.19 |
| Channels | 34.0 | +0.5 | +0.0 | 35.17 | 34.95 |
| Threads | 29.0 | +1.0 | +1.0 | 30.23 | 30.41 |
| Contacts (utility) | 33.0 | +1.5 | -0.5 | 35.09 | 33.08 |
| Help | 23.0 | +0.0 | -0.5 | 24.55 | 24.06 |
| New Teamspace | 105.0 | +0.5 | +1.0 | 107.14 | 107.95 |
| Create Folder | 86.5 | +1.0 | +2.0 | 88.30 | 89.23 |
| Add Modules | 84.5 | +0.5 | +1.0 | 85.39 | 86.25 |
| Manage CRM Teamspace | 162.5 | -0.5 | -1.0 | 163.75 | 163.45 |
| View All Teamspace | 127.5 | +1.0 | +2.0 | 129.08 | 129.84 |
| Leads (active) | 37.5 | +0.0 | +0.0 | 38.61 | 38.67 |
| Leads (title) | 48.0 | -0.5 | +0.0 | 49.27 | 49.91 |

At the corrected sizes, Figtree’s top-bar “Search records” differs by +1.0 CSS px and menu “View All Teamspace” by +1.0 CSS px. The earlier opposite-direction 6.5/5.5 px outliers arose from selecting sizes using heights alone and a fixed contrast threshold. The largest remaining Figtree error is Activities, Visits at 2.0 CSS px. No global letter-spacing correction is supported.

### Variable-weight stem check

At 400 / 600, Figtree stems are 1.5 / 1.9 CSS px versus reference 1.5 / 1.7. A 10-unit `wght` sweep found 530 matches the semibold stem at 1.7 CSS px. Keeping fitted sizes, 530 changes the 35-label mean absolute width difference from 0.61 to 0.64 CSS px; the maximum stays 2.0 CSS px. The 600 setting preserves the best width fit, so the stem-matching axis value is recorded as an optional trial, not the baseline recommendation.

## Recommendation

**Recommend Figtree** for board review. It has the lowest width mean/maximum error, **0.61 / 2.0 CSS px** (1.27% / 5.97%), x/cap ratio gap **1.39 percentage points**, and regular/semibold stem deltas **0.0 / +0.2 CSS px**. Its `a` and `g` constructions match the reference. **Backup: Source Sans 3** under the mandated width-first ranking: **0.84 / 3.0 CSS px** (1.44% / 4.88%), ratio gap **3.20 percentage points**, stem deltas **+0.1 / +0.3 CSS px**. Its double-storey `g` and small `l` foot visibly differ. Mulish matches both stem thicknesses but its width mean/maximum is 1.53 / 7.5 CSS px after the same size fit.

Suggested Figtree values for an implementation trial (`letter-spacing: normal`):

| Style | `font-size` | `font-weight` |
| --- | ---: | ---: |
| Product selector | 16px (provisional) | 600 |
| Page title | 18.5px | 600 |
| Rail fixed link | 14.5px | 400 |
| Rail active link | 14.5px | 600 |
| Teamspace selector | 16px (provisional) | 600 |
| Group heading | 14.5px | 600 |
| Rail child link | 14.5px | 400 |
| Rail Search placeholder | 14.5px | 400 |
| Top-bar search placeholder | 13.5px | 400 |
| Menu item | 14.5px | 400 |
| Utility label | 8.5px | 400 |
| Help utility label | 11.5px | 600 |

No font or application code is changed by this research task.

## Open questions

- The loaded reference family, number of source weights, and static/variable format remain not determinable from capture. A static-file listing in a JSON response is insufficient evidence of loading.
- Product and teamspace selector text cannot be used under the generic-label rule; their provisional size is based on app-shell heights, without a direct width match.
- Equal numeral widths cannot be established from eligible generic labels.
- The small utility captions and Help provide low-resolution height evidence; a future customer-free capture at a higher device scale could reduce their uncertainty.

## Capture refs

Existing local `home-main`, `home-leads-navigation`, and `home-more-actions` screenshots provide all measurements. Their `network.json` files plus `home-search/network.json` provide the font-request check. No new capture or live reference CRM access occurred.
