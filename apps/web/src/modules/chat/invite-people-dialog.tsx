"use client";

import { useActionState } from "react";
import { Heading } from "react-aria-components";
import type { InvitationActionState } from "@/components/members/invitation-state";
import type { CreateInvitationAction } from "@/components/members/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Form, SubmitButton } from "@/components/ui/form";
import { Icons } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ActionState } from "@/lib/action";

const initialState: InvitationActionState = { status: "idle" };

export interface InvitePeopleDialogProps {
  /** Server action for creating an invitation — reuses the same action as the
   *  settings/members page (no duplicate API call). */
  action: CreateInvitationAction;
  /** Pre-filled email when the user tapped "Invite <email>" from Contacts search. */
  initialEmail?: string;
  isOpen?: boolean;
  onClose(): void;
}

/**
 * Chat "Invite People" dialog.
 * Spec controls #29–#34, chat-invite / chat-invite-cancel captures.
 * Uses shared Dialog and Form/SubmitButton components to ensure focus lock,
 * Escape key dismissal, and pending submit state.
 * Refs: MEP-1419
 */
export function InvitePeopleDialog({
  action,
  initialEmail,
  isOpen = true,
  onClose,
}: InvitePeopleDialogProps) {
  const t = useUiTranslations();

  return (
    <DialogTrigger
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Button className="hidden" aria-hidden>
        {t("chat.invitePeople")}
      </Button>
      <Dialog aria-label={t("chat.invitePeople")} data-testid="chat-invite-dialog">
        {({ close }) => (
          <div>
            {/* Header with Title and close X (#29, #30) */}
            <div className="mb-4 flex items-center justify-between">
              <Heading slot="title" className="text-lg font-semibold text-text">
                {t("chat.invitePeople")}
              </Heading>
              <Button
                variant="icon"
                size="compact"
                aria-label={t("chat.close")}
                onPress={() => {
                  close();
                  onClose();
                }}
                className="size-8"
              >
                <Icons.close className="size-4" aria-hidden />
              </Button>
            </div>

            <InvitePeopleForm
              action={action}
              initialEmail={initialEmail}
              onClose={() => {
                close();
                onClose();
              }}
            />
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

function InvitePeopleForm({
  action,
  initialEmail,
  onClose,
}: {
  action: CreateInvitationAction;
  initialEmail?: string;
  onClose: () => void;
}) {
  const t = useUiTranslations();
  const [state, formAction] = useActionState(action, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">{t("chat.inviteSent")}</p>
        {state.inviteUrl && (
          <p className="break-all font-mono text-sm text-text bg-bg p-2 rounded border border-border">
            {state.inviteUrl}
          </p>
        )}
        <div className="flex justify-end">
          <Button variant="ghost" onPress={onClose}>
            {t("chat.close")}
          </Button>
        </div>
      </div>
    );
  }

  const actionState: ActionState = state;

  return (
    <Form
      action={formAction}
      actionState={actionState}
      validationBehavior="aria"
      className="flex flex-col gap-4"
    >
      {/* Hidden role field; the invitation action expects it */}
      <input type="hidden" name="role" value="member" />

      <TextField
        name="email"
        label={t("chat.emailAddress")}
        type="email"
        isRequired
        autoComplete="email"
        placeholder={t("chat.emailPlaceholder")}
        defaultValue={initialEmail}
      />

      {/* Notice text — #32 */}
      <p className="chat-invite-notice">{t("chat.inviteNotice")}</p>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onPress={onClose} data-testid="chat-invite-cancel">
          {t("chat.cancel")}
        </Button>
        <SubmitButton variant="primary">{t("chat.sendInvites")}</SubmitButton>
      </div>
    </Form>
  );
}
