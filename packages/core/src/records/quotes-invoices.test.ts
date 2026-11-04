import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { describeRecordServiceContract } from "./contract-suite";
import {
  invoicesRecordServiceContractModule,
  productsRecordServiceContractModule,
  quotesRecordServiceContractModule,
} from "./contract-suite-module";
import { createFixtureRecordService } from "./fixture";
import { computeLineItemTotals, productLineDefaults } from "./line-items";
import { listOrganisationTaxes } from "./tax";

const make = () =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "quotes-test",
      orgName: "Synthetic organization",
      userId: "test-user",
      role: "admin",
    },
    { now: () => new Date("2026-11-04T12:00:00Z") },
  );

for (const definition of [
  productsRecordServiceContractModule,
  quotesRecordServiceContractModule,
  invoicesRecordServiceContractModule,
])
  describeRecordServiceContract(
    `${definition.apiName} fixture`,
    createFixtureRecordService,
    definition,
  );

const product = { module: "Products", id: "310000000000000001" };
const vat = { name: "Vat" };

describe("computeLineItemTotals", () => {
  it("computes amount and percent discounts, line taxes and header totals", () => {
    const totals = computeLineItemTotals(
      [
        { Product_Name: product, Quantity: 3, List_Price: 33.33, Discount: 9.99, Line_Tax: [vat] },
        { Product_Name: product, Quantity: 1, List_Price: 100, Discount_Percentage: 15 },
      ],
      { Discount: 10, Header_Tax: [{ name: "Vat", percentage: 20 }], Adjustment: -5 },
    );
    expect(totals.lines[0]).toMatchObject({
      Total: 99.99,
      Discount: 9.99,
      Total_After_Discount: 90,
      Tax: 18,
      Net_Total: 108,
    });
    expect(totals.lines[1]).toMatchObject({
      Discount: 15,
      Total_After_Discount: 85,
      Net_Total: 85,
    });
    expect(totals.Sub_Total).toBe(193);
    expect(totals.Tax).toBe(36.6); // (193 - 10) * 20 %
    expect(totals.Grand_Total).toBe(214.6); // 193 - 10 + 36.6 - 5
  });
  it("rounds at each step and sums several line taxes", () => {
    const totals = computeLineItemTotals([
      {
        Product_Name: product,
        Quantity: 1.5,
        List_Price: 0.99,
        Line_Tax: [vat, { name: "Sales Tax" }],
      },
    ]);
    expect(totals.lines[0]?.Total).toBe(1.49); // 1.485 rounds up
    expect(totals.lines[0]?.Line_Tax.map((tax) => tax.value)).toEqual([0.3, 0]);
    expect(totals.lines[0]?.Net_Total).toBe(1.79);
  });
  it("keeps a percent discount when the quantity changes", () => {
    const row = { Product_Name: product, List_Price: 10, Discount_Percentage: 50 };
    expect(computeLineItemTotals([{ ...row, Quantity: 2 }]).lines[0]?.Discount).toBe(10);
    expect(computeLineItemTotals([{ ...row, Quantity: 4 }]).lines[0]?.Discount).toBe(20);
  });
  it.each([
    [{ Quantity: 0, List_Price: 1 }, "Quoted_Items[0].Quantity"],
    [{ Quantity: 1.234, List_Price: 1 }, "Quoted_Items[0].Quantity"],
    [{ Quantity: 1, List_Price: -1 }, "Quoted_Items[0].List_Price"],
    [{ Quantity: 1, List_Price: 5, Discount: 6 }, "Quoted_Items[0].Discount"],
    [
      { Quantity: 1, List_Price: 5, Discount_Percentage: 101 },
      "Quoted_Items[0].Discount_Percentage",
    ],
  ])("rejects out-of-bounds row %j", (row, key) => {
    try {
      computeLineItemTotals([{ Product_Name: product, ...row }]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(Object.keys((error as ValidationError).fieldErrors ?? {})).toContain(key);
    }
  });
  it("rejects a header discount above the sub total and bad row counts", () => {
    const line = { Product_Name: product, Quantity: 1, List_Price: 10 };
    expect(() => computeLineItemTotals([line], { Discount: 11 })).toThrow(ValidationError);
    expect(() => computeLineItemTotals([])).toThrow(ValidationError);
    expect(() => computeLineItemTotals(Array(201).fill(line))).toThrow(ValidationError);
  });
  it("fills line defaults from a product", () => {
    const row = productLineDefaults(
      {
        id: "p1",
        Product_Name: "P",
        Unit_Price: 12,
        Taxable: true,
        Tax: ["Vat"],
        Description: "d",
      },
      { Quantity: 5, Discount: 1 },
    );
    expect(row).toMatchObject({ List_Price: 12, Quantity: 5, Discount: 1, Description: "d" });
    expect(row.Line_Tax).toEqual([{ name: "Vat", percentage: 20 }]);
    expect(productLineDefaults({ id: "p", Product_Name: "P", Taxable: false }).Line_Tax).toEqual(
      [],
    );
  });
  it("lists the organisation taxes", () => {
    expect(listOrganisationTaxes().map((tax) => tax.name)).toEqual(["Sales Tax", "Vat"]);
  });
});

describe("Quotes and Invoices", () => {
  it("seeds 30/40/30 records", async () => {
    const service = make();
    expect(await service.count("Products", { viewId: "all-products" })).toBe(30);
    expect(await service.count("Quotes", { viewId: "all-quotes" })).toBe(40);
    expect(await service.count("Invoices", { viewId: "all-invoices" })).toBe(30);
  });
  it("recomputes formulas on create, ignores client formulas, assigns row ids", async () => {
    const service = make();
    const created = await service.create("Quotes", {
      Subject: "Q",
      Sub_Total: 999,
      Grand_Total: 999,
      Quoted_Items: [
        {
          Product_Name: product,
          Quantity: 2,
          List_Price: 50,
          Total: 1,
          Net_Total: 1,
          Line_Tax: [vat],
        },
      ],
    });
    const rows = created.fields.Quoted_Items as unknown as Record<string, unknown>[];
    expect(rows[0]).toMatchObject({ Sequence_Number: 1, Total: 100, Tax: 20, Net_Total: 120 });
    expect(typeof rows[0]?.id).toBe("string");
    expect(created.fields.Sub_Total).toBe(120);
    expect(created.fields.Grand_Total).toBe(120);
    expect(created.fields.Quote_Number).toBeTruthy();
    const updated = await service.update("Quotes", created.id, { Adjustment: 5, Discount: 20 });
    expect(updated.fields.Grand_Total).toBe(105);
    const replaced = await service.update("Quotes", created.id, {
      Discount: 0,
      Quoted_Items: [{ Product_Name: product, Quantity: 1, List_Price: 10 }],
    });
    expect((replaced.fields.Quoted_Items as unknown[]).length).toBe(1);
  });
  it("rejects missing lines, unknown products and unknown taxes", async () => {
    const service = make();
    await expect(
      service.create("Quotes", { Subject: "Q", Quoted_Items: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(service.create("Quotes", { Subject: "Q" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      service.create("Quotes", {
        Subject: "Q",
        Quoted_Items: [
          { Product_Name: { module: "Products", id: "nope" }, Quantity: 1, List_Price: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create("Invoices", {
        Subject: "I",
        Invoiced_Items: [
          { Product_Name: product, Quantity: 1, List_Price: 1, Line_Tax: [{ name: "Nope" }] },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it("accepts only listed Products.Tax values", async () => {
    const service = make();
    await expect(
      service.create("Products", { Product_Name: "X", Tax: ["Vat"] }),
    ).resolves.toBeTruthy();
    await expect(
      service.create("Products", { Product_Name: "X", Tax: ["Nope"] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it("converts a quote to an invoice atomically and leaves the quote unchanged", async () => {
    const service = make();
    const created = await service.create("Quotes", {
      Subject: "Convertible",
      Description: "d",
      Discount: 10,
      Adjustment: 2,
      Quoted_Items: [{ Product_Name: product, Quantity: 2, List_Price: 50, Line_Tax: [vat] }],
    });
    const before = await service.get("Quotes", created.id);
    const invoiceCount = await service.count("Invoices", { viewId: "all-invoices" });
    const invoiceId = await service.convertQuoteToInvoice(created.id);
    const invoice = await service.get("Invoices", invoiceId);
    expect(await service.count("Invoices", { viewId: "all-invoices" })).toBe(invoiceCount + 1);
    expect(invoice.fields).toMatchObject({
      Subject: "Convertible",
      Description: "d",
      Status: "Created",
      Invoice_Date: "2026-11-04",
      Sub_Total: 120,
      Discount: 10,
      Adjustment: 2,
      Grand_Total: 112,
    });
    const quoteRows = before.fields.Quoted_Items as unknown as { id: string }[];
    const invoiceRows = invoice.fields.Invoiced_Items as unknown as {
      id: string;
      Net_Total: number;
    }[];
    expect(invoiceRows).toHaveLength(1);
    expect(invoiceRows[0]?.Net_Total).toBe(120);
    expect(invoiceRows[0]?.id).not.toBe(quoteRows[0]?.id);
    expect(await service.get("Quotes", created.id)).toEqual(before);
  });
  it("filters quotes by account and by contained product", async () => {
    const service = make();
    const byProduct = await service.list("Quotes", {
      viewId: "all-quotes",
      page: 1,
      perPage: 100,
      filters: {
        field: "Quoted_Items.Product_Name",
        comparator: "equal",
        value: "310000000000000000",
      },
    });
    expect(byProduct.records.length).toBeGreaterThan(0);
    for (const record of byProduct.records)
      expect(JSON.stringify(record.fields.Quoted_Items)).toContain("310000000000000000");
  }, 30_000);
});
