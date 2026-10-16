# Recycle Bin

Status: partial research for MEP-629. Initial populated screen observed on
2026-10-15; module filtering and a naturally empty state remain unverified.
No record was restored, deleted or selected; no preference was changed.

## Purpose and scope

Inspect deleted records available to the current user, including records from
Leads, Contacts, Accounts and Deals. The observed initial list combines record
types; it is not limited to the module from which Setup was opened.

## Layout and entry flow

Open the Setup navigation entry, then Recycle Bin under Data Administration.
`m6-setup` proves the navigation entry; `m6-recycle-bin` proves the destination.
The destination uses the Setup shell: settings navigation on the left, global
utilities at the top and a utility dock at the bottom. The content is a large
card with a title, Help, explanatory policy notices, action toolbar and table.

The top toolbar places Restore and Delete on the left and Empty Recycle Bin
on the right. A displayed range/count is above the table on the right. Headers
are an unlabelled selection column, Name, Type, Deleted By and Deleted Time,
with a funnel-shaped Search control at the far right. Each row has an unchecked
selection checkbox. Names, users, dates and other record values are intentionally
omitted from this spec. The content has its own vertical scroll container.

## Fields and control inventory

| ID | Position | Control | Initial state / observed purpose | Owner |
| --- | --- | --- | --- | --- |
| RB-01 | Settings sidebar top | Setup Home / back arrow | Return navigation; not exercised | Setup shell |
| RB-02 | Beside Setup Home | Settings customization icon | Preference affordance; never activated | Setup shell |
| RB-03 | Below Setup Home | Search | Settings navigation search; no input | Setup shell |
| RB-04 | Settings sidebar, Data Administration | Recycle Bin | Current selected navigation entry | Recycle Bin |
| RB-05 | Content header right | Help | Help navigation; not opened | Recycle Bin |
| RB-06 | Toolbar left | Restore | Visible outlined button; accessibility snapshot does not mark it disabled; no row selected | Recycle Bin |
| RB-07 | After Restore | Delete | Visible outlined destructive button; not marked disabled; never pressed | Recycle Bin |
| RB-08 | Toolbar right | Empty Recycle Bin | Visible outlined destructive button; not marked disabled; never pressed | Recycle Bin |
| RB-09 | Table header first column | Select all | Unchecked; never selected | Recycle Bin |
| RB-10 | Every visible row first column | Row selection checkbox | Unchecked; one control per visible row; never selected | Recycle Bin |
| RB-11 | Table header far right | Funnel / Search | Exported name Search; stable selector is evidenced, but panel opening was not attempted | Recycle Bin |
| RB-12 | Content right edge | Scroll container | Independent content scrolling; no sort/filter preference changed | Setup shell |

The capture folder's `inventory.md` separately numbers every visible row
checkbox, settings navigation entry and shell utility. Its sources are the
screenshot, accessibility snapshot and `controls.json`; nested duplicate DOM
nodes are counted as one control surface. Offscreen controls reported by the
accessibility tree are not asserted to be visible.

## Visible policy notices and action constraints

The screen describes a 60-day retention period followed by permanent removal.
It states that administrator profiles can permanently delete records, and that
other users can restore their own records and, with appropriate permission,
other users' records. A notice also describes a mass-restore restriction for
related child items while their parent remains in the bin. These are paraphrases
of visible explanatory notices, not verified action outcomes or API contracts.

No selected-row or confirmation state was manufactured. Initial buttons are
visible and not announced as disabled; that does not establish that invoking
them without a selection succeeds. No destructive action may be used to verify
validation. No filter, search value, sort or persisted preference was changed.

## Filters and empty state

The initial screen is naturally populated. No module dropdown is directly
visible before opening Search. The Search control's exported attributes include
an enable-related identifier, and its persistence semantics are unknown. It was
not activated in that initial capture. MEP-638 subsequently permitted its
initial opening only; the continuation attempt below did not find the control. Do not substitute another selector.
No records may be removed or restored to create an empty state.

## Capture refs

- `m6-setup` (2026-10-15; Setup navigation evidence)
- `m6-recycle-bin` (2026-10-15; initial populated list and `inventory.md`)

The capture's four blocked requests are automatic reminder/status and telemetry
requests. They are not evidence that a Restore/Delete operation was attempted.
Raw screenshots and record values remain in the local research workspace;
repository content describes structure only.

## Open questions

1. Search panel opening, module selector options and whether changing it persists
   a preference. The MEP-638 exception permits initial opening only. The continuation
   failed before opening; module selection and preference persistence remain
   unobserved and must not be tested by changing a selection.
2. Module-specific filtered states for Leads, Contacts, Accounts and Deals.
3. Naturally empty state and its toolbar availability; not observable by creating
   or removing data under the read-only rule.
4. Selected-row enablement, confirmations, validation and restore/delete outcomes:
   not observable without a write; do not test them in the reference CRM.
5. Exact roles and permissions beyond the visible explanatory notices.
6. Row hover actions and offscreen pagination, if any; neither is inferred from
   unlabelled blank cells or the visible range/count.

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
