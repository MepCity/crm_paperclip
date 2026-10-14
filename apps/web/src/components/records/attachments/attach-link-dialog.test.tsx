import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { AttachLinkDialog, type AttachLinkDialogProps } from "./attach-link-dialog";

afterEach(cleanup);

function setup(props: Partial<AttachLinkDialogProps> = {}) {
  const onClose = vi.fn();
  const onAttach = vi.fn();
  const view = render(<AttachLinkDialog open onClose={onClose} onAttach={onAttach} {...props} />);
  return { onClose, onAttach, view };
}

test("shows title, required URL field focused on open and no close icon", async () => {
  setup();
  expect(screen.getByRole("heading", { name: "Attach From Link" })).toBeTruthy();
  const input = screen.getByRole("textbox", { name: /Enter URL/ });
  await waitFor(() => expect(document.activeElement).toBe(input));
  expect((input as HTMLInputElement).required).toBe(true);
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Cancel", "Attach"]);
});

test("Attach is disabled while the field is empty or blank", async () => {
  const user = userEvent.setup();
  setup();
  const attach = screen.getByRole("button", { name: "Attach" }) as HTMLButtonElement;
  expect(attach.disabled).toBe(true);
  await user.type(screen.getByRole("textbox"), "   ");
  expect(attach.disabled).toBe(true);
});

test.each(["javascript:alert(1)", "ftp://example.com/a", "example.com/file", "http://"])(
  "rejects %s with an inline error and no submit",
  async (value) => {
    const user = userEvent.setup();
    const { onAttach } = setup();
    await user.type(screen.getByRole("textbox"), value);
    await user.click(screen.getByRole("button", { name: "Attach" }));
    expect(await screen.findByText("Please enter a valid URL.")).toBeTruthy();
    expect(onAttach).not.toHaveBeenCalled();
  },
);

test("attaches the trimmed URL", async () => {
  const user = userEvent.setup();
  const { onAttach } = setup();
  await user.type(screen.getByRole("textbox"), "  https://example.com/file.pdf  ");
  await user.click(screen.getByRole("button", { name: "Attach" }));
  expect(onAttach).toHaveBeenCalledWith("https://example.com/file.pdf");
});

test("Enter submits", async () => {
  const user = userEvent.setup();
  const { onAttach } = setup();
  await user.type(screen.getByRole("textbox"), "http://example.com{Enter}");
  expect(onAttach).toHaveBeenCalledWith("http://example.com");
});

test("Cancel closes and clears the field on reopen", async () => {
  const user = userEvent.setup();
  const { onClose, view, onAttach } = setup();
  await user.type(screen.getByRole("textbox"), "https://a.com");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  view.rerender(<AttachLinkDialog open={false} onClose={onClose} onAttach={onAttach} />);
  view.rerender(<AttachLinkDialog open onClose={onClose} onAttach={onAttach} />);
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
});

test("Escape closes and clears the field on reopen", async () => {
  const user = userEvent.setup();
  const { onClose, view, onAttach } = setup();
  await user.type(screen.getByRole("textbox"), "https://a.com");
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
  view.rerender(<AttachLinkDialog open={false} onClose={onClose} onAttach={onAttach} />);
  view.rerender(<AttachLinkDialog open onClose={onClose} onAttach={onAttach} />);
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
});

test("submitting disables Attach and error is shown under the field", async () => {
  const user = userEvent.setup();
  setup({ submitting: true, error: "Could not attach." });
  await user.type(screen.getByRole("textbox"), "https://a.com");
  expect((screen.getByRole("button", { name: "Attach" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Could not attach.")).toBeTruthy();
});
