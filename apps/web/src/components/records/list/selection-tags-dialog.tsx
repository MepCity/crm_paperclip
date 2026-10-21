"use client";

import { useId, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { saveRecordTagsAction } from "@/app/crm/[orgSlug]/tags/actions";
import { Button } from "@/components/ui/button";
import { TagEntry } from "@/components/ui/tag-entry";

export interface SelectionTagsDialogProps {
  orgSlug: string;
  module: string;
  recordIds: readonly string[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** Adds the typed tags to every selected record (selection bar Tags button). */
export function SelectionTagsDialog({
  orgSlug,
  module,
  recordIds,
  onOpenChange,
  onSuccess,
}: SelectionTagsDialogProps) {
  const titleId = useId();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add(name: string) {
    const value = name.trim().normalize("NFC");
    if (value && !pending.some((item) => item.toLowerCase() === value.toLowerCase()))
      setPending([...pending, value]);
    setInput("");
  }

  async function submit() {
    const names = [...pending, ...(input.trim() ? [input.trim()] : [])];
    if (!names.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      for (const id of recordIds) {
        const result = await saveRecordTagsAction(orgSlug, module, id, names);
        if (result.status === "error") {
          setError(
            Object.values(result.fieldErrors ?? {})
              .flat()
              .join(" ") || result.message,
          );
          return;
        }
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      setError("Unable to update tags. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open && !busy) onOpenChange(false);
      }}
      isKeyboardDismissDisabled={busy}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal className="w-(--size-dialog-width) max-w-full rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
        <AriaDialog aria-labelledby={titleId} className="outline-none" data-selection-tags-dialog>
          <Heading slot="title" id={titleId} className="mb-4 text-2xl font-bold text-text-strong">
            Add Tags
          </Heading>
          {pending.length ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {pending.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded bg-bg px-2 py-1 text-sm"
                >
                  {name}
                  <Button
                    variant="ghost"
                    size="compact"
                    aria-label={`Remove pending tag ${name}`}
                    isDisabled={busy}
                    onPress={() => setPending(pending.filter((item) => item !== name))}
                  >
                    ×
                  </Button>
                </span>
              ))}
            </div>
          ) : null}
          <TagEntry
            value={input}
            onChange={setInput}
            onAdd={add}
            suggestions={[]}
            disabled={busy}
          />
          {error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              isDisabled={busy}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isDisabled={busy || (!pending.length && !input.trim())}
              isPending={busy}
              onPress={() => void submit()}
            >
              Save
            </Button>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
