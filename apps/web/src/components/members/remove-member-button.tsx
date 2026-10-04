"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, DialogTrigger } from "@/components/ui/dialog";
import type { ActionState } from "@/lib/action";

export function RemoveMemberButton({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => Promise<ActionState>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {message ? <Alert variant="danger">{message}</Alert> : null}
      <DialogTrigger>
        <Button variant="ghost" size="sm" aria-label={`Remove ${name}`}>
          Remove
        </Button>
        <ConfirmDialog
          title={`Remove ${name}`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={async () => {
            const result = await onRemove();
            if (result.status === "error") {
              setMessage(result.message);
              return;
            }
            setMessage(null);
            router.refresh();
          }}
        >
          {name} will lose access to this organization.
        </ConfirmDialog>
      </DialogTrigger>
    </div>
  );
}
