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
import { CurrencyCard } from "@/components/currencies/currency-card";
import { CurrencyDialog, emptyCurrencyForm } from "@/components/currencies/currency-dialog";
import type { CurrencyDialogMode, CurrencyFormState } from "@/components/currencies/types";
import { currenciesService, type Currency, type ListParams } from "@/services/currencies";

const PAGE_SIZE = 20;

// "all" is a frontend-only concept (client-side OR across all fields)
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "code" | "numericCode" | "name" | "shortName"> {
  if (!q || field === ALL_FIELD) return {};
  return { [field]: q } as Pick<ListParams, "code" | "numericCode" | "name" | "shortName">;
}

export default function CurrenciesPage() {
  const { t } = useTranslation();

  // List data
  const [currencies, setCurrencies] = useState<Currency[]>([]);
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
  // Unlike Countries/Cities, there is no sortOrder option here.
  const [sortBy, setSortBy] = useState<NonNullable<ListParams["sort_by"]>>("code");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CurrencyDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [countryLabel, setCountryLabel] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<CurrencyFormState>(emptyCurrencyForm);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) };
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
    ...["code", "numericCode", "name", "shortName"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["code", "numericCode", "name", "shortName", "createdAt"].map(toFieldOption),
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true);
    try {
      const res = await currenciesService.list({
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...buildApiFilters(searchField, search.trim()),
        ...overrides,
      });

      setCurrencies(res.data);
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

  const currencyNames = useMemo(
    () => Object.fromEntries(currencies.map((c) => [c.id, c.locale?.name ?? ""])),
    [currencies],
  );

  // Client-side OR filter only for "all" field (API has no OR-across-fields support)
  const displayCurrencies = useMemo(() => {
    if (searchField !== ALL_FIELD || !search.trim()) return currencies;
    const q = search.trim().toLowerCase();
    return currencies.filter((c) => {
      const code = c.code.toLowerCase();
      const numericCode = c.numeric_code.toLowerCase();
      const name = (currencyNames[c.id] ?? "").toLowerCase();
      return code.includes(q) || numericCode.includes(q) || name.includes(q);
    });
  }, [currencies, currencyNames, search, searchField]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setCountryLabel(undefined);
    setForm(emptyCurrencyForm);
    setDialogOpen(true);
  }

  async function openDialog(c: Currency) {
    try {
      const res = await currenciesService.get(c.id);
      const full = res.data;
      setMode("view");
      setActiveId(full.id);
      setCountryLabel(`${full.country.locale?.name ?? full.country.code} (${full.country.code})`);
      setForm({
        country_id: full.country.id,
        code: full.code,
        numeric_code: full.numeric_code,
        symbol: full.symbol,
        decimal_places: full.decimal_places,
        is_default: full.is_default,
        sort_order: full.sort_order,
        locale: emptyCurrencyForm.locale,
        // Populated by CurrencyLocaleTranslations itself via GET /currencies/{id}/locales.
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
      await currenciesService.remove(deleteTarget.id);
      toast.success(`${t("delete.currency.title")}: ${deleteTarget.code}`);
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
          title={t("currencies.title")}
          subtitle={t("currencies.subtitle")}
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
          newLabel={t("currencies.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("currencies.loading")}</div>
        ) : displayCurrencies.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("currencies.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCurrencies.map((currency) => (
              <CurrencyCard
                key={currency.id}
                currency={currency}
                defaultName={currencyNames[currency.id]}
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

      <CurrencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        currencyId={activeId}
        countryLabel={countryLabel}
        form={form}
        onFormChange={setForm}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.currency.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.currency.desc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
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
