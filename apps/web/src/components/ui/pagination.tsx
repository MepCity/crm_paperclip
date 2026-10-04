import { buttonSizes, buttonStyles } from "./button-styles";
import { Link } from "./link";

export interface PaginationProps {
  page: number;
  pageCount: number;
  href: (page: number) => string;
}

const disabledControlClass = `inline-flex items-center justify-center font-medium rounded-md opacity-50 cursor-not-allowed ${buttonStyles.secondary} ${buttonSizes.sm}`;

function PageControl({
  label,
  page,
  href,
  disabled,
}: {
  label: string;
  page: number;
  href: (page: number) => string;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" className={disabledControlClass}>
        {label}
      </span>
    );
  }

  return (
    <Link href={href(page)} variant="secondary" size="sm">
      {label}
    </Link>
  );
}

export function Pagination({ page, pageCount, href }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center gap-3">
      <PageControl label="Previous" page={page - 1} href={href} disabled={page <= 1} />
      <span className="text-sm text-text">
        Page {page} / {pageCount}
      </span>
      <PageControl label="Next" page={page + 1} href={href} disabled={page >= pageCount} />
    </nav>
  );
}
