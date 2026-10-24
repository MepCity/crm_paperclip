export const integrationState = { status: "not-connected" } as const;

/**
 * Documentation-derived fixture (research/specs/visits-social.md, R2). Nothing here is observed
 * behaviour or live schema: views, columns and fields are the documented ones, the list column
 * subset is a provisional CTO decision, and all records are synthetic.
 */
export type VisitsAvailability = "disconnected" | "enabled-empty" | "populated";

/** Default stays disconnected; `?state=` is the fixture selector for the other two states. */
export function resolveVisitsAvailability(value: string | undefined): VisitsAvailability {
  return value === "enabled-empty" || value === "populated" ? value : "disconnected";
}

export const trackingAccounts = [
  { id: "acct-alpha", name: "Alpha Site Portal" },
  { id: "acct-beta", name: "Beta Site Portal" },
] as const;

export const visitViews = [
  { id: "all", label: "All Visits" },
  { id: "today", label: "Today's Visits" },
  { id: "top", label: "Top Visits" },
  { id: "today-top", label: "Today's Top Visits" },
  { id: "leads", label: "Visits by Leads" },
  { id: "contacts", label: "Visits by Contacts" },
] as const;
export type VisitViewId = (typeof visitViews)[number]["id"];

export interface ActionPerformed {
  type: "Accessed" | "Navigation" | "Chat";
  action: string;
  timeSpent: string;
  performedTime: string;
}

export interface Visit {
  id: string;
  accountId: string;
  visitedByKind: "Lead" | "Contact";
  today: boolean;
  ipAddress: string;
  visitedBy: string;
  visitedPage: string;
  timeSpent: number;
  referrer: string;
  userAgents: string;
  attendedBy: string;
  visitedPageUrl: string;
  browser: string;
  operatingSystem: string;
  portalName: string;
  visitorType: string;
  revenue: string;
  visitedTime: string;
  searchKeyword: string;
  searchEngine: string;
  actions: ActionPerformed[];
}

/** Provisional list columns: documented fields, documented order, max 8. */
export const listColumns: { key: keyof Visit; label: string }[] = [
  { key: "ipAddress", label: "IP Address" },
  { key: "visitedBy", label: "VisitedBy" },
  { key: "visitedPage", label: "Visited Page" },
  { key: "timeSpent", label: "Time Spent (Minutes)" },
  { key: "referrer", label: "Referrer" },
  { key: "userAgents", label: "User Agents" },
  { key: "attendedBy", label: "Attended By" },
  { key: "visitedPageUrl", label: "Visited Page URL" },
];

export const detailFields: { key: keyof Visit; label: string }[] = [
  ...listColumns,
  { key: "browser", label: "Browser" },
  { key: "operatingSystem", label: "Operating System" },
  { key: "portalName", label: "Portal Name" },
  { key: "visitorType", label: "Visitor Type" },
  { key: "revenue", label: "Revenue" },
  { key: "visitedTime", label: "Visited Time" },
  { key: "searchKeyword", label: "Search Keyword" },
  { key: "searchEngine", label: "Search Engine" },
];

const mk = (n: number, over: Partial<Visit>): Visit => ({
  id: `visit-${n}`,
  accountId: "acct-alpha",
  visitedByKind: "Lead",
  today: false,
  ipAddress: `192.0.2.${n}`,
  visitedBy: `Sample Visitor ${n}`,
  visitedPage: `Sample Page ${n}`,
  timeSpent: n * 2,
  referrer: "https://referrer.example/sample",
  userAgents: "Synthetic Agent 1.0",
  attendedBy: "Synthetic Owner",
  visitedPageUrl: `https://site.example/page-${n}`,
  browser: "Synthetic Browser",
  operatingSystem: "Synthetic OS",
  portalName: "Alpha Site Portal",
  visitorType: "Returning",
  revenue: "0.00",
  visitedTime: "2026-01-01 10:00",
  searchKeyword: "sample keyword",
  searchEngine: "Sample Search",
  actions: [
    { type: "Accessed", action: "Opened landing page", timeSpent: "2 min", performedTime: "10:00" },
    { type: "Navigation", action: "Viewed pricing", timeSpent: "3 min", performedTime: "10:02" },
    { type: "Chat", action: "Started a chat", timeSpent: "1 min", performedTime: "10:05" },
  ],
  ...over,
});

export const visitFixtures: Visit[] = [
  mk(1, { today: true }),
  mk(2, { today: true, visitedByKind: "Contact" }),
  mk(3, { visitedByKind: "Contact" }),
  mk(4, { accountId: "acct-beta", portalName: "Beta Site Portal" }),
];

export function findVisit(id: string): Visit | undefined {
  return visitFixtures.find((v) => v.id === id);
}

export function visitsFor(accountId: string, view: VisitViewId): Visit[] | "ranking-unavailable" {
  if (view === "top" || view === "today-top") return "ranking-unavailable";
  return visitFixtures.filter(
    (v) =>
      v.accountId === accountId &&
      (view === "all" ||
        (view === "today" && v.today) ||
        (view === "leads" && v.visitedByKind === "Lead") ||
        (view === "contacts" && v.visitedByKind === "Contact")),
  );
}
