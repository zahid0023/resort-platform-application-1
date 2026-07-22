"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { FacilityGroupCard } from "@/components/facility-groups/facility-group-card";
import { FacilityGroupDialog, emptyFacilityGroupForm } from "@/components/facility-groups/facility-group-dialog";
import type { FacilityGroupDialogMode, FacilityGroupFormState } from "@/components/facility-groups/types";
import { toIconValue } from "@/components/facility-groups/types";
import {
  listFacilityGroups,
  getFacilityGroup,
  deleteFacilityGroup,
  type FacilityGroupSummary,
  type ListParams,
  type ScopeAssignment,
} from "@/services/facility-groups";
import { facilityScopesService, type FacilityScope } from "@/services/facility-scopes";
import { localesService, type Locale } from "@/services/locales";

const PAGE_SIZE = 20;
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code">;
}

export default function FacilityGroupsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // List data
  const [groups, setGroups] = useState<FacilityGroupSummary[]>([]);
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

  // Scope assignments cache (populated as dialogs are opened)
  const [scopeMap, setScopeMap] = useState<Record<number, ScopeAssignment[]>>({});

  // Dialog
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [availableScopes, setAvailableScopes] = useState<FacilityScope[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FacilityGroupDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FacilityGroupFormState>(emptyFacilityGroupForm);
  const [deleteTarget, setDeleteTarget] = useState<FacilityGroupSummary | null>(null);

  // Refs to avoid stale closures in refresh
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
    ...["sortOrder", "code", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await listFacilityGroups({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setGroups(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      // Sync open dialog locales with refreshed data
      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((g) => g.id === activeIdRef.current);
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

  // Initial load
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Locales for dialog
  useEffect(() => {
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  // Scopes for dialog
  useEffect(() => {
    facilityScopesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableScopes(res.data))
      .catch(() => {});
  }, []);

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

  const groupNames = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g.locales[0]?.name ?? ""])),
    [groups],
  );

  // Client-side OR filter for "all" field
  const displayGroups = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return groups;
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      const code = g.code.toLowerCase();
      const name = (groupNames[g.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [groups, groupNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    const resortScope = availableScopes.find((s) => s.code === "RESORT");
    setForm({
      ...emptyFacilityGroupForm,
      scope_ids: resortScope ? [resortScope.id] : [],
    });
    setDialogOpen(true);
  }

  async function openDialog(g: FacilityGroupSummary) {
    try {
      const res = await getFacilityGroup(g.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      const assignments = full.scope_assignments ?? [];
      setScopeMap((prev) => ({ ...prev, [full.id]: assignments }));
      setForm({
        code: full.code,
        sort_order: full.sort_order,
        icon: toIconValue(full),
        locales: full.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
        scope_ids: [],
        scope_assignments: assignments,
      });
      setDialogOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleSortByChange(value: string) {
    setSortBy(value);
    setPage(0);
    refresh({ sort_by: value as ListParams["sort_by"], page: 0 });
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
      await deleteFacilityGroup(deleteTarget.id);
      toast.success(t("facilityGroup.deleted"));
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
          title={t("facilityGroup.title")}
          subtitle={t("facilityGroup.subtitle")}
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
          newLabel={t("facilityGroup.new")}
          onNew={openCreate}
        />
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("facilityGroup.loading")}</div>
        ) : displayGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("facilityGroup.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayGroups.map((g) => (
              <FacilityGroupCard
                key={g.id}
                group={g}
                defaultName={groupNames[g.id]}
                scopeAssignments={scopeMap[g.id]}
                onNavigate={(g) => router.push(`/facility-groups/${g.id}`)}
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

      <FacilityGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        facilityGroupId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        availableScopes={availableScopes}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facilityGroup.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facilityGroup.deleteDesc")}
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
