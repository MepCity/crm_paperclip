"use client";

import type { SearchQuery } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DOCUMENTED_MODULE_FILTER_ITEMS } from "@/components/records/search/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { SearchLayer } from "@/components/ui/search-layer";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { useGlobalSearch } from "@/lib/api/client/hooks";
import { ApiProvider, type ClientRecordService } from "@/lib/api/client/provider";
import { formatModuleSearchSecondaryLine } from "@/modules/global-search-format";
import {
  moduleScreens,
  resolveModuleLaterKey,
  resolveModuleScreenByApiName,
} from "@/modules/registry";
import {
  readSearchHistory,
  rememberSearchRecord,
  type SearchHistoryEntry,
  searchHistoryKey,
} from "./search-history";

export function GlobalSearch({
  orgSlug,
  userId,
  service,
}: {
  orgSlug: string;
  userId: string;
  service?: ClientRecordService;
}) {
  return (
    <ApiProvider orgSlug={orgSlug} service={service}>
      <SearchControl orgSlug={orgSlug} userId={userId} />
    </ApiProvider>
  );
}

function SearchControl({ orgSlug, userId }: { orgSlug: string; userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<string | null>(null);
  const [debounced, setDebounced] = useState("");
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const key = searchHistoryKey(orgSlug, userId);
  const nameSearch = query.startsWith("#");
  const text = (nameSearch ? query.slice(1) : query).trim();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const searchQuery: SearchQuery = {
    text,
    scope: nameSearch ? "nameOrTags" : "all",
    modules: module ? [module] : undefined,
    perPage: 5,
  };
  const results = useGlobalSearch(searchQuery, open && text.length >= 3 && query === debounced);
  const ready = text.length >= 3 && query === debounced;
  const params = new URLSearchParams({ q: query });
  if (module) params.set("module", module);
  const advancedHref = `/crm/${orgSlug}/search?${params}`;
  function visit(entry: SearchHistoryEntry) {
    setHistory(rememberSearchRecord(key, entry));
    setOpen(false);
  }
  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(next) => {
        if (next) {
          setQuery("");
          setDebounced("");
          setModule(null);
          setHistory(readSearchHistory(key));
        }
        setOpen(next);
      }}
    >
      <Button
        variant="icon"
        size="compact"
        aria-label="Search records"
        className="h-(--size-topbar-control-pitch) w-(--size-topbar-control-pitch) justify-center! gap-2 bg-primary/10! px-0! sm:w-56 sm:justify-start! sm:px-3!"
      >
        <Icons.filterSearch className="size-(--size-topbar-icon)" aria-hidden />
        <span className="hidden sm:inline">Search records</span>
      </Button>
      <SearchLayer>
        <div className="p-2">
          <div className="flex items-center rounded-md border border-control-border focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring">
            <ModuleChooser value={module} onChange={setModule} />
            <div className="min-w-0 flex-1 p-2">
              <TextField
                label="Search records"
                hideLabel
                variant="search"
                autoFocus
                placeholder="Press # for specific search"
                value={query}
                onChange={setQuery}
                prefix={
                  nameSearch ? (
                    <span className="shrink-0 rounded-sm bg-primary/10 px-2 text-sm">
                      #Record Name
                    </span>
                  ) : (
                    <Icons.filterSearch className="size-4 shrink-0" aria-hidden />
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setOpen(false);
                    router.push(advancedHref);
                  } else {
                    event.continuePropagation();
                  }
                }}
              />
            </div>
          </div>
        </div>
        {!text && history.length > 0 && (
          <section aria-label="Search History">
            <h2 className="px-4 py-3 text-md font-semibold">Search History</h2>
            {history.map((entry) => {
              const screen = resolveModuleScreenByApiName(entry.module);
              return (
                <Link
                  key={`${entry.module}:${entry.id}`}
                  href={`/crm/${orgSlug}/tab/${screen?.tab ?? entry.module}/${entry.id}`}
                  variant="body"
                  laterModule={screen ? undefined : resolveModuleLaterKey(entry.module)}
                  onPress={() => visit(entry)}
                  className="flex gap-2 border-b border-border px-4 py-3 data-hovered:bg-surface-hover"
                >
                  {entry.name}{" "}
                  <span className="text-text-muted">{screen?.pluralLabel ?? entry.module}</span>
                </Link>
              );
            })}
          </section>
        )}
        {open && text.length >= 3 && (!ready || results.isFetching) && (
          <div className="p-4">
            <Spinner className="size-5" />
          </div>
        )}
        {ready && results.isError && (
          <Alert variant="danger">The page could not be loaded. Please try again.</Alert>
        )}
        {ready && results.isSuccess && (
          <>
            {results.data.length === 0 && <p className="p-4 text-text-muted">No records found.</p>}
            {results.data.map((group) => {
              const screen = resolveModuleScreenByApiName(group.module);
              return (
                <section key={group.module} aria-label={screen?.pluralLabel ?? group.module}>
                  <h2 className="flex items-center gap-3 px-4 py-4 text-md font-semibold">
                    {screen && (
                      <span className="rounded-full bg-primary/10 p-2">
                        <screen.navigation.icon className="size-5" aria-hidden />
                      </span>
                    )}
                    {screen?.pluralLabel ?? group.module}
                  </h2>
                  {group.records.slice(0, 5).map((record) => {
                    const name = screen?.detail.header(record).title ?? record.id;
                    const secondary = screen
                      ? formatModuleSearchSecondaryLine(record, screen)
                      : null;
                    const entry = { module: group.module, id: record.id, name };
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 border-y border-border px-4 py-2 hover:bg-surface-hover"
                      >
                        <Link
                          variant="body"
                          href={`/crm/${orgSlug}/tab/${screen?.tab ?? group.module}/${record.id}`}
                          laterModule={screen ? undefined : resolveModuleLaterKey(group.module)}
                          onPress={() => visit(entry)}
                          className="min-w-0 flex-1"
                        >
                          <span className="block">{name}</span>
                          {secondary && (
                            <span className="block text-sm text-text-muted">{secondary}</span>
                          )}
                        </Link>
                        <Button
                          variant="icon"
                          size="compact"
                          className="size-8 rounded-full! bg-primary! text-primary-text!"
                          aria-label={`Email ${name}`}
                          laterModule="M10"
                        >
                          <Icons.envelope className="size-5" aria-hidden />
                        </Button>
                        <Button
                          variant="icon"
                          size="compact"
                          className="size-8 rounded-full! border border-primary text-primary!"
                          aria-label={`Call ${name}`}
                          laterModule="M5"
                        >
                          <Icons.phone className="size-5" aria-hidden />
                        </Button>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </>
        )}
        {text && (
          <div className="border-t border-border p-4">
            <Link id="global-search-advanced" href={advancedHref} onPress={() => setOpen(false)}>
              View advanced search
            </Link>
          </div>
        )}
        {text && (
          <div className="flex gap-4 px-4 pb-4">
            <Link href="#" laterModule="P3">
              Search with assistant
            </Link>
            <Link href="#" laterModule="P3">
              Search across applications
            </Link>
          </div>
        )}
      </SearchLayer>
    </DialogTrigger>
  );
}

function ModuleChooser({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (module: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const entries = [
    { apiName: "", pluralLabel: "All Modules" },
    ...moduleScreens,
    ...DOCUMENTED_MODULE_FILTER_ITEMS.filter((item) => !item.isRegistered).map((item) => ({
      apiName: item.moduleApiName,
      pluralLabel: item.label,
    })),
  ];
  return (
    <PopoverTrigger
      isOpen={open}
      onOpenChange={(next) => {
        setQuery("");
        setOpen(next);
      }}
    >
      <Button
        variant="ghost"
        className="shrink-0 border-r border-border"
        aria-label="Search module"
      >
        {entries.find((entry) => entry.apiName === (value ?? ""))?.pluralLabel}
        <Icons.chevronDown className="ml-2 size-4" aria-hidden />
      </Button>
      <Popover
        title="Search Modules"
        hideTitle
        placement="bottom start"
        className="w-56"
        contentClassName="p-2"
      >
        <TextField
          label="Search Modules"
          hideLabel
          autoFocus
          value={query}
          onChange={setQuery}
          placeholder="Search Modules"
        />
        <div className="mt-2 max-h-48 overflow-auto">
          {entries
            .filter((entry) => entry.pluralLabel.toLowerCase().includes(query.toLowerCase()))
            .map((entry) => (
              <Button
                key={entry.apiName}
                variant="ghost"
                className="flex w-full justify-start"
                laterModule={
                  entry.apiName && !resolveModuleScreenByApiName(entry.apiName)
                    ? resolveModuleLaterKey(entry.apiName)
                    : undefined
                }
                onPress={() => {
                  onChange(entry.apiName || null);
                  setOpen(false);
                }}
              >
                <span className="mr-2 inline-block w-4">
                  {(value ?? "") === entry.apiName && (
                    <Icons.check className="size-4" aria-hidden />
                  )}
                </span>
                {entry.pluralLabel}
              </Button>
            ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
