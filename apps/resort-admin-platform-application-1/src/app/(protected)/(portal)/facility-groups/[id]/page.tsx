"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
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
import { Button } from "@resort/shadcn-ui";
import { PageHeader } from "@/components/shared/page-header";
import { PageActions } from "@/components/shared/page-actions";
import { Pagination } from "@/components/shared/pagination";
import { FacilityCard } from "@/components/facilities/facility-card";
import { FacilityDialog, emptyFacilityForm } from "@/components/facilities/facility-dialog";
import type { FacilityDialogMode, FacilityFormState } from "@/components/facilities/types";
import { toIconValue } from "@/components/facilities/types";
import { getFacilityGroup, type FacilityGroup } from "@/services/facility-groups";
import { pickTranslation } from "@/lib/locale";
import {
  listFacilities,
  deleteFacility,
  type FacilitySummary,
  type ListParams,
} from "@/services/facilities";
import { localesService, type Locale } from "@/services/locales";

const PAGE_SIZE = 20;
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code">;
}

export default function FacilityGroupDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const groupId = Number(params.id);

  // Group
  const [group, setGroup] = useState<FacilityGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Facilities list
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Search / sort
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState(ALL_FIELD);
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FacilityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FacilityFormState>(emptyFacilityForm);
  const [deleteTarget, setDeleteTarget] = useState<FacilitySummary | null>(null);

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

  async function refreshFacilities(overrides: Partial<ListParams> = {}) {
    setFacilitiesLoading(true);
    try {
      const res = await listFacilities({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        facilityGroupId: groupId,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });
      setFacilities(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((f) => f.id === activeIdRef.current);
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
      setFacilitiesLoading(false);
    }
  }

  // Load group
  useEffect(() => {
    if (!groupId) return;
    getFacilityGroup(groupId)
      .then((res) => setGroup(res.data))
      .catch((err) => {
        const msg = (err as Error).message ?? "";
        if (msg.toLowerCase().includes("not found")) setNotFound(true);
        else toast.error(msg);
      })
      .finally(() => setGroupLoading(false));
  }, [groupId]);

  // Initial facilities load
  useEffect(() => {
    if (!groupId) return;
    refreshFacilities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Locales for dialog
  useEffect(() => {
    localesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
    const timer = setTimeout(
      () => refreshFacilities({ page: 0, ...buildApiFilters(searchField, search.trim()) }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  const facilityNames = useMemo(
    () => Object.fromEntries(facilities.map((f) => [f.id, f.locales[0]?.name ?? ""])),
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

  const groupName = pickTranslation(group?.locales, availableLocales)?.name ?? group?.code ?? "";

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm({ ...emptyFacilityForm, facility_group_id: groupId });
    setDialogOpen(true);
  }

  function openDialog(f: FacilitySummary) {
    setMode("view");
    setActiveId(f.id);
    setForm({
      facility_group_id: f.facility_group_id,
      code: f.code,
      sort_order: f.sort_order ?? 0,
      icon: toIconValue(f),
      locales: f.locales.map((l) => ({
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
    refreshFacilities({ sort_by: value as ListParams["sort_by"], page: 0 });
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir);
    setPage(0);
    refreshFacilities({ sort_dir: dir, page: 0 });
  }

  function handlePageChange(p: number) {
    setPage(p);
    refreshFacilities({ page: p });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFacility(deleteTarget.id);
      toast.success(t("facility.deleted"));
      setDeleteTarget(null);
      await refreshFacilities({ page: 0 });
      setPage(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (groupLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("facilityGroup.loading")}
      </div>
    );
  }

  if (notFound || !group) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("facilityGroup.notFound")}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="self-start gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("facilityGroup.back")}
      </Button>

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={group.code}
          title={groupName}
          subtitle={t("facility.showingFor", { group: groupName })}
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
          newLabel={t("facility.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {facilitiesLoading ? (
          <div className="text-center py-16 text-muted-foreground">{t("facility.loading")}</div>
        ) : displayFacilities.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("facilityGroup.noFacilities")}
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

      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        facilityId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        fixedFacilityGroupId={groupId}
        onSaved={() => refreshFacilities()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facility.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("facility.deleteDesc")}</AlertDialogDescription>
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
