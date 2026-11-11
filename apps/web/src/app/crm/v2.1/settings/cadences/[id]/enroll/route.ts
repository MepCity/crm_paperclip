import { getAccessSnapshot } from "@crm/core/access";
import type { CadenceModule } from "@crm/core/cadences";
import { z } from "zod";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getCadences } from "@/lib/cadences";
import { getRecordService } from "@/lib/records";

export const dynamic = "force-dynamic";

const enrollPayloadSchema = z.union([
  z.object({
    recordModule: z.enum(["Leads", "Contacts", "Deals"]),
    recordId: z.string().min(1),
  }),
  z.object({
    recordModule: z.enum(["Leads", "Contacts", "Deals"]),
    recordIds: z.array(z.string().min(1)).min(1),
  }),
]);

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, enrollPayloadSchema);
    const accessSnapshot = await getAccessSnapshot(ctx);
    const recordService = getRecordService(ctx);

    if ("recordIds" in input) {
      const result = await getCadences().enrollRecords(
        ctx,
        {
          cadenceId: params.id,
          recordModule: input.recordModule as CadenceModule,
          recordIds: input.recordIds,
        },
        { accessSnapshot, recordService },
      );
      return result;
    }

    const enrollment = await getCadences().enrollRecord(
      ctx,
      {
        cadenceId: params.id,
        recordModule: input.recordModule as CadenceModule,
        recordId: input.recordId,
      },
      { accessSnapshot, recordService },
    );
    return { enrollment };
  },
  { permission: { memberOnly: "enroll_cadence" } },
);
