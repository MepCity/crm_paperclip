"use client";

import type { FeedFilter } from "@crm/core/feeds";
import { useRouter, useSearchParams } from "next/navigation";
import { useUiTranslations } from "@/i18n/client-provider";
import { FeedList } from "./feed-list";

const FILTERS: readonly {
  id: FeedFilter;
  labelKey: "feeds.filterAll" | "feeds.filterFollowed" | "feeds.filterMine";
  empty: "feeds.empty" | "feeds.emptyFollowed" | "feeds.emptyMine";
}[] = [
  { id: "all", labelKey: "feeds.filterAll", empty: "feeds.empty" },
  { id: "followed", labelKey: "feeds.filterFollowed", empty: "feeds.emptyFollowed" },
  { id: "mine", labelKey: "feeds.filterMine", empty: "feeds.emptyMine" },
];
const MODULES = ["Leads", "Contacts", "Accounts", "Deals"] as const;

/** Company wall. The filter lives in the URL and is never persisted (ADR 0018 §3). */
export function FeedsScreen({ orgSlug, userId }: { orgSlug: string; userId: string }) {
  const t = useUiTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("filter");
  const active = FILTERS.find((f) => f.id === raw) ?? (FILTERS[0] as (typeof FILTERS)[number]);
  const module = MODULES.find((m) => m === params.get("module")) ?? null;

  function update(next: { filter?: string; module?: string | null }) {
    const q = new URLSearchParams(params.toString());
    if (next.filter !== undefined) {
      if (next.filter === "all") q.delete("filter");
      else q.set("filter", next.filter);
    }
    if (next.module !== undefined) {
      if (next.module) q.set("module", next.module);
      else q.delete("module");
    }
    const s = q.toString();
    router.replace(s ? `?${s}` : "?");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col" data-feeds-screen>
      <h1 className="p-4 text-lg font-semibold text-text">{t("feeds.title")}</h1>
      <div className="flex items-center gap-2 border-b border-border px-4 pb-2" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === active.id}
            className={`rounded-md px-3 py-1 text-md ${f.id === active.id ? "bg-surface-hover font-semibold" : ""}`}
            onClick={() => update({ filter: f.id })}
          >
            {t(f.labelKey)}
          </button>
        ))}
        <select
          aria-label={t("feeds.allModules")}
          className="ml-auto rounded-md border border-border bg-surface p-1 text-md"
          value={module ?? ""}
          onChange={(e) => update({ module: e.target.value || null })}
        >
          <option value="">{t("feeds.allModules")}</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <FeedList
        orgSlug={orgSlug}
        userId={userId}
        scope={{ filter: active.id, module }}
        emptyKey={active.empty}
      />
    </div>
  );
}
