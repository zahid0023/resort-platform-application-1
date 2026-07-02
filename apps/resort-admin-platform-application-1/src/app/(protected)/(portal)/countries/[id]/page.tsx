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
import { CityCard } from "@/components/cities/city-card";
import { CityDialog, emptyCityForm } from "@/components/cities/city-dialog";
import type { CityDialogMode, CityFormState } from "@/components/cities/types";
import { countriesService, type Country } from "@/services/countries";
import { citiesService, type City, type ListCitiesParams } from "@/services/cities";
import { localesService, type Locale } from "@/services/locales";

const PAGE_SIZE = 20;

export default function CountryDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const countryId = Number(params.id);

  // Country
  const [country, setCountry] = useState<Country | null>(null);
  const [countryLoading, setCountryLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Cities list
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Search / sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CityFormState>(emptyCityForm);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  const dialogOpenRef = useRef(dialogOpen);
  const activeIdRef = useRef(activeId);
  useEffect(() => { dialogOpenRef.current = dialogOpen; }, [dialogOpen]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const isFirstRender = useRef(true);

  const searchFields = useMemo(() => [
    { value: "code", label: t("apiFields.code") },
  ], [t]);

  const sortFields = useMemo(() => [
    { value: "sortOrder", label: t("apiFields.sortOrder") },
    { value: "code", label: t("apiFields.code") },
    { value: "createdAt", label: t("apiFields.createdAt") },
  ], [t]);

  async function refreshCities(overrides: Partial<ListCitiesParams> = {}) {
    setCitiesLoading(true);
    try {
      const res = await citiesService.list(countryId, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        code: search.trim() || undefined,
        ...overrides,
      });
      setCities(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev;
        const updated = res.data.find((c) => c.id === activeIdRef.current);
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
      setCitiesLoading(false);
    }
  }

  // Load country
  useEffect(() => {
    if (!countryId) return;
    countriesService.get(countryId)
      .then((res) => setCountry(res.country))
      .catch((err) => {
        const msg = (err as Error).message ?? "";
        if (msg.toLowerCase().includes("not found")) setNotFound(true);
        else toast.error(msg);
      })
      .finally(() => setCountryLoading(false));
  }, [countryId]);

  // Initial cities load
  useEffect(() => {
    if (!countryId) return;
    refreshCities();
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
      () => refreshCities({ page: 0, code: search.trim() || undefined }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const cityNames = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.id, c.locales[0]?.name ?? ""])),
    [cities],
  );

  const countryName = country?.locales[0]?.name ?? country?.code ?? "";

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyCityForm);
    setDialogOpen(true);
  }

  function openDialog(city: City) {
    setMode("view");
    setActiveId(city.id);
    setForm({
      country_id: "",
      code: city.code ?? "",
      sort_order: city.sort_order,
      locales: city.locales.map((l) => ({
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
    refreshCities({ sort_by: value, page: 0 });
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir);
    setPage(0);
    refreshCities({ sort_dir: dir, page: 0 });
  }

  function handlePageChange(p: number) {
    setPage(p);
    refreshCities({ page: p });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await citiesService.remove(deleteTarget.id);
      toast.success(t("cities.deleted"));
      setDeleteTarget(null);
      await refreshCities({ page: 0 });
      setPage(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (countryLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("country.loading")}
      </div>
    );
  }

  if (notFound || !country) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("country.notFound")}
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
        {t("country.back")}
      </Button>

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={country.code}
          title={countryName}
          subtitle={t("cities.showingFor", { country: countryName })}
        />
        <PageActions
          fields={searchFields}
          searchField="code"
          onSearchFieldChange={() => {}}
          search={search}
          onSearchChange={setSearch}
          sort={{
            fields: sortFields,
            sortBy,
            onSortByChange: handleSortByChange,
            sortDir,
            onSortDirChange: handleSortDirChange,
          }}
          newLabel={t("cities.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {citiesLoading ? (
          <div className="text-center py-16 text-muted-foreground">{t("cities.loading")}</div>
        ) : cities.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("country.noCities")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                defaultName={cityNames[city.id]}
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

      <CityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        cityId={activeId}
        countryId={countryId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={() => refreshCities()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.city.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.city.desc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
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
