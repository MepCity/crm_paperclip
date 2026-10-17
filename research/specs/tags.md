# Tags

Status: partial research for MEP-629; not implementation-ready. Existing and fresh captures
were inspected on 2026-10-15, with the Leads Add Tags opening inspected on 2026-10-17. The Leads list and all four Manage Tags initial empty states were freshly
captured. Record dialog and filter coverage remains partial. No reference data or preferences were changed.

## Purpose and scope

Inspect tag presentation, the initial Add Tags dialog, list filtering and tag
entries in Actions for Leads, Contacts, Accounts and Deals. This Module 6 spec
uses functional control inventories; no measurement or network-shape contract.

## Observed layout and controls

The following numbers identify observed controls, not completed screen coverage.
Sources are local capture slugs; screenshots remain outside the repository.

| ID | Position / state | Control and observed behaviour | Source / owner |
| --- | --- | --- | --- |
| TAG-01 | List toolbar, upper right | Actions opens the module action menu. | Four Actions captures below / module list |
| TAG-02 | Actions menu, after Mass Update (after Mass Convert in Leads) | Manage Tags is a navigation link to module-scoped tag management. All four initial empty pages observed below. | Four Actions captures / Tags |
| TAG-03 | List filter panel, Filter By Fields | Tag checkbox is present in all four modules. | Four Actions captures, accessibility evidence / Tags |
| TAG-04 | Leads filter panel, checked Tag | Operator selector initially displays `is`. | `w2d-filter-tag`, `w2d-filter-tag-ops` / Tags |
| TAG-05 | Open operator menu under Tag | Options: `is`, `is not`, `is empty`, `is not empty`; `is` is marked selected. | `w2d-filter-tag-ops` / Tags |
| TAG-06 | Under the operator, Leads filter | Value combobox contains a `Type here` textbox. No value was entered for this research. | `w2d-filter-tag` accessibility evidence / Tags |
| TAG-07 | Filter panel footer | Apply Filter and Clear are visible; effects not exercised. | `w2d-filter-tag-ops` / shared filters |
| TAG-08 | Leads record header, below record identity | Add Tags appears with a tag icon; initial Leads opening observed; other modules unobserved. | `w2f-detail-more`, `m6-leads-detail` / Tags |

The inherited and freshly inspected Leads record show the Add Tags entry
rather than an existing tag
chip. This does not establish how tagged records look. The existing three table
captures have no visible tag column; this does not prove tags cannot appear in
lists. Deals was already in stage-board view; no view switch was attempted.

## Manage Tags initial state (all four modules)

`m6-leads-manage-tags`, `m6-contacts-manage-tags` and
`m6-accounts-manage-tags` and `m6-deals-manage-tags-retry` show a full content page inside the app shell, rather
than a dialog. The header has a back arrow, Manage Tags title, module badge and
Help link. A short explanatory paragraph precedes a tag usage counter and table.
The observed counter is zero used out of a displayed capacity of 100; capacity
is an observed environment value, not an asserted universal plan limit. Columns
are Tag Color, Tag Name and Last Modified. The naturally empty table contains
an explanatory empty-state line and a centered New Tag button. New Tag was not
pressed. No tags were created to obtain a populated state.

| ID | Position | Control / purpose | State |
| --- | --- | --- | --- |
| TAG-09 | Before page title | Back navigation | Visible; not exercised |
| TAG-10 | Header right | Help | Visible; destination not inspected |
| TAG-11 | Empty table center | New Tag | Visible enabled-looking creation entry; not pressed |

## Fields, flows and constraints

Observed filter fields are a boolean inclusion checkbox, operator selector and
value selector. The empty management table is observed below; creation fields, suggestions,
colour editing, permissions, universal limits,
validation and add/remove success or failure remain unverified. Never use
reference Save, Add, Remove or tag selection to discover write behaviour.

Manage Tags was reached through Actions in all four modules without submitting.
MEP-638 permits one exact-name Add Tags initial opening followed by Escape.
The Leads initial popover was observed on 2026-10-17; see the bounded evidence below. MEP-765 approves reaching
the record through the previously captured list link; sanitized record URLs
containing `:id` must never be used as navigation targets. No alternate selector
or guard change may be used to bypass a restriction. Filter checkbox inspection may
use `--allow-toggle`; never apply or save a filter.

## Capture refs

- `m6-leads-list-retry`, `m6-leads-manage-tags`,
  `m6-contacts-manage-tags`, `m6-accounts-manage-tags`,
  `m6-deals-manage-tags-retry` (2026-10-15)
- `m6-csv-leads-actions` (2026-10-14)
- `m6-csv-contacts-actions-retry` (2026-10-14)
- `m6-csv-accounts-actions-retry` (2026-10-14)
- `m6-csv-deals-actions` (2026-10-14; stage-board state)
- `w2d-filter-tag`, `w2d-filter-tag-ops` (2026-10-09; inherited evidence)
- `w2f-detail-more` (2026-10-09; inherited evidence)
- `m6-leads-detail` (2026-10-15; fresh header and standalone `inventory.md`)

## Shared shell control inventory

The following shell controls are present around freshly inspected content states.
Sources: each `m6-<module>-drafts` / `m6-<module>-manage-tags` screenshot,
accessibility snapshot and `controls.json`. Owner: shared app shell. Controls
were not exercised unless a screen-specific observation explicitly says so.
Each capture folder has a standalone `inventory.md` repeating shell entries
and numbering the content controls. Unknown icon purposes remain open questions.

| ID | Position | Control | Purpose / constraint |
| --- | --- | --- | --- |
| SH-01 | Top left | Application selector | Opens application selection; not exercised |
| SH-02 | Top left, sidebar edge | Hide Menu | Sidebar visibility; never toggle because persistence is unknown |
| SH-03 | Left sidebar, top group | Home | Navigation entry; not exercised in this state |
| SH-04 | Left sidebar, top group | Workqueue | Navigation entry; not exercised in this state |
| SH-05 | Left sidebar, top group | Reports | Navigation entry; not exercised in this state |
| SH-06 | Left sidebar, top group | Analytics | Navigation entry; not exercised in this state |
| SH-07 | Left sidebar, top group | Agents | Navigation entry; not exercised in this state |
| SH-08 | Left sidebar, top group | MCP | Navigation entry; not exercised in this state |
| SH-09 | Left sidebar, middle | Teamspace selector | Workspace selection; not changed |
| SH-10 | Beside teamspace selector | More Actions | Teamspace menu; not opened |
| SH-11 | Below teamspace selector | Search | Module navigation search; no input |
| SH-12 | Left sidebar | Sales chevron | Group visibility; never toggle |
| SH-13 | Left sidebar, Sales | Leads | Module navigation |
| SH-14 | Left sidebar, Sales | Contacts | Module navigation |
| SH-15 | Left sidebar, Sales | Accounts | Module navigation |
| SH-16 | Left sidebar, Sales | Deals | Module navigation |
| SH-17 | Left sidebar, Sales | Documents | Module navigation |
| SH-18 | Left sidebar, Sales | Campaigns | Module navigation |
| SH-19 | Left sidebar | Activities chevron | Group visibility; never toggle |
| SH-20 | Left sidebar, Activities | Tasks | Module navigation |
| SH-21 | Left sidebar, Activities | Meetings | Module navigation |
| SH-22 | Left sidebar, Activities | Calls | Module navigation |
| SH-23 | Left sidebar | Integrations chevron | Group visibility; never toggle |
| SH-24 | Left sidebar, Integrations | Visits | Module navigation |
| SH-25 | Left sidebar, lower edge | Price Books | Module navigation |
| SH-26 | Sidebar right edge | Resize handle | Sidebar width preference; never drag |
| SH-27 | Top bar | Search records | Global record search; no input |
| SH-28 | Top bar, after search | Plus | Global creation entry; never activated |
| SH-29 | Top bar, utility group | Assistant | Assistant entry; not activated |
| SH-30 | Top bar, utility group | Notifications | Notifications entry; not activated |
| SH-31 | Top bar, utility group | Calendar | Calendar navigation |
| SH-32 | Top bar, utility group | Marketplace | Extensions navigation |
| SH-33 | Top bar, utility group | Setup | Settings navigation |
| SH-34 | Top bar, utility group | Profile | Profile menu |
| SH-35 | Top right | Applications menu | Application launcher |
| SH-36 | Bottom left dock | My Pins | Dock entry; not activated |
| SH-37 | Bottom left dock | Chats | Dock entry; not activated |
| SH-38 | Bottom left dock | Contacts | Dock entry; not activated |
| SH-39 | Bottom right dock | Unlabelled utility icon | Utility entry; exact unnamed purpose is unverified; not activated |
| SH-40 | Bottom right dock | Announcements | Named utility entry; not activated |
| SH-41 | Bottom right dock | Motivator | Named utility entry; not activated |
| SH-42 | Bottom right dock | Sticky Notes | Named utility entry; not activated |
| SH-43 | Bottom right dock | Activity Reminders | Named utility entry; not activated |
| SH-44 | Bottom right dock | Recent Items | Named utility entry; not activated |
| SH-45 | Bottom right dock | Accessibility | Named utility entry; not activated |
| SH-46 | Bottom right dock | Help | Named utility entry; not activated |
| SH-47 | Bottom right dock | Trailing utility icon | Utility entry; exact unnamed purpose is unverified; not activated |

Channels and Threads dock entries are additionally visible in the Leads and
Contacts Drafts captures, between Chats and Contacts. They are navigation
affordances, not activated. Accounts and Deals Drafts show only My Pins, Chats
and Contacts in the lower-left dock. This utility difference is observed shell
state, not established module behaviour.

## Open questions

1. Initial Add Tags state in Contacts, Accounts and Deals; populated suggestions in every module. Leads empty opening is observed below.
2. Existing tag chips in list rows and record headers, overflow and removal affordances.
3. Populated tag management and batch actions with no selection; all four
   modules’ initial empty management pages are observed. No tags may be created
   to manufacture a populated state.
4. Contacts / Accounts / Deals operator menus and value picker initial states.
5. See each successful capture folder’s `inventory.md` for full numbered shell
   and content inventories. Failed attempts have no observed-state inventory.
6. Add/remove validation and outcomes: not observable without a write; use public
   documentation in a subsequent evidence pass, never a reference mutation.

## Tooling dependency

MEP-637 routed the bounded opening decision to MEP-638, which is now approved
for initial Add Tags / Share and Recycle Bin Search openings. Static guard
results are tooling evidence, not observed dialog contents. No guard was bypassed.

## Current research continuation

MEP-765 (2026-10-16) supplies the approved continuation for Add Tags, record
More, Share, Print Preview and Print Default view, in that order. Use the list
route and exact record-link selector from `m6-leads-detail/meta.json` locally;
never copy the record name or address into this spec. Each capture is permitted
once, with a 15-second paint wait between steps and the record link as the ready
probe. Share and Print Preview depend on exported selectors from a successfully
captured More menu. Print Default view is independent of that record path.

Before each run: no capture lock, at most two browser page targets and one-minute
load at most 50. Use one CDP attach; stop this capture process if a second attach
starts. A failed ready gate, skipped/error/not-run step, invalid-address page or
an unexpected blocked request stops that run and requires Platform Lead review.
MEP-787 accepts telemetry (any count) and the same non-telemetry paths, each
no more frequent than the matching detail/list baseline. Any other blocked
request or new unblocked non-GET request stops continuation. No field
input, submission or preference change is authorized.

The prior Add Tags continuation used a sanitized record address and rendered an
invalid-address page. It established no dialog state. The correct route is list
navigation followed by the captured record link, not reconstruction of an ID.
See [print-and-share.md](print-and-share.md#capture-tool-boundary) for the print
boundary and [recycle-bin.md](recycle-bin.md#initial-search-state) for the
successfully observed Search panel. Historical failures are preserved in task
attachments; they are not additional screen observations.

## MEP-779 evidence handoff

The existing per-state numbered inventories are preserved in
[m6-tags-print-share-recycle-inventory.md](m6-tags-print-share-recycle-inventory.md).
The Leads Add Tags continuation was consumed on 2026-10-17. Its opening is
observed below. MEP-787 accepts that evidence and authorizes the remaining
bounded captures with unchanged guards and baseline request comparisons.


## Leads Add Tags initial opening (2026-10-17)

Source: `m6-leads-add-tags-v2/step-2.png` and `step-2.yml`. A white,
shadowed popover anchors beneath the record identity, overlapping the header
and content without a dimmed backdrop. A tag icon precedes a wide focused
combobox containing an empty textbox with placeholder Enter Tags. No suggested
tags, chips, validation message or colour selector is visible initially.
Cancel and Save align at the lower right; Save is disabled. No input or
submission was attempted. The capture pressed Escape after the opening.

| ID | Position | Control / observed state |
| --- | --- | --- |
| TAG-12 | Popover top row | Tag entry combobox; empty Enter Tags textbox, focus outline |
| TAG-13 | Popover lower right, before Save | Cancel button; enabled-looking, not clicked |
| TAG-14 | Popover lower right | Save button; disabled in accessibility evidence |

Preflight: one-minute load 25.64, no capture lock, two page targets. One CDP
attach completed. Ready passed with no failed scripts; record link and Add Tags
clicks completed, followed by Escape. No print call or new-window request was
recorded. The tool blocked 19 background POST requests (16 telemetry, two legacy
background actions and one other request). The original stop rule was applied. MEP-787 subsequently confirmed that all
19 blocked requests match expected background traffic and accepted this opening
as complete evidence. No Add Tags retry is permitted. This does not establish
successful tag persistence. Guard settings remain unchanged.
