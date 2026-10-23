# Native Events calendar

R4 approved research: MEP-1013, `research/specs/calendar.md` at commit
`1eaa644d`. Capture refs: `m10r4-calendar-base` and
`m10r4-calendar-retry-base`. Day layout follows C-013–C-024, C-065,
C-072–C-079 and C-094–C-095. Uses the shared calendar foundations.

The browser reads Events through the existing RecordService port and its HTTP
adapter; the fixture implementation remains the storage authority. Every page
is loaded before projecting the visible range. Calendar selection and view/date
state are transient. No schema, preference writes or external provider is added.
Existing meeting creation and detail routes own their respective flows.

Evidence limits / open questions:

- Week/Month arrangement, tile appearance, overflow, week start and permissions
  were not live exercised. Monday matches the observed mini-calendar; the
  shared grid supplies documented week/month capabilities. No reference
  preference is inferred or changed.
- Today is required by MEP-1062 but was not painted in the R4 capture.
- The existing Events bulk-read contract is reused. The observed calendar GET
  endpoint has no captured payload contract, so a new wire shape is not invented.
- Overdue task summaries, unexplained hatching, Options, invitation delivery,
  recurrence expansion and external calendar settings are outside this slice.
- All-day values follow the existing meeting form's inclusive stored end day;
  conversion to the grid's exclusive end happens in the calendar model.
