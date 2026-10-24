import { schemaRevision } from "@crm/core/customization";
import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { getCustomizationService } from "@/lib/customization";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import type { FieldEditorData } from "@/modules/settings-modules/fields-editor";
import {
  type FieldRow,
  fieldRowsFromMetadata,
  isAllowedSettingsModule,
  typeLabel,
} from "@/modules/settings-modules/fields-model";
import { FieldsScreen } from "@/modules/settings-modules/fields-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ModuleFieldsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; module: string }>;
}) {
  const { orgSlug, module } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const name = decodeURIComponent(module);
  if (!isAllowedSettingsModule(name)) notFound();
  const meta = await getRecordService(ctx).getModule(name);
  let editor: FieldEditorData | undefined;
  let editorRows: FieldRow[] | undefined;
  if (getCustomizationService(ctx).capabilities(name).fields) {
    const effective = await fixtureCustomizationPort().readEffective(ctx.orgId, name);
    const layout = effective.layouts[0];
    if (layout) {
      const placed = new Set(layout.sections.flatMap((s) => s.columns.flat()));
      const row = (f: (typeof effective.fields)[number]): FieldRow => ({
        id: f.id,
        apiName: f.apiName,
        label: f.label,
        dataType: typeLabel(f.dataType),
        custom: !f.id.startsWith("field:"),
        required: f.required,
        readOnly: f.readOnly,
        placed: placed.has(f.id),
      });
      editorRows = effective.fields.filter((f) => f.lifecycle === "active").map(row);
      editor = {
        revision: schemaRevision(effective),
        layout,
        retired: fixtureCustomizationPort()
          .retiredFields(ctx.orgId, name)
          .map((f) => ({
            id: f.id,
            apiName: f.apiName,
            label: f.label,
            dataType: typeLabel(f.dataType),
            custom: true,
          })),
      };
    }
  }
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Modules and Fields." />
      <FieldsScreen
        orgSlug={orgSlug}
        module={name}
        rows={editorRows ?? fieldRowsFromMetadata(meta)}
        editor={editor}
      />
    </>
  );
}
