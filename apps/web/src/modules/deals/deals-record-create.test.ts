import { beforeEach, describe, expect, it, vi } from "vitest";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { openCaseCreateWithDeal } from "./deals-record-create";

vi.mock("@/lib/records/record-create-prefill", () => ({
  writeRecordCreatePrefill: vi.fn(),
}));

vi.mock("@/lib/crm-paths", () => ({
  moduleCreatePath: vi.fn(
    (orgSlug: string, moduleName: string) => `/crm/${orgSlug}/tab/${moduleName}/create`,
  ),
}));

describe("openCaseCreateWithDeal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Deal_Name reference handling", () => {
    it("includes name in Deal_Name reference when Deal_Name is a string", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-101",
          fields: { Deal_Name: "Enterprise Expansion" },
        },
        navigate,
      );

      expect(writeRecordCreatePrefill).toHaveBeenCalledWith("test-org", {
        module: "Cases",
        fields: {
          Deal_Name: {
            module: "Deals",
            id: "deal-101",
            name: "Enterprise Expansion",
          },
        },
      });
    });

    it("omits name in Deal_Name reference when Deal_Name is undefined or missing", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-102",
          fields: {},
        },
        navigate,
      );

      expect(writeRecordCreatePrefill).toHaveBeenCalledWith("test-org", {
        module: "Cases",
        fields: {
          Deal_Name: {
            module: "Deals",
            id: "deal-102",
          },
        },
      });
      const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      const dealRef = prefill?.fields.Deal_Name as Record<string, unknown>;
      expect("name" in dealRef).toBe(false);
    });

    it("omits name in Deal_Name reference when Deal_Name is not a string", () => {
      const navigate = vi.fn();
      const nonStringValues = [null, 12345, true, { label: "Deal Object" }, ["Deal Array"]];

      for (const nonStringVal of nonStringValues) {
        vi.clearAllMocks();
        openCaseCreateWithDeal(
          "test-org",
          {
            id: "deal-103",
            fields: { Deal_Name: nonStringVal as unknown as string },
          },
          navigate,
        );

        expect(writeRecordCreatePrefill).toHaveBeenCalledWith("test-org", {
          module: "Cases",
          fields: {
            Deal_Name: {
              module: "Deals",
              id: "deal-103",
            },
          },
        });
        const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
        const dealRef = prefill?.fields.Deal_Name as Record<string, unknown>;
        expect("name" in dealRef).toBe(false);
      }
    });
  });

  describe("Account_Name lookup handling", () => {
    it("includes Account_Name with id and name when valid reference object with name is provided", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-201",
          fields: {
            Deal_Name: "Deal with Account",
            Account_Name: {
              module: "Accounts",
              id: "acc-10",
              name: "Acme Corp",
            },
          },
        },
        navigate,
      );

      expect(writeRecordCreatePrefill).toHaveBeenCalledWith("test-org", {
        module: "Cases",
        fields: {
          Deal_Name: {
            module: "Deals",
            id: "deal-201",
            name: "Deal with Account",
          },
          Account_Name: {
            module: "Accounts",
            id: "acc-10",
            name: "Acme Corp",
          },
        },
      });
    });

    it("includes Account_Name without name when reference object lacks a name", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-202",
          fields: {
            Deal_Name: "Deal with Nameless Account",
            Account_Name: {
              module: "Accounts",
              id: "acc-20",
            },
          },
        },
        navigate,
      );

      expect(writeRecordCreatePrefill).toHaveBeenCalledWith("test-org", {
        module: "Cases",
        fields: {
          Deal_Name: {
            module: "Deals",
            id: "deal-202",
            name: "Deal with Nameless Account",
          },
          Account_Name: {
            module: "Accounts",
            id: "acc-20",
          },
        },
      });
      const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      const accountRef = prefill?.fields.Account_Name as Record<string, unknown>;
      expect("name" in accountRef).toBe(false);
    });

    it("omits Account_Name when field is not present", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-203",
          fields: { Deal_Name: "Deal without Account" },
        },
        navigate,
      );

      const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);
    });

    it("omits Account_Name when field is null or undefined", () => {
      const navigate = vi.fn();

      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-204",
          fields: { Deal_Name: "Deal", Account_Name: null },
        },
        navigate,
      );
      let prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);

      vi.clearAllMocks();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-204",
          fields: { Deal_Name: "Deal", Account_Name: undefined as unknown as null },
        },
        navigate,
      );
      prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);
    });

    it("omits Account_Name when field is not an object", () => {
      const navigate = vi.fn();
      const nonObjectValues = ["acc-10", 42, true];

      for (const val of nonObjectValues) {
        vi.clearAllMocks();
        openCaseCreateWithDeal(
          "test-org",
          {
            id: "deal-205",
            fields: { Deal_Name: "Deal", Account_Name: val as unknown as null },
          },
          navigate,
        );
        const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
        expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);
      }
    });

    it("omits Account_Name when object has no id property or non-string id", () => {
      const navigate = vi.fn();
      const invalidObjects = [
        {},
        { name: "Acme Corp" },
        { id: 123, name: "Acme Corp" },
        { id: null, name: "Acme Corp" },
      ];

      for (const obj of invalidObjects) {
        vi.clearAllMocks();
        openCaseCreateWithDeal(
          "test-org",
          {
            id: "deal-206",
            fields: { Deal_Name: "Deal", Account_Name: obj as unknown as null },
          },
          navigate,
        );
        const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
        expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);
      }
    });

    it("omits Account_Name when id is an empty string", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        {
          id: "deal-207",
          fields: {
            Deal_Name: "Deal",
            Account_Name: { id: "", name: "Acme Corp" },
          },
        },
        navigate,
      );

      const prefill = vi.mocked(writeRecordCreatePrefill).mock.calls[0]?.[1];
      expect("Account_Name" in (prefill?.fields ?? {})).toBe(false);
    });
  });

  describe("navigation and call order", () => {
    it("calls moduleCreatePath for Cases and navigates to the returned path once", () => {
      const navigate = vi.fn();
      openCaseCreateWithDeal(
        "test-org",
        { id: "deal-301", fields: { Deal_Name: "Deal" } },
        navigate,
      );

      expect(moduleCreatePath).toHaveBeenCalledOnce();
      expect(moduleCreatePath).toHaveBeenCalledWith("test-org", "Cases");
      expect(navigate).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith("/crm/test-org/tab/Cases/create");
    });

    it("writes record create prefill before navigating", () => {
      const callSequence: string[] = [];

      vi.mocked(writeRecordCreatePrefill).mockImplementation(() => {
        callSequence.push("writeRecordCreatePrefill");
      });

      const navigate = vi.fn(() => {
        callSequence.push("navigate");
      });

      openCaseCreateWithDeal(
        "test-org",
        { id: "deal-302", fields: { Deal_Name: "Deal" } },
        navigate,
      );

      expect(callSequence).toEqual(["writeRecordCreatePrefill", "navigate"]);
    });
  });
});
