"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FieldSearchBar } from "@/components/shared/field-search-bar";
import { SortControl } from "@/components/shared/sort-control";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { DayOfWeekCard } from "@/components/days-of-week/day-of-week-card";
import { DayOfWeekDialog } from "@/components/days-of-week/day-of-week-dialog";
import { emptyDayOfWeekForm, type DayOfWeekFormState } from "@/components/days-of-week/types";
import { daysOfWeekService, type DayOfWeek, type ListParams } from "@/services/days-of-week";

const PAGE_SIZE = 20;

// "all" is a frontend-only concept (client-side OR across all fields)
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code" | "name" | "shortName"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code" | "name" | "shortName">;
}

// The seven days of the week are platform-seeded and read-only — this page has no "New" button and
// no delete affordance, only view + manage-locale-translations via the dialog.
export default function DaysOfWeekPage() {
  const { t } = useTranslation();

  // List data
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Search
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState(ALL_FIELD);

  // Sort — "id" is only valid as the implicit default when sortBy is omitted; never send it explicitly.
  const [sortBy, setSortBy] = useState<NonNullable<ListParams["sort_by"]>>("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<DayOfWeekFormState>(emptyDayOfWeekForm);

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) };
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
    ...["code", "name", "shortName"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  // "id" is deliberately excluded — passing sortBy=id throws 400 (it's implicit-default only).
  const sortFields = useMemo(() => [
    ...["sortOrder", "code", "name", "shortName", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await daysOfWeekService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setDaysOfWeek(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 0. Guarded by comparing against the last-applied key rather
  // than a one-shot flag, since a boolean doesn't survive React Strict Mode's dev-only effect replay.
  const lastSearchKey = useRef(`${searchField}:${search}`);
  useEffect(() => {
    const key = `${searchField}:${search}`;
    if (lastSearchKey.current === key) return;
    lastSearchKey.current = key;
    setPage(0);
    const timer = setTimeout(
      () => refresh({ page: 0, ...buildApiFilters(searchField, search.trim()) }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  const dayOfWeekNames = useMemo(
    () => Object.fromEntries(daysOfWeek.map((d) => [d.id, d.locale?.name ?? ""])),
    [daysOfWeek],
  );

  // Client-side OR filter only for "all" field (API has no OR-across-fields support)
  const displayDaysOfWeek = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return daysOfWeek;
    const q = search.trim().toLowerCase();
    return daysOfWeek.filter((d) => {
      const code = d.code.toLowerCase();
      const name = (dayOfWeekNames[d.id] ?? "").toLowerCase();
      const shortName = (d.locale?.short_name ?? "").toLowerCase();
      return code.includes(q) || name.includes(q) || shortName.includes(q);
    });
  }, [daysOfWeek, dayOfWeekNames, search, searchField]);

  async function openDialog(d: DayOfWeek) {
    try {
      const res = await daysOfWeekService.get(d.id);
      const full = res.data;
      setActiveId(full.id);
      setForm({
        code: full.code,
        sort_order: full.sort_order,
        // Lazily populated by DayOfWeekDialog the first time the Translations tab is selected.
        locales: [],
      });
      setDialogOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleSortByChange(value: string) {
    const field = value as NonNullable<ListParams["sort_by"]>;
    setSortBy(field);
    setPage(0);
    refresh({ sort_by: field, page: 0 });
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir);
    setPage(0);
    refresh({ sort_dir: dir, page: 0 });
  }

  function handlePageChange(p: number) {
    setPage(p);
    refresh({ page: p });
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("common.admin")}
          title={t("dayOfWeek.title")}
          subtitle={t("dayOfWeek.subtitle")}
        />
        <div className="grid gap-2">
          <FieldSearchBar
            fields={searchFields}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            search={search}
            onSearchChange={setSearch}
          />
          <SortControl
            fields={sortFields}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortDir={sortDir}
            onSortDirChange={handleSortDirChange}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("dayOfWeek.loading")}</div>
        ) : displayDaysOfWeek.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("dayOfWeek.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayDaysOfWeek.map((d) => (
              <DayOfWeekCard
                key={d.id}
                dayOfWeek={d}
                defaultName={dayOfWeekNames[d.id]}
                onView={openDialog}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={handlePageChange}
        />
      </main>

      <DayOfWeekDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dayOfWeekId={activeId}
        form={form}
        onFormChange={setForm}
        onSaved={() => refresh()}
      />
    </div>
  );
}
