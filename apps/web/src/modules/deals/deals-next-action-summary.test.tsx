import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ParentActivityCategory } from "@/lib/records/parent-activities";
import { render } from "@/test/render";
import { DealsNextActionSummary } from "./deals-next-action-summary";

type Row = { id: string; subject: string; date: string | null };
let open: ParentActivityCategory[] = [];
let loading = false;

function cat(kind: "task" | "meeting" | "call", rows: Row[]): ParentActivityCategory {
  return {
    kind,
    count: rows.length,
    rows: rows.map((r) => ({
      ...r,
      href: `/tab/${kind === "task" ? "Tasks" : kind === "meeting" ? "Events" : "Calls"}/${r.id}`,
      dateText: null,
      ownerName: null,
      details: [],
    })),
  };
}

vi.mock("@/lib/records/use-parent-activities", () => ({
  useParentActivities: () => ({ isLoading: loading, isError: false, open, closed: [] }),
}));

afterEach(() => {
  cleanup();
  open = [];
  loading = false;
});

const path = (module: string, id: string) => `/tab/${module}/${id}`;
const show = () => render(<DealsNextActionSummary dealId="d1" recordPath={path} />);

test("single open task shows strip and link", () => {
  open = [cat("task", [{ id: "t1", subject: "Call back", date: "2026-03-05" }])];
  show();
  expect(screen.getByRole("heading", { name: "Next Action" })).toBeTruthy();
  expect(screen.getByText("Mar")).toBeTruthy();
  expect(screen.getByText("5")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Call back" }).getAttribute("href")).toBe(
    "/tab/Tasks/t1",
  );
});

test("earlier meeting beats later task", () => {
  open = [
    cat("task", [{ id: "t1", subject: "Task", date: "2026-03-09" }]),
    cat("meeting", [{ id: "m1", subject: "Meet", date: "2026-03-02T10:00:00Z" }]),
  ];
  show();
  expect(screen.getByRole("link", { name: "Meet" }).getAttribute("href")).toBe("/tab/Events/m1");
  expect(screen.queryByText("Task")).toBeNull();
});

test("same date: task wins over call", () => {
  open = [
    cat("task", [{ id: "t1", subject: "Task", date: "2026-03-09" }]),
    cat("call", [{ id: "c1", subject: "Ring", date: "2026-03-09" }]),
  ];
  show();
  expect(screen.getByRole("link", { name: "Task" })).toBeTruthy();
  expect(screen.queryByText("Ring")).toBeNull();
});

test("undated open activity keeps link, empty strip", () => {
  open = [cat("call", [{ id: "c1", subject: "Ring", date: null }])];
  show();
  expect(screen.getByRole("link", { name: "Ring" }).getAttribute("href")).toBe("/tab/Calls/c1");
});

test("no open activities renders nothing (closed-only or empty)", () => {
  open = [];
  const { container } = show();
  expect(container.querySelector("[data-deals-next-action-summary]")).toBeNull();
});
