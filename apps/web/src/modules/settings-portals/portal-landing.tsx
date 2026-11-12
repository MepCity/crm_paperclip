"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useUiTranslations } from "@/i18n/client-provider";

interface PortalLandingProps {
  onGetStarted: () => void;
}

export function PortalLanding({ onGetStarted }: PortalLandingProps) {
  const t = useUiTranslations();

  return (
    <div id="result" className="p-8 max-w-4xl" data-testid="portal-landing">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <h2
          data-zcqa="CustomerPortalTitle"
          className="text-xl font-semibold text-foreground tracking-tight"
        >
          {t("modules.portals.title")}
        </h2>
        <Link
          href="#help"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          data-testid="portal-help-link"
        >
          <Icons.help className="size-4" aria-hidden="true" />
          <span>{t("modules.portals.help")}</span>
        </Link>
      </div>

      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        {t("modules.portals.description")}
      </p>

      <div className="mt-6">
        <Button
          id="client_portal_getStarted"
          data-zcqa="CustomerPortalGettingStartedButton"
          data-testid="get-started-button"
          variant="primary"
          onPress={onGetStarted}
          className="px-5 py-2 text-sm font-semibold rounded-md shadow-xs"
        >
          {t("modules.portals.getStarted")}
        </Button>
      </div>
    </div>
  );
}
