"use client";

import Link from "next/link";
import { useState } from "react";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  type ActivityRow,
  type ActivityType,
  activityFields,
  activityRows,
  filterActivities,
  fixtureNow,
  fixtureTimeZone,
  type HomePeriod,
  homePeriods,
} from "./activities";
import {
  dealStages,
  dealsCardFields,
  dealsCardSource,
  emptyCopy,
  type HomeView,
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
  t,
}: {
  title: string;
  source: string;
  fields: readonly string[];
  children: React.ReactNode;
  t: ReturnType<typeof useUiTranslations>;
}) {
  return (
    <section aria-label={title} className="rounded-md border border-border bg-surface p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-text-muted">{t("modules.home.sourceLabel", { source })}</p>
      <p className="text-xs text-text-muted">
        {t("modules.home.fieldsLabel", { fields: fields.join(", ") })}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const activityTypes: ActivityType[] = ["Tasks", "Meetings", "Calls"];

/** HD13 Open Activities card. Empty copy is a local proposal; loading/error are not modelled (fixtures). */
function OpenActivities({ orgSlug, empty }: { orgSlug: string; empty: boolean }) {
  const t = useUiTranslations();
  const [period, setPeriod] = useState<HomePeriod>("today");
  const { overdue, inPeriod } = filterActivities(
    empty ? [] : activityRows,
    period,
    new Date(fixtureNow),
    fixtureTimeZone,
  );
  const renderGroup = (label: string, rows: ActivityRow[]) =>
    rows.length === 0 ? null : (
      <div key={label} data-testid={`activities-${label.toLowerCase()}`}>
        <h4 className="mt-3 text-sm font-semibold">
          {label === "Overdue" ? t("modules.home.overdue") : t("modules.home.upcoming")}
        </h4>
        {activityTypes.map((type) => {
          const typed = rows.filter((r) => r.type === type);
          if (typed.length === 0) return null;
          return (
            <table
              key={type}
              className="mt-2 w-full text-left text-sm"
              aria-label={`${label} ${type}`}
            >
              <thead>
                <tr>
                  {activityFields[type].map((f) => (
                    <th key={f} className="pb-1 font-semibold text-text-muted">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typed.map((r) => (
                  <tr key={r.id}>
                    {r.cells.map((c, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed cell order per type
                      <td key={i} className="py-1">
                        {i === (type === "Tasks" ? 1 : 0) ? (
                          <Link
                            href={`/crm/${orgSlug}/tab/${type}/${r.id}`}
                            className="text-accent hover:underline"
                          >
                            {c}
                          </Link>
                        ) : (
                          c
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    );
  return (
    <section
      aria-label={t("modules.home.openActivities")}
      className="rounded-md border border-border bg-surface p-5 md:col-span-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t("modules.home.openActivities")}</h3>
        <select
          aria-label={t("modules.home.activityPeriod")}
          value={period}
          onChange={(e) => setPeriod(e.target.value as HomePeriod)}
          className="h-8 rounded-md border border-border bg-surface px-2 text-sm"
        >
          {homePeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-text-muted">{t("modules.home.openActivitiesSource")}</p>
      {overdue.length + inPeriod.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted" data-testid="activities-empty">
          {emptyCopy}
        </p>
      ) : (
        <>
          {renderGroup("Overdue", overdue)}
          {renderGroup("Upcoming", inPeriod)}
        </>
      )}
    </section>
  );
}

export function HomePreviewCards({ empty, orgSlug }: { empty: boolean; orgSlug: string }) {
  const t = useUiTranslations();
  const total = dealStages.reduce((sum, s) => sum + s.count, 0);
  return (
    <div
      className="mx-auto grid max-w-6xl gap-6 px-8 py-6 md:grid-cols-2"
      data-testid="home-preview"
    >
      <Card
        title={t("modules.home.openTasks")}
        source={taskCardSource}
        fields={taskCardFields}
        t={t}
      >
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
      <OpenActivities orgSlug={orgSlug} empty={empty} />
      <Card
        title={t("modules.home.pipelineDeals")}
        source={dealsCardSource}
        fields={dealsCardFields}
        t={t}
      >
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
              {t("modules.home.totalDeals", { count: total })}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export function HomeContent({
  orgSlug,
  userName,
  initialView,
}: {
  orgSlug: string;
  userName: string;
  initialView: HomeView;
}) {
  return initialView === "onboarding" ? (
    <HomeOnboarding orgSlug={orgSlug} userName={userName} />
  ) : (
    <HomePreviewCards empty={initialView === "preview-empty"} orgSlug={orgSlug} />
  );
}
