"use client";

import { Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Ref, useEffect, useId, useRef, useState, useTransition } from "react";
import { CellValue } from "@/components/records/list/cell-value";
import { RecordTableFooter } from "@/components/records/list/record-table-footer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import "./workqueue.css";
import { PAGE_SIZE, type QueueData, type QueueId, queueDefinitions } from "./queues";

export function Workqueue({
  orgSlug,
  user,
  queues,
  page,
}: {
  orgSlug: string;
  user: { id: string; name: string; role: string };
  queues: readonly QueueData[];
  page: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<QueueId>("tasks");
  const selectedQueueRef = useRef<HTMLButtonElement>(null);
  const [welcome, setWelcome] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const unavailableDescId = useId();
  const unavailable = (what: string) =>
    setNotice(`${what} is unavailable in this preview: no changes are made or saved.`);
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
  const columns =
    data?.columns.filter(
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
          aria-label="Select users"
          aria-describedby={unavailableDescId}
          className="border-x border-border px-4"
          onPress={() => unavailable("User selection")}
        >
          <Icons.plus aria-hidden className="size-5" />
        </Button>
      </div>
      <span id={unavailableDescId} className="sr-only">
        Action is unavailable in this preview: no changes are made or saved.
      </span>
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <aside
          aria-label="Workqueue queues"
          className="workqueue-rail w-72 shrink-0 overflow-auto rounded-md border border-panel-border bg-surface p-4"
        >
          <h2 className="mb-2 font-semibold">My Open Activity</h2>
          <Button
            variant="ghost"
            className="workqueue-period"
            aria-label="Activity period: Today & Overdue"
            aria-describedby={unavailableDescId}
            onPress={() => unavailable("Activity period selection")}
          >
            <span>Today &amp; Overdue</span>
            <Icons.chevronDown aria-hidden className="size-3" />
          </Button>
          <QueueButtons
            section="My Open Activity"
            queues={queues}
            selected={selected}
            onSelect={select}
            selectedRef={selectedQueueRef}
          />
          <h2 className="workqueue-divider mb-2 mt-5 font-semibold">My Jobs</h2>
          <Button
            variant="ghost"
            aria-describedby={unavailableDescId}
            className="workqueue-row"
            onPress={() => unavailable("Jobs")}
          >
            <QueueIcon id="blueprint" />
            <span className="workqueue-label">Blueprint</span>
            <span className="workqueue-count">0</span>
          </Button>
          <div className="workqueue-divider mt-5 flex items-center justify-between">
            <h2 className="font-semibold">My Workqueue</h2>
            <div>
              <Button
                variant="ghost"
                aria-label="Customize queue"
                aria-describedby={unavailableDescId}
                size="sm"
                onPress={() => unavailable("Queue management")}
              >
                <Icons.settings aria-hidden className="size-4" />
              </Button>
              <Button
                variant="ghost"
                aria-label="Suggested queue"
                aria-describedby={unavailableDescId}
                size="sm"
                onPress={() => unavailable("Queue creation")}
              >
                <Icons.plus aria-hidden className="size-4" />
              </Button>
            </div>
          </div>
          {["Leads", "Contacts", "Deals", "Campaigns"].map((section) => (
            <section key={section} className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{section}</h3>
                <Button
                  variant="ghost"
                  aria-label={`Add ${section} queue`}
                  aria-describedby={unavailableDescId}
                  size="sm"
                  onPress={() => unavailable("Queue creation")}
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
              />
            </section>
          ))}
        </aside>
        <section
          aria-label={`${definition.label} queue`}
          aria-busy={pending}
          className="workqueue-table flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-panel-border bg-surface"
        >
          <header className="flex items-center gap-2 border-b border-border px-5 py-4">
            <h2 className="text-xl font-semibold">{definition.label}</h2>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Refresh queue"
              isDisabled={pending}
              onPress={() => startTransition(() => router.refresh())}
            >
              <Icons.refresh aria-hidden className="size-4" />
            </Button>
            <div className="ml-auto flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Filter"
                aria-describedby={unavailableDescId}
                onPress={() => unavailable("Filter")}
              >
                <Icons.filter aria-hidden className="size-4" />
                <span className="ml-2">Filter</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Help"
                aria-describedby={unavailableDescId}
                onPress={() => unavailable("Help")}
              >
                <span aria-hidden className="px-1 font-semibold">
                  ?
                </span>
              </Button>
            </div>
          </header>
          {notice && (
            <p role="status" className="border-b border-border px-5 py-2 text-sm text-text-muted">
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
                          aria-label="Alphabet filter"
                          aria-describedby={unavailableDescId}
                          onPress={() => unavailable("Alphabet filter")}
                        >
                          All
                        </Button>
                      )}
                    </th>
                  ))}
                  <th scope="col" className="border-b-2 border-panel-border">
                    <span className="sr-only">Settings</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="View Settings"
                      aria-describedby={unavailableDescId}
                      onPress={() => unavailable("View settings")}
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
                        overdueLabel(record.fields[field.apiName]) ? (
                          <span className="text-danger">
                            {overdueLabel(record.fields[field.apiName])}
                          </span>
                        ) : (
                          <CellValue
                            field={field}
                            value={record.fields[field.apiName] ?? null}
                            href={
                              field.apiName === definition.linkField
                                ? moduleRecordPath(
                                    orgSlug,
                                    definition.module === "Events" ? "Meetings" : definition.module,
                                    record.id,
                                  )
                                : undefined
                            }
                            orgSlug={orgSlug}
                            ownerNames={{ [user.id]: user.name }}
                            format={DEFAULT_FORMAT}
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
              <p className="p-6 text-text-muted">No records found.</p>
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
            <div className="mb-3 font-semibold">My Open Activity</div>
            <div className="mb-3 rounded border border-border px-3 py-2 text-sm">
              Today &amp; Overdue
            </div>
            {["Tasks", "Meetings", "Calls"].map((label) => (
              <div key={label} className="flex items-center gap-3 border-b border-border py-3">
                <Icons.task className="size-5 text-primary" />
                {label}
              </div>
            ))}
            <div className="mt-4 font-semibold">My Workqueue</div>
          </div>
          <div className="flex-1 space-y-4 text-sm font-semibold">
            {[
              "All-in-one view",
              "Approvals waiting for you",
              "Never miss follow-ups",
              "Quick actions in records",
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
              Workqueue - Stay on top of your day
            </h2>
            <p>Welcome to Workqueue, your single place to manage all your work across CRM</p>
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
            Get Started
          </Button>
        </div>
      </TopAlignedModal>
    </div>
  );
}

function QueueButtons({
  section,
  queues,
  selected,
  onSelect,
  selectedRef,
}: {
  section: string;
  queues: readonly QueueData[];
  selected: QueueId;
  onSelect: (id: QueueId) => void;
  selectedRef?: Ref<HTMLButtonElement>;
}) {
  return queueDefinitions
    .filter((queue) => queue.section === section)
    .map((queue) => {
      const isSelected = selected === queue.id;
      const count = queues.find((data) => data.id === queue.id)?.count ?? 0;
      return (
        <Button
          key={queue.id}
          ref={isSelected ? selectedRef : undefined}
          variant="ghost"
          aria-label={`${queue.label} ${count}`}
          aria-pressed={isSelected}
          onPress={() => onSelect(queue.id)}
          className="workqueue-row"
        >
          <QueueIcon id={queue.id} />
          <span className="workqueue-label" title={queue.label}>
            {queue.label}
          </span>
          <span className="workqueue-count">{count}</span>
        </Button>
      );
    });
}

/** Calendar-day arithmetic avoids daylight-saving changes in relative lateness. */
export function overdueLabel(value: unknown, today = new Date()): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const due = Date.parse(`${value}T00:00:00Z`);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((now - due) / 86400000);
  return days > 0 ? `Late by ${days} ${days === 1 ? "day" : "days"}` : null;
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
