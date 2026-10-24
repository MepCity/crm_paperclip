import type {
  Criteria,
  FieldDefinition,
  ListResult,
  ModuleApiName,
  RecordService,
} from "@crm/core/records";

export const PAGE_SIZE = 10;
export const queueDefinitions = [
  {
    id: "tasks",
    section: "My Open Activity",
    label: "Tasks",
    module: "Tasks",
    view: "my-today-overdue-tasks",
    linkField: "Subject",
    columns: ["Subject", "Due_Date", "Status", "Priority", "What_Id", "Who_Id"],
  },
  {
    id: "meetings",
    section: "My Open Activity",
    label: "Meetings",
    module: "Events",
    view: "all-meetings",
    linkField: "Event_Title",
  },
  {
    id: "calls",
    section: "My Open Activity",
    label: "Calls",
    module: "Calls",
    view: "my-calls",
    linkField: "Subject",
  },
  {
    id: "leads",
    section: "Leads",
    label: "My Leads",
    module: "Leads",
    view: "my-leads",
    linkField: "Full_Name",
  },
  {
    id: "recent-leads",
    section: "Leads",
    label: "Leads assigned in the last 3 hours",
    module: "Leads",
    view: "my-leads",
    linkField: "Full_Name",
  },
  {
    id: "contacts",
    section: "Contacts",
    label: "My Contacts",
    module: "Contacts",
    view: "my-contacts",
    linkField: "Full_Name",
  },
  {
    id: "recent-contacts",
    section: "Contacts",
    label: "Contacts assigned in the last 3 hours",
    module: "Contacts",
    view: "my-contacts",
    linkField: "Full_Name",
  },
  {
    id: "deals",
    section: "Deals",
    label: "My Deals",
    module: "Deals",
    view: "my-deals",
    linkField: "Deal_Name",
  },
  {
    id: "closing-deals",
    section: "Deals",
    label: "Deals Closing This Month",
    module: "Deals",
    view: "my-deals-closing-this-month",
    linkField: "Deal_Name",
  },
  {
    id: "campaigns",
    section: "Campaigns",
    label: "My Active Campaigns",
    module: "Campaigns",
    view: "my-active-campaigns",
    linkField: "Campaign_Name",
  },
] as const satisfies readonly {
  id: string;
  section: string;
  label: string;
  module: ModuleApiName;
  view: string;
  linkField: string;
  columns?: readonly string[];
}[];

export type QueueId = (typeof queueDefinitions)[number]["id"];
export type QueueData = {
  id: QueueId;
  columns: readonly FieldDefinition[];
  result: ListResult;
  count: number;
};

/** Existing service reads keep this page GET-only, including refresh and paging. */
export async function loadQueues(service: RecordService, page: number): Promise<QueueData[]> {
  const modules = [...new Set(queueDefinitions.map((queue) => queue.module))];
  const bundles = new Map(
    await Promise.all(
      modules.map(
        async (module) =>
          [
            module,
            { metadata: await service.getModule(module), views: await service.listViews(module) },
          ] as const,
      ),
    ),
  );
  return Promise.all(
    queueDefinitions.map(async (queue) => {
      const bundle = bundles.get(queue.module);
      if (!bundle) throw new Error("Queue metadata is unavailable.");
      const view = bundle.views.find((view) => view.id === queue.view);
      if (!view) throw new Error(`Queue view is unavailable: ${queue.view}`);
      // Meetings/Calls have an owner filter; period semantics are left to a later slice.
      const filters: Criteria = {
        field: "Owner",
        comparator: "equal",
        value: { token: "CURRENTUSER" },
      };
      const query = { viewId: view.id, page, perPage: PAGE_SIZE, filters };
      const [result, count] = await Promise.all([
        service.list(queue.module, query),
        service.count(queue.module, query),
      ]);
      const names = "columns" in queue ? queue.columns : view.columns;
      const columns = names.flatMap((name) => {
        const field = bundle.metadata.fields.find((field) => field.apiName === name);
        return field ? [field] : [];
      });
      return { id: queue.id, columns, result, count };
    }),
  );
}
