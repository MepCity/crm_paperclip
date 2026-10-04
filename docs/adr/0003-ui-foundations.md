# ADR 0003 — UI foundations

- Status: Accepted
- Date: 2026-10-03
- Decider: CTO
- Issue: MEP-14

Number 0002 is reserved for record storage (see ADR 0001, deferred decisions).

## Context

ADR 0001 deferred two UI decisions: the headless component primitives and the UI language. They are needed now:

- The skeleton screens (sign-in, organization, members) and the first Leads screens are built in parallel worktrees by several engineers. Without shared conventions every screen invents its own buttons, forms and error handling.
- CRM screens are forms, tables and overlays generated from field metadata. The metadata export has 27 field types, among them lookups, picklists, dates, date-times and currency. That needs an accessible combobox, date picker, selectable table and, for the pipeline board, drag and drop.
- Both server and client components import from `@crm/core`, whose main entry point pulls in the database driver.

## Decision

### 1. Component layers

| Layer | Location | Rule |
| --- | --- | --- |
| Primitives | `apps/web/src/components/ui/` | One file per component, kebab-case, no barrel file. No knowledge of features or data. |
| App components | `apps/web/src/components/<area>/` | Composed from primitives (shell, members, later records). |
| Routes | `apps/web/src/app/**` | Compose components and call services. |

- Interactive behaviour comes from **React Aria Components**. It is imported only inside `components/ui`, so it can be replaced.
- Outside `components/ui` there are no raw interactive elements (`<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`) and no hand-written widgets. A missing primitive is added to `components/ui` first.
- Icons come from one set, Lucide (`lucide-react`), re-exported by `components/ui/icon.tsx`. Feature code imports icons from that file only.
- `@/` is the import alias for `apps/web/src`.

### 2. Styling

- Tailwind CSS 4 utilities only. Colours, radii, spacing and type sizes come from the tokens in `tokens.css`, exposed as theme variables. Components contain no colour literals and no arbitrary values.
- Variants are typed props (`variant`, `size`) mapped to class lists inside the component file. No CSS-in-JS and no variant library.
- Interaction states are styled from React Aria's data attributes (`data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-invalid`).
- One light theme. Tokens are CSS variables, so a dark theme can be added without touching components.
- Token values are derived from the measured look of the reference CRM. The **Visual layout** sections of the specs in `research/specs/` are their only source, and `apps/web/src/components/ui/README.md` lists the source of every token. Screens of our own that have no counterpart in the reference CRM use the same tokens.
- The typeface is set by the single `--font-sans` token (board decision, 2026-10-04, MEP-63). It is an open-licence typeface whose measured widths, x-height and weights are closest to the reference look, and the board sees the candidate before it is adopted. Its files come from the typeface's own official source and are served by our app. Replacing the typeface later means changing that token and its font-face declaration and nothing else.

### 3. Server and client code

- Pages and layouts are server components. They read data by calling `@crm/core` services directly. There is no client-side data-fetching library.
- Client components (`"use client"`) are small and hold interaction only.
- A client component never imports the `@crm/core` entry point (it would bundle the database driver). It may import types, and the client-safe subpaths `@crm/core/errors` and `@crm/core/format`.
- `apps/web/src/lib/session.ts` is the only place that reads the request's session. It wraps `getSession`, `requireUser` and `requireOrgContext` from `@crm/core`, caches them per request, and turns "not signed in" into a redirect to `/sign-in?next=…` and "not found" into the 404 page.

### 4. Mutations and forms

- A mutation is a server action in an `actions.ts` file next to its route. The action reads the `FormData`, calls one `@crm/core` service, and either redirects or returns an `ActionState`.
- Validation and authorization live in the service, never in the action or the component. Services validate with `parseInput`; the keys of the service input are the `name` attributes of the form fields, so `ValidationError.fieldErrors` maps onto the form without translation.
- Expected failures are `AppError` subclasses (`@crm/core/errors`). `toActionState(error)` in `apps/web/src/lib/action.ts` converts them; any other error is rethrown and reaches the error boundary.

```ts
type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
```

- Forms use `useActionState` with the `Form` primitive, which shows field errors on the matching field, the message in an alert, and a pending state on the submit button.
- Exception: sign-up, sign-in and sign-out post to the auth HTTP endpoints (`/api/auth/*`) through `apps/web/src/lib/auth-client.ts`, because the auth library owns the session cookie. These forms present errors the same way.

### 5. Routes

| Route | Purpose |
| --- | --- |
| `/` | Entry point: redirects to sign-in, to the user's organization, or to organization creation |
| `/sign-in`, `/sign-up` | Authentication (route group `(auth)`) |
| `/orgs/new` | Create an organization |
| `/invite/[token]` | Accept an invitation |
| `/o/[orgSlug]/…` | Everything inside an organization, rendered in the app shell |
| `/o/[orgSlug]/settings/…` | Organization settings (members first) |
| `/api/auth/*`, `/api/health` | Auth endpoints, health check |
| `/dev/ui` | Component gallery: every primitive in every state |

### 6. Language and formatting

- The UI is in English, the language of the labels in the reference CRM metadata that seeds our module and field labels. There is one locale and no localization library; static strings are written in the components.
- Dates, times, numbers and currency amounts are never formatted inline. They go through `@crm/core/format`, which wraps `Intl` and takes the locale and time zone as arguments.
- Until organization and user locale settings exist, the web app passes the constants from `apps/web/src/lib/locale.ts` (`en-US`, `Europe/Istanbul`). Timestamps are stored in UTC (ADR 0001).

### 7. Tests

| Level | Tool | Scope |
| --- | --- | --- |
| Component | Vitest project `component` (jsdom, Testing Library, user-event), `*.test.tsx` next to the component | Every primitive: rendering, states, keyboard use. Queries by role and label. |
| End to end | Playwright | Every screen's main flow, plus an automated accessibility check of the screen |

- Every primitive has a demo on `/dev/ui`; the end-to-end run opens that page, so each primitive is rendered in a real browser.
- No snapshot tests.

### 8. Accessibility baseline

WCAG 2.1 AA: every control has a label, focus is visible, everything works from the keyboard, colour contrast comes from the tokens, and form errors are tied to their field and announced.

Exception (board decision, 2026-10-04, MEP-63). The one-to-one look takes precedence over the contrast minimum in two places only. There the measured reference values stay as they are:

- **Placeholder text.** `--color-text-placeholder` and `--color-rail-placeholder` measure 2.75:1 to 3.33:1 against their surfaces, below the 4.5:1 text minimum. The two tokens are used only for the placeholder of a real input. A placeholder is never the only label of a control and never carries a value, an instruction or an error.
- **Separator lines.** `--color-border`, `--color-topbar-border` and `--color-rail-border` measure 1.36:1 to 1.90:1, below the 3:1 non-text minimum, where they divide regions. A border that outlines a control is not covered.

Everything else meets AA. Text in `--color-primary` is drawn on `--color-surface` (4.69:1) and not on `--color-bg` (4.15:1). The ratios are listed under "Contrast notes" in `apps/web/src/components/ui/README.md`. A newly measured pair below AA is not covered by this exception: the engineer reports it to the CTO and the board decides.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Radix UI primitives | No combobox, date picker or selectable table; we would add a second library for record forms and lists. |
| Base UI | Comparable for overlays. React Aria also covers collections (table, grid list, drag and drop) and locale-aware date and number fields, which record screens need. |
| Copy-in component kits | Bring another design language and many files nobody owns. We have our own tokens. |
| Hand-written widgets | Accessible comboboxes, menus and date pickers are hard to get right. |
| Client form library with API routes | Validation in two places and more client code. Server actions with validation in the service keep one path, which the REST API and imports reuse. |
| Client data-fetching library | Server components cover reads. Revisit when a screen needs live updates. |
| Localization library now | One language today; it would add a message key for every string in every issue. The cost of deferring is extracting strings later. |
| Storybook | A second build and dependency set. A gallery route inside the app is enough and is exercised by the end-to-end run. |

## Consequences

- Screens stay consistent because feature code can only compose primitives.
- React Aria Components is a large dependency on every interactive screen. It is confined to `components/ui`.
- A second UI language means extracting strings from every component.
- jsdom does not lay out. Overlay positioning and visual defects are caught only in the gallery and the end-to-end run.
- The locale and time zone are constants until the settings screens are specified.
