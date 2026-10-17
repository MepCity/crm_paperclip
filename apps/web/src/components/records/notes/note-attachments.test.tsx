import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addPendingFiles,
  NOTE_ATTACH_BUDGET_MESSAGE,
  NOTE_ATTACH_MAX_BYTES,
} from "./note-attachments";
import { NoteComposer } from "./note-composer";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@/components/ui/toast", () => ({ toast }));

afterEach(cleanup);

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe("addPendingFiles", () => {
  it("appends within the budget", () => {
    const result = addPendingFiles([file("a")], [file("b")]);
    expect(result.overBudget).toBe(false);
    expect(result.files).toHaveLength(2);
  });

  it("rejects a sixth file and keeps the list", () => {
    const current = ["1", "2", "3", "4", "5"].map((n) => file(n));
    const result = addPendingFiles(current, [file("6")]);
    expect(result.overBudget).toBe(true);
    expect(result.files).toHaveLength(5);
  });

  it("counts existing attachments in the file budget", () => {
    expect(addPendingFiles([], [file("a"), file("b")], 4).overBudget).toBe(true);
    expect(addPendingFiles([], [file("a")], 4).overBudget).toBe(false);
  });

  it("counts existing attachment bytes in the size budget", () => {
    const six = file("six", 6_000_000);
    expect(addPendingFiles([], [six], 1, 15_000_000).overBudget).toBe(true);
    expect(addPendingFiles([], [six], 1, 10_000_000).overBudget).toBe(false);
  });

  it("rejects a total above 20 MB", () => {
    const result = addPendingFiles([], [file("big", NOTE_ATTACH_MAX_BYTES + 1)]);
    expect(result.overBudget).toBe(true);
  });
});

function setup(onSave = vi.fn(), onCancel = vi.fn()) {
  render(
    <NoteComposer mode="create" expanded onExpand={() => {}} onCancel={onCancel} onSave={onSave} />,
  );
  return { onSave, onCancel, input: screen.getByTestId("note-file-input") as HTMLInputElement };
}

describe("NoteComposer attachments", () => {
  it("adds and removes chips", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { files: [file("a.pdf")] } });
    expect(screen.getByText("a.pdf")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remove a.pdf"));
    expect(screen.queryByText("a.pdf")).toBeNull();
  });

  it("toasts when over budget", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { files: [file("big", NOTE_ATTACH_MAX_BYTES + 1)] } });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: NOTE_ATTACH_BUDGET_MESSAGE }),
    );
  });

  it("passes pending files to onSave", async () => {
    const { input, onSave } = setup();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "T" } });
    fireEvent.change(input, { target: { files: [file("a.pdf")] } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ files: [expect.objectContaining({ name: "a.pdf" })] }),
    );
  });

  it("drops pending files on Cancel", () => {
    const { input, onCancel } = setup();
    fireEvent.change(input, { target: { files: [file("a.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(screen.queryByText("a.pdf")).toBeNull();
  });
});
