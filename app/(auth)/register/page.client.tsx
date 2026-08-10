"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/shared/password-input";

import { getSupabaseClient } from "@/lib/supabase/client";

import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

import { AUTH_ROUTES } from "@/constants/routes.constant";

export const PageClient = () => {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const t = useTranslations("auth.register");

  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onFormSubmit = (values: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.name,
            },
          },
        });

        if (error) {
          toast.error(t("toastFailTitle"), {
            description: error.message,
          });
          return;
        }

        toast.success(t("toastSuccessTitle"), {
          description: t("toastSuccessBody"),
        });

        form.reset();
        router.push(AUTH_ROUTES.LOGIN);
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
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      type="text"
                      placeholder={t("namePlaceholder")}
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                    />
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
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
              <Field>
                <Button type="submit" disabled={isPending}>
                  {t("submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("haveAccount")} <Link href={AUTH_ROUTES.LOGIN}>{t("loginLink")}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
};
