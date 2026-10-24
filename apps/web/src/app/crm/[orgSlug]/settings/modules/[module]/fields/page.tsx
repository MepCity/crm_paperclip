import { createFixtureRecordService } from "@crm/core/records/fixture";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import {
  fieldRowsFromMetadata,
  isAllowedSettingsModule,
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
  const meta = await createFixtureRecordService(ctx).getModule(name);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Modules and Fields." />
      <FieldsScreen orgSlug={orgSlug} module={name} rows={fieldRowsFromMetadata(meta)} />
    </>
  );
}
