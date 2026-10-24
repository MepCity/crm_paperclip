import { randomUUID } from "node:crypto";
import { ForbiddenError, SchemaStaleError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import { type CustomizationCommand, customizationRequestSchema } from "./commands";
import { schemaRevision } from "./coordinator";
import type { InMemoryCustomizationAdapter } from "./memory";
import { invalid } from "./resolver";
import { parse } from "./schema";
import type { CustomizationPatch, LayoutDefinition } from "./types";

/** Authenticated command boundary. The caller supplies a freshly resolved OrgContext. */
export class CustomizationService {
  private readonly context: OrgContext;
  constructor(
    context: OrgContext,
    private readonly metadata: InMemoryCustomizationAdapter,
    private readonly enabled: boolean,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.context = { ...context };
  }

  assertAllowed(): void {
    if (!this.enabled || !this.metadata.coordinated || this.context.role !== "admin")
      throw new ForbiddenError();
  }

  capabilities(module: string) {
    const allowed = this.enabled && this.metadata.coordinated && this.context.role === "admin";
    return {
      fields: allowed,
      layouts: allowed && module !== "Attachments",
      module: allowed,
      sharedViews: allowed,
    };
  }

  async execute(
    module: string,
    input: unknown,
    allowed: readonly CustomizationCommand["type"][],
    viewId?: string,
  ): Promise<{ revision: string }> {
    this.assertAllowed();
    const { command, expectedRevision } = parse(customizationRequestSchema, input);
    if (!allowed.includes(command.type)) invalid("Command is not supported by this route.");
    const current = this.metadata.readEffectiveSync(this.context.orgId, module);
    if (expectedRevision !== schemaRevision(current))
      throw new SchemaStaleError(schemaRevision(current));
    const patch: CustomizationPatch = {};
    const targetIds: string[] = [];
    const setLayout = (layout: LayoutDefinition) => {
      if (module === "Attachments" || layout.id !== current.layouts[0]?.id || !layout.isDefault)
        invalid("Only the existing default layout can be changed.");
      patch.layouts = [layout];
      targetIds.push(layout.id);
    };
    if ("layout" in command && command.layout) setLayout(command.layout);
    switch (command.type) {
      case "field.create": {
        const id = randomUUID();
        patch.addFields = [{ ...command.field, id, lifecycle: "active" }];
        // A create can place the generated identity using the new API name only.
        if (patch.layouts)
          patch.layouts = patch.layouts.map((layout) => ({
            ...layout,
            sections: layout.sections.map((section) => ({
              ...section,
              fields: section.fields.map((value) => (value === command.field.apiName ? id : value)),
              columns: section.columns.map((column) =>
                column.map((value) => (value === command.field.apiName ? id : value)),
              ),
            })),
          }));
        targetIds.push(id);
        break;
      }
      case "field.patch":
        patch.fieldPatches = { [command.fieldId]: command.properties };
        targetIds.push(command.fieldId);
        break;
      case "field.retire":
        patch.retireFields = [command.fieldId];
        targetIds.push(command.fieldId);
        break;
      case "field.restore":
        patch.restoreFields = [command.fieldId];
        targetIds.push(command.fieldId);
        break;
      case "module.patch": {
        const { defaultLayoutId, ...labels } = command.properties;
        if (defaultLayoutId !== undefined && defaultLayoutId !== current.layouts[0]?.id)
          invalid("Unknown default layout.");
        patch.moduleProperties = labels;
        targetIds.push(module);
        break;
      }
      case "layout.patch":
        break;
      case "view.create":
        if (current.views.some((view) => view.id === command.view.id))
          invalid("View identity already exists.");
        if (viewId !== undefined) invalid("Create uses the view collection resource.");
        patch.views = [...current.views, command.view];
        targetIds.push(command.view.id);
        break;
      case "view.patch":
      case "view.delete": {
        const original = current.views.find((view) => view.id === viewId);
        if (!original || original.systemDefined || original.isDefault)
          invalid("Unknown or protected view.");
        if (command.type === "view.patch" && command.view.id !== viewId)
          invalid("View identity does not match the resource.");
        patch.views =
          command.type === "view.delete"
            ? current.views.filter((view) => view.id !== viewId)
            : current.views.map((view) => (view.id === viewId ? command.view : view));
        targetIds.push(original.id);
        break;
      }
    }
    // No await separates token check, candidate validation, audit and publication.
    const next = await this.metadata.applyPatch(
      this.context.orgId,
      module,
      current.revision,
      patch,
      {
        actorId: this.context.userId,
        operation: command.type,
        targetIds,
        timestamp: this.now().toISOString(),
      },
    );
    return { revision: schemaRevision(next) };
  }
}
