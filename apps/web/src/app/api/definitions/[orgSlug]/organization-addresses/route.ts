import { apiRoute } from "@/lib/api/server";
import { definitionPorts } from "@/lib/definitions/ports";

export const GET = apiRoute(
  async ({ ctx }) => {
    try {
      return await (await definitionPorts()).organizationAddresses.list(ctx);
    } catch {
      return { ok: false, error: { code: "unavailable" } };
    }
  },
  { permission: { admin: "emailSettings" } },
);
