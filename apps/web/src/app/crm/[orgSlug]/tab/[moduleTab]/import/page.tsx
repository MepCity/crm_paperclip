import type { TransferModule } from "@crm/core";
import { IMPORT_MODULES } from "@crm/core/transfer/types";
import { notFound } from "next/navigation";
import {
  ImportPageTitle,
  ImportWizardScreen,
} from "@/components/records/transfer/transfer-screens";
import type { MessageKey } from "@/i18n/catalogs";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { requireModuleScreen } from "@/modules/module-route";

type Props = { params: Promise<{ orgSlug: string; moduleTab: string }> };

export async function generateMetadata({ params }: Props) {
  const { moduleTab } = await params;
  const definition = requireModuleScreen(moduleTab);
  const t = await getUiTranslations();
  return {
    title: t("records.transfer.title", {
      module: t(`metadata.modules.${definition.apiName}.plural` as MessageKey),
    }),
  };
}

export default async function ModuleImportPage({ params }: Props) {
  const { orgSlug, moduleTab } = await params;
  const definition = requireModuleScreen(moduleTab);
  if (!(IMPORT_MODULES as readonly string[]).includes(definition.apiName)) notFound();
  await requireOrgContext(orgSlug);
  return (
    <>
      <ImportPageTitle module={definition.apiName as TransferModule} />
      <ImportWizardScreen module={definition.apiName as TransferModule} />
    </>
  );
}
