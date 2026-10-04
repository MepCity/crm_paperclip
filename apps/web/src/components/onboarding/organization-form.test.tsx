import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { OrganizationForm } from "./organization-form";

const actions = vi.hoisted(() => ({
  createOrganizationAction: vi.fn(),
}));

vi.mock("@/app/orgs/new/actions", () => actions);

afterEach(cleanup);

beforeEach(() => {
  actions.createOrganizationAction.mockReset();
});

test("suggests a slug from the name until the slug is edited", async () => {
  const user = userEvent.setup();
  render(<OrganizationForm />);

  await user.type(screen.getByRole("textbox", { name: "Name" }), "Çağrı");
  const slug = screen.getByRole("textbox", { name: "Slug" });
  expect((slug as HTMLInputElement).value).toBe("cagri");

  await user.clear(slug);
  await user.type(slug, "custom");
  await user.type(screen.getByRole("textbox", { name: "Name" }), " Şirketi");

  expect((slug as HTMLInputElement).value).toBe("custom");
});

test("shows a server field error on the slug field", async () => {
  const user = userEvent.setup();
  const error: ActionState = {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: { slug: ["This slug is already in use."] },
  };
  actions.createOrganizationAction.mockResolvedValue(error);
  render(<OrganizationForm />);

  await user.type(screen.getByRole("textbox", { name: "Name" }), "Acme");
  await user.click(screen.getByRole("button", { name: "Create organization" }));

  const slug = screen.getByRole("textbox", { name: "Slug" });
  await waitFor(() => expect(slug.getAttribute("aria-invalid")).toBe("true"));
  const describedBy = slug.getAttribute("aria-describedby");
  expect(document.getElementById(describedBy?.split(" ").at(-1) ?? "")?.textContent).toBe(
    "This slug is already in use.",
  );
});
