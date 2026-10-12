import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { TopAlignedModal } from "./top-aligned-modal";

afterEach(cleanup);

test("top aligned modal traps focus and respects dismissable flag", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(
    <TopAlignedModal isOpen isDismissable={false} onOpenChange={onOpenChange} aria-labelledby="t">
      <h2 id="t">Title</h2>
      <button type="button">Inside</button>
    </TopAlignedModal>,
  );
  expect(screen.getByRole("dialog")).toBeTruthy();
  const overlay = document.querySelector(".top-aligned-modal-overlay");
  expect(overlay).toBeTruthy();
  if (overlay) {
    await user.click(overlay);
  }
  expect(onOpenChange).not.toHaveBeenCalled();
});
