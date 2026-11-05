import { expect, test } from "vitest";
import { productsRelatedListRail, productsRelatedLists } from "./products-related-lists";

test("products related list rail and lists match specification", () => {
  expect(productsRelatedListRail.organizeAriaLabel).toBe("Organize Products Details");
  expect(productsRelatedListRail.linksGroup?.title).toBe("Links");

  const ids = productsRelatedLists.map((l) => l.id);
  expect(ids).toContain("notes");
  expect(ids).toContain("attachments");
  expect(ids).toContain("open-activities");
  expect(ids).toContain("closed-activities");
  expect(ids).toContain("quotes");
  expect(ids).toContain("invoices");

  const quotesCard = productsRelatedLists.find((l) => l.id === "quotes");
  expect(quotesCard?.title).toBe("Quotes");
  expect(quotesCard?.renderBody).toBeDefined();

  const invoicesCard = productsRelatedLists.find((l) => l.id === "invoices");
  expect(invoicesCard?.title).toBe("Invoices");
  expect(invoicesCard?.renderBody).toBeDefined();
});
