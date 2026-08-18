"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { useAuth } from "@/hooks/use-auth";
import { onboardingSchema, type OnboardingFormValues } from "@/schemas/onboarding.schema";
import { API_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

// Company defaults to the org name; members just confirm it.
const DEFAULT_COMPANY = "WLabs";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-sm font-bold text-foreground">{children}</span>
);

export const PageClient = () => {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", company: DEFAULT_COMPANY },
    mode: "onTouched",
  });

  // Prefill from the signed-in profile, once.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !profile) return;
    if (profile.name) form.setValue("name", profile.name);
    if (profile.company) form.setValue("company", profile.company);
    prefilled.current = true;
  }, [profile, form]);

  const onSubmit = async (values: OnboardingFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(API_ROUTES.ONBOARDING, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(t("toastTitle"), { description: t("toastBody") });
      // Onboarding files the account for association-desk review.
      router.push(PROTECTED_ROUTES.PENDING);
    } catch {
      toast.error(t("errorTitle"), { description: t("errorBody") });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center gap-2.5 px-6 py-4">
        <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground shadow-sm">
          K
        </span>
        <span className="font-extrabold tracking-tight text-foreground">KHBA Assistant</span>
        <span className="flex-1" />
        <LocaleSwitcher />
        <ModeToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-[520px] rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t("setupTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("setupSubtitle")}</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <label className="flex flex-col gap-2">
                  <FieldLabel>{t("nameLabel")}</FieldLabel>
                  <Input
                    {...field}
                    placeholder={t("namePlaceholder")}
                    aria-invalid={fieldState.invalid}
                    autoFocus
                  />
                  <span className="text-[13px] text-muted-foreground">{t("nameHelper")}</span>
                  {fieldState.error && (
                    <span className="text-[13px] text-destructive">{fieldState.error.message}</span>
                  )}
                </label>
              )}
            />

            <Controller
              name="company"
              control={form.control}
              render={({ field, fieldState }) => (
                <label className="flex flex-col gap-2">
                  <FieldLabel>{t("companyLabel")}</FieldLabel>
                  <Input
                    {...field}
                    placeholder={t("companyPlaceholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <span className="text-[13px] text-destructive">{fieldState.error.message}</span>
                  )}
                </label>
              )}
            />

            <div className="flex gap-2.5 rounded-2xl bg-muted/60 p-4">
              <Lightbulb className="mt-0.5 size-4 flex-none text-primary" />
              <div>
                <div className="text-sm font-bold text-foreground">{t("whyLabel")}</div>
                <p className="mt-1 text-[13.5px] text-muted-foreground">{t("whyName")}</p>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? t("saving") : t("finish")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};
