import type { ReactNode } from "react";
import { CenteredCardFrame } from "@/components/centered-card-frame";
import { APP_NAME } from "../../app-info";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <CenteredCardFrame title={APP_NAME}>{children}</CenteredCardFrame>;
}
