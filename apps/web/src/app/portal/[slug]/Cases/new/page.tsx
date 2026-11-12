"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { createPortalRecord } from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";
import { PortalNotFound } from "@/modules/external-portal/portal-not-found";

export default function PortalNewCasePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();

  const { session, loading: sessionLoading } = usePortal();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const casesConfig = session?.userType?.modules?.Cases;
  const canCreate = Boolean(casesConfig?.enabled && casesConfig?.actions?.create);

  if (sessionLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
    );
  }

  if (!canCreate) {
    return (
      <PortalNotFound
        slug={slug}
        title="Access Denied"
        message="You do not have permission to create support cases."
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createPortalRecord(slug, "Cases", {
        Subject: subject.trim(),
        Description: description.trim() || undefined,
        Priority: priority,
      });
      router.push(`/portal/${encodeURIComponent(slug)}/Cases/${encodeURIComponent(res.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="portal-new-case-page">
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={`/portal/${encodeURIComponent(slug)}/Cases`}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            &larr; Back to Cases
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">Submit New Case</h1>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Provide details about your question or issue, and our team will get back to you.
        </p>
      </div>

      {error && (
        <div
          data-testid="portal-case-error"
          className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {error}
        </div>
      )}

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs">
        <form onSubmit={handleSubmit} data-testid="portal-new-case-form" className="space-y-4">
          <div>
            <label
              htmlFor="case-subject"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="case-subject"
              data-testid="portal-case-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label
              htmlFor="case-priority"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              Priority
            </label>
            <select
              id="case-priority"
              data-testid="portal-case-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="case-description"
              className="block text-xs font-semibold text-[var(--color-text)]"
            >
              Description
            </label>
            <textarea
              id="case-description"
              data-testid="portal-case-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Describe what you need help with..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Link
              href={`/portal/${encodeURIComponent(slug)}/Cases`}
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              data-testid="portal-case-submit"
              className="rounded bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
