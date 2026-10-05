import { expect, type Locator, type Page } from "@playwright/test";

/** Computed value of a token applied to a temporary element. */
export async function tokenValue(page: Page, property: "font-size" | "font-weight", token: string) {
  return page.evaluate(
    ({ property, token }) => {
      const probe = document.createElement("span");
      probe.style.setProperty(property, `var(${token})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return value;
    },
    { property, token },
  );
}

export async function expectType(page: Page, target: Locator, size: string, weight: string) {
  await expect(target).toHaveCSS("font-size", await tokenValue(page, "font-size", size));
  await expect(target).toHaveCSS("font-weight", await tokenValue(page, "font-weight", weight));
}
