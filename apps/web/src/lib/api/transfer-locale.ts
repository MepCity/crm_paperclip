import type { OrgContext, TransferLocale } from "@crm/core";
import type { FieldDefinition } from "@crm/core/records";
import { english, type MessageKey, translator, turkish } from "@/i18n/catalogs";
import { resolveLanguage, type UiLanguage } from "@/i18n/resolve-language";
import { readSavedLanguage } from "@/server/personal-settings/language";

const englishFields = english.metadata.fields as Record<string, string>;
const turkishFields = turkish.metadata.fields as Record<string, string>;

/** Label of a built-in field in one language; custom or renamed fields keep their own label. */
function builtInLabel(language: UiLanguage, field: FieldDefinition): string {
  if (language === "en" || ("custom" in field && field.custom)) return field.label;
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
    moduleLabel: (module) => t(`metadata.modules.${module}.plural` as MessageKey),
    fieldAliases: (_module, field) => {
      const turkishLabel = builtInLabel("tr", field);
      if ("custom" in field && field.custom) return [];
      const aliases = [turkishLabel, ...referenceWording(turkishLabel)];
      const scalar: Record<string, string[]> = {
        Employees: ["Çalışan Sayısı"],
        Ticker_Symbol: ["İMKB Kodu", "Hisse Senedi Sembolü"],
        SIC_Code: ["NACE Kodu"],
        Created_Time: ["Oluşturma Zamanı"],
        Modified_Time: ["Düzenleme Tarihi", "Değiştirme Zamanı"],
      };
      aliases.push(...(scalar[field.apiName] ?? []));
      const address = /^(Billing|Shipping|Mailing|Other)_(.+)$/.exec(field.apiName);
      const part = address?.[2] ?? field.apiName;
      const prefixes: Record<string, string[]> = {
        Billing: ["Fatura Adresi", "Faturalama Adresi", "Fatura"],
        Shipping: ["Gönderim Adresi", "Sevkiyat Adresi"],
        Mailing: ["Posta Adresi"],
        Other: ["Diğer Adres"],
      };
      const parts: Record<string, string[]> = {
        Street: ["Açık Adres", "Sokak", "Sokak Adresi"],
        City: ["Şehir"],
        State: ["Eyalet / İl", "İl"],
        Code: ["Posta Kodu"],
        Zip: ["Posta Kodu"],
        Zip_Code: ["Posta Kodu"],
        Country: ["Ülke / Bölge", "Ülke"],
      };
      for (const prefix of address ? (prefixes[address[1] ?? ""] ?? []) : ["Adres"])
        for (const suffix of parts[part] ?? []) aliases.push(`${prefix} - ${suffix}`);
      return aliases;
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
