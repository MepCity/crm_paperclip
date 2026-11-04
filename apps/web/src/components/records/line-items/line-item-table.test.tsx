// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LineItemEditor } from "./line-item-editor";
import { EMPTY_HEADER, emptyRow } from "./line-item-model";
import { LineItemTable } from "./line-item-table";

afterEach(cleanup);

describe("line item views", () => {
  it("shows stored values read-only", () => {
    render(
      <LineItemTable
        title="Quoted Items"
        items={[
          {
            id: "1",
            Sequence_Number: 1,
            Product_Name: { name: "Widget" },
            Quantity: 2,
            List_Price: 100,
            Total: 200,
            Discount: 20,
            Tax: 36,
            Net_Total: 216,
          },
        ]}
        totals={{ Sub_Total: 216, Discount: 0, Tax: 0, Adjustment: 0, Grand_Total: 216 }}
      />,
    );
    expect(screen.getByText("Widget")).toBeTruthy();
    expect(document.querySelector('[data-total="grand"]')?.textContent).toBe("216,00");
  });

  it("editor adds and removes rows and shows live grand total", () => {
    const calls: unknown[] = [];
    const row = {
      ...emptyRow(),
      product: { module: "Products", id: "p", name: "W" },
      listPrice: "10",
      quantity: "3",
    };
    render(
      <LineItemEditor
        title="Quoted Items"
        rows={[row]}
        header={EMPTY_HEADER}
        onRowsChange={(next) => calls.push(next)}
        onHeaderChange={() => {}}
      />,
    );
    expect(document.querySelector('[data-total="grand"]')?.textContent).toBe("30,00");
    screen.getByText("Add row").click();
    screen.getByLabelText("Delete row 1").click();
    expect((calls[0] as unknown[]).length).toBe(2);
    expect((calls[1] as unknown[]).length).toBe(0);
  });
});
