import type { TransferModule } from "@crm/core";
import { IMPORT_MODULES } from "@crm/core/transfer/types";
import { notFound } from "next/navigation";
import { ImportWizardScreen } from "@/components/records/transfer/transfer-screens";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { requireModuleScreen } from "@/modules/module-route";

type Props = { params: Promise<{ orgSlug: string; moduleTab: string }> };

export async function generateMetadata({ params }: Props) {
  const { moduleTab } = await params;
  return { title: requireModuleScreen(moduleTab).pageTitle };
}

export default async function ModuleImportPage({ params }: Props) {
  const { orgSlug, moduleTab } = await params;
  const definition = requireModuleScreen(moduleTab);
  if (!(IMPORT_MODULES as readonly string[]).includes(definition.apiName)) notFound();
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={definition.pageTitle} />
      <ImportWizardScreen module={definition.apiName as TransferModule} />
    </>
  );
}
