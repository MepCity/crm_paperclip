"use client";
import { useState } from "react";
import { Button } from "./button";
import { ConfirmDialog, Dialog, DialogTrigger } from "./dialog";

function ReplacingContent() {
  const [replaced, setReplaced] = useState(false);

  if (replaced) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">The first step was replaced from inside.</p>
        <Button variant="ghost" onPress={() => setReplaced(false)}>
          Show the first step
        </Button>
      </div>
    );
  }

  return <Button onPress={() => setReplaced(true)}>Replace the content</Button>;
}

export default function DialogDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      <DialogTrigger>
        <Button variant="primary">Open Dialog</Button>
        <Dialog title="Confirmation">
          {({ close }) => (
            <div className="flex flex-col gap-4">
              <p className="text-text-muted">Are you sure you want to proceed?</p>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button variant="primary" onPress={close}>
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="secondary">Replace content</Button>
        <Dialog title="Replaced dialog">
          <ReplacingContent />
        </Dialog>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="secondary">Confirm change</Button>
        <ConfirmDialog
          title="Save changes"
          message="Apply the new owner?"
          confirmLabel="Save"
          cancelLabel="Cancel"
          onConfirm={() => undefined}
        />
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="danger">Delete record</Button>
        <ConfirmDialog
          title="Delete record"
          message="This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 700))}
        />
      </DialogTrigger>
    </div>
  );
}
