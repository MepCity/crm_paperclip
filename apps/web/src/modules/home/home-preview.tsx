"use client";

import { useState } from "react";
import {
  dealStages,
  dealsCardFields,
  dealsCardSource,
  emptyCopy,
  type HomeView,
  pageOptions,
  taskCardFields,
  taskCardSource,
  taskRows,
} from "./fixture";
import { HomeOnboarding } from "./home-onboarding";

function Card({
  title,
  source,
  fields,
  children,
}: {
  title: string;
  source: string;
  fields: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-md border border-border bg-surface p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-text-muted">Source: {source}</p>
      <p className="text-xs text-text-muted">Fields: {fields.join(", ")}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HomePreviewCards({ empty }: { empty: boolean }) {
  const total = dealStages.reduce((sum, s) => sum + s.count, 0);
  return (
    <div
      className="mx-auto grid max-w-6xl gap-6 px-8 py-6 md:grid-cols-2"
      data-testid="home-preview"
    >
      <Card title="Open Tasks" source={taskCardSource} fields={taskCardFields}>
        {empty ? (
          <p className="text-sm text-text-muted">{emptyCopy}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {taskCardFields.map((f) => (
                  <th key={f} className="pb-2 font-semibold text-text-muted">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskRows.map((r) => (
                <tr key={r.id}>
                  <td className="py-1">{r.subject}</td>
                  <td>{r.dueDate}</td>
                  <td>{r.status}</td>
                  <td>{r.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title="Pipeline Deals by Stage" source={dealsCardSource} fields={dealsCardFields}>
        {empty ? (
          <p className="text-sm text-text-muted">{emptyCopy}</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {dealsCardFields.map((f) => (
                    <th key={f} className="pb-2 font-semibold text-text-muted">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dealStages.map((s) => (
                  <tr key={s.stage}>
                    <td className="py-1">{s.stage}</td>
                    <td>{s.count}</td>
                    <td>{s.amount.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm" data-testid="deals-total">
              Total deals: {total}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

/** HD01: local-only page selector. No persistence, no request; not the account's real page list. */
export function HomeContent({
  orgSlug,
  userName,
  initialView,
}: {
  orgSlug: string;
  userName: string;
  initialView: HomeView;
}) {
  const [view, setView] = useState<HomeView>(initialView);
  const selected = view === "onboarding" ? "onboarding" : "preview";
  return (
    <>
      <div className="mx-auto flex max-w-6xl justify-end px-8 pt-4">
        <select
          aria-label="Home page"
          value={selected}
          onChange={(e) => setView(e.target.value === "preview" ? "preview" : "onboarding")}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
        >
          {pageOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {view === "onboarding" ? (
        <HomeOnboarding orgSlug={orgSlug} userName={userName} />
      ) : (
        <HomePreviewCards empty={view === "preview-empty"} />
      )}
    </>
  );
}
