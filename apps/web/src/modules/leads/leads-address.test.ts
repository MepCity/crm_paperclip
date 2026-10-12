import { describe, expect, it } from "vitest";
import { formatLeadsCompositeAddress } from "./leads-address";

describe("formatLeadsCompositeAddress", () => {
  it("joins populated sub-fields in form order", () => {
    expect(
      formatLeadsCompositeAddress({
        Country: "United States",
        Street: "100 Market St",
        City: "Springfield",
        State: "IL",
        Zip_Code: "62701",
        Flat_House_No_Building_Apartment_Name: "",
      }),
    ).toBe("United States, 100 Market St, Springfield, IL, 62701");
  });

  it("returns an empty string when no sub-fields are set", () => {
    expect(formatLeadsCompositeAddress({ Country: null, Street: "" })).toBe("");
  });
});
