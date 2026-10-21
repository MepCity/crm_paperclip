# Calendar foundations

Presentational components only; no routes, data loading, preferences or mutations.
Import each component directly from its file. All actions call the supplied
callbacks; the screen owns navigation and editing.

## Input contract

- `date` is `YYYY-MM-DD`. `start`, exclusive `end` and optional `now` are local
  wall times in `YYYY-MM-DDTHH:mm`, without seconds or offsets. The caller
  converts stored timestamps before passing them. No timezone conversion occurs.
- IDs must be unique. Invalid date/time syntax throws `RangeError`; non-positive
  event durations are omitted. All-day events use the same exclusive-end
  interval convention and appear on each intersecting date.
- `weekStartsOn`: Sunday 0 through Saturday 6. The month always has 42 cells.
- Layout returns clipped minutes, overlap group, zero-based column index,
  column count and fractional width. Adjacent endpoints do not overlap. Each
  connected overlap group uses its peak concurrent column count throughout.
- `onEventClick` receives the original event. `onSlotClick` receives a wall
  time (month creation uses midnight). `onDayClick` receives a calendar date;
  the month overflow counter invokes the same callback.
- `now` is controlled by the caller. No clock or interval is started here.
- Event buttons use the existing Button primitive, with Enter/Space activation
  and focus rings. Grid cells expose date/time labels; Tab reaches controls.

## Adaptation after R4

The consuming screen must apply the approved research before claiming parity:

1. Default view, initial date, week start, user preferences, visible date range,
   navigation controls, locale-specific date/time labels and working hours.
2. Measured column widths, row heights, borders, typography, event colours,
   event content, all-day density, scrolling and responsive behaviour.
3. Month event limit, exact overflow text and overflow destination or popover;
   whether adjacent-month dates navigate or remain in the current view.
4. Selection, event detail, creation form, loading/error/empty messaging and
   any permissions. Bind callbacks to those flows using the screen's contract.
5. Adapt Events data into local wall times; expand recurrence upstream, supply
   all-day boundaries and update `now` according to the screen's clock policy.
6. Research-backed drag/resize, keyboard shortcuts or selection interactions,
   if required. The foundation supplies buttons rather than those behaviours.

Existing design tokens are reused; no reference assets or reference session
were accessed. Layout geometry uses computed percentages; static sizes use
existing spacing utilities. Token changes belong to a separately scoped issue.

## Verification

`calendar-date.test.ts`, `layout-timed-events.test.ts` and
`calendar-grids.test.tsx` cover date arithmetic, DST weeks, six-week months,
collision groups, clipping, keyboard event activation and callback payloads,
all-day boundaries, optional current time, overflow and empty-day controls.
Browser geometry and reference parity are part of the later screen integration.
