/**
 * Documentation-derived fixture (research/specs/home-workqueue.md, R2, slice H-F1). Nothing here
 * is observed behaviour or a live schema: the page model (HD01), the Custom View card (HD06) and
 * the Deals-by-stage aggregation (HD16) are the documented ones, all records are synthetic, the
 * page list is NOT the account's real page list, KPI formulas are intentionally withheld, and the
 * empty-state copy is a local convention (the documentation gives no per-card empty contract).
 */
export type HomeView = "onboarding" | "preview" | "preview-empty";

/** Default stays onboarding; `?state=` is the fixture flag for the other two views. */
export function resolveHomeView(value: string | undefined): HomeView {
  return value === "preview" || value === "preview-empty" ? value : "onboarding";
}

export const pageOptions = [
  { id: "onboarding", label: "Getting started" },
  { id: "preview", label: "Personal page preview" },
] as const;

export const taskCardFields = ["Subject", "Due Date", "Status", "Priority"] as const;
export const taskCardSource = "Custom View · Tasks · Open Tasks";

export const taskRows = [
  {
    id: "t1",
    subject: "Send revised proposal",
    dueDate: "Oct 26, 2026",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "t2",
    subject: "Schedule onboarding call",
    dueDate: "Oct 27, 2026",
    status: "Not Started",
    priority: "Normal",
  },
  {
    id: "t3",
    subject: "Review contract draft",
    dueDate: "Oct 29, 2026",
    status: "Not Started",
    priority: "High",
  },
] as const;

export const dealsCardSource = "Aggregation · Deals · Pipeline Deals by Stage";
export const dealsCardFields = ["Stage", "Deals", "Amount"] as const;

export const dealStages = [
  { stage: "Qualification", count: 4, amount: 12000 },
  { stage: "Proposal", count: 3, amount: 18500 },
  { stage: "Negotiation", count: 2, amount: 9000 },
] as const;

export const emptyCopy = "No records to show (local preview convention)";
