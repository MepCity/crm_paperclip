import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { type BoardColumn, type BoardMoveResult, RecordBoard } from "./record-board";

afterEach(cleanup);
const columns: readonly BoardColumn[] = [
  {
    key: "a",
    label: "First",
    count: 1,
    percentage: "10%",
    totalText: "USD 12",
    cards: [
      {
        id: "card",
        rows: [
          { text: "Record", href: "#record" },
          { text: "Stage" },
          { text: "Account", href: "#account" },
        ],
        iconLink: { href: "#task", label: "Task", icon: "✓", laterModule: "M5" },
      },
    ],
  },
  { key: "b", label: "Empty", count: 0, cards: [] },
];
function element(selector: string) {
  const result = document.querySelector(selector);
  if (!result) throw new Error(`Missing ${selector}`);
  return result;
}
function drop(from = "a", to = "b") {
  fireEvent.dragStart(element('[data-board-card="card"]'), {
    dataTransfer: { setData: vi.fn() },
  });
  fireEvent.drop(element(`[data-board-column="${to}"]`), {
    dataTransfer: { getData: () => from },
  });
}
it("renders header, ordered rows, links, toolbar and footer without empty text", async () => {
  const create = vi.fn();
  render(
    <RecordBoard
      columns={columns}
      toolbar={<span>Toolbar</span>}
      createLabel="Create Record"
      onCreate={create}
      onMove={vi.fn()}
    />,
  );
  expect(screen.getByText("10%")).toBeTruthy();
  expect(screen.getByText("USD 12")).toBeTruthy();
  expect(document.querySelectorAll(".record-board-count")[0]?.textContent).toBe("1");
  const card = element("article");
  expect([...card.querySelectorAll(":scope > div")].map((row) => row.textContent)).toEqual([
    "Record",
    "Stage",
    "Account",
  ]);
  expect(screen.getByRole("link", { name: "Account" }).getAttribute("href")).toBe("#account");
  expect(screen.getByRole("link", { name: "Task" }).getAttribute("data-later-module")).toBe("M5");
  expect(document.querySelector('[data-board-column="b"] .record-board-cards')?.textContent).toBe(
    "",
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Select First" }));
  expect((screen.getByRole("checkbox", { name: "Select First" }) as HTMLInputElement).checked).toBe(
    true,
  );
  fireEvent.click(
    within(screen.getByRole("region", { name: "Empty" })).getByRole("button", {
      name: "Create Record",
    }),
  );
  await waitFor(() => expect(create).toHaveBeenCalledWith("b"));
  expect(document.querySelectorAll(".record-board-footer-arrows")).toHaveLength(2);
});
for (const result of ["moved", "cancelled", "rejected"] as const) {
  it(`optimistically moves and handles ${result}`, async () => {
    let resolve!: (value: BoardMoveResult) => void;
    let reject!: () => void;
    const move = vi.fn(
      () =>
        new Promise<BoardMoveResult>((yes, no) => {
          resolve = yes;
          reject = no;
        }),
    );
    render(<RecordBoard columns={columns} createLabel="Create" onCreate={vi.fn()} onMove={move} />);
    drop();
    expect(move).toHaveBeenCalledWith("card", "a", "b");
    expect(document.querySelector('[data-board-column="b"] article')).toBeTruthy();
    if (result === "rejected") reject();
    else resolve(result);
    await waitFor(() =>
      expect(
        document.querySelector(`[data-board-column="${result === "moved" ? "b" : "a"}"] article`),
      ).toBeTruthy(),
    );
  });
}
it("ignores same-column drops and renders shared loading skeletons", () => {
  const move = vi.fn();
  const { rerender } = render(
    <RecordBoard columns={columns} createLabel="Create" onCreate={vi.fn()} onMove={move} />,
  );
  drop("a", "a");
  expect(move).not.toHaveBeenCalled();
  rerender(
    <RecordBoard columns={columns} createLabel="Create" onCreate={vi.fn()} onMove={move} loading />,
  );
  expect(screen.getAllByRole("status")).toHaveLength(2);
  expect(screen.queryByText("Record")).toBeNull();
});

it("optimistically redirects to selected stage and reconciles when server data arrives", async () => {
  const threeColumns: readonly BoardColumn[] = [
    ...columns,
    { key: "c", label: "Third", count: 0, cards: [] },
  ];
  let resolve!: (value: BoardMoveResult) => void;
  const move = vi.fn(
    () =>
      new Promise<BoardMoveResult>((yes) => {
        resolve = yes;
      }),
  );
  const { rerender } = render(
    <RecordBoard columns={threeColumns} createLabel="Create" onCreate={vi.fn()} onMove={move} />,
  );
  drop("a", "b");
  expect(document.querySelector('[data-board-column="b"] article')).toBeTruthy();
  // onMove resolves with redirected target "c" (e.g. from dialog selection)
  resolve({ to: "c" });
  await waitFor(() => {
    expect(document.querySelector('[data-board-column="c"] article')).toBeTruthy();
    expect(document.querySelector('[data-board-column="b"] article')).toBeNull();
  });
  expect(
    document.querySelector('[data-board-column="c"] article div:nth-child(2)')?.textContent,
  ).toBe("Third");
  const [colA, colB, colC] = threeColumns;
  if (!colA || !colB || !colC) throw new Error("Expected 3 columns");
  const updatedColumns: readonly BoardColumn[] = [
    { ...colA, count: 0, cards: [] },
    colB,
    {
      ...colC,
      count: 1,
      cards: [
        {
          id: "card",
          rows: [
            { text: "Record", href: "#record" },
            { text: "Third" },
            { text: "Account", href: "#account" },
          ],
        },
      ],
    },
  ];
  rerender(
    <RecordBoard columns={updatedColumns} createLabel="Create" onCreate={vi.fn()} onMove={move} />,
  );
  expect(document.querySelector('[data-board-column="c"] article')).toBeTruthy();
  expect(document.querySelector('[data-board-column="a"] article')).toBeNull();
  expect(document.querySelector('[data-board-column="b"] article')).toBeNull();
});

it("rolls back optimistic move when onMove returns cancelled", async () => {
  let resolve!: (res: BoardMoveResult) => void;
  const move = vi.fn(
    () =>
      new Promise<BoardMoveResult>((yes) => {
        resolve = yes;
      }),
  );
  render(<RecordBoard columns={columns} createLabel="Create" onCreate={vi.fn()} onMove={move} />);
  drop("a", "b");
  expect(document.querySelector('[data-board-column="b"] article')).toBeTruthy();
  resolve("cancelled");
  await waitFor(() => {
    expect(document.querySelector('[data-board-column="a"] article')).toBeTruthy();
    expect(document.querySelector('[data-board-column="b"] article')).toBeNull();
  });
});

it("rolls back optimistic move when onMove rejects with an error", async () => {
  let reject!: (err: unknown) => void;
  const move = vi.fn(
    () =>
      new Promise<BoardMoveResult>((_, no) => {
        reject = no;
      }),
  );
  render(<RecordBoard columns={columns} createLabel="Create" onCreate={vi.fn()} onMove={move} />);
  drop("a", "b");
  expect(document.querySelector('[data-board-column="b"] article')).toBeTruthy();
  reject(new Error("Network failure"));
  await waitFor(() => {
    expect(document.querySelector('[data-board-column="a"] article')).toBeTruthy();
    expect(document.querySelector('[data-board-column="b"] article')).toBeNull();
  });
});
