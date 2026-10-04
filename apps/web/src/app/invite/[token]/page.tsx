import { getInvitationPreview, type InvitationPreview, type Session } from "@crm/core";
import { InvitationCard, type InvitationCardState } from "@/components/onboarding/invitation-card";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { hrefWithNext } from "@/lib/safe-next-path";
import { getSession } from "@/lib/session";
import { acceptInvitationAction } from "./actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [preview, session] = await Promise.all([getInvitationPreview(token), getSession()]);

  return (
    <OnboardingFrame title="Invitation">
      <InvitationCard state={invitationState(preview, session, token)} />
    </OnboardingFrame>
  );
}

function invitationState(
  preview: InvitationPreview | null,
  session: Session | null,
  token: string,
): InvitationCardState {
  if (!preview) return { kind: "invalid" };
  if (preview.status !== "pending") return { kind: preview.status };

  if (!session) {
    const next = `/invite/${encodeURIComponent(token)}`;
    return {
      kind: "signed-out",
      organizationName: preview.organizationName,
      email: preview.email,
      signUpHref: hrefWithNext("/sign-up", next),
      signInHref: hrefWithNext("/sign-in", next),
    };
  }

  if (session.user.email.toLowerCase() === preview.email) {
    return {
      kind: "match",
      organizationName: preview.organizationName,
      action: acceptInvitationAction.bind(null, token),
    };
  }

  return { kind: "mismatch", email: preview.email };
}
