import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireOrgContext } from "@/lib/session";

/** Temporary organization home until the app shell replaces this page. */
export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold text-text">{context.orgName}</h1>
      <div className="mt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
