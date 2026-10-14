# Attachments — record cards and note attachments

Status: Research ready for UI Lead review (MEP-571). Captures inspected on
2026-10-15 local. Unobserved populated rows and write-dependent states remain
explicit open questions; they are not implementation defaults.

## Purpose and scope

Describe Attachments in Leads, Contacts, Accounts and Deals record details, plus
the Notes composer paperclip. No file was selected, uploaded, downloaded, linked
or deleted. No cloud authorization or persisted preference change was performed.

## Layout and fields

Attachments is an Overview related-list card with a heading on the left and
Attach with a chevron on the right. The empty card says `No Attachment`; there
are no painted column headers, row controls or count badge in this state.
The Related List rail supplies an Attachments jump target. Opening it brings the
card into view; it does not hide, collapse or customize the card.

Metadata source: `modules/Attachments/fields.json`.

| API field | Type | Length | Mandatory | Role |
| --- | --- | --- | --- | --- |
| File_Name | text | 100 | yes | Attachment display filename |
| Size | bigint | 100 | yes | Stored byte size; length is not an upload budget |
| Parent_Id | lookup | 120 | yes | Parent relationship |
| Owner | ownerlookup | 120 | no | Owner |
| Created_By / Modified_By | ownerlookup | 120 | no | Audit users |
| Created_Time / Modified_Time | datetime | 120 | no | Audit timestamps |
| id | bigint | 18 | no | Attachment identity |

All four parent `related_lists.json` exports make Attachments visible/default,
with field customization disabled and sort customization enabled. Sequence is 4
for Leads and 3 for Contacts, Accounts and Deals. Generic record-operation flags
are false; the observed Attach button prevents treating these flags as proof
that attaching is unavailable. Permissions, MIME allowlists and upload budgets
are not established by this metadata.

## Numbered control inventory

Numbers identify logical controls, not DOM wrappers. Native buttons and their
wrappers count once. Static headings, empty messages and illustrations are not
controls. Shell controls remain owned by their parent record-detail specs.

### Overview card and source menu

Source: `m6-attach-leads-menu` step 2 (card) and step 3 (menu).

| # | Control | Position | Behavior / observation boundary | Owner |
| --- | --- | --- | --- | --- |
| AT-01 | Attachments jump target | Related List rail | Brings the card into view; safely opened | M6 |
| AT-02 | Attach | Card header right | Opens source menu below the button; chevron points upward while open | M6 |
| AT-03 | Upload File | Menu first row | Desktop-file entry point; not clicked because an OS picker must not open | M6 |
| AT-04 | Built-in cloud drive | Menu second row | Provider-branded source; described neutrally; not activated | M6 |
| AT-05 | Other Cloud Drives | Menu third row | Opens cloud-provider dialog | M6 |
| AT-06 | Link (URL) | Menu fourth row | Opens Attach From Link dialog | M6 |

The painted empty card has no selection checkbox, filename link, download,
delete, row menu, pagination, column chooser or search. No populated-card
structure is inferred from that absence.

### Per-module card/menu reconciliation

| Screen | Open-state evidence | Visible inventory | Result |
| --- | --- | --- | --- |
| Leads | `m6-attach-leads-menu`, steps 2–3 | AT-01–06 plus inherited AT-23–30 | Empty card; menu has four sources |
| Contacts | `m6-attach-contacts-states`, steps 2–3 | AT-01–06, inherited AT-23–32 | Empty card; same source order; adjacent Deals/activity actions are not attachment controls |
| Accounts | `m6-attach-accounts-states`, steps 2–3 | AT-01–06, inherited AT-23–30, AT-32, AT-38–41 | Empty card; same source order; Contacts and Emails rows are separate cards |
| Deals | `m6-attach-deals-states`, steps 2–3 | AT-01–06, inherited AT-23–30, AT-32, AT-42–44 | Empty card; same source order; Stage History is a separate table |

No empty-state count badge is painted in any of these four attachment cards.
Only Leads has Convert in its record header. Related List targets vary by module;
the full target inventory remains in each parent record-detail spec. The Deals
activity view selector paints an untranslated localization key; this belongs to
Activities, not Attachments, and was not changed.

### Attach From Link — blank opening state

Source: `m6-attach-leads-dialogs` step 4 screenshot and aria snapshot.
The modal overlays and dims the record page. Its title is Attach From Link.

| # | Control | Position | Behavior / observation boundary | Owner |
| --- | --- | --- | --- | --- |
| AT-07 | Enter URL textbox | Modal body | Single blank focused input with a required indicator; no text entered | M6 |
| AT-08 | Cancel | Footer, before Attach | Cancellation action, not clicked; Escape closes the blank dialog in step 5 | M6 |
| AT-09 | Attach | Footer right | Submission action, pale in blank state; disabled semantics not established by aria; never clicked | M6 |

No link-title field, close icon, error message or second input is painted in this
opening state. The required marker and pale action are observations before any
submission, not evidence of validation copy or accepted URL schemes.

### Other Cloud Drives — disconnected opening state

Source: `m6-attach-leads-dialogs` step 7 screenshot. The outer aria snapshot exposes
Close Modal and an iframe; iframe controls below are screenshot observations,
not top-document controls.json selector evidence.

| # | Control | Position | Behavior / observation boundary | Owner |
| --- | --- | --- | --- | --- |
| AT-10 | Close Modal | Dialog top right | Dismissal; not clicked; dialog remains visible in final capture | M6 |
| AT-11 | Google Drive source | Provider rail first | Selected on opening; shows disconnected account content; not changed | M6 |
| AT-12 | Box source | Provider rail second | Source selector, not activated | M6 |
| AT-13 | Evernote source | Provider rail third | Source selector, not activated | M6 |
| AT-14 | Dropbox source | Provider rail fourth | Source selector, not activated | M6 |
| AT-15 | OneDrive source | Provider rail fifth | Source selector, not activated | M6 |
| AT-16 | SharePoint source | Provider rail sixth | Source selector, not activated | M6 |
| AT-17 | Terms of use | Consent sentence in body | External provider information link; not opened | M6 |
| AT-18 | Privacy policy | Same sentence | External provider information link; not opened | M6 |
| AT-19 | Authenticate Google Drive | Body below consent | Authorization entry point; forbidden research mutation, not clicked | M6 |
| AT-20 | No files selected | Footer left, outlined control | Shows empty selection; interactivity is not established by screenshot | M6 |
| AT-21 | Attach with arrow | Footer right | Pale action with no selection; never clicked; disabled semantics unconfirmed | M6 |

The body shows a disconnected-account prompt and an illustration. No folder
listing, selected filename or authorization result is visible. Provider identities
come from visible logos; no reference image/icon asset was copied.

### Notes composer attachment entry

| # | Control | Position | Behavior / observation boundary | Owner |
| --- | --- | --- | --- | --- |
| AT-22 | Notes paperclip (Notes inventory 86) | Composer footer left, after formatting | Attachment entry point, `data-zcqa=notesAttachFile`; not activated because immediate OS-picker behavior is unresolved | M6 |

Existing evidence: `m6-notes-leads-open`, `m6-notes-contacts-composer-ready`,
`m6-notes-accounts-open`, `m6-notes-deals-open`. The composer is distinct from the
record card. Its other controls belong to the Notes inventory; notes.md was not
present in this branch when this research began.

### Inherited shell and adjacent cards

The screenshot inventory is reconciled with controls.json and aria snapshots.
All inherited controls below use existing parent specs for behavior. None was
activated except record navigation, the Attachments jump and Timeline.

| # | Visible control group | Position | Ownership / source |
| --- | --- | --- | --- |
| AT-23 | App picker, sidebar toggle, primary navigation, workspace picker/menu, sidebar search, module navigation and category disclosure | Global sidebar | App shell; record-detail specs |
| AT-24 | Record search, quick add, assistant, notifications, calendar, marketplace, settings, profile and app grid | Global top bar | App shell; record-detail specs |
| AT-25 | Back, Add Tags, Send Email, Convert where available, Edit, more actions, previous/next record | Record header | Parent module; each record-detail spec |
| AT-26 | Related List links, Add Related List, Add Link | Record rail | Parent module; no layout-changing controls used |
| AT-27 | Overview, Timeline, rail collapse icon | Above card area | Parent record detail; collapse icon not activated |
| AT-28 | Add Products, activity Add New, Compose Email where painted | Cards below Attachments | Products, Activities, Email; not attachment actions |
| AT-31 | New Deal | Contacts adjacent Deals card header | Deals; not activated |
| AT-32 | Column View, column configuration icon, expand icon | Contacts/Accounts/Deals activity card headers | Activities; not activated because view preferences may persist |
| AT-38 | Hierarchy View, Assign, New, Edit, column configuration and expand | Accounts adjacent Contacts card header | Contacts; no action used |
| AT-39 | Contact record/email links and phone action | Accounts adjacent Contacts rows | Contacts/communication; not attachment rows |
| AT-40 | Mails, Drafts, Scheduled and mail-source dropdown | Accounts adjacent Emails card | Email; no action used |
| AT-41 | Record website link | Accounts record header | Accounts; not opened |
| AT-42 | New competitor | Deals adjacent Competitors header | Deals; not activated |
| AT-43 | Enroll | Deals adjacent Cadences header | Cadences; not activated |
| AT-44 | Existing task record link | Deals adjacent activity card | Activities; not activated |
| AT-29 | Scroll To Top | Lower right of content | Record detail; not activated |
| AT-30 | My Pins, Chats, Contacts and utility icons: unnamed first utility, Announcements, Motivator, Sticky Notes, Activity Reminders, Recent Items, Accessibility, Help | Bottom utility strip | Shared shell; no new attachment action |

The card/menu screenshots leave the record shell visible. Dialog screenshots
retain the shell as a dimmed backdrop, not a second set of available attachment
controls. Source-menu item icons are part of their row actions, not extra buttons.

### Timeline observation

Source: `m6-attach-contacts-states` and `m6-attach-accounts-states` step 5.
Timeline opens on History; the
Contacts record has creation and call events. Accounts also has related-contact
and note events, without an attachment event. Accounts paints only History;
Contacts and Leads also paint Interactions. Leads
`m6-attach-leads-timeline` step 2 shows an existing record-image upload event;
that is a profile image event, not an Attachments related-list event. Deals step 5 paints History with `No logs
found` and no Interactions tab. No customer event text is copied.

| # | Control | Position | Behavior / observation boundary | Owner |
| --- | --- | --- | --- | --- |
| AT-33 | History | Timeline inner tab row left | Selected on opening | Record detail |
| AT-34 | Interactions | Beside History | Other timeline section; not activated | Record detail |
| AT-35 | Filter Timeline History | Beside timeline heading | Filter icon; not activated | Record detail |
| AT-36 | Show Upcoming Automated Actions | Timeline upper right | Disclosure action; not activated | Automation |
| AT-37 | Existing event record links | Timeline event bodies | Related record navigation; not activated; customer text omitted | Activities / record detail |

No attachment filename, download action or attachment row is visible in this
Timeline sample. These controls are inherited record-detail behavior, not new
attachment capabilities.

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

1. Open an existing record and use its Attachments rail target.
2. Open Attach to inspect its source menu. No source is selected for uploading.
3. Open Link (URL) with blank input. Capture it and press Escape; never submit.
4. Open Other Cloud Drives and capture its initial disconnected state. Do not
   select a provider, authenticate, browse files or attach anything.
5. Observe Timeline on existing records. An empty attachment card and a timeline
   without an attachment event do not prove that attachment events are absent.

Documented successful desktop upload adds files to the card (P2). Note files are
attached before note Save (P3). Progress, successful refresh/focus, duplicate
filename, cancellation cleanup and note/card cross-list display are unobserved.
Oversize, forbidden type, quota, failed upload, unavailable cloud, invalid URL and
permission-denied UI copy/placement require prohibited input or writes and remain
open questions. Public API errors do not establish browser error messages.

## Open questions

- OQ-01: Which record upload budget applies: P1 (10 files / 100 MB combined) or
  P2 (five files / 20 MB combined)? Neither establishes this instance's rollout.
- OQ-02: Does Upload File open a browser staging dialog or an immediate OS file
  picker? Not activated under the explicit no-picker rule. Built-in cloud-drive
  dialog and connected cloud contents remain unobserved.
- OQ-03: No populated card was found in the inspected records. Exact columns,
  filename/link rendering, row icons/actions, count formatting and pagination
  require existing attachment evidence; never create attachments to obtain it.
- OQ-04: Attachment-specific Timeline event labels, links, grouping and counts
  remain unconfirmed. Unrelated existing events are not attachment evidence.
- OQ-05: Does Notes inventory 86 open a browser chooser or an immediate OS picker?
  The paperclip remains unactivated; note attachment staging is unobserved.
- OQ-06: Validation, progress, success/failure notices, deletion confirmation and
  unsaved cleanup are not observable without a write or forbidden file selection.
- OQ-07: MIME allowlist, quotas, permissions, parent-lock behavior, note attachment
  visibility and supported URL schemes remain unresolved.
- OQ-08: Screenshot-pale Link Attach and Cloud Attach actions need disabled/focus
  semantics verified in permitted implementation QA; screenshot color alone does
  not prove disabled DOM semantics. Cloud footer selection-control behavior is
  not established because its iframe is not enumerated by controls.json.

## Capture refs and safety

All capture evidence stays local in the research workspace; no customer values,
record identities, screenshots or reference assets enter this repository.

- `m6-attach-connection-check`: successful list capture after CDP recovery.
- `m6-attach-leads-menu`: record opening, card jump, four-item source menu.
- `m6-attach-leads-dialogs`: blank link dialog (step 4), Escape (step 5),
  disconnected cloud dialog (step 7); final dialogVisibleAfterClose is true,
  automaticEscape is false. Capture ends by closing only its own temporary tab.
- `m6-attach-contacts-list` and `m6-attach-contacts-states`: card/menu steps 2–3,
  Timeline step 5; empty attachment card and the same four source choices.
- `m6-attach-accounts-list` and `m6-attach-accounts-states`: card/menu steps 2–3,
  Timeline step 5; adjacent Contacts rows belong to Contacts, not Attachments.
- `m6-attach-deals-list` and `m6-attach-deals-states`: card/menu steps 2–3,
  empty Timeline step 5; unique visible link name used for safe record opening.
- `m6-attach-leads-timeline`: step 2; existing record-image event, no attachment event.
- Existing Notes captures listed above: paperclip/composer evidence.

Each screenshot/step image is checked against its aria snapshot and final
controls.json. The final controls snapshot can retain hidden DOM elements;
painted state takes precedence. For menus/dialogs dismissed by automatic Escape,
the numbered step image is the open-state source rather than screenshot.png.

Blocked requests include related-list count POSTs, legacy reminder/status and
telemetry. Deals list/states additionally blocked grouped-count POSTs and an
automatic settings/modules/Deals PUT on page opening; no settings control was
clicked. These attempts never reached the reference server. They were rejected by the tool, not successful writes. The capture
connection was recovered using the tool's default timeout; no browser/profile
restart, logout or guard change occurred. No OS picker opened. File upload,
download, link creation, deletion and cloud authorization were never executed.
`docs/parity-checklist.md` is outside this change.
