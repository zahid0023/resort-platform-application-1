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
import { ImageHostingProviderCard } from "@/components/image-hosting-providers/image-hosting-provider-card";
import { ImageHostingProviderDialog, emptyImageHostingProviderForm } from "@/components/image-hosting-providers/image-hosting-provider-dialog";
import type { ImageHostingProviderDialogMode, ImageHostingProviderFormState } from "@/components/image-hosting-providers/types";
import { imageHostingProvidersService, type ImageHostingProvider, type ListParams } from "@/services/image-hosting-providers";

const PAGE_SIZE = 20;

// "all" is a frontend-only concept (client-side OR across all fields)
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code" | "name"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code" | "name">;
}

export default function ImageHostingProvidersPage() {
  const { t } = useTranslation();

  // List data
  const [providers, setProviders] = useState<ImageHostingProvider[]>([]);
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

  // Sort — only code/name are sortable here; "id" is implicit-default only.
  const [sortBy, setSortBy] = useState<NonNullable<ListParams["sort_by"]>>("code");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ImageHostingProviderDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ImageHostingProviderFormState>(emptyImageHostingProviderForm);
  const [deleteTarget, setDeleteTarget] = useState<ImageHostingProvider | null>(null);

  const dialogOpenRef = useRef(dialogOpen);
  const activeIdRef = useRef(activeId);
  useEffect(() => { dialogOpenRef.current = dialogOpen; }, [dialogOpen]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) };
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
    ...["code", "name"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["code", "name"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await imageHostingProvidersService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setProviders(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      // Sync open dialog form with refreshed data
      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((p) => p.id === activeIdRef.current);
        if (!updated) return prev;
        return { ...prev, name: updated.name, description: updated.description, sort_order: updated.sort_order };
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 0.
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

  // Client-side OR filter only for "all" field (API has no OR-across-fields support)
  const displayProviders = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return providers;
    const q = search.trim().toLowerCase();
    return providers.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [providers, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyImageHostingProviderForm);
    setDialogOpen(true);
  }

  async function openDialog(p: ImageHostingProvider) {
    try {
      const res = await imageHostingProvidersService.get(p.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      setForm({
        code: full.code,
        name: full.name,
        description: full.description,
        sort_order: full.sort_order,
        // Config fields and configs are never embedded on this DTO — both are lazily populated
        // by ImageHostingProviderDialog the first time their respective tab is selected.
        config_fields: [],
        configs: [],
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await imageHostingProvidersService.remove(deleteTarget.id);
      toast.success(`${t("delete.imageHostingProvider.title")}: ${deleteTarget.code}`);
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
          title={t("imageHostingProvider.title")}
          subtitle={t("imageHostingProvider.subtitle")}
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
          newLabel={t("imageHostingProvider.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("imageHostingProvider.loading")}</div>
        ) : displayProviders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("imageHostingProvider.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProviders.map((p) => (
              <ImageHostingProviderCard
                key={p.id}
                provider={p}
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

      <ImageHostingProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        providerId={activeId}
        form={form}
        onFormChange={setForm}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.imageHostingProvider.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.imageHostingProvider.desc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
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
