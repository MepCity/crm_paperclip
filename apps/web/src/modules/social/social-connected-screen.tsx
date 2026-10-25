"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { MessageKey, MessageValues } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  activityLog,
  brands,
  crmModules,
  type InteractionKind,
  interactionKinds,
  monitorColumns,
  monitorRows,
  networks,
  type SocialState,
  type SocialTab,
  socialTabs,
} from "./fixture";

const selectClass = "h-8 rounded border border-control-border bg-surface px-2 text-sm";

function Unavailable({ label, message }: { label: string; message?: string }) {
  const t = useUiTranslations();
  return (
    <Button
      variant="secondary"
      size="compact"
      aria-disabled="true"
      className="mr-2"
      onPress={() => {
        toast({
          variant: "info",
          title: message ?? t("modules.social.adminSettingsMsg"),
        });
      }}
    >
      {label}
    </Button>
  );
}

function getTabLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  tab: SocialTab,
): string {
  switch (tab) {
    case "Dashboard":
      return t("modules.social.dashboard");
    case "Monitor":
      return t("modules.social.monitor");
    case "Post":
      return t("modules.social.post");
    case "Activity Log":
      return t("modules.social.activityLog");
    default:
      return tab;
  }
}

function getNetworkLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  network: string,
): string {
  if (network === "All networks") return t("modules.social.allNetworks");
  return network;
}

function getBrandLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  brand: string,
): string {
  if (brand === "All brands") return t("modules.social.allBrands");
  return brand;
}

function getModuleLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  mod: string,
): string {
  if (mod === "All modules") return t("modules.social.allModules");
  return mod;
}

function getKindLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  kind: InteractionKind,
): string {
  if (kind === "Message") return t("modules.social.message");
  return kind;
}

export function SocialConnectedScreen({
  state,
}: {
  state: "connected-empty" | "populated" | "permission-denied";
}) {
  const t = useUiTranslations();
  const [tab, setTab] = useState<SocialTab>("Dashboard");
  const [kind, setKind] = useState<InteractionKind>("Conversation");
  const [network, setNetwork] = useState<string>(networks[0]);
  const [brand, setBrand] = useState<string>(brands[0]);
  const [mod, setMod] = useState<string>(crmModules[0]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [refreshes, setRefreshes] = useState(0);

  if (state === ("permission-denied" satisfies SocialState)) {
    return (
      <section
        aria-label={t("modules.social.socialAccess")}
        data-integration-state="permission-denied"
        className="p-6 text-text"
      >
        <p role="alert">{t("modules.social.permissionDenied")}</p>
      </section>
    );
  }

  const source = state === "populated" ? monitorRows : [];
  const q = query.trim().toLowerCase();
  const rows = source.filter(
    (r) =>
      r.kind === kind &&
      (network === networks[0] || r.network === network) &&
      (brand === brands[0] || r.brand === brand) &&
      (mod === crmModules[0] || r.module === mod) &&
      (!q || r.text.toLowerCase().includes(q) || r.profile.toLowerCase().includes(q)),
  );

  return (
    <section
      aria-label={t("modules.social.social")}
      data-integration-state={state}
      className="p-4 text-text"
    >
      <div
        role="tablist"
        aria-label={t("modules.social.socialSections")}
        className="mb-4 flex gap-2"
      >
        {socialTabs.map((currentTab) => (
          <button
            key={currentTab}
            type="button"
            role="tab"
            aria-selected={tab === currentTab}
            onClick={() => setTab(currentTab)}
            className={`px-3 py-1 text-sm ${tab === currentTab ? "border-b-2 border-primary" : ""}`}
          >
            {getTabLabel(t, currentTab)}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === "Dashboard" && (
          <p>
            {state === "populated"
              ? t("modules.social.interactionsCount", { count: monitorRows.length })
              : t("modules.social.noSocialActivity")}
          </p>
        )}
        {tab === "Monitor" && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                aria-label={t("modules.social.interactionType")}
                className={selectClass}
                value={kind}
                onChange={(e) => setKind(e.target.value as InteractionKind)}
              >
                {interactionKinds.map((k) => (
                  <option key={k} value={k}>
                    {getKindLabel(t, k)}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("modules.social.network")}
                className={selectClass}
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                {networks.map((n) => (
                  <option key={n} value={n}>
                    {getNetworkLabel(t, n)}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("modules.social.brand")}
                className={selectClass}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {brands.map((n) => (
                  <option key={n} value={n}>
                    {getBrandLabel(t, n)}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("modules.social.module")}
                className={selectClass}
                value={mod}
                onChange={(e) => setMod(e.target.value)}
              >
                {crmModules.map((n) => (
                  <option key={n} value={n}>
                    {getModuleLabel(t, n)}
                  </option>
                ))}
              </select>
              <input
                aria-label={t("modules.social.searchMonitor")}
                className={selectClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQuery(draft);
                }}
              />
              <Button type="button" onClick={() => setQuery(draft)}>
                {t("modules.social.search")}
              </Button>
              <Button type="button" onClick={() => setRefreshes((n) => n + 1)}>
                {t("modules.social.refresh")}
              </Button>
              <span data-testid="refresh-count" className="sr-only">
                {refreshes}
              </span>
            </div>
            <div className="mb-3">
              <Unavailable
                label={t("modules.social.addColumn")}
                message={t("modules.social.addColumnsMsg")}
              />
              <Unavailable
                label={t("modules.social.saveColumns")}
                message={t("modules.social.saveColumnsMsg")}
              />
              <Unavailable
                label={t("modules.social.removeColumn")}
                message={t("modules.social.removeColumnsMsg")}
              />
              <Unavailable
                label={t("modules.social.reorderColumns")}
                message={t("modules.social.reorderColumnsMsg")}
              />
              <Unavailable
                label={t("modules.social.addToCrm")}
                message={t("modules.social.addToCrmMsg")}
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {monitorColumns.map((c) => (
                    <th key={c} className="text-left">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={monitorColumns.length}>{t("modules.social.noInteractions")}</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.network}</td>
                      <td>{r.profile}</td>
                      <td>{r.text}</td>
                      <td>{r.brand}</td>
                      <td>{r.module}</td>
                      <td>{r.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {tab === "Post" && (
          <div>
            <Unavailable
              label={t("modules.social.composePost")}
              message={t("modules.social.composePostMsg")}
            />
            <Unavailable
              label={t("modules.social.engage")}
              message={t("modules.social.engageMsg")}
            />
          </div>
        )}
        {tab === "Activity Log" && (
          <ul>
            {(state === "populated" ? activityLog : []).map((a) => (
              <li key={a}>{a}</li>
            ))}
            {state !== "populated" && <li>{t("modules.social.noActivityRecorded")}</li>}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <Unavailable
          label={t("modules.social.brandSettings")}
          message={t("modules.social.brandSettingsMsg")}
        />
        <Unavailable
          label={t("modules.social.manageAccounts")}
          message={t("modules.social.manageAccountsMsg")}
        />
      </div>
    </section>
  );
}
