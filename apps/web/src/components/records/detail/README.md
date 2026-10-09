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
| Leads-only rules | `lib/records/leads-detail.constants.ts` (Interim): `Lead Name` label, composite address order, same-page neighbor scope |
| Section builders | `lib/records/leads-detail-sections.ts`, `lib/records/leads-address.ts` |

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

- `Hide Details` collapsed state and `Show Details` label are implemented locally;
  persistence was not observed in reference captures and is not stored.
- `Last Update` label position on the page is not measured here (MEP-144).
- MEP-171 tracks remaining visual gaps: value column wrap width, vertical
  position of `Hide Details` and section headings (section heading is about 22 px
  lower than reference; `Hide Details` about 1.5 px lower), spacing between
  two-line field values, and pencil icon placement.

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
- Title weight is unmeasured; it uses `--font-weight-normal` provisionally. Secondary
  command and related-row weights are unmeasured and retain regular weight. The primary
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
