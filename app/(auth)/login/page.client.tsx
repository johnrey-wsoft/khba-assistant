"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/shared/password-input";

import { getSupabaseClient } from "@/lib/supabase/client";

import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

import { AUTH_ROUTES, DEFAULT_AUTH_REDIRECT } from "@/constants/routes.constant";

export const PageClient = () => {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const t = useTranslations("auth.login");

  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onFormSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword(values);

        if (error) {
          toast.error(t("toastFailTitle"), {
            description: error.message,
          });
          return;
        }

        toast.success(t("toastSuccessTitle"), {
          description: t("toastSuccessBody"),
        });
        router.replace(DEFAULT_AUTH_REDIRECT);
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
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                      <Link
                        href={AUTH_ROUTES.FORGOT_PASSWORD}
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        {t("forgot")}
                      </Link>
                    </div>
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
              <Field>
                <Button type="submit" disabled={isPending}>
                  {t("submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("noAccount")} <Link href={AUTH_ROUTES.REGISTER}>{t("signUpLink")}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
