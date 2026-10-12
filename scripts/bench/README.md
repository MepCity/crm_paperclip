# Record storage benchmarks

`pnpm bench:storage` retains the original A0–A3, B and C protocol, including
search. Its existing committed report is `results/record-storage.md`.

Run the ADR 0002 slot confirmation independently:

```sh
pnpm bench:storage --slots --rows 200000 --warmup 5 --measure 30 --writes 2000 \
  --out scripts/bench/results/record-storage-slots.md
```

`--slots` skips C loading/measurements and all search measurements. It compares
A3, A4 and B1 in one isolated embedded PostgreSQL cluster. A4n measures only S2,
S2-KEYSET, writes and sizes. To retain machine-readable measurements, pass
`--json` with an output file. Temporary database and COPY files use the run
scratch directory when supplied, and are removed when the run finishes.

A smoke run can use `--rows 800 --warmup 1 --measure 3 --writes 8`; it validates
the protocol and must not be used to decide the full-scale expectation.

The runner reloads A4 and A4n from the same seed, writes all twenty slots with
the document, and maintains assigned slots in each timed write statement.
Contacts intentionally reuse the text columns with a different field mapping.
A3/B1 are measured before their write batches. Equivalence checks compare the
unmodified A3 result identities and ordering with every A4 parameter set; counts
and full-record reads also compare their returned values. Selective parameters
come from loaded rows, so the required filter scenarios cannot pass on empty
sets. S14's floor is selected at the top ten percent of live records.

Each scenario runs RLS off and immediately on as the same unprivileged role,
including the organization transaction setting. All initial measurements,
noise retries and MCV remeasurements remain in the report. A slot index used only
for ordering is not labeled a slot Index Cond. A4's >10x first-scan estimate
errors on slot filters trigger the requested module/slot MCV statistics and
remeasurement; no other planner tuning is attempted.

Run the usual `pnpm verify` gate. Slot integration tests additionally exercise
RLS, all slot types, non-null indexes, missing values and keyset null tails.

## Second slot evidence (MEP-103)

The independent entry point below leaves both `pnpm bench:storage` and `--slots`
unchanged. It does not load C or measure search. It creates its own embedded
PostgreSQL cluster under the run scratch directory, uses synthetic records only,
and removes the cluster on completion.

```sh
pnpm exec tsx scripts/bench/slots2.ts --rows 200000 --writes 2000 \
  --warmup 5 --measure 30 \
  --out scripts/bench/results/record-storage-slots-2.md
```

Add `--json <file>` to retain the raw evidence. Use a run-owned scratch path for
that file. A smoke run can use `--rows 800 --writes 8 --warmup 1 --measure 2`;
its timing results do not settle the acceptance rule.

A4b stores canonical decimal text in the document and scaled `bigint` values in
all four numeric slots. The precision cohort adds 2,000 records to the baseline
Leads count, including adjacent cents at 16 digits, signed pairs and extremes.
The compiler uses integer arithmetic for every operator, fractional threshold
and overflow-boundary fold. Third-decimal writes are rejected before SQL.

Every read has exactly three rounds, each measuring the runtime role with RLS
first disabled, then immediately enabled. The best RLS-on p95 chooses the summary
round; its off/on pair and the full three-round range remain visible. All raw
rounds, unbounded predicate estimate/count, access-plan shape, shared buffers,
value Index Cond and ordering/Sort evidence are in the report. Two-arm branch
EXPLAIN times and access paths are reported independently of client timings;
these times describe the arms of the same query, not separate timed batches.

The sort matrix uses company, whose missing-value share is measured. It covers
four directions/null placements, first/boundary/offset-5,000 pages, both filters,
full/partial indexes and both two-arm alternatives. A bounded outer Sort is
still marked full-set when its arm limits consume all matching records.

A4b and A5 are loaded from the same immutable seed. Initial slots and full-field
fallbacks are projected in one INSERT SELECT, before index construction. Both
models are reloaded before the ten-field write comparison, removing diagnostic
update history. A5 only materializes present indexed values, maintains affected
fields in the same transaction as the document/event, and shares the tenant
policy with records. The twenty-field variants have the same fully populated
Leads documents. Sizes include TOAST, system/value indexes and event tables.
WAL measures generated insert-LSN differences after a checkpoint, so asynchronous
flush settings in tests cannot hide generated WAL.

Backfill assigns a previously unused slot while holding the module FOR UPDATE;
concurrent writers hold FOR KEY SHARE. Each owner-run 5,000-row batch derives
values from the current document inside its UPDATE. The original baseline
module rows are backfilled, including soft-deleted records; the additional
precision cohort is excluded. IS DISTINCT FROM validation must report 0, then
exactly 200 after intentional NULL/wrong-value corruption, then 0 after repair.
The writer changes the backfilled field at a target rate of 50 operations/second;
its actual rate and p95 are reported.

S10 compares the unchanged A3/B1 report queries with slot grouping, an exact
scaled sum and a temporary projection of created_at to a time slot. The original
12-month window stays the same. Aggregate equivalence excludes only the extra
precision cohort. Paired RLS overhead has 30 identical-parameter pairs, bypass
role immediately followed by the runtime role, after five warmup pairs. Its
bypass plan is checked against an RLS-disabled runtime plan per scenario.

Run `pnpm verify` before delivery. The second-protocol integration tests cover
all numeric thresholds/operators, null boundaries, partial indexes, side-row
absence, full-record/page equivalence, composite primary-key reads, exact
aggregates, RLS, ten/twenty-field writes with events and concurrent backfill.
Acceptance misses remain evidence; the benchmark does not modify the ADR.
