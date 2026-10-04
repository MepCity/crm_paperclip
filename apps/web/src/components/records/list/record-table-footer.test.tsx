import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { RecordTableFooter, type RecordTableFooterProps } from "./record-table-footer";

afterEach(cleanup);

function footer(overrides: Partial<RecordTableFooterProps> = {}) {
  return render(
    <RecordTableFooter
      total={10}
      page={1}
      pageSize={10}
      recordCount={10}
      moreRecords={false}
      previousHref={null}
      nextHref={null}
      {...overrides}
    />,
  );
}

test("shows the total and a bold range for the current page", () => {
  footer({ total: 24, page: 2, pageSize: 10, recordCount: 10, moreRecords: true });

  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(screen.getByText("24").className).toContain("font-semibold");
  const range = document.querySelector("[data-part=range]");
  expect(range?.textContent).toBe("11 to 20");
  const ends = range?.querySelectorAll("[data-part=range-end]") ?? [];
  expect(ends).toHaveLength(2);
  for (const end of ends) expect(end.className).toContain("font-semibold");
  expect(document.querySelector("[data-part=range-to-word]")?.className ?? "").not.toContain(
    "font-semibold",
  );
});

test("omits the number when the total has not arrived and shows an empty range", () => {
  footer({ total: null, recordCount: 0 });

  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(document.querySelector("[data-part=total-value]")).toBeNull();
  expect(document.querySelector("[data-part=range]")?.textContent).toBe("0 to 0");
});

test("disables both controls on a single page", () => {
  footer();

  expect(screen.getByText("Previous").closest("[aria-disabled=true]")).toBeTruthy();
  expect(screen.getByText("Next").closest("[aria-disabled=true]")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
});

test("enables only the directions that have an address", () => {
  const { rerender } = footer({
    page: 1,
    moreRecords: true,
    previousHref: "/records?page=0",
    nextHref: "/records?page=2",
  });

  expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
  expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/records?page=2");

  rerender(
    <RecordTableFooter
      total={30}
      page={3}
      pageSize={10}
      recordCount={10}
      moreRecords={false}
      previousHref="/records?page=2"
      nextHref="/records?page=4"
    />,
  );
  expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe(
    "/records?page=2",
  );
  expect(screen.queryByRole("link", { name: "Next" })).toBeNull();

  rerender(
    <RecordTableFooter
      total={30}
      page={2}
      pageSize={10}
      recordCount={10}
      moreRecords={true}
      previousHref="/records?page=1"
      nextHref="/records?page=3"
    />,
  );
  expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe(
    "/records?page=1",
  );
  expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/records?page=3");
});
