"use client";

import { formatDateTime } from "@crm/core/format";
import type { Tag } from "@crm/core/records";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { useFormat } from "@/lib/format-context";

export interface ManageTagsPageProps {
  tags?: readonly Tag[];
  loading?: boolean;
  error?: string | null;
  canManage?: boolean;
  onSave?: (name: string, id?: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  /** Name of the module whose tags are being managed. Defaults to "Leads". */
  moduleName?: string;
  /** Number of tags currently used. Defaults to the catalogue size. */
  tagsUsed?: number;
  /** Total tag capacity. Defaults to 100. */
  tagsCapacity?: number;
  /** Back navigation callback (TAG-09). */
  onBack?: () => void;
  /** Help action callback (TAG-10). */
  onHelp?: () => void;
  /** New tag creation callback (TAG-11). */
  onNewTag?: () => void;
}

/**
 * Module tag catalogue. Populated rows and editing use ADR 0007 interim rules.
 */
export function ManageTagsPage({
  tags = [],
  loading = false,
  error = null,
  canManage = true,
  onSave,
  onDelete,
  moduleName = "Leads",
  tagsUsed = tags.length,
  tagsCapacity = 100,
  onBack,
  onHelp,
  onNewTag,
}: ManageTagsPageProps) {
  const format = useFormat();
  const titleId = useId();
  const [editing, setEditing] = useState<Tag | "new" | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  function edit(tag: Tag | "new") {
    setName(tag === "new" ? "" : tag.name);
    setMutationError(null);
    setEditing(tag);
    if (tag === "new") onNewTag?.();
  }
  async function save() {
    if (busy || !editing || !name.trim() || [...name.trim().normalize("NFC")].length > 50) return;
    setBusy(true);
    try {
      if (await onSave?.(name, editing === "new" ? undefined : editing.id)) setEditing(null);
    } catch {
      setMutationError("Unable to update tags. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-surface p-6 text-text">
      {/* Header row: Back arrow, Title, Module badge, Help */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Icons.arrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <h1 id={titleId} className="text-xl font-bold text-text-strong">
            Manage Tags
          </h1>
          <span className="rounded border border-border px-2 py-0.5 text-xs font-normal text-text-muted">
            {moduleName}
          </span>
        </div>
        <button
          type="button"
          onClick={onHelp}
          aria-label="Help"
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-normal text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Icons.info className="h-4 w-4" aria-hidden />
          <span>Help</span>
        </button>
      </div>

      {/* Explanatory description */}
      <p className="mt-3 text-sm text-text-muted">
        Tags are keywords that help you categorize your records based on their characteristics. Tags
        help you sort your data and find it easily when you need it.
      </p>

      {/* Usage counter */}
      <div className="mt-4 text-right text-sm text-text">
        Tags used : {tagsUsed} / {tagsCapacity}
      </div>

      {error && !editing && !deleting ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {tags.length > 0 && canManage ? (
        <div className="mt-3 flex justify-end">
          <Button onPress={() => edit("new")} isDisabled={loading || tags.length >= tagsCapacity}>
            New Tag
          </Button>
        </div>
      ) : null}
      {/* Catalogue table */}
      <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <table aria-label="Tags table" className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover/50 text-xs font-semibold text-text">
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Tag Color
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Tag Name
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-border">
                <td className="px-6 py-3">
                  {tag.color ? (
                    <span
                      role="img"
                      aria-label={tag.color}
                      className="inline-block size-4 rounded border border-border"
                      style={{ backgroundColor: tag.color }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-3">
                  <span>{tag.name}</span>
                  {canManage ? (
                    <span className="ml-4 inline-flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Rename tag ${tag.name}`}
                        onPress={() => edit(tag)}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete tag ${tag.name}`}
                        onPress={() => {
                          setMutationError(null);
                          setDeleting(tag);
                        }}
                      >
                        Delete
                      </Button>
                    </span>
                  ) : null}
                </td>
                <td className="px-6 py-3">
                  <time dateTime={tag.modifiedAt}>{formatDateTime(tag.modifiedAt, format)}</time>
                </td>
              </tr>
            ))}
            {!tags.length ? (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <p className="mb-4 text-sm text-text-muted">
                    {loading
                      ? "Loading tags…"
                      : error
                        ? "Unable to load tags."
                        : "There are currently no available Tags. Add new Tags by clicking the button below."}
                  </p>
                  {canManage && !loading && !error ? (
                    <Button variant="primary" onPress={() => edit("new")} aria-label="New Tag">
                      New Tag
                    </Button>
                  ) : null}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <DialogTrigger
        isOpen={editing !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(null);
        }}
      >
        <Dialog title={editing === "new" ? "New Tag" : "Rename Tag"}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <TextField
              label="Tag Name"
              description="Enter 1 to 50 characters."
              value={name}
              onChange={setName}
              autoFocus
              isDisabled={busy}
            />
            {error || mutationError ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {mutationError || error}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" isDisabled={busy} onPress={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={busy || !name.trim() || [...name.trim().normalize("NFC")].length > 50}
              >
                Save
              </Button>
            </div>
          </form>
        </Dialog>
      </DialogTrigger>
      <ConfirmDialog
        title="Delete Tag"
        message={`Delete “${deleting?.name ?? ""}” and remove it from all records?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isOpen={deleting !== null}
        errorMessage={mutationError || error}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          try {
            if (deleting && (await onDelete?.(deleting.id))) return;
          } catch {
            setMutationError("Unable to delete tag. Please try again.");
          }
          throw new Error("Tag deletion failed");
        }}
      />
    </div>
  );
}
