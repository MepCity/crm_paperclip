import { checkHealth } from "@crm/core";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await checkHealth();
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
