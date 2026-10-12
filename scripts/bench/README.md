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
