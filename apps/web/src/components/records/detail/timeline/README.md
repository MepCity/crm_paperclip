# Record detail timeline (presentation)

Timeline tab History slice: white surface, subtabs, filter panel, and event track. Data and labels arrive through props only; no record page wiring or timeline API calls in this folder.

## Interim

- **Empty History:** No event track is rendered when `events` is empty. The reference capture set did not include an empty History state.
- **Same-day events:** A 1 px connector runs between consecutive icons on the same day; vertical spacing between those icons is 25 px. Spacing between day groups is not fully specified in the reference capture (single observed event per day).

## Deviations (parity checklist module: record detail timeline)

- `Interactions` subtab
- `Show Upcoming Automated Actions` link
- Time filter options `Custom Range` and `Specific date` (no observed inputs)
