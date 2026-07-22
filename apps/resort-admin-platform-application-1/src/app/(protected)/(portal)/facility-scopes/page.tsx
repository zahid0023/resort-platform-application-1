"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FacilityScopeCard } from "@/components/facility-scopes/facility-scope-card";
import { FacilityScopeDialog } from "@/components/facility-scopes/facility-scope-dialog";
import type { FacilityScopeFormState } from "@/components/facility-scopes/types";
import { FieldSearchBar } from "@/components/shared/field-search-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SortControl } from "@/components/shared/sort-control";
import { facilityScopesService, type FacilityScope, type ListParams } from "@/services/facility-scopes";
import { localesService, type Locale } from "@/services/locales";

const PAGE_SIZE = 20;
const ALL_FIELD = "all";

const emptyForm: FacilityScopeFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};

function buildApiFilters(field: string, q: string): Pick<ListParams, "code"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code">;
}

export default function FacilityScopesPage() {
  const { t } = useTranslation();

  const [scopes, setScopes] = useState<FacilityScope[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState(ALL_FIELD);

  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FacilityScopeFormState>(emptyForm);

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
    toFieldOption("code"),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["sortOrder", "code", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await facilityScopesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setScopes(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((s) => s.id === activeIdRef.current);
        if (!updated) return prev;
        return {
          ...prev,
          locales: updated.locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        };
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
    const timer = setTimeout(
      () => refresh({ page: 0, ...buildApiFilters(searchField, search.trim()) }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopeNames = useMemo(
    () => Object.fromEntries(scopes.map((s) => [s.id, s.locales[0]?.name ?? ""])),
    [scopes],
  );

  const displayScopes = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return scopes;
    const q = search.trim().toLowerCase();
    return scopes.filter((s) => {
      const code = s.code.toLowerCase();
      const name = (scopeNames[s.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [scopes, scopeNames, search, searchField]);

  function openDialog(scope: FacilityScope) {
    setActiveId(scope.id);
    setForm({
      code: scope.code,
      sort_order: scope.sort_order,
      locales: scope.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setDialogOpen(true);
  }

  function handleSortByChange(value: string) {
    setSortBy(value);
    setPage(0);
    refresh({ sort_by: value, page: 0 });
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

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("common.admin")}
          title={t("facilityScope.title")}
          subtitle={t("facilityScope.subtitle")}
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

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("facilityScope.loading")}</div>
        ) : displayScopes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("facilityScope.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayScopes.map((s) => (
              <FacilityScopeCard
                key={s.id}
                scope={s}
                defaultName={scopeNames[s.id]}
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

      <FacilityScopeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facilityScopeId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={() => refresh()}
      />
    </div>
  );
}
