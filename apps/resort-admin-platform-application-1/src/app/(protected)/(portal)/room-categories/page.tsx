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
import { RoomCategoryCard } from "@/components/room-categories/room-category-card";
import { RoomCategoryDialog, emptyRoomCategoryForm } from "@/components/room-categories/room-category-dialog";
import type { RoomCategoryDialogMode, RoomCategoryFormState } from "@/components/room-categories/types";
import { roomCategoriesService, type RoomCategory, type ListParams } from "@/services/room-categories";

const PAGE_SIZE = 20;

// "all" is a frontend-only concept (client-side OR across all fields)
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code" | "name"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code" | "name">;
}

export default function RoomCategoriesPage() {
  const { t } = useTranslation();

  // List data
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
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
  const [sortBy, setSortBy] = useState<NonNullable<ListParams["sort_by"]>>("code");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<RoomCategoryDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<RoomCategoryFormState>(emptyRoomCategoryForm);
  const [deleteTarget, setDeleteTarget] = useState<RoomCategory | null>(null);

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) };
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
    ...["code", "name"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  // "id" is deliberately excluded — passing sortBy=id throws 400 (it's implicit-default only).
  const sortFields = useMemo(() => [
    ...["code", "name", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await roomCategoriesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setRoomCategories(res.data);
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

  const categoryNames = useMemo(
    () => Object.fromEntries(roomCategories.map((c) => [c.id, c.locale?.name ?? ""])),
    [roomCategories],
  );

  // Client-side OR filter only for "all" field (API has no OR-across-fields support)
  const displayCategories = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return roomCategories;
    const q = search.trim().toLowerCase();
    return roomCategories.filter((c) => {
      const code = c.code.toLowerCase();
      const name = (categoryNames[c.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [roomCategories, categoryNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyRoomCategoryForm);
    setDialogOpen(true);
  }

  async function openDialog(c: RoomCategory) {
    try {
      const res = await roomCategoriesService.get(c.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      setForm({
        code: full.code,
        sort_order: full.sort_order,
        locale: emptyRoomCategoryForm.locale,
        // Lazily populated by RoomCategoryDialog the first time the Translations tab is selected.
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await roomCategoriesService.remove(deleteTarget.id);
      toast.success(`${t("roomCategory.deleteTitle")}: ${deleteTarget.code}`);
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
          title={t("roomCategory.title")}
          subtitle={t("roomCategory.subtitle")}
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
          newLabel={t("roomCategory.new")}
          onNew={openCreate}
        />
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("roomCategory.loading")}</div>
        ) : displayCategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("roomCategory.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCategories.map((c) => (
              <RoomCategoryCard
                key={c.id}
                roomCategory={c}
                defaultName={categoryNames[c.id]}
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

      <RoomCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        roomCategoryId={activeId}
        form={form}
        onFormChange={setForm}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("roomCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("roomCategory.deleteDesc", { code: deleteTarget?.code })}
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
