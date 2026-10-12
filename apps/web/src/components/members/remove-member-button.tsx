"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, DialogTrigger } from "@/components/ui/dialog";
import type { ActionState, ReportError } from "@/lib/action";

export function RemoveMemberButton({
  name,
  onRemove,
  report,
}: {
  name: string;
  onRemove: () => Promise<ActionState>;
  report: ReportError;
}) {
  const router = useRouter();

  return (
    <DialogTrigger>
      <Button variant="ghost" size="sm" aria-label={`Remove ${name}`}>
        Remove
      </Button>
      <ConfirmDialog
        title={`Remove ${name}`}
        message={`${name} will lose access to this organization.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={async () => {
          report(null);
          const result = await onRemove();
          if (result.status === "error") {
            report(result.message);
            return;
          }
          router.refresh();
        }}
      />
    </DialogTrigger>
  );
}
