import { PageTitle } from "@/components/shell/page-title";
import { Link } from "@/components/ui/link";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WebformsHelpPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "manageWebforms");
  const t = await getUiTranslations();

  return (
    <>
      <PageTitle title={t("modules.webforms.help.title")} />
      <div className="relative flex flex-col rounded-xl border border-border bg-surface shadow-xs p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href={`/crm/${orgSlug}/settings/webforms`}
            className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1 mb-4"
          >
            {t("modules.webforms.help.back")}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t("modules.webforms.help.mainHeading")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {t("modules.webforms.help.mainDesc")}
          </p>
        </div>

        {/* Quick jump navigation */}
        <nav
          aria-label={t("modules.webforms.help.quickTopics")}
          className="p-4 rounded-lg bg-muted/30 border border-border"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            {t("modules.webforms.help.quickTopics")}
          </span>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="#what-is-webform" className="text-primary hover:underline">
              {t("modules.webforms.help.navWhatIsWebform")}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="#embedding" className="text-primary hover:underline">
              {t("modules.webforms.help.navEmbedding")}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="#spam-and-limits" className="text-primary hover:underline">
              {t("modules.webforms.help.navSpamAndLimits")}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="#analytics" className="text-primary hover:underline">
              {t("modules.webforms.help.navAnalytics")}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="#ab-testing" className="text-primary hover:underline">
              {t("modules.webforms.help.navAbTesting")}
            </a>
          </div>
        </nav>

        {/* Section 1: What is a webform */}
        <section id="what-is-webform" className="scroll-mt-6 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t("modules.webforms.help.sec1Title")}
          </h2>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>{t("modules.webforms.help.sec1Desc")}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec1Point1Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec1Point1Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec1Point2Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec1Point2Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec1Point3Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec1Point3Desc")}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Embedding */}
        <section id="embedding" className="scroll-mt-6 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t("modules.webforms.help.sec2Title")}
          </h2>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>{t("modules.webforms.help.sec2Desc")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec2Point1Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec2Point1Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec2Point2Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec2Point2Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec2Point3Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec2Point3Desc")}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Spam protection and limits */}
        <section id="spam-and-limits" className="scroll-mt-6 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t("modules.webforms.help.sec3Title")}
          </h2>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>{t("modules.webforms.help.sec3Desc")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec3Point1Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec3Point1Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec3Point2Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec3Point2Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec3Point3Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec3Point3Desc")}
              </li>
              <li>
                <strong className="text-foreground">
                  {t("modules.webforms.help.sec3Point4Title")}{" "}
                </strong>
                {t("modules.webforms.help.sec3Point4Desc")}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Analytics */}
        <section id="analytics" className="scroll-mt-6 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t("modules.webforms.help.sec4Title")}
          </h2>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>{t("modules.webforms.help.sec4Desc")}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t("modules.webforms.help.sec4Point1")}</li>
              <li>{t("modules.webforms.help.sec4Point2")}</li>
              <li>{t("modules.webforms.help.sec4Point3")}</li>
            </ul>
          </div>
        </section>

        {/* Section 5: A/B Testing */}
        <section id="ab-testing" className="scroll-mt-6 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t("modules.webforms.help.sec5Title")}
          </h2>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>{t("modules.webforms.help.sec5Desc")}</p>
          </div>
        </section>
      </div>
    </>
  );
}
