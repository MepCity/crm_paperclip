"use server";

import { acceptInvitation } from "@crm/core";
import { redirect } from "next/navigation";
import { type ActionState, toActionState } from "@/lib/action";
import { requireUser } from "@/lib/session";

export async function acceptInvitationAction(
  token: string,
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser(`/invite/${encodeURIComponent(token)}`);
  try {
    const accepted = await acceptInvitation(user, { token });
    redirect(`/crm/${accepted.orgSlug}`);
  } catch (error) {
    return toActionState(error);
  }
}
