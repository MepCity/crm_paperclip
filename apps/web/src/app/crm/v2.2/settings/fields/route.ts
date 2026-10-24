import { operationRoute } from "@/lib/api/operation-route";
import { operations } from "@/lib/api/wire/operations";

export const dynamic = "force-dynamic";

export const GET = operationRoute(operations.fields);

export const POST = operationRoute(operations.createField);

export const PATCH = operationRoute(operations.patchField);

export const DELETE = operationRoute(operations.retireField);
