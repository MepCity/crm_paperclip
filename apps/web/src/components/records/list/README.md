# Record list components

## FilterPanel

Presentation-only panel, sourced from `research/specs/list-views.md`: Layout → Visual
layout (Filter panel, Filter content, Surface and line colors, Selected / disabled),
Left filters, Search and Flow 6. No data access or criteria controls.

### Props

| Prop | Contract |
| --- | --- |
| `title` | Visible panel heading and accessible region name. |
| `searchLabel` / `searchPlaceholder` | Accessible input label and visible placeholder, supplied by the caller. |
| `groups` | Ordered `{ id, label, items: { id, label, disabled? }[] }[]`; group IDs and item IDs must each be unique across the panel. |
| `selectedIds` | Controlled selected item IDs. Selection remains intact when searching or collapsing. |
| `onSelectionChange` | Receives the next complete ID array; adds at the end or removes the toggled item, retaining other IDs. Disabled rows never call it. |

Groups start open. Their headings support Enter and Space and expose `aria-expanded`.
Clipped headings retain the complete accessible name and a native title tooltip.
The `/dev/ui` filter-panel demo uses synthetic items, includes a disabled row, and
allows reviewers to demonstrate open/closed groups and filtered results.

### Unverified

- Search currently matches row labels by case-insensitive substring and hides groups
  without matching rows. No term was entered in the reference capture; this is the
  task-authorized provisional behavior. An empty result shows no groups. Clearing
  restores rows and prior group expansion state. No filter is applied to records.
- Operators, values, AND/OR, apply controls, counters and persisted panel preferences
  remain unobserved and are excluded. Checked/disabled checkbox appearance keeps the
  existing primitive behavior; the spec measures only the unchecked box.
- Vertical padding, heading/search/group gaps, search inner padding and chevron size
  are not measured in the spec; existing spacing tokens are used provisionally.

### Deviations

- Typeface uses the current shared font token pending the typography task. Chevron
  drawings are original strokes exported by the shared icon module; no reference assets are copied.
- No measured size, color, weight or horizontal padding differs from the scoped
  Visual layout rows. Page position and full Leads lists belong to the page task.
