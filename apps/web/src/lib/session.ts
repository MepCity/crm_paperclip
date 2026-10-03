import { getSession as readSession, requireUser as readUser } from "@crm/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getSession = cache(async () => readSession(new Headers(await headers())));

export async function requireUser(next = "/") {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return readUser(new Headers(await headers()));
}
