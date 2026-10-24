# Customization slice A

`index.ts` exposes the pure resolver, metadata types and an ephemeral adapter.
Existing record and HTTP contracts are unchanged. This folder has no disk or
network writes. Consumers must not enable settings editing from this adapter.

## Contract

- Baselines declare stable local field IDs, immutable API names, version,
  property allowlists, system-required/server-value markers and engine support.
  An allowlist cannot override system-required, read-only or length invariants.
- Snapshots contain only organization changes. Missing layouts/views inherit
  the baseline; supplied arrays replace them. Array positions define section,
  column, field and view order. Section `fields` preserves ordered membership
  independently from `columns`, including hidden and unplaced fields. Every
  member is an active field ID, unique within its section; column entries must
  belong to that section. Cross-section membership may repeat (the Calls
  fixture repeats Description); column placement remains globally unique.
  Effective reads include `inheritsBaselineLayouts` to distinguish inherited
  placement from an explicitly supplied replacement, even if their contents
  happen to match. This internal provenance does not relax validation.
  Field patches merge by stable field ID;
  `views` and `picklist` properties replace their complete property value.
  Unknown keys and explicit undefined patch properties are rejected.
- Names are case-sensitive, as in the existing record contract. Active and
  retired definitions reserve their API names. Baseline API names may have a
  single leading `$`; custom fields retain the strict letter-first format.
  Retired fields are omitted from effective reads, and layouts/views/patches
  cannot refer to them. This slice
  exposes no retire/restore operation; lifecycle dependency checks belong to C.
- One default layout is supported pending the assignment policy. Supported
  column counts come from the registered baseline. Required fields without a
  baseline server value must be writable, visible on create and placed. They
  also need edit visibility unless their baseline declares `views.edit: false`
  (create-only). Custom fields and baseline-editable fields cannot acquire that
  exception through a patch. Visibility is presentation, not field-level
  authorization.
- Saved views use stable field IDs. `externalCriteriaFields` is required on
  baselines and carried through effective reads. It declares unique API names
  outside all field IDs, API names (including retired/custom fields) and reserved
  names. These names are accepted only in criteria leaves, unchanged, with a
  known comparator and no inferred field type. Columns and sorts remain strict
  active IDs. `viewWithApiNames(effective, view)` translates columns, sorts and
  nested criteria to API names, validating catalog leaves with the record engine.
  Baseline and replacement overlay views follow the same rules.
  System views cannot be removed, changed or introduced by an overlay.
- Capabilities are the baseline/engine intersection. Caller authorization must
  narrow them in slice E; `CustomizationPort` is an internal metadata boundary,
  not an authenticated service. The adapter accepts organization IDs explicitly.
- Successful patches increment the organization/module revision once. CAS
  conflicts expose expected/actual revisions through `CustomizationConflictError`.
  Reads never create snapshots. Inputs are detached and effective outputs are
  deeply frozen. Synchronous validation/CAS/publication is atomic in one process.
- `upgradeBaseline` validates every stored overlay before any activation. It
  preserves identities, types and historical reserved names; incompatibility
  leaves the previous baseline and every tenant snapshot intact. Successful
  upgrades increment revisions, including the inherited revision of tenants
  without an overlay, so old forms cannot publish under a stale baseline.

Authorization, audit publication, record-value compatibility checks, shared
record-write coordination and persistence remain separate slices. This adapter
alone cannot prove an existing-record backfill, a safe destructive change or
multi-process consistency. Restart loses changes.

## Integration questions for Platform Lead

1. `FieldDefinition` has `maxLength` and picklists but no numeric range property.
   Range keys are rejected rather than inventing record validation semantics.
   A reviewed additive contract is needed before range customization is enabled.
2. Saved-view scope/ownership remains the existing `ListView` shape in slice A.
   Slice H must settle private/shared ownership with the authorization policy;
   this internal resolver grants no new sharing capability.
3. The requested folder-only scope exposes a local `index.ts`. A package subpath
   export and HTTP codecs belong to a later integration change. Existing types
   and exports outside this folder have not been changed.
