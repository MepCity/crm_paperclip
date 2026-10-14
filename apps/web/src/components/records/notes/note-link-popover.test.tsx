import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NoteLinkPopover, normalizeNoteLinkHref } from "./note-link-popover";

describe("normalizeNoteLinkHref", () => {
  it.each([
    ["example.com", "https://example.com"],
    ["  example.com/a?b=1 ", "https://example.com/a?b=1"],
    ["http://example.com", "http://example.com"],
    ["HTTPS://Example.com", "https://Example.com"],
    ["mailto:a@b.co", "mailto:a@b.co"],
    ["MAILTO:a@b.co", "mailto:a@b.co"],
    ["localhost:3000/x", "https://localhost:3000/x"],
    ["javascript:alert(1)", null],
    ["JaVaScRiPt:alert(1)", null],
    [" java\tscript:alert(1)", null],
    ["java\nscript:alert(1)", null],
    ["\u0001javascript:alert(1)", null],
    ["data:text/html,x", null],
    ["vbscript:x", null],
    ["", null],
    ["   ", null],
  ])("%j -> %j", (input, expected) => {
    expect(normalizeNoteLinkHref(input)).toBe(expected);
  });
});

describe("NoteLinkPopover", () => {
  afterEach(cleanup);

  it("focuses URL and prefills text", () => {
    render(<NoteLinkPopover initialText="Hi" onInsert={vi.fn()} onClose={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByLabelText(/URL/));
    expect((screen.getByLabelText("Text") as HTMLInputElement).value).toBe("Hi");
  });

  it("inserts with Insert button, falling back to href for text", async () => {
    const onInsert = vi.fn();
    render(<NoteLinkPopover onInsert={onInsert} onClose={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/URL/), "example.com");
    await userEvent.click(screen.getByRole("button", { name: "Insert" }));
    expect(onInsert).toHaveBeenCalledWith("https://example.com", "https://example.com");
  });

  it("Enter inserts with text", async () => {
    const onInsert = vi.fn();
    render(<NoteLinkPopover initialText="Site" onInsert={onInsert} onClose={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/URL/), "example.com{Enter}");
    expect(onInsert).toHaveBeenCalledWith("https://example.com", "Site");
  });

  it("shows an error and does not insert for invalid URL", async () => {
    const onInsert = vi.fn();
    render(<NoteLinkPopover onInsert={onInsert} onClose={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/URL/), "javascript:alert(1)");
    await userEvent.click(screen.getByRole("button", { name: "Insert" }));
    expect(onInsert).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter a valid URL.")).toBeTruthy();
  });

  it("Cancel and Esc close", async () => {
    const onClose = vi.fn();
    render(<NoteLinkPopover onInsert={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.type(screen.getByLabelText(/URL/), "{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
