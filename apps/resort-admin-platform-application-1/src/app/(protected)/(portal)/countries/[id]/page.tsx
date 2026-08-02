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
import { citiesService, type City, type ListParams } from "@/services/cities";

const PAGE_SIZE = 20;

function toFieldOption(t: (key: string) => string, key: string) {
  return { value: key, label: t(`apiFields.${key}`) };
}

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
  const [searchField, setSearchField] = useState<"code" | "name">("code");
  const [sortBy, setSortBy] = useState<NonNullable<ListParams["sort_by"]>>("sortOrder");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CityDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<CityFormState>(emptyCityForm);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  const searchFields = useMemo(() => [
    toFieldOption(t, "code"),
    toFieldOption(t, "name"),
  ], [t]);

  const sortFields = useMemo(() => [
    toFieldOption(t, "sortOrder"),
    toFieldOption(t, "code"),
    toFieldOption(t, "name"),
    toFieldOption(t, "createdAt"),
  ], [t]);

  async function refreshCities(overrides: Partial<ListParams> = {}) {
    if (!countryId) return;
    setCitiesLoading(true);
    try {
      const res = await citiesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        countryId,
        [searchField]: search.trim() || undefined,
        ...overrides,
      });
      setCities(res.data);
      setTotalPages(res.total_pages);
      setTotalElements(res.total_elements);
      setHasNext(res.has_next);
      setHasPrevious(res.has_previous);
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
      .then((res) => setCountry(res.data))
      .catch((err) => {
        const msg = (err as Error).message ?? "";
        if (msg.toLowerCase().includes("not found")) setNotFound(true);
        else toast.error(msg);
      })
      .finally(() => setCountryLoading(false));
  }, [countryId]);

  // Initial cities load
  useEffect(() => { refreshCities(); }, [countryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const lastSearchKey = useRef(`${searchField}:${search}`);
  useEffect(() => {
    const key = `${searchField}:${search}`;
    if (lastSearchKey.current === key) return;
    lastSearchKey.current = key;
    setPage(0);
    const timer = setTimeout(
      () => refreshCities({ page: 0, [searchField]: search.trim() || undefined }),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  const cityNames = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.id, c.locale?.name ?? ""])),
    [cities],
  );

  const countryName = country?.locale?.name ?? country?.code ?? "";
  const countryLabel = country ? `${countryName} (${country.code})` : undefined;

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyCityForm);
    setDialogOpen(true);
  }

  async function openDialog(c: City) {
    try {
      const res = await citiesService.get(c.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      setForm({
        country_id: full.country.id,
        code: full.code,
        sort_order: full.sort_order,
        locale: emptyCityForm.locale,
        // Populated by CityLocaleTranslations itself via GET /cities/{id}/locales.
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
    refreshCities({ sort_by: field, page: 0 });
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
          searchField={searchField}
          onSearchFieldChange={(v) => setSearchField(v as "code" | "name")}
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
        fixedCountryId={countryId}
        countryLabel={countryLabel}
        form={form}
        onFormChange={setForm}
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
