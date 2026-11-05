import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { ModuleListEmptyState } from "./module-list-empty-state";

afterEach(cleanup);

describe("ModuleListEmptyState", () => {
  it("draws heading, text and the Create and Import actions", () => {
    const onCreate = vi.fn();
    const onImport = vi.fn();
    render(
      <ModuleListEmptyState
        heading="Manage customer quotes"
        text="About quotes."
        onCreate={onCreate}
        onImport={onImport}
      />,
    );
    expect(screen.getByRole("heading", { name: "Manage customer quotes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledOnce();
  });
});
