import type { OrgContext, TransferLocale } from "@crm/core";
import type { FieldDefinition } from "@crm/core/records";
import { english, type MessageKey, translator, turkish } from "@/i18n/catalogs";
import { resolveLanguage, type UiLanguage } from "@/i18n/resolve-language";
import { readSavedLanguage } from "@/server/personal-settings/language";

const englishFields = english.metadata.fields as Record<string, string>;
const turkishFields = turkish.metadata.fields as Record<string, string>;

/** Label of a built-in field in one language; custom or renamed fields keep their own label. */
function builtInLabel(language: UiLanguage, field: FieldDefinition): string {
  if (language === "en") return field.label;
  const byName = englishFields[field.apiName];
  const direct = turkishFields[field.apiName];
  if (byName === field.label && direct) return direct;
  const key = Object.entries(englishFields).find(([, value]) => value === field.label)?.[0];
  return (key && turkishFields[key]) || field.label;
}

/** The reference CRM writes "Faturalama Adresi" where our catalogue says "Fatura Adresi". */
function referenceWording(label: string): string[] {
  return label.startsWith("Fatura Adresi")
    ? [label.replace("Fatura Adresi", "Faturalama Adresi")]
    : [];
}

export function createTransferLocale(language: UiLanguage): TransferLocale {
  const t = translator(language);
  return {
    language,
    fieldLabel: (_module, field) => builtInLabel(language, field),
    fieldAliases: (_module, field) => {
      const turkishLabel = builtInLabel("tr", field);
      return [turkishLabel, ...referenceWording(turkishLabel)];
    },
    optionLabels: () => [],
    recordIdLabel: t("records.transfer.recordId" as MessageKey),
    idColumnLabel: (label) => `${label} ${t("records.transfer.idSuffix" as MessageKey)}`,
  };
}

/** Uses the signed-in user's saved interface language; English when it cannot be read. */
export async function transferLocale(ctx: OrgContext): Promise<TransferLocale> {
  let language: UiLanguage = "en";
  try {
    language = resolveLanguage(await readSavedLanguage(ctx.userId));
  } catch {
    language = "en";
  }
  return createTransferLocale(language);
}
