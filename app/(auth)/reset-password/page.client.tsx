"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/shared/password-input";

import { getSupabaseClient } from "@/lib/supabase/client";

import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";

export const PageClient = () => {
  const supabase = getSupabaseClient();
  const t = useTranslations("auth.reset");

  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onFormSubmit = (values: ResetPasswordFormValues) => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: values.password,
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
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="password"
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">{t("confirmPassword")}</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="confirmPassword"
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Field>
                <Button type="submit" disabled={isPending}>
                  {t("submit")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t.rich("consent", {
          terms: (c) => <Link href="/terms">{c}</Link>,
          privacy: (c) => <Link href="/terms">{c}</Link>,
        })}
      </FieldDescription>
    </div>
  );
};
