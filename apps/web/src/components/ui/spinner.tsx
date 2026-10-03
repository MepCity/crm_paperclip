import { Icons } from "./icon";

export interface SpinnerProps {
  className?: string;
  label?: string;
  "aria-hidden"?: boolean;
}

export function Spinner({
  className = "",
  label = "Loading",
  "aria-hidden": hidden,
}: SpinnerProps) {
  const icon = <Icons.spinner className="h-full w-full animate-spin" aria-hidden="true" />;

  if (hidden) {
    return (
      <span aria-hidden className={`inline-flex ${className}`}>
        {icon}
      </span>
    );
  }

  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      {icon}
    </span>
  );
}
