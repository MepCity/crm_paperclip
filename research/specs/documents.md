# Documents

Status: main-screen baseline approved for MEP-922; MEP-928 folder and iframe
research submitted for UI Lead review.
Platform Lead accepted the retained `m9-documents-main` screenshot and listing
read in MEP-926 despite the ambiguous readiness selector. No new capture was
needed. MEP-928 adds an observed existing-folder empty state below. File detail and
preview remain unobserved; this is not a complete module specification.

## Purpose

Research the Documents module entry, folder navigation and file listing under
the Module 2+ screenshot-and-behaviour parity rule. No measurements or request
contract are required. Write actions and persisted preferences remain forbidden.

## Metadata

Source: research workspace `metadata/modules.json`, Documents entry.

| Property | Exported value |
| --- | --- |
| API name / module name | `Documents` |
| Singular / plural label | Documents |
| Access type | `org_based` |
| Generated type | `default` |
| Visible / viewable / shown as tab | true / true / true |
| Sequence number | 22 |
| API supported | false |
| Creatable / editable / deletable | false / false / false |
| Filter supported / quick create / global search supported | false / false / false |

There is no `metadata/modules/Documents/` directory in the exported dataset.
Consequently no Documents field dictionary, layouts, custom views or related-list
configuration is available there. Do not invent a record-style schema or infer
that file operations are unavailable in the UI from these module API flags.

## Layout and fields

The selected Documents module uses the shared shell. Within its content area,
a narrow folder pane sits beside a larger embedded listing. The folder pane
shows a selected My Folders entry, an expanded Team Folders section with an
addition icon, one existing team-folder entry with a lock indicator, and an
external file-service link at the bottom.

The listing header contains a breadcrumb through an application collection to
the current application folder, a current-folder dropdown, and three utility
icons. Beneath it are Name and Last Modified columns, a downward sort indicator
beside Last Modified, and a circled plus at the far right of the column header.
One existing folder row is visible, with a folder icon, name, uploader byline,
and modification date/modifier. A narrow right strip offers Details and an
assistant entry. No customer names, folder values, dates or identities are
reproduced. The lock indicator alone does not establish effective permissions.

There is no file row in this state. Unoccupied space below the existing folder
is ordinary list space, not a verified empty-folder state. No upload button,
selection checkbox, pagination, search field for files or selection toolbar is
visible in the accepted screenshot; do not invent them from other modules.

## Control inventory

Sources: **S** = accepted screenshot `m9-documents-main/screenshot.png`;
**C** = matching visible control in that capture's `controls.json` (with ARIA
labels where available). Every row describes an apparent purpose, not an
executed action: the capture has no clicks or steps. Owner **D** = Documents /
embedded file service; **H** = shared shell; destination modules own their
screens. Icons with uncertain identity stay explicitly uncertain.

The embedded listing is painted in S, but its individual controls and folder
rows are absent from C and the top-level ARIA snapshot. Screenshot-only entries
are deliberately retained; they are not tool-safe selectors or proof of click
behaviour. Containers, duplicate DOM wrappers, zero-area dialogs and offscreen
Products entries are not additional visible controls.

| No. | Position / control | Apparent purpose / observed state | Source | Owner |
| --- | --- | --- | --- | --- |
| D1 | Folder pane top, My Folders | Personal-folder navigation; highlighted | S | D |
| D2 | Below D1, Team Folders disclosure | Section expanded; persisted disclosure must not be clicked | S | D |
| D3 | Right of Team Folders, circled plus | Folder addition affordance; write flow, never clicked | S | D |
| D4 | Below section, existing team-folder entry | Folder navigation; adjacent lock indicator | S | D |
| D5 | Folder pane bottom, external file-service link | External navigation; destination omitted, not opened | S+C | D |
| D6 | Listing header left, leading chevron | Breadcrumb overflow/ancestor affordance; exact purpose unverified | S | D |
| D7 | Breadcrumb, application collection | Ancestor navigation affordance | S | D |
| D8 | Breadcrumb, current application-folder dropdown | Location/menu affordance; entries unknown | S | D |
| D9 | Listing header right, opposing vertical arrows | Sort affordance; must not change persisted sort | S | D |
| D10 | Beside D9, funnel | Filter affordance; opening and persistence unknown | S | D |
| D11 | Beside D10, list-with-small-boxes icon | List view control; iframe button has ARIA label `List`, child SVG `View`; never clicked | S + MEP-928 frame C | D |
| D12 | Column header, Name | Name column; whether header sorts is unverified | S | D |
| D13 | Column header, Last Modified and downward arrow | Current visible sort indication; click/cycle/persistence untested | S | D |
| D14 | Far right of column header, circled plus | Manage listing columns; iframe button ARIA label confirms identity; never clicked | S + MEP-928 frame C | D |
| D15 | First listing row, folder icon/name | Existing folder link; opened read-only in MEP-928 and reached an empty folder | S + MEP-928 frame C | D |
| D16 | Right strip top, Details | Information-pane affordance; panel persistence unknown, do not toggle | S | D |
| D17 | Right strip below Details, assistant | Assistant affordance; behaviour unverified | S | D |
| H1 | Top left, app selector | Application switching; current app label neutralized | S+C | H |
| H2 | Sidebar top right, Hide Menu | Persisted menu visibility; do not toggle | S+C | H |
| H3 | Upper sidebar, Home | Home destination | S+C | H |
| H4 | Below Home, Workqueue | Workqueue destination | S+C | H |
| H5 | Below Workqueue, Reports | Reports destination | S+C | H |
| H6 | Below Reports, Analytics | Analytics destination | S+C | H |
| H7 | Below Analytics, Agents | Agents destination | S+C | H |
| H8 | Below Agents, MCP | MCP destination | S+C | H |
| H9 | Sidebar middle, teamspace selector | Current teamspace and selection affordance | S+C | H |
| H10 | Right of teamspace, more actions | Teamspace/module menu affordance | S+C | H |
| H11 | Beneath teamspace, Search | Module search input; not filled | S+C | H |
| H12 | Sales group header | Expanded group disclosure; do not toggle | S+C | H |
| H13 | Sales, Leads | Leads destination | S+C | H |
| H14 | Sales, Contacts | Contacts destination | S+C | H |
| H15 | Sales, Accounts | Accounts destination | S+C | H |
| H16 | Sales, Deals | Deals destination | S+C | H |
| H17 | Sales, Documents | Current selected module | S+C | H |
| H18 | Sales, Campaigns | Campaigns destination | S+C | H |
| H19 | Activities group header | Expanded group disclosure; do not toggle | S+C | H |
| H20 | Activities, Tasks | Tasks destination | S+C | H |
| H21 | Activities, Meetings | Meetings destination | S+C | H |
| H22 | Activities, Calls | Calls destination | S+C | H |
| H23 | Integrations group header | Expanded group disclosure; do not toggle | S+C | H |
| H24 | Integrations, Visits | Visits destination | S+C | H |
| H25 | Sidebar bottom, Price Books | Price Books destination | S+C | H |
| H26 | Sidebar right edge, resize handle | Width adjustment; C identifies handle, do not drag | C | H |
| H27 | Top bar, Search records | Global record search affordance | S+C | H |
| H28 | Beside search, plus | Global create affordance; not opened | S+C | H |
| H29 | Top bar, assistant | Global assistant affordance | S+C | H |
| H30 | Top bar, bell | Notifications affordance | S+C | H |
| H31 | Top bar, calendar | Calendar destination | S+C | H |
| H32 | Top bar, storefront | Marketplace destination | S+C | H |
| H33 | Top bar, gear | Setup destination | S+C | H |
| H34 | Top bar, avatar | Profile affordance | S+C | H |
| H35 | Top bar far right, grid | Applications menu | S+C | H |
| H36 | Bottom left, My Pins | Pins affordance; no pin action | S+C | H |
| H37 | Beside pins, Chats | Chat affordance | S+C | H |
| H38 | Beside chats, Contacts | Messaging contacts affordance | S+C | H |
| H39 | Bottom utility strip, first unlabeled icon | Command-palette affordance: matching C entry has `data-zcqa="open_commands_palette"` and selector `#wmscsdiv`; never opened | S+C | H |
| H40 | Bottom strip, megaphone | Announcements affordance | S+C | H |
| H41 | Bottom strip, chart | Motivator affordance | S+C | H |
| H42 | Bottom strip, note | Sticky Notes affordance | S+C | H |
| H43 | Bottom strip, alarm | Activity Reminders affordance | S+C | H |
| H44 | Bottom strip, recent/history | Recent Items affordance | S+C | H |
| H45 | Bottom strip, accessibility | Accessibility affordance | S+C | H |
| H46 | Bottom strip, Help | Help affordance | S+C | H |
| H47 | Bottom far right, tray-like glyph | Identity unverified; do not infer action from glyph | S | H |

Documents heading, breadcrumb separators, section labels, lock glyph, uploader
byline and date/modifier are display content, not separate controls. No Channels or Threads control is established in this accepted screenshot.
H39 is identified by its DOM attribute rather than its unlabeled glyph; this
does not establish command-palette contents or opening behaviour.

## Actions, filters, views, sorting and search

The baseline observed direct navigation to `/crm/<org>/tab/Documents`;
MEP-928 additionally followed the existing folder link in the embedded list. The accepted
state contains one folder and visibly indicates descending Last Modified sort;
the recorded listing read returned 200. No sort interaction or tie-breaking
rule was tested. Filter and configuration icons are visible, but their menus,
values and persistence remain unknown. The shared module search and global
record search must not be mistaken for a file-list search.

One existing folder link was subsequently opened (MEP-928 evidence below).
No file-detail, preview, Details pane or assistant control was opened. Panel
toggles may persist preferences; D16 remains forbidden without evidence. Upload, folder creation,
move, delete and share controls must never be clicked; their write-dependent
behaviour remains an open question until public documentation is researched.

## Flows, validation and errors

Opening Documents displays the folder-navigation pane and populated listing
shown in the accepted capture. Personal-folder highlighting and the current
application breadcrumb are recorded as seen, without assuming their semantic
relationship. The baseline establishes no empty folder; MEP-928 below establishes one.
No file selection, file detail, preview, permission error, validation message,
success message or write-dependent failure is established. The blank continuation is a capture-timing artifact, not a product
empty or error state. No fields were filled, file chooser opened, download or
print triggered, nor record or preference intentionally changed.

## Capture refs and safety audit

Both captures are local-only research evidence from 2026-10-20; each has all six
base files. Screenshots, raw network data and customer values remain outside git.

### Accepted main-screen evidence: `m9-documents-main`

- Probe `text=Documents` failed after 30028 ms because two elements matched;
  exit 2. This readiness result remains a failure in the raw evidence.
- Screenshot nevertheless contains the full folder/list surface. The recorded
  `files?sort=…` listing read has status 200; failed scripts and pending requests
  at readiness are both empty. Client initialization diagnostics are retained.
- Platform Lead's MEP-925 and MEP-926 reviews accepted this existing evidence;
  MEP-926 explicitly said no new capture was needed. Acceptance is a reviewed
  exception based on rendered evidence, not a claim that the probe passed.
- No clicks or steps. Six POSTs blocked by the unchanged guard: reminder,
  notification status and four telemetry calls. No successful write is evidenced.
- An initial sandbox invocation failed before capture-directory creation;
  the authorized invocation used the same slug. No browser/profile changes.

### Timing diagnostic only: `m9-documents-main-ready`

- Folder-shell probe `#show div.zWDListUlInner` passed in 168 ms, but 14 requests
  were pending, including embedded scripts. The listing read was absent and
  the main pane was blank. This probe does not establish list readiness.
- Two background POSTs blocked: reminder and notification status. No clicks,
  steps, file chooser, download or print.
- Evidence was written before a CDN callback cleanup error ended the process
  with exit 1. Platform Lead reported the tool cleanup error fixed in MEP-926;
  no further capture or retry was performed in this continuation.

## MEP-928 initial continuation: historical extraction prerequisite

Historical status before MEP-931/MEP-932 completed: live folder and preview
capture awaited capture-tool support. No new capture or click was attempted in this continuation. Existing
capture slugs above remain the only screen evidence; no new state or D18+ control
is claimed. The execution workspace remains on the runtime-assigned branch.

The accepted `m9-documents-main/controls.json` has 140 entries. Matching the
bottom-strip coordinates to its screenshot resolves H39 through the exported
`open_commands_palette` attribute. H47 has no matching exported identity.
D6, D11 and D14 still lack embedded DOM attributes; do not identify them solely
from glyphs or the service's documented capabilities.

Offline inspection of the capture implementation shows that both its standard
control export and extra-control collector query the main `document`; ARIA and
page text are also taken from the top-level body. They do not enumerate frame
bodies or shadow roots. The existing output therefore cannot establish whether
the omitted listing uses a frame, a shadow root, or another DOM boundary. This
is an extraction limitation, not proof of a particular embedding mechanism.

Neither D4 nor D15 has a safe unique selector in the retained export. The only
exported Documents scroll container, `#show div.zWDListUlInner`, occupies the
folder pane and already produced a premature shell-only readiness result.
Do not reuse it as listing readiness. No content-specific probe can currently
be grounded in exported row attributes without guessing. A capture-tool owner
must provide passive embedded DOM/control evidence, including labels, titles,
context and unique selectors with explicit frame/root scope, before navigation.
The existing write/persistence guards and capture-only access rule must stay
unchanged. Do not use a separate browser connection to fill this evidence gap.

D16 remains untouched: neither retained DOM evidence nor the documentation
establishes its persistence. Do not toggle it to discover that behaviour. File
preview remains conditional on finding an existing file and proving that its
entry opens a read-only preview rather than download or editor navigation.
An empty state must come from an existing reachable empty folder, never creation.

### Reconciliation with documented flows

Source: `documents-write-flows.md` (MEP-927); its linked public-documentation
sources and U1–U13 remain authoritative for documented capabilities. The table
maps evidence without promoting generic service behaviour to captured UI fact.

| Baseline control / surface | Documentation relationship | Safe conclusion / unresolved gap |
| --- | --- | --- |
| D1, D4, D15 folder navigation | Personal managed-attachment roots and collaborative team roots are distinct | Root highlighting alone does not classify the visible child folder; contents, breadcrumbs and empty states await navigation |
| D3 team-folder plus | Team-folder creation/association and CRM-profile gates | Write affordance only; creation dialog and lock meaning U2 remain unobserved |
| D6–D8 breadcrumb | Hierarchical folder navigation | Ancestor/overflow behaviour and current-folder menu remain unobserved |
| D9, D12–D13 sort | User-specific sorting; documented fields and directions | Descending modification indicator only; no header cycle or persistence test |
| D10 filter | Generic file-type categories | Exact embedded menu and persistence remain unknown; no filter interaction |
| D11 view utility | Thumbnail, List and Compact documented | Does not identify this glyph or authorize a view change (U10) |
| D14 column-header plus | No verified mapping | Identity/options remain U10 |
| D15 folder row / possible future file row | Existing-folder browsing versus format-dependent file preview | No file row in baseline; no upload, editor, download or preview was opened (U5) |
| D16 Details strip | Generic Properties has General Info and optional activity/access statistics | Mapping, no-selection contents and persistence remain unproven (U11) |
| Main list without selection | Upload, move, rename, versions, sharing and Trash are documented elsewhere | No selection toolbar or action menu is captured; documented roles/flows do not prove embedded control availability |
| Documents versus record attachments | Managed record uploads differ from linked service files | No picker, linking/copying or lifecycle relationship is established by this screen (U12) |

No literal validation, success, error or permission message is added by this
mapping. Preview-limit conflicts, permission precedence, Trash retention and
attachment identity remain with the owners listed in `documents-write-flows.md`.

## MEP-928 completed continuation: frame evidence and existing empty folder

Sources: `m9-documents-frames` and `m9-documents-folder`, captured on
2026-10-20 outside the overnight restriction. Both captures completed with exit
0 and contain all six base files. The initial prerequisite above is retained as
history; MEP-931/MEP-932 supplied the approved frame collector and guards.

### Readiness and navigation evidence

The click-free frame baseline exports 171 controls, including 31 entries in
frame 6. The embedded list belongs to the main-document iframe
`#pdfPreviewFrame`; this is observed frame ownership, not an inference from its
name. Hidden utility frames are not additional Documents controls. The current
folder row is an actual anchor with a folder destination, a visible name and a
unique exported selector. Its literal name, path and identifier stay local.

Before the sole click, the tool required that exact existing row's
`data-automation-id` selector to be unique and visible inside
`#pdfPreviewFrame`. This content-specific gate passed in 100 ms with no failed
scripts. It did not use the folder-pane shell or merely the iframe container.
The same frame-scoped anchor was clicked once; meta records `clicked`.
After the configured wait, the final screenshot and frame ARIA agree on the
new child breadcrumb and empty-state heading. The pre-click gate is not a
post-navigation readiness assertion; the final rendered evidence establishes
the empty state. The folder read returned 200, with no pending requests at the
pre-click gate. No shell-only blank state is accepted as product evidence.

### Existing-folder layout and flow

The shell, selected Documents item, left folder pane and right utility strip
remain visible. The breadcrumb gains one child: the former current application
folder becomes an ancestor button and the opened folder becomes the trailing
dropdown. The trailing menu was not opened. The main list area displays a
centered empty illustration above the short heading `No items available.`.
Recreate an original illustration; never copy its source asset.

The Name / Last Modified header, column-management icon, selection control and
row actions are absent in this empty state. Sort, Filter and List controls
remain at the top right; Details and the assistant remain in the narrow right
strip. No upload/create call to action, table row, pagination or editable field
is visible. This is an existing empty folder, reached without creating data.
The left personal-folder selection and team-folder entry do not change.

No file exists in the observed root listing or opened child. Consequently no
file detail, preview, format support or preview error can be claimed. No file
was uploaded to manufacture evidence. D4 remains screenshot-only: even the new
collector provides no distinct safe exported selector for the left team-folder
entry, so it was not clicked. Do not infer that it has the same destination as
the breadcrumb merely from matching visible text.

### Numbered inventory extension

Sources **F** = `m9-documents-frames` screenshot + frame controls/ARIA;
**E** = `m9-documents-folder` screenshot + frame controls/ARIA. D1–D17 and
H1–H47 retain their numbers. The shell controls H1–H47 and left-pane D1–D5
remain as in the baseline; H47 remains screenshot-only and unclicked.

| No. | Position / control | Observed state / behaviour | Source | Owner |
| --- | --- | --- | --- | --- |
| D18 | Populated list header, before Name | Select all button exposed by ARIA; not apparent in baseline screenshot, not clicked | F controls/ARIA | D |
| D19 | Populated folder row, far right | More actions button exposed by ARIA; no menu opened | F controls/ARIA | D |
| D20 | Empty-folder breadcrumb, between application collection and current child | Former current application-folder ancestor button; no return click tested | E | D |
| D21 | Empty-folder breadcrumb, trailing child and arrow | Opened folder's current-location dropdown, contents unknown | E | D |

D6–D8 remain breadcrumb controls in F; E retains D6/D7 and replaces the
baseline current-location D8 with D20/D21. D9–D11 and D16–D17 remain in both
captures. D12–D15 and D18–D19 are present only in F, absent in E. Folder glyphs,
breadcrumb separators and the empty illustration/heading are display content,
not extra controls. This state accounting includes every visible shell, pane,
listing and utility control without recounting duplicate SVG wrappers.

### Icon reconciliation and documented-flow mapping

- D11: button ARIA label `List`, `data-automation-id="list-button"`, child SVG
  ARIA label `View`. This confirms a view control and current label, without
  opening its menu or verifying the documented alternative views (U10).
- D14: button ARIA label `Manage listing columns`, id `listing_columns`,
  `aria-haspopup=true`. Column management identity is confirmed; menu contents
  and persistence stay unobserved (U10). It is absent in the empty state.
- D6: the leading glyph exports only generic SVG label `items` and a generated
  id. No useful action name or semantic title is supplied. Its screenshot
  position does not prove overflow/ancestor behaviour. Do not click it.
- H39 remains confirmed by `open_commands_palette`; H47 has no matching useful
  DOM identity in either new capture. The zero-height live-chat complementary
  node does not prove the identity of the visible far-right glyph.
- D16: `Details`, id `key_infopanel`, and `show-info-button` establish the
  information-pane affordance. They do not establish whether visibility is
  persisted. It was not toggled; U11 remains open.
- The documented hierarchy now has an observed existing-folder transition and
  empty-state counterpart. Permission meaning of the lock, team-root semantics,
  role precedence, and all write flows remain with `documents-write-flows.md`.
  The absence of a file keeps U5 preview mapping unresolved.

### Capture safety audit

| Capture | Actions | Blocked requests | Other safety evidence |
| --- | --- | --- | --- |
| `m9-documents-frames` | None; passive frame baseline | 3 POSTs: reminder, notification status, telemetry | No chooser, download, print, popup or opening permission |
| `m9-documents-folder` | One existing-folder anchor click | 4 POSTs: reminder, notification status, two telemetry | No chooser, download, print, popup or opening permission; no skipped click |

The request guard blocked these background writes. No blocked request was a
folder mutation or preference change; no successful write is evidenced. No
sort, filter, view, column, disclosure, Details or other preference control was
clicked. Raw captures, paths, account identifiers and customer values remain
only in the local research workspace. Client initialization diagnostics are
retained; they are not invented application error states.

## Open questions and subsequent research boundaries

1. D4 safe navigation and team-root contents: no distinct exported control
   selector; not clicked. UI Lead/CTO should decide whether further bounded
   passive tool evidence is needed before implementation of that surface.
2. File detail/preview (U5): no existing file in the safely reachable root/child.
   No preview is observable here; do not create/upload a fixture in the reference.
3. Details persistence and exact properties mapping (U11): unproven; never toggle
   it as an experiment. Keep documented properties separate from captured UI.
4. D6 and H47 identity remain unresolved because their exported DOM carries no
   useful semantic label. No unknown-icon click or tooltip hover was used.
5. D8/D21 breadcrumb arrow: the dropdown behind it was never opened, so its
   entries are unknown; the arrow is rendered inert until passive evidence exists.
6. Write-dependent states, permission errors and preview-type conflicts retain
   the explicit owners and open questions in `documents-write-flows.md`.

These are recorded evidence limits, not claims that those capabilities are
absent. No further reference write is authorized. During the overnight MEP-539
priority window, no Documents capture may run.

## Proposed parity-checklist entries

Proposals only; `docs/parity-checklist.md` is unchanged and no module gate is
marked complete by this slice.

- Documents metadata availability and explicit missing field/layout exports.
- Main-screen folder pane, breadcrumb, populated listing and 64-control inventory.
- Existing-folder link and verified existing empty-folder presentation (MEP-928).
- Existing-file detail/preview and utility-strip behaviour (pending research).
- Documented file/folder write flows, permissions and unobservable state gaps
  (`documents-write-flows.md`; unresolved questions remain explicit).
