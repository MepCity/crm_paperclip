import { Icons } from "@/components/ui/icon";
import { buildAccountsRecordMoreMenuGroups } from "../accounts/accounts-record-more-options";
import {
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
  ACCOUNTS_TIMELINE_SUBTABS,
  normalizeAccountsEventKind,
} from "../accounts/accounts-timeline";
import type { ModuleScreenDefinition } from "../types";
import {
  buildCampaignsBusinessCardFields,
  buildCampaignsDetailSections,
} from "./campaigns-detail-sections";
import {
  CAMPAIGNS_DELETE_CONFIRM_MESSAGE,
  CAMPAIGNS_DELETE_CONFIRM_TITLE,
  campaignsFormRules,
} from "./campaigns-form-rules";
import { isCampaignInlineEditable } from "./campaigns-inline-edit";
import { formatCampaignsLastUpdateLabel } from "./campaigns-last-update";
import { campaignsRecordHeaderIdentity } from "./campaigns-record-header";
import { campaignsRelatedListRail, campaignsRelatedLists } from "./campaigns-related-lists";
import { CAMPAIGNS_LIST_CURRENCY_CODE, campaignsListPageConfig } from "./list-config";
import { buildCampaignsFilterGroups } from "./list-filters";

/**
 * Registered in `registry.ts`. The more-options menu and the timeline are temporary
 * Accounts bindings; the record detail tasks replace them. The rail is provisional (MEP-812).
 */
export const campaignsScreenDefinition: ModuleScreenDefinition = {
  apiName: "Campaigns",
  tab: "Campaigns",
  singularLabel: "Campaign",
  pluralLabel: "Campaigns",
  pageTitle: "Campaigns",
  navigation: { id: "campaigns", icon: Icons.megaphone },
  list: campaignsListPageConfig,
  listCurrencyCode: CAMPAIGNS_LIST_CURRENCY_CODE,
  searchColumns: ["Campaign_Name", "Type", "Status", "Owner"],
  buildFilterGroups: buildCampaignsFilterGroups,
  form: {
    rules: campaignsFormRules,
    inventoryChrome: true,
    inventoryFooterPinned: true,
  },
  detail: {
    header: campaignsRecordHeaderIdentity,
    hasPortrait: false,
    recordNavigation: true,
    businessCard: buildCampaignsBusinessCardFields,
    sections: buildCampaignsDetailSections,
    inlineEditable: isCampaignInlineEditable,
    lastUpdate: formatCampaignsLastUpdateLabel,
    lastUpdatePlacement: "tab-row",
    moreOptions: buildAccountsRecordMoreMenuGroups,
    deleteTitle: CAMPAIGNS_DELETE_CONFIRM_TITLE,
    deleteMessage: CAMPAIGNS_DELETE_CONFIRM_MESSAGE,
    relatedLists: campaignsRelatedLists,
    relatedListRail: campaignsRelatedListRail,
    timeline: {
      subtabs: ACCOUNTS_TIMELINE_SUBTABS,
      modules: ACCOUNTS_TIMELINE_MODULE_OPTIONS,
      sources: ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
      normalizeEventKind: normalizeAccountsEventKind,
      upcomingAutomatedActions: {
        label: "Show Upcoming Automated Actions",
        laterModule: "M12",
      },
    },
  },
};
