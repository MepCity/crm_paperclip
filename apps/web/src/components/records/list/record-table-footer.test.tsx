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

function parts() {
  const footer = document.querySelector("[data-part=footer]");
  return [
    ...(footer?.querySelectorAll("[data-part=previous], [data-part=range], [data-part=next]") ??
      []),
  ].map((element) => element.getAttribute("data-part"));
}

test("shows the total and a bold range, with the previous control before the range", () => {
  footer({ total: 24, page: 2, pageSize: 10, recordCount: 10, moreRecords: true });

  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(screen.getByText("24").className).toContain("font-semibold");
  const range = document.querySelector("[data-part=range]");
  expect(range?.textContent).toBe("11 to 20");
  const ends = range?.querySelectorAll("[data-part=range-end]") ?? [];
  expect(ends).toHaveLength(2);
  for (const end of ends) expect(end.className).toContain("font-semibold");
  expect(document.querySelector("[data-part=range-to-word]")?.className ?? "").toContain(
    "text-text-muted",
  );
  expect(document.querySelector("[data-part=range-to-word]")?.className ?? "").not.toContain(
    "font-semibold",
  );
  expect(parts()).toEqual(["previous", "range", "next"]);
  expect(screen.queryByText("Previous")).toBeNull();
  expect(screen.queryByText("Next")).toBeNull();
});

test("omits the number, the range and the controls when nothing is on the page", () => {
  footer({ total: null, recordCount: 0 });

  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(document.querySelector("[data-part=total-value]")).toBeNull();
  expect(document.querySelector("[data-part=range]")).toBeNull();
  expect(document.querySelector("[data-part=previous]")).toBeNull();
  expect(document.querySelector("[data-part=next]")).toBeNull();
});

test("shows only the total when the page has no records", () => {
  footer({ total: 0, recordCount: 0 });

  expect(screen.getByText("Total Records")).toBeTruthy();
  expect(screen.getByText("0")).toBeTruthy();
  expect(document.querySelector("[data-part=range]")).toBeNull();
  expect(document.querySelector("[data-part=previous]")).toBeNull();
});

test("disables both controls on a single page without visible names", () => {
  footer();

  const previous = document.querySelector("[data-part=previous] [data-part=chevron]");
  const next = document.querySelector("[data-part=next] [data-part=chevron]");
  expect(previous?.getAttribute("aria-disabled")).toBe("true");
  expect(previous?.getAttribute("aria-label")).toBe("Previous");
  expect(next?.getAttribute("aria-disabled")).toBe("true");
  expect(next?.getAttribute("aria-label")).toBe("Next");
  expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
  expect(screen.queryByText("Previous")).toBeNull();
  expect(screen.queryByText("Next")).toBeNull();
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
