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

Not available. Per-test and per-file durations are only in the e2e report/trace artifacts and the vitest reporter output, and artifact downloads and job logs need an authenticated GitHub session, which this run does not have. Local full-suite timing is forbidden on the shared machine. Follow-up: add `--reporter=json` (vitest) and keep the Playwright JSON report in the uploaded artifact, then publish a top-20 table in the CI step summary (proposal 1 below).

## 3. Speed-up proposals (ranked)

| # | Proposal | Est. saving | Risk |
|---|---|---|---|
| 1 | Publish per-file durations (vitest JSON + Playwright JSON) in the step summary, so the other items can be targeted | none directly; enables the rest | Very low |
| 2 | Split `fast` unit/component tests into two parallel jobs (or vitest shards), as lint/typecheck and 7 min of tests run serially today | about 3 min on the p90 critical path (9.7 to about 6.5) | Low; one more runner per push |
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
