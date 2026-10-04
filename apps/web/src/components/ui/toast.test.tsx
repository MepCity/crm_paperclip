import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Button } from "./button";
import { clearToasts, TOAST_TIMEOUT_MS, ToastProvider, toast } from "./toast";

function renderToaster() {
  render(
    <ToastProvider>
      <Button
        onPress={() =>
          toast({ variant: "info", title: "Export started", message: "We will notify you." })
        }
      >
        Notify
      </Button>
    </ToastProvider>,
  );
  return screen.getByRole("button", { name: "Notify" });
}

afterEach(() => {
  cleanup();
  clearToasts();
  vi.useRealTimers();
});

test("Toast shows the notification as an alert without taking focus", async () => {
  const user = userEvent.setup();
  const trigger = renderToaster();

  await user.click(trigger);

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("Export started");
  expect(alert.textContent).toContain("We will notify you.");
  expect(document.activeElement).toBe(trigger);
});

test("Toast closes from its close button", async () => {
  const user = userEvent.setup();
  renderToaster();

  await user.click(screen.getByRole("button", { name: "Notify" }));
  await user.click(screen.getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("alert")).toBeNull();
});

test("Toast disappears when its timeout elapses", async () => {
  vi.useFakeTimers();
  render(
    <ToastProvider>
      <div />
    </ToastProvider>,
  );

  act(() => {
    toast({ variant: "info", title: "Export started" });
  });
  expect(screen.getByRole("alert").textContent).toContain("Export started");

  await act(async () => {
    await vi.advanceTimersByTimeAsync(TOAST_TIMEOUT_MS);
  });

  expect(screen.queryByRole("alert")).toBeNull();
});

test("Toast stacks notifications in the order they were added", async () => {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <Button onPress={() => toast({ variant: "info", title: "First" })}>First</Button>
      <Button onPress={() => toast({ variant: "success", title: "Second" })}>Second</Button>
      <Button onPress={() => toast({ variant: "danger", title: "Third" })}>Third</Button>
    </ToastProvider>,
  );

  await user.click(screen.getByRole("button", { name: "First" }));
  await user.click(screen.getByRole("button", { name: "Second" }));
  await user.click(screen.getByRole("button", { name: "Third" }));

  expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
    "Third",
    "Second",
    "First",
  ]);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Third" }));
});

test("Toast fades in only when the user allows motion", () => {
  render(
    <ToastProvider>
      <div />
    </ToastProvider>,
  );

  act(() => {
    toast({ variant: "success", title: "Saved" });
  });

  expect(screen.getByRole("alertdialog", { name: "Saved" }).className).toContain(
    "motion-safe:animate-toast-in",
  );
});
