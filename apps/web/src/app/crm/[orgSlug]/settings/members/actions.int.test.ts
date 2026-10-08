import { listInvitations, listMembers } from "@crm/core";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it, vi } from "vitest";
import { createInvitationAction, removeMemberAction } from "./actions";

const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

describe("members actions", () => {
  it("rejects a member who invites or removes someone directly, and leaves data unchanged", async () => {
    const { org, ctx, admin } = await createTestOrganization();
    const member = await addTestMember(ctx, "member");
    requestHeaders.current = new Headers(member.headers);
    const membersBefore = await listMembers(ctx);
    const invitationsBefore = await listInvitations(ctx);

    const invite = new FormData();
    invite.set("email", `extra-${crypto.randomUUID()}@example.test`);
    invite.set("role", "member");
    await expect(createInvitationAction(org.slug, { status: "idle" }, invite)).resolves.toEqual({
      status: "error",
      message: "You do not have permission to do this.",
    });

    await expect(
      removeMemberAction(org.slug, admin.user.id, { status: "idle" }, new FormData()),
    ).resolves.toEqual({
      status: "error",
      message: "You do not have permission to do this.",
    });

    expect(await listMembers(ctx)).toEqual(membersBefore);
    expect(await listInvitations(ctx)).toEqual(invitationsBefore);
  });
});
