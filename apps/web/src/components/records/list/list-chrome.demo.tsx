"use client";

import type { SortSpec } from "@crm/core/records";
import { useState } from "react";
import { ListToolbar } from "./list-toolbar";
import { SortPopover } from "./sort-popover";
import { ViewTabStrip } from "./view-tab-strip";

const fields = [
  { apiName: "Full_Name", label: "Lead Name" },
  { apiName: "Company", label: "Company" },
];

export default function ListChromeDemo() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [sort, setSort] = useState<SortSpec | null>(null);
  const [message, setMessage] = useState("");
  const actions = [
    { id: "example", label: "Example action", onAction: () => setMessage("Action selected") },
  ];
  return (
    <div className="space-y-4">
      <div data-list-demo="with-menus">
        <ViewTabStrip viewName="All Leads" />
        <ListToolbar
          filterOpen={filterOpen}
          onFilterChange={setFilterOpen}
          onRefresh={() => setMessage("Refresh selected")}
          fields={fields}
          sort={sort}
          onSortApply={setSort}
          create={{
            label: "Create Lead",
            onPress: () => setMessage("Create selected"),
            items: actions,
          }}
          actions={actions}
        />
      </div>
      <div data-list-demo="without-menus">
        <ListToolbar
          filterOpen={false}
          onFilterChange={() => setMessage("Filter selected")}
          onRefresh={() => setMessage("Refresh selected")}
          fields={fields}
          sort={null}
          onSortApply={setSort}
          create={{ label: "Create Lead", onPress: () => setMessage("Create selected") }}
        />
      </div>
      <p className="text-sm text-text-muted">Open Sort to inspect the selectors and Apply state.</p>
      <div data-list-demo="sort">
        <SortPopover fields={fields} sort={null} onApply={setSort} />
      </div>
      <p role="status">{message || (sort ? `${sort.field}: ${sort.order}` : "")}</p>
    </div>
  );
}
