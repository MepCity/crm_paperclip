import { SignOutButton } from "@/components/auth/sign-out-button";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { OrganizationForm } from "@/components/onboarding/organization-form";
import { requireUser } from "@/lib/session";

export default async function NewOrganizationPage() {
  await requireUser("/orgs/new");

  return (
    <OnboardingFrame title="Create an organization">
      <div className="flex flex-col gap-4">
        <OrganizationForm />
        <SignOutButton />
      </div>
    </OnboardingFrame>
  );
}
