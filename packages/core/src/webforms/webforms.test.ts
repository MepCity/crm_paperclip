import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import {
  getEligibleFieldsForModule,
  isFieldEligible,
  MAX_LOCATIONS_PER_FORM,
  normalizeOrigin,
  validateForPublish,
  webformFieldSchema,
  webformSettingsSchema,
} from "./index";
import type { WebformField, WebformSettings } from "./types";

describe("Webforms core validation", () => {
  describe("field eligibility", () => {
    it("accepts supported creatable types and rejects system and readOnly fields", () => {
      expect(isFieldEligible({ apiName: "Last_Name", dataType: "text" })).toBe(true);
      expect(isFieldEligible({ apiName: "Email", dataType: "email" })).toBe(true);
      expect(isFieldEligible({ apiName: "Phone", dataType: "phone" })).toBe(true);
      expect(isFieldEligible({ apiName: "Website", dataType: "website" })).toBe(true);
      expect(isFieldEligible({ apiName: "Annual_Revenue", dataType: "currency" })).toBe(true);
      expect(isFieldEligible({ apiName: "No_of_Employees", dataType: "integer" })).toBe(true);
      expect(isFieldEligible({ apiName: "Email_Opt_Out", dataType: "boolean" })).toBe(true);
      expect(isFieldEligible({ apiName: "Lead_Source", dataType: "picklist" })).toBe(true);

      // System fields rejected
      expect(isFieldEligible({ apiName: "id", dataType: "text" })).toBe(false);
      expect(isFieldEligible({ apiName: "Created_By", dataType: "text" })).toBe(false);
      expect(isFieldEligible({ apiName: "Modified_By", dataType: "text" })).toBe(false);
      expect(isFieldEligible({ apiName: "Created_Time", dataType: "datetime" })).toBe(false);
      expect(isFieldEligible({ apiName: "Modified_Time", dataType: "datetime" })).toBe(false);
      expect(isFieldEligible({ apiName: "Owner", dataType: "ownerlookup" })).toBe(false);
      expect(isFieldEligible({ apiName: "Record_Image", dataType: "profileimage" })).toBe(false);

      // readOnly or non-creatable views rejected
      expect(isFieldEligible({ apiName: "Formula_Field", dataType: "text", readOnly: true })).toBe(
        false,
      );
      expect(
        isFieldEligible({ apiName: "System_Field", dataType: "text", views: { create: false } }),
      ).toBe(false);
    });

    it("extracts eligible fields for Leads, Contacts, and Cases from module projections", () => {
      const leadsFields = getEligibleFieldsForModule("Leads");
      expect(leadsFields.length).toBeGreaterThan(5);
      expect(leadsFields.some((f) => f.apiName === "Last_Name" && f.required)).toBe(true);
      expect(leadsFields.some((f) => f.apiName === "Company" && f.required)).toBe(true);
      expect(leadsFields.every((f) => f.apiName !== "id" && f.apiName !== "Created_By")).toBe(true);

      const contactsFields = getEligibleFieldsForModule("Contacts");
      expect(contactsFields.length).toBeGreaterThan(5);
      expect(contactsFields.some((f) => f.apiName === "Last_Name" && f.required)).toBe(true);

      const casesFields = getEligibleFieldsForModule("Cases");
      expect(casesFields.length).toBeGreaterThan(5);
      expect(casesFields.some((f) => f.apiName === "Case_Number" && f.readOnly)).toBe(false);
    });
  });

  describe("origin normalization", () => {
    it("normalizes https origins removing path, query, hash and lowercases host", () => {
      expect(normalizeOrigin("https://Example.COM/some/path?query=1#hash")).toBe(
        "https://example.com",
      );
      expect(normalizeOrigin("https://SUB.DOMAIN.ORG:8080/")).toBe("https://sub.domain.org:8080");
    });

    it("rejects non-https origins and malformed URLs", () => {
      expect(() => normalizeOrigin("http://example.com")).toThrow(ValidationError);
      expect(() => normalizeOrigin("ftp://example.com")).toThrow(ValidationError);
      expect(() => normalizeOrigin("not-a-url")).toThrow(ValidationError);
    });

    it("respects max 20 locations per form limit constant", () => {
      expect(MAX_LOCATIONS_PER_FORM).toBe(20);
    });
  });

  describe("publish validation", () => {
    const requiredEligible = [
      { apiName: "Last_Name", label: "Last Name", dataType: "text", required: true },
      { apiName: "Company", label: "Company", dataType: "text", required: true },
      { apiName: "Email", label: "Email", dataType: "email", required: false },
    ];

    const validFields: WebformField[] = [
      { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
      { fieldApiName: "Company", label: "Company", required: true, hidden: false },
      { fieldApiName: "Email", label: "Email", required: false, hidden: false },
    ];

    const baseSettings: WebformSettings = {
      buttonLabel: "Submit",
      ownerKind: "user",
      ownerRef: "user-1",
      notifyOwner: true,
      acknowledgement: { kind: "message", text: "Thanks!" },
      challenge: false,
      restrictLocations: false,
      captureAttribution: true,
      approval: "none",
      doubleOptIn: false,
    };

    it("passes when all layout-required fields are present and required", () => {
      expect(() =>
        validateForPublish({
          fields: validFields,
          settings: baseSettings,
          locations: [],
          eligibleFields: requiredEligible,
        }),
      ).not.toThrow();
    });

    it("rejects publish when a layout-required field is missing", () => {
      const missingFields = validFields.filter((f) => f.fieldApiName !== "Company");
      expect(() =>
        validateForPublish({
          fields: missingFields,
          settings: baseSettings,
          locations: [],
          eligibleFields: requiredEligible,
        }),
      ).toThrow(ValidationError);
    });

    it("rejects publish when a layout-required field is not marked required", () => {
      const unrequiredFields = validFields.map((f) =>
        f.fieldApiName === "Company" ? { ...f, required: false } : f,
      );
      expect(() =>
        validateForPublish({
          fields: unrequiredFields,
          settings: baseSettings,
          locations: [],
          eligibleFields: requiredEligible,
        }),
      ).toThrow(ValidationError);
    });

    it("validates redirect URL: must be https and its origin must be in the location allowlist", () => {
      const settingsWithRedirect: WebformSettings = {
        ...baseSettings,
        acknowledgement: { kind: "redirect", url: "https://shop.example.com/thank-you" },
      };

      // Missing from allowlist
      expect(() =>
        validateForPublish({
          fields: validFields,
          settings: settingsWithRedirect,
          locations: [{ origin: "https://other.com" }],
          eligibleFields: requiredEligible,
        }),
      ).toThrow(ValidationError);

      // Present in allowlist
      expect(() =>
        validateForPublish({
          fields: validFields,
          settings: settingsWithRedirect,
          locations: [{ origin: "https://shop.example.com" }],
          eligibleFields: requiredEligible,
        }),
      ).not.toThrow();

      // Non-https redirect
      expect(() =>
        validateForPublish({
          fields: validFields,
          settings: {
            ...baseSettings,
            acknowledgement: { kind: "redirect", url: "http://shop.example.com/thank-you" },
          },
          locations: [{ origin: "https://shop.example.com" }],
          eligibleFields: requiredEligible,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("Zod schema contracts", () => {
    it("validates webformFieldSchema", () => {
      expect(
        webformFieldSchema.parse({
          fieldApiName: "Email",
          label: "Email Address",
          required: true,
          hidden: false,
        }),
      ).toMatchObject({
        fieldApiName: "Email",
        label: "Email Address",
        required: true,
        hidden: false,
        helpText: "",
      });
    });

    it("validates webformSettingsSchema with defaults", () => {
      const parsed = webformSettingsSchema.parse({});
      expect(parsed).toEqual({
        buttonLabel: "Submit",
        ownerKind: "user",
        ownerRef: "",
        notifyOwner: false,
        acknowledgement: { kind: "message", text: "Thank you for your submission." },
        challenge: false,
        restrictLocations: false,
        captureAttribution: true,
        approval: "none",
        doubleOptIn: false,
      });
    });
  });
});
