import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { DealsSalesSummary } from "./deals-sales-summary";

afterEach(cleanup);

test("renders label: value lines with NA for empty values", () => {
  const record = {
    id: "1",
    fields: { Sales_Cycle_Duration: 1 },
  } as unknown as Parameters<typeof DealsSalesSummary>[0]["record"];
  render(<DealsSalesSummary record={record} />);
  expect(screen.getByText("Lead Conversion Time: NA")).toBeTruthy();
  expect(screen.getByText("Sales Cycle Duration: 1 day(s)")).toBeTruthy();
});
