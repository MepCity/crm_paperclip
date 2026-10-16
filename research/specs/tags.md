# Tags

Status: partial research for MEP-629; not implementation-ready. Existing and fresh captures
were inspected on 2026-10-15. The Leads list and all four Manage Tags initial empty states were freshly
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
| TAG-08 | Leads record header, below record identity | Add Tags appears with a tag icon; dialog opening not yet observed. | `w2f-detail-more`, `m6-leads-detail` / Tags |

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
The earlier Record Add Tags attempt was rejected by the static dangerous-text
guard. MEP-638 subsequently added a bounded initial-opening exception; the
dialog has not yet been observed successfully. No alternate selector or guard
change may be used to bypass that restriction. Filter checkbox inspection may
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

1. Initial Add Tags fields, suggestion list, buttons and empty state in each module.
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

## Continuation evidence (2026-10-15)

The three partial specs were preserved on the dedicated `mep/MEP-629` branch;
the source drafts in the ancestor worktree were retained. Existing numbered
inventories cover the four Drafts and four Manage Tags states, three Print View
submenus, Leads detail and the initial Recycle Bin screen. These inventories
remain research evidence, not proof of the missing dialog contents.

The bounded opening decision MEP-638 now permits one initial Add Tags, Share
or Recycle Bin Search opening per capture, followed by Escape. This supersedes
the earlier static-guard limitation noted above for those three controls only.
It does not authorize field input, module selection, searching or submission.

A fresh no-click `m6-recycle-bin-search-base` capture rendered the initial list.
Its screenshot and exported Search selector were checked. Three automatic
requests were blocked: reminder status, notification status and telemetry.
The subsequent `m6-recycle-bin-search` attempt stayed on the loading skeleton;
the Search click was skipped because the selector matched zero elements.
Escape was pressed; no allowed opening was consumed and no dialog remained.
The attempt blocked two telemetry requests and recorded static-resource
HTTP/2 protocol failures. It proves no Search-panel state. In accordance with
the tool owner's stop-on-skipped instruction, no further opening was attempted.

Research is incomplete. Resume with a fully rendered no-click baseline and
resolve the page-load/tooling failure before any additional allowed opening.
Print Preview remains separately guard-blocked; no alternate selector was used.
Do not treat any missing initial state, populated state or write outcome as
implementation-ready. No reference record or saved preference was changed.

## Reviewed ready-gate retry (2026-10-15 10:08 UTC)

Following the reviewed MEP-655 / MEP-656 continuation, the single permitted
`m6-recycle-bin-search` retry used the explicit probe
`[data-zcqa="rclBnAdvSearchEnable"]`. It exited 2 with
`NOT RENDERED — no steps ran`: `ready.ok=false`, `waitedMs=30006`, zero probe
matches and ten failed script requests (`net::ERR_HTTP2_PROTOCOL_ERROR`).
The newly inspected screenshot and accessibility snapshot show only the loading
skeleton. Both requested steps (Search click and Escape) are `not-run`.
`clicks` is the requested selector list, not an executed-click log.
No allowed opening, file chooser, download, popup or print call occurred.
Six automatic telemetry POSTs were blocked; no record operation was attempted.

The six base files were refreshed in that existing capture folder. Older
`step-1` / `step-2` files left there belong to the preceding attempt and must
not be attributed to this retry; use `capturedAt` and `steps` in the fresh meta.
No Search-panel inventory or new dialog behaviour is established. Research
stopped at the failed gate pending Platform Lead review; no browser, profile,
network guard or reference preference was changed.

## Current continuation gate (2026-10-16)

MEP-718 remains in review with a pending board confirmation. The Platform
Lead requires that decision before another capture. Do not retry merely
because the task is resumed. After approval, follow the single-attempt
preconditions and stop rules recorded on MEP-718.

The three partial specs are already committed on the dedicated research
branch. Observed control inventories remain valid partial evidence; missing
dialogs and print destinations remain unobserved. No new capture or reference
interaction was performed during this checkpoint.
