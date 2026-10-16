import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTitle } from "@/components/shell/page-title";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { resolveCreatePrefillParams } from "./create-prefill-params";
import { ModuleRouteClient, type ModuleRouteKind } from "./module-route-client";
import { resolveModuleScreen } from "./registry";
import "@/components/records/list/module-list-page.css";

export interface ModuleRouteParams {
  orgSlug: string;
  moduleTab: string;
  viewId?: string;
  recordId?: string;
}

type RouteProps = {
  params: Promise<ModuleRouteParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function requireModuleScreen(tab: string) {
  const definition = resolveModuleScreen(tab);
  if (!definition) notFound();
  return definition;
}

export async function modulePageMetadata({ params }: RouteProps) {
  const { moduleTab } = await params;
  return { title: requireModuleScreen(moduleTab).pageTitle };
}

async function renderModuleRoute(props: RouteProps, kind: ModuleRouteKind) {
  const route = await props.params;
  const definition = requireModuleScreen(route.moduleTab);
  if ((kind === "detail" || kind === "merge") && route.recordId === "create") notFound();
  const context = await requireOrgContext(route.orgSlug);
  const createPrefill =
    kind === "create" && props.searchParams
      ? await resolveCreatePrefillParams(
          getRecordService(context),
          definition.apiName,
          await props.searchParams,
        )
      : undefined;
  const client = (
    <ModuleRouteClient
      {...route}
      kind={kind}
      currentUserId={context.userId}
      createPrefill={createPrefill}
    />
  );
  return (
    <>
      <PageTitle title={definition.pageTitle} />
      {kind === "list" || kind === "deduplicate" ? (
        <Suspense fallback={<div className="module-list-page min-h-full" aria-hidden="true" />}>
          {client}
        </Suspense>
      ) : (
        client
      )}
    </>
  );
}

export const moduleListPage = (props: RouteProps) => renderModuleRoute(props, "list");
export const moduleDetailPage = (props: RouteProps) => renderModuleRoute(props, "detail");
export const moduleCreatePage = (props: RouteProps) => renderModuleRoute(props, "create");
export const moduleEditPage = (props: RouteProps) => renderModuleRoute(props, "edit");
export const moduleClonePage = (props: RouteProps) => renderModuleRoute(props, "clone");
export const moduleMergePage = (props: RouteProps) => renderModuleRoute(props, "merge");
export const moduleDeduplicatePage = (props: RouteProps) => renderModuleRoute(props, "deduplicate");
export const moduleTagsPage = (props: RouteProps) => renderModuleRoute(props, "tags");
export const moduleDraftsPage = (props: RouteProps) => renderModuleRoute(props, "drafts");
