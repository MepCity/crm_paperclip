import { isAppError } from "@crm/core/errors";
import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { getRecordService } from "@/lib/records";
import { requireOrgContext, requireUser } from "@/lib/session";
import { loadQueues } from "@/modules/workqueue/queues";
import { Workqueue } from "@/modules/workqueue/workqueue";

export const metadata = { title: "Workqueue" };

export default async function WorkqueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const user = await requireUser();
  const requested = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  let queues: Awaited<ReturnType<typeof loadQueues>> = [];
  let accessDenied = false;
  try {
    queues = await loadQueues(getRecordService(ctx), page);
  } catch (error) {
    if (isAppError(error) && error.code === "forbidden") accessDenied = true;
    else throw error;
  }
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.workqueue")} />
      <Workqueue
        orgSlug={orgSlug}
        user={{
          id: user.id,
          name: user.name,
          role: ctx.role === "admin" ? "Administrator" : "Member",
        }}
        accessDenied={accessDenied}
        queues={queues}
        page={page}
      />
    </>
  );
}
