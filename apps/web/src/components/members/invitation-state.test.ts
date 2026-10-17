import { describe, expect, it } from "vitest";
import type { InvitationActionState } from "./invitation-state";

describe("InvitationActionState", () => {
  it("represents an idle initial state", () => {
    const state: InvitationActionState = { status: "idle" };
    expect(state.status).toBe("idle");
    expect("inviteUrl" in state).toBe(false);
    expect("message" in state).toBe(false);
  });

  it("represents a successful invitation state with inviteUrl", () => {
    const state: InvitationActionState = {
      status: "success",
      inviteUrl: "https://example.com/invite/tok_123",
    };
    expect(state.status).toBe("success");
    expect(state.inviteUrl).toBe("https://example.com/invite/tok_123");
  });

  it("represents an error state without fieldErrors", () => {
    const state: InvitationActionState = {
      status: "error",
      message: "An unexpected error occurred.",
    };
    expect(state.status).toBe("error");
    expect(state.message).toBe("An unexpected error occurred.");
    expect(state.fieldErrors).toBeUndefined();
  });

  it("represents an error state with empty fieldErrors", () => {
    const state: InvitationActionState = {
      status: "error",
      message: "Validation failed.",
      fieldErrors: {},
    };
    expect(state.status).toBe("error");
    expect(state.message).toBe("Validation failed.");
    expect(state.fieldErrors).toEqual({});
  });

  it("represents an error state with single and multiple field errors", () => {
    const state: InvitationActionState = {
      status: "error",
      message: "Please correct the errors.",
      fieldErrors: {
        email: ["Email is required.", "Must be a valid email address."],
        role: ["Role is invalid."],
      },
    };
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.email).toHaveLength(2);
    expect(state.fieldErrors?.role).toEqual(["Role is invalid."]);
    expect(state.fieldErrors?.nonexistent).toBeUndefined();
  });

  it("supports type narrowing based on the status discriminator", () => {
    function describeState(state: InvitationActionState): string {
      switch (state.status) {
        case "idle":
          return "ready to invite";
        case "success":
          return `invited: ${state.inviteUrl}`;
        case "error": {
          const fieldCount = state.fieldErrors ? Object.keys(state.fieldErrors).length : 0;
          return `error: ${state.message} (fields: ${fieldCount})`;
        }
      }
    }

    expect(describeState({ status: "idle" })).toBe("ready to invite");
    expect(describeState({ status: "success", inviteUrl: "https://example.com/invite/abc" })).toBe(
      "invited: https://example.com/invite/abc",
    );
    expect(describeState({ status: "error", message: "Failed" })).toBe("error: Failed (fields: 0)");
    expect(
      describeState({
        status: "error",
        message: "Failed",
        fieldErrors: { email: ["Invalid"] },
      }),
    ).toBe("error: Failed (fields: 1)");
  });

  it("handles edge cases: empty strings, relative urls, and empty error lists", () => {
    const successWithEmptyUrl: InvitationActionState = {
      status: "success",
      inviteUrl: "",
    };
    expect(successWithEmptyUrl.inviteUrl).toBe("");

    const successWithRelativeUrl: InvitationActionState = {
      status: "success",
      inviteUrl: "/invite/accept?token=xyz",
    };
    expect(successWithRelativeUrl.inviteUrl).toBe("/invite/accept?token=xyz");

    const errorWithEmptyMessage: InvitationActionState = {
      status: "error",
      message: "",
      fieldErrors: {
        email: [],
      },
    };
    expect(errorWithEmptyMessage.message).toBe("");
    expect(errorWithEmptyMessage.fieldErrors?.email).toEqual([]);
  });
});
