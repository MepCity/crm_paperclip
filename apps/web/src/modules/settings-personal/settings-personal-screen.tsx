"use client";

import { Pencil } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { fixturePersonalSettingsPort } from "./fixture-port";
import type { PersonalSettings, PersonalSettingsPort } from "./port";

const localeRows: [string, keyof PersonalSettings["locale"]][] = [
  ["Language", "language"],
  ["Country Locale", "countryLocale"],
  ["Date Format", "dateFormat"],
  ["Time Format", "timeFormat"],
  ["Time Zone", "timeZone"],
  ["Preferred Unit for Distance", "distanceUnit"],
  ["Number Format", "numberFormat"],
];

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border px-6 py-4" aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd>
            <button
              type="button"
              disabled
              aria-label={`${r.label} value`}
              className="min-h-5 text-left text-foreground disabled:cursor-default"
            >
              {r.value}
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SettingsPersonalScreen({
  user,
  port = fixturePersonalSettingsPort,
}: {
  user: { name: string; email: string };
  port?: PersonalSettingsPort;
}) {
  const [data, setData] = useState<PersonalSettings | null>(null);
  const [error, setError] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let live = true;
    port
      .getPersonalSettings(user)
      .then((d) => live && setData(d))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [port, user]);

  if (error) return <p>Personal settings could not be loaded.</p>;
  if (!data) return <p>Loading personal settings…</p>;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs" data-settings-personal>
      <div role="tablist" className="flex gap-8 border-b border-border px-6">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="border-b-2 border-primary py-3 text-sm font-semibold"
        >
          Personal Settings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          disabled
          className="py-3 text-sm text-muted-foreground"
        >
          Accessibility
        </button>
      </div>
      <div className="flex items-center gap-4 px-6 py-5">
        <div
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold"
        >
          {data.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{data.name}</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{data.profile}</span>
            <button type="button" disabled aria-label="Edit profile">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            <a href="#role">{data.role}</a> · <a href="#organization">{data.organization}</a>
          </div>
          <div className="text-sm text-muted-foreground">{data.email}</div>
        </div>
      </div>
      <div className="px-6 pb-2">
        <button
          type="button"
          className="text-sm text-primary"
          aria-expanded={!hidden}
          onClick={() => setHidden((h) => !h)}
        >
          {hidden ? "Show Details" : "Hide Details"}
        </button>
      </div>
      {hidden ? null : (
        <>
          <Section title="User Information">
            <Rows rows={data.user} />
          </Section>
          <Section title="Address Information">
            <Rows rows={data.address} />
          </Section>
          <Section title="Audit Information">
            <Rows rows={data.audit} />
          </Section>
          <Section title="Teamspace Information">
            <ul className="text-sm">
              {data.teamspaces.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Section>
          <Section
            title="Locale Information"
            action={
              <button type="button" disabled aria-label="Edit locale information">
                <Pencil className="h-4 w-4" />
              </button>
            }
          >
            <dl className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">
              {localeRows.map(([label, key]) => (
                <div key={key} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd data-locale-row={key}>{data.locale[key]}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section
            title="Groups"
            action={
              <button type="button" disabled aria-label="Add group">
                +
              </button>
            }
          >
            <p className="text-sm text-muted-foreground">
              {data.groups.length ? data.groups.join(", ") : "No groups"}
            </p>
          </Section>
          <Section title="Display Name Format & Preferences">
            <div className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">
              <label htmlFor="name-format" className="text-muted-foreground">
                Name Format
              </label>
              <select id="name-format" disabled value={data.nameFormat} onChange={() => {}}>
                <option>{data.nameFormat}</option>
              </select>
              <label htmlFor="sort-order" className="text-muted-foreground">
                Sort order
              </label>
              <select id="sort-order" disabled value={data.sortOrder} onChange={() => {}}>
                <option>{data.sortOrder}</option>
              </select>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
