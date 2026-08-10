import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Notice, Seal } from "@/components/chat/primitives";
import { TERMS_ARTICLES, TERMS_META } from "@/constants/legal.constant";

export const metadata: Metadata = {
  title: "Terms of service · KHBA Assistant",
  description: "Terms of use for the KHBA Assistant member consultation channel.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <span className="text-sm font-bold text-muted-foreground">Terms of service</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,42px)] leading-tight font-extrabold tracking-tight text-foreground">
          Terms of use for KHBA Assistant
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Seal>Effective {TERMS_META.effectiveDate}</Seal>
          <span className="text-sm text-muted-foreground">
            Version {TERMS_META.version} · {TERMS_META.note}
          </span>
        </div>

        <div className="mt-10 grid items-start gap-9 lg:grid-cols-[290px_minmax(0,1fr)]">
          {/* TOC */}
          <aside className="top-24 rounded-3xl border border-border bg-card p-5 shadow-sm lg:sticky">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <FolderOpen className="size-4.5 text-primary" />
              What is in here
            </div>
            <nav className="flex flex-col gap-0.5">
              {TERMS_ARTICLES.map((a) => (
                <Link
                  key={a.id}
                  href={`#${a.id}`}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {a.title}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Body */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
            <Notice>
              Answers are reference material. Before filing or applying, the official text and the
              competent authority are what decide, so please confirm there.
            </Notice>

            <div className="mt-8 flex flex-col gap-9">
              {TERMS_ARTICLES.map((a) => (
                <section key={a.id} id={a.id} className="scroll-mt-24">
                  <h2 className="mb-2.5 text-xl font-extrabold tracking-tight text-foreground">
                    {a.title}
                  </h2>
                  <p className="text-base leading-relaxed text-muted-foreground">{a.body}</p>
                  {a.items && (
                    <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px] text-muted-foreground marker:text-primary">
                      {a.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-10 border-t border-border pt-5 text-sm text-muted-foreground/80">
              Questions about these terms go to{" "}
              <a href="mailto:assistant@khba.example" className="text-primary hover:underline">
                assistant@khba.example
              </a>
              . Changes are announced at least seven days before they take effect.
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
