import { operationRoute } from "@/lib/api/operation-route";
import { operations } from "@/lib/api/wire/operations";

export const dynamic = "force-dynamic";

export const POST = operationRoute(operations.create);

export const DELETE = operationRoute(operations.delete);
