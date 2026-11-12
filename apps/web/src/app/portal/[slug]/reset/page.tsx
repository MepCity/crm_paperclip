"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { completePortalReset, requestPortalReset } from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";

export default function PortalResetPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { refresh } = usePortal();

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Request reset state
  const [email, setEmail] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Complete reset state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/#t=([A-Za-z0-9_-]+)/);
    if (match?.[1]) {
      setToken(match[1]);
    } else {
      setToken(null);
    }
    setTokenChecked(true);
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPortalReset(slug, email);
      setRequestSubmitted(true);
    } catch (err) {
      // Even on failure, server returns 202, but if network error:
      setError(err instanceof Error ? err.message : "Failed to send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This link is no longer valid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await completePortalReset(slug, { token, password });
      await refresh();
      router.push(`/portal/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link is no longer valid.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tokenChecked) return null;

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        {token ? (
          // Mode: Complete Password Reset
          <>
            <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
              Reset Your Password
            </h1>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Enter a new secure password for your portal account.
            </p>

            {error && (
              <div
                data-testid="portal-reset-error"
                className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleCompleteSubmit}
              data-testid="portal-reset-complete-form"
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="portal-reset-password"
                  className="block text-xs font-semibold text-[var(--color-text)]"
                >
                  New Password
                </label>
                <input
                  id="portal-reset-password"
                  data-testid="portal-reset-password"
                  type="password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="At least 12 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="portal-reset-confirm"
                  className="block text-xs font-semibold text-[var(--color-text)]"
                >
                  Confirm Password
                </label>
                <input
                  id="portal-reset-confirm"
                  data-testid="portal-reset-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-testid="portal-reset-submit"
                className="w-full rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Set New Password"}
              </button>
            </form>
          </>
        ) : requestSubmitted ? (
          // Mode: Request submitted confirmation
          <div className="text-center" data-testid="portal-reset-success">
            <h1 className="mb-2 text-xl font-bold text-[var(--color-text)]">Check Your Email</h1>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              If an account exists for this email, we have sent a link to reset the password.
            </p>
            <Link
              href={`/portal/${encodeURIComponent(slug)}/login`}
              className="inline-block text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          // Mode: Request Password Reset Form
          <>
            <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">Forgot Password</h1>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Enter your email address to receive a secure link to reset your password.
            </p>

            {error && (
              <div
                data-testid="portal-reset-error"
                className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleRequestSubmit}
              data-testid="portal-reset-request-form"
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="portal-reset-email"
                  className="block text-xs font-semibold text-[var(--color-text)]"
                >
                  Email Address
                </label>
                <input
                  id="portal-reset-email"
                  data-testid="portal-reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-testid="portal-reset-submit"
                className="w-full rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href={`/portal/${encodeURIComponent(slug)}/login`}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
