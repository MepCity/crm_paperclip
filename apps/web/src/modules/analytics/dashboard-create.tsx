"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import type { EmptyDashboard } from "./port";

const gridCells = Array.from({ length: 60 }, (_, i) => `cell-${i}`);

const modules = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Meetings",
  "Calls",
  "Campaigns",
  "Cases",
  "Solutions",
  "Notes",
  "Email",
];

export function DashboardCreate({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (dashboard: EmptyDashboard) => Promise<void>;
}) {
  const t = useUiTranslations();
  const types = [
    { label: t("modules.observedFlows.chart"), icon: Icons.barChart },
    { label: t("modules.observedFlows.kpi"), icon: Icons.activity },
    { label: t("modules.observedFlows.comparator"), icon: Icons.users },
    { label: t("modules.observedFlows.anomalyDetector"), icon: Icons.sparkles },
    { label: t("modules.observedFlows.targetMeter"), icon: Icons.target },
    { label: t("modules.observedFlows.funnel"), icon: Icons.filter },
    { label: t("modules.observedFlows.cohort"), icon: Icons.calendar },
    { label: t("modules.observedFlows.quadrant"), icon: Icons.columns },
    { label: t("modules.observedFlows.zone"), icon: Icons.target },
    { label: t("modules.observedFlows.stage"), icon: Icons.columns },
    { label: t("modules.observedFlows.waterfall"), icon: Icons.barChart },
  ];

  const [name, setName] = useState(() => t("modules.analytics.untitled"));
  const [description, setDescription] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section
      aria-label={t("modules.observedFlows.createDashboard")}
      className="flex min-h-screen bg-bg"
    >
      <aside
        aria-label={t("modules.observedFlows.components")}
        className="w-64 shrink-0 border-r border-border p-5"
      >
        <h2 className="text-xl font-semibold mb-5">{t("modules.observedFlows.components")}</h2>
        <div className="space-y-2">
          {types.map((type) => (
            <Button
              key={type.label}
              variant="secondary"
              className="w-full justify-start gap-3 py-2"
              laterModule={type.label === t("modules.observedFlows.chart") ? undefined : "M13"}
              onPress={() => setSourceOpen(true)}
            >
              <type.icon className="size-5 text-text-muted" aria-hidden />
              {type.label}
            </Button>
          ))}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="flex flex-wrap items-start gap-5 border-b border-border bg-surface p-5">
          <div className="w-96 space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="icon" aria-label={t("modules.observedFlows.favoriteDashboard")}>
                <span className="text-xl" aria-hidden>
                  ☆
                </span>
              </Button>
              <div className="flex-1">
                <TextField
                  label={t("modules.observedFlows.dashboardName")}
                  hideLabel
                  value={name}
                  onChange={setName}
                  autoFocus
                />
              </div>
            </div>
            <TextField
              label={t("modules.observedFlows.dashboardDescription")}
              hideLabel
              placeholder={t("modules.observedFlows.enterDescription")}
              value={description}
              onChange={setDescription}
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded border border-border px-3 py-1">
            <Icons.userRound className="size-4" aria-hidden />
            {t("modules.observedFlows.onlyMe")}
          </span>
          <Button variant="icon" aria-label={t("modules.observedFlows.editDashboardAccess")}>
            <Icons.fieldEdit className="size-4" aria-hidden />
          </Button>
          <div className="ml-auto flex gap-3">
            <Button variant="secondary" onPress={onCancel} isDisabled={saving}>
              {t("modules.observedFlows.cancel")}
            </Button>
            <Button
              isDisabled={!name.trim() || saving}
              isPending={saving}
              onPress={async () => {
                setSaving(true);
                setError(false);
                try {
                  await onSave({
                    name: name.trim(),
                    description,
                    access: "private",
                    components: [],
                  });
                } catch {
                  setError(true);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {t("modules.observedFlows.save")}
            </Button>
          </div>
        </header>
        {error && (
          <p role="alert" className="p-4 text-danger">
            {t("modules.observedFlows.dashboardCouldNotBeSaved")}
          </p>
        )}
        <div className="relative min-h-[70vh] p-12">
          <div aria-hidden className="absolute inset-4 grid grid-cols-12 gap-3">
            {gridCells.map((cell) => (
              <div key={cell} className="min-h-24 bg-border/15" />
            ))}
          </div>
          <div className="relative max-w-lg rounded bg-surface p-12 text-center">
            <svg
              viewBox="0 0 80 80"
              className="mx-auto mb-5 size-20 text-text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="12" y="8" width="46" height="54" rx="4" />
              <path d="M43 40l23 17-12 2-5 12-6-31z" fill="currentColor" />
              <path d="M35 35l-5-5m12 1v-7m7 12 6-4" />
            </svg>
            <h2 className="text-xl">{t("modules.observedFlows.selectAComponent")}</h2>
            <p className="mt-3">
              {t("modules.observedFlows.buildYourDashboardByAddingComponents")}
            </p>
          </div>
        </div>
      </div>
      {sourceOpen && <DashboardComponentChooser onCancel={() => setSourceOpen(false)} />}
    </section>
  );
}

function QuickChart({ onCancel }: { onCancel: () => void }) {
  const t = useUiTranslations();
  const titleId = useId();
  const [module, setModule] = useState("");
  const [criteria, setCriteria] = useState(false);
  const emptyItem = (item: { id: string }) => <SelectItem id={item.id}>{item.id}</SelectItem>;
  return (
    <TopAlignedModal
      isOpen
      aria-labelledby={titleId}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      panelStyle={{ width: "min(1200px, 95vw)", maxHeight: "95dvh", overflow: "auto" }}
    >
      <div className="p-8">
        <div className="mb-6 flex justify-between">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("modules.observedFlows.addChart")}
          </h2>
          <Button variant="ghost" isDisabled>
            {t("modules.observedFlows.help")}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="grid grid-cols-[12rem_1fr] items-center gap-x-5 gap-y-4 lg:col-span-3">
            <span aria-hidden className="text-right text-text-muted">
              {t("modules.observedFlows.componentName")}
            </span>
            <TextField label={t("modules.observedFlows.componentName")} hideLabel autoFocus />
            <span aria-hidden className="text-right text-text-muted">
              {t("modules.observedFlows.modules")}
            </span>
            <Select
              label={t("modules.observedFlows.modules")}
              hideLabel
              placeholder={t("modules.observedFlows.selectModule")}
              items={modules.map((id) => ({ id }))}
              value={module || null}
              onChange={(key) => {
                setModule(String(key));
                setCriteria(false);
              }}
            >
              {emptyItem}
            </Select>
            {module && (
              <>
                <span />
                <Select
                  label={t("modules.observedFlows.relatedModule")}
                  hideLabel
                  placeholder={t("modules.observedFlows.selectRelatedModule")}
                  items={[]}
                  isDisabled
                >
                  {emptyItem}
                </Select>
              </>
            )}
            <span aria-hidden className="text-right text-text-muted">
              {t("modules.observedFlows.measureYAxis")}
            </span>
            <div className="flex items-center gap-3 [&>div]:flex-1">
              <Select
                label={t("modules.observedFlows.measureYAxis")}
                hideLabel
                placeholder={t("modules.observedFlows.selectMeasure")}
                items={module ? [{ id: `Count of ${module}` }] : []}
                value={module ? `Count of ${module}` : null}
                isDisabled
              >
                {emptyItem}
              </Select>
              <span aria-hidden className="flex gap-2">
                <span className="size-4 rounded-full border border-current text-danger" />
                <span className="size-4 rounded-full border border-current text-accent-green" />
              </span>
            </div>
            <span aria-hidden className="text-right text-text-muted">
              {t("modules.observedFlows.grouping")}
            </span>
            <div className="flex items-center gap-3 [&>div]:flex-1">
              <Select
                label={t("modules.observedFlows.grouping")}
                hideLabel
                placeholder={t("modules.observedFlows.selectGrouping")}
                items={[]}
                isDisabled
              >
                {emptyItem}
              </Select>
              <span aria-hidden className="flex gap-2">
                <span className="size-4 rounded-full border border-current text-danger" />
              </span>
            </div>
            <div className="col-span-2">
              {criteria ? (
                <section
                  aria-label={t("modules.observedFlows.criteriaFilter")}
                  className="rounded border border-border bg-bg p-5 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">{t("modules.observedFlows.criteriaFilter")}</h3>
                    <Button
                      variant="ghost"
                      className="text-danger"
                      onPress={() => setCriteria(false)}
                    >
                      {t("modules.observedFlows.remove")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-[auto_1fr_1fr_2fr_auto] items-center gap-2">
                    <span className="rounded-full border border-border p-3">1</span>
                    <Select
                      label={t("modules.observedFlows.criterionField")}
                      hideLabel
                      placeholder={t("modules.observedFlows.select")}
                      items={[]}
                      isDisabled
                    >
                      {emptyItem}
                    </Select>
                    <Select
                      label={t("modules.observedFlows.criterionOperator")}
                      hideLabel
                      placeholder={t("modules.observedFlows.select")}
                      items={[]}
                      isDisabled
                    >
                      {emptyItem}
                    </Select>
                    <TextField
                      label={t("modules.observedFlows.criterionValue")}
                      hideLabel
                      isDisabled
                    />
                    <Button
                      variant="ghost"
                      aria-label={t("modules.observedFlows.addCriterion")}
                      isDisabled
                      className="text-accent-green data-disabled:opacity-100!"
                    >
                      <Icons.plus className="size-5 rounded-full border border-current text-accent-green" />
                    </Button>
                  </div>
                </section>
              ) : (
                <Button variant="ghost" isDisabled={!module} onPress={() => setCriteria(true)}>
                  {t("modules.observedFlows.addCriteriaFilter")}
                </Button>
              )}
            </div>
            <p className="text-right text-text-muted">
              {t("modules.observedFlows.combineRelatedGroupingValuesIntoCategories")}
            </p>
            <Button variant="ghost" className="justify-start text-primary" isDisabled>
              {t("modules.observedFlows.createCategoryField")}
            </Button>
            <h3 className="col-span-2 pt-3 text-primary">
              {t("modules.observedFlows.otherOptions")}
            </h3>
            <Checkbox label={t("modules.observedFlows.displayComponentFilters")} isDisabled />
            <Select
              label={t("modules.observedFlows.filterField")}
              hideLabel
              placeholder={t("modules.observedFlows.selectField")}
              items={[]}
              isDisabled
            >
              {emptyItem}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <div className="ml-auto w-48">
              <Select
                label={t("modules.observedFlows.chartType")}
                hideLabel
                items={[{ id: "Column chart" }]}
                value="Column chart"
                isDisabled
              >
                {emptyItem}
              </Select>
            </div>
            <section
              aria-label={t("modules.observedFlows.chartPreview")}
              className="mt-4 min-h-56 rounded border border-border p-6"
            >
              {module ? (
                <>
                  <div
                    aria-hidden
                    className="flex h-36 items-end justify-center gap-8 border-b border-border"
                  >
                    <div className="h-16 w-24 bg-accent-orange" />
                    <div className="h-32 w-24 bg-accent-yellow" />
                  </div>
                  <p className="mt-4 text-center text-text-muted">
                    {t("modules.observedFlows.recordCount")}
                  </p>
                </>
              ) : (
                <p className="py-12 text-center text-text-muted">
                  {t("modules.observedFlows.selectAModuleToDisplayAVisualPreview")}
                </p>
              )}
            </section>
          </div>
        </div>
        <footer className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onPress={onCancel}>
            {t("modules.observedFlows.cancel")}
          </Button>
          <Button isDisabled>{t("modules.observedFlows.done")}</Button>
        </footer>
      </div>
    </TopAlignedModal>
  );
}

export function DashboardComponentChooser({ onCancel }: { onCancel: () => void }) {
  const t = useUiTranslations();
  const sourceTitle = useId();
  const [chartOpen, setChartOpen] = useState(false);
  return (
    <>
      <TopAlignedModal
        isOpen={!chartOpen}
        onOpenChange={(open) => {
          if (!open) onCancel();
        }}
        aria-labelledby={sourceTitle}
        panelStyle={{ width: "min(600px, 95vw)" }}
      >
        <div className="p-8 space-y-6">
          <header className="flex justify-between items-center">
            <h2 id={sourceTitle} className="text-xl font-semibold">
              {t("modules.observedFlows.addChart")}
            </h2>
            <Button variant="icon" aria-label={t("common.actions.close")} onPress={onCancel}>
              <Icons.close className="size-5" />
            </Button>
          </header>
          <div className="grid grid-cols-2 gap-6">
            <Button
              aria-label={t("modules.observedFlows.quickChart")}
              variant="secondary"
              onPress={() => setChartOpen(true)}
              className="h-44 flex-col gap-2 whitespace-normal"
            >
              <Icons.barChart className="size-10 text-text-muted" aria-hidden />
              <strong>{t("modules.observedFlows.quickChart")}</strong>
              <span className="font-normal">{t("modules.analytics.quickDescription")}</span>
            </Button>
            <Button
              aria-label={t("modules.observedFlows.fromReports")}
              variant="secondary"
              isDisabled
              className="h-44 flex-col gap-2 whitespace-normal"
            >
              <Icons.file className="size-10 text-text-muted" aria-hidden />
              <strong>{t("modules.observedFlows.fromReports")}</strong>
              <span className="font-normal">{t("modules.analytics.reportDescription")}</span>
            </Button>
          </div>
        </div>
      </TopAlignedModal>
      {chartOpen && <QuickChart onCancel={onCancel} />}
    </>
  );
}
