"use client";
import { Button } from "./button";
import { ConfirmDialog, Dialog, DialogTrigger } from "./dialog";
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
        <Button variant="secondary">Confirm change</Button>
        <ConfirmDialog
          title="Save changes"
          confirmLabel="Save"
          cancelLabel="Cancel"
          variant="primary"
          onConfirm={() => undefined}
        >
          Apply the new owner?
        </ConfirmDialog>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="danger">Delete record</Button>
        <ConfirmDialog
          title="Delete record"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 700))}
        >
          This cannot be undone.
        </ConfirmDialog>
      </DialogTrigger>
    </div>
  );
}
