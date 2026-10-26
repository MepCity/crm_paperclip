import { Suspense } from "react";
import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { InboxClient } from "@/modules/emails/inbox/inbox-client";

export const metadata = { title: "Emails" };

export default async function EmailsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  await requireOrgContext((await params).orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.email")} />
      <Suspense fallback={null}>
        <InboxClient />
      </Suspense>
    </>
  );
}
