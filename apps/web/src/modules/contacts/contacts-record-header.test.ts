import { expect, test } from "vitest";
import { contactLookupName, contactsRecordHeaderIdentity } from "./contacts-record-header";
import { contactRecord } from "./test-metadata";

test("builds a salutation and name without coercing unavailable lookup values", () => {
  expect(
    contactsRecordHeaderIdentity(
      contactRecord({ Salutation: "Dr.", Full_Name: "Sample Person", Account_Name: "sample-id" }),
    ),
  ).toEqual({ title: "Dr. Sample Person" });
  expect(
    contactsRecordHeaderIdentity(
      contactRecord({ Salutation: "-None-", First_Name: "Sample", Last_Name: "Person" }),
    ),
  ).toEqual({ title: "Sample Person" });
});
test.each([null, undefined, "sample-id", 12, true, { id: "sample-id" }, { name: 12 }])(
  "ignores unavailable lookup display names %#",
  (value) => {
    expect(contactLookupName(value)).toBe("");
  },
);
test("reads a future lookup name without requiring a service type migration", () => {
  const reference = { module: "Accounts", id: "sample-account", name: "Sample Account" };
  expect(contactLookupName(reference)).toBe("Sample Account");
  expect(
    contactsRecordHeaderIdentity(
      contactRecord({ Full_Name: "Sample Person", Account_Name: reference }),
    ),
  ).toEqual({ title: "Sample Person", subtitle: "Sample Account", subtitleLaterModule: "M3" });
});
