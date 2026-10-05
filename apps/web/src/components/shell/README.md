# Organization shell

The organization layout authorizes membership and reads the user and organization
list on the server. It passes only display data to `AppShell`.

Each page (including loading and error fallbacks) renders exactly one
`<PageTitle title="Settings" />`. It registers the toolbar `h1` and updates the
browser title on hydration and client navigation. Pages remain server components;
the marker alone is a client component. Do not duplicate the title in content.

For our settings screens, add `<PageHeader description="…" actions={…} />` above
the content. Both slots are optional. Module screens follow their own toolbar spec.
The shell applies no main-content inset; a page owns its panels and padding.

Add fixed links or sections/groups only in `nav.ts`. Each link defines its icon,
label, URL function, and exact or path-segment-prefix match rule. Empty groups and
sections are omitted. Populated groups start expanded and use the shared
Disclosure primitive. Later pinned rows and local Search are omitted, with the
measured teamspace offsets preserved when a section becomes available.

## Create Records menu

`create-records.tsx` is the top-bar `+` control and its panel. Rows come only from
`createRecordsNav` in `nav.ts`; a module joins by adding one `{ id, label, path }` row, and the
component holds no module name. Rows carry no icon on purpose: the spec measures the same 7 × 7 px
plus glyph on every module row, so the glyph is drawn by the component, not stored per entry.
`Lead` is the only Module 1 row and points at `/crm/<org>/tab/Leads/create`; that page arrives with
MEP-145, so the address currently resolves to the organization's not-found screen inside the shell.

`Interim` decisions:

- **Search rule.** The box filters rows by a case-insensitive substring of the label, and an empty
  result leaves the list empty. No search term was ever typed in the reference, so no other rule
  (word matching, ranking, module aliases) is claimed.
- **Focus on open.** The panel moves focus to the search box and clears the previous query, because
  the capture shows the box already focused when the menu opens. The measured 1 px `#5464F2` focus
  edge and its halo are therefore drawn on `data-focused`, not only on the keyboard
  focus-visible modality.
- **Ink versus box.** The header sits at `line-height: 1`, so its measured ink band, not its line
  box, fixes the inset. `--size-create-menu-heading-top` is the box inset that puts the ink at the
  measured y 63.5–75.
- **Right column.** The configuration sections (`New Configurations`, `New Collaboration Items`) and
  the 1 px divider between the columns belong to later modules. The panel keeps its measured width
  and the left column keeps its measured width, so that area stays empty.

The bottom 28 px remains reserved for the later utility strip without rendering
its controls. Below the existing `md` breakpoint the rail starts hidden; opening
it overlays the content, and closing it returns focus to Show Menu. At desktop
width it sits beside the content. Hide Menu hides the whole rail (the reference
collapsed state is unknown). Unknown subroutes use a catch-all to invoke the
organization 404 inside the authorized layout.
