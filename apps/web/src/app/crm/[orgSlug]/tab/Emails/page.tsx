import { Suspense } from "react";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { InboxClient } from "@/modules/emails/inbox/inbox-client";

export const metadata = { title: "Emails" };

export default async function EmailsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  await requireOrgContext((await params).orgSlug);
  return (
    <>
      <PageTitle title="Emails" />
      <Suspense fallback={null}>
        <InboxClient />
      </Suspense>
    </>
  );
}
