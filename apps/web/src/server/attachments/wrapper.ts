import { getSession, listMembers, parseEnv, requireOrgContext } from "@crm/core";
import { createUploadBatchRegistry, LocalDiskBlobStore } from "@crm/core/attachments";
import {
  ForbiddenError,
  isAppError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { createFixtureAttachmentLifecycle } from "@crm/core/records/fixture";
import { encodeError } from "@/lib/api/wire/errors";
import { getRecordService } from "@/lib/records";
import { type AttachmentParams, handleAttachmentRequest } from "./http";

const blobs = new LocalDiskBlobStore();
const batches = createUploadBatchRegistry();

/** Same gate order as `apiRoute` (origin, session, organization header), but the handler owns the Response. */
export function attachmentRoute() {
  return async (
    request: Request,
    context: { params?: Promise<AttachmentParams> },
  ): Promise<Response> => {
    try {
      if (request.method.toUpperCase() !== "GET") {
        const origin = request.headers.get("Origin");
        if (origin !== new URL(parseEnv(process.env).APP_URL).origin) throw new ForbiddenError();
      }
      const session = await getSession(request.headers);
      if (!session) throw new UnauthenticatedError();
      const orgSlug = request.headers.get("X-CRM-ORG");
      if (orgSlug === null || orgSlug.trim() === "")
        throw new ValidationError({ organization: ["An organization header is required."] });
      const ctx = await requireOrgContext(request.headers, orgSlug);
      const params = (await context.params) as AttachmentParams;
      return await handleAttachmentRequest(
        {
          ctx,
          records: getRecordService(ctx),
          lifecycle: createFixtureAttachmentLifecycle(ctx),
          blobs,
          batches,
          memberNames: async () =>
            new Map((await listMembers(ctx)).map((member) => [member.userId, member.name])),
        },
        params,
        request,
      );
    } catch (error) {
      if (!isAppError(error)) console.error("Unexpected API error", error);
      const encoded = encodeError(error);
      return Response.json(encoded.body, {
        status: encoded.status,
        headers: { "Cache-Control": "no-store" },
      });
    }
  };
}
