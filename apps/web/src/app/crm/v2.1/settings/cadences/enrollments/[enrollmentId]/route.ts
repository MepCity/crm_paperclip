import { z } from "zod";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

const enrollmentActionSchema = z.object({
  action: z.enum(["pause", "resume", "unenroll"]),
  reason: z.string().optional(),
});

export const GET = apiRoute<{ enrollmentId: string }>(
  async ({ ctx, params }) => {
    const enrollment = await getCadences().getEnrollment(ctx, params.enrollmentId);
    const stepRuns = await getCadences().listStepRuns(ctx, params.enrollmentId);
    return { enrollment, stepRuns };
  },
  { permission: { feature: "cadences", action: "view" } },
);

export const POST = apiRoute<{ enrollmentId: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, enrollmentActionSchema);
    if (input.action === "pause") {
      const enrollment = await getCadences().pauseEnrollment(ctx, params.enrollmentId);
      return { enrollment };
    }
    if (input.action === "resume") {
      const enrollment = await getCadences().resumeEnrollment(ctx, params.enrollmentId);
      return { enrollment };
    }
    const enrollment = await getCadences().unenrollRecord(
      ctx,
      params.enrollmentId,
      input.reason ?? "manual_unenroll",
    );
    return { enrollment };
  },
  { permission: { memberOnly: "manage_cadence_enrollment" } },
);
