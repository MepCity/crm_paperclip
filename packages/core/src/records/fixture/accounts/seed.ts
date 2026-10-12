import type { FieldValue, RecordData } from "../../contract";
import { accountsMetadata } from "./metadata";

export const fixtureAccountId = (index: number): string =>
  String(500000000000000000n + BigInt(index));

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return typeof fields.Account_Name === "string" ? fields.Account_Name : "";
}

/** Synthetic two-level account groups; the final account has no related records. */
export function generateFixtureAccounts(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  return Array.from({ length: 250 }, (_, index) => {
    const id = fixtureAccountId(index);
    const suffix = String(index + 1).padStart(3, "0");
    const stamp = new Date(now.getTime() - (index % 45) * 86_400_000).toISOString();
    const fields: Record<string, FieldValue> = Object.fromEntries(
      accountsMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Account_Name: `Account ${suffix}`,
      Phone: `300-${suffix}`,
      Website: `https://account-${suffix}.example.org`,
      Employees: (index + seed) % 1000,
      Annual_Revenue: ((index + seed) % 1000) * 100,
      Account_Type: index % 2 === 0 ? "Customer" : "Partner",
      Locked__s: index > 10 && index % 13 === 0,
      Created_Time: stamp,
      Modified_Time: stamp,
      Parent_Account:
        index < 249 && index % 5 !== 0
          ? { module: "Accounts", id: fixtureAccountId(index - (index % 5)) }
          : null,
    });
    return { id, fields };
  });
}
