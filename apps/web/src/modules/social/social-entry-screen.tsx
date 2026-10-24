"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { integrationState } from "./fixture";

export function SocialEntryScreen() {
  return (
    <section
      aria-label="Social introduction"
      data-integration-state={integrationState.status}
      className="flex min-h-full flex-col items-center bg-bg px-6 pt-40 text-center text-text"
    >
      <div
        aria-hidden="true"
        className="relative mb-6 flex h-36 w-48 items-end justify-center gap-5 text-primary"
      >
        <div className="flex h-28 w-20 items-center justify-center rounded-2xl border border-control-border bg-surface">
          <Icons.messageSquare className="size-9" />
        </div>
        <div className="flex h-28 w-20 items-center justify-center rounded-2xl border border-control-border bg-surface">
          <Icons.users className="size-9" />
        </div>
        <span className="absolute inset-x-8 top-0 h-12 rounded-t-full border-t border-dashed border-control-border" />
      </div>
      <h2 className="max-w-xl text-2xl font-normal">
        Engage customers, gain insights and generate leads by linking your social media accounts
        with your CRM.
      </h2>
      <Button
        aria-disabled="true"
        aria-describedby="social-setup-boundary"
        className="mt-6 bg-success bg-none text-success-text"
      >
        Let's Get Started
      </Button>
      <p id="social-setup-boundary" className="mt-3 text-sm text-text-muted">
        Integration not connected. Setup is not available in this build.
      </p>
    </section>
  );
}
