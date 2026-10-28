import { describe, expect, it } from "vitest";
import { createTransferLocale } from "./transfer-locale";

const field = (apiName: string, label: string) =>
  ({ apiName, label, dataType: "text" }) as Parameters<
    ReturnType<typeof createTransferLocale>["fieldLabel"]
  >[1];

describe("transfer locale", () => {
  it("labels exports in the interface language and accepts both languages on import", () => {
    const tr = createTransferLocale("tr");
    const city = field("Billing_City", "Billing City");
    expect(tr.fieldLabel("Accounts", city)).toBe("Fatura Adresi Şehir");
    expect(tr.fieldAliases("Accounts", city)).toContain("Faturalama Adresi Şehir");
    expect(tr.recordIdLabel).toBe("Kayıt Id");
    expect(tr.idColumnLabel("Firma Adı")).toBe("Firma Adı Id");
    const en = createTransferLocale("en");
    expect(en.fieldLabel("Accounts", city)).toBe("Billing City");
    expect(en.fieldAliases("Accounts", city)).toContain("Fatura Adresi Şehir");
    expect(en.recordIdLabel).toBe("Record Id");
  });
  it("keeps the label of a custom field", () => {
    const custom = field("Custom_1", "Örnek Alan");
    expect(createTransferLocale("tr").fieldLabel("Accounts", custom)).toBe("Örnek Alan");
  });
  it("uses natural Turkish phrasing for module menu items", async () => {
    const { translator } = await import("@/i18n/catalogs");
    const t = translator("tr");
    expect(t("records.transfer.exportItem.Leads")).toBe("Müşteri Adaylarını Dışa Aktar");
    expect(t("records.transfer.importItem.Contacts")).toBe("Kişileri İçe Aktar");
  });
});
