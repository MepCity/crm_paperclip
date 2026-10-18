import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { accountsListPageConfig } from "@/modules/accounts/list-config";
import { contactsListPageConfig } from "@/modules/contacts/list-config";
import { leadsListPageConfig } from "@/modules/leads/list-config";
import { ListToolbar } from "./list-toolbar";

afterEach(cleanup);

for (const config of [leadsListPageConfig, contactsListPageConfig, accountsListPageConfig]) {
  test(`${config.module} print entries expose M6 placeholders without invoking actions`, async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const items = config.inventory?.actions ?? config.toolbarActions ?? [];
    render(
      <ListToolbar
        filterOpen={false}
        onFilterChange={() => {}}
        fields={[]}
        sort={null}
        onSortApply={() => {}}
        create={{ label: "Create" }}
        actions={items.map((item) => ({ ...item, onAction: action }))}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.hover(screen.getByRole("menuitem", { name: "Print View" }));
    for (const label of ["Print Default view", "Print Using Canvas"]) {
      const row = await screen.findByRole("menuitem", { name: label });
      expect(row.getAttribute("data-later-module")).toBe("M6");
      await user.click(row);
      expect(screen.getByRole("menuitem", { name: "Print View" })).toBeTruthy();
    }
    expect(action).not.toHaveBeenCalled();
  });
}
