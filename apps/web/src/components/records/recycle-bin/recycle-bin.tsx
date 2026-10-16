"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";

export interface RecycleBinRow {
  id: string;
  name: string;
  type: string;
  deletedBy: string;
  /** Display-ready text supplied by the caller's locale formatter. */
  deletedTime: string;
}

export interface RecycleBinProps {
  rows: readonly RecycleBinRow[];
  onRestore: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onEmpty: (ids: string[]) => void;
  onHelp?: () => void;
}

/** Unwired content only. Search panels and action confirmations remain unobserved. */
export function RecycleBin({ rows, onRestore, onDelete, onEmpty, onHelp }: RecycleBinProps) {
  const titleId = useId();
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const selectedIds = rows.filter((row) => selection.has(row.id)).map((row) => row.id);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const outline = "border font-normal";
  const destructive = `${outline} border-danger text-danger`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex h-full min-h-0 flex-col rounded-xl border border-panel-border bg-surface p-6 text-base text-text"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-bold text-text-strong">
          Recycle Bin
        </h2>
        <Button variant="icon" size="sm" onPress={onHelp}>
          Help
        </Button>
      </div>
      <p className="mt-1">Deleted records you have access to are displayed in the Recycle Bin.</p>
      <ul className="mt-4 list-disc space-y-1 pl-5">
        <li>Deleted records remain here for 60 days before they are permanently removed.</li>
        <li>Only users with an administrator profile can permanently delete records here.</li>
        <li>
          You can restore your own records. Restoring other users’ records requires the appropriate
          permissions.
        </li>
        <li>
          Mass restore excludes Notes, Attachments, Emails, Visits and Appointments while their
          parent records remain in the Recycle Bin.
        </li>
      </ul>
      <fieldset aria-label="Recycle Bin actions" className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className={`${outline} border-primary text-primary`}
          onPress={() => onRestore(selectedIds)}
        >
          Restore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={destructive}
          onPress={() => onDelete(selectedIds)}
        >
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`ml-auto ${destructive}`}
          onPress={() => onEmpty(selectedIds)}
        >
          Empty Recycle Bin
        </Button>
      </fieldset>
      <p className="mb-1 mt-5 text-right text-text-muted">
        Displaying {rows.length ? 1 : 0} to {rows.length} of {rows.length}
      </p>
      <section
        aria-label="Deleted records"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll this independent region.
        tabIndex={0}
        className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <table aria-label="Recycle Bin records" className="w-full text-left">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-y border-panel-border">
              <th scope="col" className="w-10 px-2 py-2">
                <Checkbox
                  label="Select all records"
                  hideLabel
                  isSelected={allSelected}
                  onChange={(checked) =>
                    setSelection(checked ? new Set(rows.map((row) => row.id)) : new Set())
                  }
                />
              </th>
              {["Name", "Type", "Deleted By", "Deleted Time"].map((label) => (
                <th key={label} scope="col" className="px-3 py-2 font-normal text-text-strong">
                  {label}
                </th>
              ))}
              <th scope="col" className="w-8">
                <Button variant="icon" size="sm" aria-label="Search">
                  <Icons.filterToggle aria-hidden className="h-4 w-4" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-row-separator">
                <td className="px-2 py-3">
                  <Checkbox
                    label={`Select ${row.name}`}
                    hideLabel
                    isSelected={selection.has(row.id)}
                    onChange={(checked) =>
                      setSelection((previous) => {
                        const next = new Set(
                          [...previous].filter((id) => rows.some((item) => item.id === id)),
                        );
                        if (checked) next.add(row.id);
                        else next.delete(row.id);
                        return next;
                      })
                    }
                  />
                </td>
                <td className="px-3 py-3">{row.name}</td>
                <td className="px-3 py-3">{row.type}</td>
                <td className="px-3 py-3">{row.deletedBy}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.deletedTime}</td>
                <td />
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">
                  No deleted records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}
