"use client";

import { ArrowDown, Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { type SetupCategory, type SetupLinkItem, setupCategories } from "./setup-data";

export function SetupScreen({
  orgSlug,
  categories = setupCategories,
}: {
  orgSlug: string;
  categories?: readonly SetupCategory[];
}) {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const filteredCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return categories;

    return categories
      .map((cat) => {
        const titleMatches = cat.title.toLowerCase().includes(trimmed);
        if (titleMatches) {
          return cat;
        }

        const matchingItems = cat.items.filter((item) => {
          const labelMatches = item.label.toLowerCase().includes(trimmed);
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
  }, [categories, query]);

  function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      {/* Subheader: Setup Title, Search Input, and Customize Setup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-text">Setup</h1>
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              placeholder="Search Setup"
              aria-label="Search Setup"
              data-zcqa="setup_search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-text placeholder:text-text-muted shadow-xs transition-colors focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
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
            Customize Setup
          </Button>
        </div>
      </div>

      {/* Category Cards Navigation Grid */}
      <nav aria-label="Settings navigation">
        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-surface p-12 text-center text-text-muted shadow-xs">
            <p className="text-base">No settings found for &ldquo;{query}&rdquo;</p>
            <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="mt-3">
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredCategories.map((category) => (
              <SetupCard key={category.id} category={category} orgSlug={orgSlug} />
            ))}
          </div>
        )}
      </nav>

      {/* Floating scroll to bottom button */}
      <button
        type="button"
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        className="fixed bottom-12 right-8 z-20 flex size-10 items-center justify-center rounded-full border border-border/80 bg-surface text-text shadow-md transition-transform hover:scale-105 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-blue"
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}

function SetupCard({ category, orgSlug }: { category: SetupCategory; orgSlug: string }) {
  const Icon = category.icon;

  return (
    <section
      aria-label={category.title}
      className="flex flex-col rounded-xl border border-border/80 bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm"
    >
      <h2 className="mb-3.5 flex items-center gap-2.5 text-[15px] font-bold leading-tight text-text">
        <Icon className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        <span>{category.title}</span>
      </h2>
      <ul className="flex flex-1 flex-col space-y-2 text-[13.5px]">
        {category.items.map((item) => (
          <SetupItemRow key={item.id} item={item} orgSlug={orgSlug} />
        ))}
      </ul>
    </section>
  );
}

function SetupItemRow({ item, orgSlug }: { item: SetupLinkItem; orgSlug: string }) {
  if (item.href && !item.disabled) {
    return (
      <li>
        <Link
          href={item.href(orgSlug)}
          aria-label={item.ariaLabel ?? item.label}
          className="block leading-snug text-text transition-colors hover:text-accent-blue hover:underline"
        >
          {item.label}
          {item.badge === "sparkles" && (
            <span className="ml-1 inline-flex text-xs text-amber-500" role="img" aria-label="New">
              ✨
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-center leading-snug text-text/75">
      <span className="cursor-default select-none" title="Not configured">
        {item.label}
      </span>
      {item.badge === "sparkles" && (
        <span className="ml-1 inline-flex text-xs text-amber-500" role="img" aria-label="New">
          ✨
        </span>
      )}
    </li>
  );
}
