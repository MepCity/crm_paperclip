import { OWNED_MODULES } from "@crm/core/access/catalogue";
import { readFixtureModuleProjection } from "@crm/core/records/fixture/metadata-projection";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import {
  type FieldInfo,
  FieldPermissionsScreen,
} from "@/modules/settings-access/field-permissions-screen";
import { AccessPage, canManageAccess } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function FieldPermissionsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  const fieldsByModule: Record<string, FieldInfo[]> = {};
  if (await canManageAccess(orgSlug)) {
    for (const module of OWNED_MODULES) {
      try {
        const projection = await readFixtureModuleProjection(org.orgId, module);
        fieldsByModule[module] = projection.fields.map((field) => ({
          apiName: field.apiName,
          label: field.label,
          required: field.required,
        }));
      } catch {
        fieldsByModule[module] = [];
      }
    }
  }
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <FieldPermissionsScreen orgSlug={orgSlug} fieldsByModule={fieldsByModule} />
      </AccessPage>
    </>
  );
}
