"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, ArrowLeft, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { SourceCard } from "@/components/chat/primitives";
import { cn } from "@/lib/utils";
import { authorityLabel } from "@/lib/chat/authority";
import { getSearchDocumentsQueryOptions } from "@/queries/documents.query";
import type { SearchDocument } from "@/lib/documents/types";

import { PROTECTED_ROUTES, API_ROUTES } from "@/constants/routes.constant";

type Period = "all" | "2026" | "recent";
type Sort = "date" | "relevance";

// Today is fixed at request time on the server; for the client-side "recent 3
// months" window we compute against the real clock, which is fine for a filter.
const RECENT_CUTOFF = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
};

// Null jurisdiction = nationwide. A sentinel keeps it selectable as a facet.
const NATIONWIDE = "__nationwide__";

type FacetItem = { value: string; label: string; count: number };

export const PageClient = () => {
  const t = useTranslations("search");

  const { data: documents = [], isLoading } = useQuery(getSearchDocumentsQueryOptions());

  const [q, setQ] = useState("");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<Sort>("date");
  const [facetsOpen, setFacetsOpen] = useState(false);

  const regionLabel = (code: string | null) =>
    code == null || code === NATIONWIDE ? t("nationwide") : code;

  // Facet options with counts, derived from the full corpus.
  const typeFacets = useMemo<FacetItem[]>(() => {
    const counts = new Map<string, number>();
    for (const d of documents) counts.set(d.authorityType, (counts.get(d.authorityType) ?? 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: authorityLabel(value), count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  const regionFacets = useMemo<FacetItem[]>(() => {
    const counts = new Map<string, number>();
    for (const d of documents) {
      const key = d.jurisdictionCode ?? NATIONWIDE;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: regionLabel(value), count }))
      .sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const inPeriod = (d: SearchDocument) => {
    if (period === "all") return true;
    if (!d.effectiveFrom) return false;
    if (period === "2026") return d.effectiveFrom >= "2026-01-01";
    return d.effectiveFrom >= RECENT_CUTOFF();
  };

  const relScore = (d: SearchDocument) => {
    if (!q) return 0;
    const hay = `${d.title} ${d.snippet ?? ""} ${d.jurisdictionCode ?? ""}`.toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .reduce((s, term) => s + (term && hay.includes(term) ? 1 : 0), 0);
  };

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = documents.filter((d) => {
      if (types.size && !types.has(d.authorityType)) return false;
      if (regions.size && !regions.has(d.jurisdictionCode ?? NATIONWIDE)) return false;
      if (!inPeriod(d)) return false;
      if (terms.length) {
        const hay = `${d.title} ${d.snippet ?? ""} ${d.jurisdictionCode ?? ""}`.toLowerCase();
        if (!terms.every((term) => hay.includes(term))) return false;
      }
      return true;
    });
    const byDate = (a: SearchDocument, b: SearchDocument) =>
      (b.effectiveFrom ?? "").localeCompare(a.effectiveFrom ?? "");
    list.sort((a, b) =>
      sort === "relevance" ? relScore(b) - relScore(a) || byDate(a, b) : byDate(a, b)
    );
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, q, types, regions, period, sort]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const activePills = useMemo(() => {
    const pills: { key: string; label: string; clear: () => void }[] = [];
    for (const v of types)
      pills.push({
        key: `type:${v}`,
        label: authorityLabel(v),
        clear: () => toggle(types, setTypes, v),
      });
    for (const v of regions)
      pills.push({
        key: `region:${v}`,
        label: regionLabel(v),
        clear: () => toggle(regions, setRegions, v),
      });
    if (period !== "all")
      pills.push({
        key: "period",
        label: period === "2026" ? t("period2026") : t("periodRecent"),
        clear: () => setPeriod("all"),
      });
    return pills;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, regions, period]);

  const hasFilters = activePills.length > 0 || q.length > 0;
  const clearAll = () => {
    setTypes(new Set());
    setRegions(new Set());
    setPeriod("all");
    setQ("");
  };

  const openSource = (code: string) =>
    window.open(API_ROUTES.DOCUMENTS.DOWNLOAD(code), "_blank", "noopener");

  return (
    <div className="min-h-dvh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="grid size-8 flex-none place-items-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground shadow-sm"
          >
            K
          </Link>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-foreground">{t("brand")}</span>
            <span className="truncate text-xs text-muted-foreground">{t("brandSub")}</span>
          </span>
          <span className="ml-auto" />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={PROTECTED_ROUTES.CHAT}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{t("backToChat")}</span>
            </Link>
          </Button>
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <LocaleSwitcher />
          <ModeToggle />
        </div>
      </header>

      {/* Search head */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <span className="text-[11.5px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
            {t("eyebrow")}
          </span>
          <h1 className="mt-2 mb-4 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            {t("headline")}
          </h1>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 size-[18px] text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder={t("placeholder")}
              className="h-12 pl-11 text-base"
              aria-label={t("searchAria")}
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[248px_1fr]">
        {/* Facets */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Button
            variant="outline"
            size="sm"
            className="justify-center gap-2 lg:hidden"
            onClick={() => setFacetsOpen((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
            {facetsOpen ? t("hideFilters") : t("showFilters")}
          </Button>

          <div className={cn("flex-col gap-5", facetsOpen ? "flex" : "hidden lg:flex")}>
            <FacetGroup
              title={t("facetType")}
              items={typeFacets}
              selected={types}
              onToggle={(v) => toggle(types, setTypes, v)}
              loading={isLoading}
            />
            <FacetGroup
              title={t("facetRegion")}
              items={regionFacets}
              selected={regions}
              onToggle={(v) => toggle(regions, setRegions, v)}
              loading={isLoading}
            />

            <div className="flex flex-col gap-1">
              <span className="mb-1.5 text-[11.5px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
                {t("facetPeriod")}
              </span>
              {(["all", "2026", "recent"] as const).map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="period"
                    checked={period === p}
                    onChange={() => setPeriod(p)}
                    className="size-4 accent-primary"
                  />
                  {t(`period${p === "all" ? "All" : p === "2026" ? "2026" : "Recent"}`)}
                </label>
              ))}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="self-start text-xs font-semibold text-primary hover:underline"
              >
                {t("clearAll")}
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="inline-block h-4 w-32 align-middle" />
              ) : (
                t.rich("resultCount", {
                  count: results.length,
                  q: q ? `“${q}”` : t("allDocuments"),
                  b: (chunks) => <b className="font-bold text-foreground">{chunks}</b>,
                })
              )}
            </span>
            <div
              className="inline-flex overflow-hidden rounded-md border border-border"
              role="group"
              aria-label={t("sortAria")}
            >
              {(["date", "relevance"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={cn(
                    "border-l border-border px-3 py-1.5 text-xs font-semibold transition-colors first:border-l-0",
                    sort === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(s === "date" ? "sortDate" : "sortRelevance")}
                </button>
              ))}
            </div>
          </div>

          {activePills.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {activePills.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-1 pr-1.5 pl-2.5 text-xs font-semibold text-primary"
                >
                  {p.label}
                  <button
                    type="button"
                    onClick={p.clear}
                    aria-label={t("removeFilter", { label: p.label })}
                    className="grid size-4 place-items-center rounded-full hover:bg-primary/15"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <h4 className="text-sm font-extrabold text-foreground">{t("emptyTitle")}</h4>
              <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
                {t("emptyBody")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((d) => (
                <SourceCard
                  key={d.documentCode}
                  source={{
                    documentCode: d.documentCode,
                    title: d.title,
                    authorityType: d.authorityType,
                    jurisdictionCode: d.jurisdictionCode,
                    snippet: d.snippet ?? undefined,
                  }}
                  onOpen={() => openSource(d.documentCode)}
                  viewSourceLabel={t("viewSource")}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const FacetGroup = ({
  title,
  items,
  selected,
  onToggle,
  loading,
}: {
  title: string;
  items: FacetItem[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  loading: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <span className="mb-1.5 text-[11.5px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
      {title}
    </span>
    {loading ? (
      <div className="flex flex-col gap-2 px-2 py-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    ) : items.length === 0 ? (
      <span className="px-2 py-1 text-xs text-muted-foreground">—</span>
    ) : (
      items.map((it) => (
        <label
          key={it.value}
          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          <input
            type="checkbox"
            checked={selected.has(it.value)}
            onChange={() => onToggle(it.value)}
            className="size-[15px] accent-primary"
          />
          <span className="min-w-0 flex-1 truncate">{it.label}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{it.count}</span>
        </label>
      ))
    )}
  </div>
);
