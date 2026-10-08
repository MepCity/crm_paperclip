# End-to-end tests

Specs in this directory run in Chromium against a production build. Import `test` and `expect` from `./support/test` (or the relative equivalent from a nested file), not from Playwright's package entry. The wrapper fails the test when the page writes a console `error` or throws an uncaught exception, and the failure message includes that text.

## Writing a spec

```ts
import { expectNoA11yViolations } from "./support/a11y";
import { expect, test } from "./support/test";

test("screen name", async ({ page }) => {
  await page.goto("/path");
  await expect(page.getByRole("heading", { name: "Screen" })).toBeVisible();
  await expectNoA11yViolations(page);
});
```

## Helpers

- `expectNoA11yViolations(page, options?)` in `support/a11y.ts` settles finite animations at their end state, then runs WCAG 2.1 A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). A fade still in progress can fail colour contrast even when the resting colours pass. Infinite animations are left running. A violation fails the test with the rule id, impact, affected selectors, and help URL.
- `options.exclude` skips selectors. Every call site must comment why those selectors are left out.
- Console and page errors are collected automatically by the `test` fixture. Specs do not opt in.

## Run

From the repository root:

```sh
corepack pnpm test:e2e
```

Pass extra Playwright CLI arguments after the script name (for example `corepack pnpm test:e2e auth.spec.ts --repeat-each=10`).

That builds the app, starts a throwaway database, and runs Playwright.

## Machine load and locking

Several agents may run `verify` on the same host. The E2E driver (`scripts/e2e.ts`) starts PostgreSQL outside the lock, then serializes `next build` and `playwright test` with a machine-wide directory lock (default `/tmp/crm-e2e.lock`). A second run waits and logs `e2e: waiting for another run (pid …)` about every minute until the holder finishes.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MEP_E2E_LOCK` | enabled | Set to `0` to disable locking (single-run behaviour). |
| `MEP_E2E_LOCK_DIR` | `/tmp/crm-e2e.lock` | Lock directory (use a dedicated path in tests). |
| `MEP_E2E_LOCK_WAIT_MS` | `1200000` (20 min) | Max wait for the lock; then the run continues without it. |

Playwright assertions use a **30s** default expect timeout (`playwright.config.ts`). Per-call timeouts in specs (for example `{ timeout: 50 }`) are unchanged.
