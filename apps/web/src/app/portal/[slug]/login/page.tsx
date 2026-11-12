"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { loginPortal } from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";

export default function PortalLoginPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { refresh } = usePortal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginPortal(slug, { email, password });
      await refresh();
      router.push(`/portal/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">Sign In</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Access your customer portal to view and manage your records.
        </p>

        {error && (
          <div
            data-testid="portal-login-error"
            className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="portal-login-form" className="space-y-4">
          <div>
            <label
              htmlFor="portal-login-email"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              Email Address
            </label>
            <input
              id="portal-login-email"
              data-testid="portal-login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="portal-login-password"
                className="block text-xs font-semibold text-[var(--color-text)]"
              >
                Password
              </label>
              <Link
                href={`/portal/${encodeURIComponent(slug)}/reset`}
                className="text-xs text-[var(--color-primary)] hover:underline"
                data-testid="portal-forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="portal-login-password"
              data-testid="portal-login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="portal-login-submit"
            className="w-full rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
