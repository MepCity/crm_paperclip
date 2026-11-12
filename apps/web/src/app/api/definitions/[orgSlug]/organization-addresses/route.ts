import { apiRoute } from "@/lib/api/server";
import { definitionPorts } from "@/lib/definitions/ports";

export const dynamic = "force-dynamic";

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

export const POST = apiRoute(
  async ({ ctx, request }) => {
    try {
      const body = (await request.json().catch(() => null)) as {
        displayName?: string;
        address?: string;
        idempotencyKey?: string;
      } | null;
      const key = body?.idempotencyKey ?? crypto.randomUUID();
      return await (await definitionPorts()).organizationAddresses.add(
        ctx,
        {
          displayName: body?.displayName ?? "Support Team",
          address: body?.address ?? "support@crm.local",
        },
        { idempotencyKey: key },
      );
    } catch {
      return { ok: false, error: { code: "unavailable" } };
    }
  },
  { permission: { admin: "emailSettings" } },
);
