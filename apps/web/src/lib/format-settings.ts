import { type FormatOptions, formatOptionsFromOrganization } from "@crm/core/format";
import { fixtureCompanyDetailsPort } from "@/modules/settings-company/fixture-port";
import type { CompanyDetailsPort } from "@/modules/settings-company/port";
import { DEFAULT_FORMAT } from "./locale";

/**
 * Format options of the organization, read from the company-settings port. A missing or
 * unreadable setting falls back to `DEFAULT_FORMAT` without an error.
 */
export async function loadOrganizationFormat(
  port: CompanyDetailsPort = fixtureCompanyDetailsPort,
): Promise<FormatOptions> {
  try {
    const settings = await port.readOrganizationFormat();
    return settings ? formatOptionsFromOrganization(settings) : DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}
