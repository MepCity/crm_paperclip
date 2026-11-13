"use client";

import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { acceptPortalInvite } from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";

export default function PortalAcceptPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { refresh } = usePortal();

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from hash #t=<token>
    const hash = window.location.hash;
    const match = hash.match(/#t=([A-Za-z0-9_-]+)/);
    if (match?.[1]) {
      setToken(match[1]);
    } else {
      setToken(null);
    }
    setTokenChecked(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      await acceptPortalInvite(slug, { token, password });
      await refresh();
      router.push(`/portal/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link is no longer valid.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tokenChecked) {
    return null;
  }

  if (!token) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-[var(--color-text)]">Invalid Invitation</h1>
          <p data-testid="portal-accept-invalid" className="text-sm text-[var(--color-text-muted)]">
            This link is no longer valid. Please request a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">Accept Invitation</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Create a secure password to activate your portal account.
        </p>

        {error && (
          <div
            data-testid="portal-accept-error"
            className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="portal-accept-form" className="space-y-4">
          <div>
            <label
              htmlFor="portal-accept-password"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              New Password
            </label>
            <input
              id="portal-accept-password"
              data-testid="portal-accept-password"
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="At least 12 characters"
            />
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              Must be at least 12 characters with upper, lower, numbers, and symbols.
            </p>
          </div>

          <div>
            <label
              htmlFor="portal-accept-confirm"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              Confirm Password
            </label>
            <input
              id="portal-accept-confirm"
              data-testid="portal-accept-confirm"
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
            data-testid="portal-accept-submit"
            className="w-full rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {submitting ? "Activating account..." : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
