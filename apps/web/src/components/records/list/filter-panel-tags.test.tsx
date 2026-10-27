import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { encodeCriteria } from "@/lib/api/wire/codec";
import { panelFiltersToCriteria } from "@/lib/records/filter-criteria";
import type { AppliedFilter } from "@/lib/records/filter-operators";
import { createFixtureTagCatalog, TagCatalogProvider, type TagModule } from "@/lib/records/tags";
import { buildAccountsFilterGroups } from "@/modules/accounts/list-filters";
import { buildContactsFilterGroups } from "@/modules/contacts/list-filters";
import { buildDealsFilterGroups } from "@/modules/deals/list-filters";
import { buildLeadsFilterGroups } from "@/modules/leads/list-filters";
import { render } from "@/test/render";
import { type FilterGroup, FilterPanel } from "./filter-panel";

afterEach(cleanup);
vi.setConfig({ testTimeout: 30_000 });
const builders = {
  Leads: buildLeadsFilterGroups,
  Contacts: buildContactsFilterGroups,
  Accounts: buildAccountsFilterGroups,
  Deals: buildDealsFilterGroups,
};
const base = {
  title: "Filters",
  searchLabel: "Fields",
  searchPlaceholder: "Search",
  selectedIds: ["Tag"],
  onSelectionChange: () => {},
};
for (const module of Object.keys(builders) as TagModule[]) {
  test(`${module} searches tag names and applies IDs for both comparisons and empty operators`, async () => {
    const service = createFixtureRecordService({
      orgId: "org-test",
      orgSlug: "org-test",
      orgName: "Org",
      userId: "user-1",
      role: "admin",
    });
    const definition = await service.getModule(module);
    const groups = builders[module]({
      fields: definition.fields,
      users: [],
      linkField: "Full_Name",
      currencyCode: "TRY",
    });
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel {...base} groups={groups} onApply={onApply} />);
    const apply = screen.getByRole("button", { name: "Apply Filter" });
    expect((apply as HTMLButtonElement).disabled).toBe(true);
    for (const [label, comparator] of [
      ["is", "equal"],
      ["is not", "not_equal"],
    ] as const) {
      if (label !== "is") {
        await user.click(screen.getByRole("button", { name: /Tag operator$/ }));
        await user.click(screen.getByRole("option", { name: label }));
        expect((apply as HTMLButtonElement).disabled).toBe(false);
      }
      await user.click(screen.getByRole("button", { name: "Tag value" }));
      await user.type(screen.getByRole("textbox", { name: "Search Tag value" }), "follow");
      await user.click(await screen.findByRole("option", { name: "Follow up" }));
      const search = screen.getByRole("textbox", { name: "Search Tag value" });
      await user.clear(search);
      await user.type(search, "review");
      await user.click(screen.getByRole("option", { name: "Review" }));
      await user.keyboard("{Escape}");
      await user.click(apply);
      const filters: AppliedFilter[] = onApply.mock.lastCall?.[0];
      const criteria = panelFiltersToCriteria(
        filters.map(({ itemId, ...filter }) => ({ ...filter, field: itemId })),
      );
      expect(criteria && encodeCriteria(criteria)).toEqual({
        field: { api_name: "Tag" },
        comparator,
        value: [`${module.toLowerCase()}-follow-up`, `${module.toLowerCase()}-review`],
      });
    }
    for (const [label, operatorId] of [
      ["is empty", "is_empty"],
      ["is not empty", "is_not_empty"],
    ]) {
      await user.click(screen.getByRole("button", { name: /Tag operator$/ }));
      await user.click(screen.getByRole("option", { name: label }));
      expect(screen.queryByRole("button", { name: "Tag value" })).toBeNull();
      await user.click(apply);
      expect(onApply).toHaveBeenLastCalledWith([{ itemId: "Tag", operatorId, value: null }]);
    }
  });
}
const groups: FilterGroup[] = [
  {
    id: "fields",
    label: "Fields",
    items: [{ id: "Tag", label: "Tag", editor: { fieldType: "tag", tagModule: "Leads" } }],
  },
];
for (const state of ["loading", "empty", "error"] as const) {
  test(`tag catalog ${state} explains the state and preserves a safe Apply action`, async () => {
    const client =
      state === "empty"
        ? createFixtureTagCatalog({})
        : {
            listTags: () =>
              state === "loading"
                ? new Promise<never>(() => {})
                : Promise.reject(new Error("Unavailable")),
          };
    const user = userEvent.setup();
    render(
      <TagCatalogProvider client={client}>
        <FilterPanel {...base} groups={groups} onApply={() => {}} />
      </TagCatalogProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Tag value" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        state === "loading"
          ? "Loading tags"
          : state === "empty"
            ? "No tags available"
            : "Could not load tags",
      ),
    );
    await user.keyboard("{Escape}");
    expect(
      (screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement).disabled,
    ).toBe(state !== "empty");
  });
}
