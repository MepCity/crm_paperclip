import { Icons } from "./icon";

export function Spinner({ className }: { className?: string }) {
  return <Icons.spinner className={`animate-spin ${className || ""}`} />;
}
