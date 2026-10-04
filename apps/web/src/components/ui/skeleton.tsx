const skeletonStyles = {
  row: "h-4 w-full",
  block: "h-24 w-full",
} as const;

export function Skeleton({ variant = "block" }: { variant?: keyof typeof skeletonStyles }) {
  return (
    <div>
      <span role="status" className="sr-only">
        Loading
      </span>
      <div
        aria-hidden="true"
        className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-hover ${skeletonStyles[variant]}`}
      />
    </div>
  );
}
