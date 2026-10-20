import { ATTACHMENT_CARD_MODULES, supportsAttachmentCard } from "@crm/core/attachments/modules";
import { describe, expect, it } from "vitest";
import { accountsRelatedLists } from "./accounts/accounts-related-lists";
import { contactsRelatedLists } from "./contacts/contacts-related-lists";
import { dealsRelatedLists } from "./deals/deals-related-lists";
import { createLeadsRelatedLists } from "./leads/leads-related-lists";
import type { RelatedListDefinition } from "./types";

describe("attachments card contract", () => {
  it("every supported module mounts the attachments card", () => {
    const listMap: Record<string, readonly RelatedListDefinition[]> = {
      Leads: createLeadsRelatedLists(),
      Contacts: contactsRelatedLists,
      Accounts: accountsRelatedLists,
      Deals: dealsRelatedLists,
    };

    for (const module of ATTACHMENT_CARD_MODULES) {
      expect(supportsAttachmentCard(module)).toBe(true);
      const lists = listMap[module];
      expect(lists, `${module} related lists`).toBeDefined();
      const attachments = lists?.find((card) => card.id === "attachments");
      expect(attachments, `${module} attachments card`).toBeDefined();
      expect(attachments?.renderCard, `${module} renderCard`).toBeDefined();

      const element = attachments?.renderCard?.({
        record: { id: "rec-1", fields: {} },
        orgSlug: "test-org",
        recordPath: () => "/",
        definition: attachments,
      });
      expect(element).toBeDefined();
    }
  });
});
