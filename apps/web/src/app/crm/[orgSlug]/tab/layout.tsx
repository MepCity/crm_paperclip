import type { ReactNode } from "react";
import { ApiProvider } from "@/lib/api/client/provider";

export default async function CrmTabLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <ApiProvider orgSlug={orgSlug}>{children}</ApiProvider>;
}
