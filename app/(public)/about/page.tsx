import type { Metadata } from "next";
import Link from "next/link";
import { Check, HelpCircle, FolderCheck, CalendarClock, Lightbulb, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/constants/routes.constant";

export const metadata: Metadata = {
  title: "About us · KHBA Assistant",
  description:
    "A member consultation desk that answers, then shows you where the answer came from.",
};

const TODAY = [
  "Search association materials, public notices and statutes together.",
  "Summarise the answer in one sentence, then unpack the conditions.",
  "Attach source cards with the issuing body and the base date.",
  "Say plainly when the evidence is thin or missing.",
];

const NOT_YET = [
  "Feasibility review or profitability modelling for a site.",
  "Automated design or code compliance checking of drawings.",
  "Replacing a filing decision. The official text and the competent authority still decide.",
  "Answering on documents we do not hold. We tell you instead of guessing.",
];

const PRINCIPLES = [
  {
    icon: FolderCheck,
    title: "Sources first",
    body: "An answer without a document behind it does not ship. If we cannot cite it, we tell you what is missing and what you can check instead.",
  },
  {
    icon: CalendarClock,
    title: "Dates stay visible",
    body: "Housing rules move. Every source keeps its base date so you can judge whether it is current for your case.",
  },
  {
    icon: Lightbulb,
    title: "Limits stated up front",
    body: "We would rather narrow the promise than overstate it. The scope is stated in the product, not buried in a footnote.",
  },
];

const OPERATOR = [
  { label: "Operator", value: "Korea Housing Builders Association secretariat" },
  { label: "Service", value: "KHBA Assistant, member consultation channel" },
  { label: "Contact", value: "assistant@khba.example" },
  { label: "Hours", value: "Weekdays 09:00 to 18:00, KST" },
];

const ListCard = ({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Check;
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

export default function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <span className="text-sm font-bold text-muted-foreground">About us</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,42px)] leading-tight font-extrabold tracking-tight text-foreground">
          We built a counter that hands you the evidence
        </h1>
        <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">
          KHBA Assistant is run for association members by the association secretariat. It is not a
          search engine dressed up as a chat window. It is a consultation desk that answers, then
          shows you where the answer came from.
        </p>

        <div className="mt-11 grid gap-5 md:grid-cols-2">
          <ListCard icon={Check} title="What we do today" items={TODAY} />
          <ListCard icon={HelpCircle} title="What we cannot do yet" items={NOT_YET} />
        </div>

        <h2 className="mt-14 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-foreground">
          How we decide what to say
        </h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid items-start gap-9 lg:grid-cols-[290px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3.5 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Building2 className="size-4.5 text-primary" />
              Who runs this
            </div>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {OPERATOR.map((row) => (
                <div key={row.label}>
                  <div className="font-bold text-foreground">{row.label}</div>
                  {row.value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <div className="text-xl font-extrabold tracking-tight text-foreground">
              Where this is going
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Next, we&apos;re building an in-place document viewer, so the cited passage opens where
              you are instead of sending you to another portal. Feasibility and design review remain
              out of scope until the evidence behind them is good enough to stand behind.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={AUTH_ROUTES.REGISTER}>
                <Button>Create an account</Button>
              </Link>
              <Link href={PUBLIC_ROUTES.TERMS}>
                <Button variant="secondary">Read the terms</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
