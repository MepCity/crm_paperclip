import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { parseCsv, serializeCsv } from "../../../../../packages/core/src/transfer/csv";
import { createTransferService } from "../../../../../packages/core/src/transfer/service";
import type { TransferModule } from "../../../../../packages/core/src/transfer/types";
import { createTransferLocale } from "./transfer-locale";

function setup(language: "tr" | "en" = "tr", timeZone = "Europe/Istanbul") {
  const ctx = {
    orgId: randomUUID(),
    orgSlug: "synthetic-activities",
    orgName: "Synthetic",
    userId: "synthetic-user",
    role: "admin" as const,
  };
  const records = createFixtureRecordService(ctx);
  const locale = createTransferLocale(language);
  const service = createTransferService({
    records: () => records,
    authorize: async () => {},
    listActors: async () => [{ id: ctx.userId, name: "Synthetic User" }],
    locale: async () => locale,
    timeZone: () => timeZone,
    now: () => new Date("2026-10-29T12:00:00Z"),
  });
  const preview = (module: TransferModule, headers: string[], rows: string[][]) =>
    service.previewImport(ctx, module, {
      name: "synthetic.csv",
      bytes: new TextEncoder().encode(serializeCsv(headers, rows)),
      charset: "UTF-8",
    });
  const importAuto = async (
    module: TransferModule,
    headers: string[],
    rows: string[][],
    defaults: { field: string; value: string }[] = [],
  ) => {
    const upload = await preview(module, headers, rows);
    const job = await service.runImport(ctx, module, upload.uploadId, {
      mode: "add",
      mapping: upload.suggestedMapping,
      defaults,
      ignoreEmptyOnUpdate: false,
    });
    return { upload, job };
  };
  const find = async (module: TransferModule, field: string, value: string) => {
    const view = (await records.listViews(module)).find((item) => item.isDefault);
    const found = await records.list(module, {
      viewId: view?.id ?? "",
      page: 1,
      perPage: 10,
      filters: { field, comparator: "equal", value },
    });
    return found.records[0]?.fields ?? {};
  };
  return { ctx, records, service, preview, importAuto, find };
}

const mapped = (upload: Awaited<ReturnType<ReturnType<typeof setup>["preview"]>>) =>
  Object.fromEntries(
    upload.suggestedMapping.map((item) => [upload.headers[item.column], item.field]),
  );

describe("reference activity exports", () => {
  it("maps Task headers, never the dotted id columns", async () => {
    const s = setup();
    const headers = [
      "Kimliği Kaydet",
      "Görev Sahibi.id",
      "Görev Sahibi",
      "Konu",
      "Son Tarih",
      "İrtibat Adı.id",
      "İrtibat Adı",
      "İlgilisi.id",
      "İlgilisi",
      "Durum",
      "Öncelik",
      "Oluşturma Zamanı",
      "Düzenleme Tarihi",
      "Açıklama",
    ];
    const upload = await s.preview("Tasks", headers, []);
    expect(mapped(upload)).toEqual({
      "Kimliği Kaydet": null,
      "Görev Sahibi.id": null,
      "Görev Sahibi": "Owner",
      Konu: "Subject",
      "Son Tarih": "Due_Date",
      "İrtibat Adı.id": null,
      "İrtibat Adı": "Who_Id",
      "İlgilisi.id": null,
      İlgilisi: "What_Id",
      Durum: "Status",
      Öncelik: "Priority",
      "Oluşturma Zamanı": "Created_Time",
      "Düzenleme Tarihi": "Modified_Time",
      Açıklama: "Description",
    });
  });

  it("maps Meeting headers; the host comes from the owner column, not the last editor", async () => {
    const s = setup();
    const headers = [
      "Sahibi.id",
      "Sahibi",
      "Başlık",
      "Konum",
      "İrtibat Adı.id",
      "İrtibat Adı",
      "İlgilisi.id",
      "İlgilisi",
      "Düzenleyen.id",
      "Düzenleyen",
      "Tüm gün",
      "Başlangıç",
      "Bitiş",
      "Toplantı Yeri",
      "Sağlayıcı",
    ];
    const upload = await s.preview("Events", headers, []);
    expect(mapped(upload)).toMatchObject({
      Sahibi: "Owner",
      "Sahibi.id": null,
      Düzenleyen: null,
      "Düzenleyen.id": null,
      Başlık: "Event_Title",
      Konum: "Venue",
      "İrtibat Adı": "Who_Id",
      İlgilisi: "What_Id",
      "Tüm gün": "All_day",
      Başlangıç: "Start_DateTime",
      Bitiş: "End_DateTime",
      "Toplantı Yeri": "Meeting_Venue__s",
      Sağlayıcı: "Meeting_Provider__s",
    });
  });

  it("maps Call headers and keeps a time-stamped reminder column off the Reminder picklist", async () => {
    const s = setup();
    const headers = [
      "Arama Sahibi",
      "Konu",
      "Arama Tipi",
      "Arama Nedeni",
      "İrtibat Adı",
      "İlgilisi",
      "Arama Saati",
      "Arama Süresi",
      "Arama Sonucu",
      "Anımsatıcı",
      "Arama Ajandası",
      "Ses Kaydetme",
    ];
    const rows = [["", "Örnek arama", "", "", "", "", "", "", "", "2026-10-29 09:00:00", "", ""]];
    const upload = await s.preview("Calls", headers, rows);
    expect(mapped(upload)).toMatchObject({
      Konu: "Subject",
      "Arama Tipi": "Call_Type",
      "Arama Nedeni": "Call_Purpose",
      "İrtibat Adı": "Who_Id",
      İlgilisi: "What_Id",
      "Arama Saati": "Call_Start_Time",
      "Arama Süresi": "Call_Duration",
      "Arama Sonucu": "Call_Result",
      "Arama Ajandası": "Call_Agenda",
      "Ses Kaydetme": "Voice_Recording__s",
      Anımsatıcı: null,
    });
    // An offset value (our own export) still maps to the picklist.
    const own = await s.preview("Calls", ["Anımsatıcı"], [["None"]]);
    expect(own.suggestedMapping[0]?.field).toBe("Reminder");
  });

  it.each(["Tasks", "Events", "Calls"] as const)(
    "%s link the contact by full name (salutation-insensitive) and the related record by name",
    async (module) => {
      const s = setup();
      const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma" });
      const person = await s.records.create("Contacts", { First_Name: "Ayşe", Last_Name: "Örnek" });
      const headers =
        module === "Tasks"
          ? ["Konu", "Son Tarih", "İrtibat Adı", "İlgilisi", "Oluşturma Zamanı"]
          : module === "Events"
            ? [
                "Başlık",
                "Başlangıç",
                "Bitiş",
                "İrtibat Adı",
                "İlgilisi",
                "Oluşturma Zamanı",
                "Toplantı Yeri",
              ]
            : [
                "Konu",
                "Arama Tipi",
                "Arama Saati",
                "İrtibat Adı",
                "İlgilisi",
                "Oluşturma Zamanı",
                "Arama Süresi",
              ];
      const titleKey = module === "Events" ? "Event_Title" : "Subject";
      const rowFor = (title: string, contact: string, related: string) =>
        module === "Tasks"
          ? [title, "2026-11-02", contact, related, "2026-10-01 09:30:00"]
          : module === "Events"
            ? [
                title,
                "2026-11-02 10:00:00",
                "2026-11-02 11:00:00",
                contact,
                related,
                "2026-10-01 09:30:00",
                "Client location",
              ]
            : [
                title,
                "Outbound",
                "2026-11-02 10:00:00",
                contact,
                related,
                "2026-10-01 09:30:00",
                "05:00",
              ];
      const { job } = await s.importAuto(module, headers, [
        rowFor("Bağlı kayıt", "Bayan AYSE ORNEK", "ÖRNEK FİRMA"),
        rowFor("Bilinmeyen kayıt", "Kimse Yok", "Hiçbir Firma"),
      ]);
      expect(job.counts).toMatchObject({ created: 2, errors: 0, warnings: 2 });
      expect(job.rows).toEqual([
        { row: 3, outcome: "warning", code: "not_found", field: "What_Id" },
        { row: 3, outcome: "warning", code: "not_found", field: "Who_Id" },
      ]);
      const linked = await s.find(module, titleKey, "Bağlı kayıt");
      expect(linked.Who_Id).toMatchObject({ module: "Contacts", id: person.id });
      expect(linked.What_Id).toMatchObject({ module: "Accounts", id: account.id });
      // 2026-10-01 09:30 in Europe/Istanbul (UTC+3).
      expect(linked.Created_Time).toBe("2026-10-01T06:30:00.000Z");
      if (module === "Events") expect(linked.Start_DateTime).toBe("2026-11-02T07:00:00.000Z");
      if (module === "Calls") expect(linked.Call_Start_Time).toBe("2026-11-02T07:00:00.000Z");
    },
  );
});

describe("contacts that share a name", () => {
  it("picks the contact of the related account and warns when that does not settle it", async () => {
    const s = setup();
    const first = await s.records.create("Accounts", { Account_Name: "Birinci Firma" });
    const second = await s.records.create("Accounts", { Account_Name: "İkinci Firma" });
    await s.records.create("Accounts", { Account_Name: "Üçüncü Firma" });
    const own = await s.records.create("Contacts", {
      First_Name: "Yetkili",
      Last_Name: "Bey",
      Account_Name: { module: "Accounts", id: second.id },
    });
    await s.records.create("Contacts", {
      First_Name: "Yetkili",
      Last_Name: "Bey",
      Account_Name: { module: "Accounts", id: first.id },
    });
    const { job } = await s.importAuto(
      "Tasks",
      ["Konu", "İrtibat Adı", "İlgilisi"],
      [
        ["Doğru kişi", "YETKİLİ BEY", "İkinci Firma"],
        ["Belirsiz kişi", "YETKİLİ BEY", "Üçüncü Firma"],
        ["Firmasız kişi", "YETKİLİ BEY", ""],
      ],
    );
    expect(job.counts).toMatchObject({ created: 3, errors: 0 });
    expect(job.rows).toEqual([
      { row: 3, outcome: "warning", code: "multiple_matches", field: "Who_Id" },
      { row: 4, outcome: "warning", code: "multiple_matches", field: "Who_Id" },
    ]);
    expect((await s.find("Tasks", "Subject", "Doğru kişi")).Who_Id).toMatchObject({ id: own.id });
  });
});

describe("Solutions and Cases import", () => {
  it("round-trips Turkish and English exports and accepts reference-style headers", async () => {
    for (const language of ["tr", "en"] as const) {
      const s = setup(language);
      await s.records.create("Solutions", { Solution_Title: "Örnek çözüm", Status: "Draft" });
      await s.records.create("Cases", {
        Subject: "Örnek servis dosyası",
        Status: "New",
        Case_Origin: "Phone",
      });
      for (const module of ["Solutions", "Cases"] as const) {
        const exported = await s.service.runExport(s.ctx, { module, fields: "all" });
        const body = (await s.service.downloadExport(s.ctx, exported.id)).body;
        const csv = parseCsv(new TextEncoder().encode(body), {
          charset: "UTF-8",
          maxColumns: 500,
          maxRows: 5000,
        });
        const upload = await s.preview(module, csv.headers, csv.rows);
        const importable = upload.fields.map((field) => field.apiName);
        const targets = upload.suggestedMapping.flatMap((item) => (item.field ? [item.field] : []));
        const title = module === "Solutions" ? "Solution_Title" : "Subject";
        expect(targets).toContain(title);
        expect(new Set(targets).size).toBe(targets.length);
        for (const target of targets) expect(importable.concat("id")).toContain(target);
        const mappedAgain = await s.service.runImport(s.ctx, module, upload.uploadId, {
          mode: "add",
          matchField: "id",
          mapping: upload.suggestedMapping.filter((item) => item.field !== "id"),
          defaults: [],
          ignoreEmptyOnUpdate: false,
        });
        expect(mappedAgain.rows.filter((row) => row.outcome === "error")).toEqual([]);
        expect(mappedAgain.counts.created).toBe(csv.rows.length);
      }
    }
  });

  it("imports reference-style Turkish Solutions and Cases with history and undo", async () => {
    const s = setup("tr");
    const solutions = await s.importAuto(
      "Solutions",
      ["Çözüm Başlığı", "Durum", "Soru", "Cevap", "Yayınlandı", "Çözüm Numarası"],
      [["Örnek çözüm başlığı", "Draft", "Örnek soru?", "Örnek cevap.", "", "99"]],
    );
    expect(solutions.job.counts).toMatchObject({ created: 1, errors: 0 });
    expect(mapped(solutions.upload)).toMatchObject({
      "Çözüm Başlığı": "Solution_Title",
      Durum: "Status",
      Soru: "Question",
      Cevap: "Answer",
    });
    const solution = await s.find("Solutions", "Solution_Title", "Örnek çözüm başlığı");
    expect(solution.Question).toBe("Örnek soru?");

    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma" });
    const cases = await s.importAuto(
      "Cases",
      ["Konu", "Durum", "Servis Dosyası Kaynağı", "Öncelik", "Firma Adı", "Bildiren", "Açıklama"],
      [["Örnek konu", "New", "Phone", "High", "Örnek Firma", "Örnek Kişi", "Örnek açıklama"]],
    );
    expect(cases.job.counts).toMatchObject({ created: 1, errors: 0 });
    expect(cases.job.rows).toEqual([]);
    const saved = await s.find("Cases", "Subject", "Örnek konu");
    expect(saved).toMatchObject({ Status: "New", Case_Origin: "Phone", Priority: "High" });
    expect(saved.Account_Name).toMatchObject({ module: "Accounts", id: account.id });
    expect(await s.service.listImports(s.ctx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: cases.job.id, module: "Cases", undoable: true }),
      ]),
    );
    expect((await s.service.undoImport(s.ctx, cases.job.id)).status).toBe("undone");
    expect(await s.find("Cases", "Subject", "Örnek konu")).toEqual({});
  });
});
