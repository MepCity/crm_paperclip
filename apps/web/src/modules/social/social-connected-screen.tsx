"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  activityLog,
  brands,
  crmModules,
  type InteractionKind,
  interactionKinds,
  monitorColumns,
  monitorRows,
  networks,
  type SocialState,
  type SocialTab,
  socialTabs,
} from "./fixture";

const selectClass = "h-8 rounded border border-control-border bg-surface px-2 text-sm";

function Unavailable({ id, label }: { id: string; label: string }) {
  return (
    <Button
      aria-disabled="true"
      aria-describedby={id}
      className="mr-2"
      onClick={(e) => e.preventDefault()}
    >
      {label}
    </Button>
  );
}

export function SocialConnectedScreen({
  state,
}: {
  state: "connected-empty" | "populated" | "permission-denied";
}) {
  const [tab, setTab] = useState<SocialTab>("Dashboard");
  const [kind, setKind] = useState<InteractionKind>("Conversation");
  const [network, setNetwork] = useState<string>(networks[0]);
  const [brand, setBrand] = useState<string>(brands[0]);
  const [mod, setMod] = useState<string>(crmModules[0]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [refreshes, setRefreshes] = useState(0);

  if (state === ("permission-denied" satisfies SocialState)) {
    return (
      <section
        aria-label="Social access"
        data-integration-state="permission-denied"
        className="p-6 text-text"
      >
        <p role="alert">You do not have permission to use the Social tab.</p>
      </section>
    );
  }

  const source = state === "populated" ? monitorRows : [];
  const q = query.trim().toLowerCase();
  const rows = source.filter(
    (r) =>
      r.kind === kind &&
      (network === networks[0] || r.network === network) &&
      (brand === brands[0] || r.brand === brand) &&
      (mod === crmModules[0] || r.module === mod) &&
      (!q || r.text.toLowerCase().includes(q) || r.profile.toLowerCase().includes(q)),
  );

  return (
    <section aria-label="Social" data-integration-state={state} className="p-4 text-text">
      <p id="social-unavailable" className="mb-3 text-sm text-text-muted">
        Posting, engaging, Add to CRM, column changes and brand settings are not available in this
        build.
      </p>
      <div role="tablist" aria-label="Social sections" className="mb-4 flex gap-2">
        {socialTabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm ${tab === t ? "border-b-2 border-primary" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === "Dashboard" && (
          <p>
            {state === "populated"
              ? `${monitorRows.length} interactions in the fixture.`
              : "No social activity yet."}
          </p>
        )}
        {tab === "Monitor" && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                aria-label="Interaction type"
                className={selectClass}
                value={kind}
                onChange={(e) => setKind(e.target.value as InteractionKind)}
              >
                {interactionKinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <select
                aria-label="Network"
                className={selectClass}
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                {networks.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <select
                aria-label="Brand"
                className={selectClass}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {brands.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <select
                aria-label="Module"
                className={selectClass}
                value={mod}
                onChange={(e) => setMod(e.target.value)}
              >
                {crmModules.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <input
                aria-label="Search monitor"
                className={selectClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQuery(draft);
                }}
              />
              <Button type="button" onClick={() => setQuery(draft)}>
                Search
              </Button>
              <Button type="button" onClick={() => setRefreshes((n) => n + 1)}>
                Refresh
              </Button>
              <span data-testid="refresh-count" className="sr-only">
                {refreshes}
              </span>
            </div>
            <div className="mb-3">
              <Unavailable id="social-unavailable" label="Add column" />
              <Unavailable id="social-unavailable" label="Save columns" />
              <Unavailable id="social-unavailable" label="Remove column" />
              <Unavailable id="social-unavailable" label="Reorder columns" />
              <Unavailable id="social-unavailable" label="Add to CRM" />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {monitorColumns.map((c) => (
                    <th key={c} className="text-left">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={monitorColumns.length}>No interactions found.</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.network}</td>
                      <td>{r.profile}</td>
                      <td>{r.text}</td>
                      <td>{r.brand}</td>
                      <td>{r.module}</td>
                      <td>{r.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {tab === "Post" && (
          <div>
            <Unavailable id="social-unavailable" label="Compose post" />
            <Unavailable id="social-unavailable" label="Engage" />
          </div>
        )}
        {tab === "Activity Log" && (
          <ul>
            {(state === "populated" ? activityLog : []).map((a) => (
              <li key={a}>{a}</li>
            ))}
            {state !== "populated" && <li>No activity recorded.</li>}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <Unavailable id="social-unavailable" label="Brand settings" />
        <Unavailable id="social-unavailable" label="Manage accounts" />
      </div>
    </section>
  );
}
