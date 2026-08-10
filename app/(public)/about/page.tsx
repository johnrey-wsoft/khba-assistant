import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Check,
  HelpCircle,
  FolderCheck,
  CalendarClock,
  Lightbulb,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/constants/routes.constant";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: `${t("eyebrow")} · KHBA Assistant`, description: t("lede") };
}

const PRINCIPLES: { icon: LucideIcon; key: string }[] = [
  { icon: FolderCheck, key: "sources" },
  { icon: CalendarClock, key: "dates" },
  { icon: Lightbulb, key: "limits" },
];

const ListCard = ({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) => (
  <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
    <div className="mb-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
      <Icon className="size-5 text-primary" />
      {title}
    </div>
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] text-muted-foreground marker:text-primary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tc = await getTranslations("common");
  const today = t.raw("today") as string[];
  const notYet = t.raw("notYet") as string[];

  const operator = [
    { label: t("operator.operatorLabel"), value: t("operator.operatorValue") },
    { label: t("operator.serviceLabel"), value: t("operator.serviceValue") },
    { label: t("operator.contactLabel"), value: "assistant@khba.example" },
    { label: t("operator.hoursLabel"), value: t("operator.hoursValue") },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <span className="text-sm font-bold text-muted-foreground">{t("eyebrow")}</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,42px)] leading-tight font-extrabold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">{t("lede")}</p>

        <div className="mt-11 grid gap-5 md:grid-cols-2">
          <ListCard icon={Check} title={t("todayTitle")} items={today} />
          <ListCard icon={HelpCircle} title={t("notYetTitle")} items={notYet} />
        </div>

        <h2 className="mt-14 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-foreground">
          {t("principlesTitle")}
        </h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <h3 className="text-lg font-extrabold text-foreground">
                {t(`principles.${key}Title`)}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {t(`principles.${key}Body`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid items-start gap-9 lg:grid-cols-[290px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3.5 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Building2 className="size-4.5 text-primary" />
              {t("whoRunsTitle")}
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {operator.map((row) => (
                <div key={row.label}>
                  <div className="font-bold text-foreground">{row.label}</div>
                  {row.value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <div className="text-xl font-extrabold tracking-tight text-foreground">
              {t("roadmapTitle")}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {t("roadmapBody")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={AUTH_ROUTES.REGISTER}>
                <Button>{tc("createAccount")}</Button>
              </Link>
              <Link href={PUBLIC_ROUTES.TERMS}>
                <Button variant="secondary">{t("readTerms")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
