"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Seal } from "@/components/chat/primitives";
import { OriginalDocument, type FullDocument } from "@/components/chat/document-view";
import { authorityLabel } from "@/lib/chat/authority";
import { API_ROUTES, PROTECTED_ROUTES } from "@/constants/routes.constant";

// One labelled metadata field.
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{label}</dt>
    <dd className="text-sm text-foreground">{children}</dd>
  </div>
);

export const PageClient = ({ code }: { code: string }) => {
  const t = useTranslations("chat");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document", code],
    queryFn: async (): Promise<FullDocument> => {
      const res = await fetch(API_ROUTES.DOCUMENTS.BY_CODE(encodeURIComponent(code)));
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to load document");
      return json.data as FullDocument;
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasOriginal = Boolean(data?.hasOriginal);
  const downloadUrl = API_ROUTES.DOCUMENTS.DOWNLOAD(encodeURIComponent(code));

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      {/* Top bar — back + document title. */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
        <Button asChild variant="outline" size="sm" className="flex-none gap-1.5">
          <Link href={PROTECTED_ROUTES.SEARCH}>
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        </Button>
        <span className="truncate text-sm font-extrabold text-foreground">
          {data?.title ?? t("viewerTitle")}
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        {isError ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {t("docNotFound")}
          </div>
        ) : (
          <>
            {/* Metadata */}
            <div className="rounded-2xl border border-border bg-card p-5">
              {data ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-lg font-extrabold tracking-tight text-foreground">
                      {data.title}
                    </h1>
                    {hasOriginal && (
                      <Button asChild size="sm" className="flex-none gap-1.5">
                        <a href={downloadUrl} target="_blank" rel="noreferrer">
                          <Download className="size-4" />
                          {t("download")}
                        </a>
                      </Button>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Field label={t("metaType")}>
                      <Badge
                        variant="outline"
                        className="rounded-[5px] border-primary/20 bg-primary/5 text-primary"
                      >
                        {authorityLabel(data.authorityType)}
                      </Badge>
                    </Field>
                    {data.effectiveFrom && (
                      <Field label={t("baseDate")}>
                        <Seal>{data.effectiveFrom}</Seal>
                      </Field>
                    )}
                    {data.jurisdictionCode && (
                      <Field label={t("metaJurisdiction")}>
                        <span className="font-mono">{data.jurisdictionCode}</span>
                      </Field>
                    )}
                    <Field label={t("metaCode")}>
                      <span className="font-mono">{data.documentCode}</span>
                    </Field>
                    {data.originalFilename && (
                      <Field label={t("metaFile")}>
                        <span className="break-all">{data.originalFilename}</span>
                      </Field>
                    )}
                  </dl>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
            </div>

            {/* Original document */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              {isLoading ? (
                <Skeleton className="h-[70vh] w-full rounded-xl" />
              ) : data && hasOriginal ? (
                <OriginalDocument
                  downloadUrl={downloadUrl}
                  contentType={data.contentType}
                  title={data.title}
                />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {t("docNotFound")}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
