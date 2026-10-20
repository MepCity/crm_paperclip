import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { ModuleListClient } from "./module-list-client";
import type { ModuleScreenDefinition } from "./types";

const hooks = vi.hoisted(() => ({ useModule: vi.fn(), useUsers: vi.fn() }));
vi.mock("@/lib/api/client/hooks", () => hooks);
vi.mock("@/components/records/list/module-list-screen", () => ({
  ModuleListScreen: ({ config }: { config: { title: string; module?: string } }) => (
    <h1>{`${config.title} list (${config.module})`}</h1>
  ),
}));

const definition = {
  apiName: "Contacts",
  tab: "contacts",
  list: { title: "Contacts", linkField: "Full_Name" },
  buildFilterGroups: () => [],
} as unknown as ModuleScreenDefinition;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ModuleListClient", () => {
  it("renders an empty placeholder while metadata loads", () => {
    hooks.useModule.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    hooks.useUsers.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    const { container } = render(<ModuleListClient orgSlug="org" definition={definition} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(container.querySelector(".module-list-page")).toBeTruthy();
  });

  it("renders the list screen once metadata and users are loaded", () => {
    hooks.useModule.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { fields: [{ apiName: "Full_Name" }] },
    });
    hooks.useUsers.mockReturnValue({ isLoading: false, isError: false, data: [] });
    render(<ModuleListClient orgSlug="org" definition={definition} />);
    expect(screen.getByRole("heading", { name: "Contacts list (Contacts)" })).toBeTruthy();
  });
});
