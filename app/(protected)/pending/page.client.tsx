"use client";

import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, TriangleAlert, Check, Building2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/constants/verification-status.constant";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

type PageClientProps = {
  status: VerificationStatus;
  email: string;
  company: string | null;
};

// name@company.co.kr -> na••••••@company.co.kr
const maskEmail = (email: string): string => {
  const at = email.indexOf("@");
  if (at < 2) return email;
  return email.slice(0, 2) + "•".repeat(Math.max(2, at - 2)) + email.slice(at);
};

export const PageClient = ({ status, email, company }: PageClientProps) => {
  const router = useRouter();
  const t = useTranslations("pending");
  const tc = useTranslations("common");
  const [signingOut, startSignOut] = useTransition();

  const rejected = status === "rejected";

  const signOut = () =>
    startSignOut(async () => {
      await getSupabaseClient().auth.signOut();
      router.replace(PUBLIC_ROUTES.ROOT);
      router.refresh();
    });

  const steps = [
    { key: "submitted", state: "done" as const },
    { key: "review", state: rejected ? ("todo" as const) : ("active" as const) },
    { key: "activated", state: "todo" as const },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center gap-2.5 px-6 py-4">
        <span className="grid size-8 place-items-center rounded-[10px] bg-[linear-gradient(150deg,var(--navy),var(--navy-3))] text-base font-extrabold text-white shadow-sm">
          近
        </span>
        <span className="font-extrabold tracking-tight text-foreground">KHBA Assistant</span>
        <span className="flex-1" />
        <LocaleSwitcher />
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          disabled={signingOut}
          title={tc("signOut")}
          aria-label={tc("signOut")}
        >
          <LogOut />
        </Button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-[560px] rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <div
            className={cn(
              "grid size-14 place-items-center rounded-2xl",
              rejected ? "bg-destructive/10 text-destructive" : "bg-chart-3/10 text-chart-3"
            )}
          >
            {rejected ? <TriangleAlert className="size-6" /> : <CalendarClock className="size-6" />}
          </div>

          <span
            className={cn(
              "mt-5 inline-block rounded-full px-3 py-1 text-xs font-bold",
              rejected ? "bg-destructive/10 text-destructive" : "bg-chart-3/10 text-chart-3"
            )}
          >
            {rejected ? t("badgeRejected") : t("badgePending")}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            {rejected ? t("titleRejected") : t("titlePending")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rejected
              ? t("subRejected", { email: maskEmail(email) })
              : t("subPending", { email: maskEmail(email) })}
          </p>

          {/* Review timeline — hidden in the rejected state */}
          {!rejected && (
            <ol className="mt-7 flex flex-col">
              {steps.map((s, i) => (
                <li key={s.key} className="flex gap-3.5">
                  <div className="flex flex-none flex-col items-center self-stretch">
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-[11px] font-extrabold text-white",
                        s.state === "done" && "bg-chart-2",
                        s.state === "active" && "bg-chart-3",
                        s.state === "todo" && "bg-border"
                      )}
                    >
                      {s.state === "done" ? (
                        <Check className="size-3.5" />
                      ) : s.state === "active" ? (
                        "●"
                      ) : (
                        ""
                      )}
                    </span>
                    {i < steps.length - 1 && <span className="my-1 w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className={cn(i < steps.length - 1 && "pb-5")}>
                    <div className="text-sm font-bold tracking-tight text-foreground">
                      {t(`steps.${s.key}.title`)}
                    </div>
                    <div className="text-[13.5px] text-muted-foreground">
                      {t(`steps.${s.key}.body`)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* What the desk is reviewing */}
          <div className="mt-6 rounded-2xl border border-border bg-muted/50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Building2 className="size-4 text-primary" />
              {t("reviewingTitle")}
            </div>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-36 flex-none font-bold text-foreground">{t("companyLabel")}</dt>
                <dd className="text-muted-foreground">{company || "—"}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-36 flex-none font-bold text-foreground">{t("contactLabel")}</dt>
                <dd className="text-muted-foreground">{email}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-[13.5px] text-muted-foreground">
            {rejected ? t("noticeRejected") : t("noticePending")}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {rejected && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(PROTECTED_ROUTES.ONBOARDING)}
              >
                {t("updateDetails")}
              </Button>
            )}
            <Button
              variant={rejected ? "secondary" : "default"}
              size="lg"
              className="w-full"
              onClick={() => router.push(PUBLIC_ROUTES.ROOT)}
            >
              {t("backHome")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
