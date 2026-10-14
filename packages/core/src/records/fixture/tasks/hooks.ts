import type { FixtureModuleHooks } from "../hooks";

export const tasksHooks: FixtureModuleHooks = {
  applyRules(fields, _input, previous) {
    fields.Closed_Time =
      fields.Status === "Completed"
        ? previous?.Status === "Completed"
          ? (previous.Closed_Time ?? fields.Modified_Time ?? null)
          : (fields.Modified_Time ?? null)
        : null;
  },
};
