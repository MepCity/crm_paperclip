"use client";

import { ArrowDown, Search, X } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { type MessageKey, SAFE_ERROR } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import { type SetupCategory, type SetupLinkItem, setupCategories } from "./setup-data";

function getCategoryTitle(cat: SetupCategory, t: ReturnType<typeof useUiTranslations>): string {
  try {
    const val = t(`modules.setup.categories.${cat.id}` as MessageKey);
    if (val && val !== SAFE_ERROR) return val;
  } catch {}
  return cat.title;
}

function getItemLabel(item: SetupLinkItem, t: ReturnType<typeof useUiTranslations>): string {
  try {
    const val = t(`modules.setup.items.${item.id}` as MessageKey);
    if (val && val !== SAFE_ERROR) return val;
  } catch {}
  return item.label;
}

export function SetupScreen({
  orgSlug,
  categories = setupCategories,
}: {
  orgSlug: string;
  categories?: readonly SetupCategory[];
}) {
  const t = useUiTranslations();
  const [query, setQuery] = useState("");
  const searchId = useId();

  const categoryTitle = useCallback((cat: SetupCategory) => getCategoryTitle(cat, t), [t]);
  const itemLabel = useCallback((item: SetupLinkItem) => getItemLabel(item, t), [t]);

  const filteredCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return categories;

    return categories
      .map((cat) => {
        const title = categoryTitle(cat);
        const titleMatches =
          title.toLowerCase().includes(trimmed) || cat.title.toLowerCase().includes(trimmed);
        if (titleMatches) {
          return cat;
        }

        const matchingItems = cat.items.filter((item) => {
          const label = itemLabel(item);
          const labelMatches =
            label.toLowerCase().includes(trimmed) || item.label.toLowerCase().includes(trimmed);
          const aliasMatches = item.aliases?.some((a) => a.toLowerCase().includes(trimmed));
          return labelMatches || aliasMatches;
        });

        if (matchingItems.length > 0) {
          return {
            ...cat,
            items: matchingItems,
          };
        }
        return null;
      })
      .filter((cat): cat is SetupCategory => cat !== null);
  }, [categories, query, categoryTitle, itemLabel]);

  function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      {/* Subheader: Setup Title, Search Input, and Customize Setup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {t("modules.setup.setup")}
          </h1>
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              placeholder={t("modules.setup.searchSetup")}
              aria-label={t("modules.setup.searchSetup")}
              data-zcqa="setup_search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-text placeholder:text-text-muted shadow-xs transition-colors focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("modules.setup.clearSearch")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="secondary"
            size="sm"
            data-zcqa="setup_edit"
            isDisabled
            className="h-9 rounded-lg border-border bg-surface px-4 text-sm font-semibold text-text shadow-xs hover:bg-surface-hover"
          >
            {t("modules.setup.customizeSetup")}
          </Button>
        </div>
      </div>

      {/* Category Cards Navigation Grid */}
      <nav aria-label={t("modules.setup.navigation")}>
        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-surface p-12 text-center text-text-muted shadow-xs">
            <p className="text-base">{t("modules.setup.noSettings", { query })}</p>
            <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="mt-3">
              {t("modules.setup.clearSearchBtn")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredCategories.map((category) => (
              <SetupCard
                key={category.id}
                category={category}
                title={categoryTitle(category)}
                getItemLabel={itemLabel}
                orgSlug={orgSlug}
                t={t}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Floating scroll to bottom button */}
      <button
        type="button"
        onClick={scrollToBottom}
        aria-label={t("modules.setup.scrollToBottom")}
        className="fixed bottom-12 right-8 z-20 flex size-10 items-center justify-center rounded-full border border-border/80 bg-surface text-text shadow-md transition-transform hover:scale-105 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-blue"
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}

function SetupCard({
  category,
  title,
  getItemLabel,
  orgSlug,
  t,
}: {
  category: SetupCategory;
  title: string;
  getItemLabel: (item: SetupLinkItem) => string;
  orgSlug: string;
  t: ReturnType<typeof useUiTranslations>;
}) {
  const Icon = category.icon;

  return (
    <section
      aria-label={title}
      className="flex flex-col rounded-xl border border-border/80 bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm"
    >
      <h2 className="mb-3.5 flex items-center gap-2.5 text-[15px] font-bold leading-tight text-text">
        <Icon className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        <span>{title}</span>
      </h2>
      <ul className="flex flex-1 flex-col space-y-2 text-[13.5px]">
        {category.items.map((item) => (
          <SetupItemRow
            key={item.id}
            item={item}
            label={getItemLabel(item)}
            orgSlug={orgSlug}
            t={t}
          />
        ))}
      </ul>
    </section>
  );
}

function SetupItemRow({
  item,
  label,
  orgSlug,
  t,
}: {
  item: SetupLinkItem;
  label: string;
  orgSlug: string;
  t: ReturnType<typeof useUiTranslations>;
}) {
  const newBadge = t("modules.setup.newBadge");
  const notConfigured = t("modules.setup.notConfigured");

  if (item.href && !item.disabled) {
    return (
      <li>
        <Link
          href={item.href(orgSlug)}
          className="block leading-snug text-text transition-colors hover:text-accent-blue hover:underline"
        >
          {label}
          {item.badge === "sparkles" && (
            <span
              className="ml-1 inline-flex text-xs text-amber-500"
              role="img"
              aria-label={newBadge}
            >
              ✨
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-center leading-snug text-text/75">
      <span className="cursor-default select-none" title={notConfigured}>
        {label}
      </span>
      {item.badge === "sparkles" && (
        <span className="ml-1 inline-flex text-xs text-amber-500" role="img" aria-label={newBadge}>
          ✨
        </span>
      )}
    </li>
  );
}
