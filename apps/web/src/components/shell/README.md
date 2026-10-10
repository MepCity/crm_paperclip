# Organization shell

The organization layout authorizes membership and reads the user and organization
list on the server. It passes only display data to `AppShell`.

Each page (including loading and error fallbacks) renders exactly one
`<PageTitle title={shellPageTitle.settings} />`. It registers the toolbar `h1`.
Matching `export const metadata = shellPageMetadata(...)` on each `page.tsx` (and
organization `not-found.tsx`) keeps the browser title correct on client
navigations; `PageTitle` still sets `document.title` after paint for loading and
error fallbacks that cannot export metadata. Pages remain server components; the
marker alone is a client component. Do not duplicate the title in content.

`not-found-message.tsx` is the one body sentence every in-shell not-found screen shows: the
organization route fallback, the module list fallback and the record fallback. Each screen keeps
its own wrapper, `PageTitle` and controls, and renders `<NotFoundMessage />` for the copy instead
of retyping it.

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
- **Focus halo.** The spec measures the edge (1 px `#5464F2`) and that the halo "fades over approx.
  7.5 px", but not its blur, spread or opacity. The box therefore uses `--shadow-create-menu-focus`
  (15 px blur, no spread) instead of the primitive's flat 2 px ring, in both mouse and keyboard
  opens; a shadow without spread fades over about half its blur radius. The halo opacity is interim.
- **Search box corners.** The create menu's search box is measured at 4 px
  (`--radius-create-menu-search`), while the shared `filter-search` variant keeps the 6 px corners
  the list spec measures for list filters, so list filters are unchanged.
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
