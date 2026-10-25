"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import { integrationState } from "./fixture";
import { VisitorArtwork } from "./visitor-artwork.fixture";

const slides = [
  {
    id: "generateQualifiedLeads",
    titleKey: "modules.visits.generateQualifiedLeads",
    textKey: "modules.visits.identifyProspects",
  },
  {
    id: "understandVisitors",
    titleKey: "modules.visits.understandVisitors",
    textKey: "modules.visits.exploreVisitors",
  },
  {
    id: "startConversations",
    titleKey: "modules.visits.startConversations",
    textKey: "modules.visits.reachVisitors",
  },
  {
    id: "recognizeReturning",
    titleKey: "modules.visits.recognizeReturning",
    textKey: "modules.visits.keepEngagement",
  },
  {
    id: "connectVisits",
    titleKey: "modules.visits.connectVisits",
    textKey: "modules.visits.bringInsights",
  },
  {
    id: "helpTeamFollowUp",
    titleKey: "modules.visits.helpTeamFollowUp",
    textKey: "modules.visits.useInterest",
  },
] as const;

export function VisitsEntryScreen() {
  const t = useUiTranslations();
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const step = (offset: number) =>
    setIndex((current) => (current + offset + slides.length) % slides.length);
  return (
    <section
      aria-label={t("modules.visits.visitsIntro")}
      data-integration-state={integrationState.status}
      className="min-h-full bg-bg px-6 py-16 text-center text-text"
    >
      <h2 className="text-2xl font-semibold">{t("modules.visits.visitorTracking")}</h2>
      <p className="mt-1 text-md text-text-muted">{t("modules.visits.visitorTrackingSubtitle")}</p>
      <section
        aria-label={t("modules.visits.trackingFeatures")}
        aria-roledescription="carousel"
        className="mx-auto mt-16 max-w-3xl"
      >
        <div className="flex items-center gap-8">
          <Button
            variant="icon"
            size="compact"
            aria-label={t("modules.visits.previousSlide")}
            onPress={() => step(-1)}
            className="size-8 rounded-full! bg-border!"
          >
            <Icons.chevronLeft className="size-5" aria-hidden />
          </Button>
          <VisitorArtwork slide={index} />
          <Button
            variant="icon"
            size="compact"
            aria-label={t("modules.visits.nextSlide")}
            onPress={() => step(1)}
            className="size-8 rounded-full! bg-border!"
          >
            <Icons.chevronRight className="size-5" aria-hidden />
          </Button>
        </div>
        <div aria-live="polite" aria-atomic="true" className="mt-5 min-h-20">
          <h3 className="text-xl font-semibold">{t(slide.titleKey)}</h3>
          <p className="mx-auto mt-2 max-w-xl text-md">{t(slide.textKey)}</p>
        </div>
        <fieldset
          className="mt-3 flex justify-center gap-3"
          aria-label={t("modules.visits.chooseSlide")}
        >
          {slides.map((item, position) => (
            <Button
              key={item.id}
              variant="ghost"
              size="compact"
              aria-label={t("modules.visits.slideN", { number: position + 1 })}
              aria-pressed={index === position}
              onPress={() => setIndex(position)}
              className="size-5 rounded-full"
            >
              <span
                aria-hidden
                className={`size-2.5 rounded-full ${index === position ? "bg-primary" : "bg-border"}`}
              />
            </Button>
          ))}
        </fieldset>
      </section>
      <Button
        className="mt-10 w-48"
        onPress={() => {
          toast({
            variant: "info",
            title: t("modules.visits.getStartedMsg"),
          });
        }}
      >
        {t("modules.visits.getStarted")}
      </Button>
    </section>
  );
}
