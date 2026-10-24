"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { CellValue } from "@/components/records/list/cell-value";
import { RecordTableFooter } from "@/components/records/list/record-table-footer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { type PreviewFilter, type PreviewSource, previewQueue } from "./fixtures";
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
  const [welcome, setWelcome] = useState(false);
  const [source, setSource] = useState<PreviewSource>("live");
  const [filter, setFilter] = useState<PreviewFilter>("today-overdue");
  const [notice, setNotice] = useState<string | null>(null);
  const unavailable = (what: string) =>
    setNotice(`${what} is unavailable in this preview: no changes are made or saved.`);
  const preview = source === "live" ? null : previewQueue(source, filter);
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
  const base = `/crm/${orgSlug}/workqueue`;
  function select(id: QueueId) {
    setSelected(id);
    if (page !== 1) startTransition(() => router.replace(base, { scroll: false }));
  }
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <div className="flex items-stretch border-b border-border bg-surface">
        <div className="flex items-center gap-3 border-b-2 border-primary px-4 py-3">
          <Icons.userRound aria-hidden className="size-9 rounded-full bg-bg p-1 text-text-muted" />
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-text-muted">{user.role}</div>
          </div>
        </div>
        <Button variant="ghost" aria-label="Select users" className="border-x border-border px-4">
          <Icons.plus aria-hidden className="size-5" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <aside
          aria-label="Workqueue queues"
          className="w-72 shrink-0 overflow-auto rounded-md border border-panel-border bg-surface p-4"
        >
          <h2 className="mb-2 font-semibold">My Open Activity</h2>
          <div className="mb-2 rounded border border-border px-2 py-1 text-sm">
            Today &amp; Overdue
          </div>
          <QueueButtons
            section="My Open Activity"
            queues={queues}
            selected={selected}
            onSelect={select}
          />
          <h2 className="mb-2 mt-5 font-semibold">My Jobs</h2>
          <Button
            variant="ghost"
            className="flex w-full justify-between px-2 py-2"
            onPress={() => unavailable("Jobs")}
          >
            Blueprint <span>0</span>
          </Button>
          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-semibold">My Workqueue</h2>
            <div>
              <Button
                variant="ghost"
                aria-label="Customize queue"
                size="sm"
                onPress={() => unavailable("Queue management")}
              >
                <Icons.settings aria-hidden className="size-4" />
              </Button>
              <Button
                variant="ghost"
                aria-label="Suggested queue"
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
              />
            </section>
          ))}
        </aside>
        <section
          aria-label={`${definition.label} queue`}
          aria-busy={pending}
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-panel-border bg-surface"
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
              ↻
            </Button>
            <div className="ml-auto flex gap-3">
              <Button variant="ghost" size="sm">
                Filter
              </Button>
              <Button variant="ghost" size="sm" aria-label="Help">
                ?
              </Button>
            </div>
          </header>
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2 text-sm">
            <span className="text-text-muted">Preview data</span>
            {(["live", "populated", "zero"] as const).map((option) => (
              <Button
                key={option}
                variant="ghost"
                size="sm"
                aria-pressed={source === option}
                onPress={() => setSource(option)}
              >
                {
                  { live: "Live", populated: "Synthetic tasks", zero: "Synthetic zero result" }[
                    option
                  ]
                }
              </Button>
            ))}
            {preview && (
              <>
                <span className="ml-3 text-text-muted">Filter</span>
                {(["today-overdue", "all-open"] as const).map((option) => (
                  <Button
                    key={option}
                    variant="ghost"
                    size="sm"
                    aria-pressed={filter === option}
                    onPress={() => setFilter(option)}
                  >
                    {option === "today-overdue" ? "Today & Overdue" : "All open"}
                  </Button>
                ))}
                <span data-testid="preview-count">{preview.count} records</span>
              </>
            )}
          </div>
          {notice && (
            <p role="status" className="border-b border-border px-5 py-2 text-sm text-text-muted">
              {notice}
            </p>
          )}
          {preview ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <table
                aria-label="Preview records"
                className="w-full border-collapse text-left text-md"
              >
                <thead>
                  <tr>
                    {["Subject", "Due Date", "Status"].map((label) => (
                      <th
                        key={label}
                        className="border-b-2 border-panel-border px-5 py-3 font-normal"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((task) => (
                    <tr key={task.id}>
                      <td className="border-b border-row-separator px-5 py-5">
                        <a
                          className="text-primary"
                          href={moduleRecordPath(orgSlug, "Tasks", task.id)}
                        >
                          {task.subject}
                        </a>
                      </td>
                      <td className="border-b border-row-separator px-5 py-5">{task.dueDate}</td>
                      <td className="border-b border-row-separator px-5 py-5">{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length === 0 && (
                <p className="p-6 text-text-muted">
                  No records in this synthetic queue (provisional empty state).
                </p>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table
                aria-label="Queue records"
                className="w-full border-collapse text-left text-md"
              >
                <thead>
                  <tr>
                    {data?.columns.map((field) => (
                      <th
                        key={field.apiName}
                        className="whitespace-nowrap border-b-2 border-panel-border px-5 py-3 font-normal"
                      >
                        {field.label}
                        {field.apiName === definition.linkField && (
                          <Button variant="ghost" size="sm" aria-label="Alphabet filter">
                            All
                          </Button>
                        )}
                      </th>
                    ))}
                    <th className="border-b-2 border-panel-border">
                      <Button variant="ghost" size="sm" aria-label="View Settings">
                        <Icons.settings aria-hidden className="size-4" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.result.records.map((record) => (
                    <tr key={record.id}>
                      {data.columns.map((field) => (
                        <td
                          key={field.apiName}
                          className="min-w-40 border-b border-row-separator px-5 py-5 align-top"
                        >
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
          )}
          {data && !preview && (
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
            onPress={() => {
              try {
                sessionStorage.setItem(sessionKey, "dismissed");
              } catch {
                /* Dismissal still works when session storage is unavailable. */
              }
              setWelcome(false);
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
}: {
  section: string;
  queues: readonly QueueData[];
  selected: QueueId;
  onSelect: (id: QueueId) => void;
}) {
  return queueDefinitions
    .filter((queue) => queue.section === section)
    .map((queue) => (
      <Button
        key={queue.id}
        variant="ghost"
        aria-label={`${queue.label} ${queues.find((data) => data.id === queue.id)?.count ?? 0}`}
        aria-pressed={selected === queue.id}
        onPress={() => onSelect(queue.id)}
        className={`mt-1 flex w-full justify-between gap-2 rounded px-2 py-2 text-left text-sm ${selected === queue.id ? "bg-primary-subtle text-primary" : ""}`}
      >
        <span className="min-w-0 whitespace-normal">{queue.label}</span>
        <span className="shrink-0 rounded-full border border-border px-2 text-xs">
          {queues.find((data) => data.id === queue.id)?.count ?? 0}
        </span>
      </Button>
    ));
}
