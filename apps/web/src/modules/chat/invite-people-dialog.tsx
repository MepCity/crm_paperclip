"use client";

import { useActionState } from "react";
import type { InvitationActionState } from "@/components/members/invitation-state";
import type { CreateInvitationAction } from "@/components/members/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";

const initialState: InvitationActionState = { status: "idle" };

interface InvitePeopleDialogProps {
  /** Server action for creating an invitation — reuses the same action as the
   *  settings/members page (no duplicate API call). */
  action: CreateInvitationAction;
  /** Pre-filled email when the user tapped "Invite <email>" from Contacts search. */
  initialEmail?: string;
  onClose(): void;
}

/**
 * Chat "Invite People" dialog.
 * Spec controls #29–#34, chat-invite / chat-invite-cancel captures.
 * Title: "Invite People" (our product invites org members).
 * Refs: MEP-1419
 */
export function InvitePeopleDialog({ action, initialEmail, onClose }: InvitePeopleDialogProps) {
  const t = useUiTranslations();
  const [state, formAction] = useActionState(action, initialState);

  return (
    /* Full-page backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-invite-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/50 p-4"
      data-testid="chat-invite-dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 id="chat-invite-title" className="text-lg font-semibold text-text">
            {t("chat.invitePeople")}
          </h2>
          <Button
            variant="icon"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            className="size-8"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        {/* Invite form — reuses the same server action used by members/invite-member-dialog */}
        {state.status === "success" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text">{t("chat.inviteSent")}</p>
            {state.inviteUrl && (
              <p className="break-all font-mono text-sm text-text bg-bg p-2 rounded border border-border">
                {state.inviteUrl}
              </p>
            )}
            <Button variant="ghost" onPress={onClose}>
              {t("chat.close")}
            </Button>
          </div>
        ) : (
          <Form
            action={formAction}
            actionState={state.status !== "idle" ? state : undefined}
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
              <Button type="submit" variant="primary">
                {t("chat.sendInvites")}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
