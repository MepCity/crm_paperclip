# Notes card and record note flow

## Purpose and research status

Record notes belong to a parent record in Leads, Contacts, Accounts or Deals.
This document covers their Overview card and their representation in Timeline.
Module 6 uses the Module 2+ control-inventory rule: no measurement table or
network-contract reconstruction.

**Status: research complete for UI Lead review; observation limits listed below.**
The four parent modules now have visually reconciled open empty composers.
Accounts additionally establishes populated/long-note state, the expanded
formatting toolbar, hover-only row edit/delete controls and visible note-bearing
Timeline history. No content command
or write action was exercised. Historical script-loading and intermittent CDP
failures are access incidents, not Notes product empty/error states. Longer
per-step waits allowed subsequent Contacts, Accounts, Deals and Leads captures
to finish. The occupied-profile failure is preserved in the capture log below.

## Layout

The record header sits above Overview / Timeline. A related-list rail includes
Notes and a separate count badge when populated. The Notes card belongs to the
Overview content, separate from Attachments, Connected Records and the Open /
Closed Activities cards. The card has a Notes heading, a sorting dropdown at the
right, a list of notes and an Add a note field below that list.

Accounts evidence shows two entries with avatar, body, parent module and linked
parent record, an Add Note metadata label, date and author. Rich body paragraphs
and inline links remain visible; long content ends in an ellipsis and Show More.
The Add Note label in each entry's metadata must not be treated as a confirmed
reply action: its interaction was not observed.

Leads and Deals screenshots show an empty list followed directly by Add a note;
there is no separate empty-message copy. The older Contacts screenshot hides Notes above the viewport;
`m6-notes-contacts-composer-ready` now visually confirms its empty card and open
composer. The older screenshot alone is not visual proof of that card.

## Control inventory

Numbers identify controls or explicitly non-interactive indicators. Behaviour
not exercised is marked unresolved. Shell controls belong to the app shell;
record controls belong to their parent module. Notes-specific controls belong
to Module 6. Hidden dialog placeholders and zero-sized elements are excluded.

### Shared frame in the Overview evidence

Source: screenshots and available controls in `m3c-card-notes` and
`m4c-card-notes`; Leads differences from `detail-notes-card`.

1. Top left application / workspace selector: opens shell navigation; untested.
2. Beside the application identity, sidebar control: changes shell visibility;
   not clicked because a persisted preference is possible.
3. Left global rail, Home: navigation, shell owner.
4. Left global rail, Workqueue: navigation, shell owner.
5. Left global rail, Reports: navigation, reporting owner.
6. Left global rail, Analytics: navigation, reporting owner.
7. Left global rail, Agents: navigation, shell owner.
8. Left global rail, MCP Server: navigation, shell owner.
9. Left rail teamspace selector: shell workspace selector; untested.
10. Beside teamspace, overflow: shell menu; untested.
11. Left rail Search: module-navigation search, shell owner; not filled.
12. Sales group disclosure: navigation grouping; not toggled.
13. Leads module link: navigates to Leads list.
14. Contacts module link: navigates to Contacts list.
15. Accounts module link: navigates to Accounts list.
16. Deals module link: navigates to Deals list.
17. Documents module link: navigates to Documents list.
18. Campaigns module link: navigates to Campaigns list.
19. Activities group disclosure: navigation grouping; not toggled.
20. Tasks module link: navigates to Tasks list, Module 5.
21. Meetings module link: navigates to Meetings list, Module 5.
22. Calls module link: navigates to Calls list, Module 5.
23. Lower rail Integrations disclosure: shell grouping; not toggled.
24. Lower rail Visits link: module navigation.
25. Lower rail Price Books link where visible: module navigation.
26. Top global Search records: record search, shell owner; not filled.
27. Top plus icon: global creation launcher; not clicked.
28. Top assistant icon: shell utility; not clicked.
29. Top notification bell: notification utility; not clicked.
30. Top calendar icon: calendar utility; not clicked.
31. Top marketplace icon: shell utility; not clicked.
32. Top settings gear: settings navigation; not clicked.
33. Top profile avatar: user menu; not clicked.
34. Top application grid: application launcher; not clicked.
35. Record header back arrow: return navigation, parent module.
36. Header Add Tags: record tag action; forbidden to change tags.
37. Header Send Email: record email action; not clicked.
38. Header Edit: parent record editing; not clicked.
39. Header overflow: parent record action menu; not clicked here.
40. Header previous / next arrows: adjacent-record navigation; untested.
41. Leads-only header Convert: conversion flow; not clicked here.
42. Header linked parent account or website, where present: record / external
    navigation; no customer link copied into this spec.
43. Related List header icon: related-list configuration; not clicked.
44. Beside Overview, panel visibility icon: preference-sensitive; not clicked.
45. Overview tab: displays record details and related cards, parent module.
46. Timeline tab: displays record history, parent module; existing timeline
    captures establish the selected state.
47. Last Update indicator: read-only record recency, parent module.
48. Related-list rail links below Notes: navigate to the named record sections;
    module-specific sets are owned by existing record-detail specs. Open and
    Closed Activities remain separate from Notes.
49. Rail Add Related List: customization action; not clicked.
50. Rail Add Link where visible: customization action; not clicked.
51. Floating Scroll To Top: page scrolling, parent record shell.
52. Bottom My Pins: shell utility; not clicked.
53. Bottom Chats: shell utility; not clicked.
54. Bottom Contacts: shell messaging utility, not the CRM module; not clicked.
55. Bottom Channels and Threads in older Leads capture only: shell messaging
    utilities; do not assume they exist in every later capture.
56. Bottom Announcements: shell utility; not clicked.
57. Bottom Motivator: shell utility; not clicked.
58. Bottom Sticky Notes: shell utility distinct from record Notes; not clicked.
59. Bottom Activity Reminders: shell activity utility; not clicked.
60. Bottom Recent Items: shell navigation utility; not clicked.
61. Bottom Accessibility: shell utility; not clicked.
62. Bottom Help: shell utility; not clicked.
63. Bottom terminal utility icon: shell utility with unidentified behaviour;
    do not infer its action from shape.

### State A: collapsed empty Notes card — Leads, Contacts, Deals

Sources: `detail-notes-card`, `m2d2-card-notes`, `m4c-card-notes`.
Contacts empty-card visual coverage is supplied by the newer open-composer capture.

64. Related-list rail Notes: opens / targets the Notes section; existing safe
    capture clicks identify `#notesRL` or `#newleft_Notes`.
65. Beside rail Notes, count indicator: absent / blank for captured empty lists;
    populated Accounts displays a count. Not an editable field.
66. Rail Notes Add plus: creator entry point; opening behaviour unresolved.
67. Card top left Notes: non-interactive heading, no card-title count observed.
68. Card top right Recent Last combobox: current ordering label. Options,
    persistence and actual ordering remain unresolved. Do not change selection.
69. Below empty list Add a note textbox: collapsed composer entry point.
    Opening expands the composer; Accounts and Deals open states are captured below.
    Never filled or saved.

No card search, filter button, pagination control or list-level More control
is visible in these captured states. This does not prove their absence with
larger result sets or different permissions.

### State B: populated Notes card — Accounts

Source: `m3c-card-notes`, screenshot reconciled with `controls.json`.
Shared controls 64–69 remain applicable; the rail count shows two entries.

70. Left of each note, avatar: author illustration; no action established.
71. Note body: paragraph / rich-content display, not a confirmed edit trigger.
72. Within rich body, inline hyperlink: link navigation; not clicked.
73. Under long body, Show More with downward indicator: truncated-content
    affordance; expansion and possible persistence not exercised.
74. Note metadata parent-record link: record navigation with module prefix.
75. Note metadata Add Note: visible event / action label; click behaviour
    unresolved, not classified as reply without evidence.
76. Note metadata date and author: read-only attribution.

Idle screenshots show no row actions. `m6-notes-accounts-tools` now confirms
hover-only edit and delete icons (inventory 106–107). No overflow, reply or pin
control is visible in that observed hover state. No list pagination is visible
for the two-entry sample. Show More belongs to one note's content, not list paging.

### State C: Timeline with existing notes — Accounts

Sources: `m3m-detail-timeline` and `m6-notes-accounts-timeline-visible`.
The older screenshot confirms the frame and filter only. The new screenshot
brings both existing note events into the viewport using a text hover scoped
to the Timeline panel; long body, Show More, short body, timestamps and author
attribution now reconcile visually with accessibility/control evidence.
Timeline controls are owned by parent record history unless stated otherwise.

77. Timeline History tab: selected history view.
78. Upcoming Automated Actions button above history: opens automation history;
    outside Notes scope, not clicked.
79. Filter Timeline History button at history heading: opens history filter;
    no filter selection made for this issue.
80. Note added event: displays note body in the chronological history with
    timestamp / author attribution; non-interactive label.
81. Event body Show More: truncated note content affordance, Module 6;
    expansion not observed.

Accounts history interleaves note events, record field changes and call events.
Contacts history evidence includes call and field-change events but no note
example; Deals history evidence shows No logs found. This is a history empty
state, distinct from the Notes card's empty list.

### State D: open empty composer — all four parent modules

Sources: `m6-notes-accounts-open`, `m6-notes-deals-open` and
`m6-notes-leads-open`, `m6-notes-contacts-composer-ready`, screenshots,
accessibility trees and `controls.json`. Contacts, Deals and Leads have no existing notes and
show the same eight composer affordances as populated Accounts. Opened by targeting Notes and clicking the collapsed editor;
no input, formatting command, attachment or save was performed. Shared frame
1–63 and populated card 64–76 remain visible. The composer expands beneath
the notes inside the same card rather than opening a separate modal.

82. Composer top Title textbox: empty optional-title affordance; UI requiredness
    is not established by metadata alone.
83. Below Title, rich body editor: shows What's this note about? while empty;
    editor is represented by `#noteTextarea1` and an iframe in the accessibility
    tree. No text was entered.
84. Body bottom-right resize grip: visible editor affordance; not dragged.
85. Footer left formatting icon (`cxNotesRichTextFormatIcon`): text-formatting
    launcher; opening it reveals controls 91–105 without changing body content.
86. Beside formatting, paperclip (`notesAttachFile`): attachment launcher with
    button role; not activated. File selection and attachment persistence untested.
87. Footer right Cancel: abandonment action; not exercised in this capture.
88. Beside Cancel, Save: visibly disabled while both fields are empty; disabled
    state is also present in the accessibility tree. Never clicked.

The paperclip is visible in the collapsed formatting state. The expanded toolbar
includes Insert Link and occupies that footer area; the paperclip is not visible
in the expanded screenshot. No content tool was activated.

89. Contacts Timeline Interactions tab: beside History, parent-module history
    navigation; visible in `m2d2-detail-timeline`, not selected.
90. Deals Timeline No logs found: non-interactive history empty-state indicator;
    visible in `m4d-detail-timeline`, distinct from an empty Notes card.

### State E: expanded formatting toolbar and hovered existing note

Source: `m6-notes-accounts-tools` screenshot, aria and controls. Clicking only
the formatting launcher revealed this horizontal footer row; hovering the first
existing note revealed its two row icons. Shell 1–63, card 64–76 and composer
82–88 remain applicable. Commands below describe the labelled affordance;
none was exercised, so selected styles, keyboard effects and picker internals
are unresolved. Order is left to right after the formatting launcher.

91. Bold (Cmd+B): bold formatting button.
92. Italics (Cmd+I): italic formatting button.
93. Underline (Cmd+U): underline formatting button.
94. Strikethrough: strike formatting button.
95. Font Color: text-colour picker launcher, not opened.
96. Font Background Color: highlight/background picker launcher, not opened.
97. Bulleted List with dropdown indicator: list formatting, not opened.
98. Numbered List with dropdown indicator: list formatting, not opened.
99. Insert Link: link insertion launcher, not opened.
100. Increase Indent: increase indentation affordance.
101. Decrease Indent: appears faded in the empty editor; no disabled attribute
     is exposed by the captured inventory, so do not assume enabled behaviour.
102. Subscript: lower-script formatting affordance.
103. Superscript: upper-script formatting affordance.
104. Emojis: emoji picker launcher, not opened.
105. Clear Formatting: appears faded in the empty editor; no command exercised.
106. Hovered note top right pencil (`notesEdit`): direct edit affordance, not a
     menu launcher. Never clicked because editing is outside read-only research.
107. Beside pencil, trash (`notesDelete`): direct delete affordance. Never clicked;
     confirmation and result cannot be established without invoking a write flow.

No row overflow menu, reply or pin control is visible in the observed hover
state. The task's menu example does not establish that such a menu exists.
Hover evidence records the actual two direct controls instead. Metadata Add Note
remains an event label, not a confirmed reply action.

108. Timeline short-note event, beneath author attribution, Add Note with down
     indicator: button role and `aria-controls="timelineNotes"` establish an
     event-specific launcher. Not clicked; reply/association semantics remain
     unresolved. This differs from the plain Add Note metadata in the Notes card.

## Fields

Source of truth: research workspace `metadata/modules/Notes/fields.json`.
Metadata limits are not proof of the UI validation message or rich-text limit.

| API field | Type / metadata limit | Role |
| --- | --- | --- |
| Note_Title | text, 120 | Optional title in metadata; visible empty Title input |
| Note_Content | textarea, 65,535 | Body; system mandatory false in metadata |
| Parent_Id | lookup | Mandatory parent-record relation |
| Owner | owner lookup | Note ownership |
| Created_By / Modified_By | owner lookup | Audit attribution |
| Created_Time / Modified_Time | datetime | Audit timestamps |
| id | bigint, 18 | Read-only note identifier |
| Associated_Id__s | bigint, 30 | Additional association; UI semantics pending |

No account, record, profile or customer identifiers are included here.

## Actions, sorting and flows

- Read flow: open a parent record, target Notes through its related-list rail,
  inspect the collapsed card. Existing captures demonstrate this in four modules.
- Creation observation: Accounts Add a note expands an inline empty composer. Do not type,
  format content, attach a file, choose a link, save or reply.
- Row observation flow: hover an existing note using its captured stable
  selector. Direct edit/delete icons appear; no menu launcher is observed.
  Do not click these actions or select any edit/delete confirmation.
- Sorting observation: Recent Last is the captured setting; changing sorting
  may persist a preference, so no selection change is permitted.
- Timeline relationship: record Notes and activity records are separate related
  lists. Existing note creation is represented as a Timeline event; a note is
  not a task, meeting or call. Note edit/delete history semantics remain open.
- Write-only behaviour: success messages, actual validation, edit persistence,
  delete confirmation and post-delete refresh were not tested. No public-source
  behaviour has been asserted in this draft; these remain open questions.

## Empty and error states

The empty Notes card keeps the sorting control and collapsed creator visible.
There is no observed note-specific error, permission-denied, validation or
retry state. Failed script loading in the new captures is research-access
failure, not evidence for the reference CRM's Notes error design.

## Capture refs and safety

- `detail-notes-card`: Leads empty card, screenshot and accessibility tree;
  older evidence lacks controls.json. One blocked related-count POST recorded.
- `m2d2-card-notes`: Contacts empty-list semantic evidence; screenshot omits
  card due to scroll position. Eight blocked requests recorded in prior capture.
- `m3c-card-notes`: Accounts two-entry card with long body; screenshot,
  accessibility tree and control inventory. Fifteen blocked requests recorded.
- `m4c-card-notes`: Deals empty card; screenshot, accessibility tree and
  control inventory. Fifteen blocked requests recorded.
- `m3m-detail-timeline`, `m2d2-detail-timeline`, `m4d-detail-timeline`:
  existing Timeline accessibility evidence. Accounts screenshot reconciles the
  frame and filter, but not note events below its viewport; Contacts screenshot confirms field/call history and Interactions; Deals
  screenshot confirms No logs found. All three older screenshots were reconciled.
- `detail-notes`: list-screen evidence only; not a Notes card capture.
- `w2b-filter-related-notes`, `w2b-filter-related-notes-ops`,
  `w2d-op-notes-without`: Leads list related-note filtering context, outside
  the record Notes card; not evidence of a Notes-card filter.
- `m6-notes-accounts-list`: new failed-render screenshot, no clicks,
  zero blocked requests.
- `m6-notes-accounts-card`: second failed-render screenshot; both intended
  clicks skipped with zero matches, zero blocked requests. No record was opened.

- `m6-notes-accounts-retry`: single read-only retry with a 12-second wait;
  Loading screenshot and accessibility tree, twelve failed frontend GETs,
  three blocked telemetry POSTs, no clicks or skipped clicks. The three
  inventory entries belong to the loading shell, not the Notes product UI.

- `m6-notes-accounts-open`: recovered successful Accounts composer capture;
  three applied clicks (record navigation, Notes target, empty composer), fifteen
  blocked requests. No content was entered or saved.
- `m6-notes-accounts-resume`: successful list-only access verification;
  no clicks, two blocked legacy reminder/notification POSTs.
- `m6-notes-contacts-open`: record navigation succeeded, Notes and composer
  steps skipped with zero matches before the detail finished rendering. Final
  screenshot shows record details, not the Notes card; eight blocked requests.
  It does not resolve the missing Contacts card/composer visual evidence.
- `m6-notes-deals-open`: record navigation and empty composer click succeeded;
  intermediate Notes target skipped with zero matches. The editor click scrolled
  the card into view. Screenshot confirms controls 82–88 and resize affordance;
  nine blocked requests, no note content entered or saved.
- `m6-notes-contacts-composer-ready`: longer-wait retry; all three safe clicks
  succeeded. Visible empty card and open composer reconcile with controls/aria.
  Fifteen blocked requests; no content entered or saved.
- `m6-notes-leads-open`: record, Notes target and empty composer clicks all
  succeeded; screenshot confirms the same open composer on an empty card.
  Eight blocked requests; no content entered or saved.
- `m6-notes-accounts-tools`: record, Notes, empty composer and formatting
  launcher opened; existing note hovered. All five steps succeeded. Screenshot
  and control inventory reconcile toolbar 91–105 and row actions 106–107.
  Nineteen blocked requests; no formatting command or row action selected.
- `m6-notes-accounts-timeline`: record and Timeline navigation succeeded;
  `#timeline` is not itself scrollable, so the scroll step made no change.
  Screenshot confirms history frame, not the note events below the viewport.
  Twelve blocked requests.
- `m6-notes-accounts-timeline-visible`: record and Timeline navigation, then
  note-text hover scoped to `#timeline`, all succeeded. Hover scrolled the existing
  short note into view without clicking it. Screenshot shows both note events,
  long-content Show More and Timeline Add Note; fourteen blocked requests.
- `m6-notes-accounts-timeline-note`: Timeline navigation succeeded; the note
  text hover matched two elements and was skipped. Eleven blocked requests;
  no note interaction occurred. Not visual proof of the off-screen note.
- `m6-notes-accounts-hover`: CDP timeout followed by occupied-profile failure;
  empty output directory, no reference clicks, blocked-request count unknown.
- `m6-notes-accounts-composer`: invalid normalized-route attempt; both clicks
  skipped with zero matches, zero blocked requests; no Notes evidence.

Successful composer captures blocked legacy reminder/notification requests and
telemetry. Contacts and Leads additionally blocked related-count POSTs; Deals
blocked grouped-count and module-settings requests. These denials do not prove
that a write succeeded and may limit unrelated counts or settings availability.
The capture tool's write guard remained active throughout.

All captures remain in the local research workspace. No screenshots or note
values are committed. Prior blocked-request counts do not mean writes succeeded;
only navigation, empty-composer opening and observation steps were applied in
the successful continuations. No note text, formatting command, file selection,
save, edit, delete, reply or preference change was performed. The shared browser
window was not closed.

## Open questions and observation limits

1. Title/body UI requiredness, validation wording, rich-text limits and successful
   save behaviour are not observable without a write. Metadata limits above do
   not substitute for UI validation evidence.
2. Editing, deletion confirmation, persistence, success/error feedback and the
   Timeline effects of edit/delete are not observable without invoking a write
   flow. No such action was performed.
3. Recent Last is observed. Other order options and preference persistence are
   unresolved; no selection was changed. No Notes-card filter was observed.
4. Show More belongs to a truncated note/event. Whether expansion persists is
   unresolved, so it was not clicked.
5. Only a two-entry collection was observed. Larger collections, paging,
   incremental loading, count limits and permission variants remain unobserved;
   no notes were added to manufacture those states.
6. No reply, pin or overflow is visible in the sampled Overview hover state.
   Timeline Add Note is a separate observed launcher; its association/reply
   semantics are unresolved and were not tested. Other note
   permissions or ownership variants may expose additional actions; do not
   infer their existence or universal absence.
7. Attachment and link launchers are identified. File selection, upload,
   attachment/link validation, insertion and persistence were not exercised.
   Picker internals are outside this empty-composer observation.

All four open-composer screenshots, the formatting toolbar and hovered direct
row controls are reconciled against their inventories. Remaining questions are
explicit implementation inputs for lead review, not permission to test writes.
