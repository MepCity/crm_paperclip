import { describe, expect, it } from "vitest";
import { classifyAutomated } from "./auto-submitted";

describe("classifyAutomated", () => {
  // -------------------------------------------------------------------------
  // Empty / no headers
  // -------------------------------------------------------------------------
  describe("empty headers", () => {
    it("returns automated:false when no relevant headers are present", () => {
      expect(classifyAutomated({})).toEqual({ automated: false, kind: null, signals: [] });
    });

    it("returns automated:false when all values are undefined", () => {
      expect(
        classifyAutomated({
          "Auto-Submitted": undefined,
          "List-Id": undefined,
        }),
      ).toEqual({ automated: false, kind: null, signals: [] });
    });
  });

  // -------------------------------------------------------------------------
  // Auto-Submitted (RFC 3834 §5)
  // -------------------------------------------------------------------------
  describe("Auto-Submitted header", () => {
    it("auto-submitted:no → automated:false", () => {
      const result = classifyAutomated({ "Auto-Submitted": "no" });
      expect(result.automated).toBe(false);
      expect(result.kind).toBeNull();
      expect(result.signals).toHaveLength(0);
    });

    it("auto-submitted:NO (uppercase) → automated:false", () => {
      const result = classifyAutomated({ "Auto-Submitted": "NO" });
      expect(result.automated).toBe(false);
    });

    it("auto-submitted:auto-replied → kind auto-replied", () => {
      const result = classifyAutomated({ "Auto-Submitted": "auto-replied" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("Auto-Submitted:auto-replied");
    });

    it("auto-submitted:auto-generated → kind auto-generated", () => {
      const result = classifyAutomated({ "Auto-Submitted": "auto-generated" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-generated");
      expect(result.signals).toContain("Auto-Submitted:auto-generated");
    });

    it("unknown value → kind auto-generated (RFC 3834 §5 catch-all)", () => {
      const result = classifyAutomated({ "Auto-Submitted": "auto-forwarded" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-generated");
      expect(result.signals).toContain("Auto-Submitted:auto-generated");
    });

    it("value with parameters: 'auto-replied; owner-email=noreply@example.com' → kind auto-replied", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-replied; owner-email=noreply@example.com",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("Auto-Submitted:auto-replied");
    });

    it("value with parameters: 'no; owner-email=noreply@example.com' → automated:false", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "no; owner-email=noreply@example.com",
      });
      expect(result.automated).toBe(false);
      expect(result.kind).toBeNull();
      expect(result.signals).toHaveLength(0);
    });

    it("value with parameters: 'auto-generated; reason=OOO' → kind auto-generated", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-generated; reason=OOO",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-generated");
    });

    it("header name case-insensitive: 'auto-submitted' (lowercase) is matched", () => {
      const result = classifyAutomated({ "auto-submitted": "auto-replied" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });

    it("header name case-insensitive: 'AUTO-SUBMITTED' (uppercase) is matched", () => {
      const result = classifyAutomated({ "AUTO-SUBMITTED": "auto-generated" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-generated");
    });

    it("array header value: uses first element", () => {
      const result = classifyAutomated({
        "Auto-Submitted": ["auto-replied", "auto-generated"],
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });

    it("array header value: 'no' as first element → automated:false", () => {
      const result = classifyAutomated({
        "Auto-Submitted": ["no", "auto-replied"],
      });
      expect(result.automated).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Precedence
  // -------------------------------------------------------------------------
  describe("Precedence header", () => {
    it("precedence:bulk → kind bulk", () => {
      const result = classifyAutomated({ Precedence: "bulk" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("bulk");
      expect(result.signals).toContain("Precedence:bulk");
    });

    it("precedence:junk → kind bulk", () => {
      const result = classifyAutomated({ Precedence: "junk" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("bulk");
      expect(result.signals).toContain("Precedence:bulk");
    });

    it("precedence:list → kind list", () => {
      const result = classifyAutomated({ Precedence: "list" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
      expect(result.signals).toContain("Precedence:list");
    });

    it("precedence:normal → automated:false (not a bulk/junk/list value)", () => {
      const result = classifyAutomated({ Precedence: "normal" });
      expect(result.automated).toBe(false);
    });

    it("Precedence header name is case-insensitive", () => {
      const result = classifyAutomated({ PRECEDENCE: "bulk" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("bulk");
    });
  });

  // -------------------------------------------------------------------------
  // List-Id and List-Unsubscribe
  // -------------------------------------------------------------------------
  describe("List-Id and List-Unsubscribe headers", () => {
    it("List-Id present → kind list", () => {
      const result = classifyAutomated({
        "List-Id": "<marketing.example.com>",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
      expect(result.signals).toContain("List-Id");
    });

    it("List-Unsubscribe present → kind list", () => {
      const result = classifyAutomated({
        "List-Unsubscribe": "<mailto:unsubscribe@example.com>",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
      expect(result.signals).toContain("List-Unsubscribe");
    });

    it("both List-Id and List-Unsubscribe → both signals recorded, kind list", () => {
      const result = classifyAutomated({
        "List-Id": "<updates.example.com>",
        "List-Unsubscribe": "<mailto:unsub@example.com>",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
      expect(result.signals).toContain("List-Id");
      expect(result.signals).toContain("List-Unsubscribe");
    });

    it("list-id header name is case-insensitive", () => {
      const result = classifyAutomated({ "list-id": "<foo.example.com>" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
    });
  });

  // -------------------------------------------------------------------------
  // X-Autoreply, X-Autorespond
  // -------------------------------------------------------------------------
  describe("X-Autoreply and X-Autorespond headers", () => {
    it("X-Autoreply present → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Autoreply": "yes" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("X-Autoreply");
    });

    it("X-Autorespond present → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Autorespond": "1" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("X-Autorespond");
    });

    it("X-Autoreply header name case-insensitive", () => {
      const result = classifyAutomated({ "x-autoreply": "yes" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });
  });

  // -------------------------------------------------------------------------
  // X-Auto-Response-Suppress
  // -------------------------------------------------------------------------
  describe("X-Auto-Response-Suppress header", () => {
    it("X-Auto-Response-Suppress: All → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Auto-Response-Suppress": "All" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("X-Auto-Response-Suppress");
    });

    it("X-Auto-Response-Suppress: OOF → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Auto-Response-Suppress": "OOF" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });

    it("X-Auto-Response-Suppress: AutoReply → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Auto-Response-Suppress": "AutoReply" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });

    it("X-Auto-Response-Suppress: DR (not All/OOF/AutoReply) → automated:false", () => {
      const result = classifyAutomated({ "X-Auto-Response-Suppress": "DR" });
      expect(result.automated).toBe(false);
    });

    it("X-Auto-Response-Suppress: OOF, AutoReply (multiple flags) → kind auto-replied", () => {
      const result = classifyAutomated({ "X-Auto-Response-Suppress": "OOF, AutoReply" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });

    it("header name case-insensitive: x-auto-response-suppress", () => {
      const result = classifyAutomated({ "x-auto-response-suppress": "OOF" });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("auto-replied");
    });
  });

  // -------------------------------------------------------------------------
  // Priority order: auto-replied > auto-generated > list > bulk
  // -------------------------------------------------------------------------
  describe("priority ordering", () => {
    it("auto-replied wins over auto-generated when both present", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-generated",
        "X-Autoreply": "yes",
      });
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("Auto-Submitted:auto-generated");
      expect(result.signals).toContain("X-Autoreply");
    });

    it("auto-replied wins over list", () => {
      const result = classifyAutomated({
        "X-Autoreply": "yes",
        "List-Id": "<foo.example.com>",
      });
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("X-Autoreply");
      expect(result.signals).toContain("List-Id");
    });

    it("auto-replied wins over bulk", () => {
      const result = classifyAutomated({
        "X-Autorespond": "yes",
        Precedence: "bulk",
      });
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toContain("X-Autorespond");
      expect(result.signals).toContain("Precedence:bulk");
    });

    it("auto-generated wins over list", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-generated",
        "List-Id": "<foo.example.com>",
      });
      expect(result.kind).toBe("auto-generated");
      expect(result.signals).toContain("Auto-Submitted:auto-generated");
      expect(result.signals).toContain("List-Id");
    });

    it("auto-generated wins over bulk", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-generated",
        Precedence: "bulk",
      });
      expect(result.kind).toBe("auto-generated");
    });

    it("list wins over bulk", () => {
      const result = classifyAutomated({
        "List-Unsubscribe": "<mailto:u@example.com>",
        Precedence: "bulk",
      });
      expect(result.kind).toBe("list");
      expect(result.signals).toContain("Precedence:bulk");
      expect(result.signals).toContain("List-Unsubscribe");
    });

    it("all four kinds active → auto-replied wins and all signals recorded", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-generated",
        "X-Autoreply": "yes",
        "List-Id": "<foo.example.com>",
        Precedence: "bulk",
      });
      expect(result.kind).toBe("auto-replied");
      expect(result.signals).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------------------
  // Array header values
  // -------------------------------------------------------------------------
  describe("array header values", () => {
    it("List-Id as array uses presence regardless of element value", () => {
      const result = classifyAutomated({
        "List-Id": ["<a.example.com>", "<b.example.com>"],
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
    });

    it("Precedence as array uses the first element", () => {
      const result = classifyAutomated({ Precedence: ["bulk", "list"] });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("bulk");
    });
  });

  // -------------------------------------------------------------------------
  // Negative tests — non-automated messages
  // -------------------------------------------------------------------------
  describe("non-automated messages", () => {
    it("typical human reply headers produce no signals", () => {
      const result = classifyAutomated({
        From: "alice@example.com",
        To: "bob@example.com",
        Subject: "Re: Project update",
        "Message-ID": "<unique@mail.example.com>",
        "In-Reply-To": "<original@mail.example.com>",
      });
      expect(result.automated).toBe(false);
      expect(result.kind).toBeNull();
      expect(result.signals).toHaveLength(0);
    });

    it("Auto-Submitted:no with List-Unsubscribe still fires list signal (no suppresses only Auto-Submitted)", () => {
      // List-Unsubscribe is independent from Auto-Submitted:no
      const result = classifyAutomated({
        "Auto-Submitted": "no",
        "List-Unsubscribe": "<mailto:unsub@example.com>",
      });
      expect(result.automated).toBe(true);
      expect(result.kind).toBe("list");
    });
  });

  // -------------------------------------------------------------------------
  // Signals array completeness
  // -------------------------------------------------------------------------
  describe("signals array completeness", () => {
    it("signals contains every matched rule even when lower priority", () => {
      const result = classifyAutomated({
        "Auto-Submitted": "auto-replied",
        Precedence: "bulk",
        "List-Id": "<news.example.com>",
      });
      expect(result.signals).toContain("Auto-Submitted:auto-replied");
      expect(result.signals).toContain("Precedence:bulk");
      expect(result.signals).toContain("List-Id");
    });
  });
});
