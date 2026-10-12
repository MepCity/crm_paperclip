"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { TextField } from "@/components/ui/text-field";
import { type CreateRecordEntry, createRecordsNav } from "./nav";
import "./create-records.css";

/** Interim: case-insensitive substring on the label. No search term was observed in the reference. */
function matchesEntry(entry: CreateRecordEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === "" || entry.label.toLowerCase().includes(needle);
}

export function CreateRecordsMenu({
  orgSlug,
  entries = createRecordsNav,
}: {
  orgSlug: string;
  entries?: readonly CreateRecordEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLDivElement | null>(null);
  const visible = entries.filter((entry) => matchesEntry(entry, query));
  useEffect(() => {
    if (!open) return;
    // The reference opens with the search box focused. React Aria focuses the dialog itself
    // in the same commit, so the box is focused after that settles.
    const frame = requestAnimationFrame(() => search.current?.querySelector("input")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <PopoverTrigger
      isOpen={open}
      onOpenChange={(next) => {
        // Reopening starts from the unfiltered list, like a freshly opened menu.
        if (next) setQuery("");
        setOpen(next);
      }}
    >
      <Button
        variant="icon"
        size="compact"
        aria-label="Create Records"
        className="create-records-trigger size-(--size-topbar-quick-create) shrink-0"
      >
        <Icons.plus className="size-(--size-topbar-icon)" aria-hidden />
      </Button>
      <Popover
        title="Create Records"
        placement="bottom end"
        offset={0}
        className="create-records-panel w-(--size-create-menu-width) h-(--size-create-menu-height)"
        contentClassName="create-records-content"
      >
        <div className="create-records-search" ref={search}>
          <TextField
            label="Search"
            placeholder="Search"
            variant="filter-search"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="create-records-list">
          {visible.map((entry) => (
            <Link
              key={entry.id}
              variant="body"
              className="create-records-row"
              href={entry.path(orgSlug)}
              prefetch={false}
              onPress={() => setOpen(false)}
            >
              <Icons.createRecordPlus className="create-records-row-icon" aria-hidden />
              <span>{entry.label}</span>
            </Link>
          ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
