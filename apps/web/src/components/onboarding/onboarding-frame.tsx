import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OnboardingFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
