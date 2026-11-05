"use client";

import type { AssignmentRule, ReadResult, RulePage } from "@crm/core/automation";
import type { DefinitionResult } from "@crm/core/definitions";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";

const transportErrorCode = "unavailable";

const MODULE_OPTIONS = ["Leads", "Contacts", "Accounts", "Deals"] as const;

// AL5/AD7 (U12): loading comes from the shell boundary app/crm/[orgSlug]/loading.tsx;
// a failed list read is a ReadResult (not a throw), so this screen renders its own
// read-only "Try again" link that re-requests the same list URL (a fresh server read).
export function AssignmentRulesScreen({
  result,
  orgSlug = "",
  module,
  onCreate,
}: {
  result: ReadResult<RulePage>;
  onCreate?: (
    input: { module: string; name: string; description: string },
    key: string,
  ) => Promise<DefinitionResult<AssignmentRule>>;
  orgSlug?: string;
  /** Active module filter (AL3); undefined when unfiltered. */
  module?: string;
}) {
  const t = useUiTranslations();
  const display = useMetadataDisplayAdapter();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ module: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<AssignmentRule | null>(null);
  const [requestKey, setRequestKey] = useState<string | null>(null);
  async function save() {
    if (saving || !onCreate) return;
    const key = requestKey ?? crypto.randomUUID();
    setRequestKey(key);
    setSaving(true);
    setError(null);
    try {
      const response = await onCreate(draft, key);
      if (response.ok) setSaved(response.value);
      else setError(response.error.code);
    } catch {
      setError(transportErrorCode);
    } finally {
      setSaving(false);
    }
  }
  const base = `/crm/${orgSlug}/settings/assignment-rules`;
  const filterQuery = module ? `module=${encodeURIComponent(module)}&` : "";
  return (
    <section
      aria-label={t("modules.assignment.title")}
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs"
    >
      {creating && (
        <TopAlignedModal
          isOpen
          aria-labelledby="assignment-create-title"
          onOpenChange={(open) => {
            if (!open && !saving) setCreating(false);
          }}
          panelStyle={{ width: "min(600px, 95vw)" }}
        >
          <div className="p-8 space-y-5">
            <h2 id="assignment-create-title" className="text-xl font-semibold">
              {t("modules.assignment.create")}
            </h2>
            {saved ? (
              <div className="space-y-4">
                <h3 className="font-semibold">{saved.name}</h3>
                <p role="status">{t("modules.definitionWrites.assignmentPending")}</p>
                <Link
                  href={`${base}/${encodeURIComponent(saved.id)}`}
                  className="text-link hover:underline"
                >
                  {t("modules.definitionWrites.openRule")}
                </Link>
                <div>
                  <Button
                    onPress={() => {
                      setCreating(false);
                      window.location.assign(base);
                    }}
                  >
                    {t("common.actions.close")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <label className="grid grid-cols-[8rem_1fr] items-center gap-4">
                  <span>{t("modules.assignment.module")}</span>
                  <select
                    aria-label={t("modules.assignment.module")}
                    value={draft.module}
                    onChange={(event) => {
                      setDraft({ ...draft, module: event.target.value });
                      setRequestKey(null);
                    }}
                    disabled={saving}
                    required
                    className="rounded border border-control-border border-l-2 border-l-danger bg-surface p-2"
                  >
                    <option value="">{t("modules.observedFlows.selectModule")}</option>
                    {MODULE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {display.getModulePlural(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid grid-cols-[8rem_1fr] items-center gap-4">
                  <span>{t("modules.observedFlows.ruleName")}</span>
                  <input
                    className="rounded border border-control-border border-l-2 border-l-danger bg-surface p-2"
                    required
                    maxLength={255}
                    value={draft.name}
                    disabled={saving}
                    onChange={(event) => {
                      setDraft({ ...draft, name: event.target.value });
                      setRequestKey(null);
                    }}
                  />
                </label>
                <label className="grid grid-cols-[8rem_1fr] items-start gap-4">
                  <span className="pt-2">{t("modules.observedFlows.description")}</span>
                  <textarea
                    className="rounded border border-control-border bg-surface p-2"
                    rows={2}
                    maxLength={4000}
                    value={draft.description}
                    disabled={saving}
                    onChange={(event) => {
                      setDraft({ ...draft, description: event.target.value });
                      setRequestKey(null);
                    }}
                  />
                </label>
                {error && (
                  <p role="alert">
                    {t(
                      error === "conflict"
                        ? "modules.definitionWrites.conflict"
                        : error === "forbidden"
                          ? "modules.definitionWrites.forbidden"
                          : error === "validation"
                            ? "modules.definitionWrites.validation"
                            : "modules.definitionWrites.error",
                    )}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    isDisabled={saving}
                    onPress={() => setCreating(false)}
                  >
                    {t("common.actions.cancel")}
                  </Button>
                  <Button
                    isDisabled={saving || !draft.module || !draft.name.trim() || !onCreate}
                    onPress={() => void save()}
                  >
                    {t("modules.observedFlows.next")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </TopAlignedModal>
      )}
      <Tabs selectedKey="rules">
        <TabList aria-label={t("modules.assignment.settings")} className="gap-4 px-6">
          <Tab id="rules" className="py-4 text-md">
            {t("modules.assignment.rules")}
          </Tab>
          <Tab id="thresholds" laterModule="M12" className="py-4 text-md">
            {t("modules.assignment.thresholds")}
          </Tab>
          <Tab id="assistant" laterModule="M12" className="py-4 text-md">
            {t("modules.assignment.assistant")}
          </Tab>
        </TabList>
        <TabPanel id="rules" className="relative p-6">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-text">{t("modules.assignment.title")}</h2>
            <Button
              variant="icon"
              size="sm"
              aria-label={t("modules.assignment.help")}
              laterModule="M12"
            >
              <Icons.info className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("modules.assignment.contextHelp")}
            laterModule="M12"
            className="absolute top-6 right-0 rounded-r-none bg-accent-orange text-primary-text"
          >
            ?
          </Button>
          {!result.ok ? (
            <>
              <p
                role="alert"
                data-testid={`assignment-list-${result.error.code}`}
                className="text-md text-text-muted"
              >
                {result.error.code === "forbidden"
                  ? t("modules.assignment.forbidden")
                  : t("modules.assignment.error")}
              </p>
              {result.error.code !== "forbidden" ? (
                <a
                  href={`${base}${module ? `?module=${encodeURIComponent(module)}` : ""}`}
                  className="mt-2 inline-block text-md text-link hover:underline"
                >
                  {t("modules.assignment.retry")}
                </a>
              ) : null}
            </>
          ) : result.value.items.length === 0 && !module ? (
            <div data-testid="assignment-introduction">
              <p className="mb-6 text-md text-text-muted">{t("modules.assignment.description")}</p>
              <Button
                onPress={() => {
                  setDraft({ module: "", name: "", description: "" });
                  setSaved(null);
                  setRequestKey(null);
                  setError(null);
                  setCreating(true);
                }}
              >
                <Icons.plus className="mr-1 size-4" aria-hidden="true" />
                {t("modules.assignment.create")}
              </Button>
            </div>
          ) : (
            <div data-testid="assignment-rule-list">
              {onCreate && (
                <Button
                  onPress={() => {
                    setSaved(null);
                    setDraft({ module: "", name: "", description: "" });
                    setRequestKey(null);
                    setError(null);
                    setCreating(true);
                  }}
                >
                  {t("modules.assignment.create")}
                </Button>
              )}
              <form method="get" action={base} className="mb-4 flex items-center gap-2">
                <label htmlFor="assignment-module-filter" className="text-md text-text-muted">
                  {t("modules.assignment.module")}
                </label>
                <select
                  id="assignment-module-filter"
                  name="module"
                  defaultValue={module ?? ""}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-md"
                >
                  <option value="">{t("modules.assignment.allModules")}</option>
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {display.getModulePlural(m)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border border-border px-3 py-1 text-md">
                  {t("modules.assignment.apply")}
                </button>
              </form>
              {result.value.items.length === 0 ? (
                <p data-testid="assignment-no-matches" className="text-md text-text-muted">
                  {t("modules.assignment.empty")}
                </p>
              ) : (
                <table
                  aria-label={t("modules.assignment.table")}
                  className="w-full text-left text-md"
                >
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th scope="col" className="py-2 pr-4">
                        {t("modules.assignment.order")}
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        {t("modules.assignment.name")}
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        {t("modules.assignment.module")}
                      </th>
                      <th scope="col" className="py-2">
                        {t("modules.assignment.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.items.map((rule) => (
                      <tr key={rule.id} className="border-b border-border">
                        <td className="py-2 pr-4">{rule.position}</td>
                        <td className="py-2 pr-4">
                          <Link
                            href={`${base}/${encodeURIComponent(rule.id)}`}
                            className="text-link hover:underline"
                          >
                            {rule.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{display.getModulePlural(rule.module)}</td>
                        <td className="py-2">
                          {rule.enabled
                            ? t("modules.assignment.active")
                            : t("modules.assignment.inactive")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {result.value.nextCursor ? (
                <Link
                  href={`${base}?${filterQuery}cursor=${encodeURIComponent(result.value.nextCursor)}`}
                  className="mt-4 inline-block text-md text-link hover:underline"
                >
                  {t("modules.assignment.nextPage")}
                </Link>
              ) : null}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </section>
  );
}
