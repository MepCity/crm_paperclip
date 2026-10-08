"use server";

import {
  changeMemberRole,
  createInvitation,
  type OrgRole,
  parseEnv,
  removeMember,
  revokeInvitation,
} from "@crm/core";
import { revalidatePath } from "next/cache";
import type { InvitationActionState } from "@/components/members/invitation-state";
import { type ActionState, toActionState } from "@/lib/action";
import { requireOrgContext } from "@/lib/session";

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readRole(formData: FormData): OrgRole {
  return readField(formData, "role") as OrgRole;
}

function revalidateMembers(orgSlug: string) {
  revalidatePath(`/crm/${orgSlug}/settings/members`);
}

function invitationLink(token: string): string {
  return new URL(`/invite/${encodeURIComponent(token)}`, parseEnv(process.env).APP_URL).toString();
}

export async function changeMemberRoleAction(
  orgSlug: string,
  userId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await requireOrgContext(orgSlug);
  try {
    await changeMemberRole(org, { userId, role: readRole(formData) });
  } catch (error) {
    return toActionState(error);
  }
  revalidateMembers(orgSlug);
  return { status: "success" };
}

export async function removeMemberAction(
  orgSlug: string,
  userId: string,
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const org = await requireOrgContext(orgSlug);
  try {
    await removeMember(org, { userId });
  } catch (error) {
    return toActionState(error);
  }
  revalidateMembers(orgSlug);
  return { status: "success" };
}

export async function createInvitationAction(
  orgSlug: string,
  _previous: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const org = await requireOrgContext(orgSlug);
  let token: string;
  try {
    const created = await createInvitation(org, {
      email: readField(formData, "email"),
      role: readRole(formData),
    });
    token = created.token;
  } catch (error) {
    const state = toActionState(error);
    if (state.status !== "error") throw new Error("Expected an error state");
    return state;
  }
  revalidateMembers(orgSlug);
  return { status: "success", inviteUrl: invitationLink(token) };
}

export async function revokeInvitationAction(
  orgSlug: string,
  invitationId: string,
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const org = await requireOrgContext(orgSlug);
  try {
    await revokeInvitation(org, { invitationId });
  } catch (error) {
    return toActionState(error);
  }
  revalidateMembers(orgSlug);
  return { status: "success" };
}
