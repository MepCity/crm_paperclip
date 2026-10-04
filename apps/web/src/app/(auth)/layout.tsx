import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { APP_NAME } from "../../app-info";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-lg font-medium text-text">{APP_NAME}</h1>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
