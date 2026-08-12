"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Lightbulb, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { onboardingSchema, type OnboardingFormValues } from "@/schemas/onboarding.schema";
import { ONBOARDING_ROLES, ONBOARDING_TOPICS } from "@/constants/onboarding.constant";
import { API_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

const TOTAL_STEPS = 2;

const Pill = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-foreground/80 hover:border-primary hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-sm font-bold text-foreground">{children}</span>
);

export const PageClient = () => {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      company: "",
      businessRegistrationNumber: "",
      memberNumber: "",
      role: undefined,
      topics: [],
      marketingOptIn: false,
    },
    mode: "onTouched",
  });

  // Prefill the name from the signed-in profile (captured at sign-up), once.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!prefilled.current && profile?.name) {
      form.setValue("name", profile.name);
      prefilled.current = true;
    }
  }, [profile?.name, form]);

  const goChat = () => router.push(PROTECTED_ROUTES.CHAT);

  const next = async () => {
    const ok = await form.trigger(["company", "businessRegistrationNumber"]);
    if (ok) setStep(2);
  };

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
      router.push(PROTECTED_ROUTES.CHAT);
    } catch {
      toast.error(t("errorTitle"), { description: t("errorBody") });
      setSubmitting(false);
    }
  };

  const isCompany = step === 1;
  const title = isCompany ? t("companyTitle") : t("nameTitle");
  const subtitle = isCompany ? t("companySubtitle") : t("nameSubtitle");
  const pickLabel = isCompany ? t("companyPick") : t("namePick");
  const why = isCompany ? t("whyCompany") : t("whyName");

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
        <div className="w-full max-w-[620px] rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
          {/* Step badge + skip */}
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-chart-4/10 px-3 py-1 text-xs font-bold text-chart-4">
              {t("step", { current: step, total: TOTAL_STEPS })}
            </span>
            <button
              type="button"
              onClick={goChat}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("skip")}
            </button>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-5 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-border")}
              />
            ))}
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
            <div className="mb-3 text-sm font-bold text-foreground">{pickLabel}</div>

            {isCompany ? (
              <div className="flex flex-col gap-5">
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
                        <span className="text-[13px] text-destructive">
                          {fieldState.error.message}
                        </span>
                      )}
                    </label>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="businessRegistrationNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <label className="flex flex-col gap-2">
                        <FieldLabel>{t("bizNoLabel")}</FieldLabel>
                        <Input
                          {...field}
                          placeholder={t("bizNoPlaceholder")}
                          inputMode="numeric"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <span className="text-[13px] text-destructive">
                            {fieldState.error.message}
                          </span>
                        )}
                      </label>
                    )}
                  />
                  <Controller
                    name="memberNumber"
                    control={form.control}
                    render={({ field }) => (
                      <label className="flex flex-col gap-2">
                        <FieldLabel>
                          {t("memberNoLabel")}{" "}
                          <span className="font-medium text-muted-foreground">{t("optional")}</span>
                        </FieldLabel>
                        <Input {...field} placeholder={t("memberNoPlaceholder")} />
                      </label>
                    )}
                  />
                </div>

                <Controller
                  name="topics"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2.5">
                      <FieldLabel>{t("topicsLabel")}</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {ONBOARDING_TOPICS.map((key) => {
                          const selected = field.value.includes(key);
                          return (
                            <Pill
                              key={key}
                              selected={selected}
                              onClick={() =>
                                field.onChange(
                                  selected
                                    ? field.value.filter((v) => v !== key)
                                    : [...field.value, key]
                                )
                              }
                            >
                              {t(`topics.${key}`)}
                            </Pill>
                          );
                        })}
                      </div>
                    </div>
                  )}
                />

                <p className="text-[13px] text-muted-foreground">{t("topicsHint")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
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
                      />
                      <span className="text-[13px] text-muted-foreground">{t("nameHelper")}</span>
                      {fieldState.error && (
                        <span className="text-[13px] text-destructive">
                          {fieldState.error.message}
                        </span>
                      )}
                    </label>
                  )}
                />

                <Controller
                  name="role"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2.5">
                      <FieldLabel>{t("roleLabel")}</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {ONBOARDING_ROLES.map((key) => (
                          <Pill
                            key={key}
                            selected={field.value === key}
                            onClick={() => field.onChange(key)}
                          >
                            {t(`roles.${key}`)}
                          </Pill>
                        ))}
                      </div>
                      {fieldState.error && (
                        <span className="text-[13px] text-destructive">
                          {fieldState.error.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Why-we-ask note */}
            <div className="mt-6 flex gap-2.5 rounded-2xl bg-muted/60 p-4">
              <Lightbulb className="mt-0.5 size-4 flex-none text-primary" />
              <div>
                <div className="text-sm font-bold text-foreground">{t("whyLabel")}</div>
                <p className="mt-1 text-[13.5px] text-muted-foreground">{why}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              {isCompany ? (
                <Button type="button" size="lg" className="w-full gap-2" onClick={next}>
                  {t("continue")}
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? t("saving") : t("finish")}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setStep(1)}
                  >
                    {t("back")}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
