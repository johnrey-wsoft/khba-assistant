"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Search,
  CalendarClock,
  ListChecks,
  FolderSearch,
  ArrowRight,
  Scale,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Seal } from "@/components/chat/primitives";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { cn } from "@/lib/utils";
import { PROTECTED_ROUTES } from "@/constants/routes.constant";

type Tone = "primary" | "mint" | "amber" | "violet";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  mint: "bg-chart-2/10 text-chart-2",
  amber: "bg-seal-muted text-seal",
  violet: "bg-chart-4/10 text-chart-4",
};

const FEATURES: { icon: LucideIcon; tone: Tone; key: string }[] = [
  { icon: Search, tone: "primary", key: "sourced" },
  { icon: CalendarClock, tone: "mint", key: "dated" },
  { icon: ListChecks, tone: "amber", key: "next" },
  { icon: FolderSearch, tone: "violet", key: "one" },
];

const STEPS = ["ask", "answer", "next"];
const STATS = ["sourced", "oneScreen", "baseDate"];

export const PageClient = () => {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -left-32 size-[520px] rounded-full bg-primary/5 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-24 size-[360px] rounded-full bg-chart-2/5 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-[1.04fr_.96fr] md:py-24">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <span className="size-1.5 rounded-full bg-chart-2" />
                {t("pill")}
              </span>
              <h1 className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.12] font-extrabold tracking-tight text-foreground">
                {t("titleLine")}
                <br />
                <span className="text-primary">{t("titleHighlight")}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[34ch] text-lg leading-relaxed text-muted-foreground md:mx-0">
                {t("lede")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link href={PROTECTED_ROUTES.CHAT}>
                  <Button size="lg" className="gap-2">
                    {t("ctaStart")}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="secondary">
                    {t("ctaHow")}
                  </Button>
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-4 md:justify-start">
                {STATS.map((key, i) => (
                  <div key={key} className="flex items-center gap-6">
                    {i > 0 && <span className="hidden h-8 w-px bg-border sm:block" />}
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold text-foreground">
                        {t(`stats.${key}Value`)}
                      </span>
                      <span className="text-[13px] font-semibold text-muted-foreground">
                        {t(`stats.${key}Label`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo card */}
            <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:ml-auto">
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                <span className="grid size-8 place-items-center rounded-[9px] bg-primary text-xs font-extrabold text-primary-foreground">
                  KH
                </span>
                <b className="text-sm text-foreground">{tc("appName")}</b>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-chart-2">
                  <span className="size-1.5 rounded-full bg-chart-2" />
                  {t("demo.answerReady")}
                </span>
              </div>
              <div className="flex flex-col gap-3.5 bg-muted/40 p-5">
                <div className="ml-auto w-fit max-w-[82%] rounded-[16px_16px_4px_16px] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                  {t("demo.question")}
                </div>
                <div className="rounded-[16px_16px_16px_4px] border border-border bg-card p-4 shadow-sm">
                  <p className="text-[15px] leading-relaxed font-bold text-foreground">
                    {t("demo.answer")}
                  </p>
                  <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                    <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-primary/10 text-primary">
                      <Scale className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-foreground">
                        {t("demo.sourceTitle")}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("demo.sourceOrg")}</div>
                    </div>
                    <Seal className="flex-none">2026-03-15</Seal>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="mx-auto mb-12 max-w-[36ch] text-center">
            <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-tight text-foreground">
              {t("features.title")}
            </h2>
            <p className="mt-3.5 text-lg text-muted-foreground">{t("features.subtitle")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, tone, key }) => (
              <div
                key={key}
                className="rounded-3xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className={cn(
                    "mb-5 grid size-14 place-items-center rounded-2xl",
                    TONE_CLASS[tone]
                  )}
                >
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-extrabold text-foreground">
                  {t(`features.${key}Title`)}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`features.${key}Body`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto mb-12 max-w-[36ch] text-center">
              <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-tight text-foreground">
                {t("steps.title")}
              </h2>
              <p className="mt-3.5 text-lg text-muted-foreground">{t("steps.subtitle")}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {STEPS.map((key, i) => (
                <div
                  key={key}
                  className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
                >
                  <span className="mx-auto mb-5 grid size-11 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h4 className="text-lg font-extrabold text-foreground">
                    {t(`steps.${key}Title`)}
                  </h4>
                  <p className="mt-2 text-[15px] text-muted-foreground">{t(`steps.${key}Body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lg">
            <h2 className="text-[clamp(28px,3.6vw,38px)] font-extrabold tracking-tight text-primary-foreground">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-lg text-primary-foreground/85">
              {t("cta.body")}
            </p>
            <Link href={PROTECTED_ROUTES.CHAT} className="mt-8 inline-block">
              <Button size="lg" variant="secondary" className="gap-2">
                {t("cta.button")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};
