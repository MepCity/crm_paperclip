import { NotFoundError, type Transaction, withOrg } from "@crm/core";
import { and, eq, schema } from "@crm/db";
import { z } from "zod";
import { apiRoute } from "@/lib/api/server";
import { getPortalMailer } from "@/server/portals";

export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

/**
 * Test/staging only: retrieves the staging invite or reset link for a portal identity.
 * ADR 0019a §1/§5: in production, tokens travel strictly through email links; this endpoint
 * returns 404 in production, requires admin.managePortals, and strictly scopes to the caller's org.
 */
export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    if (process.env.NODE_ENV === "production" && !process.env.E2E_PORT) {
      throw new NotFoundError();
    }
    if (!uuidSchema.safeParse(params.id).success) {
      throw new NotFoundError();
    }

    const identity = await withOrg(ctx, async (tx: Transaction) => {
      const [row] = await tx
        .select({
          id: schema.portalIdentities.id,
          email: schema.portalIdentities.email,
        })
        .from(schema.portalIdentities)
        .where(
          and(
            eq(schema.portalIdentities.organizationId, ctx.orgId),
            eq(schema.portalIdentities.id, params.id),
          ),
        );
      return row ?? null;
    });

    if (!identity) {
      throw new NotFoundError();
    }

    const mailer = getPortalMailer();
    const mails = [...mailer.outbox.values()].filter(
      (m) => m.orgId === ctx.orgId && m.to.toLowerCase() === identity.email.toLowerCase(),
    );
    const mail = mails.at(-1);
    if (!mail) {
      throw new NotFoundError("No staging link found.");
    }

    const link = mail.text.match(/(https?:\/\/[^\s]+#t=[A-Za-z0-9_-]+)/)?.[1] ?? null;
    const token = mail.text.match(/#t=([A-Za-z0-9_-]+)/)?.[1] ?? null;

    return {
      link,
      token,
      kind: mail.kind,
      to: mail.to,
    };
  },
  { permission: { admin: "managePortals" } },
);
