import { listMembers } from "@crm/core";
import { apiRoute } from "@/lib/api/server";
import { operations } from "@/lib/api/wire/operations";
import { getRecordService } from "@/lib/records";

export const dynamic = "force-dynamic";

export const POST = apiRoute(
  async (input) =>
    (
      await operations.create.run(
        { records: getRecordService(input.ctx), members: await listMembers(input.ctx) },
        input,
      )
    ).body,
);

export const DELETE = apiRoute(
  async (input) =>
    (
      await operations.delete.run(
        { records: getRecordService(input.ctx), members: await listMembers(input.ctx) },
        input,
      )
    ).body,
);
