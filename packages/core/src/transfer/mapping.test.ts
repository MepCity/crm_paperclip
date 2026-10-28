import { describe, expect, it } from "vitest";
import { matchPicklistOption, normalizeKey, suggestMapping } from "./mapping";

const fields = [
  { apiName: "Account_Name", label: "Firma Adı", type: "text", aliases: ["Account Name"] },
  { apiName: "Phone", label: "Telefon", type: "phone", aliases: ["Phone"] },
  { apiName: "Email", label: "E-posta", type: "email", aliases: ["Email"] },
  {
    apiName: "Billing_City",
    label: "Fatura Adresi Şehir",
    type: "text",
    aliases: ["Billing City", "Faturalama Adresi Şehir"],
  },
  { apiName: "Owner", label: "Kayıt Sahibi", type: "ownerlookup", aliases: ["Owner"] },
];
const map = (headers: string[]) =>
  suggestMapping(headers, fields, ["Record Id", "Kayıt Id"]).map((item) => item.field);

describe("normalizeKey", () => {
  it("ignores case, spacing, punctuation and diacritics", () => {
    expect(normalizeKey("Faturalama Adresi - Şehir")).toBe("faturalamaadresisehir");
    expect(normalizeKey("İŞLEM Ğ ı")).toBe("islemgi");
    expect(normalizeKey("E-posta")).toBe(normalizeKey("e posta"));
  });
});

describe("suggestMapping", () => {
  it("matches API names, English labels and Turkish labels", () => {
    expect(
      map([
        "firma adi",
        "TELEFON",
        "E-Posta",
        "Billing City",
        "owner",
        "Faturalama Adresi - Şehir",
      ]),
    ).toEqual(["Account_Name", "Phone", "Email", "Billing_City", "Owner", null]);
  });
  it("leaves unknown columns unmapped and maps record ids once", () => {
    expect(map(["Kayıt Id", "Bilinmeyen", "Record Id", "Phone"])).toEqual([
      "id",
      null,
      null,
      "Phone",
    ]);
  });
  it("keeps the first of two columns for one field", () => {
    expect(map(["Telefon", "Phone"])).toEqual(["Phone", null]);
    expect(map(["Fatura Adresi Şehir", "Fatura Adresi Şehir (2)"])).toEqual(["Billing_City", null]);
  });
  it("prefers the companion id column of a reference field", () => {
    expect(map(["Kayıt Sahibi", "Kayıt Sahibi Id"])).toEqual([null, "Owner"]);
    expect(map(["Kayıt Sahibi"])).toEqual(["Owner"]);
  });
  it("does not guess between fields that share an alias", () => {
    const shared = [
      { apiName: "A", label: "Adı", type: "text" },
      { apiName: "B", label: "Adı", type: "text" },
    ];
    expect(suggestMapping(["Adı"], shared).map((item) => item.field)).toEqual([null]);
  });
});

describe("matchPicklistOption", () => {
  const options = [
    { displayValue: "Online Store", storedValue: "OnlineStore" },
    { displayValue: "Cold Call", storedValue: "ColdCall" },
  ];
  it("tolerates case, spaces and punctuation", () => {
    expect(matchPicklistOption(options, "online store")?.storedValue).toBe("OnlineStore");
    expect(matchPicklistOption(options, "COLD-CALL")?.storedValue).toBe("ColdCall");
    expect(matchPicklistOption(options, "OnlineStore")?.storedValue).toBe("OnlineStore");
  });
  it("accepts extra labels and rejects unknown or ambiguous values", () => {
    const extra = (option: { storedValue: string }) =>
      option.storedValue === "ColdCall" ? ["Soğuk Arama"] : [];
    expect(matchPicklistOption(options, "soguk arama", extra)?.storedValue).toBe("ColdCall");
    expect(matchPicklistOption(options, "Other")).toBeUndefined();
    expect(
      matchPicklistOption(
        [
          { displayValue: "A b", storedValue: "x" },
          { displayValue: "ab", storedValue: "y" },
        ],
        "AB",
      ),
    ).toBeUndefined();
  });
});
