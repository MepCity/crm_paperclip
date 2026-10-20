"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import "./print-page.css";

export function PrintToolbar({ title, moduleLabel }: { title: string; moduleLabel: string }) {
  const router = useRouter();
  return (
    <header className="print-page__toolbar">
      <div>
        <div className="print-page__module">{moduleLabel}</div>
        <h1 className="print-page__title">{title}</h1>
      </div>
      <div className="print-page__actions">
        <Button variant="primary" onPress={() => window.print()}>
          Print
        </Button>
        <Button variant="secondary" onPress={() => router.back()}>
          Close
        </Button>
      </div>
    </header>
  );
}
