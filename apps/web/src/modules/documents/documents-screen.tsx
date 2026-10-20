"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { fixtureDocumentsPort } from "./fixture-port";
import type { DocumentFolder, DocumentItem, DocumentSort, DocumentsPort } from "./port";

const DEFAULT_SORT: DocumentSort = { field: "modifiedAt", direction: "desc" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Inert affordance: visible like the reference, but the flow behind it is write-only or unobserved. */
function InertButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-7 items-center justify-center rounded text-text-muted"
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

export function DocumentsScreen({ port = fixtureDocumentsPort }: { port?: DocumentsPort }) {
  const [folders, setFolders] = useState<readonly DocumentFolder[]>([]);
  const [rootId, setRootId] = useState("my");
  // Sub-folders entered below the selected root; the last entry is the current folder.
  const [trail, setTrail] = useState<readonly DocumentItem[]>([]);
  const [items, setItems] = useState<readonly DocumentItem[]>([]);

  const currentId = trail.length > 0 ? (trail[trail.length - 1] as DocumentItem).id : rootId;

  useEffect(() => {
    let live = true;
    port.listFolders().then((rows) => live && setFolders(rows));
    return () => {
      live = false;
    };
  }, [port]);

  useEffect(() => {
    let live = true;
    port.listItems(currentId, DEFAULT_SORT).then((rows) => live && setItems(rows));
    return () => {
      live = false;
    };
  }, [port, currentId]);

  const root = folders.find((folder) => folder.id === rootId);
  const myFolders = folders.filter((folder) => folder.section === "my");
  const teamFolders = folders.filter((folder) => folder.section === "team");

  function selectRoot(id: string) {
    setRootId(id);
    setTrail([]);
  }

  const crumbs: { label: string; depth: number }[] = [
    { label: root?.name ?? "", depth: 0 },
    ...trail.map((entry, index) => ({ label: entry.name, depth: index + 1 })),
  ];

  return (
    <div className="flex min-h-[calc(100vh-var(--size-topbar,3.5rem))] bg-surface" data-documents>
      <aside
        aria-label="Folders"
        className="flex w-56 shrink-0 flex-col border-r border-border px-3 py-3"
      >
        {myFolders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            selected={rootId === folder.id}
            onSelect={selectRoot}
          />
        ))}
        <div className="mt-3 flex items-center justify-between px-2 text-sm font-semibold">
          <span>Team Folders</span>
          {/* Folder creation is a write flow: visible, inert. */}
          <InertButton label="Add team folder">
            <Icons.plus className="size-4" />
          </InertButton>
        </div>
        {teamFolders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            selected={rootId === folder.id}
            onSelect={selectRoot}
          />
        ))}
        {/* External file-service link: destination not observed, disabled for now. */}
        <button
          type="button"
          disabled
          className="mt-auto px-2 py-1 text-left text-sm text-text-muted"
        >
          External file service
        </button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
            <InertButton label="Show ancestors">
              <Icons.chevronLeft className="size-4" />
            </InertButton>
            {crumbs.map((crumb) => {
              const last = crumb.depth === crumbs.length - 1;
              return (
                <span key={crumb.depth} className="flex items-center gap-1">
                  {crumb.depth > 0 ? <span aria-hidden="true">/</span> : null}
                  {last ? (
                    <span aria-current="page" className="font-semibold">
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-accent-blue"
                      onClick={() => setTrail(trail.slice(0, crumb.depth))}
                    >
                      {crumb.label}
                    </button>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            {/* Sort, filter and view controls: behaviour not observed, inert. */}
            <InertButton label="Sort">
              <Icons.sort className="size-4" />
            </InertButton>
            <InertButton label="Filter">
              <Icons.filter className="size-4" />
            </InertButton>
            <InertButton label="View">
              <Icons.viewTypeList className="size-4" />
            </InertButton>
          </div>
        </header>

        <div className="flex items-center border-b border-border px-4 py-2 text-xs font-semibold text-text-muted">
          <span className="flex-1">Name</span>
          <span className="flex w-64 items-center gap-1">
            Last Modified
            <Icons.columnSortDesc className="size-3" aria-label="Sorted descending" />
          </span>
          {/* Column configuration: unobserved, inert. */}
          <InertButton label="Columns">
            <Icons.plus className="size-4" />
          </InertButton>
        </div>

        <ul aria-label="Documents" className="flex-1">
          {items.map((row) => (
            <li key={row.id} className="flex items-center border-b border-border px-4 py-2 text-sm">
              <div className="flex flex-1 items-center gap-2">
                <Icons.folder className="size-5 text-text-muted" aria-hidden="true" />
                <div>
                  {row.kind === "folder" ? (
                    <button
                      type="button"
                      className="font-medium text-accent-blue"
                      onClick={() => setTrail([...trail, row])}
                    >
                      {row.name}
                    </button>
                  ) : (
                    <span className="font-medium">{row.name}</span>
                  )}
                  <div className="text-xs text-text-muted">Uploaded by {row.uploadedBy}</div>
                </div>
              </div>
              <div className="w-64 text-xs">
                <div>{dateFormat.format(new Date(row.modifiedAt))}</div>
                <div className="text-text-muted">by {row.modifiedBy}</div>
              </div>
              <span className="size-7" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </main>

      <aside
        aria-label="Side strip"
        className="flex w-10 shrink-0 flex-col items-center gap-2 border-l border-border py-3"
      >
        {/* Details pane and assistant: panel behaviour not observed, inert. */}
        <InertButton label="Details">
          <Icons.info className="size-4" />
        </InertButton>
        <InertButton label="Assistant">
          <Icons.sparkles className="size-4" />
        </InertButton>
      </aside>
    </div>
  );
}

function FolderRow({
  folder,
  selected,
  onSelect,
}: {
  folder: DocumentFolder;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(folder.id)}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
        selected ? "bg-surface-selected font-semibold" : ""
      }`}
    >
      <Icons.folder className="size-4" aria-hidden="true" />
      <span className="flex-1">{folder.name}</span>
      {folder.locked ? <Icons.lock className="size-3.5" aria-label="Locked" /> : null}
    </button>
  );
}
