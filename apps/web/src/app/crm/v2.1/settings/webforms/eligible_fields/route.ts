import { WEBFORM_MODULES, type WebformModule } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ request }) => {
    const url = new URL(request.url);
    const mod = (url.searchParams.get("module") ?? "Leads") as WebformModule;
    const moduleName = WEBFORM_MODULES.includes(mod) ? mod : "Leads";
    const fields = getWebforms().getEligibleFields(moduleName);
    return { fields };
  },
  { permission: { admin: "manageWebforms" } },
);
