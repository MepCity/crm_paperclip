import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";

/** Server navigation keeps the same read-only pending states as the loaded screens. */
export function WorkflowRulesLoading({ orgSlug }: { orgSlug?: string }) {
  const detail = orgSlug !== undefined;
  return (
    <section
      aria-label={detail ? "Workflow Rule Details" : "Workflow Rules"}
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs p-6"
    >
      {detail ? (
        <div className="mb-6">
          <Link
            href={`/crm/${encodeURIComponent(orgSlug)}/settings/workflow-rules`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Icons.chevronLeft className="size-4" aria-hidden="true" />
            Back to Workflow Rules
          </Link>
        </div>
      ) : (
        <h2 className="text-xl font-semibold text-text">Workflow Rules</h2>
      )}
      <div role="status" aria-live="polite" className="py-12 text-center text-text-muted">
        <Icons.spinner
          className="inline size-6 animate-spin text-primary mr-2"
          aria-hidden="true"
        />
        <span>{detail ? "Loading rule details..." : "Loading workflow rules..."}</span>
      </div>
    </section>
  );
}
