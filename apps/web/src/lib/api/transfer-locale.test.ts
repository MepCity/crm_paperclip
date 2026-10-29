import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { suggestMapping } from "@crm/core/transfer/mapping";
import { describe, expect, it } from "vitest";
import { parseCsv, serializeCsv } from "../../../../../packages/core/src/transfer/csv";
import { importable } from "../../../../../packages/core/src/transfer/import";
import { createTransferService } from "../../../../../packages/core/src/transfer/service";
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

const addressColumns = {
  Accounts: {
    "Faturalama Adresi - Açık Adres": "Billing_Street",
    "Fatura - Şehir": "Billing_City",
    "Faturalama Adresi - Eyalet / İl": "Billing_State",
    "Faturalama Adresi - Posta Kodu": "Billing_Code",
    "Faturalama Adresi - Ülke / Bölge": "Billing_Country",
  },
  Contacts: {
    "Posta Adresi - Açık Adres": "Mailing_Street",
    "Posta Adresi - Şehir": "Mailing_City",
    "Posta Adresi - Eyalet / İl": "Mailing_State",
    "Posta Adresi - Posta Kodu": "Mailing_Zip",
    "Posta Adresi - Ülke / Bölge": "Mailing_Country",
  },
  Leads: {
    "Adres - Açık Adres": "Street",
    "Adres - Şehir": "City",
    "Adres - Eyalet / İl": "State",
    "Adres - Posta Kodu": "Zip_Code",
    "Adres - Ülke / Bölge": "Country",
  },
} as const;

for (const language of ["tr", "en"] as const) {
  describe(`${language} transfer with source headers`, () => {
    const locale = createTransferLocale(language);
    const ctx = {
      orgId: randomUUID(),
      orgSlug: "synthetic-transfer",
      orgName: "Synthetic",
      userId: "synthetic-user",
      role: "admin" as const,
    };
    const records = createFixtureRecordService(ctx);
    const service = createTransferService({
      records: () => records,
      authorize: async () => {},
      listActors: async () => [{ id: ctx.userId, name: "Synthetic User" }],
      locale: async () => locale,
      now: () => new Date("2026-10-29T12:00:00Z"),
    });
    it.each(["Accounts", "Contacts", "Leads"] as const)(
      "automatically maps and stores %s addresses and timestamps",
      async (module) => {
        const columns = addressColumns[module];
        const required =
          module === "Accounts"
            ? { "Firma Adı": "Synthetic Company" }
            : { Soyadı: "Synthetic Person", Şirket: "Synthetic Company" };
        const row = {
          ...required,
          ...(module === "Accounts"
            ? { "Çalışan Sayısı": "42", "İMKB Kodu": "SYN", "NACE Kodu": "6201" }
            : {}),
          ...Object.fromEntries(
            Object.keys(columns).map((header) => [
              header,
              header.includes("Ülke") ? "Türkiye" : "Synthetic Address",
            ]),
          ),
          "Oluşturma Zamanı": "2026-10-29 14:05:00",
          "Düzenleme Tarihi": "29/10/2026 14:06",
        };
        const headers = Object.keys(row);
        const preview = await service.previewImport(ctx, module, {
          name: "synthetic.csv",
          bytes: new TextEncoder().encode(serializeCsv(headers, [Object.values(row)])),
          charset: "UTF-8",
        });
        for (const [header, apiName] of Object.entries(columns))
          expect(preview.suggestedMapping[headers.indexOf(header)]?.field).toBe(apiName);
        const job = await service.runImport(ctx, module, preview.uploadId, {
          mode: "add",
          mapping: preview.suggestedMapping,
          defaults: [],
          ignoreEmptyOnUpdate: false,
        });
        expect(job.counts).toEqual({ created: 1, updated: 0, skipped: 0, errors: 0 });
        const exported = await service.runExport(ctx, { module, fields: "all" });
        expect(exported.fileName).toBe(`${locale.moduleLabel?.(module)}_2026-10-29.csv`);
        const csv = parseCsv(
          new TextEncoder().encode((await service.downloadExport(ctx, exported.id)).body),
          { charset: "UTF-8", maxColumns: 500, maxRows: 5000 },
        );
        const id = csv.rows.find((row) => row.some((cell) => cell === "Synthetic Address"))?.[0];
        expect(id).toBeTruthy();
        const saved = await records.get(module, id ?? "");
        for (const apiName of Object.values(columns))
          expect(saved.fields[apiName]).toBe(
            apiName.includes("Country") ? "Türkiye" : "Synthetic Address",
          );
        if (module === "Accounts") {
          expect(saved.fields.Employees).toBe(42);
          expect(saved.fields.Ticker_Symbol).toBe("SYN");
          expect(saved.fields.SIC_Code).toBe(6201);
        }
        expect(saved.fields.Created_Time).toBe("2026-10-29T11:05:00.000Z");
        expect(saved.fields.Modified_Time).toBe("2026-10-29T11:06:00.000Z");
      },
    );
    it("maps employee count, ticker and industry code aliases", async () => {
      const metadata = await records.getModule("Accounts");
      const fields = metadata.fields.filter(importable).map((field) => ({
        apiName: field.apiName,
        label: locale.fieldLabel("Accounts", field),
        type: field.dataType,
        aliases: [...locale.fieldAliases("Accounts", field)],
      }));
      expect(
        suggestMapping(["Çalışan Sayısı", "İMKB Kodu", "NACE Kodu", "Bağlandı.id"], fields).map(
          (item) => item.field,
        ),
      ).toEqual(["Employees", "Ticker_Symbol", "SIC_Code", null]);
    });
    it.each(["Accounts", "Contacts", "Leads", "Deals"] as const)(
      "translates all built-in %s export headers",
      async (module) => {
        const metadata = await records.getModule(module);
        for (const field of metadata.fields) {
          const label = locale.fieldLabel(module, field);
          if (language === "en") expect(label).toBe(field.label);
          else if (
            /Address|Sales Cycle|Reason For Loss|Reporting To|Overall Sales/.test(field.label)
          )
            expect(label).not.toMatch(
              /Address|Latitude|Longitude|Duration|Reason For Loss|Reporting To/,
            );
        }
      },
    );
  });
}

it.each([
  ["tr", "Kayıt sahibi bulunamadı, içe aktaran kullanıcıya atandı"],
  ["en", "Owner not found; assigned to the importing user"],
] as const)("uses a distinct owner warning in %s", async (language, expected) => {
  const { translator } = await import("@/i18n/catalogs");
  const { reasonMessage, codeMessage } = await import("@/components/records/transfer/import/types");
  expect(reasonMessage("owner_defaulted", translator(language))).toBe(expected);
  expect(codeMessage("owner_defaulted", translator(language))).toBe(expected);
  expect(reasonMessage("value_cleared", translator(language))).not.toBe(expected);
});
