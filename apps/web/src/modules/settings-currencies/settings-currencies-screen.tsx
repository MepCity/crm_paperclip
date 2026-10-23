"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fixtureCurrenciesPort } from "./fixture-port";
import type { CurrenciesPort, HomeCurrencyProposal } from "./port";

const COMPANY_TABS = [
  "Company Details",
  "Fiscal Year",
  "Domain Mapping",
  "Business hours",
  "Holidays",
  "Currencies",
  "Hierarchy Preference",
];

export function SettingsCurrenciesScreen({
  port = fixtureCurrenciesPort,
}: {
  port?: CurrenciesPort;
}) {
  const [currency, setCurrency] = useState<HomeCurrencyProposal | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    port
      .getHomeCurrency()
      .then((res) => {
        if (live) setCurrency(res);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [port]);

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs" data-settings-currencies>
      <div role="tablist" className="flex gap-8 border-b border-border px-6">
        {COMPANY_TABS.map((t) => {
          const isActive = t === "Currencies";
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isActive ? undefined : "true"}
              disabled={!isActive}
              className={`py-4 text-md ${
                isActive ? "border-b-2 border-primary font-semibold text-text" : "text-text-muted"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Currencies</h2>
          <button
            type="button"
            data-zcqa="currHelpDoc"
            aria-label="Currencies Help"
            disabled
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-blue opacity-80"
          >
            <HelpCircle className="size-4" aria-hidden="true" />
            <span>Help</span>
          </button>
        </div>

        <aside
          id="cr_content"
          data-zcqa="currFeatureInfo"
          className="mb-8 max-w-4xl text-sm leading-relaxed text-text-muted"
        >
          This page helps you to define the currency preferences used by your organization. Home
          currency is the primary transactional currency of your organization. Multiple currencies
          allow you to handle financial operation across several regions.
        </aside>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-border p-12 text-center text-sm text-text-muted"
          >
            Currency settings could not be loaded.
          </div>
        ) : currency === null ? (
          <div
            role="status"
            className="rounded-lg border border-border p-12 text-center text-sm text-text-muted"
          >
            Loading currency settings…
          </div>
        ) : (
          <div
            data-testid="home-currency-panel"
            className="rounded-lg border border-border bg-surface-muted/30 p-10 text-center"
          >
            <p className="mx-auto max-w-2xl text-md leading-relaxed text-text">
              Do you want to set{" "}
              <strong className="font-semibold text-text">{currency.displayName}</strong> as your
              home currency? Once you confirm your home currency, you cannot change it later.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                data-zcqa="hcChangeBtn"
                disabled
                className="cursor-not-allowed rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text opacity-60"
              >
                Change Home Currency
              </button>
              <button
                type="button"
                data-zcqa="hcConfirmBtn"
                disabled
                className="cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text opacity-60"
              >
                Yes, Confirm Home Currency
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
