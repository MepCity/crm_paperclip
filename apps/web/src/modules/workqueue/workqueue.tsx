"use client";

import { Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Ref, useEffect, useId, useRef, useState, useTransition } from "react";
import { CellValue } from "@/components/records/list/cell-value";
import { RecordTableFooter } from "@/components/records/list/record-table-footer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import type { MessageKey, MessageValues } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import { moduleRecordPath } from "@/lib/crm-paths";
import { useFormat } from "@/lib/format-context";
import "./workqueue.css";
import { PAGE_SIZE, type QueueData, type QueueId, queueDefinitions } from "./queues";

export function Workqueue({
  accessDenied = false,
  orgSlug,
  user,
  queues,
  page,
}: {
  accessDenied?: boolean;
  orgSlug: string;
  user: { id: string; name: string; role: string };
  queues: readonly QueueData[];
  page: number;
}) {
  const t = useUiTranslations();
  const display = useMetadataDisplayAdapter();
  const orgFormat = useFormat();
  const router = useRouter();
  const [selected, setSelected] = useState<QueueId>("tasks");
  const selectedQueueRef = useRef<HTMLButtonElement>(null);
  const [welcome, setWelcome] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const unavailableDescId = useId();
  const unavailable = (what: string) =>
    setNotice(t("modules.workqueue.unavailableNotice", { what }));
  const [pending, startTransition] = useTransition();
  const welcomeTitleId = useId();
  const sessionKey = `workqueue-welcome:${orgSlug}:${user.id}`;
  useEffect(() => {
    try {
      setWelcome(sessionStorage.getItem(sessionKey) !== "dismissed");
    } catch {
      setWelcome(true);
    }
  }, [sessionKey]);
  const definition = queueDefinitions.find((queue) => queue.id === selected) ?? queueDefinitions[0];
  const data = queues.find((queue) => queue.id === selected);
  const valueKeys = {
    "Not Started": "modules.workqueue.values.notStarted",
    Deferred: "modules.workqueue.values.deferred",
    "In Progress": "modules.workqueue.values.inProgress",
    Completed: "modules.workqueue.values.completed",
    "Waiting for input": "modules.workqueue.values.waitingForInput",
    High: "modules.workqueue.values.high",
    Highest: "modules.workqueue.values.highest",
    Normal: "modules.workqueue.values.normal",
    Low: "modules.workqueue.values.low",
    Lowest: "modules.workqueue.values.lowest",
  } as const;
  const columns =
    data?.columns
      .map((field) => {
        const adapted = display.adaptField(definition.module, field);
        if (definition.module !== "Tasks" || !["Status", "Priority"].includes(field.apiName))
          return adapted;
        return {
          ...adapted,
          picklist: field.picklist?.map((option) => ({
            ...option,
            displayValue:
              option.storedValue === "Waiting on someone else" &&
              option.displayValue === "Waiting for input"
                ? t("modules.workqueue.values.waitingForInput")
                : option.displayValue === option.storedValue && option.storedValue in valueKeys
                  ? t(valueKeys[option.storedValue as keyof typeof valueKeys])
                  : option.displayValue,
          })),
        };
      })
      .filter(
        (field) =>
          selected !== "tasks" ||
          ["Subject", "Due_Date", "Status", "Priority"].includes(field.apiName),
      ) ?? [];
  const base = `/crm/${orgSlug}/workqueue`;
  function select(id: QueueId) {
    setSelected(id);
    if (page !== 1) startTransition(() => router.replace(base, { scroll: false }));
  }
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <div className="flex items-stretch border-b border-border bg-surface">
        <div className="workqueue-user-panel flex items-center gap-3 border-b-2 border-primary px-4 py-3">
          <Icons.userRound aria-hidden className="size-9 rounded-full bg-bg p-1 text-text-muted" />
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-text-muted">{user.role}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          aria-label={t("modules.workqueue.selectUsers")}
          aria-describedby={unavailableDescId}
          className="border-x border-border px-4"
          onPress={() => unavailable(t("modules.workqueue.userSelection"))}
        >
          <Icons.plus aria-hidden className="size-5" />
        </Button>
      </div>
      <span id={unavailableDescId} hidden>
        {t("modules.workqueue.unavailableSrOnly")}
      </span>
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <aside
          aria-label={t("modules.workqueue.workqueue")}
          className="workqueue-rail w-72 shrink-0 overflow-auto rounded-md border border-panel-border bg-surface p-4"
        >
          <h2 className="mb-2 font-semibold">{t("modules.workqueue.myOpenActivity")}</h2>
          <MenuTrigger>
            <Button
              variant="ghost"
              className="workqueue-period"
              aria-label={t("modules.workqueue.activityPeriodLabel", {
                period: t("modules.workqueue.todayOverdue"),
              })}
            >
              <span>{t("modules.workqueue.todayOverdue")}</span>
              <Icons.chevronDown aria-hidden className="size-3" />
            </Button>
            <Menu
              aria-label={t("modules.home.activityPeriod")}
              selectionMode="single"
              selectedKeys={["Today & Overdue"]}
            >
              {[
                { id: "Today & Overdue", label: t("modules.workqueue.todayOverdue") },
                { id: "Today", label: t("modules.workqueue.periods.today") },
                { id: "Tomorrow", label: t("modules.workqueue.periods.tomorrow") },
                { id: "Overdue", label: t("modules.workqueue.periods.overdue") },
                { id: "This Week", label: t("modules.workqueue.periods.thisWeek") },
                { id: "Next Week", label: t("modules.workqueue.periods.nextWeek") },
                { id: "This Month", label: t("modules.workqueue.periods.thisMonth") },
                { id: "Next Month", label: t("modules.workqueue.periods.nextMonth") },
                { id: "On a Specific Date", label: t("modules.workqueue.periods.specificDate") },
              ].map((period) => (
                <MenuItem key={period.id} id={period.id} textValue={period.label}>
                  <span className="flex items-center gap-2">
                    {period.id === "Today & Overdue" && (
                      <Icons.check className="size-4" aria-hidden />
                    )}
                    <span>{period.label}</span>
                    {period.id === "On a Specific Date" && (
                      <Icons.chevronRight className="ml-auto size-3" aria-hidden />
                    )}
                  </span>
                </MenuItem>
              ))}
            </Menu>
          </MenuTrigger>
          <QueueButtons
            section="My Open Activity"
            queues={queues}
            selected={selected}
            onSelect={select}
            selectedRef={selectedQueueRef}
            t={t}
          />
          <h2 className="workqueue-divider mb-2 mt-5 font-semibold">
            {t("modules.workqueue.myJobs")}
          </h2>
          <Button
            variant="ghost"
            aria-describedby={unavailableDescId}
            className="workqueue-row"
            onPress={() => unavailable(t("modules.workqueue.jobs"))}
          >
            <QueueIcon id="blueprint" />
            <span className="workqueue-label">{t("modules.workqueue.blueprint")}</span>
            <span className="workqueue-count">0</span>
          </Button>
          <div className="workqueue-divider mt-5 flex items-center justify-between">
            <h2 className="font-semibold">{t("modules.workqueue.myWorkqueue")}</h2>
            <div>
              <Button
                variant="ghost"
                aria-label={t("modules.workqueue.customizeQueue")}
                aria-describedby={unavailableDescId}
                size="sm"
                onPress={() => unavailable(t("modules.workqueue.queueManagement"))}
              >
                <Icons.settings aria-hidden className="size-4" />
              </Button>
              <Button
                variant="ghost"
                aria-label={t("modules.workqueue.suggestedQueue")}
                aria-describedby={unavailableDescId}
                size="sm"
                onPress={() => unavailable(t("modules.workqueue.queueCreation"))}
              >
                <Icons.plus aria-hidden className="size-4" />
              </Button>
            </div>
          </div>
          {(["Leads", "Contacts", "Deals", "Campaigns"] as const).map((section) => {
            const sectionLabel =
              section === "Leads"
                ? t("shell.leads")
                : section === "Contacts"
                  ? t("shell.contacts")
                  : section === "Deals"
                    ? t("shell.deals")
                    : t("shell.campaigns");
            return (
              <section key={section} className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{sectionLabel}</h3>
                  <Button
                    variant="ghost"
                    aria-label={t("modules.workqueue.addSectionQueue", { section: sectionLabel })}
                    aria-describedby={unavailableDescId}
                    size="sm"
                    onPress={() => unavailable(t("modules.workqueue.queueCreation"))}
                  >
                    <Icons.plus aria-hidden className="size-4" />
                  </Button>
                </div>
                <QueueButtons
                  section={section}
                  queues={queues}
                  selected={selected}
                  onSelect={select}
                  selectedRef={selectedQueueRef}
                  t={t}
                />
              </section>
            );
          })}
        </aside>
        <section
          aria-label={t("modules.workqueue.queueRegion", {
            queue: getQueueLabel(definition.id, t),
          })}
          aria-busy={pending}
          className="workqueue-table flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-panel-border bg-surface"
        >
          {accessDenied ? (
            <div
              role="alert"
              className="flex flex-1 flex-col items-center justify-center bg-bg p-12 text-center"
            >
              <Icons.warning aria-hidden className="mb-8 size-28 text-accent-orange" />
              <h2 className="max-w-2xl text-xl font-semibold">
                {t("modules.workqueue.permissionTitle")}
              </h2>
              <p className="mt-5 max-w-2xl text-text-muted">
                {t("modules.workqueue.permissionDescription")}
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b border-border px-5 py-4">
                <h2 className="text-xl font-semibold">{getQueueLabel(definition.id, t)}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("modules.workqueue.refreshQueue")}
                  isDisabled={pending}
                  onPress={() => startTransition(() => router.refresh())}
                >
                  <Icons.refresh aria-hidden className="size-4" />
                </Button>
                <div className="ml-auto flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("modules.workqueue.filter")}
                    aria-describedby={unavailableDescId}
                    onPress={() => unavailable(t("modules.workqueue.filter"))}
                  >
                    <Icons.filter aria-hidden className="size-4" />
                    <span className="ml-2">{t("modules.workqueue.filter")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("modules.workqueue.help")}
                    aria-describedby={unavailableDescId}
                    onPress={() => unavailable(t("modules.workqueue.help"))}
                  >
                    <span aria-hidden className="px-1 font-semibold">
                      ?
                    </span>
                  </Button>
                </div>
              </header>
              {notice && (
                <p
                  role="status"
                  className="border-b border-border px-5 py-2 text-sm text-text-muted"
                >
                  {notice}
                </p>
              )}
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full border-collapse text-left text-md">
                  <thead>
                    <tr>
                      {columns.map((field) => (
                        <th
                          key={field.apiName}
                          scope="col"
                          className="whitespace-nowrap border-b-2 border-panel-border px-5 py-3 font-normal"
                        >
                          {field.label}
                          {field.apiName === definition.linkField && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t("modules.workqueue.alphabetFilter")}
                              aria-describedby={unavailableDescId}
                              onPress={() => unavailable(t("modules.workqueue.alphabetFilter"))}
                            >
                              {t("modules.workqueue.all")}
                            </Button>
                          )}
                        </th>
                      ))}
                      <th scope="col" className="border-b-2 border-panel-border">
                        <span className="sr-only">{t("modules.workqueue.settings")}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t("modules.workqueue.viewSettings")}
                          aria-describedby={unavailableDescId}
                          onPress={() => unavailable(t("modules.workqueue.viewSettings"))}
                        >
                          <Icons.settingsSliders aria-hidden className="size-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.result.records.map((record) => (
                      <tr key={record.id}>
                        {columns.map((field) => (
                          <td
                            key={field.apiName}
                            className="min-w-40 border-b border-row-separator px-5 py-2 align-top"
                          >
                            {selected === "tasks" &&
                            field.apiName === "Due_Date" &&
                            overdueLabel(record.fields[field.apiName], undefined, t) ? (
                              <span className="text-danger">
                                {overdueLabel(record.fields[field.apiName], undefined, t)}
                              </span>
                            ) : (
                              <CellValue
                                field={field}
                                value={record.fields[field.apiName] ?? null}
                                href={
                                  field.apiName === definition.linkField
                                    ? moduleRecordPath(
                                        orgSlug,
                                        definition.module === "Events"
                                          ? "Meetings"
                                          : definition.module,
                                        record.id,
                                      )
                                    : undefined
                                }
                                orgSlug={orgSlug}
                                ownerNames={{ [user.id]: user.name }}
                                format={orgFormat}
                              />
                            )}
                          </td>
                        ))}
                        <td className="border-b border-row-separator" />
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data?.result.records.length === 0 && (
                  <p className="p-6 text-text-muted">{t("common.empty")}</p>
                )}
              </div>
              {data && (
                <RecordTableFooter
                  total={data.count}
                  page={page}
                  pageSize={PAGE_SIZE}
                  recordCount={data.result.records.length}
                  moreRecords={data.result.moreRecords}
                  previousHref={page > 1 ? `${base}?page=${page - 1}` : null}
                  nextHref={data.result.moreRecords ? `${base}?page=${page + 1}` : null}
                />
              )}
            </>
          )}
        </section>
      </div>
      <TopAlignedModal
        isOpen={welcome}
        aria-labelledby={welcomeTitleId}
        panelClassName="!top-1/2 !w-full max-w-3xl -translate-y-1/2 max-h-full overflow-auto !rounded-xl"
      >
        <div className="flex h-80 items-center gap-8 overflow-hidden bg-linear-to-br from-primary-subtle to-bg p-8">
          <div
            aria-hidden="true"
            className="flex-1 -rotate-12 rounded-lg border border-panel-border bg-surface p-5 shadow-lg"
          >
            <div className="mb-3 font-semibold">{t("modules.workqueue.myOpenActivity")}</div>
            <div className="mb-3 rounded border border-border px-3 py-2 text-sm">
              {t("modules.workqueue.todayOverdue")}
            </div>
            {[
              { id: "tasks", label: t("modules.workqueue.tasks") },
              { id: "meetings", label: t("modules.workqueue.meetings") },
              { id: "calls", label: t("modules.workqueue.calls") },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center gap-3 border-b border-border py-3">
                <Icons.task className="size-5 text-primary" />
                {label}
              </div>
            ))}
            <div className="mt-4 font-semibold">{t("modules.workqueue.myWorkqueue")}</div>
          </div>
          <div className="flex-1 space-y-4 text-sm font-semibold">
            {[
              t("modules.workqueue.allInOne"),
              t("modules.workqueue.approvalsWaiting"),
              t("modules.workqueue.neverMiss"),
              t("modules.workqueue.quickActions"),
            ].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-panel-border bg-surface p-4 shadow-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-8 p-8">
          <div>
            <h2 id={welcomeTitleId} className="mb-3 text-xl font-semibold">
              {t("modules.workqueue.welcomeTitle")}
            </h2>
            <p>{t("modules.workqueue.welcomeDesc")}</p>
          </div>
          <Button
            autoFocus
            onPress={() => {
              try {
                sessionStorage.setItem(sessionKey, "dismissed");
              } catch {
                /* Dismissal still works when session storage is unavailable. */
              }
              setWelcome(false);
              setTimeout(() => {
                selectedQueueRef.current?.focus();
              }, 0);
            }}
          >
            {t("modules.workqueue.getStarted")}
          </Button>
        </div>
      </TopAlignedModal>
    </div>
  );
}

function getQueueLabel(
  id: string,
  t?: (key: MessageKey, values?: MessageValues) => string,
): string {
  if (!t) {
    const found = queueDefinitions.find((q) => q.id === id);
    return found?.label ?? id;
  }
  switch (id) {
    case "tasks":
      return t("modules.workqueue.tasks");
    case "meetings":
      return t("modules.workqueue.meetings");
    case "calls":
      return t("modules.workqueue.calls");
    case "leads":
      return t("modules.workqueue.myLeads");
    case "recent-leads":
      return t("modules.workqueue.recentLeads");
    case "contacts":
      return t("modules.workqueue.myContacts");
    case "recent-contacts":
      return t("modules.workqueue.recentContacts");
    case "deals":
      return t("modules.workqueue.myDeals");
    case "closing-deals":
      return t("modules.workqueue.closingDeals");
    case "campaigns":
      return t("modules.workqueue.myCampaigns");
    default:
      return id;
  }
}

function QueueButtons({
  section,
  queues,
  selected,
  onSelect,
  selectedRef,
  t,
}: {
  section: string;
  queues: readonly QueueData[];
  selected: QueueId;
  onSelect: (id: QueueId) => void;
  selectedRef?: Ref<HTMLButtonElement>;
  t?: (key: MessageKey, values?: MessageValues) => string;
}) {
  return queueDefinitions
    .filter((queue) => queue.section === section)
    .map((queue) => {
      const isSelected = selected === queue.id;
      const count = queues.find((data) => data.id === queue.id)?.count ?? 0;
      const label = t ? getQueueLabel(queue.id, t) : queue.label;
      return (
        <Button
          key={queue.id}
          ref={isSelected ? selectedRef : undefined}
          variant="ghost"
          aria-label={`${label} ${count}`}
          aria-pressed={isSelected}
          onPress={() => onSelect(queue.id)}
          className="workqueue-row"
        >
          <QueueIcon id={queue.id} />
          <span className="workqueue-label" title={label}>
            {label}
          </span>
          <span className="workqueue-count">{count}</span>
        </Button>
      );
    });
}

/** Calendar-day arithmetic avoids daylight-saving changes in relative lateness. */
export function overdueLabel(
  value: unknown,
  today = new Date(),
  t?: (key: MessageKey, values?: MessageValues) => string,
): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const due = Date.parse(`${value}T00:00:00Z`);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((now - due) / 86400000);
  if (days <= 0) return null;
  if (t) return t("modules.workqueue.lateByDays", { count: days });
  return `Late by ${days} ${days === 1 ? "day" : "days"}`;
}

function QueueIcon({ id }: { id: QueueId | "blueprint" }) {
  const [Glyph, color] =
    id === "tasks"
      ? ([Icons.checkSquare, "#ee9b9b"] as const)
      : id === "meetings"
        ? ([Icons.calendar, "#c392cf"] as const)
        : id === "calls"
          ? ([Icons.phone, "#91c9df"] as const)
          : id === "blueprint"
            ? ([Workflow, "#91c9df"] as const)
            : id.includes("leads")
              ? ([Icons.target, "#edc774"] as const)
              : id.includes("contacts")
                ? ([Icons.bookUser, "#8dd1c1"] as const)
                : id.includes("deals")
                  ? ([Icons.wallet, "#efa3ae"] as const)
                  : ([Icons.megaphone, "#c392cf"] as const);
  return <Glyph aria-hidden strokeWidth={1.5} className="workqueue-icon" style={{ fill: color }} />;
}
