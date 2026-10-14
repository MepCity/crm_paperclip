# Attachments — record cards and note attachments

Status: BLOCKED research draft (MEP-571), not implementation-ready. Metadata and
existing empty-card/composer evidence are confirmed. The capture tool cannot
attach to the shared browser, so new cards, menus, dialogs and Timeline evidence
remain pending. Checked on 2026-10-14 UTC (2026-10-15 local).

## Purpose and scope

Describe Attachments in Leads, Contacts, Accounts and Deals record details, plus
the paperclip in the Notes composer. No attachment was selected, uploaded,
downloaded, linked or deleted. No persisted view preference was changed.

The shared shell and parent-record controls belong to their existing screen
specs: [record-detail.md](record-detail.md),
[contacts-record-detail.md](contacts-record-detail.md),
[accounts-record-detail.md](accounts-record-detail.md) and
[deals-record-detail.md](deals-record-detail.md). Numbers below identify Module 6
controls; inherited shell controls retain their parent-spec numbers.

## Layout

Attachments is a separate related-list card in Overview, with a heading at the
left and an Attach button with a downward chevron at the right. The screenshot-visible Leads and Contacts
empty cards show `No Attachment` below the divider. No table headers or row
controls are painted in those empty cards. The Related List rail includes an
Attachments jump target. No attachment count is painted in the inspected empty
states; a count element in controls.json is not proof of a visible zero badge.

The Notes composer has a paperclip below the content area, beside the formatting
control. It is a separate attachment entry point, not the record card's Attach
button. The issue's Notes inventory 86 is the intended cross-reference; notes.md
is absent from this branch's starting revision.

## Fields and metadata

Source: local metadata `modules/Attachments/fields.json`.

| API field | Type | Metadata length | System mandatory | Role |
| --- | --- | --- | --- | --- |
| File_Name | text | 100 | yes | Stored attachment display filename |
| Size | bigint | 100 | yes | Stored byte-size field; length is not an upload budget |
| Parent_Id | lookup | 120 | yes | Parent relationship |
| Owner | ownerlookup | 120 | no | Attachment owner |
| Created_By / Modified_By | ownerlookup | 120 | no | Audit users |
| Created_Time / Modified_Time | datetime | 120 | no | Audit timestamps |
| id | bigint | 18 | no | Attachment identity |

All four parent `related_lists.json` files expose Attachments as visible, default,
with field customization disabled and sort customization enabled. Sequence is 4
for Leads and 3 for Contacts, Accounts and Deals. Exported generic record-operation
flags are false, despite the observed Attach button: do not interpret these flags
as evidence that attachment creation is unavailable or infer profile permissions.
There is no exported file-type allowlist, link-form schema or upload-size limit.

## Control inventory — existing empty-card and composer evidence

| # | Control | Position | What it does / observation limit | Source | Owner |
| --- | --- | --- | --- | --- | --- |
| AT-01 | Attachments rail entry | Related List rail; after Cadences in Leads, after Connected Records in the other three | Targets the Attachments related list; new navigation capture pending | All four existing Notes captures below | M6 |
| AT-02 | Attach | Attachments card header, right | Downward chevron indicates a source menu; menu contents pending | Leads/Contacts screenshots; Accounts/Deals DOM only, below viewport | M6 |
| AT-03 | Notes paperclip | Composer footer left, after formatting | Attachment entry point; not activated until its safety is established; must not open an OS file picker | Same captures; selector data-zcqa=notesAttachFile | M6 |

Accounts and Deals Attachments card content is below the viewport in these
existing screenshots; their DOM reports the same empty state and Attach control,
but that is not a painted-card observation.

Static heading and empty-state text have no action number. DOM wrappers and their
nested native buttons represent one control, not two. The empty cards expose no
filename link, selection checkbox, download/delete button, row menu, pagination,
column customization or attachment search. This describes these records only.

## Public documentation evidence

Checked read-only on 2026-10-14. Source keys match ADR 0005. Source locators keep
the exact public path but omit the branding-bearing hostname under the naming
rule; `Help` and `Developer` identify the reference CRM documentation origins.
These describe documented behavior, not observed browser requests or UI states.

| Key | Public source locator | Relevant evidence |
| --- | --- | --- |
| P1 | Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/manage-notes-and-attachments` | Upload selection: at most 10 files, 100 MB combined. No per-record file-count limit. Profile permissions govern access and creation/deletion. Deleted attachments enter a recycle bin; removal there prevents restoration. |
| P2 | Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/attachment-from-desktop` | Desktop guide instead specifies five files and 20 MB combined. It describes a file popup, adding further files and submission, after which files appear in the card. This conflicts with P1. |
| P3 | Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/organizing-notes` | Notes support up to five files totaling 20 MB through Attach File, then note Save. |
| P6 | Developer: `/crm/developer/docs/api/v8/upload-attachment.html` | Public multipart API supports a file or a link, one per call, under a parent-scoped Attachments resource, including Notes. Optional link title defaults to page metadata. API errors distinguish missing/multiple inputs, file-plus-link, authorization/authentication and internal failure. API errors do not establish browser error copy. |

## Flows and empty/error states

1. Open an existing parent record; observe its Attachments related-list card.
2. Open the Attach source menu only; opening a browser dialog is permitted, but
   selecting a file or triggering an OS picker is forbidden in research.
3. Leave all inputs blank and do not submit. File selection, uploading, attaching
   a URL, cloud authorization, download and deletion remain unexecuted.
4. The documented successful desktop upload adds files to the card (P2); exact
   loading/progress, success notice, row columns and focus restoration are unobserved.
5. The documented note flow attaches files to a note before Save (P3); unsaved
   staging, cancellation cleanup and note/card cross-list display are unobserved.

Observed empty state: heading + Attach + `No Attachment`, without an attachment
table. Error states requiring input/write are not tested. P1/P2 conflict prevents
claiming an active record-upload budget. Oversize, forbidden type, quota exceeded,
failed upload, duplicate filename, unavailable cloud service, invalid URL and
permission-denied UI copy/placement remain unobserved. No deletion confirmation
is claimed from documentation about the different Notes delete action.

## Open questions

- OQ-01: Which record-upload limit applies to this instance: P1 or P2? Do not
  choose a universal per-file limit from either combined-selection limit.
- OQ-02: Which attachment source options and browser dialogs are painted here?
  Capture pending; never click a file-picker trigger to resolve this.
- OQ-03: No populated card is established by the existing evidence. Exact columns,
  row icons, menu options, count formatting and pagination need an existing record
  with attachments; do not create one for research.
- OQ-04: Attachment-specific Timeline entries, labels, links, grouping and counts
  remain unconfirmed. A timeline without a matching event cannot prove absence.
- OQ-05: Does the Notes paperclip open a browser menu/dialog or an immediate OS
  picker? If safety cannot be established, keep activation unobserved.
- OQ-06: Validation/error copy, upload progress, successful refresh/focus, deletion
  confirmation and cancellation cleanup are not observable without a write or
  forbidden file selection. Public documents do not establish those UI states.
- OQ-07: Which file types, quota rules, parent-lock behavior, note attachment
  visibility and attachment permissions apply? Metadata alone does not decide.

## Existing screen reconciliation

- Leads (`m6-notes-leads-open`): AT-01, AT-02 and AT-03 are painted.
  Empty card is partly near the lower viewport edge. Shared shell follows the
  parent Leads detail; no new shell controls.
- Contacts (`m6-notes-contacts-composer-ready`): AT-01, AT-02 and AT-03
  are painted; the complete empty card is visible below Connected Records.
  Shared shell follows Contacts detail; no new shell controls.
- Accounts (`m6-notes-accounts-open`): AT-01 and AT-03 are painted.
  AT-02 and the empty attachment body are below the viewport and known only
  from DOM text/controls. The existing note list is not an attachment list.
- Deals (`m6-notes-deals-open`): AT-01 and AT-03 are painted. AT-02 and
  the empty attachment body are below the viewport and known only from DOM.
  Overview is selected; the lower record fields precede Notes.

Each existing screenshot, its aria.yml and controls.json was inspected.
No overlay covers these controls; no source menu or attach dialog is painted.
Utility-strip controls remain inherited from the parent spec; the Deals image
additionally paints Channels and Threads in its chat strip. This is shell
variation, not an attachment capability.

## Capture refs and safety

Existing local-only evidence (never copied into the repository):
- `m6-notes-leads-open`
- `m6-notes-contacts-composer-ready`
- `m6-notes-accounts-open`
- `m6-notes-deals-open`

New attempt: `m6-attach-leads-card` was allocated, but contains no capture
artifacts. It is not evidence. The first connection attempt was stopped after
remaining outputless; only that task-owned capture process and its own lock were
cleaned up. A fresh attempt with a 10-second CDP connection timeout completed with:
`shared browser is running but the CDP attach timed out; retry later (do not touch
the browser or profile)`. No browser/profile restart, logout or CRM action occurred.
No new meta.json exists, so no new blockedRequests audit is claimed.

Existing captures' meta.json entries were checked: the write block rejected
related-count POSTs, telemetry and legacy reminder/status requests. These are
blocked-request evidence, not successful writes. The four existing captures did
not report an attachment upload, download, link creation or deletion step.
No new screenshot is available; completion requires resumed safe capture after
connection recovery. `docs/parity-checklist.md` is outside this change.
