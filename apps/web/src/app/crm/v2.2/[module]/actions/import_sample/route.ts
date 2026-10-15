import { transferRoute } from "@/lib/api/transfer-route";
import { transferOperations } from "@/lib/api/wire/transfer";

export const dynamic = "force-dynamic";

export const GET = transferRoute(transferOperations.sampleCsv, { orgFromQuery: true });
