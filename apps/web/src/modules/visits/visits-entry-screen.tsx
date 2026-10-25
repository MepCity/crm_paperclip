"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import { integrationState } from "./fixture";

const slides = [
  {
    titleKey: "modules.visits.generateQualifiedLeads",
    textKey: "modules.visits.identifyProspects",
    title: "Generate More Qualified Leads",
    text: "Identify important prospects on your website, engage them in real time and convert them to leads-all without leaving your CRM window.",
  },
  {
    titleKey: "modules.visits.understandVisitors",
    textKey: "modules.visits.exploreVisitors",
    title: "Understand Your Visitors",
    text: "Explore how visitors discover your website and the pages that interest them.",
  },
  {
    titleKey: "modules.visits.startConversations",
    textKey: "modules.visits.reachVisitors",
    title: "Start Meaningful Conversations",
    text: "Reach visitors while they explore your website.",
  },
  {
    titleKey: "modules.visits.recognizeReturning",
    textKey: "modules.visits.keepEngagement",
    title: "Recognize Returning Interest",
    text: "Keep website engagement in context as relationships grow.",
  },
  {
    titleKey: "modules.visits.connectVisits",
    textKey: "modules.visits.bringInsights",
    title: "Connect Visits and Conversations",
    text: "Bring visitor insights together with your team's customer conversations.",
  },
  {
    titleKey: "modules.visits.helpTeamFollowUp",
    textKey: "modules.visits.useInterest",
    title: "Help Your Team Follow Up",
    text: "Use visitor interest to focus on the next conversation.",
  },
] as const;

/** Original promotional visitor panel diagram matching reference layout. */
function VisitorArtwork({ slide: _slide }: { slide: number }) {
  return (
    <svg
      width="520"
      height="260"
      viewBox="0 0 520 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mx-auto select-none rounded-lg shadow-lg"
    >
      <defs>
        <filter
          id="card-shadow"
          x="30"
          y="135"
          width="220"
          height="115"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Outer mock window */}
      <rect
        x="0"
        y="0"
        width="520"
        height="260"
        rx="8"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="1"
      />

      {/* Top mock window bar */}
      <path
        d="M0 8 C0 3.5 3.5 0 8 0 L512 0 C516.5 0 520 3.5 520 8 L520 26 L0 26 Z"
        fill="#1e293b"
      />
      <circle cx="16" cy="13" r="3.5" fill="#ef4444" />
      <circle cx="26" cy="13" r="3.5" fill="#f59e0b" />
      <circle cx="36" cy="13" r="3.5" fill="#10b981" />
      <text x="50" y="17" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
        Visitor Tracking
      </text>

      {/* Background CRM table */}
      <g>
        <text x="20" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Lead Name
        </text>
        <text x="110" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Company
        </text>
        <text x="195" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Status
        </text>
        <line x1="15" y1="54" x2="265" y2="54" stroke="#e2e8f0" strokeWidth="1" />

        {/* Row 1 - active */}
        <rect x="15" y="60" width="250" height="22" rx="3" fill="#f0f9ff" />
        <text x="20" y="75" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Patricia Boyle
        </text>
        <text x="110" y="75" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Acme Corp
        </text>
        <rect x="195" y="65" width="52" height="12" rx="2" fill="#dbeafe" />
        <text
          x="200"
          y="74"
          fill="#1d4ed8"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Contacted
        </text>

        {/* Row 2 */}
        <text x="20" y="99" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          James Wilson
        </text>
        <text x="110" y="99" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Global Systems
        </text>
        <rect x="195" y="89" width="30" height="12" rx="2" fill="#f1f5f9" />
        <text x="200" y="98" fill="#475569" fontSize="7.5" fontFamily="sans-serif">
          New
        </text>

        {/* Row 3 */}
        <text x="20" y="123" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          Sarah Connor
        </text>
        <text x="110" y="123" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Cyberdyne
        </text>
        <rect x="195" y="113" width="42" height="12" rx="2" fill="#f1f5f9" />
        <text x="200" y="122" fill="#475569" fontSize="7.5" fontFamily="sans-serif">
          Qualified
        </text>

        {/* Row 4 */}
        <text x="20" y="147" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          Michael Chang
        </text>
        <text x="110" y="147" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Pacific Trade
        </text>
        <rect x="195" y="137" width="52" height="12" rx="2" fill="#f1f5f9" />
        <text x="200" y="146" fill="#475569" fontSize="7.5" fontFamily="sans-serif">
          In Progress
        </text>
      </g>

      {/* Floating "Visit History" popup card */}
      <g filter="url(#card-shadow)">
        <rect
          x="35"
          y="140"
          width="205"
          height="96"
          rx="6"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <text x="46" y="157" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          Visit History
        </text>
        <line x1="42" y1="163" x2="232" y2="163" stroke="#f1f5f9" strokeWidth="1" />

        <text x="46" y="176" fill="#64748b" fontSize="8" fontFamily="sans-serif">
          Page
        </text>
        <text x="160" y="176" fill="#64748b" fontSize="8" fontFamily="sans-serif">
          Time Spent
        </text>

        <text x="46" y="191" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Pricing
        </text>
        <text x="160" y="191" fill="#334155" fontSize="9" fontFamily="sans-serif">
          155 mins
        </text>

        <text x="46" y="206" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Features
        </text>
        <text x="160" y="206" fill="#334155" fontSize="9" fontFamily="sans-serif">
          190 mins
        </text>

        <line x1="42" y1="213" x2="232" y2="213" stroke="#f1f5f9" strokeWidth="1" />
        <text
          x="46"
          y="225"
          fill="#94a3b8"
          fontSize="7.5"
          fontStyle="italic"
          fontFamily="sans-serif"
        >
          Due to visitor inactivity, chat has ended
        </text>
      </g>

      {/* Floating "Visitors Online" dark panel on right */}
      <g>
        <rect
          x="272"
          y="38"
          width="236"
          height="210"
          rx="6"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="1"
        />

        <circle cx="288" cy="54" r="3.5" fill="#10b981" />
        <text x="298" y="58" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          Visitors Online (2)
        </text>
        <text x="446" y="58" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
          All Portals ▾
        </text>
        <line x1="278" y1="67" x2="502" y2="67" stroke="#1e293b" strokeWidth="1" />

        {/* Visitor 1 */}
        <rect x="280" y="74" width="220" height="70" rx="4" fill="#1e293b" />
        <circle cx="292" cy="90" r="3" fill="#10b981" />
        <text x="300" y="93" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          Patricia
        </text>
        <text x="462" y="93" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          $5,000
        </text>
        <text x="292" y="108" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
          Now in: Acme Corp
        </text>
        <text x="292" y="126" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
          6 Pages · 01:29
        </text>
        <path
          d="M480 118 C476 118 473 121 473 124 C473 126 474 127 475 128 L474 131 L477 130 C478 130 479 130 480 130 C484 130 487 127 487 124 C487 121 484 118 480 118 Z"
          fill="#10b981"
        />

        {/* Visitor 2 */}
        <rect x="280" y="152" width="220" height="70" rx="4" fill="#1e293b" />
        <circle cx="292" cy="168" r="3" fill="#10b981" />
        <text
          x="300"
          y="171"
          fill="#e2e8f0"
          fontSize="10"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Visitor 43703
        </text>
        <text x="452" y="171" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
          Score: 20
        </text>
        <text x="292" y="186" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif">
          United States
        </text>
        <text x="292" y="204" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
          4 Pages · 02:10
        </text>
        <path
          d="M480 196 C476 196 473 199 473 202 C473 204 474 205 475 206 L474 209 L477 208 C478 208 479 208 480 208 C484 208 487 205 487 202 C487 199 484 196 480 196 Z"
          fill="#64748b"
        />
      </g>
    </svg>
  );
}

export function VisitsEntryScreen() {
  const t = useUiTranslations();
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
      <h2 className="text-2xl font-semibold">{t("modules.visits.visitorTracking")}</h2>
      <p className="mt-1 text-md text-text-muted">{t("modules.visits.visitorTrackingSubtitle")}</p>
      <section
        aria-label="Visitor tracking features"
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
