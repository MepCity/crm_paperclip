import { operationRoute } from "@/lib/api/operation-route";
import { operations } from "@/lib/api/wire/operations";

export const dynamic = "force-dynamic";

export const GET = operationRoute(operations.view);

export const PATCH = operationRoute(operations.patchSharedView);

export const DELETE = operationRoute(operations.deleteSharedView);
