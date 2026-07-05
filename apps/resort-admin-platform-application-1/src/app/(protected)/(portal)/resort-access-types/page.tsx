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
import { ResortAccessTypeCard } from "@/components/resort-access-types/resort-access-type-card";
import { ResortAccessTypeDialog, emptyResortAccessTypeForm } from "@/components/resort-access-types/resort-access-type-dialog";
import type { ResortAccessTypeDialogMode, ResortAccessTypeFormState } from "@/components/resort-access-types/types";
import { resortAccessTypesService, type ResortAccessType, type ListParams } from "@/services/resort-access-types";
import { localesService, type Locale } from "@/services/locales";

const PAGE_SIZE = 20;
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code">;
}

export default function ResortAccessTypesPage() {
  const { t } = useTranslation();

  const [accessTypes, setAccessTypes] = useState<ResortAccessType[]>([]);
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
  const [mode, setMode] = useState<ResortAccessTypeDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ResortAccessTypeFormState>(emptyResortAccessTypeForm);
  const [deleteTarget, setDeleteTarget] = useState<ResortAccessType | null>(null);

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
    ...["code"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["sortOrder", "code", "name", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await resortAccessTypesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setAccessTypes(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((a) => a.id === activeIdRef.current);
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
      .catch(() => { });
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

  const defaultNames = useMemo(
    () => Object.fromEntries(accessTypes.map((a) => [a.id, a.locales[0]?.name ?? ""])),
    [accessTypes],
  );

  const displayAccessTypes = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return accessTypes;
    const q = search.trim().toLowerCase();
    return accessTypes.filter((a) => {
      const code = a.code.toLowerCase();
      const name = (defaultNames[a.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [accessTypes, defaultNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyResortAccessTypeForm);
    setDialogOpen(true);
  }

  function openDialog(a: ResortAccessType) {
    setMode("view");
    setActiveId(a.id);
    setForm({
      code: a.code,
      sort_order: a.sort_order,
      locales: a.locales.map((l) => ({
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await resortAccessTypesService.remove(deleteTarget.id);
      toast.success(`${t("resortAccessType.deleteTitle")}: ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refresh({ page: 0 });
      setPage(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("common.admin")}
          title={t("resortAccessType.title")}
          subtitle={t("resortAccessType.subtitle")}
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
          newLabel={t("resortAccessType.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("resortAccessType.loading")}</div>
        ) : displayAccessTypes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("resortAccessType.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAccessTypes.map((a) => (
              <ResortAccessTypeCard
                key={a.id}
                accessType={a}
                defaultName={defaultNames[a.id]}
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

      <ResortAccessTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        accessTypeId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortAccessType.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("resortAccessType.deleteDesc", { code: deleteTarget?.code })}
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
