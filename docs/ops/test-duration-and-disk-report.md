# Test duration and worktree/disk report

Report only (MEP-1293). No code or config changed. Measured 2026-10-24.

## 1. CI durations

Source: the public GitHub Actions API for the repository (`GET /actions/runs/{id}/jobs`), no authentication. The 19 most recent completed, successful `CI` runs: 9 on `main` and 10 on `mep/*` (the 60 newest runs held only 9 green `main` runs). Wall time is `completed_at - started_at` of each job. Median and p90 are over the 19 runs. Failed jobs are excluded.

Runs (id, short SHA, branch):
- main: 40071852763 c13480f0, 40070431472 d35054c8, 40069261543 84487c47, 40067151704 cc11fe2c, 40066438808 2af45e3a, 40065449651 9008df72, 40063334113 22341bab, 40062591184 1c810916, 40061850766 c9791690
- mep/*: 40071509139 d35054c8 (MEP-1301), 40071507229 20bf7510 (MEP-1298), 40070365005 7d7316e7 (MEP-1297), 40069538534 84487c47 (MEP-1303), 40069536459 e237d8fd (MEP-1302), 40069023913 cc11fe2c (MEP-1300), 40069022267 cc11fe2c (MEP-1298), 40069020130 7f74e79c (MEP-1296), 40069017827 cc11fe2c (MEP-1294), 40069015507 f67a63ce (MEP-1292)

| Job | Median (min) | p90 (min) | Main step (median / p90, min) |
|---|---|---|---|
| fast | 7.6 | 9.7 | Unit and component tests 7.0 / 9.2 |
| integration | 0.8 | 0.9 | Integration tests 0.5 / 0.5 |
| e2e 1/4 | 5.8 | 6.2 | Browser tests 5.1 / 5.5 |
| e2e 2/4 | 7.0 | 7.3 | Browser tests 6.4 / 6.6 |
| e2e 3/4 | 6.2 | 6.6 | Browser tests 5.6 / 6.0 |
| e2e 4/4 | 5.3 | 6.2 | Browser tests 4.6 / 5.5 |
| e2e macOS geometry | 3.1 | 4.0 | Browser tests 2.2 / 2.9 |

Critical path of a run is about 7.3 min (shard 2); `fast` is the longest at p90 (9.7 min). Setup steps (install, Chromium cache) are each under 20 s median and are not listed.

## 2. Slowest tests

Measured from GitHub Actions CI run `40083180630` (commit `8e9ac920ae558cfece6d9da22bc5c5fba97394d9`, branch `mep/MEP-1315`, 2026-10-24). Per-file durations are published in the job step summaries (`$GITHUB_STEP_SUMMARY`) and archived as workflow artifacts (`fast-results` for Vitest, `e2e-1`..`4` and `e2e-macos` for Playwright).

### 2.1 Fast (unit & component tests) — slowest 20 files

Duration is file end minus start timestamp from Vitest JSON report (`test-results/vitest.json`). Total unit/component execution was 456 s (7.6 min, within the baseline median 7.0 min and p90 9.2 min).

| File | Duration (s) | Tests |
| --- | ---: | ---: |
| module-list-screen.test.tsx | 62.447 | 54 |
| http-record-service.contract.test.ts | 31.019 | 403 |
| record-form-screen.test.tsx | 16.396 | 40 |
| fixture.test.ts | 10.582 | 210 |
| advanced-search-screen.test.tsx | 10.271 | 15 |
| e2e-lock.test.ts | 8.046 | 12 |
| filter-editor.test.tsx | 7.886 | 30 |
| deals.test.ts | 7.027 | 76 |
| notes-card-body.test.tsx | 6.744 | 9 |
| lead-record-screen.test.tsx | 6.559 | 16 |
| global-search.test.tsx | 6.275 | 13 |
| filter-panel-tags.test.tsx | 5.633 | 7 |
| cases-solutions.test.ts | 5.261 | 118 |
| recycle-bin-page.test.tsx | 5.031 | 10 |
| events.test.ts | 4.438 | 75 |
| calls.test.ts | 4.303 | 67 |
| tasks.test.ts | 3.960 | 73 |
| accounts.test.ts | 3.874 | 65 |
| export-dialog.test.tsx | 3.790 | 8 |
| account-record-screen.test.tsx | 3.757 | 5 |

Top 2 files (`module-list-screen.test.tsx` at ~62 s and `http-record-service.contract.test.ts` at ~31 s) account for ~20% of total unit test wall time.

### 2.2 E2E specs — slowest 20 specs (across all 4 shards)

Duration sums all test attempts from the Playwright JSON reports (`apps/web/test-results/results.json`). Parallel tests overlap in wall time.

| File | Duration (s) | Tests | Shard |
| --- | ---: | ---: | ---: |
| accounts-detail.spec.ts | 119.430 | 24 | 1 |
| leads-list.spec.ts | 97.013 | 30 | 3 |
| contacts-detail.spec.ts | 79.351 | 24 | 2 |
| deals-detail.spec.ts | 72.288 | 22 | 2 |
| records-bulk-actions.spec.ts | 61.234 | 12 | 4 |
| accounts-form.spec.ts | 51.062 | 13 | 1 |
| button-typography.spec.ts | 45.392 | 4 | 1 |
| leads-detail.spec.ts | 45.107 | 16 | 3 |
| contacts-form.spec.ts | 44.459 | 15 | 2 |
| deals-form.spec.ts | 41.937 | 14 | 2 |
| cases-list.spec.ts | 41.619 | 8 | 1 |
| filter-editors.spec.ts | 39.017 | 5 | 2 & 3 |
| calls-form.spec.ts | 31.992 | 9 | 1 |
| records-inline-edit-validation.spec.ts | 31.236 | 8 | 4 |
| deals-board.spec.ts | 30.834 | 10 | 2 |
| campaigns-form.spec.ts | 28.880 | 9 | 1 |
| field-input.spec.ts | 28.663 | 4 | 2 |
| shell.spec.ts | 28.240 | 9 | 4 |
| dev-ui-inputs.spec.ts | 27.700 | 6 | 2 |
| filter-panel.spec.ts | 27.635 | 2 | 3 |

### 2.3 Step summary overhead measurement

Measured via GitHub Actions Jobs API timestamps for run `40083180630`:

- `Summarize test durations` step duration:
  - `fast`: 0 s
  - `e2e (1/4)`: 0 s
  - `e2e (2/4)`: 0 s
  - `e2e (3/4)`: 1 s
  - `e2e (4/4)`: 0 s
  - `e2e (macOS geometry)`: 1 s
- Artifact upload (`fast-results`): 2 s
- JSON reporter generation overhead: negligible (< 1 s in vitest / playwright)
- Total added time: ~2–3 s per job, well below the 15 s ceiling.

## 3. Speed-up proposals (ranked)

| # | Proposal | Est. saving | Risk |
|---|---|---|---|
| 1 | Publish per-file durations (vitest JSON + Playwright JSON) in the step summary, so the other items can be targeted | none directly; enables the rest | Very low |
| 2 | Split `fast` unit/component tests into two parallel jobs (or vitest shards), as lint/typecheck and 7 min of tests run serially today | **Measured:** 2.9 min saved vs p90 (9.7 min baseline down to 6.8 min wall time, run 40128174309; fast aggregating job 34 s) | Implemented (MEP-1316) |
| 3 | Rebalance e2e shards: shard 2 is 1.7 min slower than shard 4 | about 0.5 to 1 min on the critical path | Low; needs per-spec timings (item 1) |
| 4 | Reuse the test database template between specs instead of re-creating it | unmeasured, likely 5 to 10% of the browser step | Medium; test isolation |
| 5 | Skip the macOS geometry job for changes that touch no layout or CSS code | saves a macOS runner, about 3 min of cost, not critical path | Medium; a path filter can miss a layout-affecting change |
| 6 | Cache the pnpm store and Next build output across runs | under 20 s per job, small | Low |

## 4. Worktree and disk report

Counts are the number of directories under `.paperclip/worktrees/mep/`; sizes come from `du`. The number of worktrees (27) and total size (about 17 GiB) were measured today. Issue status came from the Paperclip API.

- Total: 27 trees, about 17 GiB. Of these, 12 hold a `.next` build output totalling about 3.5 GiB (`apps/web/.next`).
- Done or cancelled issues: 10 trees, about 5.7 GiB. Four of them (MEP-1143, MEP-1170, MEP-1196, MEP-1287) hold a `.next` of 0.27 to 0.35 GiB, about 1.2 GiB together; two more (MEP-1131, MEP-1031) are cancelled without a `.next`.
- Largest done/cancelled trees: MEP-1287 1.2 GiB, MEP-1170 1.2 GiB, MEP-1143 1.2 GiB, MEP-1196 1.1 GiB, MEP-1131 0.9 GiB.
- Two extra trees named `MEP-560-before` and `MEP-560-after` (1.1 GiB each, with `.next`) belong to no open issue and look like a leftover measurement pair.
- Blocked issues MEP-11, MEP-40 and MEP-358 hold 0.9 to 1.2 GiB each; they are not removal candidates.

Note: `node_modules` in a worktree is a copy-on-write clone of the pnpm store, so deleting it frees little real space; `.next` output is the real saving.

Recommendation (nothing deleted; removal needs a board card):
1. Remove `apps/web/.next` in the four done/cancelled trees above: about 1.2 GiB real space, no risk (rebuilt on demand).
2. Remove the whole worktrees of the 10 done/cancelled issues once their branches are confirmed merged into `main`: up to about 5.7 GiB (less the clone sharing).
3. Ask the board whether `MEP-560-before` / `MEP-560-after` can go: about 2.2 GiB.
