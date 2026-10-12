import type { ReactNode } from "react";
import { CenteredCardFrame } from "@/components/centered-card-frame";

export function OnboardingFrame({ title, children }: { title: string; children: ReactNode }) {
  return <CenteredCardFrame title={title}>{children}</CenteredCardFrame>;
}
