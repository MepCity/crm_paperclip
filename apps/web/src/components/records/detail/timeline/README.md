# Record detail timeline (presentation)

Timeline tab History slice: white surface, subtabs, filter panel, and event track. Data and labels
arrive through props only; no record page wiring or timeline API calls in this folder.

## Accessibility

- **Selector names.** Each History filter selector is named by its visible field label followed by
  the value it holds: `Modules All Modules` before a choice, `Modules Notes` after one. The label and
  the value both stay readable, so a screen-reader user hears which field a value belongs to.
- **Modal option lists.** While a selector's option list is open it is modal: the trigger leaves the
  accessibility tree until the list closes. Tests read a selector name with the list closed.

## Interim

- **Empty History:** No event track is rendered when `events` is empty. The reference capture set did
  not include an empty History state.
- **Same-day events:** A 1 px connector runs between consecutive icons on the same day and their
  icons sit 25 px apart. That pitch comes from the row box
  (`--size-detail-timeline-event-row-padding-bottom`, 18 px: 7 px body offset + 36 px icon + 18 px =
  61 px), not from a measured reference row — the capture holds one event per day. Both the 25 px
  same-day pitch and the 18 px row bottom are Interim and carry `Interim` in
  `apps/web/src/components/ui/README.md` › Token sources.
- **Day groups:** The space between day groups (`--size-detail-timeline-day-gap`) is unmeasured for
  the same reason.

## Delivered geometry (UI Lead approval measurements on MEP-143)

CSS px, measured from the white surface's top-left corner at the 1470 × 835 gallery viewport. Every
value here is inside the ±1 px threshold the UI Lead accepted; MEP-184 changed no geometry.

| Element | Reference / target | Delivered | Difference |
| --- | --- | --- | --- |
| Expanded History filter panel | 856 × 156 | 854 × 157 | 1 px inside on each side (the panel shares the 26 px heading inset, the spec measures the panel at 25 px); +1 px high |
| Gap below row-2 controls to the panel's outer bottom edge | 16 | 17 | +1 px: `--size-detail-timeline-filter-panel-padding-bottom` is the inner padding, and the panel's 1 px border adds the extra pixel |
| Apply Filter width | 103 | 103.1875 | +0.1875 px: 14 px inline padding plus the label's sub-pixel advance width |
| Selector caret | 9 × 5 | 8 × 5 | −1 px wide: the CSS triangle is two 4.5 px side borders, each rounded down |

## Deviations (parity checklist module: record detail timeline)

- `Interactions` subtab
- `Show Upcoming Automated Actions` link
- Time filter options `Custom Range` and `Specific date` (no observed inputs)
