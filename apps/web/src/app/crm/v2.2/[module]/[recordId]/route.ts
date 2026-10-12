import { operationRoute } from "@/lib/api/operation-route";
import { operations } from "@/lib/api/wire/operations";

export const dynamic = "force-dynamic";

export const GET = operationRoute(operations.record);

export const PUT = operationRoute(operations.update);

export const DELETE = operationRoute(operations.delete);
