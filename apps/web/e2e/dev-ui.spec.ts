import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";

test("dev ui gallery has no console errors and form demo works", async ({ page }) => {
  // Scan the settled colours, rather than the transient opacity of toast entry animations.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/dev/ui");
  await expect(page).toHaveTitle(/Component Gallery/);
  await expectNoA11yViolations(page);

  // Each demo is a labelled region so screens and tests can address it.
  const formRegion = page.getByRole("region", { name: "form" });
  await expect(formRegion).toBeVisible();

  const form = formRegion.getByRole("form", { name: "Demo sign-in form" });
  const emailInput = form.getByRole("textbox", { name: "Email" });
  await emailInput.fill("invalid-email");
  await form.getByRole("button", { name: "Sign In" }).click();

  const alert = form.getByRole("alert");
  await expect(alert).toHaveText(/Please check the form fields/);

  await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  const descId = await emailInput.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  await expect(page.locator(`id=${descId}`)).toHaveText("Invalid email address");

  // Keyboard-only: the menu opens with Enter and closes with Escape.
  const menuRegion = page.getByRole("region", { name: "menu" });
  const menuTrigger = menuRegion.getByRole("button", { name: "Options" });
  await menuTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();

  // An invalid Select trigger draws the same danger border as an invalid input.
  const invalidInput = page
    .getByRole("region", { name: "text field" })
    .getByRole("textbox", { name: "With Error" });
  await expect(invalidInput).toHaveAttribute("aria-invalid", "true");
  const invalidBorderColor = await invalidInput.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );

  const selectRegion = page.getByRole("region", { name: "select" });
  const invalidTrigger = selectRegion.getByRole("button", { name: /Invalid choice/ });
  await expect(invalidTrigger).toHaveAttribute("data-invalid", "true");
  const triggerBorderColor = await invalidTrigger.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );
  expect(triggerBorderColor).toBe(invalidBorderColor);
  await expect(selectRegion.getByRole("button", { name: /Select a fruit/ })).not.toHaveAttribute(
    "data-invalid",
  );

  const tabs = page.getByRole("region", { name: "tabs" });
  await tabs.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
  await expect(tabs.getByRole("tabpanel", { name: "Details" })).toBeVisible();

  const tooltip = page.getByRole("region", { name: "tooltip" });
  const tooltipTrigger = tooltip.getByRole("button", { name: "Account owner" });
  // Scrolling the trigger under a stationary pointer emits pointermove and
  // leaves keyboard focus unable to open the tooltip. Scroll first, restore
  // keyboard modality, then focus without scrolling again.
  await tooltipTrigger.scrollIntoViewIfNeeded();
  await page.keyboard.press("Escape");
  await tooltipTrigger.evaluate((element) => {
    element.focus({ preventScroll: true });
  });
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();

  const popover = page.getByRole("region", { name: "popover" });
  const filters = popover.getByRole("button", { name: "Filters" });
  await filters.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeHidden();

  const pagination = page.getByRole("region", { name: "pagination" });
  const firstPage = pagination.getByRole("group", { name: "First page" });
  const disabledPrevious = firstPage.getByText("Previous");
  const enabledNext = firstPage.getByRole("link", { name: "Next" });
  await expect(disabledPrevious).toHaveAttribute("aria-disabled", "true");
  expect(await disabledPrevious.getAttribute("class")).not.toContain("undefined");
  const controlBox = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      paddingTop: style.paddingTop,
      paddingRight: style.paddingRight,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderTopStyle: style.borderTopStyle,
      borderTopColor: style.borderTopColor,
    };
  };
  expect(await disabledPrevious.evaluate(controlBox)).toEqual(
    await enabledNext.evaluate(controlBox),
  );
  await expect(enabledNext).toHaveAttribute("href", "/dev/ui?page=2");
  const lastPage = pagination.getByRole("group", { name: "Last page" });
  await expect(lastPage.getByText("Next")).toHaveAttribute("aria-disabled", "true");
  await expect(lastPage.getByRole("link", { name: "Previous" })).toHaveAttribute(
    "href",
    "/dev/ui?page=4",
  );

  const toastRegion = page.getByRole("region", { name: "toast" });
  await toastRegion.getByRole("button", { name: "Show info" }).click();
  await toastRegion.getByRole("button", { name: "Show success" }).click();
  const danger = toastRegion.getByRole("button", { name: "Show danger" });
  await danger.click();
  await expect(page.getByRole("alertdialog", { name: "Export started" })).toBeVisible();
  await expect(page.getByRole("alertdialog", { name: "Record saved" })).toBeVisible();
  await expect(page.getByRole("alertdialog", { name: "Could not save" })).toBeVisible();
  await expect(danger).toBeFocused();
  // The scan can outlast the notification lifetime. The three toasts are
  // already visible above; requiring the first one to still be mounted
  // afterwards races that lifetime and fails when the scan is slow.
  await expectNoA11yViolations(page);
  // A pointer resting on the toast pauses its timer. Park it clear of the
  // region so auto-dismiss runs from whatever time is left.
  await page.mouse.move(0, 0);
  await expect(page.getByRole("alertdialog", { name: "Could not save" })).toBeHidden({
    timeout: 7000,
  });

  expect(errors).toHaveLength(0);
});

/**
 * Every expected value below is quoted from a Visual layout section. Shell samples come from
 * `research/specs/app-shell.md`. List samples come from `research/specs/list-views.md`.
 * Colour samples are drawn as blocks, type samples as text, corner radii as boxes and every
 * `--size-*` metric as a bar whose width is the metric, so one computed style proves the token.
 */
test("token demo renders the values measured in the shell and list specs", async ({ page }) => {
  await page.goto("/dev/ui");

  const tokens = page.getByRole("region", { name: "tokens" });
  await expect(tokens).toBeVisible();
  const sample = (token: string) => tokens.locator(`[data-token="${token}"]`);

  // "Main content | Bounds and page surface | Leads `#EEF1F9`".
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(238, 241, 249)");
  // Colour summary: "`#FFFFFF` | Top bar, Home main surface, utility strip, menu".
  await expect(sample("--color-surface")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // Colour summary: "`#313949` | Page title/menu text".
  await expect(sample("--color-text")).toHaveCSS("background-color", "rgb(49, 57, 73)");
  // Colour summary: "`#616E88` | Top-bar line icons".
  await expect(sample("--color-text-muted")).toHaveCSS("background-color", "rgb(97, 110, 136)");
  // Colour summary: "`#CED0E1` | More Actions menu edge and dividers".
  await expect(sample("--color-border")).toHaveCSS("background-color", "rgb(206, 208, 225)");
  // Colour summary: "`#5464F2` | Sales folder icon, quick-create border, and open search
  // outline"; the same blue is the outline of the open global search input.
  await expect(sample("--color-primary")).toHaveCSS("background-color", "rgb(84, 100, 242)");
  // Colour summary: "`#F0F4FC` | Highlighted More Actions row".
  await expect(sample("--color-surface-hover")).toHaveCSS("background-color", "rgb(240, 244, 252)");
  // Colour summary: "`#223458` | Rail surface and empty local Search interior".
  await expect(sample("--color-rail-surface")).toHaveCSS("background-color", "rgb(34, 52, 88)");
  // "Rail/active row | Box, fill, text, indicator | `#31446F` fill".
  await expect(sample("--color-rail-item-active")).toHaveCSS(
    "background-color",
    "rgb(49, 68, 111)",
  );
  // Colour summary: "`#C2CBDE` | Rail labels and chevrons", which the group heading uses too.
  await expect(sample("--color-rail-text")).toHaveCSS("background-color", "rgb(194, 203, 222)");
  // "Top bar | Bounds and surface | Bottom rule at y 49-50 is 1 px `#DCDBEE`".
  await expect(sample("--color-topbar-border")).toHaveCSS("background-color", "rgb(220, 219, 238)");

  // "Navigation rail | Bounds and surface | 320 wide".
  await expect(sample("--size-rail-width")).toHaveCSS("width", "320px");
  // "Top bar | Bounds and surface | 50 high".
  await expect(sample("--size-topbar-height")).toHaveCSS("width", "50px");
  // "Rail/pinned rows | Row box and rhythm | 300 wide x 30 high".
  await expect(sample("--size-rail-row-height")).toHaveCSS("width", "30px");
  // "Rail/pinned rows | Row box and rhythm | then 36 px vertical pitch".
  await expect(sample("--size-rail-row-pitch")).toHaveCSS("width", "36px");
  // "Teamspace More Actions menu | Outer bounds and placement | about 237 x 187".
  await expect(sample("--size-menu-width")).toHaveCSS("width", "237px");

  // "Rail/active row | approx. 6 px radius"; the same radius is measured on the local Search
  // input, the quick-create box, the menu and the highlighted menu row.
  await expect(sample("--radius-md")).toHaveCSS("border-radius", "6px");

  // Type summary: "Page title | approx. 20 px / semibold".
  await expect(sample("--text-xl")).toHaveCSS("font-size", "20px");
  // Type summary: "Product selector | approx. 16 px / semibold".
  await expect(sample("--text-base")).toHaveCSS("font-size", "16px");
  // Type summary: "Rail fixed link | approx. 15 px / regular".
  await expect(sample("--text-md")).toHaveCSS("font-size", "15px");
  // Type summary: "Top-bar search placeholder | approx. 14 px / regular".
  await expect(sample("--text-sm")).toHaveCSS("font-size", "14px");
  // Type summary: weights measured in the spec are regular and semibold.
  await expect(sample("--font-weight-semibold")).toHaveCSS("font-weight", "600");
  await expect(sample("--font-weight-normal")).toHaveCSS("font-weight", "400");
  // Text roles: toolbar labels and column headers are "medium".
  await expect(sample("--font-weight-medium")).toHaveCSS("font-weight", "500");
  // Text roles: "View tab about 13 px"; Table footer: "text about 13 px".
  await expect(sample("--text-13")).toHaveCSS("font-size", "13px");

  // Surface and line colors: "panel and table outline 1 px `#DCDBEE`".
  await expect(sample("--color-panel-border")).toHaveCSS("background-color", "rgb(220, 219, 238)");
  // Surface and line colors: "horizontal row separators 1 px `#EDF0F4`".
  await expect(sample("--color-row-separator")).toHaveCSS("background-color", "rgb(237, 240, 244)");
  // Text roles: "column headers about 14 px medium `#202123`".
  await expect(sample("--color-text-strong")).toHaveCSS("background-color", "rgb(32, 33, 35)");
  // Text roles: "disabled pagination text/icon about `#B5B8BE`".
  await expect(sample("--color-text-disabled")).toHaveCSS("background-color", "rgb(181, 184, 190)");
  // Create and action buttons: gradient `#5767F6` at top.
  await expect(sample("--color-primary-gradient-start")).toHaveCSS(
    "background-color",
    "rgb(87, 103, 246)",
  );

  // Filter panel: "202 px wide including its 1 px borders".
  await expect(sample("--size-list-filter-width")).toHaveCSS("width", "202px");
  // Table header and rows: "Header 37 px high".
  await expect(sample("--size-list-header-height")).toHaveCSS("width", "37px");
  // Table header and rows: "54 px plus a 1 px separator".
  await expect(sample("--size-list-row-height")).toHaveCSS("width", "54px");
  // Data and trailing column widths: "200 px per column".
  await expect(sample("--size-list-column-width")).toHaveCSS("width", "200px");
  // Create and action buttons: "Split Create Lead 137.5 × 33 px".
  await expect(sample("--size-button-split-width")).toHaveCSS("width", "137.5px");
  // Manage Columns dialog: "about 16 px corners".
  await expect(sample("--radius-xl")).toHaveCSS("border-radius", "16px");
  // Selected / disabled: checkbox radius "2–3 px"; the token keeps 2 px.
  await expect(sample("--radius-sm")).toHaveCSS("border-radius", "2px");
  // View edit form: "8 px corners".
  await expect(sample("--radius-lg")).toHaveCSS("border-radius", "8px");

  // Create and action buttons: the primary Button uses the measured vertical gradient.
  const primaryButton = page
    .getByRole("region", { name: "button" })
    .getByRole("button", { name: "Primary", exact: true });
  await expect(primaryButton).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(primaryButton).toHaveCSS(
    "background-image",
    /rgb\(87, 103, 246\).*rgb\(21, 78, 197\)/,
  );

  // The info Alert carries the primary colour on its icon only: primary text on the 5%
  // primary tint measures 4.39:1, below the 4.5:1 that ADR 0003 requires.
  const infoAlert = page.getByRole("region", { name: "alert" }).getByRole("alert").first();
  await expect(infoAlert).toHaveCSS("color", "rgb(49, 57, 73)");
  await expect(infoAlert.locator("svg")).toHaveCSS("color", "rgb(84, 100, 242)");
});
