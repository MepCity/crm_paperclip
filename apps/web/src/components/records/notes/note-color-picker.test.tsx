import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { NOTE_COLOR_PALETTE, NoteColorPicker } from "./note-color-picker";

afterEach(cleanup);

function cellAt(cells: HTMLElement[], i: number): HTMLElement {
  const cell = cells[i];
  if (!cell) throw new Error(`no cell at ${i}`);
  return cell;
}

function labelOf(el: HTMLElement): string | null {
  return el.getAttribute("aria-label");
}

// ---------------------------------------------------------------------------
// Palette integrity
// ---------------------------------------------------------------------------

describe("NOTE_COLOR_PALETTE", () => {
  test("contains exactly 16 colours in spec order", () => {
    expect(NOTE_COLOR_PALETTE).toHaveLength(16);
    expect([...NOTE_COLOR_PALETTE]).toEqual([
      "#000000",
      "#434343",
      "#666666",
      "#999999",
      "#cccccc",
      "#ffffff",
      "#e53935",
      "#fb8c00",
      "#fdd835",
      "#43a047",
      "#00acc1",
      "#1e88e5",
      "#3949ab",
      "#8e24aa",
      "#d81b60",
      "#6d4c41",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("NoteColorPicker rendering", () => {
  test("renders 16 cells when allowNone is absent", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    expect(cells).toHaveLength(16);
  });

  test("cells appear in palette order: first cell is #000000, last is #6d4c41", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    expect(labelOf(cellAt(cells, 0))).toBe("#000000");
    expect(labelOf(cellAt(cells, 15))).toBe("#6d4c41");
  });

  test("each cell has aria-label equal to its hex value", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    for (const [i, color] of NOTE_COLOR_PALETTE.entries()) {
      expect(labelOf(cellAt(cells, i))).toBe(color);
    }
  });

  test("renders label text as a visible heading", () => {
    render(<NoteColorPicker label="Font Background Color" onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Font Background Color")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// allowNone
// ---------------------------------------------------------------------------

describe("NoteColorPicker allowNone", () => {
  test("adds a 'No Color' cell as the first cell when allowNone=true", () => {
    render(<NoteColorPicker label="Font Color" allowNone onPick={vi.fn()} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    expect(cells).toHaveLength(17);
    expect(labelOf(cellAt(cells, 0))).toBe("No Color");
  });

  test("'No Color' cell calls onPick with empty string", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<NoteColorPicker label="Font Color" allowNone onPick={onPick} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const noColor = within(table).getByRole("button", { name: "No Color" });
    await user.click(noColor);
    expect(onPick).toHaveBeenCalledOnce();
    expect(onPick).toHaveBeenCalledWith("");
  });

  test("palette cells still carry their hex value after the No Color cell", () => {
    render(<NoteColorPicker label="Font Color" allowNone onPick={vi.fn()} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    expect(labelOf(cellAt(cells, 1))).toBe("#000000");
    expect(labelOf(cellAt(cells, 16))).toBe("#6d4c41");
  });
});

// ---------------------------------------------------------------------------
// Mouse / click selection
// ---------------------------------------------------------------------------

describe("NoteColorPicker click selection", () => {
  test("clicking a colour cell calls onPick with that hex value", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={onPick} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    await user.click(within(table).getByRole("button", { name: "#e53935" }));
    expect(onPick).toHaveBeenCalledOnce();
    expect(onPick).toHaveBeenCalledWith("#e53935");
  });

  test("clicking the white cell (#ffffff) calls onPick with '#ffffff'", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={onPick} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    await user.click(within(table).getByRole("button", { name: "#ffffff" }));
    expect(onPick).toHaveBeenCalledWith("#ffffff");
  });
});

// ---------------------------------------------------------------------------
// Keyboard selection (Enter / Space)
// ---------------------------------------------------------------------------

describe("NoteColorPicker keyboard selection", () => {
  test("pressing Enter on a focused cell calls onPick", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={onPick} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cell = within(table).getByRole("button", { name: "#43a047" });
    cell.focus();
    await user.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("#43a047");
  });

  test("pressing Space on a focused cell calls onPick", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={onPick} onClose={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cell = within(table).getByRole("button", { name: "#1e88e5" });
    cell.focus();
    await user.keyboard(" ");
    expect(onPick).toHaveBeenCalledWith("#1e88e5");
  });
});

// ---------------------------------------------------------------------------
// Arrow-key navigation
// ---------------------------------------------------------------------------

describe("NoteColorPicker arrow-key navigation", () => {
  function getTable() {
    return screen.getByRole("table");
  }

  function getCells() {
    return within(getTable()).getAllByRole("button");
  }

  test("ArrowRight moves focus one cell to the right", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 0).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowRight" });
    expect(document.activeElement).toBe(cellAt(cells, 1));
  });

  test("ArrowLeft moves focus one cell to the left", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 2).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cellAt(cells, 1));
  });

  test("ArrowDown moves focus one row down (8 columns)", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    // First cell is #000000 (index 0); one row down → index 8 (#1e88e5)
    cellAt(cells, 0).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowDown" });
    expect(document.activeElement).toBe(cellAt(cells, 8));
  });

  test("ArrowUp moves focus one row up (8 columns)", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 8).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowUp" });
    expect(document.activeElement).toBe(cellAt(cells, 0));
  });

  test("ArrowRight does not go past the last cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    const last = cellAt(cells, cells.length - 1);
    last.focus();
    fireEvent.keyDown(getTable(), { key: "ArrowRight" });
    expect(document.activeElement).toBe(last);
  });

  test("ArrowLeft does not go before the first cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 0).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cellAt(cells, 0));
  });

  test("ArrowDown from the last row stays on the last cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    const last = cellAt(cells, cells.length - 1);
    last.focus();
    fireEvent.keyDown(getTable(), { key: "ArrowDown" });
    expect(document.activeElement).toBe(last);
  });

  test("ArrowUp from the first row stays on the first cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 0).focus();
    fireEvent.keyDown(getTable(), { key: "ArrowUp" });
    expect(document.activeElement).toBe(cellAt(cells, 0));
  });

  test("Home key moves focus to the first cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 7).focus();
    fireEvent.keyDown(getTable(), { key: "Home" });
    expect(document.activeElement).toBe(cellAt(cells, 0));
  });

  test("End key moves focus to the last cell", () => {
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={vi.fn()} />);
    const cells = getCells();
    cellAt(cells, 0).focus();
    fireEvent.keyDown(getTable(), { key: "End" });
    expect(document.activeElement).toBe(cellAt(cells, cells.length - 1));
  });
});

// ---------------------------------------------------------------------------
// Escape
// ---------------------------------------------------------------------------

describe("NoteColorPicker Escape key", () => {
  test("Escape calls onClose", () => {
    const onClose = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={vi.fn()} onClose={onClose} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    cellAt(cells, 0).focus();
    fireEvent.keyDown(table, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("Escape does not call onPick", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(<NoteColorPicker label="Font Color" onPick={onPick} onClose={onClose} />);
    const table = screen.getByRole("table", { name: "Font Color" });
    const cells = within(table).getAllByRole("button");
    cellAt(cells, 0).focus();
    fireEvent.keyDown(table, { key: "Escape" });
    expect(onPick).not.toHaveBeenCalled();
  });
});
