"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button-styles";
import type { MessageKey } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";

const choiceKeys = ["team", "pipeline", "email", "migrate", "integration"] as const;

const actionClass = `inline-flex h-9 items-center rounded-md px-4 text-sm ${buttonStyles.primary}`;

export function HomeOnboarding({ orgSlug, userName }: { orgSlug: string; userName: string }) {
  const t = useUiTranslations();
  const [selected, setSelected] = useState<(typeof choiceKeys)[number]>("team");

  return (
    <div className="relative mx-auto flex max-w-6xl gap-6 px-8 py-10" data-testid="home-onboarding">
      <button
        type="button"
        className="absolute right-8 top-2 rounded-md border border-(--color-button-border) bg-surface px-4 py-2 text-sm font-semibold"
      >
        {t("modules.home.skip")}
      </button>
      <section className="flex w-[34%] flex-col rounded-[48px] bg-linear-to-b from-sky-100 to-white p-10">
        <h2 className="text-2xl font-semibold">
          <span className="block">{t("modules.home.hello")}</span>
          <span className="block">{userName} 👋</span>
        </h2>
        <p className="mt-5 text-text-muted">{t("modules.home.welcomeAboard")}</p>
        <p className="mt-5 font-semibold">{t("modules.home.letsGetStarted")}</p>
        <p className="mt-8 font-semibold">{t("modules.home.watchVideo")}</p>
        <p className="text-text-muted">{t("modules.home.viewFeatures")}</p>
        <div
          className="mt-6 flex h-36 w-48 items-center justify-center rounded-xl bg-white/70"
          data-testid="home-intro-video"
        >
          <button
            type="button"
            aria-label={t("modules.home.playVideo")}
            className="flex size-10 items-center justify-center rounded-full bg-text text-white"
          >
            ▶
          </button>
        </div>
        <p className="mt-10 text-sm">
          {t("modules.home.needWebinar")}{" "}
          <button type="button" className="font-semibold text-primary underline">
            {t("modules.home.bookNow")}
          </button>
        </p>
      </section>
      <section className="flex flex-1 gap-6 rounded-[48px] bg-linear-to-br from-cyan-100 via-white to-pink-100 p-10">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{t("modules.home.setupCrm")}</h2>
          <p className="mt-2 text-text-muted">{t("modules.home.makeSmarter")}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {choiceKeys.map((key) => {
              const active = key === selected;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(key)}
                    className={`flex h-16 w-full items-center justify-between rounded-md bg-white px-5 text-left ${
                      active ? "border-2 border-primary font-semibold" : "border border-border"
                    }`}
                  >
                    {t(`modules.home.choices.${key}.label` as MessageKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex w-64 flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold">
            {t(`modules.home.choices.${selected}.title` as MessageKey)}
          </h3>
          <p className="mt-3 text-text-muted">
            {t(`modules.home.choices.${selected}.description` as MessageKey)}
          </p>
          {selected === "team" ? (
            <Link href={`/crm/${orgSlug}/settings/members`} className={`mt-6 ${actionClass}`}>
              {t(`modules.home.choices.${selected}.action` as MessageKey)}
            </Link>
          ) : (
            <button type="button" className={`mt-6 ${actionClass}`}>
              {t(`modules.home.choices.${selected}.action` as MessageKey)}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
