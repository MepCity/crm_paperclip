import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import {
  computeClientHash,
  createRenderToken,
  derivePublicKey,
  generateChallenge,
  getAppSecret,
  getClientIp,
  getEligibleFieldsForModule,
  hashPublicKey,
  isFieldEligible,
  MAX_LOCATIONS_PER_FORM,
  normalizeOrigin,
  resolveLocation,
  validateForPublish,
  verifyChallenge,
  verifyRenderToken,
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

  describe("Render tokens and HMAC security (§3.2, §3.5)", () => {
    const payload = {
      orgId: "org-123",
      formId: "form-456",
      versionId: "ver-789",
      issuedAt: 1700000000000,
    };

    it("creates and verifies a valid render token", () => {
      const token = createRenderToken(payload);
      expect(typeof token).toBe("string");
      expect(token.includes(".")).toBe(true);

      const verified = verifyRenderToken(token);
      expect(verified.ok).toBe(true);
      if (verified.ok) {
        expect(verified.payload.orgId).toBe(payload.orgId);
        expect(verified.payload.formId).toBe(payload.formId);
        expect(verified.payload.versionId).toBe(payload.versionId);
        expect(verified.payload.issuedAt).toBe(payload.issuedAt);
      }
    });

    it("binds challengeHash in render token when present", () => {
      const token = createRenderToken({ ...payload, challengeHash: "ch-hash-abc" });
      const verified = verifyRenderToken(token);
      expect(verified.ok).toBe(true);
      if (verified.ok) {
        expect(verified.payload.challengeHash).toBe("ch-hash-abc");
      }
    });

    it("rejects tampered token signature", () => {
      const token = createRenderToken(payload);
      const [data, sig] = token.split(".");
      const tampered = `${data}.${sig}bad`;
      const verified = verifyRenderToken(tampered);
      expect(verified.ok).toBe(false);
      if (!verified.ok) {
        expect(verified.reason).toBe("tampered");
      }
    });

    it("rejects tampered token payload data", () => {
      const token = createRenderToken(payload);
      const [, sig] = token.split(".");
      const alteredData = Buffer.from(
        JSON.stringify({ ...payload, orgId: "attacker-org" }),
      ).toString("base64url");
      const tampered = `${alteredData}.${sig}`;
      const verified = verifyRenderToken(tampered);
      expect(verified.ok).toBe(false);
      if (!verified.ok) {
        expect(verified.reason).toBe("tampered");
      }
    });

    it("rejects malformed token strings", () => {
      expect(verifyRenderToken("").ok).toBe(false);
      expect(verifyRenderToken("not-a-token").ok).toBe(false);
      expect(verifyRenderToken("part1.part2.part3").ok).toBe(false);
      expect(verifyRenderToken("invalid-base64.signature").ok).toBe(false);
    });

    describe("getAppSecret configuration and fail-closed security", () => {
      it("allows test secret fallback in test environments when APP_SECRET is unset", () => {
        const secret = getAppSecret({ NODE_ENV: "test" });
        expect(secret).toBe("default-webforms-token-secret-at-least-32-chars-long-for-tests");
      });

      it("throws when APP_SECRET is missing in production", () => {
        expect(() => getAppSecret({ NODE_ENV: "production" })).toThrow(/APP_SECRET/);
      });

      it("throws when APP_SECRET is shorter than 32 characters in production", () => {
        expect(() => getAppSecret({ NODE_ENV: "production", APP_SECRET: "short-secret" })).toThrow(
          /at least 32 characters/,
        );
      });

      it("returns configured secret when valid in production", () => {
        const valid = "production-app-secret-with-more-than-32-chars-12345";
        expect(getAppSecret({ NODE_ENV: "production", APP_SECRET: valid })).toBe(valid);
      });
    });
  });

  describe("Challenge generation and verification (§3.5)", () => {
    it("generates challenge code, hash and valid SVG image", () => {
      const { code, challengeHash, svg } = generateChallenge();
      expect(code).toHaveLength(5);
      expect(typeof challengeHash).toBe("string");
      expect(challengeHash.length).toBeGreaterThan(10);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain('role="img"');
    });

    it("verifies challenge answer case-insensitively and trimmed", () => {
      const { code, challengeHash } = generateChallenge();
      expect(verifyChallenge(code, challengeHash)).toBe(true);
      expect(verifyChallenge(code.toLowerCase(), challengeHash)).toBe(true);
      expect(verifyChallenge(`  ${code}  `, challengeHash)).toBe(true);
    });

    it("rejects incorrect challenge answer", () => {
      const { challengeHash } = generateChallenge();
      expect(verifyChallenge("WRONG", challengeHash)).toBe(false);
      expect(verifyChallenge("", challengeHash)).toBe(false);
      expect(verifyChallenge(undefined, challengeHash)).toBe(false);
    });

    it("returns true when challengeHash is undefined (challenge not enabled)", () => {
      expect(verifyChallenge(undefined, undefined)).toBe(true);
      expect(verifyChallenge("", undefined)).toBe(true);
    });
  });

  describe("Client hash and public key hashing (§3.3, §3.5)", () => {
    it("computes client hash via HMAC so raw IP is never stored", () => {
      const hash1 = computeClientHash("203.0.113.195");
      const hash2 = computeClientHash("203.0.113.195");
      const hashDiff = computeClientHash("198.51.100.42");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe("203.0.113.195");
      expect(hash1).not.toBe(hashDiff);
    });

    it("hashes public key via SHA-256 base64url for index lookup", () => {
      const rawKey = "wfk_live_sampleKey123456789";
      const h1 = hashPublicKey(rawKey);
      const h2 = hashPublicKey(rawKey);
      expect(h1).toBe(h2);
      expect(h1).not.toBe(rawKey);
    });

    it("derives deterministic 128-bit public key and matching keyHash", () => {
      const orgId = "11111111-1111-1111-1111-111111111111";
      const formId = "22222222-2222-2222-2222-222222222222";
      const timestamp = new Date("2026-11-09T10:00:00.000Z");

      const derived1 = derivePublicKey(orgId, formId, timestamp);
      const derived2 = derivePublicKey(orgId, formId, timestamp);

      expect(derived1.publicKey).toBe(derived2.publicKey);
      expect(derived1.keyHash).toBe(derived2.keyHash);
      expect(derived1.keyHash).toBe(hashPublicKey(derived1.publicKey));
      expect(derived1.publicKey.length).toBeGreaterThanOrEqual(20);

      // Different timestamp yields a different key (key rotation/regeneration)
      const later = new Date("2026-11-09T11:00:00.000Z");
      const derivedLater = derivePublicKey(orgId, formId, later);
      expect(derivedLater.publicKey).not.toBe(derived1.publicKey);
      expect(derivedLater.keyHash).not.toBe(derived1.keyHash);

      // Different form yields a different key
      const otherFormId = "33333333-3333-3333-3333-333333333333";
      const derivedOther = derivePublicKey(orgId, otherFormId, timestamp);
      expect(derivedOther.publicKey).not.toBe(derived1.publicKey);
    });

    describe("getClientIp proxy handling", () => {
      it("resolves single IP from x-forwarded-for", () => {
        const req = new Request("http://localhost/api/test", {
          headers: { "x-forwarded-for": "203.0.113.195" },
        });
        expect(getClientIp(req)).toBe("203.0.113.195");
      });

      it("selects the rightmost IP from x-forwarded-for when client injects first value", () => {
        const req = new Request("http://localhost/api/test", {
          headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8, 203.0.113.195" },
        });
        expect(getClientIp(req)).toBe("203.0.113.195");
      });

      it("prioritizes rightmost x-forwarded-for over spoofed x-real-ip", () => {
        const req = new Request("http://localhost/api/test", {
          headers: {
            "x-real-ip": "198.51.100.50",
            "x-forwarded-for": "1.2.3.4, 203.0.113.195",
          },
        });
        expect(getClientIp(req)).toBe("203.0.113.195");
      });

      it("uses x-real-ip only when x-forwarded-for is missing or empty", () => {
        const req1 = new Request("http://localhost/api/test", {
          headers: { "x-real-ip": "198.51.100.50" },
        });
        expect(getClientIp(req1)).toBe("198.51.100.50");

        const req2 = new Request("http://localhost/api/test", {
          headers: {
            "x-real-ip": "198.51.100.50",
            "x-forwarded-for": "   ,  ",
          },
        });
        expect(getClientIp(req2)).toBe("198.51.100.50");
      });

      it("falls back to 127.0.0.1 when no IP headers are present", () => {
        const req = new Request("http://localhost/api/test");
        expect(getClientIp(req)).toBe("127.0.0.1");
      });
    });
  });

  describe("Locations and embedding resolution (§3.6)", () => {
    const allowed = [
      {
        organizationId: "org-1",
        formId: "form-1",
        origin: "https://shop.example.com",
        label: "Store",
        createdAt: new Date().toISOString(),
      },
    ];

    it("allows hosted form access as 'hosted'", () => {
      const res = resolveLocation({
        isHostedRoute: true,
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res).toEqual({
        location: "hosted",
        allowed: true,
        isAllowedOrigin: true,
      });
    });

    it("rejects fake hosted referer when origin is foreign and locations are restricted", () => {
      const res = resolveLocation({
        origin: "https://evil.com",
        referer: "https://shop.example.com/f/public-key-123",
        isHostedRoute: true,
        appOrigin: "https://shop.example.com",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(false);
      expect(res.location).toBe("https://evil.com");
      expect(res.isAllowedOrigin).toBe(false);
    });

    it("rejects fake hosted referer on evil domain when origin is omitted and locations are restricted", () => {
      const res = resolveLocation({
        origin: null,
        referer: "https://evil.com/f/public-key-123",
        isHostedRoute: true,
        appOrigin: "https://shop.example.com",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(false);
      expect(res.location).toBe("https://evil.com");
      expect(res.isAllowedOrigin).toBe(false);
    });

    it("allows hosted route when origin and referer match appOrigin", () => {
      const res = resolveLocation({
        origin: "https://shop.example.com",
        referer: "https://shop.example.com/f/public-key-123",
        isHostedRoute: true,
        appOrigin: "https://shop.example.com",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(true);
      expect(res.location).toBe("hosted");
      expect(res.isAllowedOrigin).toBe(true);
    });

    it("allows allowlisted origin when locations are restricted", () => {
      const res = resolveLocation({
        origin: "https://Shop.Example.com",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(true);
      expect(res.location).toBe("https://shop.example.com");
      expect(res.isAllowedOrigin).toBe(true);
    });

    it("rejects foreign origin when locations are restricted", () => {
      const res = resolveLocation({
        origin: "https://malicious-site.com",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(false);
      expect(res.location).toBe("https://malicious-site.com");
      expect(res.isAllowedOrigin).toBe(false);
    });

    it("accepts foreign origin as 'undefined' when locations are unrestricted", () => {
      const res = resolveLocation({
        origin: "https://any-external-site.com",
        restrictLocations: false,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(true);
      expect(res.location).toBe("undefined");
      expect(res.isAllowedOrigin).toBe(false);
    });

    it("falls back to Referer origin when Origin header is omitted", () => {
      const res = resolveLocation({
        referer: "https://shop.example.com/checkout/form?ref=123",
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(true);
      expect(res.location).toBe("https://shop.example.com");
    });

    it("rejects missing origin and referer when locations are restricted", () => {
      const res = resolveLocation({
        restrictLocations: true,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(false);
      expect(res.location).toBe("undefined");
    });

    it("accepts missing origin and referer when locations are unrestricted", () => {
      const res = resolveLocation({
        restrictLocations: false,
        allowedLocations: allowed,
      });
      expect(res.allowed).toBe(true);
      expect(res.location).toBe("undefined");
    });

    it("handles invalid APP_URL without throwing and resolves location from origin", () => {
      const originalAppUrl = process.env.APP_URL;
      try {
        process.env.APP_URL = "invalid-url-not-http";
        const res = resolveLocation({
          origin: "https://shop.example.com",
          restrictLocations: true,
          allowedLocations: allowed,
        });
        expect(res.allowed).toBe(true);
        expect(res.location).toBe("https://shop.example.com");
        expect(res.isAllowedOrigin).toBe(true);
      } finally {
        if (originalAppUrl === undefined) {
          delete process.env.APP_URL;
        } else {
          process.env.APP_URL = originalAppUrl;
        }
      }
    });

    it("handles invalid APP_URL without throwing and resolves location from referer", () => {
      const originalAppUrl = process.env.APP_URL;
      try {
        process.env.APP_URL = ":::invalid-url:::";
        const res = resolveLocation({
          referer: "https://shop.example.com/checkout/form?ref=123",
          restrictLocations: true,
          allowedLocations: allowed,
        });
        expect(res.allowed).toBe(true);
        expect(res.location).toBe("https://shop.example.com");
        expect(res.isAllowedOrigin).toBe(true);
      } finally {
        if (originalAppUrl === undefined) {
          delete process.env.APP_URL;
        } else {
          process.env.APP_URL = originalAppUrl;
        }
      }
    });

    it("handles invalid APP_URL without throwing and rejects unauthorized origin", () => {
      const originalAppUrl = process.env.APP_URL;
      try {
        process.env.APP_URL = "not_a_valid_url";
        const res = resolveLocation({
          origin: "https://evil.com",
          restrictLocations: true,
          allowedLocations: allowed,
        });
        expect(res.allowed).toBe(false);
        expect(res.location).toBe("https://evil.com");
        expect(res.isAllowedOrigin).toBe(false);
      } finally {
        if (originalAppUrl === undefined) {
          delete process.env.APP_URL;
        } else {
          process.env.APP_URL = originalAppUrl;
        }
      }
    });
  });
});
