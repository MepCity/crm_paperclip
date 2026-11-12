import { z } from "zod";
import { ValidationError } from "../errors";
import type { FieldDefinition } from "../records/contract";
import { fixtureModules } from "../records/fixture/registry";

/**
 * ADR 0019a §3: the only modules and lookups a portal may expose. Adding a module or a
 * lookup here is an ADR change. `contactLookup` / `accountLookup` name the field the
 * portal query builder (Portals B) compares with the identity's Contact `C` / Account `A`.
 */
export const PORTAL_MODULE_RULES = {
  Contacts: {
    contactLookup: "id",
    accountLookup: null,
    actions: ["view", "edit"],
  },
  Accounts: {
    contactLookup: null,
    accountLookup: "id",
    actions: ["view"],
  },
  Deals: { contactLookup: "Contact_Name", accountLookup: "Account_Name", actions: ["view"] },
  Cases: {
    contactLookup: "Related_To",
    accountLookup: "Account_Name",
    actions: ["view", "create"],
  },
  Quotes: { contactLookup: "Contact_Name", accountLookup: "Account_Name", actions: ["view"] },
  Invoices: { contactLookup: "Contact_Name", accountLookup: "Account_Name", actions: ["view"] },
} as const satisfies Record<
  string,
  {
    contactLookup: string | null;
    accountLookup: string | null;
    actions: readonly ("view" | "create" | "edit")[];
  }
>;

export type PortalModule = keyof typeof PORTAL_MODULE_RULES;
export const PORTAL_MODULES = Object.keys(PORTAL_MODULE_RULES) as PortalModule[];

/** Fields never exposed to a portal (ADR 0019a §4.1), whatever their data type. */
const NEVER_EXPOSED = new Set([
  "Owner",
  "Created_By",
  "Modified_By",
  "Tag",
  "Layout",
  "Record_Image",
  "Locked__s",
  "$state",
]);
const NEVER_EXPOSED_TYPES = new Set([
  "ownerlookup",
  "profileimage",
  "multireminder",
  "ALARM",
  "RRULE",
]);

/** Keys the server sets on Case create; a client may never write them (ADR 0019a §4.3). */
const SERVER_SET: Partial<Record<PortalModule, readonly string[]>> = {
  Cases: ["Related_To", "Account_Name"],
};

const fieldSchema = z.strictObject({
  apiName: z.string().min(1).max(100),
  mode: z.enum(["read", "edit"]),
});

const moduleSchema = z.strictObject({
  enabled: z.boolean(),
  scope: z.enum(["contact", "account"]).default("contact"),
  actions: z.strictObject({
    view: z.boolean(),
    create: z.boolean().optional(),
    edit: z.boolean().optional(),
  }),
  fields: z.array(fieldSchema).max(200).default([]),
});

/** `portal_user_types.modules` (ADR 0019a §4.1). Unknown module keys are rejected. */
export const portalModulesSchema = z
  .strictObject(
    Object.fromEntries(PORTAL_MODULES.map((m) => [m, moduleSchema.optional()])) as Record<
      PortalModule,
      z.ZodOptional<typeof moduleSchema>
    >,
  )
  .default({});

export type PortalModuleConfig = z.infer<typeof moduleSchema>;
export type PortalModules = Partial<Record<PortalModule, PortalModuleConfig>>;

/** User-type settings; `caseOwner` is read by Portals B when a Case is created. */
export const portalUserTypeSettingsSchema = z
  .strictObject({
    caseOwner: z
      .union([
        z.strictObject({ kind: z.literal("user"), userId: z.uuid() }),
        z.strictObject({ kind: z.literal("assignment_rule"), ruleId: z.string().min(1).max(64) }),
      ])
      .nullable()
      .default(null),
  })
  .default({ caseOwner: null });

export type PortalUserTypeSettings = z.infer<typeof portalUserTypeSettingsSchema>;

/** Whether a field may appear in a portal projection at all (ADR 0019a §4.1). */
export function isPortalExposable(field: FieldDefinition): boolean {
  return !NEVER_EXPOSED.has(field.apiName) && !NEVER_EXPOSED_TYPES.has(field.dataType);
}

/** Keys the server sets on create for this module; client values are rejected. */
export function portalServerSetFields(module: PortalModule): readonly string[] {
  return SERVER_SET[module] ?? [];
}

export function moduleFields(module: string): readonly FieldDefinition[] {
  const bundle = Object.hasOwn(fixtureModules, module) ? fixtureModules[module] : undefined;
  return bundle?.metadata.fields ?? [];
}

function managedFields(module: string): ReadonlySet<string> {
  const bundle = Object.hasOwn(fixtureModules, module) ? fixtureModules[module] : undefined;
  return bundle?.managedFields ?? new Set();
}

/**
 * Parses and validates a user-type module matrix against the §3 table and the module
 * metadata. Throws `ValidationError` keyed by `modules.<Module>[.fields]`.
 */
export function validatePortalModules(input: unknown): PortalModules {
  const parsed = portalModulesSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      Object.fromEntries(
        parsed.error.issues.map((i) => [`modules.${i.path.join(".")}`, [i.message]]),
      ),
    );
  }
  const errors: Record<string, string[]> = {};
  const fail = (key: string, message: string) => {
    errors[key] = [...(errors[key] ?? []), message];
  };
  const modules = parsed.data as PortalModules;
  for (const module of PORTAL_MODULES) {
    const config = modules[module];
    if (!config) continue;
    const rule = PORTAL_MODULE_RULES[module];
    const allowed = new Set<string>(rule.actions);
    for (const action of ["view", "create", "edit"] as const) {
      if (config.actions[action] && !allowed.has(action)) {
        fail(`modules.${module}.actions`, `Action "${action}" is not allowed for ${module}.`);
      }
    }
    if (config.enabled && !config.actions.view) {
      fail(`modules.${module}.actions`, "An enabled module needs the view action.");
    }
    if (config.scope === "account" && !rule.accountLookup) {
      fail(`modules.${module}.scope`, `${module} has no account scope.`);
    }
    if (module === "Accounts" && config.scope !== "contact") {
      fail(`modules.${module}.scope`, `${module} has no account scope.`);
    }
    const defs = new Map(moduleFields(module).map((f) => [f.apiName, f]));
    const managed = managedFields(module);
    const serverSet = new Set(SERVER_SET[module] ?? []);
    const seen = new Set<string>();
    for (const field of config.fields) {
      const key = `modules.${module}.fields`;
      if (seen.has(field.apiName)) {
        fail(key, `Field "${field.apiName}" is listed twice.`);
        continue;
      }
      seen.add(field.apiName);
      const def = defs.get(field.apiName);
      if (!def) {
        fail(key, `Unknown field "${field.apiName}".`);
        continue;
      }
      if (NEVER_EXPOSED.has(def.apiName) || NEVER_EXPOSED_TYPES.has(def.dataType)) {
        fail(key, `Field "${field.apiName}" cannot be exposed in a portal.`);
        continue;
      }
      if (field.mode === "edit") {
        const writable = Boolean(config.actions.edit || config.actions.create);
        if (
          !writable ||
          def.readOnly ||
          managed.has(def.apiName) ||
          serverSet.has(def.apiName) ||
          def.dataType === "lookup" ||
          def.dataType === "multi_module_lookup" ||
          def.dataType === "autonumber" ||
          def.dataType === "subform"
        ) {
          fail(key, `Field "${field.apiName}" cannot be editable in a portal.`);
        }
      }
    }
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return modules;
}
