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

The bottom 28 px remains reserved for the later utility strip without rendering
its controls. Below the existing `md` breakpoint the rail starts hidden; opening
it overlays the content, and closing it returns focus to Show Menu. At desktop
width it sits beside the content. Hide Menu hides the whole rail (the reference
collapsed state is unknown). Unknown subroutes use a catch-all to invoke the
organization 404 inside the authorized layout.
