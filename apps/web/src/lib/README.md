# Web app shared libraries

Utilities and client helpers used across routes and components under `apps/web/src/lib`.

## User preferences (`preferences.ts`)

`usePreference` is the single entry point for **temporary** client-side UI preferences (for example related-list rail visibility or list page size). Values persist in the browser when a `PreferenceProvider` supplies `orgSlug` and `userId`; wrap the organization layout once. Without the provider the hook keeps state in memory only for the current tab.

Server-side preference storage is deferred until ADR 0002; the hook signature stays stable when persistence moves to the API.

**Key naming:** `<screen>.<setting>` (for example `detail.railHidden`, `list.pageSize`).

**Storage key format:** `crm:pref:<orgSlug>:<userId>:<key>` with JSON-encoded values.

On the server render and the hydration render the hook returns `defaultValue`. On later client mounts in the same tab, the first render returns the stored value when one exists; in-tab memory wins over storage until a full reload (changes in another tab are not visible until reload). Invalid or mistyped stored values are ignored. If browser storage is unavailable, reads and writes fall back to in-memory state without throwing.

The hook only validates value **types** against `defaultValue`; allowed value sets (for example page-size options) are enforced by the consumer.
