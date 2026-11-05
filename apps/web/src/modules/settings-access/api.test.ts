import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessApiError, createAccessClient } from "./api";
import { errorText } from "./shared";

afterEach(() => vi.restoreAllMocks());

function respond(status: number, body?: unknown) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

describe("access client", () => {
  it("sends the organisation header and snake_case bodies", async () => {
    respond(200, { profile: { id: "p1" } });
    await createAccessClient("acme").cloneProfile({ sourceProfileId: "s", name: "Support" });
    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(url).toBe("/crm/v9/settings/profiles");
    expect({ ...(init?.headers as Record<string, string>) }["X-CRM-ORG"]).toBe("acme");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      source_profile_id: "s",
      name: "Support",
    });
  });

  it("treats 204 as success and maps errors with details", async () => {
    respond(204);
    await expect(createAccessClient("acme").deleteGroup("g1")).resolves.toBeNull();
    respond(400, { code: "INVALID_DATA", message: "Invalid", details: { name: ["Name taken."] } });
    const error = await createAccessClient("acme")
      .deleteProfile("p", "r")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AccessApiError);
    expect(errorText(error)).toBe("Invalid Name taken.");
  });

  it("explains a denied profile", () => {
    expect(errorText(new AccessApiError("x", 403, "permission_denied", {}))).toContain(
      "permission",
    );
  });
});
