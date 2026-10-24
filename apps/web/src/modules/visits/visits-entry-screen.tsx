"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { integrationState } from "./fixture";

const slides = [
  {
    title: "Generate More Qualified Leads",
    text: "Discover interested visitors, understand their needs and bring conversations into your CRM.",
  },
  {
    title: "Understand Your Visitors",
    text: "Explore how visitors discover your website and the pages that interest them.",
  },
  {
    title: "Start Meaningful Conversations",
    text: "Reach visitors while they explore your website.",
  },
  {
    title: "Recognize Returning Interest",
    text: "Keep website engagement in context as relationships grow.",
  },
  {
    title: "Connect Visits and Conversations",
    text: "Bring visitor insights together with your team's customer conversations.",
  },
  {
    title: "Help Your Team Follow Up",
    text: "Use visitor interest to focus on the next conversation.",
  },
] as const;

/** Original promotional diagram; decorative blocks are not visit records or live controls. */
function VisitorArtwork({ slide }: { slide: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex h-72 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
    >
      <div className="absolute inset-x-0 top-0 flex h-6 items-center gap-2 bg-rail-surface px-3">
        <span className="size-2 rounded-full bg-rail-text" />
        <span className="h-1 w-24 rounded bg-rail-text" />
      </div>
      <div className="mt-6 w-1/4 border-r border-border bg-bg p-4">
        <Icons.users className="mb-5 size-7 text-primary" />
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="mb-4 h-2 rounded bg-border" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-5 px-6 py-12">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <span
              className={`size-7 rounded-full ${row === slide % 4 ? "bg-primary" : "bg-primary-subtle"}`}
            />
            <div className="flex flex-1 flex-col gap-2">
              <span className="h-2 w-3/4 rounded bg-border" />
              <span className="h-2 w-1/2 rounded bg-bg" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 flex h-24 w-36 items-center justify-center gap-4 rounded-lg border border-border bg-surface shadow-md">
        <Icons.messageSquare className="size-8 text-primary" />
        <Icons.activity className="size-8 text-success" />
      </div>
    </div>
  );
}

export function VisitsEntryScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const step = (offset: number) =>
    setIndex((current) => (current + offset + slides.length) % slides.length);
  return (
    <section
      aria-label="Visits introduction"
      data-integration-state={integrationState.status}
      className="min-h-full bg-bg px-6 py-16 text-center text-text"
    >
      <h2 className="text-2xl font-semibold">Visitor Tracking</h2>
      <p className="mt-1 text-md text-text-muted">Powered by a visitor tracking integration</p>
      <section
        aria-label="Visitor tracking features"
        aria-roledescription="carousel"
        className="mx-auto mt-16 max-w-3xl"
      >
        <div className="flex items-center gap-8">
          <Button
            variant="icon"
            size="compact"
            aria-label="Previous slide"
            onPress={() => step(-1)}
            className="size-8 rounded-full! bg-border!"
          >
            <Icons.chevronLeft className="size-5" aria-hidden />
          </Button>
          <VisitorArtwork slide={index} />
          <Button
            variant="icon"
            size="compact"
            aria-label="Next slide"
            onPress={() => step(1)}
            className="size-8 rounded-full! bg-border!"
          >
            <Icons.chevronRight className="size-5" aria-hidden />
          </Button>
        </div>
        <div aria-live="polite" aria-atomic="true" className="mt-5 min-h-20">
          <h3 className="text-xl font-semibold">{slide.title}</h3>
          <p className="mx-auto mt-2 max-w-xl text-md">{slide.text}</p>
        </div>
        <fieldset className="mt-3 flex justify-center gap-3" aria-label="Choose a slide">
          {slides.map((item, position) => (
            <Button
              key={item.title}
              variant="ghost"
              size="compact"
              aria-label={`Slide ${position + 1}`}
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
      <Button className="mt-10 w-48" aria-disabled="true" aria-describedby="visits-setup-boundary">
        Get Started
      </Button>
      <p id="visits-setup-boundary" className="mt-3 text-sm text-text-muted">
        Integration not connected. Setup is not available in this build.
      </p>
    </section>
  );
}
