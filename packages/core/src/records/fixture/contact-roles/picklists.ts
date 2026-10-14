import type { PicklistOption } from "../../contract";

// interim: confirm with research (MEP-557)
export const contactRoleNames = [
  "Purchasing",
  "Technical Buyer",
  "Evaluator",
  "Executive Sponsor",
  "Economic Decision Maker",
  "Developer/Evaluator",
  "Product Management",
] as const;

export const contactRolesPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Contact_Role: [
    { displayValue: "-None-", storedValue: "-None-" },
    ...contactRoleNames.map((name) => ({ displayValue: name, storedValue: name })),
  ],
};
