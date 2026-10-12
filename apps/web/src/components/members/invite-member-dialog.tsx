"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Form, SubmitButton } from "@/components/ui/form";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { ActionState } from "@/lib/action";
import type { InvitationActionState } from "./invitation-state";
import { MEMBER_ROLES } from "./roles";

export type CreateInvitationAction = (
  previous: InvitationActionState,
  formData: FormData,
) => Promise<InvitationActionState>;

const initialInvitationState: InvitationActionState = { status: "idle" };

export function InviteMemberDialog({ action }: { action: CreateInvitationAction }) {
  return (
    <DialogTrigger>
      <Button>Invite member</Button>
      <Dialog title="Invite member">
        {({ close }) => <InviteMemberForm action={action} onClose={close} />}
      </Dialog>
    </DialogTrigger>
  );
}

function InviteMemberForm({
  action,
  onClose,
}: {
  action: CreateInvitationAction;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(action, initialInvitationState);

  if (state.status === "success") {
    return <InvitationLink inviteUrl={state.inviteUrl} onClose={onClose} />;
  }

  const actionState: ActionState = state;

  return (
    <Form action={formAction} actionState={actionState} validationBehavior="aria">
      <TextField name="email" label="Email" type="email" isRequired autoComplete="email" />
      <Select name="role" label="Role" items={MEMBER_ROLES} defaultSelectedKey="member" isRequired>
        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
      </Select>
      <SubmitButton>Create invitation</SubmitButton>
    </Form>
  );
}

function InvitationLink({ inviteUrl, onClose }: { inviteUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="break-all text-sm text-text">{inviteUrl}</p>
      <Button
        variant="secondary"
        onPress={() => {
          void navigator.clipboard.writeText(inviteUrl).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </Button>
      <p className="text-sm text-text-muted">
        This link is shown only once. It will not be shown again after you close this dialog.
      </p>
      <Button variant="ghost" onPress={onClose}>
        Close
      </Button>
    </div>
  );
}
