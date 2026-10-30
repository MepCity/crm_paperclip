"use client";

import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";

const DEFAULT_GUIDANCE =
  "You cannot search a profile in Facebook. This has to be associated from the Social Tab";

function TwitterIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border bg-slate-100 text-slate-700"
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2 2 L10 10 M10 2 L2 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function FacebookIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border bg-slate-100 text-slate-700 font-bold text-xs"
    >
      f
    </span>
  );
}

const NETWORKS = [
  {
    id: "twitter",
    label: "Associate Twitter",
    icon: TwitterIcon,
    message: "Contact your administrator to configure Twitter integration.",
  },
  {
    id: "facebook",
    label: "Associate Facebook",
    icon: FacebookIcon,
    message: "Contact your administrator to configure Facebook integration.",
  },
] as const;

/** Reference-matching illustration of speech bubble and exclamation badge. */
function SocialIllustration() {
  return (
    <svg
      width="96"
      height="72"
      viewBox="0 0 96 72"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-sky-400 select-none"
    >
      {/* Speech bubble */}
      <path
        d="M20 22 C20 12, 34 12, 48 12 C62 12, 76 12, 76 26 C76 38, 64 44, 52 44 L40 54 L42 44 C30 44, 20 38, 20 26 Z"
        stroke="#bae6fd"
        strokeWidth="1.75"
        fill="#f0f9ff"
      />
      {/* Thumbs up outline */}
      <path
        d="M44 24 L48 24 C50 24, 51 22, 51 20 L51 18 C51 16, 53 15, 55 17 L59 23 L59 32 L48 32 L44 30 Z"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Exclamation badge */}
      <circle cx="68" cy="46" r="11" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
      <path d="M68 41 L68 47" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="68" cy="51" r="1.25" fill="#0284c7" />
    </svg>
  );
}

/** Unassociated Social card body for record detail; static, issues no request. */
export function SocialRecordCardBody() {
  const t = useUiTranslations();
  const getNetworkLabel = (id: string, fallback: string) => {
    if (id === "twitter") return t("modules.social.associateTwitter");
    if (id === "facebook") return t("modules.social.associateFacebook");
    return fallback;
  };
  const getNetworkMessage = (id: string, fallback: string) => {
    if (id === "twitter") return t("modules.social.associateTwitterMsg");
    if (id === "facebook") return t("modules.social.associateFacebookMsg");
    return fallback;
  };

  return (
    <div className="flex divide-x divide-panel-border py-4">
      <div className="flex min-w-[210px] flex-col gap-3 pr-8">
        {NETWORKS.map((network) => {
          const Icon = network.icon;
          return (
            <button
              key={network.id}
              type="button"
              onClick={() => {
                toast({
                  variant: "info",
                  title: getNetworkMessage(network.id, network.message),
                });
              }}
              className="group flex items-center gap-2.5 w-fit cursor-pointer text-left text-md font-normal text-primary hover:underline"
            >
              <Icon />
              <span>{getNetworkLabel(network.id, network.label)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex max-w-lg items-center gap-6 pl-8">
        <SocialIllustration />
        <p className="text-sm leading-relaxed text-text-muted">
          {t("modules.social.guidance") || DEFAULT_GUIDANCE}
        </p>
      </div>
    </div>
  );
}
