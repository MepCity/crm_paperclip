"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { integrationState } from "./fixture";

/** Original promotional artwork of two connected network jars with trajectory arc. */
function ConnectedNetworkJars() {
  return (
    <svg
      width="220"
      height="140"
      viewBox="0 0 220 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mb-8 select-none"
    >
      {/* Dashed trajectory arc connecting the two jars */}
      <path
        d="M62 48 C62 10, 158 10, 158 48"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Paper airplane flying along the arc */}
      <g transform="translate(105, 14) rotate(15)">
        <path
          d="M0 0 L14 5 L0 10 L3 5 Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      </g>

      {/* Left Glass Jar */}
      <g className="text-slate-400">
        {/* Jar Rim / Mouth */}
        <rect
          x="34"
          y="38"
          width="44"
          height="8"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="#f8fafc"
        />
        {/* Jar Neck & Body */}
        <path
          d="M38 46 L38 52 C38 56, 30 60, 30 66 L30 114 C30 120, 36 124, 42 124 L70 124 C76 124, 82 120, 82 114 L82 66 C82 60, 74 56, 74 52 L74 46"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="#f8fafc"
          fillOpacity="0.8"
        />
        {/* Glass reflection highlight */}
        <path
          d="M36 68 L36 112"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Left Network badge (X) inside jar */}
        <circle cx="56" cy="88" r="14" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <path
          d="M50 82 L62 94 M62 82 L50 94"
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Right Glass Jar */}
      <g className="text-slate-400">
        {/* Jar Rim / Mouth */}
        <rect
          x="142"
          y="38"
          width="44"
          height="8"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="#f8fafc"
        />
        {/* Jar Neck & Body */}
        <path
          d="M146 46 L146 52 C146 56, 138 60, 138 66 L138 114 C138 120, 144 124, 150 124 L178 124 C184 124, 190 120, 190 114 L190 66 C190 60, 182 56, 182 52 L182 46"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="#f8fafc"
          fillOpacity="0.8"
        />
        {/* Glass reflection highlight */}
        <path
          d="M144 68 L144 112"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Right Network badge (f) inside jar */}
        <circle cx="164" cy="88" r="14" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <path
          d="M166 80 C163 80, 161 82, 161 85 L161 87 L158 87 L158 90 L161 90 L161 97 L164 97 L164 90 L167 90 L168 87 L164 87 L164 85 C164 84, 165 83, 166 83 L168 83 L168 80 Z"
          fill="#334155"
        />
      </g>
    </svg>
  );
}

export function SocialEntryScreen() {
  return (
    <section
      aria-label="Social introduction"
      data-integration-state={integrationState.status}
      className="flex min-h-full flex-col items-center bg-bg px-6 pt-32 text-center text-text"
    >
      <ConnectedNetworkJars />
      <h2 className="max-w-xl text-2xl font-normal leading-relaxed">
        Engage customers, gain valuable insights and generate leads through social media by linking
        your social media accounts with your CRM.
      </h2>
      <Button
        className="mt-6 bg-none! bg-success! text-white! hover:bg-success-hover! font-semibold px-6 py-2 rounded-md shadow-sm"
        onPress={() => {
          toast({
            variant: "info",
            title: "Contact your administrator to set up social media accounts.",
          });
        }}
      >
        Let's Get Started
      </Button>
    </section>
  );
}
