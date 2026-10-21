import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { mutateTagCatalogueAction, readTagCatalogueAction } from "@/app/crm/[orgSlug]/tags/actions";
import { render } from "@/test/render";
import { ManageTagsClient } from "./manage-tags-client";

vi.mock("@/app/crm/[orgSlug]/tags/actions", () => ({
  readTagCatalogueAction: vi.fn(),
  mutateTagCatalogueAction: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
test("loads and updates catalogue counter from service responses", async () => {
  vi.mocked(readTagCatalogueAction).mockResolvedValue({
    status: "success",
    tags: [],
    capacity: 100,
    canManage: true,
  });
  vi.mocked(mutateTagCatalogueAction).mockResolvedValue({
    status: "success",
    tags: [
      {
        id: "tag",
        module: "Contacts",
        name: "Example",
        color: null,
        createdBy: "actor",
        modifiedBy: "actor",
        createdAt: "2026-10-17T10:00:00Z",
        modifiedAt: "2026-10-17T10:00:00Z",
      },
    ],
    capacity: 100,
    canManage: true,
  });
  render(
    <ManageTagsClient
      orgSlug="synthetic"
      module="Contacts"
      moduleName="Contacts"
      onBack={vi.fn()}
    />,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "New Tag" }));
  await user.type(screen.getByRole("textbox", { name: "Tag Name" }), "Example");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Tags used : 1 / 100")).toBeTruthy();
  expect(mutateTagCatalogueAction).toHaveBeenCalledWith("synthetic", "Contacts", {
    kind: "create",
    name: "Example",
  });
});
test("renders service failure without a misleading empty success", async () => {
  vi.mocked(readTagCatalogueAction).mockResolvedValue({ status: "error", message: "Unavailable" });
  render(
    <ManageTagsClient orgSlug="synthetic" module="Leads" moduleName="Leads" onBack={vi.fn()} />,
  );
  expect((await screen.findByRole("alert")).textContent).toBe("Unavailable");
  expect(screen.queryByRole("button", { name: "New Tag" })).toBeNull();
});

test("keeps creation open and displays service validation errors", async () => {
  vi.mocked(readTagCatalogueAction).mockResolvedValue({
    status: "success",
    tags: [],
    capacity: 100,
    canManage: true,
  });
  vi.mocked(mutateTagCatalogueAction).mockResolvedValue({
    status: "error",
    message: "Invalid",
    fieldErrors: { name: ["A tag with this name already exists."] },
  });
  render(
    <ManageTagsClient orgSlug="synthetic" module="Leads" moduleName="Leads" onBack={vi.fn()} />,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "New Tag" }));
  await user.type(screen.getByRole("textbox", { name: "Tag Name" }), "Existing");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "A tag with this name already exists.",
  );
  expect(screen.getByRole("textbox", { name: "Tag Name" })).toBeTruthy();
});

test("uses the service management capability to hide creation", async () => {
  vi.mocked(readTagCatalogueAction).mockResolvedValue({
    status: "success",
    tags: [],
    capacity: 100,
    canManage: false,
  });
  render(
    <ManageTagsClient orgSlug="synthetic" module="Leads" moduleName="Leads" onBack={vi.fn()} />,
  );
  await screen.findByText(/There are currently no available Tags/);
  expect(screen.queryByRole("button", { name: "New Tag" })).toBeNull();
});

test.each(["Cases", "Solutions"])(
  "shows an empty %s catalogue and a load failure",
  async (module) => {
    vi.mocked(readTagCatalogueAction).mockResolvedValueOnce({
      status: "success",
      tags: [],
      capacity: 100,
      canManage: true,
    });
    render(
      <ManageTagsClient orgSlug="synthetic" module={module} moduleName={module} onBack={vi.fn()} />,
    );
    expect(await screen.findByText("Tags used : 0 / 100")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New Tag" })).toBeTruthy();
    cleanup();
    vi.mocked(readTagCatalogueAction).mockResolvedValueOnce({
      status: "error",
      message: "Unavailable",
    });
    render(
      <ManageTagsClient orgSlug="synthetic" module={module} moduleName={module} onBack={vi.fn()} />,
    );
    expect((await screen.findByRole("alert")).textContent).toBe("Unavailable");
  },
);
