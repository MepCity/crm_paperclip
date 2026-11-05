"use server";

import { acceptInvitation } from "@crm/core";
import { redirect } from "next/navigation";
import { declareActionExempt, requireActionPermission } from "@/lib/access/action-guard";
import { type ActionState, toActionState } from "@/lib/action";
import { requireUser } from "@/lib/session";

export async function acceptInvitationAction(
  token: string,
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  declareActionExempt(
    "memberOnly",
    "Accepts an invitation for the signed-in user; no profile exists yet.",
  );
  const user = await requireUser(`/invite/${encodeURIComponent(token)}`);
  let destination: string;
  try {
    const accepted = await acceptInvitation(user, { token });
    destination = `/crm/${accepted.orgSlug}`;
  } catch (error) {
    return toActionState(error);
  }
  redirect(destination);
}
