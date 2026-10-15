# Record board

`RecordBoard` accepts ordered columns, formatted header values, ordered card rows,
an optional toolbar slot, a creation callback, and an asynchronous move callback.
It never calls a record service. Build column labels, probabilities and totals
from service metadata and summaries in the caller, rather than duplicating them
in module definitions.

`onMove(id, fromKey, toKey)` resolves with `"moved"` (or `undefined`) on success
and `"cancelled"` for a dismissed transition dialog. Rejection and cancellation
restore the prior position silently. Same-column drops do nothing. Pending cards
cannot be moved again. Successful moves remain visible until incoming column data
acknowledges their destination; callers should refresh records and aggregates.
Header counts/totals always remain supplied values. Rows and icon links retain
keyboard access. The optional icon link uses the shared `laterModule` behavior.

`ModuleScreenDefinition.list` inherits optional `board(input)` and
`defaultPresentation` from `ModuleListScreenConfig`. The callback receives loaded
records, module metadata, organization slug and owner labels and returns board
props. It must only build presentation data and event handlers. The list keeps
its filter panel, view strip and toolbar. Board presentation hides the table,
pagination and selection bar. The first two toolbar icons select table/board.

Selected saved views already use route navigation. Presentation uses that same
URL/router mechanism (`presentation=table|board`), survives sorting, paging and
saved-view navigation, and adds no browser storage. Modules without `board`
ignore this parameter and retain their original rendering.

Interim rules: empty columns contain no body text; header checkboxes only toggle
themselves; footer arrows have no handler; no additional keyboard move controls
or drag error messages are invented. Loading uses the shared `Skeleton`.

The `/dev/ui` gallery's `record-board` demo uses synthetic data and four columns.
Moves into Needs Analysis succeed; moves into Rejected move reject and roll back.

## Kanban settings dialog

`KanbanSettingsDialog` is controlled by `open` and unmounts its draft when closed.
Its local `KanbanViewInput` matches the service contract in MEP-545; replace the
local type with the service export when integrating. Supply option inventories
and the initial saved field order through props. The caller closes the dialog
after a successful `onSave`; `onCancel` closes it without saving. Demo:
`/dev/ui/kanban-settings`.

Source: `research/specs/deals-kanban-settings.md` on the approved research branch
(MEP-537), and the local `captures/m4k-settings/` reference image. The research
spec is awaiting its separate merge; reference images stay outside the repo.

Interim choices for unobserved interactions: single click or Enter/Space moves a
field, newly selected fields append, Available retains supplied order, search
uses an immediate case-insensitive substring match, and no field reordering or
count limit is invented. Empty search results leave the Available list empty.
Validation copy is local, tooltips explain documented grouping/sum purposes,
and Help is disabled because its destination is unknown. Option lists come only
from the caller; the demo uses observed values. `mode` identifies create/edit;
sharing controls are outside this issue's four-field props/service contract.

QA should compare the reference alongside the demo and check name/required
marker, grouping/info, aggregate/info, header style/required marker, list
headings/search, required Deal Name marker, dimmed overlay, and fixed Cancel/Save
footer. Transfer gestures, errors and tooltip wording remain interim.
