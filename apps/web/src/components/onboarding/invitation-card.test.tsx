import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { InvitationCard, type InvitationCardState } from "./invitation-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

function renderState(state: InvitationCardState) {
  render(<InvitationCard state={state} />);
}

test("unknown token says the link is not valid", () => {
  renderState({ kind: "invalid" });
  expect(screen.getByText("This invitation link is not valid.")).toBeTruthy();
});

test("expired, revoked and used invitations explain that status", () => {
  renderState({ kind: "expired" });
  expect(screen.getByText("This invitation has expired.")).toBeTruthy();
  cleanup();

  renderState({ kind: "revoked" });
  expect(screen.getByText("This invitation has been revoked.")).toBeTruthy();
  cleanup();

  renderState({ kind: "accepted" });
  expect(screen.getByText("This invitation has already been used.")).toBeTruthy();
});

test("a signed-out visitor sees the organization, email and auth links", () => {
  renderState({
    kind: "signed-out",
    organizationName: "Northwind",
    email: "invitee@example.test",
    signUpHref: "/sign-up?next=%2Finvite%2Ftoken",
    signInHref: "/sign-in?next=%2Finvite%2Ftoken",
  });

  expect(screen.getByText("Northwind")).toBeTruthy();
  expect(screen.getByText("invitee@example.test")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe(
    "/sign-up?next=%2Finvite%2Ftoken",
  );
  expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
    "/sign-in?next=%2Finvite%2Ftoken",
  );
});

test("a matching signed-in visitor can join the organization", () => {
  renderState({
    kind: "match",
    organizationName: "Northwind",
    action: async () => ({ status: "idle" }),
  });

  expect(screen.getByRole("button", { name: "Join Northwind" })).toBeTruthy();
});

test("a different signed-in email is told who the invitation is for", () => {
  renderState({ kind: "mismatch", email: "invitee@example.test" });

  expect(screen.getByText("This invitation was sent to invitee@example.test.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
});
