import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchModuleFieldsAndRevision, sendViewCommand } from "./custom-view-api";

describe("custom-view-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchModuleFieldsAndRevision", () => {
    it("fetches fields with stable IDs and revision from settings route", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            revision: "rev-100",
            fields: [
              {
                id: "lead-name",
                api_name: "Full_Name",
                field_label: "Lead Name",
                data_type: "text",
              },
              { id: "lead-email", api_name: "Email", field_label: "Email", data_type: "email" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchModuleFieldsAndRevision("my-org", "Leads");

      expect(fetchMock).toHaveBeenCalledWith("/crm/v2.2/settings/fields?module=Leads", {
        headers: { "X-CRM-ORG": "my-org" },
      });
      expect(result.revision).toBe("rev-100");
      expect(result.fields).toEqual([
        { id: "lead-name", apiName: "Full_Name", label: "Lead Name", dataType: "text" },
        { id: "lead-email", apiName: "Email", label: "Email", dataType: "email" },
      ]);
    });

    it("throws when fetch returns non-ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 500 })));
      await expect(fetchModuleFieldsAndRevision("my-org", "Leads")).rejects.toThrow(
        "Failed to load fields for module Leads",
      );
    });
  });

  describe("sendViewCommand", () => {
    it("sends POST view.create command and returns revision", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            revision: "rev-101",
            custom_views: [{ id: "view-new", name: "New View" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendViewCommand("my-org", "Leads", "POST", "rev-100", {
        type: "view.create",
        view: {
          id: "view-new",
          name: "New View",
          systemDefined: false,
          isDefault: false,
          columns: ["lead-name"],
          criteria: null,
          sort: null,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith("/crm/v9/settings/custom_views?module=Leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CRM-ORG": "my-org",
        },
        body: JSON.stringify({
          expectedRevision: "rev-100",
          command: {
            type: "view.create",
            view: {
              id: "view-new",
              name: "New View",
              systemDefined: false,
              isDefault: false,
              columns: ["lead-name"],
              criteria: null,
              sort: null,
            },
          },
        }),
      });

      expect(result).toEqual({
        ok: true,
        revision: "rev-101",
        viewId: "view-new",
        view: { id: "view-new", name: "New View" },
      });
    });

    it("sends PATCH view.patch command to viewId route", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ revision: "rev-102" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendViewCommand(
        "my-org",
        "Leads",
        "PATCH",
        "rev-101",
        {
          type: "view.patch",
          view: {
            id: "view-edit",
            name: "Edited View",
            systemDefined: false,
            isDefault: false,
            columns: ["lead-name", "lead-email"],
            criteria: null,
            sort: null,
          },
        },
        "view-edit",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "/crm/v9/settings/custom_views/view-edit?module=Leads",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(result).toEqual({
        ok: true,
        revision: "rev-102",
        viewId: "view-edit",
        view: undefined,
      });
    });

    it("sends DELETE view.delete command to viewId route", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ revision: "rev-103" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendViewCommand(
        "my-org",
        "Leads",
        "DELETE",
        "rev-102",
        { type: "view.delete" },
        "view-edit",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "/crm/v9/settings/custom_views/view-edit?module=Leads",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(result).toEqual({
        ok: true,
        revision: "rev-103",
        viewId: "view-edit",
        view: undefined,
      });
    });

    it("handles 409 SCHEMA_REVISION_MISMATCH cleanly", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ code: "SCHEMA_REVISION_MISMATCH" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );

      const result = await sendViewCommand("my-org", "Leads", "POST", "rev-old", {
        type: "view.create",
        view: {
          id: "v-1",
          name: "V",
          systemDefined: false,
          isDefault: false,
          columns: ["c1"],
          criteria: null,
          sort: null,
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.stale).toBe(true);
        expect(result.message).toContain("The views changed since this page loaded");
      }
    });

    it("handles 403 Forbidden cleanly", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ code: "AUTHENTICATION_FAILURE" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );

      const result = await sendViewCommand("my-org", "Leads", "POST", "rev-1", {
        type: "view.create",
        view: {
          id: "v-1",
          name: "V",
          systemDefined: false,
          isDefault: false,
          columns: ["c1"],
          criteria: null,
          sort: null,
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.forbidden).toBe(true);
        expect(result.message).toContain("Only administrators can customize organization views.");
      }
    });

    it("surfaces protected_view and view_field validation errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              message: "Validation failed",
              details: {
                fields: {
                  view_field: ["retired-col"],
                  view: ["protected_view"],
                },
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          ),
        ),
      );

      const result = await sendViewCommand("my-org", "Leads", "POST", "rev-1", {
        type: "view.create",
        view: {
          id: "v-1",
          name: "V",
          systemDefined: false,
          isDefault: false,
          columns: ["retired-col"],
          criteria: null,
          sort: null,
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.fieldErrors?.view_field).toEqual(["retired-col"]);
        expect(result.fieldErrors?.view).toEqual(["protected_view"]);
      }
    });
  });
});
