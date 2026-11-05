import { ValidationError } from "@crm/core/errors";
import { readFixtureModuleProjection } from "@crm/core/records/fixture/metadata-projection";
import { type ApiHandlerInput, apiRoute } from "@/lib/api/server";

/** JSON object body of a write request; a missing body is an empty object. */
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text) return {};
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ValidationError({ data: ["Send valid JSON."] });
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError({ data: ["Send a JSON object."] });
  }
  return value as Record<string, unknown>;
}

/** Access settings route: same gate as every `/crm/v…` route; services enforce `admin.userManagement`. */
export function accessRoute(
  handler: (input: ApiHandlerInput<Record<string, string>>) => Promise<unknown>,
) {
  return apiRoute<Record<string, string>>(handler, { permission: { admin: "userManagement" } });
}

/** Sharing-rule body (snake_case wire) to the service input. */
export function ruleFrom(body: Record<string, unknown>) {
  return {
    module: body.module as string,
    name: body.name as string,
    sourceKind: body.source_kind as "role" | "role_and_subordinates" | "group",
    sourceId: body.source_id as string,
    targetKind: body.target_kind as "role" | "role_and_subordinates" | "group",
    targetId: body.target_id as string,
    level: body.level as "read" | "read_write" | "read_write_delete",
  };
}

/** Required fields of a module come from the effective layout (they cannot be restricted). */
export function requiredFieldsFor(orgId: string) {
  return async (module: string): Promise<string[]> => {
    const projection = await readFixtureModuleProjection(orgId, module);
    return projection.fields.filter((field) => field.required).map((field) => field.apiName);
  };
}
