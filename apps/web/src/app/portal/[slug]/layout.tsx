import type React from "react";
import { PortalProvider } from "@/modules/external-portal/portal-context";
import { PortalShell } from "@/modules/external-portal/portal-shell";

export const metadata = {
  title: "Customer Portal",
  description: "Secure Client Access Portal",
};

export default async function PortalSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PortalProvider slug={slug}>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
