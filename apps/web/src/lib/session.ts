import {
  NotFoundError,
  requireOrgContext as readOrgContext,
  getSession as readSession,
  UnauthenticatedError,
} from "@crm/core";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export const getSession = cache(async () => readSession(new Headers(await headers())));

export async function requireUser(next = "/") {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session.user;
}

export const requireOrgContext = cache(async (orgSlug: string) => {
  try {
    return await readOrgContext(new Headers(await headers()), orgSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof UnauthenticatedError) {
      redirect(`/sign-in?next=${encodeURIComponent(`/crm/${orgSlug}`)}`);
    }
    throw error;
  }
});
