"use client";

import { useMemo, useState } from "react";
import { Icons } from "@/components/ui/icon";

export interface FilterMenuOption {
  id: string;
  label: string;
}

interface FilterMenuProps {
  options: FilterMenuOption[];
  value: string;
  onSelect: (id: string) => void;
  align?: "left" | "right";
}

/** Dropdown list with a search box (magnifier, no placeholder), left check mark and bold active option. */
export function FilterMenu({ options, value, onSelect, align = "left" }: FilterMenuProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div
      className={`absolute top-full z-30 mt-1 w-max min-w-[260px] max-w-[320px] rounded-md border border-border bg-surface p-3 shadow-lg ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <div className="relative mb-2">
        <Icons.filterSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text" />
        <input
          type="text"
          aria-label="Ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded border border-primary pl-8 pr-2 text-[15px] text-text outline-hidden"
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {visible.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id || "__all"}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded px-1.5 py-2 text-left text-[15px] text-text hover:bg-surface-secondary ${
                active ? "font-semibold" : "font-normal"
              }`}
            >
              <span className="inline-flex size-4 shrink-0 items-center justify-center">
                {active && <Icons.check className="size-4" />}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Filled caret; points up while the menu is open. */
export function FilterCaret({ open }: { open: boolean }) {
  return (
    <Icons.recordFormCaret
      aria-hidden="true"
      className={`h-[5px] w-2 shrink-0 ${open ? "rotate-180" : ""}`}
    />
  );
}
