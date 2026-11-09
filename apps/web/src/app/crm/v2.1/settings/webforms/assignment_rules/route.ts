import { WEBFORM_MODULES, type WebformModule } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { assignmentReadPort } from "@/lib/definitions/automation";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, request }) => {
    const url = new URL(request.url);
    const mod = (url.searchParams.get("module") ?? "Leads") as WebformModule;
    const moduleName = WEBFORM_MODULES.includes(mod) ? mod : "Leads";
    const port = assignmentReadPort();
    const result = await port.list(ctx, {
      kind: "assignment",
      module: moduleName,
      limit: 100,
    });
    if (!result.ok) {
      return { rules: [] };
    }
    const rules = result.value.items
      .filter((r) => r.enabled !== false)
      .map((r) => ({
        id: r.id,
        name: r.name,
        module: r.module,
        description: r.description ?? "",
      }));
    return { rules };
  },
  { permission: { admin: "manageWebforms" } },
);
