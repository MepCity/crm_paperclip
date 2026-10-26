// Fixture data is synthetic. Tabs, filters, Monitor columns and the unavailable
// boundaries are documentation-derived (public "Working with the Social Tab"
// page, research/specs/visits-social.md R2 SD01-SD05/SD10); not observed live.
export type SocialState = "not-connected" | "permission-denied" | "connected-empty" | "populated";

export const integrationState = { status: "not-connected" } as const;

const STATES: readonly SocialState[] = [
  "not-connected",
  "permission-denied",
  "connected-empty",
  "populated",
];

/** Selects the fixture state from the `fixture` query value; default is disconnected. */
export function resolveSocialState(value: string | undefined): SocialState {
  return STATES.find((s) => s === value) ?? integrationState.status;
}

export const socialTabs = ["Dashboard", "Monitor", "Post", "Activity Log"] as const;
export type SocialTab = (typeof socialTabs)[number];

export const interactionKinds = ["Conversation", "Message"] as const;
export type InteractionKind = (typeof interactionKinds)[number];

export const networks = ["All networks", "Network A", "Network B"] as const;
export const brands = ["All brands", "Brand One", "Brand Two"] as const;
export const crmModules = ["All modules", "Leads", "Contacts"] as const;

/** Fixed Monitor column set (documented); no add/save/remove/reorder. */
export const monitorColumns = ["Network", "Profile", "Text", "Brand", "Module", "Time"] as const;

export type MonitorRow = {
  id: string;
  kind: InteractionKind;
  network: string;
  profile: string;
  text: string;
  brand: string;
  module: string;
  time: string;
};

export const monitorRows: readonly MonitorRow[] = [
  {
    id: "m1",
    kind: "Conversation",
    network: "Network A",
    profile: "Sample Person One",
    text: "Asked about pricing",
    brand: "Brand One",
    module: "Leads",
    time: "09:10",
  },
  {
    id: "m2",
    kind: "Message",
    network: "Network B",
    profile: "Sample Person Two",
    text: "Thanks for the demo",
    brand: "Brand Two",
    module: "Contacts",
    time: "09:42",
  },
  {
    id: "m3",
    kind: "Conversation",
    network: "Network B",
    profile: "Sample Person Three",
    text: "Needs a callback",
    brand: "Brand One",
    module: "Leads",
    time: "10:05",
  },
  {
    id: "m4",
    kind: "Message",
    network: "Network A",
    profile: "Sample Person Four",
    text: "Shared our post",
    brand: "Brand Two",
    module: "Contacts",
    time: "11:30",
  },
];

export const activityLog: readonly string[] = [
  "Sample Person One interacted with Brand One",
  "Sample Person Two interacted with Brand Two",
];
