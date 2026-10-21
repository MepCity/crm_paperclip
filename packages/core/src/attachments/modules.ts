/**
 * The one definition of which modules can own attachments. Server (API
 * acceptance) and client (card mounting, timeline events) both derive from it;
 * it is dependency-free so the client bundle can import it.
 */
export const ATTACHMENT_CARD_MODULES = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Campaigns",
  "Cases",
  "Solutions",
] as const;

/** API parents include additional record modules and Notes (composer), without mounting cards. */
export const ATTACHMENT_PARENT_MODULES: readonly string[] = [
  ...ATTACHMENT_CARD_MODULES,
  "Notes",
  "Tasks",
  "Events",
];

export type AttachmentCardModule = (typeof ATTACHMENT_CARD_MODULES)[number];

export function supportsAttachmentCard(module: string): module is AttachmentCardModule {
  return (ATTACHMENT_CARD_MODULES as readonly string[]).includes(module);
}
