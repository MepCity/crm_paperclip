/**
 * Organization-scoped CRM page paths. The prefix is interim until MEP-89 moves
 * pages from `/o` to `/crm` (ADR 0004 §2 target shape).
 */
export const CRM_ORG_PATH_PREFIX = "/o";

export function orgBasePath(orgSlug: string): string {
  return `${CRM_ORG_PATH_PREFIX}/${encodeURIComponent(orgSlug)}`;
}

export function moduleTabPath(
  orgSlug: string,
  moduleApiName: string,
  ...segments: string[]
): string {
  const tail = segments.map((segment) => encodeURIComponent(segment)).join("/");
  return tail.length > 0
    ? `${orgBasePath(orgSlug)}/tab/${encodeURIComponent(moduleApiName)}/${tail}`
    : `${orgBasePath(orgSlug)}/tab/${encodeURIComponent(moduleApiName)}`;
}

export function moduleListDefaultPath(orgSlug: string, moduleApiName: string): string {
  return moduleTabPath(orgSlug, moduleApiName, "list");
}

export function moduleListCustomPath(
  orgSlug: string,
  moduleApiName: string,
  viewId: string,
): string {
  return moduleTabPath(orgSlug, moduleApiName, "custom-view", viewId, "list");
}

export function moduleRecordPath(orgSlug: string, moduleApiName: string, recordId: string): string {
  return moduleTabPath(orgSlug, moduleApiName, recordId);
}

export function moduleCreatePath(orgSlug: string, moduleApiName: string): string {
  return moduleTabPath(orgSlug, moduleApiName, "create");
}

export function withSearchParams(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}
