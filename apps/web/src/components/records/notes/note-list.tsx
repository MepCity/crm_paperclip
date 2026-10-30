"use client";

import type { ReactNode } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { useUtilityLabel } from "@/i18n/utility-labels";
import { NoteRow } from "./note-row";
import { type NoteSortOrder, sortNotes } from "./note-sort";

export interface NoteListItem {
  id: string;
  title: string | null;
  body: ReactNode;
  attachments?: ReactNode;
  parentLabel: string;
  parentHref: string;
  createdAt: string;
  authorName: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface NoteListProps {
  items: readonly NoteListItem[];
  sort: NoteSortOrder;
  onSortChange: (order: NoteSortOrder) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
  editingId?: string | null;
  renderEditor?: (id: string) => ReactNode;
  footer?: ReactNode;
}

const sortOptions = [
  { id: "recentLast", name: "Recent Last" },
  { id: "recentFirst", name: "Recent First" },
];

export function NoteList({
  items,
  sort,
  onSortChange,
  onEdit,
  onDelete,
  editingId,
  renderEditor,
  footer,
}: NoteListProps) {
  const copy = useUtilityLabel();
  return (
    <div className="note-list">
      <div className="note-list-sort flex justify-end">
        <Select
          label={copy("Sort notes")}
          hideLabel
          variant="sort"
          items={sortOptions}
          selectedKey={sort}
          onSelectionChange={(key) => {
            if (key === "recentLast" || key === "recentFirst") onSortChange(key);
          }}
        >
          {(option) => (
            <SelectItem variant="sort" id={option.id}>
              {copy(option.name)}
            </SelectItem>
          )}
        </Select>
      </div>
      <ul>
        {sortNotes(items, sort).map((item) =>
          editingId === item.id && renderEditor ? (
            <li key={item.id}>{renderEditor(item.id)}</li>
          ) : (
            <NoteRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ),
        )}
      </ul>
      {footer}
    </div>
  );
}
