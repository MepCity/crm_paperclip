import { describe, expect, it } from "vitest";
import {
  addressSubfieldApiName,
  addressSubfieldApiNames,
  formatCompositeAddress,
} from "./composite-address";

describe("addressSubfieldApiName", () => {
  it("maps Leads Address parent to unprefixed sub-fields", () => {
    expect(addressSubfieldApiName("Address", "Country")).toBe("Country");
    expect(addressSubfieldApiName("Address", "Street")).toBe("Street");
  });

  it("maps Contacts-style parents to prefixed sub-fields", () => {
    expect(addressSubfieldApiName("Mailing_Address", "Country")).toBe("Mailing_Country");
    expect(addressSubfieldApiName("Other_Address", "Zip_Code")).toBe("Other_Zip");
    expect(addressSubfieldApiNames("Mailing_Address")).toContain("Mailing_Zip");
  });
});

describe("formatCompositeAddress", () => {
  it("joins populated sub-fields in display order", () => {
    expect(
      formatCompositeAddress("Address", {
        Country: "United States",
        Street: "100 Market St",
        City: "Springfield",
        State: "IL",
        Zip_Code: "62701",
        Flat_House_No_Building_Apartment_Name: "",
      }),
    ).toBe("United States, 100 Market St, Springfield, IL, 62701");
  });

  it("formats each parent independently", () => {
    expect(
      formatCompositeAddress("Mailing_Address", {
        Mailing_Country: "Canada",
        Mailing_City: "Toronto",
      }),
    ).toBe("Canada, Toronto");
  });
});
