import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { FormErrorBanner } from "./form-error-banner";

afterEach(() => {
  cleanup();
});

test("renders message with alert role", () => {
  render(<FormErrorBanner>Save failed.</FormErrorBanner>);
  const alert = screen.getByRole("alert");
  expect(alert.hasAttribute("data-record-form-error-banner")).toBe(true);
  expect(alert.textContent).toBe("Save failed.");
});

test("parent can clear the banner on retry", async () => {
  const onRetry = vi.fn();
  function Harness() {
    const [message, setMessage] = useState<string | null>("Network error.");
    return (
      <div>
        {message ? <FormErrorBanner>{message}</FormErrorBanner> : null}
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            onRetry();
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  render(<Harness />);
  expect(screen.getByRole("alert")).toBeTruthy();
  await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(onRetry).toHaveBeenCalledTimes(1);
});
