import { Breadcrumbs } from "./breadcrumbs";

export default function BreadcrumbsDemo() {
  return (
    <Breadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label: "Leads", href: "/leads" },
        { label: "Record" },
      ]}
    />
  );
}
