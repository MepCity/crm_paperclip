import { test as base, type ConsoleMessage, expect } from "@playwright/test";

/**
 * Fails when the list is non-empty. The automatic fixture calls this after every test.
 * Meta-tests call it to prove the failure text, then clear the list so the suite stays green.
 */
export function assertNoPageErrors(errors: readonly string[]): void {
  if (errors.length === 0) return;
  const lines = errors.map((error) => `- ${error}`).join("\n");
  throw new Error(`Browser page errors (${errors.length}):\n${lines}`);
}

/** Drop console errors for failed HTTP responses with the given status codes. */
export function ignoreFailedResponses(errors: string[], statuses: readonly number[]) {
  const next = errors.filter(
    (error) => !statuses.some((status) => error.includes(`status of ${status}`)),
  );
  errors.splice(0, errors.length, ...next);
}

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() === "error") errors.push(message.text());
      };
      const onPageError = (error: Error) => {
        errors.push(error.message);
      };
      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      await use(errors);
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      assertNoPageErrors(errors);
    },
    { auto: true },
  ],
});

export { expect };
