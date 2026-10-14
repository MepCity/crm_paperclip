import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { DealsContactPersonSummary } from "./deals-contact-person-summary";

const contact: RecordData = {
  id: "contact-1",
  fields: { Full_Name: "Ada Test", Email: "ada@example.test" },
} as unknown as RecordData;

vi.mock("@/lib/api/client/hooks", () => ({
  useRecord: () => ({ data: contact, isLoading: false }),
}));

afterEach(cleanup);

test("renders the Contact Person title above the summary", () => {
  const deal = {
    id: "deal-1",
    fields: { Contact_Name: { module: "Contacts", id: "contact-1", name: "Ada Test" } },
  } as unknown as RecordData;
  render(
    <DealsContactPersonSummary
      dealRecord={deal}
      contactRecordPath={(id) => `/c/${id}`}
      accountRecordPath={(id) => `/a/${id}`}
    />,
  );
  expect(screen.getByRole("heading", { name: "Contact Person" })).toBeTruthy();
  expect(screen.getByText("Ada Test")).toBeTruthy();
});
