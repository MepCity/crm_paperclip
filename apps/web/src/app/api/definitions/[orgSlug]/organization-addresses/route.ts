import { definitionPorts } from "@/lib/definitions/ports";
import { requireOrgContext } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  try {
    const result = await (await definitionPorts()).organizationAddresses.list(ctx);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json(
      { ok: false, error: { code: "unavailable" } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
