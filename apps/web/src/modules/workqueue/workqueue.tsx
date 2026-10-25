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
import { moduleRecordPath } from "@/lib/crm-paths";
import { useFormat } from "@/lib/format-context";
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
  const t = useUiTranslations();
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
          aria-label={t("modules.workqueue.selectUsers")}
          aria-describedby={unavailableDescId}
          className="border-x border-border px-4"
          onPress={() => unavailable(t("modules.workqueue.userSelection"))}
        >
          <Icons.plus aria-hidden className="size-5" />
        </Button>
      </div>
      <span id={unavailableDescId} className="sr-only">
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
              aria-label="Activity period: Today & Overdue"
            >
              <span>Today &amp; Overdue</span>
              <Icons.chevronDown aria-hidden className="size-3" />
            </Button>
            <Menu
              aria-label="Activity period"
              selectionMode="single"
              selectedKeys={["Today & Overdue"]}
            >
              {[
                "Today & Overdue",
                "Today",
                "Tomorrow",
                "Overdue",
                "This Week",
                "Next Week",
                "This Month",
                "Next Month",
                "On a Specific Date",
              ].map((period) => (
                <MenuItem key={period} id={period} textValue={period}>
                  <span className="flex items-center gap-2">
                    {period === "Today & Overdue" && <Icons.check className="size-4" aria-hidden />}
                    <span>{period}</span>
                    {period === "On a Specific Date" && (
                      <Icons.chevronRight className="ml-auto size-3" aria-hidden />
                    )}
                  </span>
                </MenuItem>
              ))}
            </Menu>
          </MenuTrigger>
