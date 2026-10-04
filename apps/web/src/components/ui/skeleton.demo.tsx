import { Skeleton } from "./skeleton";

export default function SkeletonDemo() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Skeleton variant="block" />
      <Skeleton variant="row" />
      <Skeleton variant="row" />
    </div>
  );
}
