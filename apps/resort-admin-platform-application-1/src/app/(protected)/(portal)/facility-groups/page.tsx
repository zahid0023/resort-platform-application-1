"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Search, X, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FacilityGroupCard } from "@/components/facility-groups/facility-group-card";
import {
  FacilityGroupDialog,
  type FacilityGroupDialogMode,
  type FacilityGroupFormState,
  emptyFacilityGroupForm,
} from "@/components/facility-groups/facility-group-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listFacilityGroups,
  getFacilityGroup,
  deleteFacilityGroup,
  type FacilityGroupSummary,
  type FacilityGroupListResponse,
} from "@/services/facility-groups";
import { localesService, type Locale } from "@/services/locales";

type SearchField = "all" | "code" | "name" | "icon";

export default function FacilityGroupsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<FacilityGroupListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<FacilityGroupDialogMode>("create");
  const [facilityGroupId, setFacilityGroupId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<FacilityGroupFormState>(emptyFacilityGroupForm);

  const [deleteTarget, setDeleteTarget] = useState<FacilityGroupSummary | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listFacilityGroups({ page, size: 50, sort_by: "sort_order", sort_dir: "ASC" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.errLoad"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    localesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const items = data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const code = item.code.toLowerCase();
      const name = (item.locales[0]?.name ?? "").toLowerCase();
      const icon = (item.icon_value ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        case "icon": return icon.includes(q);
        default: return code.includes(q) || name.includes(q) || icon.includes(q);
      }
    });
  }, [data, search, searchField]);

  function openCreate() {
    setDialogMode("create");
    setFacilityGroupId(undefined);
    setForm(emptyFacilityGroupForm);
    setDialogOpen(true);
  }

  async function openView(item: FacilityGroupSummary) {
    try {
      const res = await getFacilityGroup(item.id);
      const g = res.data;
      const meta = g.icon_meta ?? {};
      const color = typeof meta.color === "string" ? meta.color : "";
      const sizeRaw = meta.size;
      const size = typeof sizeRaw === "number" ? String(sizeRaw) : typeof sizeRaw === "string" ? sizeRaw : "";
      setForm({
        code: g.code,
        sort_order: g.sort_order,
        icon_type: g.icon_type,
        icon_value: g.icon_value,
        icon_color: color,
        icon_size: size,
        locales: g.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      });
      setFacilityGroupId(g.id);
      setDialogMode("view");
      setDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.errLoad"));
    }
  }

  async function handleSaved() {
    await fetchList();
    if (facilityGroupId != null) {
      try {
        const res = await getFacilityGroup(facilityGroupId);
        const g = res.data;
        const meta = g.icon_meta ?? {};
        const color = typeof meta.color === "string" ? meta.color : "";
        const sizeRaw = meta.size;
        const size = typeof sizeRaw === "number" ? String(sizeRaw) : typeof sizeRaw === "string" ? sizeRaw : "";
        setForm((prev) => ({
          ...prev,
          sort_order: g.sort_order,
          icon_type: g.icon_type,
          icon_value: g.icon_value,
          icon_color: color,
          icon_size: size,
          locales: g.locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        }));
      } catch {
        // best effort
      }
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFacilityGroup(deleteTarget.id);
      toast.success(t("facilityGroup.deleted"));
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.errDelete"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("facilityGroup.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("facilityGroup.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-36 h-10 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allFields")}</SelectItem>
                <SelectItem value="code">{t("common.code")}</SelectItem>
                <SelectItem value="name">{t("common.localizedName")}</SelectItem>
                <SelectItem value="icon">{t("iconFields.iconValue")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")}…`}
                className="pl-9 pr-9 w-56 h-10 rounded-l-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("facilityGroup.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground border rounded-xl border-dashed">
          {search ? t("facilityGroup.empty") : t("facilityGroup.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => (
            <FacilityGroupCard
              key={item.id}
              item={item}
              index={i}
              onView={openView}
              onDelete={(it) => setDeleteTarget(it)}
            />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && !search && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("pagination.info", { current: data.current_page + 1, total: data.total_pages, elements: data.total_elements })}</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <FacilityGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        facilityGroupId={facilityGroupId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facilityGroup.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("facilityGroup.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
