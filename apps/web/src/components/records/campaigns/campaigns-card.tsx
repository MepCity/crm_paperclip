"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { invalidateModuleLists, useRecordCount } from "@/lib/api/client/hooks";
import { useOrgSlug } from "@/lib/api/client/provider";
import { AddToCampaignsDialog } from "./add-to-campaigns-dialog";
import { CampaignMembershipsCardBody, membershipsOfRecord } from "./campaign-memberships-card-body";

/**
 * Campaigns card wiring of a Lead or Contact record screen: the membership count for the
 * rail badge, the Add Campaigns opener shared by the card header and the rail plus, and the
 * dialog element to render next to the screen.
 */
export function useCampaignsCard(module: "Leads" | "Contacts", recordId: string) {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const count = useRecordCount("Campaign_Members", {
    viewId: "all-campaign-members",
    filters: membershipsOfRecord(module, recordId),
  });
  const onAdd = useCallback(() => setOpen(true), []);
  const dialog: ReactNode = useMemo(
    () =>
      open
        ? createElement(AddToCampaignsDialog, {
            module,
            recordIds: recordId,
            onCancel: () => setOpen(false),
            onDone: () => {
              setOpen(false);
              invalidateModuleLists(queryClient, orgSlug, "Campaign_Members");
            },
          })
        : null,
    [open, module, recordId, queryClient, orgSlug],
  );
  return { badge: count.data ?? 0, onAdd, dialog };
}

export function campaignsCardBody(
  module: "Leads" | "Contacts",
  recordId: string,
  campaignPath: (campaignId: string) => string,
) {
  return createElement(CampaignMembershipsCardBody, { module, recordId, campaignPath });
}
