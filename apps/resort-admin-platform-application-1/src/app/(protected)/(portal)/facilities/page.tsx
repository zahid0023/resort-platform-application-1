"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LayoutGrid, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui";
import { PageActions } from "@/components/shared/page-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { FacilityCard } from "@/components/facilities/facility-card";
import { FacilityDialog, emptyFacilityForm } from "@/components/facilities/facility-dialog";
import type { FacilityDialogMode, FacilityFormState } from "@/components/facilities/types";
import { toIconValue } from "@/components/facilities/types";
import { toIconValue as groupToIconValue } from "@/components/facility-groups/types";
import { IconRenderer } from "@/components/shared/icon-picker";
import {
  listFacilities,
  getFacility,
  deleteFacility,
  type FacilitySummary,
  type ListParams,
} from "@/services/facilities";
import { listFacilityGroups, type FacilityGroupSummary } from "@/services/facility-groups";
import { useLocales } from "@/providers/locales-provider";

const PAGE_SIZE = 20;
const GROUPS_PER_PAGE = 4;
const ALL_FIELD = "all";

type ViewMode = "all" | "by-group";

interface GroupSection {
  group: FacilityGroupSummary;
  facilities: FacilitySummary[];
  page: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
  loading: boolean;
}

function buildApiFilters(field: string, q: string): Pick<ListParams, "code"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code">;
}

export default function FacilitiesPage() {
  const { t } = useTranslation();

  // ── View toggle ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // ── All-facilities state ───────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Search / sort
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState(ALL_FIELD);
  const [filterGroupId, setFilterGroupId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // ── By-group state ─────────────────────────────────────────────────────────
  const [groupSections, setGroupSections] = useState<GroupSection[]>([]);
  const [groupPage, setGroupPage] = useState(0);
  const [groupTotalPages, setGroupTotalPages] = useState(0);
  const [groupTotalElements, setGroupTotalElements] = useState(0);
  const [groupHasNext, setGroupHasNext] = useState(false);
  const [groupHasPrevious, setGroupHasPrevious] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const byGroupInitialized = useRef(false);

  // ── Dialog / locale ────────────────────────────────────────────────────────
  // Shared, session-scoped catalog — loaded once by LocalesProvider, not re-fetched per dialog open.
  const { locales: availableLocales } = useLocales();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FacilityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FacilityFormState>(emptyFacilityForm);
  const [deleteTarget, setDeleteTarget] = useState<FacilitySummary | null>(null);

  const isFirstRender = useRef(true);

  // ── Derived ────────────────────────────────────────────────────────────────
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

  const facilityNames = useMemo(
    () => Object.fromEntries(facilities.map((f) => [f.id, f.locale?.name ?? ""])),
    [facilities],
  );

  const displayFacilities = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return facilities;
    const q = search.trim().toLowerCase();
    return facilities.filter((f) => {
      const code = f.code.toLowerCase();
      const name = (facilityNames[f.id] ?? "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [facilities, facilityNames, search, searchField]);

  // ── All-facilities data fetching ───────────────────────────────────────────
  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await listFacilities({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        facilityGroupId: filterGroupId,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setFacilities(res.data);
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

  // ── By-group data fetching ─────────────────────────────────────────────────
  async function loadGroupPage(p: number) {
    setGroupsLoading(true);
    try {
      const groupRes = await listFacilityGroups({ page: p, size: GROUPS_PER_PAGE, sort_by: "sortOrder" });
      setGroupTotalPages(groupRes.total_pages);
      setGroupTotalElements(groupRes.total_elements);
      setGroupHasNext(groupRes.has_next);
      setGroupHasPrevious(groupRes.has_previous);

      // Optimistically set sections in loading state
      setGroupSections(groupRes.data.map((g) => ({
        group: g,
        facilities: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
        loading: true,
      })));

      // Fetch each group's facilities in parallel
      const facilityResults = await Promise.all(
        groupRes.data.map((g) =>
          listFacilities({ page: 0, size: PAGE_SIZE, sort_by: "sortOrder", facilityGroupId: g.id }),
        ),
      );

      setGroupSections(groupRes.data.map((g, i) => ({
        group: g,
        facilities: facilityResults[i].data,
        page: 0,
        totalPages: facilityResults[i].total_pages,
        totalElements: facilityResults[i].total_elements,
        hasNext: facilityResults[i].has_next,
        hasPrevious: facilityResults[i].has_previous,
        loading: false,
      })));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGroupsLoading(false);
    }
  }

  async function loadFacilitiesForGroup(groupId: number, p: number) {
    setGroupSections((prev) =>
      prev.map((s) => s.group.id === groupId ? { ...s, loading: true } : s),
    );
    try {
      const res = await listFacilities({
        page: p,
        size: PAGE_SIZE,
        sort_by: "sortOrder",
        facilityGroupId: groupId,
      });
      setGroupSections((prev) =>
        prev.map((s) =>
          s.group.id === groupId
            ? {
                ...s,
                facilities: res.data,
                page: p,
                totalPages: res.total_pages,
                totalElements: res.total_elements,
                hasNext: res.has_next,
                hasPrevious: res.has_previous,
                loading: false,
              }
            : s,
        ),
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 0 (all-facilities only)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return () => { isFirstRender.current = true; }; // reset for Strict Mode remount
    }
    setPage(0);
    const timer = setTimeout(
      () => refresh({ page: 0, ...buildApiFilters(searchField, search.trim()) }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load by-group data when switching to that view (only once)
  useEffect(() => {
    if (viewMode === "by-group" && !byGroupInitialized.current) {
      byGroupInitialized.current = true;
      setGroupPage(0);
      loadGroupPage(0);
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyFacilityForm);
    setDialogOpen(true);
  }

  async function openDialog(f: FacilitySummary) {
    try {
      const res = await getFacility(f.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      setForm({
        facility_groups: full.facility_groups,
        facility_scopes: full.facility_scopes,
        code: full.code,
        sort_order: full.sort_order,
        icon: toIconValue(full),
        locale: emptyFacilityForm.locale,
        // Lazily populated by FacilityDialog the first time the Translations tab is selected.
        locales: [],
      });
      setDialogOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleSaved() {
    if (viewMode === "all") {
      refresh();
    } else {
      loadGroupPage(groupPage);
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

  function handleGroupPageChange(p: number) {
    setGroupPage(p);
    byGroupInitialized.current = true;
    loadGroupPage(p);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFacility(deleteTarget.id);
      toast.success(t("facility.deleted"));
      setDeleteTarget(null);
      if (viewMode === "all") {
        await refresh({ page: 0 });
        setPage(0);
      } else {
        await loadGroupPage(groupPage);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("common.admin")}
          title={t("facility.title")}
          subtitle={t("facility.subtitle")}
        />
        <div className="flex flex-col sm:items-end gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30 self-start sm:self-auto">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "all" ? "default" : "ghost"}
              className="h-7 px-3 gap-1.5 text-xs"
              onClick={() => setViewMode("all")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All Facilities
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "by-group" ? "default" : "ghost"}
              className="h-7 px-3 gap-1.5 text-xs"
              onClick={() => setViewMode("by-group")}
            >
              <Layers className="h-3.5 w-3.5" />
              By Group
            </Button>
          </div>

          {/* Search / sort only in All view */}
          {viewMode === "all" && (
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
              newLabel={t("facility.new")}
              onNew={openCreate}
            />
          )}

          {viewMode === "by-group" && (
            <Button type="button" onClick={openCreate}>
              {t("facility.new")}
            </Button>
          )}
        </div>
      </header>

      {/* ── All Facilities view ───────────────────────────────────────────── */}
      {viewMode === "all" && (
        <main className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{t("facility.loading")}</div>
          ) : displayFacilities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
              {t("facility.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayFacilities.map((f) => (
                <FacilityCard
                  key={f.id}
                  facility={f}
                  defaultName={facilityNames[f.id]}
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
      )}

      {/* ── By Group view ─────────────────────────────────────────────────── */}
      {viewMode === "by-group" && (
        <main className="flex flex-col gap-10">
          {groupsLoading && groupSections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t("facility.loading")}</div>
          ) : groupSections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
              {t("facility.empty")}
            </div>
          ) : (
            groupSections.map((section) => {
              const groupIcon = groupToIconValue(section.group);
              const accentColor = groupIcon.meta?.color || undefined;
              const groupName = section.group.locale?.name || section.group.code;
              const sectionFacilityNames = Object.fromEntries(
                section.facilities.map((f) => [f.id, f.locale?.name ?? ""]),
              );

              return (
                <section key={section.group.id} className="flex flex-col gap-4">
                  {/* Group section header */}
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div
                      className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
                      style={{
                        background: accentColor
                          ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                          : undefined,
                        boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
                      }}
                    >
                      <IconRenderer
                        icon={groupIcon}
                        className="h-4.5 w-4.5"
                        style={{ color: "white" }}
                        fallback={
                          <span className="font-mono text-xs font-semibold text-white">
                            {section.group.code[0] ?? "?"}
                          </span>
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-base leading-tight">{groupName}</h2>
                      <p className="text-xs text-muted-foreground font-mono">
                        {section.group.code} · {section.totalElements} facilit{section.totalElements !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                  </div>

                  {/* Facilities grid */}
                  {section.loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("facility.loading")}
                    </div>
                  ) : section.facilities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
                      {t("facility.empty")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.facilities.map((f) => (
                        <FacilityCard
                          key={f.id}
                          facility={f}
                          defaultName={sectionFacilityNames[f.id]}
                          groupName={groupName}
                          onView={openDialog}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </div>
                  )}

                  {/* Per-group pagination */}
                  <Pagination
                    currentPage={section.page}
                    totalPages={section.totalPages}
                    totalElements={section.totalElements}
                    hasNext={section.hasNext}
                    hasPrevious={section.hasPrevious}
                    onPageChange={(p) => loadFacilitiesForGroup(section.group.id, p)}
                  />
                </section>
              );
            })
          )}

          {/* Group-level pagination (next/prev 4 groups) */}
          {!groupsLoading && groupTotalPages > 1 && (
            <div className="pt-2 border-t">
              <Pagination
                currentPage={groupPage}
                totalPages={groupTotalPages}
                totalElements={groupTotalElements}
                hasNext={groupHasNext}
                hasPrevious={groupHasPrevious}
                onPageChange={handleGroupPageChange}
              />
            </div>
          )}
        </main>
      )}

      {/* ── Shared dialog + delete confirm ────────────────────────────────── */}
      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        facilityId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facility.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facility.deleteDesc")}
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
