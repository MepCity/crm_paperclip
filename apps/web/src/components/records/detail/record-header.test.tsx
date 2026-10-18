import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { RecordHeader, type RecordHeaderProps } from "./record-header";

afterEach(cleanup);

const baseProps: RecordHeaderProps = {
  title: "Jane Doe",
  back: { label: "Back", href: "/leads" },
  moreLabel: "More actions",
  previousLabel: "Previous record",
  nextLabel: "Next record",
};

it("shows the title and subtitle as the heading name", () => {
  render(<RecordHeader {...baseProps} subtitle="Acme" />);
  expect(screen.getByRole("heading", { name: "Jane Doe - Acme" })).toBeTruthy();
  expect(screen.getByText("Acme")).toBeTruthy();
});

it("renders the back link and calls back.onPress when it is a button", () => {
  const { rerender } = render(<RecordHeader {...baseProps} />);
  expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/leads");
  const onPress = vi.fn();
  rerender(<RecordHeader {...baseProps} back={{ label: "Back", onPress }} />);
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it("calls command callbacks and honours disabled commands", () => {
  const onEdit = vi.fn();
  const onSend = vi.fn();
  render(
    <RecordHeader
      {...baseProps}
      commands={[
        { id: "edit", label: "Edit", variant: "primary", onPress: onEdit },
        { id: "send", label: "Send Email", isDisabled: true, onPress: onSend },
        { id: "open", label: "Open", href: "/open" },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(onEdit).toHaveBeenCalledTimes(1);
  const send = screen.getByRole("button", { name: "Send Email" }) as HTMLButtonElement;
  expect(send.disabled).toBe(true);
  fireEvent.click(send);
  expect(onSend).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Open" }).getAttribute("href")).toBe("/open");
});

it("renders a split command with its dropdown segment", () => {
  render(
    <RecordHeader
      {...baseProps}
      commands={[{ id: "call", label: "Call", splitLabel: "Call options", onPress: vi.fn() }]}
    />,
  );
  expect(screen.getByRole("button", { name: "Call" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Call options" })).toBeTruthy();
});

it("opens the more menu and lists items from every group", () => {
  const onClone = vi.fn();
  render(
    <RecordHeader
      {...baseProps}
      menuGroups={[
        { id: "g1", items: [{ id: "clone", label: "Clone", onAction: onClone }] },
        { id: "g2", items: [{ id: "delete", label: "Delete", isDisabled: true }] },
        { id: "empty", items: [] },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  const clone = screen.getByRole("menuitem", { name: "Clone" });
  const del = screen.getByRole("menuitem", { name: "Delete" });
  expect(del.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(clone);
  expect(onClone).toHaveBeenCalledTimes(1);
});

it("omits the more menu when there are no non-empty groups", () => {
  render(<RecordHeader {...baseProps} menuGroups={[{ id: "empty", items: [] }]} />);
  expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
});

it("renders previous/next links when hrefs exist and disabled buttons otherwise", () => {
  const { rerender } = render(
    <RecordHeader {...baseProps} previousHref="/prev" nextHref="/next" />,
  );
  expect(screen.getByRole("link", { name: "Previous record" }).getAttribute("href")).toBe("/prev");
  expect(screen.getByRole("link", { name: "Next record" }).getAttribute("href")).toBe("/next");
  rerender(<RecordHeader {...baseProps} />);
  expect((screen.getByRole("button", { name: "Next record" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  rerender(<RecordHeader {...baseProps} showRecordNavigation={false} />);
  expect(screen.queryByRole("button", { name: "Next record" })).toBeNull();
});
