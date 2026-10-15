# Print, Share and Drafts

Status: partial research for MEP-629. Drafts initial empty states are observed
in all four modules; print destination and sharing are not implementation-ready.
Screenshots and accessibility snapshots were inspected on 2026-10-15.
No print dialog, send operation or reference write was performed.

## Purpose and layout

Study record Print Preview, list Print View, record Share and module Drafts for
Leads, Contacts, Accounts and Deals. Entry points sit in the upper-right Actions
or record More menu. Drafts content is observed below; print and sharing
destination layouts remain unobserved.

## Observed control inventory

| ID | Position / state | Control and observed behaviour | Source / owner |
| --- | --- | --- | --- |
| PS-01 | Leads record header, upper right | More menu is open beside primary record actions. | `w2f-detail-more` / record detail |
| PS-02 | Record More menu, after Clone | Share entry is visible. Initial dialog and permissions not observed. | `w2f-detail-more` / Share |
| PS-03 | Record More menu, below Delete and a separator | Print Preview entry is visible. Destination not observed. | `w2f-detail-more` / Print |
| PS-04 | List toolbar, upper right | Actions opens the module menu. | Four Actions captures below / module list |
| PS-05 | Actions menu, below Manage Tags | Drafts is a module-scoped navigation link in all four modules. | Four Actions captures / Drafts |
| PS-06 | Actions menu bottom, Leads / Contacts / Accounts tables | Print View has a right-facing submenu indicator. Submenu observed below; destination unobserved. | Three table Actions screenshots / Print |

Deals was already in stage-board view. Its open Actions menu ends after Export
Deals and has no visible Print View entry. Do not infer its table view behaviour
or change the user's saved view to obtain it.

## Drafts initial empty state (all four modules)

`m6-leads-drafts`, `m6-contacts-drafts`, `m6-accounts-drafts` and
`m6-deals-drafts` each open a full content page in the app shell. A back arrow,
Drafts title and information icon occupy the header left; Help is on the right.
An expanded Criteria card contains a numbered criterion, field selector showing
None, a second None selector with disabled styling, a disabled value textbox,
a green plus control and a disabled Search button. Hide with a chevron is at
the card top right; it was not pressed because persistence was not established.
Below is a separate empty results card with the short status No records available.
No result headers, row actions or send controls are visible in this empty state.

| ID | Position | Control / purpose | Initial state |
| --- | --- | --- | --- |
| PS-07 | Header left | Back navigation | Visible; not exercised |
| PS-08 | Beside title | Information icon | Visible; tooltip not inspected |
| PS-09 | Header right | Help | Visible; not opened |
| PS-10 | Criteria card top right | Hide / chevron | Expanded panel; never toggled |
| PS-11 | Criteria row left | Number textbox | Shows first criterion index |
| PS-12 | Criteria row | Field selector | None |
| PS-13 | After field selector | Operator selector | None; disabled-looking |
| PS-14 | After operator | Value textbox | Disabled |
| PS-15 | Row right | Plus icon | Additional criterion affordance; not pressed |
| PS-16 | Under criterion row | Search | Disabled |

## Print View submenu (Leads, Contacts and Accounts)

In `m6-leads-print-menu`, `m6-contacts-print-menu` and
`m6-accounts-print-menu`, hovering Print View opens a compact submenu to the left
of the Actions menu.
The first row is Print Default view and the second is Print Using Canvas with
an accent marker. These are action entries; neither was activated. The capture
therefore proves submenu structure, not whether either opens a preview page or
immediately requests the browser print dialog. That distinction must be resolved
before activation because this task excludes the print dialog.

| ID | Position | Control / purpose | Observation |
| --- | --- | --- | --- |
| PS-17 | Actions menu bottom | Print View | Hover opens left-side submenu |
| PS-18 | Submenu top | Print Default view | Visible; not activated |
| PS-19 | Submenu bottom | Print Using Canvas | Visible; not activated |

## Fields and flows

Drafts links carry module context. All four observed destinations are naturally
empty. Populated-result columns and row actions are therefore unverified. Share
recipients, access-level fields, notifications, permissions, validation and
confirmation behaviour remain unknown. Print layout, section selection, controls,
new-window behaviour and pagination remain unknown.

Safe continuation: open each module's Drafts route through its visible link;
open record More and the named Share / Print Preview entry only when permitted
by the capture guard. Inspect Print View submenu before any item selection.
Never open the browser print dialog, submit sharing, send a draft or change a
persisted preference. Capture each initial state before Escape.

## Capture refs

- `m6-csv-leads-actions`, `m6-csv-contacts-actions-retry`,
  `m6-csv-accounts-actions-retry`, `m6-csv-deals-actions` (2026-10-14)
- `w2f-detail-more` (2026-10-09; inherited Leads detail evidence)
- `m6-leads-drafts`, `m6-contacts-drafts`, `m6-accounts-drafts`,
  `m6-deals-drafts` (2026-10-15; fresh empty-state evidence)
- `m6-leads-print-menu`, `m6-contacts-print-menu`, `m6-accounts-print-menu`
  (2026-10-15; hover submenu evidence and standalone `inventory.md`)

## Open questions

1. Print Preview initial page/window and every control in all four modules.
2. Print View destination and Deals table availability without a view change;
   the submenu is now observed in Leads, Contacts and Accounts.
3. Share initial state in all four record modules; no sharing may be submitted.
4. Drafts populated-result columns and row actions; initial empty states are
   observed in all four modules without creating drafts.
5. See each capture folder’s `inventory.md` and the shared shell inventory
   in [tags.md](tags.md#shared-shell-control-inventory). No populated Drafts state
   can be manufactured under the read-only rule.
6. If dialog opening is rejected, record the exact guard result and route the
   bounded tooling question through MEP-562; do not substitute a selector to bypass it.

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
