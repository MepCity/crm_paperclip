import { Pagination } from "./pagination";

function href(page: number) {
  return `/dev/ui?page=${page}`;
}

export default function PaginationDemo() {
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-text">First page</legend>
        <Pagination page={1} pageCount={5} href={href} />
      </fieldset>
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-text">Middle page</legend>
        <Pagination page={3} pageCount={5} href={href} />
      </fieldset>
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-text">Last page</legend>
        <Pagination page={5} pageCount={5} href={href} />
      </fieldset>
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-text">Single page</legend>
        <Pagination page={1} pageCount={1} href={href} />
      </fieldset>
    </div>
  );
}
