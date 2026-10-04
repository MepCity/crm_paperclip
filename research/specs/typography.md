# Typography candidate research

## Method

- Evidence is restricted to existing local screenshots and their `network.json` files. No live reference CRM request or capture was made, and no reference font file was downloaded or used.
- The 2940 × 1670 screenshots represent a 1470 × 835 CSS px viewport. All bitmap dimensions below use 2 image pixels per CSS px.
- A Pillow pixel script isolates each fixed interface label in a text-only rectangle. It compares RGB pixels with the local flat background using a 24-channel mean contrast threshold and measures the inclusive first-to-last foreground pixel extent. The same function measures candidate screenshots. Curved antialiased edges can move a bound by about 0.5 CSS px.
- Candidate fonts and licenses came from each family project’s own official repository and remain in the local research cache. `fontTools` verified the embedded version, variable `wght` axis covering 400 and 600, and the complete requested Turkish character set: `ç ğ ı i ö ş ü Ç Ğ I İ Ö Ş Ü`. Source URLs and SHA-256 hashes are recorded beside each local font file.
- A temporary local HTML page loaded each candidate through `@font-face` in the repository’s Playwright headless Chromium at `deviceScaleFactor: 2`. For every style, font sizes from the app-shell approximation minus 2 through plus 2 CSS px were rasterized at 0.5 px steps. The same capital and lowercase glyph pair from the corresponding reference label was rendered separately and selected by the smallest summed cap/x-height pixel error. Candidate label screenshots used the same pixel ink-width method; DOM `getBoundingClientRect()` advance widths are recorded below as a cross-check.
- Reference stem thickness uses the middle of a straight `l` in regular “Calls” and semibold “Sales”; candidate stems use the same mid-stem scanline and contrast threshold. Ratios are x-height divided by cap height. Mean and maximum width errors are absolute over 35 measured label instances; the signed mean is also reported.

## Reference measurements

**Loaded font:** not determinable from capture. The four shell `network.json` files contain no font request or font MIME response; the screenshot alone cannot identify the family, number of source weights, or static/variable format.

| Style | App-shell size / weight | Rechecked cap / x height (CSS px) | Evidence |
| --- | --- | --- | --- |
| Product selector | approx. 16 / 600 | 11 / 8 | No eligible isolated label; app-shell estimate only |
| Page title | approx. 20 / 600 | 13.5 / 10.5 | Home: H/o |
| Rail fixed link | approx. 15 / 400 | 10.5 / 8.5 | Workqueue: W/o |
| Rail active link | approx. 15 / 600 | 10.5 / 8.5 | Home: H/o |
| Teamspace selector | approx. 16 / 600 | 11 / 8 | No eligible isolated label; app-shell estimate only |
| Group heading | approx. 15 / 600 | 11 / 8.5 | Sales: S/a |
| Rail child link | approx. 15 / 400 | 10.5 / 8.5 | Leads: L/e |
| Rail Search placeholder | approx. 15 / 400 | 11 / 8.5 | Search: S/e |
| Top-bar search placeholder | approx. 14 / 400 | 9.5 / 7 | Search records: S/e |
| Menu item | approx. 15 / 400 | 11 / 8.5 | Create Folder: C/r |
| Utility label | approx. 8 / 400 | 6 / 4.5 | Tiny utility glyphs overlap at 2x; app-shell estimate only |
| Help utility label | approx. 12 / 600 | 8 / 6.5 | Help: H/e |

Rechecked lowercase heights in the isolated glyphs often exceed the earlier app-shell visual estimate by 0.5–1 CSS px because this method includes antialiased edge pixels. The pixel threshold and glyph pair above define the reproducible comparison target. Regular `l` mid-stem: **1.5 CSS px**. Semibold `l` mid-stem: **2.0 CSS px**. The reference `a` appears double-storey, `g` single-storey, `l` straight without a visible tail, dots softly squared, and terminals softly squared. Equal numeral widths cannot be established from eligible generic labels.

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
| `home-main` | Rail child link | Leads | 37.0 |
| `home-main` | Rail child link | Contacts | 58.5 |
| `home-main` | Rail child link | Accounts | 61.5 |
| `home-main` | Rail child link | Deals | 34.5 |
| `home-main` | Rail child link | Documents | 74.5 |
| `home-main` | Rail child link | Campaigns | 73.5 |
| `home-main` | Group heading | Activities | 61.0 |
| `home-main` | Rail child link | Tasks | 35.0 |
| `home-main` | Rail child link | Meetings | 59.0 |
| `home-main` | Rail child link | Calls | 30.5 |
| `home-main` | Group heading | Integrations | 79.0 |
| `home-main` | Rail child link | Visits | 34.0 |
| `home-main` | Rail child link | Price Books | 74.5 |
| `home-main` | Page title | Home (title) | 49.5 |
| `home-main` | Top-bar search placeholder | Search records | 90.0 |
| `home-main` | Utility label | My Pins | 27.5 |
| `home-main` | Utility label | Chats | 21.0 |
| `home-main` | Utility label | Channels | 35.0 |
| `home-main` | Utility label | Threads | 30.0 |
| `home-main` | Utility label | Contacts (utility) | 33.5 |
| `home-main` | Help utility label | Help | 23.5 |
| `home-more-actions` | Menu item | New Teamspace | 105.0 |
| `home-more-actions` | Menu item | Create Folder | 87.0 |
| `home-more-actions` | Menu item | Add Modules | 85.0 |
| `home-more-actions` | Menu item | View All Teamspace | 128.0 |
| `home-leads-navigation` | Rail active link | Leads (active) | 37.5 |
| `home-leads-navigation` | Page title | Leads (title) | 48.5 |

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

The ranking uses a width score of mean absolute label-width error + 0.2 × maximum absolute error (CSS px), then x/cap ratio and stem error. This includes both average fit and severe outliers before the other criteria. “Ratio gap” is the mean absolute percentage-point difference across the nine styles with directly measurable capital/lowercase pairs. Stem deltas are candidate minus reference, in CSS px.

| Rank / family | Width score | Width mean / max abs. (CSS px) | Width mean / max abs. (%) | Signed mean (CSS px) | Ratio gap (pp) | Stem Δ 400 / 600 (CSS px) | Letter-form differences |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1. Figtree | 2.49 | 1.19 / 6.5 | 1.89 / 7.22 | +0.47 | 0.86 | +0.5 / +0.5 | Double-storey a and single-storey g match; dot and terminals are slightly rounder; straight l. |
| 2. Mulish | 3.26 | 1.86 / 7.0 | 3.58 / 9.09 | +1.54 | 0.51 | +0.0 / +0.0 | Single-storey a differs; single-storey g and straight l match; round dot. |
| 3. Inter | 3.71 | 1.91 / 9.0 | 3.23 / 7.27 | +1.49 | 0.96 | +0.0 / +0.5 | Double-storey a and single-storey g match; dot is rounder; terminals are sharper. |
| 4. Source Sans 3 | 3.93 | 1.83 / 10.5 | 3.04 / 11.67 | -1.80 | 1.50 | +0.5 / +0.0 | Double-storey a matches; double-storey g and small foot on l differ; sharper terminals. |
| 5. Nunito Sans | 4.43 | 2.63 / 9.0 | 5.23 / 14.55 | +2.14 | 3.14 | +0.0 / +0.0 | Double-storey a and single-storey g match; terminals and dot are rounder. |

### Fitted font sizes (CSS px)

| Candidate | Product selector | Page title | Rail fixed link | Rail active link | Teamspace selector | Group heading |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Figtree | 15.5 | 19 | 14.5 | 14.5 | 15.5 | 14.5 |
| Mulish | 15 | 18.5 | 14.5 | 14.5 | 15 | 14.5 |
| Inter | 14.5 | 18 | 14 | 14 | 14.5 | 14 |
| Source Sans 3 | 16 | 20 | 15.5 | 15.5 | 16 | 15 |
| Nunito Sans | 16 | 19.5 | 15 | 15 | 16 | 15 |

| Candidate | Rail child link | Rail Search placeholder | Top-bar search placeholder | Menu item | Utility label | Help utility label |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Figtree | 14.5 | 14.5 | 12.5 | 15 | 8.5 | 11 |
| Mulish | 14.5 | 14.5 | 12.5 | 14.5 | 8.5 | 11 |
| Inter | 14 | 14 | 12 | 14.5 | 8 | 10.5 |
| Source Sans 3 | 15.5 | 15 | 13 | 15 | 8.5 | 11.5 |
| Nunito Sans | 15 | 15 | 12.5 | 15 | 8.5 | 11 |

### DOM advance widths (CSS px)

DOM bounds include side bearings and advance space; the ranking uses visible pixel ink widths.

| Label instance | Figtree | Mulish | Inter | Source Sans 3 | Nunito Sans |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home (active) | 39.81 | 40.38 | 39.86 | 39.72 | 41.02 |
| Workqueue | 73.91 | 77.34 | 75.80 | 74.19 | 78.19 |
| Reports | 51.09 | 52.67 | 51.27 | 50.33 | 53.16 |
| Analytics | 59.55 | 62.03 | 60.69 | 58.55 | 62.42 |
| Agents | 46.47 | 47.98 | 46.52 | 43.78 | 48.62 |
| MCP Server | 76.59 | 78.98 | 79.42 | 73.97 | 80.25 |
| Search (rail) | 45.06 | 46.48 | 46.47 | 42.86 | 45.88 |
| Sales | 34.61 | 36.77 | 36.78 | 34.06 | 37.23 |
| Leads | 38.11 | 40.34 | 40.05 | 37.73 | 39.97 |
| Contacts | 59.86 | 59.42 | 59.23 | 56.95 | 59.05 |
| Accounts | 62.22 | 62.06 | 62.44 | 58.80 | 62.20 |
| Deals | 35.23 | 38.08 | 37.05 | 35.28 | 38.64 |
| Documents | 74.89 | 76.05 | 75.31 | 74.03 | 76.66 |
| Campaigns | 72.88 | 76.44 | 74.56 | 72.33 | 75.34 |
| Activities | 62.77 | 62.22 | 63.20 | 59.27 | 62.98 |
| Tasks | 35.06 | 38.08 | 38.34 | 35.67 | 37.64 |
| Meetings | 60.30 | 61.19 | 61.20 | 58.33 | 62.05 |
| Calls | 30.98 | 32.50 | 32.27 | 31.08 | 33.81 |
| Integrations | 80.03 | 81.86 | 81.16 | 78.20 | 82.11 |
| Visits | 35.75 | 36.50 | 35.67 | 33.70 | 36.98 |
| Price Books | 75.39 | 77.70 | 78.86 | 75.59 | 78.23 |
| Home (title) | 52.17 | 51.52 | 50.67 | 51.25 | 53.31 |
| Search records | 84.36 | 85.95 | 86.56 | 80.33 | 82.80 |
| My Pins | 29.36 | 30.80 | 30.02 | 26.97 | 32.41 |
| Chats | 22.39 | 23.09 | 21.83 | 20.00 | 24.23 |
| Channels | 35.17 | 36.73 | 35.34 | 33.00 | 38.84 |
| Threads | 30.23 | 32.20 | 31.14 | 28.72 | 33.94 |
| Contacts (utility) | 35.09 | 34.84 | 33.86 | 31.23 | 36.78 |
| Help | 23.48 | 23.92 | 23.34 | 23.06 | 24.70 |
| New Teamspace | 110.83 | 111.53 | 114.03 | 101.20 | 110.80 |
| Create Folder | 91.34 | 89.86 | 92.47 | 83.66 | 91.02 |
| Add Modules | 88.34 | 88.14 | 90.50 | 80.86 | 90.11 |
| View All Teamspace | 133.53 | 135.62 | 137.66 | 121.72 | 137.17 |
| Leads (active) | 38.61 | 40.75 | 40.81 | 38.67 | 40.44 |
| Leads (title) | 50.59 | 51.98 | 51.78 | 49.91 | 52.58 |

The largest visible Figtree differences are top-bar “Search records” **−6.5 CSS px** and menu “View All Teamspace” **+5.5 CSS px**. These move in opposite directions, so a global letter-spacing correction is not supported.

## Recommendation

**Recommend Figtree**, subject to board review of the attached visual. It has the lowest mean pixel-width error (1.19 CSS px) and a 6.5 CSS px maximum across 35 eligible label instances. Its cap/x ratio gap is 0.86 percentage points; regular and semibold `l` stems are each 0.5 CSS px thicker than the reference. Its `a` and `g` constructions match the reference. **Backup: Mulish**. Its mean/maximum width errors are 1.86/7.0 CSS px, ratio gap 0.51 percentage points, and both stem deltas are 0.0 CSS px; its `a` construction differs visibly.

Suggested Figtree values for a trial implementation (all `letter-spacing: normal`):

| Style | `font-size` | `font-weight` |
| --- | ---: | ---: |
| Product selector | 15.5px | 600 |
| Page title | 19px | 600 |
| Rail fixed link | 14.5px | 400 |
| Rail active link | 14.5px | 600 |
| Teamspace selector | 15.5px | 600 |
| Group heading | 14.5px | 600 |
| Rail child link | 14.5px | 400 |
| Rail Search placeholder | 14.5px | 400 |
| Top-bar search placeholder | 12.5px | 400 |
| Menu item | 15px | 400 |
| Utility label | 8.5px | 400 |
| Help utility label | 11px | 600 |

The product and teamspace selector sizes are provisional height matches because their visible text was excluded by the generic-label rule. No font file or application code is changed by this research task.

## Open questions

- The loaded reference family, its source weight count, and static/variable format are not determinable from capture; all four shell network logs lack font requests.
- Product selector and teamspace selector have no eligible customer-free label for direct width comparison. Their proposed sizes rely on the app-shell height estimates.
- The top-bar search placeholder and Help have one eligible instance each, and page title/active-link have only two. More captures containing generic labels would strengthen style-specific estimates without touching reference data.
- The top-bar search width is shorter in every candidate after cap/x fitting. Its letter spacing, CSS size, or compositing may differ from the app-shell approximation. The available screenshot cannot isolate which.
- Equal numeral widths and exact line height cannot be established from the eligible single-line screenshots.

## Capture refs

`home-main`, `home-leads-navigation`, `home-more-actions`, `home-search` (network inspection only for the last), with pixel measurement limited to generic labels. No record rows, organization, teamspace, user, avatar, logo, or icon pixels enter the width table or visual crop.
