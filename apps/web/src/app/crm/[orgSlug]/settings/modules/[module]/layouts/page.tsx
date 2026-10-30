import { schemaRevision } from "@crm/core/customization";
import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { getCustomizationService } from "@/lib/customization";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { isAllowedSettingsModule } from "@/modules/settings-modules/fields-model";
import { defaultLayoutRow, type LayoutEditorData } from "@/modules/settings-modules/layouts-model";
import { LayoutsScreen } from "@/modules/settings-modules/layouts-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ModuleLayoutsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; module: string }>;
}) {
  const { orgSlug, module } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const name = decodeURIComponent(module);
  if (!isAllowedSettingsModule(name)) notFound();

  let editor: LayoutEditorData | undefined;
  if (getCustomizationService(ctx).capabilities(name).layouts) {
    const effective = await fixtureCustomizationPort().readEffective(ctx.orgId, name);
    const layout = effective.layouts[0];
    if (layout) {
      editor = {
        revision: schemaRevision(effective),
        layout,
        fields: effective.fields.filter((f) => f.lifecycle === "active"),
      };
    }
  }

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <LayoutsScreen orgSlug={orgSlug} module={name} rows={[defaultLayoutRow()]} editor={editor} />
    </>
  );
}
