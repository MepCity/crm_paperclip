import type { FieldValue, RecordData } from "../../contract";
import { solutionsMetadata } from "./metadata";
import { solutionsPicklists } from "./picklists";
export const fixtureSolutionId = (index: number) => String(270000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Solution_Title ?? "");
export function generateFixtureSolutions(now: Date): RecordData[] {
  return Array.from({ length: 25 }, (_, index) => {
    const id = fixtureSolutionId(index);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      solutionsMetadata.fields.map((field) => [field.apiName, null]),
    );
    for (const [name, options] of Object.entries(solutionsPicklists))
      fields[name] = options[index % options.length]?.storedValue ?? null;
    Object.assign(fields, {
      id,
      Solution_Title: `Solution ${index + 1}`,
      Created_Time: new Date(now.getTime() - index * 86400000).toISOString(),
      Modified_Time: now.toISOString(),
      Locked__s: index === 1,
      Published: index % 2 === 0,
    });
    return { id, fields };
  });
}
