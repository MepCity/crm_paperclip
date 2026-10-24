"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button-styles";

interface SetupChoice {
  key: string;
  label: string;
  title: string;
  description: string;
  action: string;
}

const choices: SetupChoice[] = [
  {
    key: "team",
    label: "Invite your team",
    title: "Invite your team",
    description:
      "Stay connected and collaborate with your team members to share sales updates from one platform.",
    action: "Invite users",
  },
  {
    key: "pipeline",
    label: "Configure your deals pipeline",
    title: "Configure your deals pipeline",
    description: "Set up the stages your deals move through so progress is easy to follow.",
    action: "Configure pipeline",
  },
  {
    key: "email",
    label: "Connect to your email account",
    title: "Connect to your email account",
    description: "Bring your email conversations next to your records in one place.",
    action: "Connect email",
  },
  {
    key: "migrate",
    label: "Migrate your existing data",
    title: "Migrate your existing data",
    description: "Bring your existing records into the CRM so you can start working right away.",
    action: "Start migration",
  },
  {
    key: "integration",
    label: "Integration",
    title: "Integration",
    description: "Connect the tools you already use to make your CRM smarter and more interactive.",
    action: "Browse integrations",
  },
];

const actionClass = `inline-flex h-9 items-center rounded-md px-4 text-sm ${buttonStyles.primary}`;

export function HomeOnboarding({ orgSlug, userName }: { orgSlug: string; userName: string }) {
  const [selected, setSelected] = useState(choices[0]?.key ?? "");
  const current = choices.find((choice) => choice.key === selected) ?? choices[0];

  return (
    <div className="relative mx-auto flex max-w-6xl gap-6 px-8 py-10" data-testid="home-onboarding">
      <button
        type="button"
        className="absolute right-8 top-2 rounded-md border border-(--color-button-border) bg-surface px-4 py-2 text-sm font-semibold"
      >
        Skip
      </button>
      <section className="flex w-[34%] flex-col rounded-[48px] bg-linear-to-b from-sky-100 to-white p-10">
        <h2 className="text-2xl font-semibold">
          <span className="block">Hello</span>
          <span className="block">{userName} 👋</span>
        </h2>
        <p className="mt-5 text-text-muted">
          We&apos;re happy to bring you aboard the world&apos;s favorite CRM!
        </p>
        <p className="mt-5 font-semibold">Let&apos;s get started!</p>
        <p className="mt-8 font-semibold">Watch a one-minute video</p>
        <p className="text-text-muted">View the key features we offer</p>
        <div
          className="mt-6 flex h-36 w-48 items-center justify-center rounded-xl bg-white/70"
          data-testid="home-intro-video"
        >
          <button
            type="button"
            aria-label="Play intro video"
            className="flex size-10 items-center justify-center rounded-full bg-text text-white"
          >
            ▶
          </button>
        </div>
        <p className="mt-10 text-sm">
          Need a Live Webinar?{" "}
          <button type="button" className="font-semibold text-primary underline">
            Book Now
          </button>
        </p>
      </section>
      <section className="flex flex-1 gap-6 rounded-[48px] bg-linear-to-br from-cyan-100 via-white to-pink-100 p-10">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Set up your CRM</h2>
          <p className="mt-2 text-text-muted">Make your CRM smarter and more interactive.</p>
          <ul className="mt-8 flex flex-col gap-3">
            {choices.map((choice) => {
              const active = choice.key === selected;
              return (
                <li key={choice.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(choice.key)}
                    className={`flex h-16 w-full items-center justify-between rounded-md bg-white px-5 text-left ${
                      active ? "border-2 border-primary font-semibold" : "border border-border"
                    }`}
                  >
                    {choice.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {current ? (
          <div className="flex w-64 flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">{current.title}</h3>
            <p className="mt-3 text-text-muted">{current.description}</p>
            {current.key === "team" ? (
              <Link href={`/crm/${orgSlug}/settings/members`} className={`mt-6 ${actionClass}`}>
                {current.action}
              </Link>
            ) : (
              <button type="button" className={`mt-6 ${actionClass}`}>
                {current.action}
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
