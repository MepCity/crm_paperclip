import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ModuleRouteClient, type ModuleRouteKind } from "./module-route-client";
import { resolveModuleScreen } from "./registry";
import "@/components/records/list/module-list-page.css";

export interface ModuleRouteParams {
  orgSlug: string;
  moduleTab: string;
  viewId?: string;
  recordId?: string;
}

type RouteProps = { params: Promise<ModuleRouteParams> };

export function requireModuleScreen(tab: string) {
  const definition = resolveModuleScreen(tab);
  if (!definition) notFound();
  return definition;
}

export async function modulePageMetadata({ params }: RouteProps) {
  const { moduleTab } = await params;
  return { title: requireModuleScreen(moduleTab).pageTitle };
}

async function renderModuleRoute({ params }: RouteProps, kind: ModuleRouteKind) {
  const route = await params;
  const definition = requireModuleScreen(route.moduleTab);
  if (kind === "detail" && route.recordId === "create") notFound();
  const context = await requireOrgContext(route.orgSlug);
  const client = <ModuleRouteClient {...route} kind={kind} currentUserId={context.userId} />;
  return (
    <>
      <PageTitle title={definition.pageTitle} />
      {kind === "list" ? (
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
