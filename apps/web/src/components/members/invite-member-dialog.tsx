"use client";

import { type ReactNode, useActionState, useState } from "react";
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

export type AccessChoice = { id: string; name: string };
export type InviteAccessOptions = {
  profiles: readonly AccessChoice[];
  roles: readonly AccessChoice[];
};

const DEFAULT_CHOICE: AccessChoice = { id: "default", name: "Default" };

export function InviteMemberDialog({
  action,
  accessOptions,
  trigger,
}: {
  action: CreateInvitationAction;
  accessOptions?: InviteAccessOptions;
  /** Replaces the default "Invite member" button (the Users page uses a "New User" split). */
  trigger?: ReactNode;
}) {
  return (
    <DialogTrigger>
      {trigger ?? <Button>Invite member</Button>}
      <Dialog title="Invite member">
        {({ close }) => (
          <InviteMemberForm action={action} onClose={close} accessOptions={accessOptions} />
        )}
      </Dialog>
    </DialogTrigger>
  );
}

function InviteMemberForm({
  action,
  onClose,
  accessOptions,
}: {
  action: CreateInvitationAction;
  onClose: () => void;
  accessOptions?: InviteAccessOptions;
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
      {accessOptions ? (
        <>
          <Select
            name="profileId"
            label="Profile"
            items={[DEFAULT_CHOICE, ...accessOptions.profiles]}
            defaultSelectedKey="default"
          >
            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
          </Select>
          <Select
            name="accessRoleId"
            label="Access role"
            items={[DEFAULT_CHOICE, ...accessOptions.roles]}
            defaultSelectedKey="default"
          >
            {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
          </Select>
        </>
      ) : null}
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
