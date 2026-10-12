import { expectNoA11yViolations } from "./a11y";
import { assertNoPageErrors, expect, test } from "./test";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function pageHtml(body: string, title = "Fixture"): string {
  return `<!DOCTYPE html><html lang="en"><head><title>${title}</title></head><body>${body}</body></html>`;
}

test("reports rule id, impact, selectors, and help url for known violations", async ({ page }) => {
  await page.setContent(
    pageHtml(`
      <main>
        <h1>Broken</h1>
        <button type="button"></button>
        <img src="${PIXEL}">
      </main>
    `),
  );

  let message = "";
  try {
    await expectNoA11yViolations(page);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  expect(message).toMatch(/button-name \((critical|serious|moderate|minor)\)/);
  expect(message).toMatch(/image-alt \((critical|serious|moderate|minor)\)/);
  expect(message).toContain("selectors:");
  expect(message).toContain("button");
  expect(message).toContain("img");
  expect(message).toContain("https://dequeuniversity.com/rules/axe/");
});

test("passes when the page has no violations", async ({ page }) => {
  await page.setContent(
    pageHtml(`
      <main>
        <h1>Ready</h1>
        <p>Nothing is wrong on this page.</p>
        <button type="button">Save</button>
        <img src="${PIXEL}" alt="Blank">
      </main>
    `),
  );

  await expectNoA11yViolations(page);
});

test("settles a running fade at its resting color before scanning", async ({ page }) => {
  await page.setContent(
    pageHtml(`
      <style>
        body { background: #ffffff; color: #313949; }
        @keyframes rise {
          from { opacity: 0.2; }
          to { opacity: 1; }
        }
        #fading {
          color: #313949;
          background: #ffffff;
          font-size: 16px;
          animation: rise 5s linear forwards;
        }
      </style>
      <main>
        <h1>Ready</h1>
        <p id="fading">This label is readable once the fade finishes.</p>
      </main>
    `),
  );

  const opacity = () =>
    page.locator("#fading").evaluate((element) => Number(getComputedStyle(element).opacity));

  // Still in the fade: partial opacity composites the text toward the page
  // and drops it under 4.5:1. Scanning here fails unless the helper settles
  // the animation at its end state.
  expect(await opacity()).toBeLessThan(0.5);
  await expectNoA11yViolations(page);
  expect(await opacity()).toBeGreaterThan(0.99);
});

test("does not wait out an infinite animation", async ({ page }) => {
  await page.setContent(
    pageHtml(`
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
      </style>
      <main>
        <h1>Ready</h1>
        <p class="spin">Loading</p>
      </main>
    `),
  );

  await expectNoA11yViolations(page);
  // A spinner never finishes. The helper must not finish it for the scan.
  const spinAnimation = await page.locator(".spin").evaluate((element) => {
    const animation = element.getAnimations()[0];
    if (!animation) return null;
    const timing = animation.effect?.getComputedTiming();
    return {
      playState: animation.playState,
      iterations: timing?.iterations ?? null,
    };
  });
  expect(spinAnimation).not.toBeNull();
  expect(spinAnimation?.playState).toBe("running");
  expect(spinAnimation?.iterations).toBe(Infinity);
});

test("leaves excluded selectors out of the scan", async ({ page }) => {
  await page.setContent(
    pageHtml(`
      <main>
        <h1>Excluded</h1>
        <div id="ignored"><button type="button"></button></div>
        <button type="button">Keep</button>
      </main>
    `),
  );

  await expect(expectNoA11yViolations(page)).rejects.toThrow(/button-name/);
  // #ignored stands in for a third-party widget whose markup this screen does not own.
  await expectNoA11yViolations(page, { exclude: ["#ignored"] });
});

test("records console.error and fails with that text", async ({ page, pageErrors }) => {
  await page.setContent(pageHtml(`<script>console.error("fixture-console-error")</script>`));
  await expect.poll(() => pageErrors.join("\n")).toContain("fixture-console-error");
  expect(() => assertNoPageErrors(pageErrors)).toThrow(/fixture-console-error/);
  // The fixture fails the test while this list is non-empty. Clear it only after
  // the failure text is checked so this meta-test stays green.
  pageErrors.length = 0;
});

test("records an uncaught exception and fails with that text", async ({ page, pageErrors }) => {
  await page.setContent(pageHtml(`<script>throw new Error("fixture-page-error")</script>`));
  await expect.poll(() => pageErrors.join("\n")).toContain("fixture-page-error");
  expect(() => assertNoPageErrors(pageErrors)).toThrow(/fixture-page-error/);
  pageErrors.length = 0;
});
