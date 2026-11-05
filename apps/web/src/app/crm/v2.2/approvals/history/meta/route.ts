import { apiRoute } from "@/lib/api/server";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => getApprovals().historyMeta(ctx));
