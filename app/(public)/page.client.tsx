"use client";

import Link from "next/link";
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
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Seal } from "@/components/chat/primitives";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type Tone = "primary" | "mint" | "amber" | "violet";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  mint: "bg-chart-2/10 text-chart-2",
  amber: "bg-seal-muted text-seal",
  violet: "bg-chart-4/10 text-chart-4",
};

const FEATURES: { icon: LucideIcon; tone: Tone; title: string; body: string }[] = [
  {
    icon: Search,
    tone: "primary",
    title: "Sourced, first",
    body: "Every answer shows the document, authority, base date, and a link to the original. No basis? It says “not confirmed” plainly.",
  },
  {
    icon: CalendarClock,
    tone: "mint",
    title: "Always dated",
    body: "Time-sensitive facts always carry a base-date seal and a final-check note, so you can confirm with confidence.",
  },
  {
    icon: ListChecks,
    tone: "amber",
    title: "Next steps, too",
    body: "Filing documents and deadlines land in a checklist with a D-day. It doesn’t stop at the answer.",
  },
  {
    icon: FolderSearch,
    tone: "violet",
    title: "All in one place",
    body: "Search association materials, notices, and statutes by type, authority, region, and period — no site-hopping.",
  },
];

const STEPS = [
  { n: 1, title: "Ask", body: "Ask what you need in plain words, just like you’d say it." },
  {
    n: 2,
    title: "Grounded answer",
    body: "Get the summary and key points with the source and base date.",
  },
  { n: 3, title: "Next actions", body: "Continue with follow-up questions and a checklist." },
];

const HERO_STATS = [
  { value: "90%+ sourced", label: "answers cite their basis" },
  { value: "One screen", label: "materials · notices · statutes" },
  { value: "Base date", label: "current-state guidance" },
];

export const PageClient = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground shadow-sm">
              K
            </span>
            KHBA Assistant
          </Link>
          <span className="flex-1" />
          <nav className="flex items-center gap-1.5">
            <Link href="#features" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Features
              </Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
            <Link href="/chat">
              <Button size="sm">Start a consultation</Button>
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </header>

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
                For KHBA members
              </span>
              <h1 className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.12] font-extrabold tracking-tight text-foreground">
                Small-housing work,
                <br />
                <span className="text-primary">answered with the sources.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[34ch] text-lg leading-relaxed text-muted-foreground md:mx-0">
                Search approved association materials, notices, and statutes at once — with the
                source and its base date alongside.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link href="/chat">
                  <Button size="lg" className="gap-2">
                    Start a consultation
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="secondary">
                    How it helps
                  </Button>
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-4 md:justify-start">
                {HERO_STATS.map((s, i) => (
                  <div key={s.value} className="flex items-center gap-6">
                    {i > 0 && <span className="hidden h-8 w-px bg-border sm:block" />}
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold text-foreground">{s.value}</span>
                      <span className="text-[13px] font-semibold text-muted-foreground">
                        {s.label}
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
                <b className="text-sm text-foreground">KHBA Assistant</b>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-chart-2">
                  <span className="size-1.5 rounded-full bg-chart-2" />
                  Answer ready
                </span>
              </div>
              <div className="flex flex-col gap-3.5 bg-muted/40 p-5">
                <div className="ml-auto w-fit max-w-[82%] rounded-[16px_16px_4px_16px] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                  What is the parking ratio for small housing in Suwon?
                </div>
                <div className="rounded-[16px_16px_16px_4px] border border-border bg-card p-4 shadow-sm">
                  <p className="text-[15px] leading-relaxed font-bold text-foreground">
                    Under 30㎡ it is 0.5 space per unit, and 30㎡ to 60㎡ is 0.6.
                  </p>
                  <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                    <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-primary/10 text-primary">
                      <Scale className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-foreground">
                        수원시 주차장 설치 및 관리 조례
                      </div>
                      <div className="text-xs text-muted-foreground">Suwon · Ordinance</div>
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
              Here’s how it helps
            </h2>
            <p className="mt-3.5 text-lg text-muted-foreground">
              Not just search — the basis and the next thing to do, handled for you.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, tone, title, body }) => (
              <div
                key={title}
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
                <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto mb-12 max-w-[36ch] text-center">
              <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-tight text-foreground">
                Three steps, done
              </h2>
              <p className="mt-3.5 text-lg text-muted-foreground">
                No setup — just ask what you need.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
                >
                  <span className="mx-auto mb-5 grid size-11 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">
                    {s.n}
                  </span>
                  <h4 className="text-lg font-extrabold text-foreground">{s.title}</h4>
                  <p className="mt-2 text-[15px] text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lg">
            <h2 className="text-[clamp(28px,3.6vw,38px)] font-extrabold tracking-tight text-primary-foreground">
              Ask right now
            </h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-lg text-primary-foreground/85">
              Sign in to check association materials, notices, and statutes — always with the
              sources.
            </p>
            <Link href="/chat" className="mt-8 inline-block">
              <Button size="lg" variant="secondary" className="gap-2">
                Start a consultation
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-9 text-center text-sm text-muted-foreground">
        KHBA RAG AI · Answers are reference material; confirm with the official text and the
        competent authority.
      </footer>
    </div>
  );
};
