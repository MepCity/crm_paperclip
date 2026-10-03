import { z } from "zod";

const databaseUrl = z
  .string()
  .min(1, "DATABASE_URL is required")
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: "DATABASE_URL must be a postgres:// or postgresql:// URL",
  });

const envSchema = z.object({
  DATABASE_URL: databaseUrl,
});

export type Env = z.infer<typeof envSchema>;

/** Validates the process environment the application needs. Throws one readable error. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${problems}`);
  }
  return result.data;
}
