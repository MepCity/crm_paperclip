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

- `expectNoA11yViolations(page, options?)` in `support/a11y.ts` waits for finite animations to finish, then runs WCAG 2.1 A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). A fade still in progress can fail colour contrast even when the resting colours pass. Infinite animations are not waited on. A violation fails the test with the rule id, impact, affected selectors, and help URL.
- `options.exclude` skips selectors. Every call site must comment why those selectors are left out.
- Console and page errors are collected automatically by the `test` fixture. Specs do not opt in.

## Run

From the repository root:

```sh
corepack pnpm test:e2e
```

That builds the app, starts a throwaway database, and runs Playwright.
