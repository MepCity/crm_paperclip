import { listMembers, type OrgContext } from "@crm/core";
import { getRecordService } from "@/lib/records";
import { createRecordReportsPort } from "@/modules/reports/record-port";
import { definitionPorts } from "./ports";

export async function persistentReportsPort(ctx: OrgContext) {
  const members = await listMembers(ctx);
  return createRecordReportsPort(getRecordService(ctx), {
    ownerNames: new Map(members.map((m) => [m.userId, m.name])),
    definitions: {
      async list() {
        const result = await (await definitionPorts()).reports.list(ctx);
        if (!result.ok) throw new Error("Reports unavailable");
        return result.value;
      },
      async get(id) {
        const result = await (await definitionPorts()).reports.get(ctx, id);
        if (result.ok) return result.value;
        if (result.error.code === "not_found") return null;
        throw new Error("Reports unavailable");
      },
    },
  });
}
