# ADR 0014 — English and Turkish interface internationalization

- Status: Accepted (CTO, 2026-10-24); implementation waits for R1
  reconciliation (item 1 below) and its own issues
- Date: 2026-10-24
- Issue: MEP-1337; umbrella: MEP-1335; research dependency: MEP-1336 (R1)
- Tier: high
- Decision owner: CTO, after Gemini Reviewer review
- Scope: Phase 1 interface language infrastructure; no runtime changes

## Context and evidence boundary

The board requests English (default and fallback) and Turkish selected through
Personal Settings → Locale Information → Language. R1 is still in progress at
draft time. This document selects proposed internal mechanisms without claiming
unobserved reference behaviour or supplying an invented Turkish glossary. R1's
reviewed terminology and behaviour must be reconciled before implementation.
No reference session was opened and no preference was changed for this ADR.

Repository inputs:

- [ADR 0001](0001-stack-and-repo-layout.md) and
  [ADR 0004](0004-request-shape.md): App Router and stable organization routes.
- [ADR 0003](0003-ui-foundations.md): current English interface baseline.
  This proposal supersedes its English-only interface policy when accepted.
- [ADR 0011](0011-customization-metadata.md), section 5, board decision 7:
  organization number/date formatting only for now; personal overrides later.
- [Personal locale research](../../research/specs/customization-personal-locale.md)
  establishes distinct Language, Country Locale, date/time and number rows in
  text/ARIA, with explicit visual and write-behaviour limits.
- [Company locale research](../../research/specs/customization-company-locale.md)
  does not establish an organization interface-language control.
- MEP-496 supplies `packages/core/src/format/index.ts`, web `FormatProvider`,
  `loadOrganizationFormat` and `numberInputLocale`. Format tests already cover
  `en-US` and `tr-TR`. Do not replace this formatting implementation.
- `settings-personal/port.ts` currently exposes a display-string language and
  read-only port; its fixture is not durable preference storage. The root
  layout currently hardcodes `<html lang="en">`.

## Proposed decision

### 1. Library and routing

Use `next-intl` with ICU messages and request-scoped App Router configuration.
Use its Next.js plugin, `getTranslations` for async server components and
`useTranslations` for synchronous components. Client components receive a
`NextIntlClientProvider`. These are supported integration patterns in the
[App Router guide](https://next-intl.dev/docs/getting-started/app-router) and
[server/client guide](https://next-intl.dev/docs/environments/server-client-components).
Pin a compatible release in the implementation lockfile after a Next 16 /
React 19 build, SSR and hydration spike; this ADR does not assert an untested
package version or require a framework upgrade.

Keep `/crm/[orgSlug]/…`, API paths, methods, query keys, payload identifiers and
bookmark URLs unchanged. No locale route segment, browser negotiation,
translation proxy, remote catalog service or automatic translation API.
Alternative: a hand-written dictionary has fewer dependencies but would require
maintaining plural rules, ICU formatting, React context and server integration.
A general i18n framework remains viable, but adds integration choices without
an identified benefit for this App Router application. Revisit the selection
only if the compatibility spike fails.

### 2. Language resolution and persistence

Use canonical `UiLanguage = 'en' | 'tr'`. Do not parse translated language
names from the existing display-only settings projection. The settings adapter
must map its supported language codes explicitly; unknown codes are absent.

| Priority | Source | Rule |
| --- | --- | --- |
| 1 | Authenticated user's saved Language | Supported, validated canonical code |
| 2 | Organization interface-language default | Reserved resolver input; initially absent, therefore English |
| 3 | Application fallback | `en` |

No new organization language setting or configuration UI is authorized here;
R1/CTO must establish its semantics before enabling priority 2. Country Locale,
`Accept-Language`, `navigator.language`, device time zone, query parameters and
local storage never choose interface language. Anonymous pages use English.
An unavailable/unsupported preference resolves through the same fallback chain;
a temporary read failure must not overwrite a stored preference.

Resolve from authenticated application identity on the server, once per request.
Cache catalog data globally if useful; cache preference resolution only within
the authenticated request. Never share a resolved language across users or
organizations. Resolve the root document's `lang` from the same identity-backed
user preference; pass the same resolved snapshot into all providers. If future
organization defaults affect language, move organization resolution to a shared
request context usable by the root as well; do not guess organization from
untrusted headers. No cookie independent of saved preferences is authoritative.

The first implementation adds a typed preference read/update command behind
the personal-settings boundary, using the existing authenticated settings
service/persistence foundation rather than a second user store. Ownership is
server-enforced: users change their own supported language only. Exact wire
codecs and mutation request shape require R1 reconciliation and contract review;
this ADR does not invent a reference endpoint. A memory adapter is test-only,
not proof that language survives a restart or another device.

Save in our application only: validate → persist → invalidate preference cache
→ refresh server components and client providers together. On failure retain
the prior language and show a translated error. Successful switching preserves
record IDs, drafts and current route; test this rather than forcing a page
reload that discards edits. Providers update in place; do not key the entire
record tree by language. Reopening a page, a new session and another signed-in
device use the persisted preference. Existing open tabs synchronize on focus
or the next server navigation; no realtime service is introduced.

### 3. Catalog layout, types and fallback

Proposed files (not added by this ADR):

```text
apps/web/messages/en/{common,shell,settings,metadata,leads,...}.json
apps/web/messages/tr/{common,shell,settings,metadata,leads,...}.json
apps/web/src/i18n/{request,resolve-language,catalogs,client-provider}.ts[x]
apps/web/src/i18n/messages.d.ts
scripts/check-ui-messages.mjs
```

Each JSON file owns a stable namespace (`common.actions.save`,
`leads.empty.title`, `metadata.modules.leads.singular`). Keys describe meaning,
not English sentences, screen position or customer values. English is the key
schema and baseline text. Type augmentation uses the assembled English schema;
see [typed messages](https://next-intl.dev/docs/workflows/typescript).
Use literal/static key maps for metadata and error codes, not arbitrary dynamic
string concatenation. ICU handles interpolation and plurals as complete
sentences; never build a sentence by joining translated fragments. Escape
interpolated record/user values and use React rich-text slots only when needed.
Never interpret catalog or customer values as HTML.

Load English first and deep-merge the selected catalog leaf by leaf before
creating either server translators or client providers. Missing/invalid Turkish
leaves use the English message with the same interpolation values. Do not rely
on `getMessageFallback` returning a key: it cannot supply an English ICU
translation on its own. English-format fallback messages use an English locale
translator so plural rules remain correct even under Turkish. A shared wrapper
tracks fallback provenance for this case. Catch a malformed selected ICU message
and retry the English translator; both paths must be tested on server and client.
An absent/invalid English key is a build/test failure; production shows a safe
English generic error and records only key, namespace, language and error class.
Never log message parameters, record contents or customer values.

Configure server `onError`/`getMessageFallback` and a small client wrapper with
the same policy: function props do not serialize through the server boundary.
The library documents these hooks in
[request configuration](https://next-intl.dev/docs/usage/configuration).
Catalog validation catches key-set drift, empty leaves, malformed ICU and
incompatible interpolation names before release. Intentional temporary Turkish
fallbacks must be listed by key with an owner/issue; CI rejects unexplained
missing leaves. Catalogs contain application vocabulary only, never customer data.

### 4. Server, client and metadata boundaries

Keep translation outside domain decisions and raw transport/storage values.
Prefer server-translated labels passed as props for static UI. Interactive
components get the active language, merged messages and fixed request time/time
zone as needed. Initially ship only shell/common and active module namespaces;
providers must include every namespace used by portals, toasts and nested
components, with a test for navigation between modules. Error boundaries that
sit outside an authenticated provider get a small safe English catalog.

Use request-scoped `getTranslations` in server-rendered UI and explicitly pass
language to formatting/presentation helpers outside React. Core validators and
services emit stable error codes plus safe structured parameters; the web layer
maps them to catalog messages. Preserve existing API error codes/contracts and
sanitize unexpected errors. Localize field validation, toasts, empty/loading
states, accessible names, title attributes, menus and document titles as well
as visible labels. Update `<html lang>` with SSR and each successful switch.

Keep canonical module/field IDs, API names and picklist codes in metadata.
Store built-in module singular/plural labels, system field labels, related-list
labels and built-in picklist display text in the `metadata` catalog, keyed by
stable IDs. Resolve presentation as:

1. Authorized organization-customized label, if present, verbatim in both languages.
2. Catalog translation for the built-in ID, with English fallback.
3. Existing effective metadata label for a custom/unknown ID.

Do not rewrite the effective metadata snapshot per language or invalidate its
schema revision just to translate. A display adapter is shared by forms, lists,
record detail, navigation and selectors. Unknown/custom picklist values and all
record content remain verbatim; never translate persisted statuses in place.
Custom-label translation management, user-authored templates, record notes,
attachments and arbitrary imported text are deferred. CSV/API machine headers
and exports keep their existing contract until separately specified.

### 5. Formatting and MEP-496 compatibility

Interface language and organization format are independent inputs. Map `en` to
`en-US` and `tr` to `tr-TR` for textual month/day names and relative expressions.
Continue using `@crm/core/format`, `FormatProvider` and `numberInputLocale` for
record dates, numbers, money and parsed inputs. Do not mix in next-intl's number
or date formatting as a second path.

For translated screens, derive presentation options by overlaying the UI locale
onto `loadOrganizationFormat()` while preserving organization time zone,
explicit date pattern, hour cycle, decimal/group separators and currency symbol
rules. When an organization option is absent, materialize its existing effective
MEP-496 default before changing the textual locale: switching language must not
silently change separators, numeric date order or the clock. Relative prose
uses UI language but keeps the organization time zone and a fixed `now` for
SSR/hydration. Phrase-specific dates such as overdue text use ICU messages with
computed day counts; do not split “Late by N days” into fragments.

Country Locale and personal number/date/time-zone rows do not become overrides
in this work. No language switch changes currency codes, exchange rates,
precision, stored UTC timestamps, ISO date-only values or numeric payloads.
Default English output stays byte-for-byte compatible where tests assert it.
A Turkish number/date convention is selected by organization formatting, not
inferred from Language. This reconciles the umbrella's Turkish-format goal with
the existing organization-only board policy; changing that policy needs a decision.

### 6. Incremental migration and verification contract

Migrate by complete screen/module boundaries while English remains the baseline.
First add an AST-based check for new UI text: JSX text, user-facing literal
props (including accessible labels), toast/validation strings and known label
configuration objects. Exclude machine IDs, fixtures, test assertions and API
values by syntax/location. Baseline existing violations by file, position and
literal hash; reject additions, stale exemptions and increased counts. CI compares
against the baseline committed on main, not a regenerated baseline in each PR.
Changed baseline entries need an explained review; completed modules allow none.
Include positive/negative scanner fixtures so moving text into an array or an
`aria-label` cannot trivially evade the rule. This guard is a regression aid,
not proof that every possible dynamically constructed string is translated.

Required implementation checks:

- Resolver matrix: saved user wins, unsupported/missing/read-failure fallback,
  no browser detection, no cross-user/tenant cache leakage, rejected foreign-user
  write, no persistence on failed save, reopen/restart persistence.
- Catalog tests: English schema/types, ICU syntax/argument parity, Turkish missing
  key → English formatted sentence (including plurals), malformed translation,
  absent English key, server/client parity, no leaked parameters in diagnostics.
- Metadata tests: system IDs translate, custom labels win, wire/storage values
  and schema revisions are unchanged, unknown IDs retain their labels.
- Formatting tests: TR UI with EN organization format and the converse; explicit
  and missing separators/date/clock options, currency overrides, negative/zero
  amounts, UTC/date-only and DST boundaries, input parsing and fixed relative time.
- Existing e2e setup explicitly seeds/pins the authenticated user's Language to
  `en`, organization formatting to current defaults, and a deterministic clock.
  Browser locale alone is insufficient. No production test override or visible
  developer switch. Turkish suites seed another user and exercise the real saved
  Language control in our app, persistence, failed save, navigation, drafts,
  document language, validation and empty/error states. Check zero page errors.
- Targeted component/e2e checks for each migrated screen; fresh reference and app
  images at equal size for visual review, including Turkish wrapping/truncation,
  icons, counts and date strings. R1 supplies terminology evidence; screenshot
  content and customer values stay outside the repository.

## Short implementation plan

Proposed large slices, not created tasks or permission to begin. R1 reconciliation,
Gemini Reviewer review and CTO acceptance precede implementation; the issue's
published plan records the separate proposal confirmation. Owners serialize
shared layout, metadata adapters, settings and test infrastructure changes.

| Slice | Scope and exit condition | Dependencies |
| --- | --- | --- |
| I. Infrastructure, saved language and shell | Compatible library spike; resolver/persistence, settings control, root/client providers, fallback, catalog checks/text guard, shell/navigation/common UI and deterministic EN fixtures; resolver/catalog/scanner/SSR tests plus EN/TR switch and draft-preservation e2e | Accepted ADR, R1 behaviour reconciled, approved implementation proposal |
| II. CRM screens and system vocabulary | Leads, Contacts, Accounts, Deals, Activities, notes/attachments and campaigns/cases/solutions; shared metadata display adapter, form/list/detail messages and errors; reviewed glossary, EN regressions and TR screen/state tests | I; one owner for shared metadata/components |
| III. Remaining Phase 1 and format completion | Documents, email/calendar, customization, automation, reports/analytics, home/workqueue, visits/social; formatting integration and remaining text-baseline removal; mixed-language/organization format matrix and complete Phase 1 coverage inventory | I; consume II's metadata adapter, sequence shared files |

II and independent module files in III can proceed after I; shared formatter and
metadata edits remain sequential. Each slice owns meaningful tests and the
required review gates. No Phase 2 research or implementation is included.

## Consequences and decisions still required

Benefits: stable routes and machine contracts, explicit English fallback,
request isolation, one formatter and incremental adoption. Costs: a new library,
a real saved preference contract, catalog maintenance, scanner false positives,
and temporary mixed-language screens until migration finishes.

Before acceptance/implementation, reconcile:

1. R1's Language codes, selector/save flow, exact Turkish terminology and evidence
   gaps. This draft does not certify reference UI or unknown save behaviour.
2. Confirmed by the CTO at acceptance: no browser detection; the organization
   language default stays reserved and disabled; organization format keeps
   deciding numeric and date conventions.
3. Preference persistence placement and exact mutation codec under the accepted
   auth/persistence foundation; no migrations or duplicate settings stores here.
4. Final scope/grouping and owners of the three implementation slices after R1;
   custom-label translation and personal format overrides remain deferred.

## Draft verification

Documentation only: resolve relative file links, verify every requested decision
has an explicit proposal or evidence limit, run `git diff --check`, merge current
`origin/main`, and pass repository commit hooks. No runtime code, dependency,
metadata or schema is changed, so unit/component/e2e/typecheck runs are not
applicable to this draft. Compatibility and behaviour tests above are acceptance
requirements for implementation, not results claimed by this document.
