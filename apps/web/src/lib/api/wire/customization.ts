import type { CustomizationCommand } from "@crm/core/customization";
import { ForbiddenError } from "@crm/core/errors";
import { invalid } from "./codec";
import { bodyOf, type Operation } from "./operations";

function mutation(
  method: Operation["method"],
  path: string,
  commands: readonly CustomizationCommand["type"][],
): Operation {
  return {
    method,
    path,
    async run({ customization }, input) {
      const service = customization?.();
      if (!service) throw new ForbiddenError();
      // Permission is checked before reading or decoding caller-supplied JSON.
      service.assertAllowed();
      const module = input.params?.module ?? input.query.module ?? invalid("module");
      const result = await service.execute(
        module,
        await bodyOf(input),
        commands,
        input.params?.viewId,
      );
      return { status: 200, body: result };
    },
  };
}
const fields = "/crm/v2.2/settings/fields";
const views = "/crm/v9/settings/custom_views";
export const customizationOperations = {
  createField: mutation("POST", fields, ["field.create"]),
  patchField: mutation("PATCH", fields, ["field.patch", "field.restore"]),
  retireField: mutation("DELETE", fields, ["field.retire"]),
  patchModule: mutation("PATCH", "/crm/v2.2/settings/modules/{module}", ["module.patch"]),
  patchLayout: mutation("PATCH", "/crm/v2.1/settings/layouts", ["layout.patch"]),
  createSharedView: mutation("POST", views, ["view.create"]),
  patchSharedView: mutation("PATCH", `${views}/{viewId}`, ["view.patch"]),
  deleteSharedView: mutation("DELETE", `${views}/{viewId}`, ["view.delete"]),
};
