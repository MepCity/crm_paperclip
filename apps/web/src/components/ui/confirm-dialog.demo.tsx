"use client";

import { useState } from "react";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import { DialogTrigger } from "./dialog";

export default function ConfirmDialogDemo() {
  const [errorOpen, setErrorOpen] = useState(false);
  const [busyOpen, setBusyOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-4">
      <DialogTrigger>
        <Button variant="secondary">Default confirm</Button>
        <ConfirmDialog
          title="Save changes"
          message="Apply the new owner?"
          confirmLabel="Save"
          cancelLabel="Cancel"
          tone="default"
          onConfirm={() => undefined}
        />
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="danger">Danger confirm</Button>
        <ConfirmDialog
          title="Delete record"
          message="This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={() => undefined}
        />
      </DialogTrigger>
      <Button variant="secondary" onPress={() => setBusyOpen(true)}>
        Busy confirm
      </Button>
      {busyOpen ? (
        <ConfirmDialog
          isOpen
          onOpenChange={setBusyOpen}
          title="Delete records"
          message="Working example with a slow confirm."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          busy
          onConfirm={() => new Promise(() => {})}
        />
      ) : null}
      <Button variant="secondary" onPress={() => setErrorOpen(true)}>
        Error confirm
      </Button>
      {errorOpen ? (
        <ConfirmDialog
          isOpen
          onOpenChange={setErrorOpen}
          title="Delete records"
          message="The server rejected the request."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          errorMessage="Unable to delete the selected records."
          onConfirm={() => undefined}
        />
      ) : null}
    </div>
  );
}
