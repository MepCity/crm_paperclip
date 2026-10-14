# Notes card and record note flow

## Purpose and research status

Record notes belong to a parent record in Leads, Contacts, Accounts or Deals.
This document covers their Overview card and their representation in Timeline.
Module 6 uses the Module 2+ control-inventory rule: no measurement table or
network-contract reconstruction.

**Status: research resumed; composer/menu cross-module evidence in progress.**
Existing screenshots and control inventories establish the collapsed card,
existing notes and the Accounts open composer. Earlier script-loading and shared
browser connection failures were research-access problems, not Notes product
errors. The capture connection timeout was increased in the local research tool;
`m6-notes-accounts-resume` now renders the Accounts list successfully.
A previously completed capture, `m6-notes-accounts-open`, was recovered after
the interrupted run and reconciled visually with its accessibility tree and
control inventory. No note was entered or saved.
A retry using a normalized record path (`m6-notes-accounts-composer`) showed
an invalid-route page; both requested controls matched zero elements and were
skipped. It supplies no Notes UI evidence.

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
there is no separate empty-message copy. Contacts has an empty Notes list in
its accessibility tree, but its screenshot scroll position hides the card above
the viewport. Do not treat that screenshot as visual proof of the Contacts card.

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
Contacts visual coverage limitation is recorded above.

64. Related-list rail Notes: opens / targets the Notes section; existing safe
    capture clicks identify `#notesRL` or `#newleft_Notes`.
65. Beside rail Notes, count indicator: absent / blank for captured empty lists;
    populated Accounts displays a count. Not an editable field.
66. Rail Notes Add plus: creator entry point; opening behaviour unresolved.
67. Card top left Notes: non-interactive heading, no card-title count observed.
68. Card top right Recent Last combobox: current ordering label. Options,
    persistence and actual ordering remain unresolved. Do not change selection.
69. Below empty list Add a note textbox: collapsed composer entry point.
    Opening expands the composer; Accounts open state is captured below.
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

No row edit, delete, reply or overflow control is visible in the idle screenshot
or available control inventory. Hover-only controls are unresolved; the updated
local capture tool supports named/stable hover steps and a new observation is
in progress. Do not manufacture an
ellipsis action menu from an assumed pattern. No list pagination is visible for
the two-entry sample. Show More belongs to one note's content, not list paging.

### State C: Timeline with existing notes — Accounts

Source: `m3m-detail-timeline` accessibility tree and screenshot. The screenshot
confirms the Timeline frame, History selection and filter control, but shows
call and field-change events only; note events are outside its viewport.
The note-event body and its Show More remain semantic evidence, not visual proof.
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

### State D: open empty composer — Accounts

Source: `m6-notes-accounts-open`, screenshot, accessibility tree and
`controls.json`. Opened by targeting Notes and clicking the collapsed editor;
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
    launcher; expanded toolbar and its individual commands pending observation.
86. Beside formatting, paperclip (`notesAttachFile`): attachment launcher with
    button role; not activated. File selection and attachment persistence untested.
87. Footer right Cancel: abandonment action; not exercised in this capture.
88. Beside Cancel, Save: visibly disabled while both fields are empty; disabled
    state is also present in the accessibility tree. Never clicked.

No separate link icon is visible in this collapsed formatting state. Do not infer
that link insertion is absent from the expanded toolbar.

### State E: note row actions

Hover and menu observation in progress. Do not infer row actions from other
modules or classify the metadata Add Note label as a reply control.

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
- Menu observation flow pending: identify an existing note's uniquely named or
  stable captured control; inspect attributes and screenshot first; open only
  if it is clearly a menu launcher. Select no menu item.
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
  frame and filter, but not note events below its viewport; the other Timeline
  screenshots still need reconciliation.
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
- `m6-notes-accounts-composer`: invalid normalized-route attempt; both clicks
  skipped with zero matches, zero blocked requests; no Notes evidence.

All captures remain in the local research workspace. No screenshots or note
values are committed. Prior blocked-request counts do not mean writes succeeded;
all three new attempts applied no clicks. The shared browser window was not closed.

## Open questions and completion checklist

1. Research access recovered: successful list acquisition and recovered Accounts
   composer evidence are available. Complete the remaining captures below.
2. Accounts open composer is captured. Capture the remaining parent modules
   and the expanded formatting toolbar; reconcile every input,
   tool and Save / Cancel control against screenshot and controls.json.
3. Identify row menu or hover-only actions without positional selectors or
   unsafe clicks; capture the menu and select nothing.
4. Capture Contacts Notes with the card actually in the viewport.
5. Reconcile Timeline screenshots with controls.json; obtain note-bearing
   examples in other modules if existing records expose them safely.
6. Determine Recent Last options and persistence without changing a preference.
7. Determine whether Show More expansion persists; do not click until established.
8. Find a naturally existing large note collection to observe list paging,
   incremental loading and counts; never add notes to create this state.
9. Confirm title/body UI requiredness, rich-text limits, permission-dependent
   actions and write outcomes through public primary documentation or record as
   not observable without a write. Saving, editing and deleting remain forbidden.
10. Confirm note attachment/link handling and whether replies or pinning exist;
    neither is established by current evidence.

Approval must wait for the missing read-only captures; this draft does not
satisfy the complete issue acceptance criteria yet.
