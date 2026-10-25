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

export function VisitsEnabledScreen({
  orgSlug,
  availability,
}: {
  orgSlug: string;
  availability: Exclude<VisitsAvailability, "disconnected">;
}) {
  const [accountId, setAccountId] = useState<string>(trackingAccounts[0].id);
  const [view, setView] = useState<VisitViewId>("all");
  const rows = availability === "enabled-empty" ? [] : visitsFor(accountId, view);
  return (
    <section
      aria-label="Visits"
      data-integration-state={availability}
      className="min-h-full bg-bg px-6 py-6 text-text"
    >
      <h2 className="text-2xl font-semibold">Visits</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-md">
          Tracking account
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
          View
          <select
            className={selectClass}
            value={view}
            onChange={(e) => setView(e.target.value as VisitViewId)}
          >
            {visitViews.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <ActionButton
          label="Manage Columns"
          message="Contact your administrator to configure column preferences."
        />
      </div>
      <div className="mt-6">
        {availability === "enabled-empty" ? (
          <div role="status" className="py-10 text-center">
            <p className="text-md">No visits yet.</p>
            <div className="mt-3 flex justify-center">
              <ActionButton
                label="Send to Webmaster"
                message="Contact your administrator to send tracking instructions to your webmaster."
              />
            </div>
          </div>
        ) : rows === "ranking-unavailable" ? (
          <p role="status" className="py-10 text-center text-md text-text-muted">
            Ranking criteria not available
          </p>
        ) : rows.length === 0 ? (
          <p role="status" className="py-10 text-center text-md text-text-muted">
            No visits in this view.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {listColumns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
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
  const visit: Visit | undefined = findVisit(visitId);
  const back = `/crm/${encodeURIComponent(orgSlug)}/tab/Visits?state=populated`;
  if (!visit) {
    return (
      <section aria-label="Visit detail" className="px-6 py-6 text-text">
        <p role="alert">Visit not found.</p>
        <Link href={back} className="text-primary hover:underline">
          Back to Visits
        </Link>
      </section>
    );
  }
  return (
    <section aria-label="Visit detail" className="min-h-full bg-bg px-6 py-6 text-text">
      <Link href={back} className="text-md text-primary hover:underline">
        Back to Visits
      </Link>
      <h2 className="mt-2 text-2xl font-semibold">{visit.visitedBy}</h2>
      <dl className="mt-4 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-2">
        {detailFields.map((f) => (
          <div key={f.key} className="flex flex-col">
            <dt className="text-sm text-text-muted">{f.label}</dt>
            <dd className="text-md">{String(visit[f.key])}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-8 text-xl font-semibold">Actions Performed</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action Type</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead>Time Spent</TableHead>
            <TableHead>Action Performed Time</TableHead>
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
          label="Add Note"
          message="Contact your administrator to configure notes for visitor tracking."
        />
        <ActionButton
          label="Attach File"
          message="Contact your administrator to configure attachments for visitor tracking."
        />
      </div>
    </section>
  );
}
