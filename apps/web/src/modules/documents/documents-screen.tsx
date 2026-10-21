"use client";

import { useEffect, useMemo, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { createHttpDocumentsPort } from "@/lib/documents/http-port";
import { fixtureDocumentsPort } from "./fixture-port";
import type { DocumentFolder, DocumentItem, DocumentSort, DocumentsPort } from "./port";

const DEFAULT_SORT: DocumentSort = { field: "modifiedAt", direction: "desc" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Inert affordance: visible like the reference, but the flow behind it is write-only or unobserved. */
function CirclePlus({ className = "size-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-accent-blue text-accent-blue ${className}`}
    >
      <Icons.plus className="size-3" />
    </span>
  );
}

function InertButton({
  label,
  children,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="inline-flex min-h-7 min-w-7 items-center justify-center rounded text-text-muted"
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

/** Route-level entry: binds the screen to the organization's HTTP port. */
export function DocumentsHttpScreen({ orgSlug }: { orgSlug: string }) {
  const port = useMemo(() => createHttpDocumentsPort(orgSlug), [orgSlug]);
  return <DocumentsScreen port={port} />;
}

/** Original empty-folder illustration (not the reference asset). */
function EmptyIllustration() {
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none" aria-hidden="true">
      <path
        d="M8 20a6 6 0 0 1 6-6h20l8 8h40a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V20Z"
        className="fill-surface-selected stroke-border"
        strokeWidth="2"
      />
      <path d="M8 34h80" className="stroke-border" strokeWidth="2" />
    </svg>
  );
}

export function DocumentsScreen({ port = fixtureDocumentsPort }: { port?: DocumentsPort }) {
  const [folders, setFolders] = useState<readonly DocumentFolder[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  // Sub-folders entered below the selected root; the last entry is the current folder.
  const [trail, setTrail] = useState<readonly DocumentItem[]>([]);
  const [items, setItems] = useState<readonly DocumentItem[]>([]);
  // Folder id the current `items` belong to; null while a folder is loading.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const rootId = selectedRoot ?? folders.find((folder) => folder.section === "my")?.id ?? "";
  const currentId = trail.length > 0 ? (trail[trail.length - 1] as DocumentItem).id : rootId;

  useEffect(() => {
    let live = true;
    port.listFolders().then((rows) => live && setFolders(rows));
    return () => {
      live = false;
    };
  }, [port]);

  useEffect(() => {
    if (!currentId) return;
    let live = true;
    setLoadedId(null);
    port.listItems(currentId, DEFAULT_SORT).then((rows) => {
      if (!live) return;
      setItems(rows);
      setLoadedId(currentId);
    });
    return () => {
      live = false;
    };
  }, [port, currentId]);

  const root = folders.find((folder) => folder.id === rootId);
  const myFolders = folders.filter((folder) => folder.section === "my");
  const teamFolders = folders.filter((folder) => folder.section === "team");

  function selectRoot(id: string) {
    setSelectedRoot(id);
    setTrail([]);
    setMenuOpen(false);
  }

  const isEmpty = loadedId === currentId && items.length === 0;
  const subFolders = items.filter((row) => row.kind === "folder");

  const crumbs: { label: string; depth: number }[] = [
    { label: (trail.length === 0 ? root?.title : undefined) ?? root?.name ?? "", depth: 0 },
    ...trail.map((entry, index) => ({ label: entry.name, depth: index + 1 })),
  ];

  return (
    <div
      className="flex min-h-[calc(100vh-var(--size-topbar,3.5rem))] gap-3 bg-bg p-3"
      data-documents
    >
      <aside
        aria-label="Folders"
        className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-surface px-3 py-3"
      >
        {myFolders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            selected={rootId === folder.id}
            onSelect={selectRoot}
          />
        ))}
        <div className="mt-3 flex items-center justify-between px-1 text-xs font-semibold uppercase text-accent-blue">
          <span className="flex items-center gap-1">
            <Icons.chevronDown className="size-3" aria-hidden="true" />
            Team Folders
          </span>
          {/* Folder creation is a write flow: visible, inert. */}
          <InertButton label="Add team folder">
            <CirclePlus />
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
          className="mt-auto flex items-center justify-between rounded border border-border px-2 py-2 text-left text-sm text-text-muted"
        >
          Open external file service
          <Icons.arrowLeft className="size-4 rotate-135" aria-hidden="true" />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 rounded-lg border border-border bg-surface">
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
              <Icons.chevronRight className="size-4 text-text-muted" aria-hidden="true" />
              {/* Collection step: ancestor behaviour unobserved, inert. */}
              <InertButton label="Apps">
                <span className="px-1 text-sm">Apps</span>
              </InertButton>
              {crumbs.map((crumb) => {
                const last = crumb.depth === crumbs.length - 1;
                return (
                  <span key={crumb.depth} className="flex items-center gap-1">
                    <Icons.chevronRight className="size-4 text-text-muted" aria-hidden="true" />
                    {last ? (
                      <span
                        aria-current="page"
                        className="relative flex items-center gap-1 font-semibold"
                      >
                        {crumb.label}
                        {/* D21: sub-folder menu; entries are our own reading (open question). */}
                        <button
                          type="button"
                          aria-label="Sub folders"
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          className="inline-flex min-h-7 min-w-5 items-center justify-center"
                          onClick={() => setMenuOpen(!menuOpen)}
                        >
                          <Icons.chevronDown className="size-3" aria-hidden="true" />
                        </button>
                        {menuOpen ? (
                          <div
                            role="menu"
                            aria-label="Sub folders"
                            className="absolute left-0 top-full z-10 mt-1 min-w-48 rounded border border-border bg-surface py-1 text-sm font-normal shadow"
                          >
                            {subFolders.length === 0 ? (
                              <div className="px-3 py-1.5 text-text-muted">No sub folders</div>
                            ) : (
                              subFolders.map((row) => (
                                <div key={row.id} role="none">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="w-full px-3 py-1.5 text-left"
                                    onClick={() => {
                                      setTrail([...trail, row]);
                                      setMenuOpen(false);
                                    }}
                                  >
                                    {row.name}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        ) : null}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-text-muted"
                        onClick={() => {
                          setTrail(trail.slice(0, crumb.depth));
                          setMenuOpen(false);
                        }}
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

          {isEmpty ? null : (
            <div className="flex items-center border-b border-border py-2 pl-4 pr-6 text-sm font-semibold text-text-muted">
              {/* D18: selection model unobserved, visible but disabled. */}
              <span className="w-12">
                <InertButton label="Select all" disabled>
                  <span className="size-4 rounded-sm border border-border" />
                </InertButton>
              </span>
              <span className="flex-1">Name</span>
              <span className="flex w-64 items-center gap-1">
                Last Modified
                <Icons.columnSortDesc className="size-3" aria-label="Sorted descending" />
              </span>
              {/* Column configuration: unobserved, inert. */}
              <InertButton label="Columns">
                <CirclePlus />
              </InertButton>
            </div>
          )}

          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-muted">
              <EmptyIllustration />
              <p className="text-base font-semibold">No items available.</p>
            </div>
          ) : null}

          <ul aria-label="Documents" className={isEmpty ? "hidden" : "flex-1"}>
            {items.map((row) => (
              <li
                key={row.id}
                className="flex items-center border-b border-border py-4 pl-16 pr-6 text-base"
              >
                <div className="flex flex-1 items-center gap-3">
                  {row.kind === "folder" ? (
                    <Icons.folder className="size-7 text-success" aria-hidden="true" />
                  ) : (
                    <Icons.file className="size-7 text-text-muted" aria-hidden="true" />
                  )}
                  <div>
                    {row.kind === "folder" ? (
                      <button
                        type="button"
                        className="font-semibold text-accent-blue"
                        onClick={() => setTrail([...trail, row])}
                      >
                        {row.name}
                      </button>
                    ) : (
                      <span className="font-semibold">{row.name}</span>
                    )}
                    <div className="text-sm text-text-muted">Uploaded by {row.uploadedBy}</div>
                  </div>
                </div>
                <div className="w-64 text-sm">
                  <div className="text-text-muted">
                    {dateFormat.format(new Date(row.modifiedAt))} by {row.modifiedBy}
                  </div>
                </div>
                {/* D19: row menu unobserved, visible but disabled. */}
                <InertButton label="More actions" disabled>
                  <Icons.ellipsis className="size-4" />
                </InertButton>
              </li>
            ))}
          </ul>
        </main>

        <aside
          aria-label="Side strip"
          className="flex w-16 shrink-0 flex-col items-center gap-4 border-l border-border py-3 text-xs"
        >
          {/* Details pane and assistant: panel behaviour not observed, inert. */}
          <InertButton label="Details">
            <span className="flex flex-col items-center gap-1">
              <Icons.info className="size-4" />
              <span className="text-xs">Details</span>
            </span>
          </InertButton>
          <InertButton label="Assistant">
            <span className="flex flex-col items-center gap-1">
              <Icons.sparkles className="size-4" />
              <span className="text-xs">Assistant</span>
            </span>
          </InertButton>
        </aside>
      </div>
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
        selected ? "bg-[var(--color-surface-selected)] font-semibold" : ""
      }`}
    >
      <Icons.folder className="size-4" aria-hidden="true" />
      <span className="flex-1">{folder.name}</span>
      {folder.locked ? <Icons.lock className="size-3.5" aria-label="Locked" /> : null}
    </button>
  );
}
