"use client";

import { type FormEvent, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export interface AttachLinkDialogProps {
  open: boolean;
  onClose: () => void;
  onAttach: (url: string) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
}

const INVALID_URL_MESSAGE = "Please enter a valid URL.";

/** Provisional rule (OQ-06..08): only http(s) URLs that `new URL` accepts. */
function isValidLink(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function AttachLinkForm({
  onClose,
  onAttach,
  submitting,
  error,
}: Omit<AttachLinkDialogProps, "open">) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const trimmed = value.trim();

  function close() {
    setValue("");
    setInvalid(false);
    onClose();
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (submitting || trimmed === "") return;
    if (!isValidLink(trimmed)) {
      setInvalid(true);
      return;
    }
    await onAttach(trimmed);
  }

  const message = invalid ? INVALID_URL_MESSAGE : (error ?? undefined);

  return (
    <form onSubmit={submit} noValidate>
      <Heading slot="title" className="mb-4 text-2xl font-bold text-text-strong">
        Attach From Link
      </Heading>
      <TextField
        label="Enter URL"
        isRequired
        autoFocus
        value={value}
        onChange={(next) => {
          setValue(next);
          setInvalid(false);
        }}
        isInvalid={Boolean(message)}
        errorMessage={message}
      />
      <div className="mt-6 flex justify-end gap-(--size-confirm-dialog-actions-gap)">
        <Button type="button" variant="secondary" size="record" onPress={close}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="record"
          isDisabled={trimmed === "" || Boolean(submitting)}
        >
          Attach
        </Button>
      </div>
    </form>
  );
}

export function AttachLinkDialog({
  open,
  onClose,
  onAttach,
  submitting,
  error,
}: AttachLinkDialogProps) {
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal className="w-(--size-dialog-width) max-w-full rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
        <AriaDialog className="outline-none">
          <AttachLinkForm
            onClose={onClose}
            onAttach={onAttach}
            submitting={submitting}
            error={error}
          />
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
