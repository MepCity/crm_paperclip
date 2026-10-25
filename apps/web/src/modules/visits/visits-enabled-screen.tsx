"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import type { MessageKey, MessageValues } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  detailFields,
  findVisit,
  listColumns,
  trackingAccounts,
  type Visit,
  type VisitsAvailability,
  type VisitViewId,
  visitsFor,
  visitViews,
} from "./fixture";

const selectClass = "rounded border border-border bg-surface px-2 py-1 text-md text-text";

function ActionButton({ label, message }: { label: string; message: string }) {
  return (
    <Button
      variant="secondary"
      size="compact"
      aria-disabled="true"
      onPress={() => {
        toast({
          variant: "info",
          title: message,
        });
      }}
    >
      {label}
    </Button>
  );
}

function getViewLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  id: VisitViewId,
  fallback: string,
): string {
  switch (id) {
    case "all":
      return t("modules.visits.allVisits");
    case "today":
      return t("modules.visits.todaysVisits");
    case "top":
      return t("modules.visits.topVisits");
    case "today-top":
      return t("modules.visits.todaysTopVisits");
    case "leads":
      return t("modules.visits.visitsByLeads");
    case "contacts":
      return t("modules.visits.visitsByContacts");
    default:
      return fallback;
  }
}

function getFieldLabel(
  t: (key: MessageKey, values?: MessageValues) => string,
  key: keyof Visit,
  fallback: string,
): string {
  const messageKey = `modules.visits.${key}` as MessageKey;
  const text = t(messageKey);
  return text.startsWith("modules.visits.") ? fallback : text;
}

export function VisitsEnabledScreen({
  orgSlug,
  availability,
}: {
  orgSlug: string;
  availability: Exclude<VisitsAvailability, "disconnected">;
}) {
  const t = useUiTranslations();
  const [accountId, setAccountId] = useState<string>(trackingAccounts[0].id);
  const [view, setView] = useState<VisitViewId>("all");
  const rows = availability === "enabled-empty" ? [] : visitsFor(accountId, view);
  return (
    <section
      aria-label={t("modules.visits.visits")}
      data-integration-state={availability}
      className="min-h-full bg-bg px-6 py-6 text-text"
    >
      <h2 className="text-2xl font-semibold">{t("modules.visits.visits")}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-md">
          {t("modules.visits.trackingAccount")}
          <select
            className={selectClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {trackingAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-md">
          {t("modules.visits.view")}
          <select
            className={selectClass}
            value={view}
            onChange={(e) => setView(e.target.value as VisitViewId)}
          >
            {visitViews.map((v) => (
              <option key={v.id} value={v.id}>
                {getViewLabel(t, v.id, v.label)}
              </option>
            ))}
          </select>
        </label>
        <ActionButton
          label={t("modules.visits.manageColumns")}
          message={t("modules.visits.manageColumnsMsg")}
        />
      </div>
      <div className="mt-6">
        {availability === "enabled-empty" ? (
          <div role="status" className="py-10 text-center">
            <p className="text-md">{t("modules.visits.noVisitsYet")}</p>
            <div className="mt-3 flex justify-center">
              <ActionButton
                label={t("modules.visits.sendToWebmaster")}
                message={t("modules.visits.sendToWebmasterMsg")}
              />
            </div>
          </div>
        ) : rows === "ranking-unavailable" ? (
          <p role="status" className="py-10 text-center text-md text-text-muted">
            {t("modules.visits.rankingUnavailable")}
          </p>
        ) : rows.length === 0 ? (
          <p role="status" className="py-10 text-center text-md text-text-muted">
            {t("modules.visits.noVisitsInView")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {listColumns.map((c) => (
                  <TableHead key={c.key}>{getFieldLabel(t, c.key, c.label)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((visit) => (
                <TableRow key={visit.id}>
                  {listColumns.map((c, i) => (
                    <TableCell key={c.key}>
                      {i === 0 ? (
                        <Link
                          href={`/crm/${encodeURIComponent(orgSlug)}/tab/Visits/${visit.id}`}
                          className="text-primary hover:underline"
                        >
                          {String(visit[c.key])}
                        </Link>
                      ) : (
                        String(visit[c.key])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

export function VisitDetailScreen({ orgSlug, visitId }: { orgSlug: string; visitId: string }) {
  const t = useUiTranslations();
  const visit: Visit | undefined = findVisit(visitId);
  const back = `/crm/${encodeURIComponent(orgSlug)}/tab/Visits?state=populated`;
  if (!visit) {
    return (
      <section aria-label="Visit detail" className="px-6 py-6 text-text">
        <p role="alert">{t("modules.visits.visitNotFound")}</p>
        <Link href={back} className="text-primary hover:underline">
          {t("modules.visits.backToVisits")}
        </Link>
      </section>
    );
  }
  return (
    <section aria-label="Visit detail" className="min-h-full bg-bg px-6 py-6 text-text">
      <Link href={back} className="text-md text-primary hover:underline">
        {t("modules.visits.backToVisits")}
      </Link>
      <h2 className="mt-2 text-2xl font-semibold">{visit.visitedBy}</h2>
      <dl className="mt-4 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-2">
        {detailFields.map((f) => (
          <div key={f.key} className="flex flex-col">
            <dt className="text-sm text-text-muted">{getFieldLabel(t, f.key, f.label)}</dt>
            <dd className="text-md">{String(visit[f.key])}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-8 text-xl font-semibold">{t("modules.visits.actionsPerformed")}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("modules.visits.actionType")}</TableHead>
            <TableHead>{t("modules.visits.actions")}</TableHead>
            <TableHead>{t("modules.visits.timeSpentHeader")}</TableHead>
            <TableHead>{t("modules.visits.actionPerformedTime")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visit.actions.map((a) => (
            <TableRow key={a.performedTime}>
              <TableCell>{a.type}</TableCell>
              <TableCell>{a.action}</TableCell>
              <TableCell>{a.timeSpent}</TableCell>
              <TableCell>{a.performedTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-6 flex flex-col gap-2">
        <ActionButton
          label={t("modules.visits.addNote")}
          message={t("modules.visits.addNoteMsg")}
        />
        <ActionButton
          label={t("modules.visits.attachFile")}
          message={t("modules.visits.attachFileMsg")}
        />
      </div>
    </section>
  );
}
