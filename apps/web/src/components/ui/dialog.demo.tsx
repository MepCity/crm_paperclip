"use client";
import { Button } from "./button";
import { Dialog, DialogTrigger } from "./dialog";
export default function DialogDemo() {
  return (
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
  );
}
