import type { ReactNode } from "react";

export interface FormErrorBannerProps {
  children: ReactNode;
}

/** Single-line save error below the sticky form title strip (MEP-168). */
export function FormErrorBanner({ children }: FormErrorBannerProps) {
  return (
    <p className="record-form-error-banner" role="alert" data-record-form-error-banner>
      {children}
    </p>
  );
}
