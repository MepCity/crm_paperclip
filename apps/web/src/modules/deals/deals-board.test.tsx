import type { ModuleMetadata, RecordData } from "@crm/core/records";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import {
  buildDealCardRows,
  buildDealsBoardProps,
  buildOptimisticDealCard,
  dealsBoardToolbar,
  formatClosingDate,
  isOverdueClosingDate,
} from "./deals-board";
import { dealMetadata } from "./test-metadata";

const sampleMetadata: ModuleMetadata = dealMetadata([
  {
    apiName: "Deal_Name",
    label: "Deal Name",
    dataType: "text",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Stage",
    label: "Stage",
    dataType: "picklist",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: true,
    picklist: [
      {
        displayValue: "Qualification",
        storedValue: "Qualification",
        stage: { probability: 10, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Needs Analysis",
        storedValue: "Needs Analysis",
        stage: { probability: 20, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Value Proposition",
        storedValue: "Value Proposition",
        stage: { probability: 40, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Identify Decision Makers",
        storedValue: "Id. Decision Makers",
        stage: { probability: 60, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Proposal/Price Quote",
        storedValue: "Proposal/Price Quote",
        stage: { probability: 75, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Negotiation/Review",
        storedValue: "Negotiation/Review",
        stage: { probability: 90, category: "Open", forecastCategory: "Pipeline" },
      },
      {
        displayValue: "Closed Won",
        storedValue: "Closed Won",
        stage: { probability: 100, category: "Closed Won", forecastCategory: "Closed" },
      },
      {
        displayValue: "Closed Lost",
        storedValue: "Closed Lost",
        stage: { probability: 0, category: "Closed Lost", forecastCategory: "Omitted" },
      },
      {
        displayValue: "Closed Lost to Competition",
        storedValue: "Closed Lost to Competition",
        stage: { probability: 0, category: "Closed Lost", forecastCategory: "Omitted" },
      },
    ],
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Amount",
    label: "Amount",
    dataType: "currency",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Closing_Date",
    label: "Closing Date",
    dataType: "date",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Account_Name",
    label: "Account Name",
    dataType: "lookup",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Contact_Name",
    label: "Contact Name",
    dataType: "lookup",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Owner",
    label: "Deal Owner",
    dataType: "ownerlookup",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
]);

const stageDisplayMap: Record<string, string> = {
  Qualification: "Qualification",
  "Needs Analysis": "Needs Analysis",
  "Value Proposition": "Value Proposition",
  "Id. Decision Makers": "Identify Decision Makers",
  "Proposal/Price Quote": "Proposal/Price Quote",
  "Negotiation/Review": "Negotiation/Review",
  "Closed Won": "Closed Won",
  "Closed Lost": "Closed Lost",
  "Closed Lost to Competition": "Closed Lost to Competition",
};

const ownerNames = {
  "user-1": "Alice Smith",
  "user-2": "Bob Jones",
};

describe("formatClosingDate", () => {
  test("formats YYYY-MM-DD to dd.MM.yyyy", () => {
    expect(formatClosingDate("2026-06-15")).toBe("15.06.2026");
    expect(formatClosingDate("2026-12-31")).toBe("31.12.2026");
    expect(formatClosingDate("2026-01-05T12:00:00.000Z")).toBe("05.01.2026");
  });

  test("handles empty or invalid inputs", () => {
    expect(formatClosingDate("")).toBe("");
    expect(formatClosingDate("  ")).toBe("");
  });
});

describe("buildDealCardRows", () => {
  test("builds all 7 rows in exact order with links when all fields are populated", () => {
    const deal: RecordData = {
      id: "deal-101",
      fields: {
        Deal_Name: "Big Deal",
        Stage: "Qualification",
        Account_Name: { id: "acc-1", name: "Acme Corp", module: "Accounts" },
        Owner: "user-1",
        Contact_Name: { id: "con-1", name: "John Doe", module: "Contacts" },
        Amount: 50000,
        Closing_Date: "2026-08-20",
      },
    };

    const rows = buildDealCardRows(deal, stageDisplayMap, ownerNames, "test-org", {
      now: new Date(2026, 7, 20),
    });
    expect(rows).toEqual([
      { text: "Big Deal", href: "/crm/test-org/tab/Deals/deal-101", strong: true },
      { text: "Qualification" },
      { text: "Acme Corp", href: "/crm/test-org/tab/Accounts/acc-1" },
      { text: "Alice Smith" },
      { text: "John Doe", href: "/crm/test-org/tab/Contacts/con-1" },
      { text: "TRY\u00A050,000.00" },
      { text: "20.08.2026" },
    ]);
  });

  test("uses mapped display value for stage", () => {
    const deal: RecordData = {
      id: "deal-102",
      fields: {
        Deal_Name: "Enterprise Deal",
        Stage: "Id. Decision Makers",
      },
    };

    const rows = buildDealCardRows(deal, stageDisplayMap, ownerNames, "test-org");
    expect(rows[1]).toEqual({ text: "Identify Decision Makers" });
  });

  test("omits empty fields without creating empty row placeholders", () => {
    const deal: RecordData = {
      id: "deal-103",
      fields: {
        Deal_Name: "Minimal Deal",
        Stage: "Needs Analysis",
        Account_Name: null,
        Owner: null,
        Contact_Name: null,
        Amount: null,
        Closing_Date: null,
      },
    };

    const rows = buildDealCardRows(deal, stageDisplayMap, ownerNames, "test-org");
    expect(rows).toEqual([
      { text: "Minimal Deal", href: "/crm/test-org/tab/Deals/deal-103", strong: true },
      { text: "Needs Analysis" },
    ]);
  });
});

describe("buildDealsBoardProps", () => {
  test("builds 9 columns matching metadata picklist order with formatted counts, percentages, and sums", () => {
    const deals: RecordData[] = [
      {
        id: "d1",
        fields: {
          Deal_Name: "Deal 1",
          Stage: "Qualification",
          Amount: 1000,
        },
      },
      {
        id: "d2",
        fields: {
          Deal_Name: "Deal 2",
          Stage: "Qualification",
          Amount: 2000,
        },
      },
      {
        id: "d3",
        fields: {
          Deal_Name: "Deal 3",
          Stage: "Closed Won",
          Amount: 5000,
        },
      },
    ];

    const props = buildDealsBoardProps({
      records: deals,
      metadata: sampleMetadata,
      orgSlug: "test-org",
      ownerNames,
    });

    expect(props.columns).toHaveLength(9);
    expect(props.columns.map((c) => c.key)).toEqual([
      "Qualification",
      "Needs Analysis",
      "Value Proposition",
      "Id. Decision Makers",
      "Proposal/Price Quote",
      "Negotiation/Review",
      "Closed Won",
      "Closed Lost",
      "Closed Lost to Competition",
    ]);

    // Check Qualification column
    const qualCol = props.columns[0];
    if (!qualCol) throw new Error("Expected qualCol");
    expect(qualCol.label).toBe("Qualification");
    expect(qualCol.count).toBe(2);
    expect(qualCol.percentage).toBe("10%");
    expect(qualCol.totalText).toBe("TRY\u00A03,000.00");
    expect(qualCol.cards).toHaveLength(2);

    // Check Needs Analysis column (empty)
    const needsCol = props.columns[1];
    if (!needsCol) throw new Error("Expected needsCol");
    expect(needsCol.label).toBe("Needs Analysis");
    expect(needsCol.count).toBe(0);
    expect(needsCol.percentage).toBe("20%");
    expect(needsCol.totalText).toBe("TRY\u00A00.00");
    expect(needsCol.cards).toHaveLength(0);

    // Check Closed Won column
    const wonCol = props.columns[6];
    if (!wonCol) throw new Error("Expected wonCol");
    expect(wonCol.label).toBe("Closed Won");
    expect(wonCol.count).toBe(1);
    expect(wonCol.percentage).toBe("100%");
    expect(wonCol.totalText).toBe("TRY\u00A05,000.00");
  });
});

describe("dealsBoardToolbar", () => {
  test("renders STAGEVIEW select and settings button", () => {
    render(<div>{dealsBoardToolbar}</div>);
    const select = screen.getByRole("combobox", { name: "Board grouping" }) as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe("STAGEVIEW");
    expect(screen.getByRole("button", { name: "Board settings" })).toBeTruthy();
  });
});

describe("overdue Closing Date", () => {
  const now = new Date(2026, 8, 20, 12, 0, 0);
  const closed = new Set(["Closed Won"]);
  const dealOn = (date: string, stage: string): RecordData => ({
    id: "d1",
    fields: { Deal_Name: "X", Stage: stage, Closing_Date: date },
  });
  const lastRow = (date: string, stage: string) => {
    const rows = buildDealCardRows(dealOn(date, stage), stageDisplayMap, ownerNames, "o", {
      closedStages: closed,
      now,
    });
    return rows[rows.length - 1];
  };

  test("past date in an open stage is danger, today and later are plain", () => {
    expect(lastRow("2026-09-19", "Qualification")).toEqual({
      text: "19.09.2026",
      tone: "danger",
    });
    expect(lastRow("2026-09-20", "Qualification")).toEqual({ text: "20.09.2026" });
    expect(lastRow("2026-09-21", "Qualification")).toEqual({ text: "21.09.2026" });
  });

  test("past date in a closed stage stays plain", () => {
    expect(lastRow("2026-01-01", "Closed Won")).toEqual({ text: "01.01.2026" });
    expect(isOverdueClosingDate("2026-01-01", true, now)).toBe(false);
  });
});

test("supplies the module-owned optimistic builder and preserves non-stage rows", () => {
  const props = buildDealsBoardProps({
    records: [],
    metadata: sampleMetadata,
    orgSlug: "example",
    ownerNames: {},
  });
  expect(props.buildOptimisticCard).toBe(buildOptimisticDealCard);
  const card = {
    id: "example",
    rows: [
      { text: "Example", href: "#example" },
      { text: "Qualification" },
      { text: "15.10.2026", tone: "danger" as const },
    ],
  };
  const updated = props.buildOptimisticCard?.(card, {
    key: "next",
    label: "Next stage",
    count: 0,
    cards: [],
  });
  expect(updated?.rows).toEqual([card.rows[0], { text: "Next stage" }, card.rows[2]]);
  expect(card.rows[1]?.text).toBe("Qualification");
});
