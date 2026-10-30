"use client";

import { ChevronDown, ChevronUp, Pencil, User } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useUiLanguage, useUiTranslations } from "@/i18n/client-provider";
import { useSettingsLabel } from "@/i18n/settings-labels";
import { fixturePersonalSettingsPort } from "./fixture-port";
import { LanguageEditor } from "./language-editor";
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
    <section className="px-6 py-4" aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  const copy = useSettingsLabel();
  return (
    <dl className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-4 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-right text-muted-foreground">{copy(r.label)}</dt>
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
  const copy = useSettingsLabel();
  const t = useUiTranslations();
  const language = useUiLanguage();
  const [editing, setEditing] = useState(false);
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

  if (error) return <p>{t("settings.loadError")}</p>;
  if (!data) return <p>{t("settings.loading")}</p>;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs" data-settings-personal>
      <div role="tablist" className="flex gap-8 border-b border-border px-6">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="border-b-2 border-primary py-3 text-sm font-semibold"
        >
          {t("shell.personal-settings")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          disabled
          className="py-3 text-sm text-muted-foreground"
        >
          {copy("Accessibility")}
        </button>
      </div>
      <div className="flex items-center gap-5 px-6 py-5">
        <div
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-text-muted"
        >
          <User className="size-10 text-text-muted" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{data.name}</span>
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
              {copy(data.profile)}
            </span>
            <button type="button" disabled aria-label={copy("Edit profile")}>
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
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          aria-expanded={!hidden}
          onClick={() => setHidden((h) => !h)}
        >
          {hidden ? (
            <>
              {copy("Show Details")}
              <ChevronDown className="size-4" aria-hidden="true" />
            </>
          ) : (
            <>
              {copy("Hide Details")}
              <ChevronUp className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      {hidden ? null : (
        <>
          <Section title={copy("User Information")}>
            <Rows rows={data.user} />
          </Section>
          <Section title={copy("Address Information")}>
            <Rows rows={data.address} />
          </Section>
          <Section title={copy("Audit Information")}>
            <Rows rows={data.audit} />
          </Section>
          <Section title={copy("Teamspace Information")}>
            <ul className="text-sm">
              {data.teamspaces.map((t) => (
                <li key={t}>{copy(t)}</li>
              ))}
            </ul>
          </Section>
          <Section
            title={t("settings.locale")}
            action={
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={t("settings.editLocale")}
              >
                <Pencil className="h-4 w-4" />
              </button>
            }
          >
            {editing ? (
              <LanguageEditor onClose={() => setEditing(false)} />
            ) : (
              <dl className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">
                {localeRows.map(([, key]) => (
                  <div key={key} className="contents">
                    <dt className="text-right text-muted-foreground">
                      {t(key === "language" ? "settings.language" : `settings.${key}`)}
                    </dt>
                    <dd data-locale-row={key}>
                      {key === "language" && port === fixturePersonalSettingsPort
                        ? language === "tr"
                          ? "Türkçe"
                          : "English (United States)"
                        : data.locale[key]}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>
          <Section
            title={copy("Groups")}
            action={
              <button type="button" disabled aria-label={copy("Add group")}>
                +
              </button>
            }
          >
            <p className="text-sm text-muted-foreground">
              {data.groups.length ? data.groups.join(", ") : copy("No groups")}
            </p>
          </Section>
          <Section title={copy("Display Name Format & Preferences")}>
            <div className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">
              <label htmlFor="name-format" className="text-right text-muted-foreground">
                {copy("Name Format")}
              </label>
              <select id="name-format" disabled value={data.nameFormat} onChange={() => {}}>
                <option>{data.nameFormat}</option>
              </select>
              <label htmlFor="sort-order" className="text-right text-muted-foreground">
                {copy("Sort order")}
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
