"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PUBLIC_ROUTES, AUTH_ROUTES } from "@/constants/routes.constant";

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) => (
  <div className="flex flex-col gap-2.5">
    <div className="text-sm font-extrabold text-foreground">{title}</div>
    {links.map((l, i) => (
      <Link
        key={`${l.href}-${i}`}
        href={l.href}
        className="text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        {l.label}
      </Link>
    ))}
  </div>
);

export const SiteFooter = () => {
  const t = useTranslations();

  const product = [
    { href: PUBLIC_ROUTES.ROOT, label: t("nav.home") },
    { href: AUTH_ROUTES.REGISTER, label: t("common.signUp") },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-9 px-6 py-13 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_1fr]">
        <div>
          <span className="flex items-center gap-2.5 font-extrabold tracking-tight text-foreground">
            <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground">
              K
            </span>
            {t("common.appName")}
          </span>
          <p className="mt-3.5 max-w-[32ch] text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <FooterCol title={t("footer.product")} links={product} />
        <div className="flex flex-col gap-2.5">
          <div className="text-sm font-extrabold text-foreground">{t("footer.desk")}</div>
          <span className="text-sm text-muted-foreground">assistant@khba.example</span>
          <span className="text-sm text-muted-foreground">{t("footer.hours")}</span>
          <span className="text-[13px] text-muted-foreground/70">{t("footer.operatedBy")}</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 border-t border-border px-6 py-5">
        <span className="text-[13px] text-muted-foreground">{t("footer.disclaimer")}</span>
      </div>
    </footer>
  );
};
