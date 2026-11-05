import { handleAuthRequest } from "@crm/core";
import { exemptRoute } from "@/lib/access/route-permission";

const handler = exemptRoute(
  "public",
  "Sign-in, sign-up and session endpoints run before any organization exists.",
  handleAuthRequest,
);
export const GET = handler;
export const POST = handler;
