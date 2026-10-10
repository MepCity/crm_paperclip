# Record detail presentation (MEP-141)

Overview tab cards for the record detail page: business card, collapsible details
card, shared field value rendering, and the `Last Update` age label. Data loading
and page placement live in MEP-144.

## Lead record page (MEP-144)

| Piece | Location |
| --- | --- |
| Screen | `leads/lead-record-screen.tsx` — `LeadRecordScreen` with `orgSlug`, `recordId`, `paths`, optional `now` for the age label |
| Paths | Caller supplies `defaultList`, `record`, and `edit` builders (same pattern as the list screen `config.paths`) |
| List context | `lib/records/record-list-context.ts` — session storage for back URL and in-page previous/next; the list page writes, detail reads |
| More Options (Leads) | `lib/records/leads-record-more-options.ts` — full spec-ordered inventory (`LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS`); `buildLeadsRecordMoreMenuGroups` renders only handler-backed items (MEP-163: `Delete`; MEP-164: `Clone`). Unimplemented labels: `LEADS_RECORD_MORE_OPTIONS_DEVIATIONS`. |
| Leads-only rules | `lib/records/leads-detail.constants.ts` (Interim): field API names, section labels, `Lead Name` label, composite address order, same-page neighbor scope |
| Back href | `lib/records/leads-detail-back-href.ts` — list context href or default list path |
| Section builders | `lib/records/leads-detail-sections.ts`, `lib/records/leads-address.ts` |
| Status ribbon | `leads/lead-status-ribbon-section.tsx` with `lib/records/leads-status-ribbon.ts` (`Lead_Status` picklist stages, interim terminal groups, immediate update via `useUpdateRecord`) |

The route `app/crm/[orgSlug]/tab/Leads/[recordId]/page.tsx` calls
`requireOrgContext` and renders `LeadsDetailClient` (`modules/leads/leads-detail-client.tsx`).
`ApiProvider` comes from `app/crm/[orgSlug]/tab/layout.tsx`. Edit uses
`moduleRecordEditPath` from `lib/crm-paths.ts`.

## Components

| Component | Role |
| --- | --- |
| `FieldValueView` | Read-only field value for detail rows; empty values use an em dash. |
| `BusinessCard` | Five (or fewer) label/value rows with right-aligned labels. |
| `DetailsCard` | `Hide Details` control, divider, and titled sections with one or two columns. |
| `LastUpdateLabel` | `Last Update` relative-age text supplied by the parent. |
| `DetailFieldRow` | Internal row layout for business and details cards. |

Shared formatting with list `CellValue` lives in `../field-format.ts`.

## Deviations (parity checklist)

| Module | Item |
| --- | --- |
| Record detail | Phone and Mobile call buttons not drawn. |
| Record detail | Skype icon not drawn. |
| Record detail | Checked boolean display not observed in reference captures. |

## Interim

- Detail **Delete** (MEP-163): confirmation title `Delete Lead`, body
  `Are you sure you want to delete this Lead?`, buttons `Cancel` and `Delete`; on
  success navigate to the same list URL as Back (list context or default view) with
  no toast. Related child records (notes, open/closed activities) are not removed
  in Module 1; when Activities (M5) and notes/attachments (M6) ship, delete should
  cascade per `leads-write-behaviour.md` › A1.
- Lead status ribbon (MEP-167): stage changes apply immediately with no confirmation or toast;
  failed writes revert the ribbon and show form-style error text beneath it; only the current-stage
  and terminal menus change `Lead_Status` (other chevrons are not clickable); rejected-stage groups
  (`Junk`, `Not Qualified`) are fixed in `leads-status-ribbon.ts` because metadata does not expose
  `record_category_value` on the client.
- `Hide Details` collapsed state and `Show Details` label are implemented locally;
  persistence was not observed in reference captures and is not stored.
- `Last Update` label position on the page is not measured here (MEP-144).
- Left- and right-column value wrap container widths remain `not measured` in
  `record-detail.md`; we do not fix a max width beyond the column grid.
- Description view-mode value start and wrapped right edge remain `not measured`
  when the sample field is blank or inline edit is active; Address uses the
  standard left-column value start.

## Visual source

`research/specs/record-detail.md` › **Layout** › **Visual layout** (Business card,
Details card). Typography roles: `research/specs/typography.md` › **List and detail
text roles** (`Business/details field label`, `Business/details field value`,
`Details divider heading`, `Details subsection heading`).

# Record detail presentation

Sources: `research/specs/record-detail.md` › Layout › Record page, Visual layout
(Record header, Header buttons, Related-list rail, Canvas and tab row, More Options
menu) and Actions. Typography comes from `research/specs/typography.md` › List and
detail text roles, using the CTO size/weight classes. No data access, runtime core
imports or module-specific values live here. All labels and data arrive through props.

## RecordHeader

| Prop | Contract |
| --- | --- |
| `title`, `subtitle?` | One h1; nonempty subtitle follows ` - `. Long text truncates; title attribute retains the whole identity. |
| `back` | Accessible `label` plus either `href` or `onPress`. |
| `commands?` | Ordered `{ id, label, variant?, isDisabled? }` plus either `href` or `onPress`. Primary or secondary appearance, 32px high. Defaults to secondary. |
| `menuGroups?` | Ordered `{ id, items: MenuAction[] }`; empty groups are discarded, nonempty groups separated. Items require `onAction`; no real record actions are implemented here. IDs must be unique across the menu. |
| `moreLabel` | Accessible menu/ellipsis name; absent when there are no menu items. |
| `previousLabel`, `nextLabel` | Accessible arrow names. |
| `previousHref?`, `nextHref?` | Available record addresses. Missing address yields a pale, disabled button. Record ordering is owned by the page. |

The square 48px portrait is an original inline silhouette from our icon set.
It has no upload interaction. The command container is a presentation slot populated
by the provided command descriptors. Menu keyboard behavior and grouping come from
the shared React Aria menu primitive, with the detail-specific appearance.

## RecordPageFrame

| Prop | Contract |
| --- | --- |
| `header` | Header node, ordinarily RecordHeader. |
| `relatedListLabel` | Related rail heading and navigation label. |
| `relatedEntries?` | Ordered `{ id, label, targetId }`. Link presses scroll the matching element within this frame to the top without changing the URL. Target IDs are unique and supplied on content nodes by the caller. |
| `selectedRelatedId?`, `onRelatedSelectionChange?` | Controlled highlight (`aria-current="page"`); reports the pressed ID. Empty entries leave only the heading. |
| `tabsLabel` | Accessible tablist name. |
| `tabs` | Ordered `{ id, label, content }`. Each content node is the matching labelled tabpanel. The measured pill is designed for two tabs. |
| `selectedTabId`, `onTabChange` | Controlled selection; React Aria supplies arrow-key navigation. Tab changes return the content scroller to the top. |
| `relatedRailVisible?` | When false, the related-list rail is not rendered and the canvas uses the hidden-rail layout. Defaults to true. |
| `railControl?` | 36px slot before the tab pill; pass `RecordRailToggle` wired to `record-detail.rail-visible`. |
| `scrollTopLabel` | Accessible name of the circle shown after scrolling; activation returns this frame's content scroller to the top. |

The parent supplies a constrained height. The header and tab row are outside the
content scroller; the rail can independently scroll when it exceeds its available
height. Canvas side insets and direct card gaps are 12px. No page route, network
request, card internals, status ribbon, or timeline body is provided here.

The `/dev/ui` `record-detail` demo uses synthetic text, functioning demo callbacks,
three synthetic related sections, an empty rail, commands present/absent,
menu present/absent, and all four arrow availability combinations.

## Known deviations

| Omitted control or content | Owning module / task |
| --- | --- |
| Add Tags line | M6, notes/attachments/CSV and tags |
| Send Email | M10, email inbox/calendar |
| Convert | M4, Deals with Contacts and Accounts |
| Add Related List, Links, Add Link | M11, customization |
| Record detail page views / custom record page bottom strip | M11, customization |
| Selected/hovered related-row plus affordance | With each related module/action; no inert plus is rendered. |
| Cards, status ribbon, Timeline content, page route/data | MEP-141, MEP-142, MEP-143, MEP-144 respectively. |

- The portrait and icon glyphs use our own code; no reference image, icon, logo or font
  asset is added. Figtree remains the shared typeface; glyph advances can differ.
- The title name uses `--text-2xl` / `--font-weight-bold`; an optional subtitle (company)
  uses `--text-md` / `--font-weight-normal`, separated by a hyphen with
  `--size-record-title-separator-gap`. Secondary command and related-row weights are
  unmeasured and retain regular weight. The primary
  command uses `--font-weight-semibold` per the CTO's 520–620 class. Rail heading uses
  `--font-weight-bold`. Tabs use `--text-lg`, selected semibold/inactive regular.
- The title size uses `--text-2xl` (the adopted 20.5px end of 20.5–21px). The CTO maps
  14/14.5 to text-md and 15/15.5 to text-lg; this task's measured roles need no additional
  14px or 15px token. These expectations are read from tokens in the E2E test.
- The pill's full width/height and selected slice height are measured in the hidden-rail
  table; the same pill is used with the rail shown. This does not implement rail hiding.
- The omitted Add Tags line leaves the title vertically centred beside the portrait.
  Final full-page coordinates are verified by the route/data integration task.
- Menu horizontal padding is 5.75px inside the 1px edge, preserving the measured
  203.5px highlighted width. Its start differs by 0.25px from the captured half-pixel
  boundary, within the 1px tolerance; text begins 17px from the popover edge.
- Menu height follows the supplied rows/groups; the reference's 489px panel has more
  actions belonging to later modules. Shadow blur and narrow-screen layout are unmeasured.
  Keyboard focus retains the shared primitive's 2px focus ring; no reference keyboard-focus
  capture exists for this menu.
- Navigation arrow hit targets use the existing 24px spacing scale; exact hit targets
  are unmeasured. Labels wider than the captured sample can grow command widths.

## Interim

- `record-detail.rail-visible` is stored in the browser via `usePreference` (see `lib/README.md`).
  Whether the key is shared across all modules or scoped per module was not observed in reference
  captures; we use one global key for every record detail page.

The spec places Scroll To Top at lower right but does not measure it: we use a 36px
circle, 16px from the content frame's right/bottom edges, white surface, panel border,
and the existing medium shadow. These values are separately documented as unmeasured
tokens; they do not claim reference parity. The demo's 560px height is a synthetic
inspection viewport, not a reference page height.

## Verification

`record-detail.test.tsx` covers names, absent menus, grouping, keyboard menus,
command callbacks, navigation addresses and disabled boundaries, rail selection,
empty rail, tab roles/arrow keys and Scroll To Top visibility/callback.
`e2e/record-detail.spec.ts` checks the measured geometry and exact colors at 1470×835,
typography from tokens, real content scroll while the header/tab row remain still,
related-card scrolling, and a working Scroll To Top. Optional screenshots and measured
boxes are emitted into `RECORD_DETAIL_ARTIFACT_DIR`, never committed.
## Status ribbon presentation

`StatusRibbon` accepts metadata-ordered picklist options (including the null
option), current stored value, terminal groups and accessible labels. The null
option is excluded from the ribbon and retained in the flat menu. Selecting an
option calls `onSelect(value)` and closes the menu. No record data access lives
here. Integration and selection effects remain in MEP-134.

The current stage alone opens the flat menu. Terminal stages carry an original
thumb icon. ResizeObserver measures overflow after font loading and container or
track resizing; both scroll controls appear only when needed. At either end the
corresponding control is disabled. Long stage labels keep their natural width.

### Interim decisions

- Search uses a case-insensitive substring of each option label. No typed search
  was observed in the reference CRM.
- Search labels/options and group headings use the nearest typography roles:
  Filter search placeholder / Filter checkbox row (`--text-md`, normal), and
  Details subsection heading (`--text-md`, bold). These popup roles do not yet
  have separate rows in typography.md.
- Stage text uses Status stage value (`--text-sm`, normal). Natural text advances
  determine stage widths; icon drawings and letter widths differ from the
  reference (expected letter-width tolerance 2 px).
- Scroll control width uses the measured 20 px card inset; scroll distance is
  half the viewport. Scroll icon geometry, search icon inset and shadow parameters
  are not separately measurable in the current spec.
- `/dev/ui` includes rail-hidden width (1126 px), rail-shown width (906 px),
  stage-menu-open and terminal-menu-open choices. Open examples mount only after
  their button is pressed, so the gallery never opens overlays or takes focus on load.
- A null or unknown value has no current-stage trigger. The terminal trigger
  remains available; page integration and null-state behaviour await MEP-134.

No control is omitted from this presentation scope. Record persistence, the
source of terminal grouping and page integration belong to parity checklist
row 14 / MEP-134.

Measured wide-demo stage widths are 171.59, 142.20, 100.83, 117.73, 109.41,
127.53, 115.91 and 137.80 px, compared with the spec's 173, 141.5, 101, 119,
110.5, 126, 116 and 136 px. Each differs by at most 1.80 px with the adopted
font; accumulated boundary drift reaches 3.23 px at the current stage's end.
The generic component uses natural label widths; these differences are recorded
for review. Absolute page placement belongs to MEP-134.

## Details raster verification (MEP-203)

`e2e/record-detail-cards.spec.ts` measures real Chromium page PNG pixels at
1470 × 835 CSS px and device scale 2. Exact foreground RGB defines solid ink;
every pixel differing from the flat background defines total antialiased ink.
The inclusive final pixel is included in widths and heights. DOM ranges only
select a crop; they do not provide ink coordinates. A synthetic overflow/hidden
SVG probe verifies that the helper includes overflowing ink and respects actual
page opacity. The pencil SVG allows overflow so its antialias fringe is visible.

Description uses the measured 73px label width and a 39px extension (0.5px inside the measured 39.5px target), without a
font-metric calibration translation. The Website role retains 19.5px wrapping
pitch, plain wrapped text 15.5px, and audit timestamps 18.5px.

The one-line synthetic Address → Description transition and final 44px row
height are local regression contracts. The inline-editor capture's card bottom
is not treated as a measured view-mode target. Left/right view-mode wrapping
widths and Description value start/right edge remain unmeasured as listed above.
