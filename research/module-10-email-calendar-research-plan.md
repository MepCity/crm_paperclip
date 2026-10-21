# Module 10 (email inbox and calendar) — read-only research plan

- Status: Approved by the board 2026-10-21 (MEP-990); issues opened by the CTO
  on MEP-1004 after the Module 8 gate, in the chain order of section 4
- Audience: CRM Analyst (executes), UI Lead (approves), CEO (opens and orders the issues)
- Pattern: MEP-345 (Deals) and MEP-422 (Activities) research batches, with the
  Module 2+ parity rule (screenshots and behaviour, no measurement tables)
- Companion files: `module-10-write-only-flows.md`, `module-10-night-test-protocol-draft.md`,
  `docs/adr/0009-real-email-and-calendar.md`

## 1. Scope, decisions and start condition

| Item | Rule |
| --- | --- |
| Board decision 2026-10-21 | Module 10 must really send and receive email and support calendar; it is not UI-only. The board will use the CRM in real work after phase 1. |
| Notify Email | `CSV-09` (import upload step, completion notification option) was deferred from Module 6 and belongs to Module 10. Its UI is out of reach read-only; see the write-only file. |
| Reference CRM | Strictly read-only (AGENTS.md rule 2). Nothing in this plan writes, not even to undo. Anything that needs a write goes to `module-10-write-only-flows.md`. |
| Start condition | Research starts only after the Module 8 gate. Until then this plan is only reviewed. |
| Browser | Nobody opens a new session or login in the shared browser (each login notifies the board's phone) and nobody closes the window. The capture tool uses its own tab only. |
| Order | One research issue at a time, in the order of section 4, each a short run. |

Metadata already known (structure only, from the local research metadata root):

- Modules present in the export: `Events` (meetings; fields include title, venue,
  start/end, all-day, recurrence rule, reminders, participants, meeting
  provider/venue picklists; related lists Notes, Attachments, Invitees,
  CheckLists), `Emails` (related list on Leads and Contacts, no field export),
  `Email_Drafts__s` (related list on Leads and Contacts, no field export),
  `Email_Template__s`, `CalendarBookings__s`, `Email_Sentiment`,
  `Email_Analytics` (per-user daily counters: sent, bounced, tracked, opened,
  clicked, replied, received), `Email_Template_Analytics`,
  `Qualify_Leads_through_Email`.
- `Emails`, `Email_Drafts__s`, `Email_Template__s` and `CalendarBookings__s` have
  no `modules/<name>/` folder: their field model is not in the export. The
  metadata-review issue (4.8) records this gap and does not guess fields.
- `workflow_rules.json` holds an API-not-supported error object and
  `assignment_rules.json` holds `null`: rules that fire on email/calendar
  records cannot be listed from metadata. This matters for the night-test
  protocol and is an open question for the board.

## 2. Rules that apply to every issue in the batch

The generator text for the issues copies rules 1 to 12 of MEP-427 (paint gate
variant) and substitutes names. The Module 10 additions are marked (new).

1. **Read-only.** The only tool is `~/Desktop/mepcity-research/tools/capture/capture.mjs`.
   No other way of looking. Section 3 lists what is never clicked.
2. **Base capture first, click-free.** Every screen/area starts with one
   click-free base capture (slug `m10<area>-<screen>-base`). The base defines
   the control list, the selectors and the request baseline of the issue.
3. **Control inventory.** Numbered rows for every visible control, including
   shell and utility strip, with position, observed behaviour, source
   (`seen (<slug>)`, `documented`, `not observed`) and owning module. Screenshot
   inspection plus `controls.json` reconciliation establishes completeness.
   Screenshots live under `captures/<slug>/`; none are copied into the repo.
4. **Delta inventory** (new, per MEP-22/23 practice): the spec lists a full
   table only for the base capture; later captures are delta tables with a
   `Contacts ref` column (`new` for controls that exist only in this module).
   Shell rows are not repeated. Skipped as shared: sort dialog, column menu,
   timeline filter, owner picker, country/state catalogs.
5. **No measurement tables.** No pixel sizes, typography, colours or request
   shapes in specs. Screenshots plus behaviour only. (A one-off visual
   correction issue may be opened later by the UI Lead; not part of this batch.)
6. **Expected non-GET call set, by path and count, stated in each issue.**
   Counted from earlier module captures: blocked reminder and notification
   polls and client telemetry in nearly every capture; one shell
   visitor-trigger POST per page; a list load = `<Module>/bulk`,
   `<Module>/actions/count` and an analytics run; a detail load adds an
   entity-customization POST, a second `<Module>/bulk` and a blocked
   related-records count. Detail-load `bulk` count is module-specific (Accounts
   had 3): the first detail capture sets the count, do not copy a number from
   the previous module. For Module 10 the analyst records, in the base capture,
   the path and count of every non-GET request, including any mail-service
   host calls, and later captures are compared against it.
7. **Stop rule.** Any non-GET path not in the base set, or any count above the
   base, ends the issue: first comment line `DUR —`, mention the CEO, status
   `blocked`, no attempt to revert or retry, spec still written from what was
   captured. A blocked write the tool refused (listed in `meta.json`
   `blockedRequests`) is reported, not retried.
8. **Named selectors only.** `role=button[name="..."]`, `text=...` or another
   named form that matches exactly one element in the base `controls.json`.
   No positional selectors (`nth`, `:nth-child`, index, coordinates). Unnamed
   icon buttons and unnamed top-bar menus are therefore never clicked; they
   are recorded as `not observed`. Test every selector offline against the base
   `controls.json` and the screenshot before writing it into a click list.
9. **Dangerous-text guard.** Check every click label against the tool's
   `DANGEROUS_TEXT` list before writing the click list; a label that matches
   is dropped from the list and recorded as `not clicked (guard)`.
10. **Paint gate** (replaces any load threshold). The base capture is the
    probe: module title present, `apiCalls` at least half of the earlier
    comparable base capture, at least one record/message link when the screen
    has data. Check `meta.json` `diagnostics` (`pageerror`, `requestfailed GET
    ... .js` means not painted) and `controls.json` (under 50 items means not
    painted). One retry after 5 minutes with `--wait 25000`; load is only
    logged. Never hand a skeleton to QA, and never answer a non-paint with a
    longer wait alone.
11. **Wait.** Every capture uses `--wait 25000`.
12. **Tool failure rule** (new wording of MEP-107 rule). If the tool leaves an
    empty slug folder, writes no `meta.json`, leaks a tab, or reports
    "profile in use" (also after a 3 s connect timeout): stop, report the exact
    message and slug, do not retry in a loop, do not touch the browser. One
    repeat of the identical command is allowed only when the first printed no
    error and wrote no folder.
13. **Single-click accounting.** A click absent from `skippedClicks` is spent
    and is never repeated; a tool error on a click capture counts as unknown
    and is not repeated.
14. **No customer data in the repo.** Message subjects, addresses, bodies,
    names and attachment names are described by structure ("subject text",
    "sender address") never copied. Real mailbox content may appear in
    captures; the analyst describes shape only.
15. **Chained parts merge the previous branch.** Start by merging
    `mep/MEP-<prev>` if its spec is not on `main` (avoids add/add spec
    conflicts found on MEP-837).
16. **Spec location and wording.** Specs go to `research/specs/` in neutral
    language; the vendor name never appears (say "reference CRM"). Sub-app
    names are described functionally ("mail area", "calendar area").
17. **One issue at a time, short runs.** The next issue starts only after the
    previous one is approved. Each run captures at most the screens named in
    its own issue; leftovers become a correction issue with exact text.

## 3. Never click (treated as writes)

Rule 2 of AGENTS.md covers these even when they look like navigation. Anything
not on the allowed list in 3.2 is also not clicked.

### 3.1 Never click

| Group | Examples |
| --- | --- |
| Opening an unread message | Opening an unread email can mark it read, which is a change. Only already-read items are opened, and only if the base capture shows the read state unambiguously; otherwise only list-level views are captured. |
| Message actions | Send, Reply, Reply All, Forward, Compose, New Email, Save as Draft, Discard, Schedule Send, Send Later, Snooze, Undo Send |
| Message state | Star, flag, important, archive, move, label, folder move, spam, delete, mark read or unread, select-all checkbox that arms a bulk bar |
| Mailbox | Connect, disconnect, reconfigure, add account, change password, re-authorize, OAuth consent, sync, refresh, fetch mail, "check now", test connection, send test mail |
| Templates | Create, save, edit, clone, delete, preview-with-send, insert merge field in an editor that opens a compose surface |
| Calendar | Create event, double-click or click on an empty slot, drag, resize, delete, edit, RSVP (accept, decline, tentative, maybe), join meeting, add invitee, share calendar, subscribe, import or export calendar, availability sharing |
| Preferences | Any change of view type (day/week/month/agenda), layout, column, density, reading pane, grouping, theme, pin, show/hide panel, collapse/expand, default calendar, working hours, time zone; these persist a preference |
| Menus | Unnamed top-bar menus and icon buttons (positional selectors are forbidden); the user profile menu; anything that opens a settings editor in edit mode |
| Tool guard | Every label in the capture tool's `DANGEROUS_TEXT` list, and any control whose accessible name is empty |
| Search | Typing into any search or filter field (the tool only clicks; no typing is planned) |

### 3.2 Can be captured with no change

- Click-free base captures by direct navigation: mail inbox/list views, folder
  list views as a page load, calendar page in its default view, calendar
  settings pages, email settings pages, templates list, record-detail pages
  with the Emails and Drafts related lists in view, the timeline.
- Named, non-persisting navigation clicks that do not select state: opening a
  settings page from a named link, switching between named settings tabs, a
  named "View all" link, a named record link. Each is listed in the issue's
  click list and tested offline first. A click that might persist a preference
  is moved to the board-question list instead.
- Public documentation reading (separate "documented" source rows).
- Local metadata export (modules, fields, layouts, related lists, custom views).

## 4. Research issues

All issues: assignee CRM Analyst, review stage QA then UI Lead approval,
`isolated_workspace`, no parent (so no inherited worktree), Tier: low unless the
issue edits `docs/parity-checklist.md` in shared sections. Chain order is the
order below; each is `blockedBy` the previous one (UUIDs, not identifiers).

| # | Issue (working title) | Area | Output |
| --- | --- | --- | --- |
| 4.1 | M10-R1 Mail area: inbox and list views (base only) | mail list screen | `research/specs/email-inbox.md` |
| 4.2 | M10-R2 Mail area: message and thread view, read-only | detail of already-read items | `research/specs/email-message.md` |
| 4.3 | M10-R3 Record detail: Emails and Drafts related lists, timeline | Leads/Contacts/Accounts/Deals detail | `research/specs/email-record-detail.md` |
| 4.4 | M10-R4 Calendar views: day, week, month | calendar screen default view only | `research/specs/calendar.md` |
| 4.5 | M10-R5 Email and mailbox settings (read-only pages) | settings area | `research/specs/email-settings.md` |
| 4.6 | M10-R6 Calendar settings and booking pages (read-only) | settings area | `research/specs/calendar-settings.md` |
| 4.7 | M10-R7 Email templates list | templates list only | `research/specs/email-templates.md` |
| 4.8 | M10-R8 Metadata review and gap table | metadata only, no capture | `research/specs/email-calendar-metadata.md` |
| 4.9 | M10-R9 Public documentation pass for write-only flows | documentation | `research/module-10-write-only-flows.md` update |
| 4.10 | M10-R10 Rule, assignment and notification check (read-only) | settings area | `research/specs/email-calendar-rule-check.md` |

Chain order (board decision 2026-10-21, one research issue at a time): R1, R2,
R3, R4, R5, R6, R10, R7, R8, R9. R10 was added by the board decision on
MEP-990: it is the read-only rule check that must exist before any write test.

### 4.1 M10-R1 Inbox and list views

- Delta inventory: new module; compare against `Contacts ref` (list toolbar,
  view strip, filter panel, pagination) and mark mail-only controls `new`:
  folder pane, account switcher, message rows, unread marker, bulk bar,
  compose entry point, search box.
- Captures: `m10r1-mail-inbox-base` (default folder as the app opens), and
  one base per distinct list-level view the shell exposes by direct navigation
  (sent, drafts, scheduled, tracked, if reachable without a click on an
  unnamed control). No row is opened. Unread rows are never opened.
- Expected non-GET set: shell set from section 2 rule 6 plus the mail list
  load; the analyst fixes path and count in the base capture and the stop
  rule compares later captures against it. A mailbox sync call appearing on
  its own (not as page load) is a stop.
- Open questions to record: empty-state when no mailbox is connected; whether
  list load triggers a sync (record the call path only).

### 4.2 M10-R2 Message and thread view

- Only if R1 shows an already-read message with an unambiguous read marker;
  otherwise this issue becomes documentation-only and the CEO closes it with
  the gap recorded. Opening is by named record link, one message per capture,
  never by index.
- Delta against R1: header strip, subject, sender/recipient chips, thread
  stack, attachment chips, action row (reply/forward controls are drawn and
  recorded as `not clicked`), side panel with linked records.
- Stop rule additionally: a read-receipt or tracking-pixel call, or any POST
  not in the base, ends the issue.

### 4.3 M10-R3 Record detail: Emails related list and timeline

- Base: one Lead and one Contact detail, plus Account and Deal if the
  related list is present. Reuse the existing record-detail specs; only the
  Emails card, the Drafts card, Send Email entry points, and email rows in the
  timeline are new. Delta table against `Contacts ref`.
- The record is chosen by the board-written `address.txt` (record addresses
  come only from it; record ids are hidden by the tool).
- Click list: named related-list headers only if they expand without
  persisting; otherwise click-free.
- Expected non-GET set: the detail set of the module from the first capture;
  related-list reads for Emails/Drafts are GET-shaped `bulk` calls and the
  analyst records their count in the base.

### 4.4 M10-R4 Calendar views

- Base: calendar page in the default view as it opens. Day/week/month are
  switched only by named controls that the analyst can prove do not persist;
  because view type may persist a preference (rule: panel and view type are
  persisted), the default is: capture only the default view, and cover the
  other two from public documentation plus a board question. The issue
  records the board's answer as a card on its own waiting issue (not the
  umbrella).
- Delta inventory: toolbar, date navigator (named previous/next/today only if
  they do not persist; otherwise not clicked), mini-calendar, calendars list,
  event chips (shape only), all-day row, time grid, current-time marker.
- Events shown are described by shape (title, time span, colour category);
  never copied.
- Expected non-GET set: shell set plus calendar load (event range reads are
  GET or POST read-shaped; the analyst records which).

### 4.5 M10-R5 Email and mailbox settings

- Base captures of each settings page reachable by direct navigation or by a
  named settings link: connected mailbox list, signatures, tracking options,
  inbound/outbound rules, forwarding, disclaimers, limits, unsubscribe,
  deliverability notes.
- Every field and toggle is recorded `not clicked`; page text describes
  options (structure only, no credentials, no addresses).
- Expected non-GET set: settings page load only; any POST tied to a toggle
  is a stop (it means something was clicked).

### 4.6 M10-R6 Calendar settings and booking pages

- Same approach as 4.5 for calendar sync options, working hours, default
  reminders, booking pages, and meeting provider options (the metadata has
  provider and venue picklists on meetings).
- Booking pages (`CalendarBookings__s`): list only; a public booking page is
  never opened (it can create a booking).

### 4.7 M10-R7 Email templates list

- Base capture of the templates list and its filter/folder structure. No
  template is opened in an editor (editor open can create a draft). Preview
  only if a named, non-editing link exists and the analyst proves it opens no
  editor from the base `controls.json`.
- Compare against the templates analytics module in metadata (R8).

### 4.8 M10-R8 Metadata review and gap table

- Inputs: `modules.json`, `modules/Events`, `modules/Email_Analytics`, related
  list definitions on Leads/Contacts/Accounts/Deals/Cases, the custom view
  files, `profiles.json` and `roles.json` (field and module-level read/write
  flags), `workflow_rules.json` and `assignment_rules.json` status.
- Output table: module, in export yes/no, creatable/API flags, fields (names,
  data types, lengths, mandatory/unique flags), related lists, picklists,
  and a gap column ("no field export", "rules not exportable"). Structure
  only, no values.
- Explicitly list which Module 10 data model decisions are blocked by gaps
  (message storage, thread model, draft model, template merge fields,
  booking model).

### 4.9 M10-R9 Public documentation pass

- Fills the "is public documentation enough" column of the write-only file:
  source rows with locator (path only, no vendor hostname), date checked,
  and the limit of what each source proves. Where two guides disagree
  (as in ADR 0005 P1/P2) both are listed and neither is chosen.

### 4.10 M10-R10 Rule, assignment and notification check

- Board decision 2026-10-21 (MEP-990): before any write test, a read-only
  check of everything that could send a message or notice to a person
  registered in the reference CRM. This issue is that check.
- Base captures, by direct navigation or named settings links only: workflow
  rules list (every module, with Emails, Events, Leads, Contacts, Accounts,
  Deals and Cases first), assignment rules list, notification settings
  (record owner notices, mention and follower notices, reminder mail),
  email-alert and scheduled-action lists, approval processes, and any
  auto-response or auto-reply rule list.
- No rule is opened in an editor; a rule detail page is captured only if a
  named link opens it read-only (proved from the base `controls.json`).
- Output table: rule or setting, module, trigger (create, edit, field
  update, date), action type (email alert, notice, task, field update,
  webhook), recipients by role only (owner, team, follower, named user =
  "named user", never the name or address), active yes/no, and a column
  "could fire on a test write (yes/no/unknown)". Unknown counts as yes.
- The result feeds section 4.2 of `module-10-night-test-protocol-draft.md`;
  any "yes" row stops the matching action and goes to the board.
- Approval: CTO (it feeds ADR 0009 Topic 8).

## 5. Deliverables checklist for each issue

- Spec file in `research/specs/` with base control inventory, delta tables,
  `not clicked` list and open questions.
- Capture slugs listed in "Capture refs"; `meta.json` shows no unexpected
  non-GET path.
- Click list attached to the issue with offline selector test result and
  `DANGEROUS_TEXT` check result.
- `docs/parity-checklist.md` updated only by the closing QA of the module
  implementation batch, not by research issues.

## 6. Routing and approval

| Stage | Who |
| --- | --- |
| Research issue | CRM Analyst |
| QA | QA reviewer on a different model family than the analyst |
| Final approval | UI Lead (screen specs). CTO only for the ADR 0009 questions the research raises. |
| Board | Opens the Module 10 gate after Module 8; decides on any write need (see the write-only file and night-test draft); only the board can change AGENTS.md rule 2 |
| Order | After the Module 8 gate; research of the next module may run in parallel with the current module's implementation when analyst capacity is idle (board decision 2026-10-12) |

If the analyst finds that a screen can only be studied by a write, the issue
stops at that point, records the flow in the write-only file, and the CEO asks
the board (no workaround, no "just once").
