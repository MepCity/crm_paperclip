# Record storage: second slot evidence (MEP-103)

Complete: yes. Only synthetic data. Acceptance criteria are evaluated without changing the ADR.

## Measurement disposition (2026-10-12)

The complete full-scale run has 666 off/on read rows and 548 passing correctness, equivalence and tenant-isolation checks. Expectations 1, 3, 4 and 5 pass; expectations 2 and 6 fail. This is evidence for the CTO's ADR decision, not approval of the proposed storage design. The measured code remains the protocol from commit 37fa8d3.

- Sorting: full-index unfiltered boundary p95 is 196.60 ms (O1), 243.86 ms (O2), 1714.93 ms (O3, two arms), and 1409.29 ms (O4, two arms). O3/O4 boundary plans sort the full matching set; several status-filtered pages also use a full-set Sort. First-page performance does not satisfy the boundary-page requirement.
- RLS: all five paired median ratios are below 1.10, but bypass access plans differ from RLS-disabled runtime plans for S2-KEYSET, S3 and S5. Some parallel off/on plans have buffer totals differing by one. Expectation 6 therefore fails independently of the favorable timing ratios.
- Backfill: the writer targets 50 operations/second but achieves 28.19 operations/second (2970 operations; p95 34.33 ms). Validation still returns exactly 0, 200, then 0.

| Resource safeguard | Observed value |
| --- | --- |
| Immediate pre-start load (1/5/15 min) | 8.01 / 5.74 / 4.74; five-minute value < 8 |
| Benchmark start load (1/5/15 min) | 8.65 / 5.91 / 4.81 |
| Benchmark end load (1/5/15 min) | 4.25 / 4.89 / 5.53 |
| Guard end load (1/5/15 min) | 4.23 / 4.88 / 5.52 |
| Minimum available disk | 13,658,928 KiB (13.03 GiB); stop threshold 10,485,760 KiB |
| Disk samples / maximum interval | 1277 / 5.61 seconds (required at most 10 seconds) |
| Guard observation duration | 6483.14 seconds |
| Exit / cleanup | Exit 0; owned cluster directory removed by runner finally |

## Delivery verification

After the full run, origin/main at 4fd5be2 was merged into this issue branch (44f2720). The measured second-protocol source files still match 37fa8d3 exactly. Targeted checks on the merged result pass:

- pnpm exec biome check scripts/bench/slots2*.ts: 11 files.
- node scripts/typecheck.mjs: all projects; stale generated route types were refreshed with pnpm exec next typegen in apps/web before the successful rerun.
- pnpm exec vitest run --project unit scripts/bench/slots2.test.ts scripts/bench/slots.test.ts: 15 tests.
- pnpm exec vitest run --project integration scripts/bench/slots2.int.test.ts scripts/bench/slots.int.test.ts: 12 tests.

The board's 2026-10-09 shared-machine rule supersedes this issue's older full-suite instruction. No full pnpm verify or browser suite was run here; the merge bot runs the full gate. No application, package or original benchmark data/query changes are introduced by this issue. Grok QA reviews the evidence and CTO decides the ADR.

## Environment

| Item | Value |
| --- | --- |
| version | PostgreSQL 18.4 on x86_64-apple-darwin24.6.0 |
| sharedBuffers | 128MB |
| workMem | 4MB |
| jit | on |
| cpus | 8 |
| architecture | arm64 |
| memoryGB | 16 |
| rows | 200000 |
| writes | 2000 |
| warmup | 5 |
| measure | 30 |
| seed | 1 |
| load average start (1/5/15 min) | 8.65 / 5.91 / 4.81 |
| load average end (1/5/15 min) | 4.25 / 4.89 / 5.53 |

Three rounds per read, each with warmup and measured batches: runtime role with RLS disabled, then immediately enabled. Summary selects the minimum RLS-on p95 round and retains that round's off/on pair. All rounds follow below. Writes run once. S7 and C are not loaded/measured. Off/on timing includes BEGIN, local tenant setting, query and COMMIT.

Index Cond is reported only for typed value predicates; pure sort evidence is ordered index access. A full-set Sort consumes an uncapped matching set, including a union whose arm limits are large enough to consume all matches. The predicate count removes pagination; its estimate is the unbounded predicate plan, never the Actual Rows of an early-stopped LIMIT scan. Plan equality means the access-plan shape and buffer total; the tenant InitPlan is omitted from that shape.

## 1. Exact bigint and late document reads

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4b / S2-OFFSET two step | 1 | 56.90 / 62.53 | 56.73 / 59.40 | 59.40–68.37 | 13784/13784 | yes | no | yes | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S3 | 2 | 7.58 / 8.63 | 7.17 / 8.77 | 8.77–13.26 | 9448/9448 | yes | no | yes | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 two step | 3 | 6.26 / 7.68 | 5.92 / 6.43 | 6.43–9.25 | 7884/7884 | yes | no | yes | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) | 2 | 194.77 / 341.30 | 156.89 / 167.15 | 167.15–182.37 | 123202/123202 | yes | no | yes | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) two step | 1 | 6.71 / 6.87 | 6.66 / 6.95 | 6.95–14.12 | 7818/7818 | yes | no | yes | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (b) | 3 | 0.79 / 1.10 | 0.72 / 1.09 | 1.09–1.27 | 18/18 | yes | no | no | yes | 17424 / 19802 | Index Scan slot_ix_num_1 |

## 2. Null sorting matrix

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4b / O1 plain first | 3 | 1.45 / 1.68 | 1.44 / 1.63 | 1.63–5.02 | 43/43 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 3 | 152.07 / 191.24 | 179.76 / 196.60 | 196.60–225.11 | 89426/89426 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 2 | 2.99 / 3.26 | 4.01 / 4.24 | 4.24–5.85 | 3768/3768 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 1 | 1.68 / 2.03 | 1.69 / 1.87 | 1.87–5.30 | 55/55 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 1 | 203.79 / 266.13 | 222.18 / 243.86 | 243.86–276.19 | 79111/79111 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 2 | 2.86 / 2.96 | 4.13 / 4.29 | 4.29–4.81 | 5101/5101 | no | yes | no | yes | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O3 plain first | 1 | 2.77 / 2.92 | 2.80 / 2.89 | 2.89–2.96 | 2209/2209 | yes | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first single alternate | 1 | 76.87 / 93.28 | 152.66 / 176.74 | 176.74–231.28 | 48436/48436 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 1 | 1583.25 / 2391.55 | 1548.63 / 1714.93 | 1714.93–1816.84 | 137776/137776 | yes | no | yes | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 3 | 840.76 / 975.69 | 852.76 / 967.33 | 967.33–1302.39 | 48436/48436 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 | 3 | 52.53 / 64.47 | 53.07 / 61.15 | 61.15–88.35 | 22253/22253 | yes | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 single alternate | 2 | 703.40 / 879.20 | 765.70 / 982.64 | 982.64–1138.89 | 48436/48436 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first | 3 | 2.62 / 2.86 | 2.75 / 2.92 | 2.92–5.25 | 213/213 | yes | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first single alternate | 1 | 66.27 / 101.44 | 143.40 / 181.96 | 181.96–277.55 | 48434/48434 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 3 | 1253.90 / 1515.35 | 1196.98 / 1409.29 | 1409.29–1525.08 | 106538/106538 | yes | no | yes | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 3 | 799.94 / 1135.64 | 852.50 / 1074.45 | 1074.45–1508.78 | 48434/48434 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 | 2 | 51.52 / 55.25 | 52.15 / 57.70 | 57.70–67.77 | 19867/19867 | yes | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 single alternate | 1 | 714.29 / 823.95 | 726.62 / 920.46 | 920.46–1146.43 | 48434/48434 | no | no | yes | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O1 status first | 1 | 1.59 / 1.81 | 1.59 / 1.79 | 1.79–2.02 | 728/728 | no | yes | no | yes | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status boundary | 3 | 55.92 / 93.70 | 57.13 / 62.80 | 62.80–89.80 | 13334/13335 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 3 | 52.67 / 82.13 | 53.38 / 60.42 | 60.42–91.81 | 13334/13334 | yes | no | yes | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status first | 2 | 1.81 / 2.06 | 1.63 / 1.95 | 1.95–2.00 | 667/667 | no | yes | no | yes | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status boundary | 1 | 51.32 / 95.09 | 57.88 / 61.95 | 61.95–100.72 | 13336/13335 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 1 | 48.08 / 57.95 | 53.44 / 57.92 | 57.92–75.74 | 13335/13335 | yes | no | yes | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 3 | 2.90 / 3.59 | 2.32 / 3.51 | 3.51–4.09 | 810/810 | yes | yes | no | yes | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 3 | 9.88 / 10.40 | 20.37 / 21.42 | 21.42–26.89 | 13296/13296 | yes | no | yes | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 1 | 96.45 / 106.77 | 97.19 / 105.99 | 105.99–113.67 | 26631/26631 | yes | no | yes | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 2 | 56.49 / 67.61 | 57.70 / 62.90 | 62.90–87.38 | 13335/13336 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 1 | 87.00 / 127.74 | 91.16 / 101.97 | 101.97–130.77 | 26011/26011 | yes | no | yes | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 3 | 46.90 / 54.16 | 54.67 / 60.68 | 60.68–65.70 | 13335/13336 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 2 | 2.51 / 3.63 | 2.57 / 2.68 | 2.68–2.84 | 853/853 | yes | yes | no | yes | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 3 | 8.99 / 11.43 | 19.39 / 19.83 | 19.83–21.81 | 13296/13296 | yes | no | yes | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 1 | 88.26 / 97.06 | 88.07 / 107.04 | 107.04–119.93 | 26631/26630 | yes | no | yes | no | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 2 | 45.73 / 63.69 | 53.74 / 59.65 | 59.65–75.14 | 13334/13335 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 1 | 87.28 / 95.76 | 86.22 / 98.54 | 98.54–231.56 | 25931/25931 | yes | no | yes | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 1 | 48.70 / 62.16 | 52.45 / 58.94 | 58.94–72.68 | 13334/13335 | yes | no | yes | no | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 plain first | 1 | 71.75 / 100.90 | 144.17 / 157.67 | 157.67–245.06 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 1 | 852.96 / 975.77 | 901.23 / 1075.13 | 1075.13–1198.12 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 2 | 702.80 / 856.14 | 752.41 / 918.17 | 918.17–1148.44 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 2 | 77.63 / 98.26 | 140.59 / 158.54 | 158.54–217.99 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 3 | 782.65 / 944.39 | 857.81 / 1004.91 | 1004.91–1378.98 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 1 | 743.49 / 1020.26 | 985.62 / 1219.98 | 1219.98–1307.61 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first | 1 | 2.73 / 2.89 | 2.69 / 3.02 | 3.02–4.41 | 2208/2208 | no | yes | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first single alternate | 2 | 82.45 / 124.87 | 148.17 / 172.60 | 172.60–226.88 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 1 | 1615.65 / 1823.85 | 1575.37 / 1725.34 | 1725.34–2234.57 | 137775/137775 | no | no | yes | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 2 | 837.86 / 960.68 | 898.60 / 975.11 | 975.11–1346.50 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 | 1 | 61.65 / 92.79 | 53.59 / 67.22 | 67.22–86.47 | 22252/22252 | no | yes | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 single alternate | 3 | 721.20 / 993.39 | 795.19 / 1069.29 | 1069.29–1233.65 | 48436/48436 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first | 1 | 2.13 / 2.42 | 2.17 / 2.40 | 2.40–2.95 | 213/213 | no | yes | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first single alternate | 3 | 89.23 / 146.10 | 140.87 / 191.82 | 191.82–258.90 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 2 | 1305.17 / 1625.02 | 1317.01 / 1536.17 | 1536.17–1610.59 | 106537/106537 | no | no | yes | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 1 | 803.33 / 930.53 | 801.92 / 878.12 | 878.12–1191.90 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 | 2 | 59.21 / 73.59 | 52.34 / 57.10 | 57.10–71.66 | 19867/19867 | no | yes | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 single alternate | 1 | 796.36 / 1125.54 | 876.87 / 1074.92 | 1074.92–1376.09 | 48434/48434 | no | no | yes | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 status first | 3 | 9.97 / 10.57 | 20.29 / 21.13 | 21.13–25.75 | 13297/13297 | yes | no | yes | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 3 | 56.74 / 76.42 | 64.03 / 68.45 | 68.45–80.95 | 13335/13335 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 3 | 48.54 / 72.41 | 55.94 / 61.83 | 61.83–67.82 | 13335/13335 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 2 | 10.11 / 12.72 | 20.59 / 22.19 | 22.19–25.49 | 13297/13297 | yes | no | yes | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 1 | 45.00 / 54.92 | 56.20 / 68.48 | 68.48–84.37 | 13336/13336 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 3 | 48.66 / 55.99 | 54.57 / 66.75 | 66.75–116.21 | 13336/13336 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 1 | 2.26 / 3.34 | 2.47 / 2.57 | 2.57–5.45 | 810/810 | yes | yes | no | yes | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 3 | 9.89 / 12.02 | 20.32 / 20.73 | 20.73–25.04 | 13297/13297 | yes | no | yes | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 3 | 105.25 / 131.33 | 107.25 / 131.95 | 131.95–158.35 | 26633/26633 | yes | no | yes | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 2 | 56.42 / 67.89 | 55.38 / 61.77 | 61.77–76.31 | 13336/13336 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 3 | 95.07 / 115.50 | 91.31 / 111.82 | 111.82–158.83 | 26013/26013 | yes | no | yes | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 1 | 53.95 / 58.75 | 53.58 / 62.67 | 62.67–83.52 | 13336/13336 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 2 | 2.33 / 2.39 | 2.46 / 2.54 | 2.54–2.62 | 853/853 | yes | yes | no | yes | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 1 | 9.08 / 9.88 | 19.37 / 19.88 | 19.88–25.42 | 13297/13297 | yes | no | yes | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 3 | 97.93 / 117.38 | 89.09 / 102.29 | 102.29–150.63 | 26632/26632 | yes | no | yes | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 1 | 50.99 / 69.11 | 57.06 / 80.61 | 80.61–99.09 | 13335/13335 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 1 | 100.83 / 127.43 | 89.28 / 116.31 | 116.31–144.02 | 25932/25932 | yes | no | yes | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 3 | 52.75 / 70.81 | 55.46 / 66.62 | 66.62–108.64 | 13335/13335 | yes | no | yes | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |

## 3. Full slots and skew

| Model | operation | key-share lock | median / p95 ms | WAL bytes/op |
| --- | --- | --- | ---: | ---: |
| A4b20 | S9 insert | no | 2.65 / 5.94 | 105088.03 |
| A4b20 | S9 update1 | no | 2.50 / 5.70 | 107085.17 |
| A4b20 | S9 update5 | no | 1.90 / 4.49 | 97373.66 |

| Model | table MB (TOAST included) | index MB | side rows |
| --- | ---: | ---: | ---: |
| A4b20 | 599.34 | 529.14 | — |

Historical MEP-96 A4 (10 assigned slots, not all values present): insert median/p95 4.71/10.97 ms, update1 p95 24.84 ms, WAL about 105 KB/operation. Historical load differs; same-run A4b/A5 figures below are the controlled comparison.

| field | slot |
| --- | --- |
| company | ix_text_1 |
| last_name | ix_text_2 |
| lead_status | ix_text_3 |
| lead_source | ix_text_4 |
| industry | ix_text_5 |
| rating | ix_text_6 |
| country | ix_text_7 |
| annual_revenue | ix_num_1 |
| cf_datetime_1 | ix_time_1 |
| cf_lookup_1 | ix_ref_1 |
| city | ix_text_8 |
| no_of_employees | ix_num_2 |
| cf_int_1 | ix_num_3 |
| cf_decimal_1 | ix_num_4 |
| report_created_at | ix_time_2 |
| cf_datetime_3 | ix_time_3 |
| cf_datetime_4 | ix_time_4 |
| cf_lookup_2 | ix_ref_2 |
| bench_ref_3 | ix_ref_3 |
| bench_ref_4 | ix_ref_4 |

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4b / skew hot first | 2 | 0.60 / 0.66 | 0.60 / 0.67 | 0.67–0.72 | 98/98 | no | yes | no | yes | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot count | 3 | 107.26 / 230.27 | 118.69 / 140.90 | 140.90–221.03 | 84528/84528 | no | no | no | yes | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew cold first | 3 | 1.11 / 1.15 | 1.10 / 1.19 | 1.19–1.23 | 136/136 | yes | no | yes | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold count | 3 | 0.78 / 0.91 | 0.74 / 0.81 | 0.81–1.54 | 190/190 | yes | no | no | yes | 103 / 198 | Index Only Scan slot_ix_text_8 |

## 4. Mixed organizations/modules

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4bmix / org1 leads unique | 1 | 0.67 / 0.85 | 0.60 / 0.65 | 0.65–0.73 | 5/5 | yes | no | yes | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 3 | 7.08 / 8.09 | 6.82 / 10.73 | 10.73–19.36 | 7904/7904 | yes | no | yes | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org2 leads skewed | 1 | 0.63 / 0.78 | 0.63 / 0.72 | 0.72–9.16 | 82/82 | no | no | no | yes | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org1 third hundred | 2 | 0.68 / 0.75 | 0.73 / 0.80 | 0.80–0.82 | 202/202 | yes | no | yes | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 1 | 0.51 / 0.62 | 0.54 / 0.58 | 0.58–0.62 | 5/5 | yes | no | yes | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five MCV | 3 | 0.62 / 0.70 | 0.64 / 0.74 | 0.74–0.82 | 221/221 | no | no | no | yes | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 2 | 0.58 / 0.66 | 0.61 / 0.67 | 0.67–0.73 | 82/82 | no | no | no | yes | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org1 third hundred MCV | 3 | 0.68 / 0.73 | 0.69 / 0.73 | 0.73–0.77 | 202/202 | yes | no | yes | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |

## 5. Module lock and backfill

| Model | operation | key-share lock | median / p95 ms | WAL bytes/op |
| --- | --- | --- | ---: | ---: |
| A4b | S9 insert | no | 2.43 / 5.08 | 103862.24 |
| A4b | S9 update1 | no | 1.98 / 4.00 | 103994.55 |
| A4b | S9 update5 | no | 1.75 / 3.50 | 99476.34 |
| A4b | S9 insert | yes | 2.84 / 5.74 | 103902.04 |
| A4b | S9 update1 | yes | 1.99 / 3.93 | 104063.04 |

| Backfill evidence | Value |
| --- | ---: |
| rows | 200000.00 |
| elapsedMs | 105360.93 |
| walBytes | 2919592840.00 |
| writerP95 | 34.33 |
| writerOperations | 2970.00 |
| writerHz | 28.19 |
| initialCount | 0.00 |
| initialMs | 3763.05 |
| corruptedCount | 200.00 |
| corruptedMs | 210.41 |
| repairedCount | 0.00 |
| repairedMs | 406.79 |

Assignment holds FOR UPDATE on the module row; every concurrent writer holds FOR KEY SHARE until commit. Owner-run 5,000-row batches derive the slot from the row's current document inside each UPDATE. Verification uses IS DISTINCT FROM. WAL includes the concurrent writer. Corruption uses 100 populated rows set NULL and 100 set to a wrong value.

## 6. Indexed-value side table

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4b / S2 | 3 | 1.39 / 1.64 | 1.38 / 1.48 | 1.48–1.68 | 1033/1033 | no | yes | no | yes | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2-KEYSET | 3 | 2.51 / 3.26 | 2.44 / 2.65 | 2.65–4.85 | 1179/1179 | yes | yes | no | yes | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 1 | 159.11 / 192.52 | 153.06 / 164.26 | 164.26–188.59 | 94098/94098 | yes | no | yes | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S5 | 3 | 1.79 / 1.98 | 1.77 / 1.97 | 1.97–3.84 | 893/893 | yes | no | yes | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S11 | 3 | 0.70 / 0.82 | 0.75 / 0.85 | 0.85–0.95 | 7/7 | yes | no | yes | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S2 count | 3 | 2.53 / 2.59 | 2.73 / 2.85 | 2.85–3.30 | 6588/6588 | yes | no | no | yes | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A5 / S2 | 3 | 234.21 / 293.19 | 221.52 / 232.08 | 232.08–265.49 | 153072/153072 | yes | no | yes | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 2 | 202.86 / 235.30 | 198.73 / 217.38 | 217.38–248.73 | 132012/132012 | yes | no | yes | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 1 | 247.61 / 273.14 | 249.79 / 265.10 | 265.10–297.81 | 153072/153072 | yes | no | yes | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S3 | 3 | 34.65 / 50.73 | 33.65 / 34.25 | 34.25–44.11 | 16013/16013 | yes | no | yes | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S5 | 3 | 7.33 / 7.76 | 7.59 / 7.92 | 7.92–9.19 | 5727/5727 | yes | no | yes | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S11 | 1 | 0.97 / 1.21 | 0.73 / 0.78 | 0.78–1.11 | 16/16 | yes | no | yes | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S14 (b) | 2 | 0.97 / 1.04 | 1.00 / 1.07 | 1.07–1.14 | 205/205 | yes | no | no | yes | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S2 count | 3 | 57.50 / 63.94 | 58.22 / 59.60 | 59.60–96.77 | 53923/53923 | yes | yes | no | yes | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |

| Model | operation | key-share lock | median / p95 ms | WAL bytes/op |
| --- | --- | --- | ---: | ---: |
| A4b | S9 insert | no | 2.43 / 5.08 | 103862.24 |
| A4b | S9 update1 | no | 1.98 / 4.00 | 103994.55 |
| A4b | S9 update5 | no | 1.75 / 3.50 | 99476.34 |
| A5 | S9 insert | no | 2.02 / 3.12 | 51253.77 |
| A5 | S9 update1 | no | 1.36 / 1.85 | 23664.83 |
| A5 | S9 update5 | no | 1.50 / 2.16 | 26065.39 |
| A4b | S9 insert | yes | 2.84 / 5.74 | 103902.04 |
| A4b | S9 update1 | yes | 1.99 / 3.93 | 104063.04 |
| A4b20 | S9 insert | no | 2.65 / 5.94 | 105088.03 |
| A4b20 | S9 update1 | no | 2.50 / 5.70 | 107085.17 |
| A4b20 | S9 update5 | no | 1.90 / 4.49 | 97373.66 |
| A520 | S9 insert | no | 4.75 / 9.39 | 127953.96 |
| A520 | S9 update1 | no | 1.70 / 2.59 | 27436.21 |
| A520 | S9 update5 | no | 1.68 / 2.29 | 30380.26 |

| Model | table MB (TOAST included) | index MB | side rows |
| --- | ---: | ---: | ---: |
| A4b | 489.89 | 515.65 | — |
| A5 | 645.51 | 378.26 | 1706353 |
| A4b20 | 599.34 | 529.14 | — |
| A520 | 1020.44 | 925.41 | 4690522 |

A5 uses exactly the same document seed, assigned fields, missing-value distribution, write IDs/patches, event payload and runtime role as A4b; A520 uses the same filled 20-field documents as A4b20. Missing values have no side row. The primary key is (organization_id,record_id,field_id); four partial value indexes start with organization_id,module_id,field_id and end with record_id. Both tables enforce the same tenant policy.

## 7. Single read, aggregates and paired RLS

| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| A4b / S8 | 3 | 0.44 / 0.47 | 0.48 / 0.52 | 0.52–0.61 | 4/4 | no | no | no | yes | 1 / 1 | Index Scan records_pkey |
| A3 / S10 source | 2 | 93.24 / 110.35 | 92.94 / 100.20 | 100.20–173.60 | 109566/109532 | no | no | yes | no | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| B1 / S10 source | 1 | 52.24 / 56.90 | 53.24 / 56.95 | 56.95–71.44 | 38460/38460 | no | no | yes | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| A4b / S10 source | 2 | 30.24 / 33.16 | 27.87 / 31.58 | 31.58–39.69 | 10428/10428 | yes | no | yes | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A3 / S10 owner | 2 | 96.77 / 142.18 | 98.27 / 129.56 | 129.56–149.95 | 109582/109548 | no | no | yes | no | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| B1 / S10 owner | 2 | 56.62 / 99.31 | 56.81 / 81.69 | 81.69–98.91 | 38476/38476 | no | no | yes | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| A4b / S10 owner | 3 | 36.25 / 36.55 | 37.30 / 37.91 | 37.91–45.24 | 10428/10428 | yes | no | yes | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |

| scenario | median paired on/off ratio | bypass access plan = RLS-disabled access plan |
| --- | ---: | --- |
| S2-KEYSET | 0.876 | no |
| S3 | 0.985 | no |
| S5 | 0.198 | no |
| S11 | 0.756 | yes |
| S14 (b) | 0.998 | yes |

The paired protocol runs 30 pairs after warmup with identical parameters, bypass role first and runtime RLS role immediately afterwards. Each scenario separately checks the bypass plan against a runtime RLS-disabled plan. S10 keeps the original 12-month created-at window: A4b projects that timestamp to ix_time_2 only for this read comparison, uses ix_text_4 for source and exact sum(ix_num_1)/100 for totals; the extra timestamp projection is removed before writes.

## Acceptance expectations

| rule | result | evidence |
| --- | --- | --- |
| 1 | met | S3/S14(b): Index Cond, p95 ≤100 ms; all exact comparisons |
| 2 | not met | O1–O4, full indexes, both filters and all pages; ordered access and no full-set Sort |
| 3 | met | 20 populated slots: insert/update1/update5 p95 ≤15 ms |
| 4 | met | Concurrent backfill: 0 → exactly 200 → 0 mismatches |
| 5 | met | S8 p95 ≤5 ms; S10 source/owner p95 ≤1000 ms |
| 6 | not met | All A4b off/on access plans and buffers equal in all rounds; paired ratio median ≤1.10 |

## SQL used

### A4b S2

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3 order by ix_text_1 asc nulls last, bench_slot.records.id asc limit 50
```

### A4b S2-KEYSET

```sql
select id, last_name, company, email, phone, lead_status, owner_id, created_at, annual_revenue
      from ((select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue, ix_text_1
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3 and ((ix_text_1), bench_slot.records.id) > ($4::text collate "und-x-icu", $5::uuid) order by (ix_text_1) asc, bench_slot.records.id asc limit 50) union all (select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue, ix_text_1
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3 and (ix_text_1) is null order by bench_slot.records.id asc limit 50)) page
      order by ix_text_1 asc nulls last, id asc
      limit 50
```

### A4b S2-OFFSET

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3 order by ix_text_1 asc nulls last, bench_slot.records.id asc limit 50 offset $4::int
```

### S2-OFFSET two step

```sql
with page as materialized (
    select bench_slot.records.id,ix_text_1 as sort_key from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3 order by ix_text_1 asc nulls last, bench_slot.records.id asc limit 50 offset $4::int
  ) select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from page p cross join lateral (
    select * from bench_slot.records where organization_id=$1::uuid and id=p.id offset 0
  ) r order by p.sort_key asc nulls last,p.id asc
```

### A4b S3

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and owner_id = $3::uuid
      and ix_time_1 >= $4::timestamptz
      and ix_time_1 < $5::timestamptz
      and ix_num_1 >= $6::bigint order by ix_num_1 desc nulls last, bench_slot.records.id desc limit 50
```

### S3 two step

```sql
with page as materialized (
    select bench_slot.records.id,ix_num_1 as sort_key from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and owner_id = $3::uuid
      and ix_time_1 >= $4::timestamptz
      and ix_time_1 < $5::timestamptz
      and ix_num_1 >= $6::bigint order by ix_num_1 desc nulls last, bench_slot.records.id desc limit 50
  ) select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from page p cross join lateral (
    select * from bench_slot.records where organization_id=$1::uuid and id=p.id offset 0
  ) r order by p.sort_key desc nulls last,p.id desc
```

### A4b S5

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (((ix_text_5) = any($3::text[]) or (ix_text_6) = $4) and (ix_text_7) = $5) order by updated_at desc, bench_slot.records.id desc limit 50
```

### A4b S11

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and ix_ref_1 = $3::uuid order by created_at desc, bench_slot.records.id desc limit 50
```

### A4b S14 (a)

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and ix_num_1 >= $3::bigint order by ix_num_1 desc nulls last, bench_slot.records.id asc limit 50
```

### S14 (a) two step

```sql
with page as materialized (
    select bench_slot.records.id,ix_num_1 as sort_key from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and ix_num_1 >= $3::bigint order by ix_num_1 desc nulls last, bench_slot.records.id asc limit 50
  ) select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from page p cross join lateral (
    select * from bench_slot.records where organization_id=$1::uuid and id=p.id offset 0
  ) r order by p.sort_key desc nulls last,p.id asc
```

### A4b S14 (b)

```sql
select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->>'annual_revenue')::numeric as annual_revenue
    from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and ix_num_1 >= $3::bigint order by ix_num_1 desc, bench_slot.records.id desc limit 50
```

### A4b S2 count

```sql
select count(*)::int as n from (select 1 from bench_slot.records where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and (ix_text_3) = $3) s
```

### A4b S8

```sql
select id::text, organization_id::text, module_id::text, owner_id::text,
          created_by::text, updated_by::text, created_at, updated_at, deleted_at,
          version, name, search, data
        from bench_slot.records where id = $1::uuid and organization_id=$2::uuid
```

### A5 S2

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r left join bench_side.record_index co
    on co.organization_id=r.organization_id and co.module_id=r.module_id
    and co.record_id=r.id and co.field_id=$5::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$4::uuid and e.v_text=$3::text) order by co.v_text asc nulls last,r.id asc limit 50
```

### A5 S2-KEYSET

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r left join bench_side.record_index co
    on co.organization_id=r.organization_id and co.module_id=r.module_id
    and co.record_id=r.id and co.field_id=$5::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$4::uuid and e.v_text=$3::text) and ((co.v_text,r.id)>($7::text collate "und-x-icu",$6::uuid) or co.v_text is null) order by co.v_text asc nulls last,r.id asc limit 50
```

### A5 S2-OFFSET

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r left join bench_side.record_index co
    on co.organization_id=r.organization_id and co.module_id=r.module_id
    and co.record_id=r.id and co.field_id=$5::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$4::uuid and e.v_text=$3::text) order by co.v_text asc nulls last,r.id asc limit 50 offset $6::int
```

### A5 S3

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r join bench_side.record_index rev
    on rev.organization_id=r.organization_id and rev.module_id=r.module_id
    and rev.record_id=r.id and rev.field_id=$3::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and rev.v_num>=$4::bigint and r.owner_id=$5::uuid and exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$8::uuid and e.v_time>=$6::timestamptz and e.v_time<$7::timestamptz) order by rev.v_num desc nulls last,r.id desc limit 50
```

### A5 S5

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r join bench_side.record_index country
    on country.organization_id=r.organization_id and country.module_id=r.module_id
    and country.record_id=r.id and country.field_id=$3::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and country.v_text=$4::text and (exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$7::uuid and e.v_text=any($5::text[]))
      or exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$8::uuid and e.v_text=$6::text)) order by r.updated_at desc,r.id desc limit 50
```

### A5 S11

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r join bench_side.record_index ref
    on ref.organization_id=r.organization_id and ref.module_id=r.module_id
    and ref.record_id=r.id and ref.field_id=$3::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and ref.v_ref=$4::uuid order by r.created_at desc,r.id desc limit 50
```

### A5 S14 (b)

```sql
select r.id::text as id,r.data->>'last_name' as last_name,
    r.data->>'company' as company,r.data->>'email' as email,
    r.data->>'phone' as phone,r.data->>'lead_status' as lead_status,
    r.owner_id::text as owner_id,r.created_at,
    (r.data->>'annual_revenue')::numeric as annual_revenue from bench_side.records r join bench_side.record_index rev
    on rev.organization_id=r.organization_id and rev.module_id=r.module_id
    and rev.record_id=r.id and rev.field_id=$3::uuid where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and rev.v_num>=$4::bigint order by rev.v_num desc,r.id desc limit 50
```

### A5 S2 count

```sql
select count(*)::int as n from bench_side.records r  where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null and exists(select 1 from bench_side.record_index e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=$4::uuid and e.v_text=$3::text)
```

### O3 two arms

```sql
select * from ((select r.*,0 as part from bench_slot.records r where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null
    and r.ix_text_1 is not null order by r.ix_text_1 desc,r.id desc limit ($3::int+51)) union all (select r.*,1 as part from bench_slot.records r where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null
    and r.ix_text_1 is null order by r.id desc limit ($3::int+51))) q
    order by q.part,q.ix_text_1 desc nulls last,q.id desc limit 51 offset $3::int
```

### O4 two arms

```sql
select * from ((select r.*,1 as part from bench_slot.records r where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null
    and r.ix_text_1 is not null order by r.ix_text_1 asc,r.id asc limit ($3::int+51)) union all (select r.*,0 as part from bench_slot.records r where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null
    and r.ix_text_1 is null order by r.id asc limit ($3::int+51))) q
    order by q.part,q.ix_text_1 asc nulls first,q.id asc limit 51 offset $3::int
```

### A3 S10 source

```sql
select (data->>'lead_source') collate "und-x-icu" as lead_source, null::text as owner_id, count(*)::int as n,
        coalesce(sum((data->'annual_revenue')::numeric), 0)::numeric(16,2) as revenue
      from bench_a.records
      where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and created_at >= $3::timestamptz and created_at < $4::timestamptz
      group by (data->>'lead_source') collate "und-x-icu"
      order by (data->>'lead_source') collate "und-x-icu" asc nulls last
```

### B1 S10 source

```sql
select lead_source as lead_source, null::text as owner_id, count(*)::int as n,
        coalesce(sum(annual_revenue), 0)::numeric(16,2) as revenue
      from bench_b.leads
      where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and created_at >= $3::timestamptz and created_at < $4::timestamptz
      group by lead_source
      order by lead_source asc nulls last
```

### A4b S10 source

```sql
select ix_text_4 as lead_source,null::text as owner_id,
    count(*)::int as n,(coalesce(sum(ix_num_1),0)/100::numeric)::numeric(38,2) as revenue from bench_slot.records
    where organization_id=$1::uuid and module_id=$2::uuid and deleted_at is null
    and ix_time_2>=$3::timestamptz and ix_time_2<$4::timestamptz
    group by ix_text_4 order by ix_text_4 asc nulls last
```

### A3 S10 owner

```sql
select (data->>'lead_source') collate "und-x-icu" as lead_source, owner_id::text as owner_id, count(*)::int as n,
        coalesce(sum((data->'annual_revenue')::numeric), 0)::numeric(16,2) as revenue
      from bench_a.records
      where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and created_at >= $3::timestamptz and created_at < $4::timestamptz
      group by (data->>'lead_source') collate "und-x-icu", owner_id
      order by (data->>'lead_source') collate "und-x-icu" asc nulls last, owner_id asc nulls last
```

### B1 S10 owner

```sql
select lead_source as lead_source, owner_id::text as owner_id, count(*)::int as n,
        coalesce(sum(annual_revenue), 0)::numeric(16,2) as revenue
      from bench_b.leads
      where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and created_at >= $3::timestamptz and created_at < $4::timestamptz
      group by lead_source, owner_id
      order by lead_source asc nulls last, owner_id asc nulls last
```

### A4b S10 owner

```sql
select ix_text_4 as lead_source,owner_id::text as owner_id,
    count(*)::int as n,(coalesce(sum(ix_num_1),0)/100::numeric)::numeric(38,2) as revenue from bench_slot.records
    where organization_id=$1::uuid and module_id=$2::uuid and deleted_at is null
    and ix_time_2>=$3::timestamptz and ix_time_2<$4::timestamptz
    group by ix_text_4,owner_id order by ix_text_4 asc nulls last,owner_id asc nulls last
```

## Checks

| check | pass | detail |
| --- | --- | --- |
| runtime role neither superuser nor bypass | yes | bench_app; same role and tenant predicate as MEP-96 |
| A4b.records unset tenant | yes | visible=0 |
| A4b.events unset tenant | yes | visible=0 |
| A4b.modules unset tenant | yes | visible=0 |
| A4b foreign read | yes | visible=0 |
| A4b foreign update | yes | affected=0 |
| A4b foreign insert | yes | SQLSTATE=42501 |
| A5.records unset tenant | yes | visible=0 |
| A5.events unset tenant | yes | visible=0 |
| A5.modules unset tenant | yes | visible=0 |
| A5.record_index unset tenant | yes | visible=0 |
| A5 foreign read | yes | visible=0 |
| A5 foreign update | yes | affected=0 |
| A5 foreign insert | yes | SQLSTATE=42501 |
| A5 foreign indexed values | yes | visible=0 |
| A5 foreign indexed insert | yes | SQLSTATE=42501 |
| exact = 1234567890123456.005 | yes | count=0; ordered identity digest compared |
| exact <> 1234567890123456.005 | yes | count=119458; ordered identity digest compared |
| exact < 1234567890123456.005 | yes | count=117466; ordered identity digest compared |
| exact <= 1234567890123456.005 | yes | count=117466; ordered identity digest compared |
| exact > 1234567890123456.005 | yes | count=1992; ordered identity digest compared |
| exact >= 1234567890123456.005 | yes | count=1992; ordered identity digest compared |
| exact = 1234567890123456.01 | yes | count=1; ordered identity digest compared |
| exact <> 1234567890123456.01 | yes | count=119457; ordered identity digest compared |
| exact < 1234567890123456.01 | yes | count=117466; ordered identity digest compared |
| exact <= 1234567890123456.01 | yes | count=117467; ordered identity digest compared |
| exact > 1234567890123456.01 | yes | count=1991; ordered identity digest compared |
| exact >= 1234567890123456.01 | yes | count=1992; ordered identity digest compared |
| exact = 0 | yes | count=2; ordered identity digest compared |
| exact <> 0 | yes | count=119456; ordered identity digest compared |
| exact < 0 | yes | count=4; ordered identity digest compared |
| exact <= 0 | yes | count=6; ordered identity digest compared |
| exact > 0 | yes | count=119452; ordered identity digest compared |
| exact >= 0 | yes | count=119454; ordered identity digest compared |
| exact = -1234567890123456.005 | yes | count=0; ordered identity digest compared |
| exact <> -1234567890123456.005 | yes | count=119458; ordered identity digest compared |
| exact < -1234567890123456.005 | yes | count=2; ordered identity digest compared |
| exact <= -1234567890123456.005 | yes | count=2; ordered identity digest compared |
| exact > -1234567890123456.005 | yes | count=119456; ordered identity digest compared |
| exact >= -1234567890123456.005 | yes | count=119456; ordered identity digest compared |
| exact = -0.001 | yes | count=0; ordered identity digest compared |
| exact <> -0.001 | yes | count=119458; ordered identity digest compared |
| exact < -0.001 | yes | count=4; ordered identity digest compared |
| exact <= -0.001 | yes | count=4; ordered identity digest compared |
| exact > -0.001 | yes | count=119454; ordered identity digest compared |
| exact >= -0.001 | yes | count=119454; ordered identity digest compared |
| exact = 1.001 | yes | count=0; ordered identity digest compared |
| exact <> 1.001 | yes | count=119458; ordered identity digest compared |
| exact < 1.001 | yes | count=7; ordered identity digest compared |
| exact <= 1.001 | yes | count=7; ordered identity digest compared |
| exact > 1.001 | yes | count=119451; ordered identity digest compared |
| exact >= 1.001 | yes | count=119451; ordered identity digest compared |
| exact = 92233720368547758.08 | yes | count=0; ordered identity digest compared |
| exact <> 92233720368547758.08 | yes | count=119458; ordered identity digest compared |
| exact < 92233720368547758.08 | yes | count=119458; ordered identity digest compared |
| exact <= 92233720368547758.08 | yes | count=119458; ordered identity digest compared |
| exact > 92233720368547758.08 | yes | count=0; ordered identity digest compared |
| exact >= 92233720368547758.08 | yes | count=0; ordered identity digest compared |
| exact = -92233720368547758.09 | yes | count=0; ordered identity digest compared |
| exact <> -92233720368547758.09 | yes | count=119458; ordered identity digest compared |
| exact < -92233720368547758.09 | yes | count=0; ordered identity digest compared |
| exact <= -92233720368547758.09 | yes | count=0; ordered identity digest compared |
| exact > -92233720368547758.09 | yes | count=119458; ordered identity digest compared |
| exact >= -92233720368547758.09 | yes | count=119458; ordered identity digest compared |
| write rejects third decimal place | yes | 1.001 is rejected before executing a write; no rounding |
| negative zero write | yes | scaledWrite(-0)=0 |
| S2 A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S2 A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S2-KEYSET A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 0 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 1 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 2 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 3 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 4 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 5 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 6 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 7 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 8 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 9 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 10 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 11 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 12 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 13 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 14 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 15 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 16 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 17 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 18 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 19 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 20 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 21 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 22 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 23 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 24 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 25 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 26 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 27 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 28 | yes | left=50; right=50; projected rows |
| S2-OFFSET A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S2-OFFSET late document parameters 29 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S3 late document parameters 0 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S3 late document parameters 1 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S3 late document parameters 2 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S3 late document parameters 3 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S3 late document parameters 4 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S3 late document parameters 5 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S3 late document parameters 6 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S3 late document parameters 7 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S3 late document parameters 8 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S3 late document parameters 9 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S3 late document parameters 10 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S3 late document parameters 11 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S3 late document parameters 12 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S3 late document parameters 13 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S3 late document parameters 14 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S3 late document parameters 15 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S3 late document parameters 16 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S3 late document parameters 17 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S3 late document parameters 18 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S3 late document parameters 19 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S3 late document parameters 20 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S3 late document parameters 21 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S3 late document parameters 22 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S3 late document parameters 23 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S3 late document parameters 24 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S3 late document parameters 25 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S3 late document parameters 26 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S3 late document parameters 27 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S3 late document parameters 28 | yes | left=50; right=50; projected rows |
| S3 A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S3 late document parameters 29 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 15 | yes | left=46; right=46; projected rows |
| S5 A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S5 A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S11 A5/A4b parameters 0 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 1 | yes | left=6; right=6; projected rows |
| S11 A5/A4b parameters 2 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 3 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 4 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 5 | yes | left=4; right=4; projected rows |
| S11 A5/A4b parameters 6 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 7 | yes | left=1; right=1; projected rows |
| S11 A5/A4b parameters 8 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 9 | yes | left=4; right=4; projected rows |
| S11 A5/A4b parameters 10 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 11 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 12 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 13 | yes | left=4; right=4; projected rows |
| S11 A5/A4b parameters 14 | yes | left=1; right=1; projected rows |
| S11 A5/A4b parameters 15 | yes | left=2; right=2; projected rows |
| S11 A5/A4b parameters 16 | yes | left=4; right=4; projected rows |
| S11 A5/A4b parameters 17 | yes | left=6; right=6; projected rows |
| S11 A5/A4b parameters 18 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 19 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 20 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 21 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 22 | yes | left=6; right=6; projected rows |
| S11 A5/A4b parameters 23 | yes | left=1; right=1; projected rows |
| S11 A5/A4b parameters 24 | yes | left=5; right=5; projected rows |
| S11 A5/A4b parameters 25 | yes | left=4; right=4; projected rows |
| S11 A5/A4b parameters 26 | yes | left=2; right=2; projected rows |
| S11 A5/A4b parameters 27 | yes | left=3; right=3; projected rows |
| S11 A5/A4b parameters 28 | yes | left=2; right=2; projected rows |
| S11 A5/A4b parameters 29 | yes | left=3; right=3; projected rows |
| S14 (a) A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 0 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 1 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 2 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 3 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 4 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 5 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 6 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 7 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 8 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 9 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 10 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 11 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 12 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 13 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 14 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 15 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 16 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 17 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 18 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 19 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 20 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 21 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 22 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 23 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 24 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 25 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 26 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 27 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 28 | yes | left=50; right=50; projected rows |
| S14 (a) A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S14 (a) late document parameters 29 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 0 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 1 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 2 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 3 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 4 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 5 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 6 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 7 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 8 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 9 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 10 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 11 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 12 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 13 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 14 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 15 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 16 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 17 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 18 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 19 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 20 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 21 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 22 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 23 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 24 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 25 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 26 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 27 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 28 | yes | left=50; right=50; projected rows |
| S14 (b) A5/A4b parameters 29 | yes | left=50; right=50; projected rows |
| S2 count A5/A4b parameters 0 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 1 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 2 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 3 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 4 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 5 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 6 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 7 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 8 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 9 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 10 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 11 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 12 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 13 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 14 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 15 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 16 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 17 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 18 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 19 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 20 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 21 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 22 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 23 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 24 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 25 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 26 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 27 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 28 | yes | left=1; right=1; projected rows |
| S2 count A5/A4b parameters 29 | yes | left=1; right=1; projected rows |
| S8 A5/A4b parameters 0 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 1 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 2 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 3 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 4 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 5 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 6 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 7 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 8 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 9 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 10 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 11 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 12 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 13 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 14 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 15 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 16 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 17 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 18 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 19 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 20 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 21 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 22 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 23 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 24 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 25 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 26 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 27 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 28 | yes | left=1; right=1; identity/order or count |
| S8 A5/A4b parameters 29 | yes | left=1; right=1; identity/order or count |
| matrix NULL share 10–50% | yes | empty=78357; total=198015 |
| A5 absence O1 first | yes | left=51; right=51; identity/order or count |
| A5 absence O1 boundary | yes | left=51; right=51; identity/order or count |
| A5 absence O1 offset5000 | yes | left=51; right=51; identity/order or count |
| A4b O3 false first two arms | yes | left=51; right=51; identity/order or count |
| A5 absence O3 first | yes | left=51; right=51; identity/order or count |
| A4b O3 false boundary two arms | yes | left=51; right=51; identity/order or count |
| A5 absence O3 boundary | yes | left=51; right=51; identity/order or count |
| A4b O3 false offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A5 absence O3 offset5000 | yes | left=51; right=51; identity/order or count |
| A4b O4 false first two arms | yes | left=51; right=51; identity/order or count |
| A4b O4 false boundary two arms | yes | left=51; right=51; identity/order or count |
| A4b O4 false offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4b O3 true first two arms | yes | left=51; right=51; identity/order or count |
| A4b O3 true boundary two arms | yes | left=51; right=51; identity/order or count |
| A4b O3 true offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4b O4 true first two arms | yes | left=51; right=51; identity/order or count |
| A4b O4 true boundary two arms | yes | left=51; right=51; identity/order or count |
| A4b O4 true offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 false first two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 false boundary two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 false offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 false first two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 false boundary two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 false offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 true first two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 true boundary two arms | yes | left=51; right=51; identity/order or count |
| A4bn O3 true offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 true first two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 true boundary two arms | yes | left=51; right=51; identity/order or count |
| A4bn O4 true offset5000 two arms | yes | left=51; right=51; identity/order or count |
| A5 absence is null | yes | left=51; right=51; identity/order or count |
| A5 absence is not null | yes | left=51; right=51; identity/order or count |
| S10 source exact aggregate vs A3 | yes | left=18; right=18; projected rows |
| S10 owner exact aggregate vs A3 | yes | left=180; right=180; projected rows |
| A4b write consistency | yes | mismatches=0 |
| A4b event atomicity | yes | events=6000 |
| A5 write consistency company | yes | mismatches=0 |
| A5 write consistency last_name | yes | mismatches=0 |
| A5 write consistency lead_status | yes | mismatches=0 |
| A5 write consistency lead_source | yes | mismatches=0 |
| A5 write consistency industry | yes | mismatches=0 |
| A5 write consistency rating | yes | mismatches=0 |
| A5 write consistency country | yes | mismatches=0 |
| A5 write consistency annual_revenue | yes | mismatches=0 |
| A5 write consistency cf_datetime_1 | yes | mismatches=0 |
| A5 write consistency cf_lookup_1 | yes | mismatches=0 |
| A5 event atomicity | yes | events=6000 |
| A4b write consistency locked | yes | mismatches=0 |
| A4b event atomicity locked | yes | events=4000 |
| A4b20.records unset tenant | yes | visible=0 |
| A4b20.events unset tenant | yes | visible=0 |
| A4b20.modules unset tenant | yes | visible=0 |
| A4b20 foreign read | yes | visible=0 |
| A4b20 foreign update | yes | affected=0 |
| A4b20 foreign insert | yes | SQLSTATE=42501 |
| 20 slots populated | yes | incomplete Leads=0 |
| A4b20 write consistency | yes | mismatches=0 |
| A4b20 event atomicity | yes | events=6000 |
| A520.records unset tenant | yes | visible=0 |
| A520.events unset tenant | yes | visible=0 |
| A520.modules unset tenant | yes | visible=0 |
| A520.record_index unset tenant | yes | visible=0 |
| A520 foreign read | yes | visible=0 |
| A520 foreign update | yes | affected=0 |
| A520 foreign insert | yes | SQLSTATE=42501 |
| A520 foreign indexed values | yes | visible=0 |
| A520 foreign indexed insert | yes | SQLSTATE=42501 |
| A520 write consistency company | yes | mismatches=0 |
| A520 write consistency last_name | yes | mismatches=0 |
| A520 write consistency lead_status | yes | mismatches=0 |
| A520 write consistency lead_source | yes | mismatches=0 |
| A520 write consistency industry | yes | mismatches=0 |
| A520 write consistency rating | yes | mismatches=0 |
| A520 write consistency country | yes | mismatches=0 |
| A520 write consistency annual_revenue | yes | mismatches=0 |
| A520 write consistency cf_datetime_1 | yes | mismatches=0 |
| A520 write consistency cf_lookup_1 | yes | mismatches=0 |
| A520 write consistency city | yes | mismatches=0 |
| A520 write consistency no_of_employees | yes | mismatches=0 |
| A520 write consistency cf_int_1 | yes | mismatches=0 |
| A520 write consistency cf_decimal_1 | yes | mismatches=0 |
| A520 write consistency report_created_at | yes | mismatches=0 |
| A520 write consistency cf_datetime_3 | yes | mismatches=0 |
| A520 write consistency cf_datetime_4 | yes | mismatches=0 |
| A520 write consistency cf_lookup_2 | yes | mismatches=0 |
| A520 write consistency bench_ref_3 | yes | mismatches=0 |
| A520 write consistency bench_ref_4 | yes | mismatches=0 |
| A520 event atomicity | yes | events=6000 |
| backfill initial | yes | count=0; expected=0 |
| backfill corrupted | yes | count=200; expected=200 |
| backfill repaired | yes | count=0; expected=0 |

## Notes

- The main organization has 200,000 baseline Leads at full scale plus a separate 2,000-row precision cohort. Contacts and second-organization Leads each retain the baseline 25% scale. The backfill targets exactly the original 200,000 rows, including soft-deleted records. A3/B1 data and SQL are unchanged; their report comparison excludes the precision cohort.
- Double precision differs from exact numeric in 39/48 ordered comparisons. The paired 16-digit amounts collapse at binary floating point precision.
- Sort field: company / ix_text_1. NULL share 39.571% (78357/198015 live rows, including precision cohort).
- Mixed communities: lead company is nearly unique, Contacts have five values, the second organization is skewed 80/20, third module has 100 values. MCV trigger (>10x predicate estimate/count)=true. No other planner tuning.
- bigint leakproof catalog (MEP-96 flags verified and completed): < / int8lt / true; <= / int8le / true; = / int8eq / true; > / int8gt / true; >= / int8ge / true.

## All read rounds

| model / scenario | round | RLS | median / p95 ms | buffers | Index Cond | ordered | full Sort | est / predicate count | plan |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- |
| A4b / S2 | 1 | off | 1.21 / 1.48 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2 | 1 | on | 1.40 / 1.56 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2 | 2 | off | 1.39 / 1.55 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2 | 2 | on | 1.40 / 1.68 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2 | 3 | off | 1.39 / 1.64 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2 | 3 | on | 1.38 / 1.48 | 1033 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / S2-KEYSET | 1 | off | 2.76 / 7.50 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-KEYSET | 1 | on | 2.47 / 4.85 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-KEYSET | 2 | off | 2.37 / 2.55 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-KEYSET | 2 | on | 2.43 / 3.12 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-KEYSET | 3 | off | 2.51 / 3.26 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-KEYSET | 3 | on | 2.44 / 2.65 | 1179 | yes | yes | no | 6226 / 8207 | Incremental Sort; Subquery Scan; Index Scan slot_ix_text_1; Sort; Subquery Scan; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 1 | off | 159.11 / 192.52 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 1 | on | 153.06 / 164.26 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 2 | off | 155.14 / 162.75 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 2 | on | 170.84 / 188.59 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 3 | off | 153.27 / 158.49 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET | 3 | on | 154.40 / 168.14 | 94098 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / S2-OFFSET two step | 1 | off | 56.90 / 62.53 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S2-OFFSET two step | 1 | on | 56.73 / 59.40 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S2-OFFSET two step | 2 | off | 56.73 / 63.14 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S2-OFFSET two step | 2 | on | 56.51 / 61.11 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S2-OFFSET two step | 3 | off | 55.56 / 68.42 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S2-OFFSET two step | 3 | on | 57.86 / 68.37 | 13784 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3; CTE Scan; Index Scan records_pkey |
| A4b / S3 | 1 | off | 8.95 / 10.88 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 | 1 | on | 8.52 / 9.62 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 | 2 | off | 7.58 / 8.63 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 | 2 | on | 7.17 / 8.77 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 | 3 | off | 7.36 / 8.88 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 | 3 | on | 8.82 / 13.26 | 9448 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1 |
| A4b / S3 two step | 1 | off | 6.58 / 11.02 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S3 two step | 1 | on | 6.21 / 9.25 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S3 two step | 2 | off | 7.01 / 8.82 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S3 two step | 2 | on | 5.38 / 6.61 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S3 two step | 3 | off | 6.26 / 7.68 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S3 two step | 3 | on | 5.92 / 6.43 | 7884 | yes | no | yes | 204 / 313 | Sort; Index Scan slot_ix_time_1; CTE Scan; Index Scan records_pkey |
| A4b / S5 | 1 | off | 3.24 / 5.75 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S5 | 1 | on | 1.93 / 3.84 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S5 | 2 | off | 1.70 / 2.55 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S5 | 2 | on | 1.57 / 1.99 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S5 | 3 | off | 1.79 / 1.98 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S5 | 3 | on | 1.77 / 1.97 | 893 | yes | no | yes | 44 / 50 | Sort; Index Scan slot_ix_text_7 |
| A4b / S11 | 1 | off | 0.76 / 0.85 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S11 | 1 | on | 0.76 / 0.88 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S11 | 2 | off | 0.73 / 1.11 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S11 | 2 | on | 0.80 / 0.95 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S11 | 3 | off | 0.70 / 0.82 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S11 | 3 | on | 0.75 / 0.85 | 7 | yes | no | yes | 3 / 3 | Sort; Index Scan slot_ix_ref_1 |
| A4b / S14 (a) | 1 | off | 159.13 / 175.55 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) | 1 | on | 159.75 / 182.37 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) | 2 | off | 194.77 / 341.30 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) | 2 | on | 156.89 / 167.15 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) | 3 | off | 155.39 / 167.20 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) | 3 | on | 154.43 / 171.11 | 123202 | yes | no | yes | 17423 / 19802 | Sort; Index Scan slot_ix_num_1 |
| A4b / S14 (a) two step | 1 | off | 6.71 / 6.87 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) two step | 1 | on | 6.66 / 6.95 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) two step | 2 | off | 6.62 / 7.56 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) two step | 2 | on | 3.29 / 14.12 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) two step | 3 | off | 8.25 / 9.82 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (a) two step | 3 | on | 8.16 / 8.67 | 7818 | yes | no | yes | 17423 / 19802 | Sort; Index Only Scan slot_ix_num_1; CTE Scan; Index Scan records_pkey |
| A4b / S14 (b) | 1 | off | 0.55 / 1.22 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S14 (b) | 1 | on | 1.11 / 1.27 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S14 (b) | 2 | off | 1.05 / 1.34 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S14 (b) | 2 | on | 1.10 / 1.24 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S14 (b) | 3 | off | 0.79 / 1.10 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S14 (b) | 3 | on | 0.72 / 1.09 | 18 | yes | no | no | 17424 / 19802 | Index Scan slot_ix_num_1 |
| A4b / S2 count | 1 | off | 2.55 / 2.96 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S2 count | 1 | on | 2.80 / 3.30 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S2 count | 2 | off | 2.57 / 2.76 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S2 count | 2 | on | 2.75 / 2.88 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S2 count | 3 | off | 2.53 / 2.59 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S2 count | 3 | on | 2.73 / 2.85 | 6588 | yes | no | no | 11252 / 13157 | Index Only Scan slot_ix_text_3 |
| A4b / S8 | 1 | off | 0.52 / 0.60 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A4b / S8 | 1 | on | 0.55 / 0.61 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A4b / S8 | 2 | off | 0.45 / 0.48 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A4b / S8 | 2 | on | 0.48 / 0.56 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A4b / S8 | 3 | off | 0.44 / 0.47 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A4b / S8 | 3 | on | 0.48 / 0.52 | 4 | no | no | no | 1 / 1 | Index Scan records_pkey |
| A5 / S2 | 1 | off | 258.01 / 307.78 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2 | 1 | on | 234.94 / 265.49 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2 | 2 | off | 226.96 / 248.43 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2 | 2 | on | 232.59 / 263.27 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2 | 3 | off | 234.21 / 293.19 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2 | 3 | on | 221.52 / 232.08 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 1 | off | 198.18 / 229.07 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 1 | on | 212.93 / 248.73 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 2 | off | 202.86 / 235.30 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 2 | on | 198.73 / 217.38 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 3 | off | 195.58 / 230.29 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-KEYSET | 3 | on | 216.92 / 243.26 | 132012 | yes | no | yes | 509 / 8207 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 1 | off | 247.61 / 273.14 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 1 | on | 249.79 / 265.10 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 2 | off | 246.98 / 289.44 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 2 | on | 252.67 / 292.78 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 3 | off | 252.15 / 269.79 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S2-OFFSET | 3 | on | 254.97 / 297.81 | 153072 | yes | no | yes | 694 / 13157 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Scan record_index_pkey |
| A5 / S3 | 1 | off | 34.21 / 36.16 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S3 | 1 | on | 34.00 / 37.12 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S3 | 2 | off | 33.69 / 35.42 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S3 | 2 | on | 34.07 / 44.11 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S3 | 3 | off | 34.65 / 50.73 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S3 | 3 | on | 33.65 / 34.25 | 16013 | yes | no | yes | 1 / 313 | Sort; Index Only Scan value_num; Index Only Scan value_time; Index Scan records_pkey |
| A5 / S5 | 1 | off | 8.16 / 10.44 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S5 | 1 | on | 7.51 / 8.19 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S5 | 2 | off | 7.50 / 8.14 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S5 | 2 | on | 7.23 / 9.19 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S5 | 3 | off | 7.33 / 7.76 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S5 | 3 | on | 7.59 / 7.92 | 5727 | yes | no | yes | 31 / 50 | Sort; Index Only Scan value_text; Index Scan records_pkey; Index Only Scan value_text; Index Only Scan value_text |
| A5 / S11 | 1 | off | 0.97 / 1.21 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S11 | 1 | on | 0.73 / 0.78 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S11 | 2 | off | 0.68 / 0.74 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S11 | 2 | on | 0.76 / 0.84 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S11 | 3 | off | 0.70 / 0.81 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S11 | 3 | on | 0.86 / 1.11 | 16 | yes | no | yes | 1 / 3 | Sort; Index Only Scan value_ref; Index Scan records_pkey |
| A5 / S14 (b) | 1 | off | 0.98 / 1.08 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S14 (b) | 1 | on | 1.00 / 1.14 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S14 (b) | 2 | off | 0.97 / 1.04 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S14 (b) | 2 | on | 1.00 / 1.07 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S14 (b) | 3 | off | 0.97 / 1.03 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S14 (b) | 3 | on | 1.01 / 1.08 | 205 | yes | no | no | 1215 / 19802 | Index Only Scan value_num; Index Scan records_pkey |
| A5 / S2 count | 1 | off | 57.53 / 59.16 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A5 / S2 count | 1 | on | 58.16 / 96.77 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A5 / S2 count | 2 | off | 57.94 / 78.49 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A5 / S2 count | 2 | on | 57.92 / 66.82 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A5 / S2 count | 3 | off | 57.50 / 63.94 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A5 / S2 count | 3 | on | 58.22 / 59.60 | 53923 | yes | yes | no | 694 / 13157 | Index Only Scan value_text; Index Scan records_pkey |
| A4b / O1 plain first | 1 | off | 1.44 / 1.61 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain first | 1 | on | 1.77 / 5.02 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain first | 2 | off | 1.43 / 2.66 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain first | 2 | on | 1.57 / 3.59 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain first | 3 | off | 1.45 / 1.68 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain first | 3 | on | 1.44 / 1.63 | 43 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 1 | off | 152.41 / 166.93 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 1 | on | 192.80 / 225.11 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 2 | off | 151.25 / 197.44 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 2 | on | 185.14 / 216.81 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 3 | off | 152.07 / 191.24 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain boundary | 3 | on | 179.76 / 196.60 | 89426 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 1 | off | 2.95 / 3.90 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 1 | on | 4.60 / 5.85 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 2 | off | 2.99 / 3.26 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 2 | on | 4.01 / 4.24 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 3 | off | 2.98 / 4.04 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O1 plain offset5000 | 3 | on | 4.77 / 5.32 | 3768 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 1 | off | 1.68 / 2.03 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 1 | on | 1.69 / 1.87 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 2 | off | 1.74 / 2.29 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 2 | on | 1.83 / 1.92 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 3 | off | 1.68 / 1.87 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain first | 3 | on | 1.76 / 5.30 | 55 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 1 | off | 203.79 / 266.13 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 1 | on | 222.18 / 243.86 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 2 | off | 190.51 / 204.39 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 2 | on | 222.62 / 276.19 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 3 | off | 197.32 / 218.41 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain boundary | 3 | on | 217.53 / 254.81 | 79111 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 1 | off | 2.48 / 2.96 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 1 | on | 4.24 / 4.39 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 2 | off | 2.86 / 2.96 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 2 | on | 4.13 / 4.29 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 3 | off | 2.85 / 2.91 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O2 plain offset5000 | 3 | on | 4.28 / 4.81 | 5101 | no | yes | no | 206831 / 198015 | Index Scan slot_ix_text_1 |
| A4b / O3 plain first | 1 | off | 2.77 / 2.92 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first | 1 | on | 2.80 / 2.89 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first | 2 | off | 2.81 / 2.93 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first | 2 | on | 2.85 / 2.96 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first | 3 | off | 2.76 / 3.10 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first | 3 | on | 2.82 / 2.96 | 2209 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain first single alternate | 1 | off | 76.87 / 93.28 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain first single alternate | 1 | on | 152.66 / 176.74 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain first single alternate | 2 | off | 118.63 / 247.10 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain first single alternate | 2 | on | 195.82 / 231.28 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain first single alternate | 3 | off | 113.15 / 156.94 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain first single alternate | 3 | on | 162.96 / 194.38 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 1 | off | 1583.25 / 2391.55 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 1 | on | 1548.63 / 1714.93 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 2 | off | 1613.85 / 1885.88 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 2 | on | 1543.01 / 1816.84 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 3 | off | 1574.27 / 1827.67 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary | 3 | on | 1541.21 / 1812.35 | 137776 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 1 | off | 809.16 / 1176.17 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 1 | on | 896.96 / 1302.39 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 2 | off | 808.20 / 1288.59 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 2 | on | 898.82 / 1246.91 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 3 | off | 840.76 / 975.69 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain boundary single alternate | 3 | on | 852.76 / 967.33 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 | 1 | off | 62.20 / 67.44 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 | 1 | on | 55.30 / 88.35 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 | 2 | off | 52.65 / 55.84 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 | 2 | on | 53.25 / 65.61 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 | 3 | off | 52.53 / 64.47 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 | 3 | on | 53.07 / 61.15 | 22253 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O3 plain offset5000 single alternate | 1 | off | 728.33 / 901.93 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 single alternate | 1 | on | 802.89 / 1053.07 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 single alternate | 2 | off | 703.40 / 879.20 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 single alternate | 2 | on | 765.70 / 982.64 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 single alternate | 3 | off | 714.43 / 1272.41 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O3 plain offset5000 single alternate | 3 | on | 885.52 / 1138.89 | 48436 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first | 1 | off | 2.75 / 3.37 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first | 1 | on | 3.34 / 4.22 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first | 2 | off | 2.73 / 3.37 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first | 2 | on | 2.78 / 5.25 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first | 3 | off | 2.62 / 2.86 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first | 3 | on | 2.75 / 2.92 | 213 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain first single alternate | 1 | off | 66.27 / 101.44 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first single alternate | 1 | on | 143.40 / 181.96 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first single alternate | 2 | off | 74.67 / 89.48 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first single alternate | 2 | on | 143.69 / 188.48 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first single alternate | 3 | off | 78.84 / 105.90 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain first single alternate | 3 | on | 186.10 / 277.55 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 1 | off | 1265.55 / 1892.87 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 1 | on | 1221.75 / 1510.01 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 2 | off | 1254.43 / 1524.86 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 2 | on | 1223.45 / 1525.08 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 3 | off | 1253.90 / 1515.35 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary | 3 | on | 1196.98 / 1409.29 | 106538 | yes | no | yes | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 1 | off | 807.94 / 1143.35 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 1 | on | 991.41 / 1508.78 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 2 | off | 1030.06 / 1664.02 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 2 | on | 874.70 / 1402.96 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 3 | off | 799.94 / 1135.64 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain boundary single alternate | 3 | on | 852.50 / 1074.45 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 | 1 | off | 51.54 / 52.96 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 | 1 | on | 53.12 / 67.77 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 | 2 | off | 51.52 / 55.25 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 | 2 | on | 52.15 / 57.70 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 | 3 | off | 51.11 / 54.78 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 | 3 | on | 53.60 / 63.22 | 19867 | yes | yes | no | 206831 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4b / O4 plain offset5000 single alternate | 1 | off | 714.29 / 823.95 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 single alternate | 1 | on | 726.62 / 920.46 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 single alternate | 2 | off | 681.55 / 911.75 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 single alternate | 2 | on | 848.08 / 1141.44 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 single alternate | 3 | off | 761.63 / 1166.12 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O4 plain offset5000 single alternate | 3 | on | 833.75 / 1146.43 | 48434 | no | no | yes | 206831 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4b / O1 status first | 1 | off | 1.59 / 1.81 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status first | 1 | on | 1.59 / 1.79 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status first | 2 | off | 1.60 / 1.72 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status first | 2 | on | 1.61 / 1.84 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status first | 3 | off | 1.57 / 1.77 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status first | 3 | on | 1.90 / 2.02 | 728 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O1 status boundary | 1 | off | 49.73 / 68.85 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status boundary | 1 | on | 57.29 / 65.02 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status boundary | 2 | off | 50.17 / 83.31 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status boundary | 2 | on | 58.74 / 89.80 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status boundary | 3 | off | 55.92 / 93.70 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status boundary | 3 | on | 57.13 / 62.80 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 1 | off | 54.72 / 131.65 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 1 | on | 58.27 / 65.37 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 2 | off | 53.82 / 76.67 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 2 | on | 61.08 / 91.81 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 3 | off | 52.67 / 82.13 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O1 status offset5000 | 3 | on | 53.38 / 60.42 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status first | 1 | off | 1.56 / 2.00 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status first | 1 | on | 1.37 / 2.00 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status first | 2 | off | 1.81 / 2.06 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status first | 2 | on | 1.63 / 1.95 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status first | 3 | off | 1.83 / 2.05 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status first | 3 | on | 1.85 / 1.98 | 667 | no | yes | no | 11252 / 13157 | Index Scan slot_ix_text_1 |
| A4b / O2 status boundary | 1 | off | 51.32 / 95.09 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status boundary | 1 | on | 57.88 / 61.95 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status boundary | 2 | off | 51.82 / 78.06 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status boundary | 2 | on | 56.90 / 100.72 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status boundary | 3 | off | 49.32 / 61.23 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status boundary | 3 | on | 52.66 / 62.94 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 1 | off | 48.08 / 57.95 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 1 | on | 53.44 / 57.92 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 2 | off | 46.31 / 60.51 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 2 | on | 52.56 / 60.84 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 3 | off | 54.35 / 67.57 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O2 status offset5000 | 3 | on | 58.60 / 75.74 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 1 | off | 2.79 / 3.23 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 1 | on | 3.15 / 4.09 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 2 | off | 2.92 / 3.15 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 2 | on | 3.00 / 3.75 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 3 | off | 2.90 / 3.59 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first | 3 | on | 2.32 / 3.51 | 810 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 1 | off | 11.90 / 13.20 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 1 | on | 24.60 / 26.89 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 2 | off | 11.60 / 12.46 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 2 | on | 20.37 / 21.59 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 3 | off | 9.88 / 10.40 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status first single alternate | 3 | on | 20.37 / 21.42 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 1 | off | 96.45 / 106.77 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 1 | on | 97.19 / 105.99 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 2 | off | 100.15 / 114.07 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 2 | on | 96.52 / 109.27 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 3 | off | 98.57 / 114.15 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary | 3 | on | 96.55 / 113.67 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 1 | off | 57.81 / 66.78 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 1 | on | 62.72 / 87.38 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 2 | off | 56.49 / 67.61 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 2 | on | 57.70 / 62.90 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 3 | off | 51.78 / 68.40 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status boundary single alternate | 3 | on | 58.93 / 81.08 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 1 | off | 87.00 / 127.74 | 26011 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 1 | on | 91.16 / 101.97 | 26011 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 2 | off | 86.42 / 114.87 | 26012 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 2 | on | 95.86 / 121.27 | 26011 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 3 | off | 99.09 / 125.77 | 26011 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 | 3 | on | 101.54 / 130.77 | 26011 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 1 | off | 53.48 / 59.04 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 1 | on | 59.33 / 64.69 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 2 | off | 46.72 / 56.78 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 2 | on | 55.57 / 65.70 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 3 | off | 46.90 / 54.16 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O3 status offset5000 single alternate | 3 | on | 54.67 / 60.68 | 13336 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 1 | off | 2.52 / 2.68 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 1 | on | 2.57 / 2.84 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 2 | off | 2.51 / 3.63 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 2 | on | 2.57 / 2.68 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 3 | off | 2.48 / 2.61 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first | 3 | on | 2.56 / 2.70 | 853 | yes | yes | no | 11251 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 1 | off | 8.91 / 9.19 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 1 | on | 20.10 / 20.75 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 2 | off | 9.51 / 10.93 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 2 | on | 19.44 / 21.81 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 3 | off | 8.99 / 11.43 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status first single alternate | 3 | on | 19.39 / 19.83 | 13296 | yes | no | yes | 11252 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 1 | off | 88.26 / 97.06 | 26631 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 1 | on | 88.07 / 107.04 | 26630 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 2 | off | 87.82 / 100.47 | 26630 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 2 | on | 104.57 / 118.18 | 26630 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 3 | off | 88.01 / 111.11 | 26630 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary | 3 | on | 101.43 / 119.93 | 26630 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 1 | off | 46.17 / 56.95 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 1 | on | 54.60 / 62.17 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 2 | off | 45.73 / 63.69 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 2 | on | 53.74 / 59.65 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 3 | off | 45.28 / 53.57 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status boundary single alternate | 3 | on | 57.50 / 75.14 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 1 | off | 87.28 / 95.76 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 1 | on | 86.22 / 98.54 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 2 | off | 104.40 / 137.90 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 2 | on | 111.59 / 231.56 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 3 | off | 97.49 / 111.89 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 | 3 | on | 92.39 / 131.55 | 25931 | yes | no | yes | 11251 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 1 | off | 48.70 / 62.16 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 1 | on | 52.45 / 58.94 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 2 | off | 48.61 / 65.32 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 2 | on | 54.26 / 71.55 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 3 | off | 54.18 / 68.69 | 13334 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / O4 status offset5000 single alternate | 3 | on | 56.88 / 72.68 | 13335 | yes | no | yes | 11252 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 plain first | 1 | off | 71.75 / 100.90 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain first | 1 | on | 144.17 / 157.67 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain first | 2 | off | 120.19 / 175.05 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain first | 2 | on | 144.02 / 245.06 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain first | 3 | off | 80.52 / 105.68 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain first | 3 | on | 146.74 / 189.78 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 1 | off | 852.96 / 975.77 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 1 | on | 901.23 / 1075.13 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 2 | off | 929.96 / 1197.54 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 2 | on | 957.85 / 1198.12 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 3 | off | 951.61 / 1169.54 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain boundary | 3 | on | 994.44 / 1123.80 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 1 | off | 705.14 / 812.29 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 1 | on | 776.64 / 991.11 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 2 | off | 702.80 / 856.14 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 2 | on | 752.41 / 918.17 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 3 | off | 757.99 / 1014.51 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 plain offset5000 | 3 | on | 794.00 / 1148.44 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 1 | off | 94.20 / 148.05 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 1 | on | 146.23 / 217.99 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 2 | off | 77.63 / 98.26 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 2 | on | 140.59 / 158.54 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 3 | off | 79.32 / 102.09 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain first | 3 | on | 144.76 / 173.07 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 1 | off | 957.99 / 1327.34 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 1 | on | 1000.32 / 1378.98 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 2 | off | 837.35 / 961.49 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 2 | on | 854.65 / 1077.85 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 3 | off | 782.65 / 944.39 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain boundary | 3 | on | 857.81 / 1004.91 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 1 | off | 743.49 / 1020.26 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 1 | on | 985.62 / 1219.98 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 2 | off | 873.36 / 1166.42 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 2 | on | 944.35 / 1307.61 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 3 | off | 851.03 / 1262.95 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O2 plain offset5000 | 3 | on | 873.29 / 1247.60 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first | 1 | off | 2.73 / 2.89 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first | 1 | on | 2.69 / 3.02 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first | 2 | off | 2.57 / 2.95 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first | 2 | on | 2.83 / 4.41 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first | 3 | off | 2.60 / 2.90 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first | 3 | on | 2.72 / 3.17 | 2208 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain first single alternate | 1 | off | 124.32 / 188.22 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first single alternate | 1 | on | 155.76 / 226.88 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first single alternate | 2 | off | 82.45 / 124.87 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first single alternate | 2 | on | 148.17 / 172.60 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first single alternate | 3 | off | 82.75 / 117.99 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain first single alternate | 3 | on | 157.21 / 188.42 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 1 | off | 1615.65 / 1823.85 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 1 | on | 1575.37 / 1725.34 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 2 | off | 1613.57 / 1847.14 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 2 | on | 1789.54 / 2234.57 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 3 | off | 1770.49 / 2168.90 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary | 3 | on | 1728.37 / 2120.94 | 137775 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 1 | off | 1010.25 / 1309.03 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 1 | on | 896.63 / 1034.92 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 2 | off | 837.86 / 960.68 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 2 | on | 898.60 / 975.11 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 3 | off | 902.45 / 1172.34 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain boundary single alternate | 3 | on | 1052.38 / 1346.50 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 | 1 | off | 61.65 / 92.79 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 | 1 | on | 53.59 / 67.22 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 | 2 | off | 54.62 / 82.48 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 | 2 | on | 60.50 / 86.47 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 | 3 | off | 55.01 / 75.07 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 | 3 | on | 60.65 / 78.70 | 22252 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O3 plain offset5000 single alternate | 1 | off | 868.23 / 1380.64 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 single alternate | 1 | on | 933.70 / 1233.65 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 single alternate | 2 | off | 937.65 / 1606.43 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 single alternate | 2 | on | 865.00 / 1158.37 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 single alternate | 3 | off | 721.20 / 993.39 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O3 plain offset5000 single alternate | 3 | on | 795.19 / 1069.29 | 48436 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first | 1 | off | 2.13 / 2.42 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first | 1 | on | 2.17 / 2.40 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first | 2 | off | 2.01 / 2.16 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first | 2 | on | 1.94 / 2.75 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first | 3 | off | 2.14 / 2.80 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first | 3 | on | 2.44 / 2.95 | 213 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain first single alternate | 1 | off | 82.85 / 114.87 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first single alternate | 1 | on | 144.80 / 200.32 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first single alternate | 2 | off | 80.33 / 126.24 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first single alternate | 2 | on | 145.63 / 258.90 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first single alternate | 3 | off | 89.23 / 146.10 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain first single alternate | 3 | on | 140.87 / 191.82 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 1 | off | 1245.46 / 1508.62 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 1 | on | 1259.74 / 1610.59 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 2 | off | 1305.17 / 1625.02 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 2 | on | 1317.01 / 1536.17 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 3 | off | 1340.00 / 1505.64 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary | 3 | on | 1312.85 / 1549.21 | 106537 | no | no | yes | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 1 | off | 803.33 / 930.53 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 1 | on | 801.92 / 878.12 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 2 | off | 748.80 / 867.21 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 2 | on | 862.28 / 960.35 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 3 | off | 824.85 / 968.67 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain boundary single alternate | 3 | on | 925.14 / 1191.90 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 | 1 | off | 62.44 / 78.67 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 | 1 | on | 62.27 / 71.66 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 | 2 | off | 59.21 / 73.59 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 | 2 | on | 52.34 / 57.10 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 | 3 | off | 57.94 / 67.43 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 | 3 | on | 52.70 / 69.37 | 19867 | no | yes | no | 206344 / 198015 | Sort; Index Scan slot_ix_text_1; Index Scan records_pkey |
| A4bn / O4 plain offset5000 single alternate | 1 | off | 796.36 / 1125.54 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 single alternate | 1 | on | 876.87 / 1074.92 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 single alternate | 2 | off | 806.43 / 993.44 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 single alternate | 2 | on | 848.88 / 1376.09 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 single alternate | 3 | off | 734.49 / 857.60 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O4 plain offset5000 single alternate | 3 | on | 777.03 / 1195.52 | 48434 | no | no | yes | 206345 / 198015 | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A4bn / O1 status first | 1 | off | 11.68 / 12.52 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status first | 1 | on | 24.72 / 25.75 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status first | 2 | off | 9.95 / 10.77 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status first | 2 | on | 20.51 / 21.65 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status first | 3 | off | 9.97 / 10.57 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status first | 3 | on | 20.29 / 21.13 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 1 | off | 48.29 / 54.89 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 1 | on | 58.46 / 69.03 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 2 | off | 54.88 / 66.06 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 2 | on | 59.91 / 80.95 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 3 | off | 56.74 / 76.42 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status boundary | 3 | on | 64.03 / 68.45 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 1 | off | 54.67 / 66.26 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 1 | on | 57.94 / 67.78 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 2 | off | 47.45 / 53.81 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 2 | on | 59.56 / 67.82 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 3 | off | 48.54 / 72.41 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O1 status offset5000 | 3 | on | 55.94 / 61.83 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 1 | off | 10.11 / 10.94 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 1 | on | 21.06 / 23.22 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 2 | off | 10.11 / 12.72 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 2 | on | 20.59 / 22.19 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 3 | off | 10.11 / 11.61 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status first | 3 | on | 20.75 / 25.49 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 1 | off | 45.00 / 54.92 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 1 | on | 56.20 / 68.48 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 2 | off | 47.25 / 52.60 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 2 | on | 60.08 / 84.37 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 3 | off | 50.01 / 60.24 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status boundary | 3 | on | 60.70 / 73.92 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 1 | off | 61.31 / 127.39 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 1 | on | 66.65 / 116.21 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 2 | off | 53.71 / 72.07 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 2 | on | 57.79 / 72.00 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 3 | off | 48.66 / 55.99 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O2 status offset5000 | 3 | on | 54.57 / 66.75 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 1 | off | 2.26 / 3.34 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 1 | on | 2.47 / 2.57 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 2 | off | 2.33 / 2.44 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 2 | on | 2.75 / 4.54 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 3 | off | 2.27 / 2.40 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first | 3 | on | 2.69 / 5.45 | 810 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 1 | off | 10.00 / 10.25 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 1 | on | 20.55 / 21.06 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 2 | off | 9.76 / 12.67 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 2 | on | 20.58 / 25.04 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 3 | off | 9.89 / 12.02 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status first single alternate | 3 | on | 20.32 / 20.73 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 1 | off | 104.09 / 116.21 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 1 | on | 104.95 / 144.40 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 2 | off | 97.73 / 115.72 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 2 | on | 120.53 / 158.35 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 3 | off | 105.25 / 131.33 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary | 3 | on | 107.25 / 131.95 | 26633 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 1 | off | 49.55 / 59.85 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 1 | on | 58.27 / 76.31 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 2 | off | 56.42 / 67.89 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 2 | on | 55.38 / 61.77 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 3 | off | 53.31 / 72.32 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status boundary single alternate | 3 | on | 59.25 / 67.01 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 1 | off | 93.97 / 132.72 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 1 | on | 102.15 / 123.42 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 2 | off | 104.32 / 146.57 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 2 | on | 95.28 / 158.83 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 3 | off | 95.07 / 115.50 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 | 3 | on | 91.31 / 111.82 | 26013 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 1 | off | 53.95 / 58.75 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 1 | on | 53.58 / 62.67 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 2 | off | 48.85 / 60.67 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 2 | on | 55.50 / 83.52 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 3 | off | 49.80 / 63.05 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O3 status offset5000 single alternate | 3 | on | 57.84 / 77.32 | 13336 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 1 | off | 2.34 / 2.48 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 1 | on | 2.47 / 2.62 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 2 | off | 2.33 / 2.39 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 2 | on | 2.46 / 2.54 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 3 | off | 2.31 / 2.46 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first | 3 | on | 2.42 / 2.54 | 853 | yes | yes | no | 11458 / 13157 | Sort; Index Scan slot_ix_text_1; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 1 | off | 9.08 / 9.88 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 1 | on | 19.37 / 19.88 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 2 | off | 8.84 / 9.26 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 2 | on | 24.00 / 25.42 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 3 | off | 11.38 / 12.59 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status first single alternate | 3 | on | 23.15 / 24.97 | 13297 | yes | no | yes | 11459 / 13157 | Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 1 | off | 97.81 / 125.51 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 1 | on | 88.63 / 118.65 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 2 | off | 94.89 / 133.35 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 2 | on | 106.13 / 150.63 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 3 | off | 97.93 / 117.38 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary | 3 | on | 89.09 / 102.29 | 26632 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 1 | off | 50.99 / 69.11 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 1 | on | 57.06 / 80.61 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 2 | off | 51.93 / 65.42 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 2 | on | 63.04 / 99.09 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 3 | off | 55.94 / 118.48 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status boundary single alternate | 3 | on | 55.27 / 89.74 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 1 | off | 100.83 / 127.43 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 1 | on | 89.28 / 116.31 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 2 | off | 90.21 / 130.13 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 2 | on | 99.08 / 144.02 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 3 | off | 113.98 / 182.11 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 | 3 | on | 100.86 / 125.23 | 25932 | yes | no | yes | 11458 / 13157 | Sort; Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 1 | off | 65.82 / 86.79 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 1 | on | 75.38 / 108.64 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 2 | off | 49.78 / 65.29 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 2 | on | 56.55 / 93.33 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 3 | off | 52.75 / 70.81 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4bn / O4 status offset5000 single alternate | 3 | on | 55.46 / 66.62 | 13335 | yes | no | yes | 11459 / 13157 | Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3 |
| A4b / skew hot first | 1 | off | 0.62 / 0.72 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot first | 1 | on | 0.62 / 0.72 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot first | 2 | off | 0.60 / 0.66 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot first | 2 | on | 0.60 / 0.67 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot first | 3 | off | 0.57 / 0.65 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot first | 3 | on | 0.60 / 0.67 | 98 | no | yes | no | 121038 / 178213 | Index Scan slot_ix_text_1 |
| A4b / skew hot count | 1 | off | 84.62 / 106.34 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew hot count | 1 | on | 93.26 / 164.97 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew hot count | 2 | off | 144.42 / 235.24 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew hot count | 2 | on | 117.80 / 221.03 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew hot count | 3 | off | 107.26 / 230.27 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew hot count | 3 | on | 118.69 / 140.90 | 84528 | no | no | no | 121038 / 178213 | Gather planned=2 launched=2; Seq Scan records |
| A4b / skew cold first | 1 | off | 1.11 / 1.21 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold first | 1 | on | 1.15 / 1.23 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold first | 2 | off | 1.11 / 1.15 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold first | 2 | on | 1.14 / 1.22 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold first | 3 | off | 1.11 / 1.15 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold first | 3 | on | 1.10 / 1.19 | 136 | yes | no | yes | 103 / 198 | Sort; Index Scan slot_ix_text_8 |
| A4b / skew cold count | 1 | off | 0.76 / 0.87 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4b / skew cold count | 1 | on | 0.80 / 0.86 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4b / skew cold count | 2 | off | 0.77 / 0.95 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4b / skew cold count | 2 | on | 0.79 / 1.54 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4b / skew cold count | 3 | off | 0.78 / 0.91 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4b / skew cold count | 3 | on | 0.74 / 0.81 | 190 | yes | no | no | 103 / 198 | Index Only Scan slot_ix_text_8 |
| A4bmix / org1 leads unique | 1 | off | 0.67 / 0.85 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique | 1 | on | 0.60 / 0.65 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique | 2 | off | 0.57 / 0.65 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique | 2 | on | 0.66 / 0.73 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique | 3 | off | 0.62 / 0.78 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique | 3 | on | 0.59 / 0.66 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 1 | off | 6.48 / 22.63 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 1 | on | 7.03 / 15.79 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 2 | off | 6.40 / 7.22 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 2 | on | 6.98 / 19.36 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 3 | off | 7.08 / 8.09 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five | 3 | on | 6.82 / 10.73 | 7904 | yes | no | yes | 1183 / 9814 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org2 leads skewed | 1 | off | 0.63 / 0.78 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed | 1 | on | 0.63 / 0.72 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed | 2 | off | 0.62 / 0.68 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed | 2 | on | 0.72 / 9.16 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed | 3 | off | 0.69 / 0.89 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed | 3 | on | 0.85 / 1.43 | 82 | no | no | no | 4793 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org1 third hundred | 1 | off | 0.73 / 0.82 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred | 1 | on | 0.73 / 0.82 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred | 2 | off | 0.68 / 0.75 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred | 2 | on | 0.73 / 0.80 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred | 3 | off | 0.70 / 0.76 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred | 3 | on | 0.74 / 0.82 | 202 | yes | no | yes | 14 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 1 | off | 0.51 / 0.62 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 1 | on | 0.54 / 0.58 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 2 | off | 0.52 / 0.62 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 2 | on | 0.53 / 0.60 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 3 | off | 0.52 / 0.60 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 leads unique MCV | 3 | on | 0.56 / 0.62 | 5 | yes | no | yes | 3 / 1 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 contacts five MCV | 1 | off | 0.68 / 0.74 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org1 contacts five MCV | 1 | on | 0.67 / 0.82 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org1 contacts five MCV | 2 | off | 0.61 / 0.69 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org1 contacts five MCV | 2 | on | 0.66 / 0.74 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org1 contacts five MCV | 3 | off | 0.62 / 0.70 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org1 contacts five MCV | 3 | on | 0.64 / 0.74 | 221 | no | no | no | 8463 / 9814 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 1 | off | 0.61 / 0.71 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 1 | on | 0.63 / 0.73 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 2 | off | 0.58 / 0.66 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 2 | on | 0.61 / 0.67 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 3 | off | 0.61 / 0.69 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org2 leads skewed MCV | 3 | on | 0.62 / 0.67 | 82 | no | no | no | 6269 / 39193 | Index Scan slot_ix_text_2 |
| A4bmix / org1 third hundred MCV | 1 | off | 0.76 / 1.14 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred MCV | 1 | on | 0.68 / 0.75 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred MCV | 2 | off | 0.68 / 0.76 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred MCV | 2 | on | 0.68 / 0.77 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred MCV | 3 | off | 0.68 / 0.73 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A4bmix / org1 third hundred MCV | 3 | on | 0.69 / 0.73 | 202 | yes | no | yes | 10 / 197 | Sort; Index Scan slot_ix_text_1 |
| A3 / S10 source | 1 | off | 89.80 / 405.65 | 109566 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 source | 1 | on | 92.65 / 106.75 | 109532 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 source | 2 | off | 93.24 / 110.35 | 109566 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 source | 2 | on | 92.94 / 100.20 | 109532 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 source | 3 | off | 101.76 / 129.25 | 109566 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 source | 3 | on | 97.31 / 173.60 | 109532 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| B1 / S10 source | 1 | off | 52.24 / 56.90 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 source | 1 | on | 53.24 / 56.95 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 source | 2 | off | 53.74 / 62.52 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 source | 2 | on | 55.17 / 71.44 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 source | 3 | off | 53.21 / 61.17 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 source | 3 | on | 54.34 / 59.01 | 38460 | no | no | yes | — / — | Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| A4b / S10 source | 1 | off | 31.01 / 31.58 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 source | 1 | on | 31.13 / 31.81 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 source | 2 | off | 30.24 / 33.16 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 source | 2 | on | 27.87 / 31.58 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 source | 3 | off | 31.01 / 35.72 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 source | 3 | on | 28.66 / 39.69 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A3 / S10 owner | 1 | off | 92.26 / 98.56 | 109582 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 owner | 1 | on | 101.61 / 149.95 | 109548 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 owner | 2 | off | 96.77 / 142.18 | 109582 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 owner | 2 | on | 98.27 / 129.56 | 109548 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 owner | 3 | off | 104.86 / 139.84 | 109582 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| A3 / S10 owner | 3 | on | 99.73 / 129.56 | 109548 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan records |
| B1 / S10 owner | 1 | off | 54.87 / 105.90 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 owner | 1 | on | 57.47 / 84.54 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 owner | 2 | off | 56.62 / 99.31 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 owner | 2 | on | 56.81 / 81.69 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 owner | 3 | off | 59.90 / 101.02 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| B1 / S10 owner | 3 | on | 76.93 / 98.91 | 38476 | no | no | yes | — / — | Incremental Sort; Gather Merge planned=2 launched=2; Sort; Seq Scan leads |
| A4b / S10 owner | 1 | off | 43.28 / 58.17 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 owner | 1 | on | 37.68 / 45.24 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 owner | 2 | off | 36.28 / 36.86 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 owner | 2 | on | 37.27 / 38.22 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 owner | 3 | off | 36.25 / 36.55 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |
| A4b / S10 owner | 3 | on | 37.30 / 37.91 | 10428 | yes | no | yes | — / — | Sort; Bitmap Heap Scan records; Bitmap Index Scan slot_ix_time_2 |

## Branch access (server EXPLAIN time, same best round)

- A4b O3 plain first: arm 1: Index Scan slot_ix_text_1; 0.046 ms; 39 buffers; arm 2: Index Scan records_pkey; 0.735 ms; 2170 buffers
- A4b O3 plain boundary: arm 1: Index Scan slot_ix_text_1; 210.975 ms; 89400 buffers; arm 2: Gather Merge planned=2 launched=2; Sort; Seq Scan records; 278.309 ms; 48376 buffers
- A4b O3 plain offset5000: arm 1: Index Scan slot_ix_text_1; 3.710 ms; 3753 buffers; arm 2: Index Scan records_pkey; 13.618 ms; 18500 buffers
- A4b O4 plain first: arm 1: Index Scan slot_ix_text_1; 0.057 ms; 43 buffers; arm 2: Index Scan records_pkey; 0.110 ms; 170 buffers
- A4b O4 plain boundary: arm 1: Index Scan slot_ix_text_1; 134.630 ms; 58164 buffers; arm 2: Gather Merge planned=2 launched=2; Sort; Seq Scan records; 270.216 ms; 48374 buffers
- A4b O4 plain offset5000: arm 1: Index Scan slot_ix_text_1; 3.834 ms; 3768 buffers; arm 2: Index Scan records_pkey; 12.001 ms; 16099 buffers
- A4b O3 status first: arm 1: Index Scan slot_ix_text_1; 0.417 ms; 683 buffers; arm 2: Index Scan slot_ix_text_3; 0.097 ms; 127 buffers
- A4b O3 status boundary: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 38.304 ms; 13335 buffers; arm 2: Index Scan slot_ix_text_3; 11.636 ms; 13296 buffers
- A4b O3 status offset5000: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 37.954 ms; 13335 buffers; arm 2: Index Scan slot_ix_text_3; 10.356 ms; 12676 buffers
- A4b O4 status first: arm 1: Index Scan slot_ix_text_1; 0.360 ms; 728 buffers; arm 2: Index Scan slot_ix_text_3; 0.074 ms; 125 buffers
- A4b O4 status boundary: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 38.041 ms; 13334 buffers; arm 2: Index Scan slot_ix_text_3; 10.776 ms; 13296 buffers
- A4b O4 status offset5000: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 41.496 ms; 13334 buffers; arm 2: Index Scan slot_ix_text_3; 10.397 ms; 12597 buffers
- A4bn O3 plain first: arm 1: Index Scan slot_ix_text_1; 0.045 ms; 38 buffers; arm 2: Index Scan records_pkey; 0.702 ms; 2170 buffers
- A4bn O3 plain boundary: arm 1: Index Scan slot_ix_text_1; 209.294 ms; 89399 buffers; arm 2: Gather Merge planned=2 launched=2; Sort; Seq Scan records; 361.149 ms; 48376 buffers
- A4bn O3 plain offset5000: arm 1: Index Scan slot_ix_text_1; 4.040 ms; 3752 buffers; arm 2: Index Scan records_pkey; 13.661 ms; 18500 buffers
- A4bn O4 plain first: arm 1: Index Scan slot_ix_text_1; 0.048 ms; 43 buffers; arm 2: Index Scan records_pkey; 0.091 ms; 170 buffers
- A4bn O4 plain boundary: arm 1: Index Scan slot_ix_text_1; 135.253 ms; 58163 buffers; arm 2: Gather Merge planned=2 launched=2; Sort; Seq Scan records; 279.734 ms; 48374 buffers
- A4bn O4 plain offset5000: arm 1: Index Scan slot_ix_text_1; 3.904 ms; 3768 buffers; arm 2: Index Scan records_pkey; 12.234 ms; 16099 buffers
- A4bn O3 status first: arm 1: Index Scan slot_ix_text_1; 0.339 ms; 682 buffers; arm 2: Index Scan slot_ix_text_3; 0.075 ms; 128 buffers
- A4bn O3 status boundary: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 37.162 ms; 13336 buffers; arm 2: Index Scan slot_ix_text_3; 11.254 ms; 13297 buffers
- A4bn O3 status offset5000: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 38.232 ms; 13336 buffers; arm 2: Index Scan slot_ix_text_3; 10.477 ms; 12677 buffers
- A4bn O4 status first: arm 1: Index Scan slot_ix_text_1; 0.360 ms; 728 buffers; arm 2: Index Scan slot_ix_text_3; 0.071 ms; 125 buffers
- A4bn O4 status boundary: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 38.037 ms; 13335 buffers; arm 2: Index Scan slot_ix_text_3; 10.895 ms; 13297 buffers
- A4bn O4 status offset5000: arm 1: Gather Merge planned=1 launched=1; Sort; Index Scan slot_ix_text_3; 38.130 ms; 13335 buffers; arm 2: Index Scan slot_ix_text_3; 11.056 ms; 12597 buffers

## Sanitized value conditions

- A4b S2-KEYSET: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ROW(ix_text_1, id) > ROW('?'::text COLLATE "und-x-icu", '?'::uuid))); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b S2-OFFSET: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b S2-OFFSET two step: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b S3: slot_ix_time_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_time_1 >= '?'::timestamp with time zone) AND (ix_time_1 < '?'::timestamp with time zone))
- A4b S3 two step: slot_ix_time_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_time_1 >= '?'::timestamp with time zone) AND (ix_time_1 < '?'::timestamp with time zone))
- A4b S5: slot_ix_text_7: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_7 = '?'::text))
- A4b S11: slot_ix_ref_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_ref_1 = '?'::uuid))
- A4b S14 (a): slot_ix_num_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_num_1 >= '?'::bigint))
- A4b S14 (a) two step: slot_ix_num_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_num_1 >= '?'::bigint))
- A4b S14 (b): slot_ix_num_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_num_1 >= '?'::bigint))
- A4b S2 count: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A5 S2: value_text: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_text = '?'::text))
- A5 S2-KEYSET: value_text: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_text = '?'::text))
- A5 S2-OFFSET: value_text: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_text = '?'::text))
- A5 S3: value_num: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_num >= '?'::bigint)); value_time: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_time >= '?'::timestamp with time zone) AND (v_time < '?'::timestamp with time zone))
- A5 S5: value_text: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_text = '?'::text)); value_text: ((organization_id = r.organization_id) AND (module_id = r.module_id) AND (field_id = '?'::uuid) AND (v_text = ANY ('?'::text[])) AND (record_id = r.id)); value_text: ((organization_id = r.organization_id) AND (module_id = r.module_id) AND (field_id = '?'::uuid) AND (v_text = '?'::text) AND (record_id = r.id))
- A5 S11: value_ref: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_ref = '?'::uuid))
- A5 S14 (b): value_num: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_num >= '?'::bigint))
- A5 S2 count: value_text: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (field_id = '?'::uuid) AND (v_text = '?'::text))
- A4b O3 plain first: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O3 plain boundary: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O3 plain offset5000: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O4 plain first: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O4 plain boundary: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O4 plain offset5000: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL))
- A4b O1 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O1 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O2 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O2 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status first: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status first single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status boundary single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O3 status offset5000 single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status first: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 IS NOT NULL)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status first single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status boundary single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b O4 status offset5000 single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O1 status first: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O1 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O1 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O2 status first: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O2 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O2 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status first: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status first single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status boundary single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O3 status offset5000 single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status first: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status first single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status boundary: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status boundary single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status offset5000: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text)); slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4bn O4 status offset5000 single alternate: slot_ix_text_3: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_3 = '?'::text))
- A4b skew cold first: slot_ix_text_8: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_8 = '?'::text))
- A4b skew cold count: slot_ix_text_8: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_8 = '?'::text))
- A4bmix org1 leads unique: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 = '?'::text))
- A4bmix org1 contacts five: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 = '?'::text))
- A4bmix org1 third hundred: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 = '?'::text))
- A4bmix org1 leads unique MCV: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 = '?'::text))
- A4bmix org1 third hundred MCV: slot_ix_text_1: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_text_1 = '?'::text))
- A4b S10 source: slot_ix_time_2: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_time_2 >= '?'::timestamp with time zone) AND (ix_time_2 < '?'::timestamp with time zone))
- A4b S10 owner: slot_ix_time_2: ((organization_id = '?'::uuid) AND (module_id = '?'::uuid) AND (ix_time_2 >= '?'::timestamp with time zone) AND (ix_time_2 < '?'::timestamp with time zone))
