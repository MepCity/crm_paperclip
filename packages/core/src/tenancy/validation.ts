import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const uuidInput = z.uuid();
export const roleInput = z.enum(["admin", "member"]);
const reservedOrgSlug = /^v\d+(?:\.\d+)?$/;

const slugShape = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and interior hyphens.");

export const slugInput = z
  .string()
  .refine((value) => !reservedOrgSlug.test(value), "This slug is reserved.")
  .pipe(slugShape);
export const emailInput = z
  .string()
  .trim()
  .pipe(z.email())
  .transform((value) => value.toLowerCase());
export const tokenInput = z.string().min(1);

export function createInvitationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
