import type { RecordHistoryEvent, RecordHistoryPage } from "@crm/core/records";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUpdateRecord } from "@/lib/api/client/hooks";
import { createHttpRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { decodeTimelineQuery, encodeTimelineEvent } from "@/lib/api/wire/timelines";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { RecordTimelineHistory } from "./record-timeline-history";

const event = (id: string, extra: Partial<RecordHistoryEvent> = {}): RecordHistoryEvent => ({
  id,
  schemaVersion: 1,
  stream: { module: "Accounts", recordId: "record" },
  subject: { module: "Accounts", recordId: "record" },
  kind: "fields_updated",
  actor: { id: "actor", name: "Sample User" },
  occurredAt: "2026-10-17T10:00:00Z",
  sequence: 1,
  ordinal: 0,
  operationId: id,
  source: "manual",
  mechanism: null,
  payload: null,
  changes: [
    {
      apiName: "Account_Site",
      label: "Account Site",
      dataType: "text",
      old: null,
      new: "Site",
      oldDisplay: null,
      newDisplay: "Site",
    },
  ],
  ...extra,
});
const page = (events: RecordHistoryEvent[], token: string | null = null): RecordHistoryPage => ({
  events,
  nextPageToken: token,
  moreRecords: token !== null,
});
const props = {
  heading: "Timeline History",
  filterButtonLabel: "History filter",
  format: DEFAULT_FORMAT,
  events: [],
  modulesLabel: "Modules",
  modulesAllLabel: "All Modules",
  moduleOptions: [
    { id: "meetings", label: "Meetings" },
    { id: "notes", label: "Notes" },
  ],
  usersLabel: "Users",
  usersAllLabel: "All Users",
  userOptions: [{ id: "actor", label: "Sample User" }],
  timeLabel: "Time",
  sourcesLabel: "Sources",
  sourcesAllLabel: "All Sources",
  sourceOptions: [
    { id: "manual", label: "Manual" },
    { id: "workflow", label: "Workflow Rules" },
  ],
  applyLabel: "Apply Filter",
  onApply: () => {},
};
function setup(module = "Accounts") {
  const service = createHttpRecordService({ orgSlug: "sample" });
  const list = vi.spyOn(service, "listHistory").mockResolvedValue(page([]));
  const renderHistory = () =>
    render(
      <ApiProvider orgSlug="sample" service={service}>
        <RecordTimelineHistory {...props} module={module} recordId="record" />
      </ApiProvider>,
    );
  return { service, list, renderHistory };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("record Timeline History", () => {
  it.each(["Leads", "Contacts", "Accounts", "Deals", "Tasks", "Events", "Calls", "Campaigns"])(
    "loads the empty stream for %s",
    async (module) => {
      const { list, renderHistory } = setup(module);
      renderHistory();
      expect(screen.getByRole("status").textContent).toContain("Loading");
      await screen.findByText("No logs found");
      expect(list).toHaveBeenCalledWith(module, "record", { perPage: 25, pageToken: null });
    },
  );

  it("appends cursor pages once and preserves equal-time server order", async () => {
    const { list, renderHistory } = setup();
    list
      .mockResolvedValueOnce(
        page([event("new", { kind: "record_created", changes: [] })], "cursor"),
      )
      .mockResolvedValueOnce(
        page([event("new", { kind: "record_created", changes: [] }), event("old")]),
      );
    renderHistory();
    await screen.findByText("Account created");
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    await screen.findByText("Account Site changed from — to Site");
    expect(list).toHaveBeenLastCalledWith("Accounts", "record", {
      perPage: 25,
      pageToken: "cursor",
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")[0]?.textContent).toContain("Account created");
    expect(screen.queryByRole("button", { name: "Show More" })).toBeNull();
  });

  it("renders a multi-field save as one card with one actor attribution", async () => {
    const { list, renderHistory } = setup();
    const first = event("multi");
    list.mockResolvedValue(
      page([
        {
          ...first,
          changes: [
            ...first.changes,
            {
              apiName: "Description",
              label: "Description",
              dataType: "text",
              old: "Before",
              new: "After",
              oldDisplay: "Before",
              newDisplay: "After",
            },
          ],
        },
      ]),
    );
    renderHistory();
    await screen.findByText("Account Site changed from — to Site");
    expect(screen.getByText("Description changed from Before to After")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(document.querySelectorAll(".timeline-event-byline")).toHaveLength(1);
  });

  it("shows an error and retries without claiming an empty stream", async () => {
    // 404 does not trigger automatic transport retries.
    const { NotFoundError } = await import("@crm/core/errors");
    const { list, renderHistory } = setup();
    list.mockRejectedValueOnce(new NotFoundError());
    renderHistory();
    await screen.findByRole("alert");
    expect(screen.queryByText("No logs found")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("No logs found");
  });

  it("applies the v9 codec, resets paging, and allows clearing filters", async () => {
    const user = userEvent.setup();
    const { list, renderHistory } = setup();
    renderHistory();
    await screen.findByText("No logs found");
    await user.click(screen.getByRole("button", { name: "History filter" }));
    await user.click(screen.getByRole("button", { name: /Modules/ }));
    await user.click(screen.getByRole("checkbox", { name: "Meetings" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith("Accounts", "record", {
        perPage: 25,
        pageToken: null,
        modules: ["Events"],
      }),
    );
    await user.click(screen.getByRole("button", { name: "History filter" }));
    await user.click(screen.getByRole("button", { name: "History filter" }));
    expect(screen.getByRole("button", { name: "Modules Meetings" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Modules/ }));
    await user.click(screen.getByRole("checkbox", { name: "Meetings" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith("Accounts", "record", {
        perPage: 25,
        pageToken: null,
      }),
    );
  });

  it("does not treat automation-only sources as all sources", async () => {
    const { list, renderHistory } = setup();
    const user = userEvent.setup();
    list.mockResolvedValue(page([event("field")]));
    renderHistory();
    await screen.findByText("Account Site changed from — to Site");
    await user.click(screen.getByRole("button", { name: "History filter" }));
    await user.click(screen.getByRole("button", { name: /Sources/ }));
    await user.click(screen.getByRole("checkbox", { name: "Workflow Rules" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await screen.findByText("No logs found");
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("refetches the active history after saving a record", async () => {
    const { service, list } = setup();
    vi.spyOn(service, "update").mockResolvedValue({ id: "record", fields: {} });
    function Save() {
      const update = useUpdateRecord("Accounts");
      return (
        <button type="button" onClick={() => update.mutate({ id: "record", input: {} })}>
          Save
        </button>
      );
    }
    render(
      <ApiProvider orgSlug="sample" service={service}>
        <Save />
        <RecordTimelineHistory {...props} module="Accounts" recordId="record" />
      </ApiProvider>,
    );
    await screen.findByText("No logs found");
    list.mockResolvedValue(page([event("saved")]));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Account Site changed from — to Site");
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("uses the HTTP client to decode a 204 and encode wire filters", async () => {
    const fetch = vi.fn().mockResolvedValue(null);
    const service = createHttpRecordService({ orgSlug: "sample", fetch });
    expect(
      await service.listHistory("Events", "record", {
        perPage: 25,
        modules: ["Events"],
        sources: ["manual"],
      }),
    ).toEqual(page([]));
    const url = new URL(String(fetch.mock.calls[0]?.[0]), "http://app.test");
    expect(url.pathname).toBe("/crm/v9/Events/record/timelines");
    expect(decodeTimelineQuery(url.searchParams)).toMatchObject({
      modules: ["Events"],
      sources: ["manual"],
    });
    expect(encodeTimelineEvent(event("wire")).field_history).toHaveLength(1);
  });
});
