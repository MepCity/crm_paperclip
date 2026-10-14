# Icon audit (Modules 1–5)

Rule (ADR 0003): one icon set (Lucide) through `apps/web/src/components/ui/icon.tsx`; originals only where Lucide has no close match. No reference icon file or drawing is copied.

## Central defaults

- Every Lucide glyph in `Icons` goes through `thin()`, which defaults `strokeWidth` to `ICON_STROKE_WIDTH` (1.5, the reference icons are thin-lined) and `currentColor`. Callers set size via class/`size` and colour via text colour tokens; per-call stroke overrides are not used.
- No component imports `lucide-react` directly any more (the activity categories card was the only stray caller).
- Original SVG glyphs already in `icon.tsx` draw at 1.5 (lists, arrows, table marks); a few measured ink-box glyphs (checks at 0.75–1.2, create plus at 1, thumbs, stopwatch) keep their lighter weight because their size was measured against the reference (documented in their comments).

## Inventory

| Screen | Control | Previous | Reference look (words) | Chosen | Change |
|---|---|---|---|---|---|
| All lists (Leads, Contacts, Accounts, Deals) | Filter / sort / list / refresh / more | original line glyphs, 1.5 stroke | thin outline funnel, arrows, bullets, circular arrow, three dots | same originals | no |
| All lists | View-type switcher | original ink-box glyphs | thin outline list/split/grid/chart/cards | same originals | no |
| All lists | Column options | original arrows | thin up/down arrows | same | no |
| List and detail | Calendar, phone, mail, building, folder, tag, lock | Lucide, stroke 2 | thin outline | same Lucide, stroke 1.5 via `thin()` | yes (weight) |
| Record detail header | Back arrow, prev/next chevrons | original 1.5 arrow, thin chevrons | thin arrow/chevrons | original `ArrowLeft` SVG (1.5 stroke) kept, chevrons via `thin()` | no |
| Record detail fields | Edit pencil (MEP-527) | filled original pencil | filled pencil, measured 11.5 px ink box | kept (measured custom glyph) | no |
| Deals board card | Edit pencil | filled 45° pencil | filled pencil | original `BoardEdit` SVG (MEP-527, no Lucide match) | no |
| Activities card (record detail) | Task, meeting, call category | direct Lucide import, stroke 2 | outline clipboard-check, calendar, handset | `Icons.task`, `Icons.calendar`, `Icons.phone` | yes (via icon.tsx, stroke 1.5) |
| Activities card | Owner silhouette | direct Lucide `UserRound` | outline user | `Icons.userRound` | yes |
| Alerts | error, success, info, warning | Lucide, stroke 2 | thin outline | same, 1.5 | yes (weight) |
| App shell | home, settings, users, menu panels, sign out | Lucide, stroke 2 | thin outline | same, 1.5 | yes (weight) |
| Filter panel, pickers | Filled carets, magnifier | original | filled triangle, thin magnifier | same | no |
| Timeline | Pencil, generic dot | original 1.5 | outline | same | no |
| Deal closing badge | Stopwatch | original, 1.1 | thin stopwatch | same | no |

## No Lucide match (kept as original SVG)

Ink-box-measured glyphs (view-type switcher set, filter toggle funnel, table-with-plus, diagonal expand, record portrait silhouettes, filled carets, thumbs, stopwatch, detail-card field pencil `fieldEdit`, Deals board pencil `boardEdit` — MEP-527). Each already exists in `icon.tsx`, is drawn originally, and was approved with its owning screen.
