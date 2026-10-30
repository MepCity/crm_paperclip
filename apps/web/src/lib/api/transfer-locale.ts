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

/**
 * Header wording of the reference CRM's Turkish exports that differs from our catalogue, by
 * module. Contact/related-record names read "İrtibat Adı" / "İlgilisi"; the meeting host is
 * "Sahibi" (our own export writes "Düzenleyen", which the reference uses for the last editor, so
 * a file carrying both maps the host once, to the first column).
 */
const moduleAliases: Record<string, Record<string, string[]>> = {
  Tasks: {
    Owner: ["Görev Sahibi"],
    Who_Id: ["İrtibat Adı", "İrtibat"],
    What_Id: ["İlgilisi", "İlgili"],
  },
  Events: {
    Owner: ["Sahibi", "Toplantı Sahibi"],
    Event_Title: ["Başlık", "Toplantı Başlığı"],
    Venue: ["Konum"],
    Who_Id: ["İrtibat Adı", "İrtibat"],
    What_Id: ["İlgilisi", "İlgili"],
    Start_DateTime: ["Başlangıç"],
    End_DateTime: ["Bitiş"],
    All_day: ["Tüm gün"],
    Meeting_Venue__s: ["Toplantı Yeri"],
    Meeting_Provider__s: ["Sağlayıcı"],
    Remind_Participants: ["Katılımcı Hatırlatması"],
  },
  Calls: {
    Subject: ["Konu"],
    Who_Id: ["İrtibat Adı", "İrtibat"],
    What_Id: ["İlgilisi", "İlgili"],
    Call_Start_Time: ["Arama Saati"],
    Call_Agenda: ["Arama Ajandası"],
    Voice_Recording__s: ["Ses Kaydetme"],
    Outgoing_Call_Status: ["Giden Arama Durumu"],
  },
  Solutions: {
    Owner: ["Kayıt Sahibi", "Çözüm Sahibi"],
    Solution_Title: ["Çözüm Başlığı", "Başlık"],
    Status: ["Durum"],
    Product_Name: ["Ürün Adı", "Ürün"],
    Question: ["Soru"],
    Answer: ["Cevap", "Yanıt"],
    Published: ["Yayınlandı"],
  },
  Cases: {
    Owner: ["Kayıt Sahibi", "Servis Dosyası Sahibi", "Servis Dosyası Kayıt Sahibi"],
    Subject: ["Konu"],
    Status: ["Durum"],
    Priority: ["Öncelik"],
    Type: ["Tip", "Tür"],
    Case_Origin: ["Servis Dosyası Kaynağı", "Kaynak"],
    Case_Reason: ["Servis Dosyası Nedeni", "Neden"],
    Product_Name: ["Ürün Adı", "Ürün"],
    Related_To: ["İlgilisi", "İlgili"],
    Reported_By: ["Bildiren"],
    Account_Name: ["Firma Adı", "Firma"],
    Contact_Name: ["Kişi Adı", "İrtibat Adı"],
    Deal_Name: ["Satış Fırsatı Adı", "Fırsat Adı"],
    Internal_Comments: ["İç Yorumlar"],
    Solution: ["Çözüm"],
    Description: ["Açıklama"],
  },
};

export function createTransferLocale(language: UiLanguage): TransferLocale {
  const t = translator(language);
  return {
    language,
    fieldLabel: (_module, field) => builtInLabel(language, field),
    moduleLabel: (module) => t(`metadata.modules.${module}.plural` as MessageKey),
    fieldAliases: (module, field) => {
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
      aliases.push(...(moduleAliases[module]?.[field.apiName] ?? []));
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
