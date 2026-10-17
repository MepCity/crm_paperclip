import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { RecordPageFooter } from "./record-page-footer";

afterEach(cleanup);

test("renders contentinfo landmark with expected text and placeholder buttons", () => {
  render(<RecordPageFooter />);
  const footer = screen.getByRole("contentinfo", { name: "Record Management Section" });
  expect(footer).toBeTruthy();

  expect(within(footer).getByText("Record detail page views :")).toBeTruthy();

  const addRelatedListBtn = within(footer).getByRole("button", { name: "Add Related List" });
  const standardViewBtn = within(footer).getByRole("button", { name: "Standard View" });
  const customPageBtn = within(footer).getByRole("button", {
    name: "Create a custom record page",
  });

  expect(addRelatedListBtn).toBeTruthy();
  expect(standardViewBtn).toBeTruthy();
  expect(customPageBtn).toBeTruthy();

  expect(addRelatedListBtn.getAttribute("data-later-module")).toBe("M11");
  expect(addRelatedListBtn.getAttribute("aria-disabled")).toBe("true");
  expect(standardViewBtn.getAttribute("data-later-module")).toBe("M11");
  expect(standardViewBtn.getAttribute("aria-disabled")).toBe("true");
  expect(customPageBtn.getAttribute("data-later-module")).toBe("M11");
  expect(customPageBtn.getAttribute("aria-disabled")).toBe("true");
});

test("placeholder buttons are inert and do not throw when pressed", async () => {
  const user = userEvent.setup();
  render(<RecordPageFooter />);
  const footer = screen.getByRole("contentinfo", { name: "Record Management Section" });

  const addRelatedListBtn = within(footer).getByRole("button", { name: "Add Related List" });
  const standardViewBtn = within(footer).getByRole("button", { name: "Standard View" });
  const customPageBtn = within(footer).getByRole("button", {
    name: "Create a custom record page",
  });

  await user.click(addRelatedListBtn);
  await user.click(standardViewBtn);
  await user.click(customPageBtn);

  addRelatedListBtn.focus();
  expect(document.activeElement).toBe(addRelatedListBtn);
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
});
