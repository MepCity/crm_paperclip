import { checkHealth } from "@crm/core";
import { exemptRoute } from "@/lib/access/route-permission";

export const dynamic = "force-dynamic";

export const GET = exemptRoute(
  "public",
  "Liveness probe without data.",
  async (): Promise<Response> => {
    try {
      await checkHealth();
      return Response.json({ status: "ok" });
    } catch {
      return Response.json({ status: "unavailable" }, { status: 503 });
    }
  },
);
