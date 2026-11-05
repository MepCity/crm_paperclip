"use server";

import { createOrganization } from "@crm/core";
import { redirect } from "next/navigation";
import { declareActionExempt, requireActionPermission } from "@/lib/access/action-guard";
import { type ActionState, toActionState } from "@/lib/action";
import { requireUser } from "@/lib/session";

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createOrganizationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  declareActionExempt("memberOnly", "Creates a new organization; no organization exists yet.");
  const user = await requireUser("/orgs/new");
  let destination: string;
  try {
    const organization = await createOrganization(user, {
      name: readField(formData, "name"),
      slug: readField(formData, "slug"),
    });
    destination = `/crm/${organization.slug}`;
  } catch (error) {
    return toActionState(error);
  }
  redirect(destination);
}
