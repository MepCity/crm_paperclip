"use client";

import { type ReactElement, useCallback, useRef } from "react";
import "./note-color-picker.css";

/**
 * The 16 palette colours for Font Color / Font Background Color.
 * Order matches the spec (inventory items 95–96).
 * These are content colours, not design token references.
 */
export const NOTE_COLOR_PALETTE: readonly string[] = [
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
];

const COLUMNS = 8;

export interface NoteColorPickerProps {
  /** Accessible heading shown above the grid. "Font Color" | "Font Background Color" */
  label: string;
  /** When true the first cell is "No Color" and emits onPick(""). */
  allowNone?: boolean;
  /** Called with the chosen hex string, or "" for "No Color". */
  onPick: (color: string) => void;
  /** Called when the user presses Escape. */
  onClose: () => void;
}

/**
 * Colour-picker content panel for the note toolbar's Font Color and Font Background
 * Color buttons (inventory items 95–96).  Positioning is the caller's responsibility
 * (wrap in a Popover).
 *
 * Temporary rule: the reference CRM colour picker could not be opened during research
 * so the exact visual is not captured.  Layout follows the spec description: 8-column
 * grid, palette in spec order, white cell gets a thin border, label shown as heading.
 *
 * Biome note: <table> is the semantic equivalent of role="grid" (biome's own suggestion).
 * The keyboard handler is placed on the table element, which is a valid interactive
 * host for a composite widget.
 */
export function NoteColorPicker({
  label,
  allowNone = false,
  onPick,
  onClose,
}: NoteColorPickerProps): ReactElement {
  const tableRef = useRef<HTMLTableElement>(null);

  /** Build the flat list of cells: optional "No Color" + 16 palette entries. */
  const cells: Array<{ key: string; color: string | null; ariaLabel: string }> = allowNone
    ? [
        { key: "none", color: null, ariaLabel: "No Color" },
        ...NOTE_COLOR_PALETTE.map((c) => ({ key: c, color: c, ariaLabel: c })),
      ]
    : NOTE_COLOR_PALETTE.map((c) => ({ key: c, color: c, ariaLabel: c }));

  const totalCells = cells.length;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTableElement>) => {
      const focused = document.activeElement as HTMLElement | null;
      if (!focused) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      const buttons = Array.from(
        tableRef.current?.querySelectorAll<HTMLButtonElement>("button[data-cell]") ?? [],
      );
      const idx = buttons.indexOf(focused as HTMLButtonElement);
      if (idx === -1) return;

      let next = -1;
      if (event.key === "ArrowRight") {
        next = Math.min(idx + 1, totalCells - 1);
      } else if (event.key === "ArrowLeft") {
        next = Math.max(idx - 1, 0);
      } else if (event.key === "ArrowDown") {
        next = Math.min(idx + COLUMNS, totalCells - 1);
      } else if (event.key === "ArrowUp") {
        next = Math.max(idx - COLUMNS, 0);
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = totalCells - 1;
      }

      if (next !== -1) {
        event.preventDefault();
        buttons[next]?.focus();
      }
    },
    [onClose, totalCells],
  );

  /** Split cells into rows of COLUMNS. */
  const rows: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += COLUMNS) {
    rows.push(cells.slice(i, i + COLUMNS));
  }

  return (
    <div className="note-color-picker">
      <div className="note-color-picker__label" aria-hidden="true">
        {label}
      </div>
      {/*
       * <table> is biome's preferred semantic for role="grid" (it suggested it).
       * The keyboard widget pattern (Escape, arrow keys) is handled on the table.
       */}
      <table
        ref={tableRef}
        aria-label={label}
        className="note-color-picker__grid"
        onKeyDown={handleKeyDown}
      >
        <tbody>
          {rows.map((row, rowIdx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable fixed-size palette rows
            <tr key={rowIdx}>
              {row.map(({ key, color, ariaLabel }) => {
                const isNone = color === null;
                const isWhite = color === "#ffffff";
                return (
                  <td key={key}>
                    <button
                      type="button"
                      data-cell
                      aria-label={ariaLabel}
                      className={[
                        "note-color-picker__cell",
                        isNone ? "note-color-picker__cell--none" : "",
                        isWhite ? "note-color-picker__cell--white" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={color ? { backgroundColor: color } : undefined}
                      onClick={() => onPick(color ?? "")}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
