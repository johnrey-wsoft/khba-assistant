"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, ArrowLeft, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { SourceCard } from "@/components/chat/primitives";
import { cn } from "@/lib/utils";
import { authorityLabel } from "@/lib/chat/authority";
import { getSearchDocumentsQueryOptions } from "@/queries/documents.query";
import { NATIONWIDE, type DocPeriod, type DocSort, type FacetCount } from "@/lib/documents/types";

import { PROTECTED_ROUTES, API_ROUTES } from "@/constants/routes.constant";

const PAGE_SIZE = 8;

type FacetItem = { value: string; label: string; count: number };

export const PageClient = () => {
  const t = useTranslations("search");

  // `draft` is what's in the box; `appliedQ` is the committed query (Enter /
  // Search button, or reset when the box is cleared).
  const [draft, setDraft] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<DocPeriod>("all");
  const [sort, setSort] = useState<DocSort>("date");
  const [page, setPage] = useState(1);
  const [facetsOpen, setFacetsOpen] = useState(false);

  const params = useMemo(
    () => ({
      q: appliedQ,
      types: [...types],
      regions: [...regions],
      period,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [appliedQ, types, regions, period, sort, page]
  );

  const { data, isLoading } = useQuery(getSearchDocumentsQueryOptions(params));

  const regionLabel = (code: string) => (code === NATIONWIDE ? t("nationwide") : code);

  const toFacetItems = (facets: FacetCount[] | undefined, label: (v: string) => string): FacetItem[] =>
    (facets ?? []).map((f) => ({ value: f.value, label: label(f.value), count: f.count }));

  const typeFacets = toFacetItems(data?.facets.types, authorityLabel);
  const regionFacets = toFacetItems(data?.facets.regions, regionLabel);

  const results = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const safePage = Math.min(page, pageCount);

  // Toggle a facet value and return to page 1.
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
    setPage(1);
  };

  const runSearch = () => {
    setAppliedQ(draft.trim());
    setPage(1);
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };
  // Clearing the box (the native "×" or deleting to empty) resets results.
  const onDraftChange = (value: string) => {
    setDraft(value);
    if (value === "") {
      setAppliedQ("");
      setPage(1);
    }
  };

  const changePeriod = (p: DocPeriod) => {
    setPeriod(p);
    setPage(1);
  };
  const changeSort = (s: DocSort) => {
    setSort(s);
    setPage(1);
  };

  const activePills = useMemo(() => {
    const pills: { key: string; label: string; clear: () => void }[] = [];
    for (const v of types)
      pills.push({ key: `type:${v}`, label: authorityLabel(v), clear: () => toggle(types, setTypes, v) });
    for (const v of regions)
      pills.push({ key: `region:${v}`, label: regionLabel(v), clear: () => toggle(regions, setRegions, v) });
    if (period !== "all")
      pills.push({
        key: "period",
        label: period === "2026" ? t("period2026") : t("periodRecent"),
        clear: () => changePeriod("all"),
      });
    return pills;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, regions, period]);

  const hasFilters = activePills.length > 0 || appliedQ.length > 0 || draft.length > 0;
  const clearAll = () => {
    setTypes(new Set());
    setRegions(new Set());
    setPeriod("all");
    setDraft("");
    setAppliedQ("");
    setPage(1);
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
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3.5 size-[18px] text-muted-foreground" />
              <Input
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                type="search"
                placeholder={t("placeholder")}
                className="h-12 pl-11 text-base"
                aria-label={t("searchAria")}
              />
            </div>
            <Button type="submit" className="h-12 px-5 text-sm">
              {t("searchButton")}
            </Button>
          </form>
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
                    onChange={() => changePeriod(p)}
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
                  count: total,
                  q: appliedQ ? `“${appliedQ}”` : t("allDocuments"),
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
                  onClick={() => changeSort(s)}
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
            <>
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

              {pageCount > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] text-muted-foreground">
                    {t("pageOf", { page: safePage, total: pageCount })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2.5 text-xs"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-3.5" />
                      {t("prev")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2.5 text-xs"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      {t("next")}
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
