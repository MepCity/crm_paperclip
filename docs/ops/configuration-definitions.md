# Configuration definition runtime

Reports, inactive assignment shells and unverified organization addresses use
the approved Postgres definition adapter. Set `CRM_DATABASE_URL` to a dedicated
`crm_app` connection to the migrated application database. `DATABASE_URL` remains
the existing identity connection; it is never used as a fallback for these stores.
Do not place credentials in tracked files.

The first use checks runtime role, RLS, grants and installed table contracts.
A missing or unsafe connection fails closed with a recoverable UI error; no
memory store is substituted. The e2e runner supplies a restricted connection to
its disposable database. Normal migration/provisioning owns runtime roles;
browser requests never create roles, run migrations or modify grants.

Each server action resolves membership from the request's authenticated session
and organization slug. Core validation and admin authorization remain authoritative.
Effective customization metadata is shared with the record-service composition.
Reports run through RecordService with selected columns and filters, including
the existing record read guards. The editor retains the same idempotency key
for a retry until the draft changes. Editing uses the loaded definition revision.

The current approved adapter accepts tabular reports only (`grouping: null`).
The grouping control explains that limitation and remains disabled. Grouping,
aggregate persistence and summary/matrix report modes are outside this contract.
Builder layout is a bounded interpretation of documentation-based research:
the reference builder was not successfully observed. This is an open parity
question for QA/CTO, not a claim of observed builder parity.

Assignment shells stay inactive, without entries or fallback. Organization
addresses stay unverified. Neither flow executes automation, sends mail,
creates verification tokens or queues provider work.

## Verification and review boundaries

The browser regression covers create/run/reopen/update and tenant isolation for
reports, inactive-shell reload/detail/list navigation, unverified-address reload
and duplicate conflicts. Component tests cover failed-draft retention, stable
retry keys, revision conflicts and nested-filter preservation. Runtime tests
check missing/unsafe connection failure without an identity-pool fallback.

QA must compare the observed entry dialogs against the research captures at the
same viewport. Report builder/save states were not observed in the reference;
review their documented functional interpretation separately. No live parity
claim or reference write authorization follows from these tests. The new write
wiring requires the existing non-Claude review and CTO approval before merge.
