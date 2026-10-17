import type { ModuleApiName, RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import type { ParentActivityCategory } from "./activity-categories-card-body";
import { ParentActivitiesCardBody } from "./parent-activities-card-body";

// ---------------------------------------------------------------------------
// Hook mock
// ---------------------------------------------------------------------------

const hookResult = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  open: [] as ParentActivityCategory[],
  closed: [] as ParentActivityCategory[],
  openCount: 0,
  closedCount: 0,
}));

vi.mock("@/lib/records/use-parent-activities", () => ({
  useParentActivities: vi.fn(() => hookResult),
}));

import { useParentActivities } from "@/lib/records/use-parent-activities";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const openCategories: readonly ParentActivityCategory[] = [
  {
    kind: "task",
    count: 2,
    rows: [
      {
        id: "task-open-1",
        subject: "Open Task A",
        href: "/crm/demo/Tasks/task-open-1",
        dateText: "15.10.2026",
        ownerName: "Alex Example",
        details: [],
      },
    ],
  },
];

const closedCategories: readonly ParentActivityCategory[] = [
  {
    kind: "call",
    count: 1,
    rows: [
      {
        id: "call-closed-1",
        subject: "Closed Call B",
        href: "/crm/demo/Calls/call-closed-1",
        dateText: null,
        ownerName: null,
        details: [],
      },
    ],
  },
];

const parentRecord: RecordData = { id: "lead-42", fields: { Last_Name: "Sample" } };
const parentModule: ModuleApiName = "Leads";
const recordPath = (module: ModuleApiName, id: string) => `/crm/demo/${module}/${id}`;

function resetHook() {
  hookResult.isLoading = false;
  hookResult.isError = false;
  hookResult.open = [];
  hookResult.closed = [];
  hookResult.openCount = 0;
  hookResult.closedCount = 0;
}

afterEach(() => {
  cleanup();
  resetHook();
  vi.mocked(useParentActivities).mockClear();
});

function renderBody(variant: "open" | "closed" = "open") {
  return render(
    <ParentActivitiesCardBody
      parentModule={parentModule}
      parentRecord={parentRecord}
      variant={variant}
      recordPath={recordPath}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ParentActivitiesCardBody", () => {
  it("loading: shows Loading... text and no category content", () => {
    hookResult.isLoading = true;
    renderBody();
    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("error (not loading): shows related-list error view and no categories", () => {
    hookResult.isError = true;
    renderBody();
    expect(screen.getByText("Unable to load records.")).toBeTruthy();
    expect(document.querySelector('[data-part="error"]')).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("variant='open': renders open categories and none of the closed ones", () => {
    hookResult.open = openCategories as ParentActivityCategory[];
    hookResult.closed = closedCategories as ParentActivityCategory[];
    renderBody("open");
    expect(screen.getByRole("link", { name: "Open Task A" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Closed Call B" })).toBeNull();
  });

  it("variant='closed': renders closed categories and none of the open ones", () => {
    hookResult.open = openCategories as ParentActivityCategory[];
    hookResult.closed = closedCategories as ParentActivityCategory[];
    renderBody("closed");
    expect(screen.getByRole("link", { name: "Closed Call B" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open Task A" })).toBeNull();
  });

  it("calls useParentActivities with parentModule, parentRecord.id, and recordPath", () => {
    renderBody();
    expect(vi.mocked(useParentActivities)).toHaveBeenCalledWith(
      parentModule,
      parentRecord.id,
      recordPath,
    );
  });

  it("empty open list: shows 'No records found' empty state for each category", () => {
    hookResult.open = [];
    renderBody("open");
    // ActivityCategoriesCardBody renders all three sections (Tasks, Meetings, Calls)
    // each showing "No records found" when the category is absent/empty
    expect(screen.getAllByText("No records found").length).toBeGreaterThanOrEqual(3);
  });

  it("empty closed list: shows 'No records found' empty state for each category", () => {
    hookResult.closed = [];
    renderBody("closed");
    expect(screen.getAllByText("No records found").length).toBeGreaterThanOrEqual(3);
  });
});
