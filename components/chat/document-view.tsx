"use client";

import { useEffect, useState } from "react";
import { X, Download, FileText, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DocumentPassage = { nodePath: string; text: string };
export type FullDocument = {
  documentCode: string;
  title: string;
  authorityType: string;
  jurisdictionCode: string | null;
  securityClass: string;
  effectiveFrom: string | null;
  hasOriginal: boolean;
  contentType: string | null;
  originalFilename: string | null;
  passages: DocumentPassage[];
};

// Which face of a document is shown: the parsed text, or the original file.
export type DocView = "text" | "document";
// How the parsed text is rendered: formatted markdown ("read") or verbatim ("raw").
export type TextMode = "read" | "raw";

// Image document viewer: contained on a neutral ground with a loading
// skeleton, and click-to-zoom into a fullscreen lightbox (Esc / click to close).
export const DocumentImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-muted/40",
          // Reserve height while the image loads, so the skeleton is visible
          // (the container would otherwise collapse to 0 before load).
          !loaded && "min-h-[340px]"
        )}
      >
        {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onClick={() => setZoomed(true)}
          className="mx-auto block max-h-[70vh] w-auto max-w-full cursor-zoom-in object-contain"
        />
        {loaded && (
          <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
            <ZoomIn className="size-3" />
            Zoom
          </span>
        )}
      </div>

      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6 duration-150 animate-in fade-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
};

// The original file — embedded (PDF/image) or, when it can't be previewed
// inline, a download prompt. Mirrors the artifact panel's "document" view so
// the admin preview matches it exactly.
export const OriginalDocument = ({
  downloadUrl,
  contentType,
  title,
}: {
  downloadUrl: string;
  contentType: string | null;
  title: string;
}) => {
  const t = useTranslations("chat");
  const type = contentType ?? "";
  const isPdf = type.includes("pdf");
  const isImage = type.startsWith("image/");

  if (isPdf) {
    return (
      <iframe
        src={`${downloadUrl}?inline=1`}
        title={title}
        className="h-[70vh] w-full rounded-xl border border-border bg-background"
      />
    );
  }
  if (isImage) {
    return <DocumentImage src={`${downloadUrl}?inline=1`} alt={title} />;
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-8 text-center">
      <FileText className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t("cantPreview")}</p>
      <Button asChild size="sm">
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          <Download className="size-4" />
          {t("download")}
        </a>
      </Button>
    </div>
  );
};

// Segmented control switching between the parsed text and the original file.
export const DocViewToggle = ({
  value,
  onChange,
}: {
  value: DocView;
  onChange: (v: DocView) => void;
}) => {
  const t = useTranslations("chat");
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
      {(["text", "document"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode === "text" ? t("viewText") : t("viewDocument")}
        </button>
      ))}
    </div>
  );
};

// Dropdown choosing how the parsed text reads: formatted ("read", default) or
// verbatim ("raw").
export const TextModeSelect = ({
  value,
  onChange,
}: {
  value: TextMode;
  onChange: (v: TextMode) => void;
}) => {
  const t = useTranslations("chat");
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TextMode)}>
      <SelectTrigger size="sm" className="h-7 rounded-full text-xs font-bold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="read">{t("viewRead")}</SelectItem>
        <SelectItem value="raw">{t("viewRaw")}</SelectItem>
      </SelectContent>
    </Select>
  );
};
