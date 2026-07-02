"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@resort/shadcn-ui";
import { PageActions } from "@/components/shared/page-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { LocaleCard } from "@/components/locales/locale-card";
import { LocaleDialog, emptyLocaleForm } from "@/components/locales/locale-dialog";
import type { LocaleDialogMode, LocaleFormState } from "@/components/locales/types";
import { localesService, type Locale, type ListLocalesParams } from "@/services/locales";

const PAGE_SIZE = 20;
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListLocalesParams, "code" | "name"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListLocalesParams, "code" | "name">;
}

export default function LocalesPage() {
  const { t } = useTranslation();

  // List data
  const [locales, setLocales] = useState<Locale[]>([]);
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

  // Sort
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<LocaleDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<LocaleFormState>(emptyLocaleForm);
  const [deleteTarget, setDeleteTarget] = useState<Locale | null>(null);

  // Refs to avoid stale closures
  const dialogOpenRef = useRef(dialogOpen);
  const activeIdRef = useRef(activeId);
  useEffect(() => { dialogOpenRef.current = dialogOpen; }, [dialogOpen]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const isFirstRender = useRef(true);

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) };
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
    ...["code", "name"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["sortOrder", "code", "name", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListLocalesParams> = {}) {
    setLoading(true);
    try {
      const res = await localesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListLocalesParams["sort_by"],
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setLocales(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      // Sync open dialog form with refreshed data
      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((l) => l.id === activeIdRef.current);
        if (!updated) return prev;
        return {
          code: updated.code,
          name: updated.name,
          sort_order: updated.sort_order,
        };
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 0
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
    const timer = setTimeout(
      () => refresh({ page: 0, ...buildApiFilters(searchField, search.trim()) }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side OR filter for "all" field
  const displayLocales = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return locales;
    const q = search.trim().toLowerCase();
    return locales.filter((l) =>
      l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
    );
  }, [locales, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyLocaleForm);
    setDialogOpen(true);
  }

  function openDialog(locale: Locale) {
    setMode("view");
    setActiveId(locale.id);
    setForm({
      code: locale.code,
      name: locale.name,
      sort_order: locale.sort_order,
    });
    setDialogOpen(true);
  }

  function handleSortByChange(value: string) {
    setSortBy(value);
    setPage(0);
    refresh({ sort_by: value as ListLocalesParams["sort_by"], page: 0 });
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await localesService.remove(deleteTarget.id);
      toast.success(t("locales.deleted"));
      setDeleteTarget(null);
      await refresh({ page: 0 });
      setPage(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("common.admin")}
          title={t("locales.title")}
          subtitle={t("locales.subtitle")}
        />
        <PageActions
          fields={searchFields}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          search={search}
          onSearchChange={setSearch}
          sort={{
            fields: sortFields,
            sortBy,
            onSortByChange: handleSortByChange,
            sortDir,
            onSortDirChange: handleSortDirChange,
          }}
          newLabel={t("locales.new")}
          onNew={openCreate}
        />
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("locales.loading")}</div>
        ) : displayLocales.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("locales.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayLocales.map((locale) => (
              <LocaleCard
                key={locale.id}
                locale={locale}
                onView={openDialog}
                onDelete={setDeleteTarget}
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

      <LocaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        localeId={activeId}
        form={form}
        onFormChange={setForm}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.locale.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.locale.desc", { code: deleteTarget?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
