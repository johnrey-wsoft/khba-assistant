"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import { getSupabaseClient } from "@/lib/supabase/client";

import { type ForgotPasswordFormValues, forgotPasswordSchema } from "@/schemas/auth.schema";

export const PageClient = () => {
  const supabase = getSupabaseClient();
  const t = useTranslations("auth.forgot");

  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onFormSubmit = (values: ForgotPasswordFormValues) => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast.error(t("toastFailTitle"), {
            description: t("toastFailBody"),
          });
          return;
        }

        toast.success(t("toastSuccessTitle"), {
          description: t("toastSuccessBody"),
        });

        form.reset();
      } catch (error) {
        console.error(error);
        toast.error(t("toastErrorTitle"), {
          description: t("toastErrorBody"),
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onFormSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                    />
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Field>
                <Button type="submit" disabled={isPending}>
                  {t("submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("remembered")} <Link href="/login">{t("loginLink")}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
