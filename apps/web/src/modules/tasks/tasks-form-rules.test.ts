import type { ModuleMetadata } from "@crm/core/records";
import { expect, test } from "vitest";
import { buildFormModel, formFields, resolveFormRules } from "@/components/records/form/form-model";
import {
  buildTasksFormDefaults,
  TASKS_FORM_CREATE_TITLE,
  TASKS_FORM_EDIT_TITLE,
  TASKS_FORM_INFORMATION_COLUMNS,
  TASKS_FORM_OMITTED_FIELDS,
  tasksFormRules,
} from "./tasks-form-rules";
import { taskField } from "./test-metadata";

const names = [...TASKS_FORM_INFORMATION_COLUMNS[0], ...TASKS_FORM_OMITTED_FIELDS, "Description"];
const metadata: ModuleMetadata = {
  apiName: "Tasks",
  singularLabel: "Task",
  pluralLabel: "Tasks",
  businessCardFields: [],
  fields: [
    ...names.map((name) =>
      taskField(name, {
        ...(name === "Subject" ? { required: true } : {}),
        ...(name === "Status"
          ? {
              dataType: "picklist" as const,
              picklist: [
                { storedValue: "Not Started", displayValue: "Not Started" },
                { storedValue: "Completed", displayValue: "Completed" },
              ],
            }
          : {}),
        ...(name === "Priority"
          ? {
              dataType: "picklist" as const,
              picklist: [
                { storedValue: "High", displayValue: "High" },
                { storedValue: "Low", displayValue: "Low" },
              ],
            }
          : {}),
      }),
    ),
  ],
  layout: [
    { label: "Task Information", columnCount: 1, columns: [names.slice(0, -1)], fields: [] },
    { label: "Description Information", columnCount: 1, columns: [["Description"]], fields: [] },
  ],
};

test("keeps Tasks form titles and the owner key", () => {
  expect(TASKS_FORM_CREATE_TITLE).toBe("Create Task");
  expect(TASKS_FORM_EDIT_TITLE).toBe("Edit Task");
  expect(tasksFormRules.owner).toBe("Owner");
});

test("create defaults are Not Started and High, from the metadata picklists", () => {
  expect(buildTasksFormDefaults(metadata)).toEqual({ Status: "Not Started", Priority: "High" });
  expect(buildTasksFormDefaults()).toEqual({ Status: "Not Started", Priority: "High" });
});

test("form fields hold only the painted controls and keep Subject required", () => {
  const rules = resolveFormRules(tasksFormRules, { mode: "create", metadata });
  const fields = formFields(metadata, buildFormModel(metadata, "create"), "create", rules);
  const apiNames = fields.map((field) => field.apiName);
  for (const omitted of TASKS_FORM_OMITTED_FIELDS) expect(apiNames).not.toContain(omitted);
  for (const painted of [...TASKS_FORM_INFORMATION_COLUMNS[0], "Description"])
    expect(apiNames).toContain(painted);
  expect(fields.find((field) => field.apiName === "Subject")?.required).toBe(true);
});
