import Link from "next/link";

interface PortalNotFoundProps {
  slug: string;
  title?: string;
  message?: string;
}

export function PortalNotFound({
  slug,
  title = "Page or Record Not Found",
  message = "The record or page you requested is not available or does not exist.",
}: PortalNotFoundProps) {
  return (
    <div
      data-testid="portal-not-found"
      className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="mx-auto max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-4 text-4xl font-bold text-[var(--color-text-muted)]">404</div>
        <h1 className="mb-2 text-xl font-semibold text-[var(--color-text)]">{title}</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">{message}</p>
        <Link
          href={`/portal/${encodeURIComponent(slug)}`}
          className="inline-flex items-center justify-center rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
        >
          Return to Portal Home
        </Link>
      </div>
    </div>
  );
}
