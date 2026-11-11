"use client";

import type { AdCampaign, AdGroup, AdItem, AdKeyword, KeywordMatchType } from "@crm/core/ads";
import { useCallback, useEffect, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  type AdsTreeResponse,
  createAdGroup,
  createAdItem,
  createAdKeyword,
  createCampaign,
  deleteAdGroup,
  deleteAdItem,
  deleteAdKeyword,
  deleteCampaign,
  fetchAdsTree,
  updateAdGroup,
  updateAdItem,
  updateAdKeyword,
  updateCampaign,
} from "./api";

interface GoogleExtensionsScreenProps {
  orgSlug: string;
}

type TabKey = "contacts" | "calendar" | "ads" | "chat";

export function GoogleExtensionsScreen({ orgSlug }: GoogleExtensionsScreenProps) {
  const t = useUiTranslations();
  const [selectedTab, setSelectedTab] = useState<TabKey>("ads");

  // Ads tree data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdsTreeResponse | null>(null);

  // Expansion states
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Modals state
  const [campaignModal, setCampaignModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaign?: AdCampaign;
  }>({ open: false, mode: "create" });

  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaignId: string;
    group?: AdGroup;
  }>({ open: false, mode: "create", campaignId: "" });

  const [keywordModal, setKeywordModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaignId: string;
    groupId: string;
    keyword?: AdKeyword;
  }>({ open: false, mode: "create", campaignId: "", groupId: "" });

  const [itemModal, setItemModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaignId: string;
    groupId: string;
    item?: AdItem;
  }>({ open: false, mode: "create", campaignId: "", groupId: "" });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "campaign" | "group" | "keyword" | "item";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "paused">("active");
  const [formMatchType, setFormMatchType] = useState<KeywordMatchType>("broad");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdsTree(orgSlug);
      setData(res);
      // Automatically expand all campaigns by default
      const expC: Record<string, boolean> = {};
      const expG: Record<string, boolean> = {};
      for (const c of res.campaigns) {
        expC[c.id] = true;
      }
      for (const g of res.groups) {
        expG[g.id] = true;
      }
      setExpandedCampaigns((prev) => ({ ...expC, ...prev }));
      setExpandedGroups((prev) => ({ ...expG, ...prev }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open modals
  const openCreateCampaign = () => {
    setFormName("");
    setFormStatus("active");
    setFormError(null);
    setCampaignModal({ open: true, mode: "create" });
  };

  const openEditCampaign = (campaign: AdCampaign) => {
    setFormName(campaign.name);
    setFormStatus(campaign.status);
    setFormError(null);
    setCampaignModal({ open: true, mode: "edit", campaign });
  };

  const openCreateGroup = (campaignId: string) => {
    setFormName("");
    setFormStatus("active");
    setFormError(null);
    setGroupModal({ open: true, mode: "create", campaignId });
  };

  const openEditGroup = (group: AdGroup) => {
    setFormName(group.name);
    setFormStatus(group.status);
    setFormError(null);
    setGroupModal({ open: true, mode: "edit", campaignId: group.campaignId, group });
  };

  const openCreateKeyword = (campaignId: string, groupId: string) => {
    setFormName("");
    setFormMatchType("broad");
    setFormStatus("active");
    setFormError(null);
    setKeywordModal({ open: true, mode: "create", campaignId, groupId });
  };

  const openEditKeyword = (keyword: AdKeyword) => {
    setFormName(keyword.name);
    setFormMatchType(keyword.matchType);
    setFormStatus(keyword.status);
    setFormError(null);
    setKeywordModal({
      open: true,
      mode: "edit",
      campaignId: keyword.campaignId,
      groupId: keyword.adGroupId,
      keyword,
    });
  };

  const openCreateItem = (campaignId: string, groupId: string) => {
    setFormName("");
    setFormStatus("active");
    setFormError(null);
    setItemModal({ open: true, mode: "create", campaignId, groupId });
  };

  const openEditItem = (item: AdItem) => {
    setFormName(item.name);
    setFormStatus(item.status);
    setFormError(null);
    setItemModal({
      open: true,
      mode: "edit",
      campaignId: item.campaignId,
      groupId: item.adGroupId,
      item,
    });
  };

  // Submit handlers
  const handleCampaignSubmit = async () => {
    if (!formName.trim()) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      if (campaignModal.mode === "create") {
        await createCampaign(orgSlug, { name: formName.trim(), status: formStatus });
      } else if (campaignModal.campaign) {
        await updateCampaign(orgSlug, campaignModal.campaign.id, {
          name: formName.trim(),
          status: formStatus,
        });
      }
      setCampaignModal({ open: false, mode: "create" });
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving campaign.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleGroupSubmit = async () => {
    if (!formName.trim()) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      if (groupModal.mode === "create") {
        await createAdGroup(orgSlug, {
          campaignId: groupModal.campaignId,
          name: formName.trim(),
          status: formStatus,
        });
      } else if (groupModal.group) {
        await updateAdGroup(orgSlug, groupModal.group.id, {
          name: formName.trim(),
          status: formStatus,
        });
      }
      setGroupModal({ open: false, mode: "create", campaignId: "" });
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving ad group.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleKeywordSubmit = async () => {
    if (!formName.trim()) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      if (keywordModal.mode === "create") {
        await createAdKeyword(orgSlug, {
          campaignId: keywordModal.campaignId,
          adGroupId: keywordModal.groupId,
          name: formName.trim(),
          matchType: formMatchType,
          status: formStatus,
        });
      } else if (keywordModal.keyword) {
        await updateAdKeyword(orgSlug, keywordModal.keyword.id, {
          name: formName.trim(),
          matchType: formMatchType,
          status: formStatus,
        });
      }
      setKeywordModal({ open: false, mode: "create", campaignId: "", groupId: "" });
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving keyword.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleItemSubmit = async () => {
    if (!formName.trim()) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      if (itemModal.mode === "create") {
        await createAdItem(orgSlug, {
          campaignId: itemModal.campaignId,
          adGroupId: itemModal.groupId,
          name: formName.trim(),
          status: formStatus,
        });
      } else if (itemModal.item) {
        await updateAdItem(orgSlug, itemModal.item.id, {
          name: formName.trim(),
          status: formStatus,
        });
      }
      setItemModal({ open: false, mode: "create", campaignId: "", groupId: "" });
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving text ad.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "campaign") {
        await deleteCampaign(orgSlug, deleteTarget.id);
      } else if (deleteTarget.type === "group") {
        await deleteAdGroup(orgSlug, deleteTarget.id);
      } else if (deleteTarget.type === "keyword") {
        await deleteAdKeyword(orgSlug, deleteTarget.id);
      } else if (deleteTarget.type === "item") {
        await deleteAdItem(orgSlug, deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadData();
    } catch {
      // Ignore
    } finally {
      setDeleting(false);
    }
  };

  const campaigns = data?.campaigns ?? [];
  const groups = data?.groups ?? [];
  const keywords = data?.keywords ?? [];
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("modules.googleExtensions.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("modules.googleExtensions.description")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
          <Icons.help className="size-4" />
          <span>{t("modules.googleExtensions.help")}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as TabKey)}
        className="w-full"
      >
        <TabList
          aria-label={t("modules.googleExtensions.title")}
          className="border-b border-border"
        >
          <Tab id="contacts">{t("modules.googleExtensions.tabs.contacts")}</Tab>
          <Tab id="calendar">{t("modules.googleExtensions.tabs.calendar")}</Tab>
          <Tab id="ads">{t("modules.googleExtensions.tabs.ads")}</Tab>
          <Tab id="chat">{t("modules.googleExtensions.tabs.chat")}</Tab>
        </TabList>

        {/* Contacts Tab */}
        <TabPanel id="contacts" className="py-6">
          <div className="rounded-lg border border-border bg-surface p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4">
            <div className="p-3 bg-muted rounded-full">
              <Icons.warning className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t("modules.googleExtensions.disabledTab.bannerTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("modules.googleExtensions.disabledTab.bannerDescription")}
              </p>
            </div>
            <Button variant="secondary" isDisabled className="mt-2">
              {t("modules.googleExtensions.disabledTab.authButton")}
            </Button>
          </div>
        </TabPanel>

        {/* Calendar Tab */}
        <TabPanel id="calendar" className="py-6">
          <div className="rounded-lg border border-border bg-surface p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4">
            <div className="p-3 bg-muted rounded-full">
              <Icons.warning className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t("modules.googleExtensions.disabledTab.bannerTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("modules.googleExtensions.disabledTab.bannerDescription")}
              </p>
            </div>
            <Button variant="secondary" isDisabled className="mt-2">
              {t("modules.googleExtensions.disabledTab.authButton")}
            </Button>
          </div>
        </TabPanel>

        {/* Google Ads Tab */}
        <TabPanel id="ads" className="py-6 flex flex-col gap-6">
          {/* Disconnected Banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border">
            <Icons.info className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                {t("modules.googleExtensions.ads.bannerTitle")}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t("modules.googleExtensions.ads.bannerDescription")}
              </p>
            </div>
          </div>

          {/* Attribution Card */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border">
            <Icons.info className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                {t("modules.googleExtensions.ads.attributionCardTitle")}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t("modules.googleExtensions.ads.attributionCardDescription")}
              </p>
            </div>
          </div>

          {/* Model Tree Section */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <Icons.barChart className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {t("modules.googleExtensions.ads.campaigns")}
                </h3>
              </div>
              <Button
                variant="primary"
                onClick={openCreateCampaign}
                data-testid="create-campaign-button"
              >
                <Icons.plus className="size-4 mr-1" />
                <span>{t("modules.googleExtensions.ads.newCampaign")}</span>
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Spinner className="size-8 text-primary" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-danger">{error}</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title={t("modules.googleExtensions.ads.emptyTitle")}
                  description={t("modules.googleExtensions.ads.emptyDescription")}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {campaigns.map((campaign) => {
                  const campaignGroups = groups.filter((g) => g.campaignId === campaign.id);
                  const isExp = Boolean(expandedCampaigns[campaign.id]);

                  return (
                    <div
                      key={campaign.id}
                      className="flex flex-col"
                      data-testid={`campaign-row-${campaign.id}`}
                    >
                      {/* Campaign Header Row */}
                      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCampaign(campaign.id)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            aria-label={
                              isExp
                                ? t("common.actions.close")
                                : t("modules.googleExtensions.ads.campaigns")
                            }
                          >
                            {isExp ? (
                              <Icons.chevronDown className="size-4" />
                            ) : (
                              <Icons.chevronRight className="size-4" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{campaign.name}</span>
                              <Badge variant={campaign.status === "active" ? "success" : "neutral"}>
                                {campaign.status === "active"
                                  ? t("modules.googleExtensions.ads.statuses.active")
                                  : t("modules.googleExtensions.ads.statuses.paused")}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {campaign.createdAt.slice(0, 10)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => openCreateGroup(campaign.id)}
                            className="h-8 text-xs px-2.5"
                            data-testid={`add-group-button-${campaign.id}`}
                          >
                            <Icons.plus className="size-3.5 mr-1" />
                            <span>{t("modules.googleExtensions.ads.addAdGroup")}</span>
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => openEditCampaign(campaign)}
                            className="h-8 text-xs px-2.5"
                            data-testid={`edit-campaign-${campaign.id}`}
                          >
                            <Icons.fieldEdit className="size-3.5 mr-1" />
                            <span>{t("modules.googleExtensions.ads.edit")}</span>
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setDeleteTarget({
                                type: "campaign",
                                id: campaign.id,
                                name: campaign.name,
                              })
                            }
                            className="h-8 text-xs px-2.5 text-danger hover:text-danger"
                            data-testid={`delete-campaign-${campaign.id}`}
                          >
                            <Icons.close className="size-3.5 mr-1" />
                            <span>{t("modules.googleExtensions.ads.delete")}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Ad Groups */}
                      {isExp && (
                        <div className="pl-10 pr-4 pb-4 pt-1 bg-muted/10 border-t border-border flex flex-col gap-3">
                          {campaignGroups.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-2">
                              {t("modules.googleExtensions.ads.noAdGroups")}
                            </div>
                          ) : (
                            campaignGroups.map((group) => {
                              const groupKeywords = keywords.filter(
                                (k) => k.adGroupId === group.id,
                              );
                              const groupItems = items.filter((i) => i.adGroupId === group.id);
                              const isGroupExp = Boolean(expandedGroups[group.id]);

                              return (
                                <div
                                  key={group.id}
                                  className="rounded border border-border bg-surface overflow-hidden"
                                  data-testid={`group-row-${group.id}`}
                                >
                                  {/* Ad Group Row */}
                                  <div className="flex items-center justify-between p-3 bg-surface-raised">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleGroup(group.id)}
                                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                                        aria-label={
                                          isGroupExp
                                            ? t("common.actions.close")
                                            : t("modules.googleExtensions.ads.adGroups")
                                        }
                                      >
                                        {isGroupExp ? (
                                          <Icons.chevronDown className="size-3.5" />
                                        ) : (
                                          <Icons.chevronRight className="size-3.5" />
                                        )}
                                      </button>
                                      <span className="text-sm font-semibold text-foreground">
                                        {group.name}
                                      </span>
                                      <Badge
                                        variant={group.status === "active" ? "success" : "neutral"}
                                      >
                                        {group.status === "active"
                                          ? t("modules.googleExtensions.ads.statuses.active")
                                          : t("modules.googleExtensions.ads.statuses.paused")}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        variant="secondary"
                                        onClick={() => openCreateKeyword(campaign.id, group.id)}
                                        className="h-7 text-xs px-2"
                                        data-testid={`add-keyword-${group.id}`}
                                      >
                                        <Icons.plus className="size-3 mr-1" />
                                        <span>{t("modules.googleExtensions.ads.addKeyword")}</span>
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        onClick={() => openCreateItem(campaign.id, group.id)}
                                        className="h-7 text-xs px-2"
                                        data-testid={`add-item-${group.id}`}
                                      >
                                        <Icons.plus className="size-3 mr-1" />
                                        <span>{t("modules.googleExtensions.ads.addAdItem")}</span>
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        onClick={() => openEditGroup(group)}
                                        className="h-7 text-xs px-2"
                                      >
                                        <Icons.fieldEdit className="size-3 mr-1" />
                                        <span>{t("modules.googleExtensions.ads.edit")}</span>
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: "group",
                                            id: group.id,
                                            name: group.name,
                                          })
                                        }
                                        className="h-7 text-xs px-2 text-danger hover:text-danger"
                                      >
                                        <Icons.close className="size-3 mr-1" />
                                        <span>{t("modules.googleExtensions.ads.delete")}</span>
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Expanded Keywords & Ads */}
                                  {isGroupExp && (
                                    <div className="p-3 flex flex-col gap-4 border-t border-border">
                                      {/* Keywords Sub-Table */}
                                      <div>
                                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                          {t("modules.googleExtensions.ads.keywords")} (
                                          {groupKeywords.length})
                                        </h5>
                                        {groupKeywords.length === 0 ? (
                                          <div className="text-xs text-muted-foreground">
                                            {t("modules.googleExtensions.ads.noKeywords")}
                                          </div>
                                        ) : (
                                          <div className="divide-y divide-border rounded border border-border">
                                            {groupKeywords.map((kw) => (
                                              <div
                                                key={kw.id}
                                                className="flex items-center justify-between p-2 text-xs"
                                                data-testid={`keyword-row-${kw.id}`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="font-mono text-foreground">
                                                    {kw.name}
                                                  </span>
                                                  <Badge variant="neutral">
                                                    {kw.matchType === "exact"
                                                      ? t(
                                                          "modules.googleExtensions.ads.matchTypes.exact",
                                                        )
                                                      : kw.matchType === "phrase"
                                                        ? t(
                                                            "modules.googleExtensions.ads.matchTypes.phrase",
                                                          )
                                                        : t(
                                                            "modules.googleExtensions.ads.matchTypes.broad",
                                                          )}
                                                  </Badge>
                                                  <Badge
                                                    variant={
                                                      kw.status === "active" ? "success" : "neutral"
                                                    }
                                                  >
                                                    {kw.status === "active"
                                                      ? t(
                                                          "modules.googleExtensions.ads.statuses.active",
                                                        )
                                                      : t(
                                                          "modules.googleExtensions.ads.statuses.paused",
                                                        )}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => openEditKeyword(kw)}
                                                    className="p-1 text-muted-foreground hover:text-foreground"
                                                    aria-label={t(
                                                      "modules.googleExtensions.ads.edit",
                                                    )}
                                                  >
                                                    <Icons.fieldEdit className="size-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setDeleteTarget({
                                                        type: "keyword",
                                                        id: kw.id,
                                                        name: kw.name,
                                                      })
                                                    }
                                                    className="p-1 text-danger hover:text-danger"
                                                    aria-label={t(
                                                      "modules.googleExtensions.ads.delete",
                                                    )}
                                                  >
                                                    <Icons.close className="size-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Text Ads Sub-Table */}
                                      <div>
                                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                          {t("modules.googleExtensions.ads.adItems")} (
                                          {groupItems.length})
                                        </h5>
                                        {groupItems.length === 0 ? (
                                          <div className="text-xs text-muted-foreground">
                                            {t("modules.googleExtensions.ads.noAdItems")}
                                          </div>
                                        ) : (
                                          <div className="divide-y divide-border rounded border border-border">
                                            {groupItems.map((item) => (
                                              <div
                                                key={item.id}
                                                className="flex items-center justify-between p-2 text-xs"
                                                data-testid={`item-row-${item.id}`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="font-semibold text-foreground">
                                                    {item.name}
                                                  </span>
                                                  <Badge
                                                    variant={
                                                      item.status === "active"
                                                        ? "success"
                                                        : "neutral"
                                                    }
                                                  >
                                                    {item.status === "active"
                                                      ? t(
                                                          "modules.googleExtensions.ads.statuses.active",
                                                        )
                                                      : t(
                                                          "modules.googleExtensions.ads.statuses.paused",
                                                        )}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => openEditItem(item)}
                                                    className="p-1 text-muted-foreground hover:text-foreground"
                                                    aria-label={t(
                                                      "modules.googleExtensions.ads.edit",
                                                    )}
                                                  >
                                                    <Icons.fieldEdit className="size-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setDeleteTarget({
                                                        type: "item",
                                                        id: item.id,
                                                        name: item.name,
                                                      })
                                                    }
                                                    className="p-1 text-danger hover:text-danger"
                                                    aria-label={t(
                                                      "modules.googleExtensions.ads.delete",
                                                    )}
                                                  >
                                                    <Icons.close className="size-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabPanel>

        {/* Google Chat Tab */}
        <TabPanel id="chat" className="py-6">
          <div className="rounded-lg border border-border bg-surface p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4">
            <div className="p-3 bg-muted rounded-full">
              <Icons.warning className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t("modules.googleExtensions.disabledTab.bannerTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("modules.googleExtensions.disabledTab.bannerDescription")}
              </p>
            </div>
            <Button variant="secondary" isDisabled className="mt-2">
              {t("modules.googleExtensions.disabledTab.authButton")}
            </Button>
          </div>
        </TabPanel>
      </Tabs>

      {/* Campaign Modal */}
      {campaignModal.open && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) => !open && setCampaignModal({ open: false, mode: "create" })}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={
                campaignModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.campaignCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.campaignEditTitle")
              }
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {campaignModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.campaignCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.campaignEditTitle")}
              </Heading>

              {formError && <div className="text-sm text-danger">{formError}</div>}

              <TextField
                label={t("modules.googleExtensions.ads.dialogs.campaignName")}
                value={formName}
                onChange={setFormName}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="campaign-status-select"
                  className="text-xs font-semibold text-foreground"
                >
                  {t("modules.googleExtensions.ads.status")}
                </label>
                <select
                  id="campaign-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "paused")}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">
                    {t("modules.googleExtensions.ads.statuses.active")}
                  </option>
                  <option value="paused">
                    {t("modules.googleExtensions.ads.statuses.paused")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setCampaignModal({ open: false, mode: "create" })}
                  isDisabled={formSubmitting}
                >
                  {t("modules.googleExtensions.ads.dialogs.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCampaignSubmit}
                  isDisabled={!formName.trim() || formSubmitting}
                  data-testid="save-campaign-button"
                >
                  {formSubmitting
                    ? t("modules.googleExtensions.ads.dialogs.saving")
                    : t("modules.googleExtensions.ads.dialogs.save")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Group Modal */}
      {groupModal.open && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) =>
            !open && setGroupModal({ open: false, mode: "create", campaignId: "" })
          }
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={
                groupModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.groupCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.groupEditTitle")
              }
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {groupModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.groupCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.groupEditTitle")}
              </Heading>

              {formError && <div className="text-sm text-danger">{formError}</div>}

              <TextField
                label={t("modules.googleExtensions.ads.dialogs.groupName")}
                value={formName}
                onChange={setFormName}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="group-status-select"
                  className="text-xs font-semibold text-foreground"
                >
                  {t("modules.googleExtensions.ads.status")}
                </label>
                <select
                  id="group-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "paused")}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">
                    {t("modules.googleExtensions.ads.statuses.active")}
                  </option>
                  <option value="paused">
                    {t("modules.googleExtensions.ads.statuses.paused")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setGroupModal({ open: false, mode: "create", campaignId: "" })}
                  isDisabled={formSubmitting}
                >
                  {t("modules.googleExtensions.ads.dialogs.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGroupSubmit}
                  isDisabled={!formName.trim() || formSubmitting}
                  data-testid="save-group-button"
                >
                  {formSubmitting
                    ? t("modules.googleExtensions.ads.dialogs.saving")
                    : t("modules.googleExtensions.ads.dialogs.save")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Keyword Modal */}
      {keywordModal.open && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) =>
            !open && setKeywordModal({ open: false, mode: "create", campaignId: "", groupId: "" })
          }
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={
                keywordModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.keywordCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.keywordEditTitle")
              }
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {keywordModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.keywordCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.keywordEditTitle")}
              </Heading>

              {formError && <div className="text-sm text-danger">{formError}</div>}

              <TextField
                label={t("modules.googleExtensions.ads.dialogs.keywordText")}
                value={formName}
                onChange={setFormName}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="keyword-match-type-select"
                  className="text-xs font-semibold text-foreground"
                >
                  {t("modules.googleExtensions.ads.matchType")}
                </label>
                <select
                  id="keyword-match-type-select"
                  value={formMatchType}
                  onChange={(e) => setFormMatchType(e.target.value as KeywordMatchType)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="broad">
                    {t("modules.googleExtensions.ads.matchTypes.broad")}
                  </option>
                  <option value="phrase">
                    {t("modules.googleExtensions.ads.matchTypes.phrase")}
                  </option>
                  <option value="exact">
                    {t("modules.googleExtensions.ads.matchTypes.exact")}
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="keyword-status-select"
                  className="text-xs font-semibold text-foreground"
                >
                  {t("modules.googleExtensions.ads.status")}
                </label>
                <select
                  id="keyword-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "paused")}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">
                    {t("modules.googleExtensions.ads.statuses.active")}
                  </option>
                  <option value="paused">
                    {t("modules.googleExtensions.ads.statuses.paused")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setKeywordModal({ open: false, mode: "create", campaignId: "", groupId: "" })
                  }
                  isDisabled={formSubmitting}
                >
                  {t("modules.googleExtensions.ads.dialogs.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleKeywordSubmit}
                  isDisabled={!formName.trim() || formSubmitting}
                  data-testid="save-keyword-button"
                >
                  {formSubmitting
                    ? t("modules.googleExtensions.ads.dialogs.saving")
                    : t("modules.googleExtensions.ads.dialogs.save")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Text Ad Item Modal */}
      {itemModal.open && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) =>
            !open && setItemModal({ open: false, mode: "create", campaignId: "", groupId: "" })
          }
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={
                itemModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.adCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.adEditTitle")
              }
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {itemModal.mode === "create"
                  ? t("modules.googleExtensions.ads.dialogs.adCreateTitle")
                  : t("modules.googleExtensions.ads.dialogs.adEditTitle")}
              </Heading>

              {formError && <div className="text-sm text-danger">{formError}</div>}

              <TextField
                label={t("modules.googleExtensions.ads.headline")}
                value={formName}
                onChange={setFormName}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="item-status-select"
                  className="text-xs font-semibold text-foreground"
                >
                  {t("modules.googleExtensions.ads.status")}
                </label>
                <select
                  id="item-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "paused")}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">
                    {t("modules.googleExtensions.ads.statuses.active")}
                  </option>
                  <option value="paused">
                    {t("modules.googleExtensions.ads.statuses.paused")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setItemModal({ open: false, mode: "create", campaignId: "", groupId: "" })
                  }
                  isDisabled={formSubmitting}
                >
                  {t("modules.googleExtensions.ads.dialogs.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleItemSubmit}
                  isDisabled={!formName.trim() || formSubmitting}
                  data-testid="save-item-button"
                >
                  {formSubmitting
                    ? t("modules.googleExtensions.ads.dialogs.saving")
                    : t("modules.googleExtensions.ads.dialogs.save")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={
          deleteTarget?.type === "campaign"
            ? t("modules.googleExtensions.ads.dialogs.deleteCampaignTitle")
            : deleteTarget?.type === "group"
              ? t("modules.googleExtensions.ads.dialogs.deleteGroupTitle")
              : deleteTarget?.type === "keyword"
                ? t("modules.googleExtensions.ads.dialogs.deleteKeywordTitle")
                : t("modules.googleExtensions.ads.dialogs.deleteAdTitle")
        }
        message={
          deleteTarget?.type === "campaign"
            ? t("modules.googleExtensions.ads.dialogs.deleteCampaignMessage")
            : deleteTarget?.type === "group"
              ? t("modules.googleExtensions.ads.dialogs.deleteGroupMessage")
              : deleteTarget?.type === "keyword"
                ? t("modules.googleExtensions.ads.dialogs.deleteKeywordMessage")
                : t("modules.googleExtensions.ads.dialogs.deleteAdMessage")
        }
        confirmLabel={t("modules.googleExtensions.ads.dialogs.confirmDelete")}
        cancelLabel={t("modules.googleExtensions.ads.dialogs.cancel")}
        tone="danger"
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
