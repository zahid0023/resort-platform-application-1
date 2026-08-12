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
import { CountryCard } from "@/components/countries/country-card";
import { CountryDialog, emptyCountryForm } from "@/components/countries/country-dialog";
import type { CountryDialogMode, CountryFormState } from "@/components/countries/types";
import { countriesService, type Country, type ListParams } from "@/services/countries";

const PAGE_SIZE = 20;

// "all" is a frontend-only concept (client-side OR across all fields)
const ALL_FIELD = "all";

function buildApiFilters(field: string, q: string): Pick<ListParams, "iso3Code" | "phoneCode" | "name"> {
	if (!q || field === ALL_FIELD) return {};
	return { [field]: q } as Pick<ListParams, "iso3Code" | "phoneCode" | "name">;
}

export default function CountriesPage() {
	const { t } = useTranslation();
	const router = useRouter();

	// List data
	const [countries, setCountries] = useState<Country[]>([]);
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
	const [mode, setMode] = useState<CountryDialogMode>("create");
	const [activeId, setActiveId] = useState<number | undefined>(undefined);
	const [form, setForm] = useState<CountryFormState>(emptyCountryForm);
	const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);


	function toFieldOption(key: string) {
		return { value: key, label: t(`apiFields.${key}`) };
	}

	// "code" is accepted by the backend but not wired into search predicates — omit it as a scoped filter.
	const searchFields = useMemo(() => [
		{ value: ALL_FIELD, label: t("common.allFields") },
		...["iso3Code", "phoneCode", "name"].map(toFieldOption),
	], [t]); // eslint-disable-line react-hooks/exhaustive-deps

	// "id" is deliberately excluded — passing sortBy=id throws 400 (it's implicit-default only).
	const sortFields = useMemo(() => [
		...["code", "iso3Code", "phoneCode", "name", "createdAt"].map(toFieldOption),
	], [t]); // eslint-disable-line react-hooks/exhaustive-deps

	async function refresh(overrides: Partial<ListParams> = {}) {
		setLoading(true);
		try {
			const res = await countriesService.list({
				page,
				size: PAGE_SIZE,
				sort_by: sortBy,
				sort_dir: sortDir,
				...buildApiFilters(searchField, search.trim()),
				...overrides,
			});

			setCountries(res.data);
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
	// than a one-shot "have I run" flag: a ref flip like `isFirstRender.current = false` doesn't
	// survive React Strict Mode's dev-only effect replay (mount → cleanup → mount again on the same
	// ref), so a boolean guard fires a spurious extra fetch on the replay. Comparing actual values
	// is replay-safe since the key is identical — and still unchanged — across both passes.
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

	const countryNames = useMemo(
		() => Object.fromEntries(countries.map((c) => [c.id, c.locale?.name ?? ""])),
		[countries],
	);

	// Client-side OR filter only for "all" field (API has no OR-across-fields support)
	const displayCountries = useMemo(() => {
		if (searchField !== ALL_FIELD || !search.trim()) return countries;
		const q = search.trim().toLowerCase();
		return countries.filter((c) => {
			const code = c.code.toLowerCase();
			const iso3 = (c.iso3_code ?? "").toLowerCase();
			const phone = (c.phone_code ?? "").toLowerCase();
			const name = (countryNames[c.id] ?? "").toLowerCase();
			return code.includes(q) || iso3.includes(q) || phone.includes(q) || name.includes(q);
		});
	}, [countries, countryNames, search, searchField]);

	function openCreate() {
		setMode("create");
		setActiveId(undefined);
		setForm(emptyCountryForm);
		setDialogOpen(true);
	}

	async function openDialog(c: Country) {
		try {
			const res = await countriesService.get(c.id);
			const full = res.data;
			setMode("view");
			setActiveId(full.id);
			setForm({
				code: full.code,
				iso3_code: full.iso3_code ?? "",
				phone_code: full.phone_code ?? "",
				flag_url: full.flag_url ?? "",
				sort_order: full.sort_order,
				locale: emptyCountryForm.locale,
				// Lazily populated by CountryDialog the first time the Translations tab is selected.
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
			await countriesService.remove(deleteTarget.id);
			toast.success(`${t("delete.country.title")}: ${deleteTarget.code}`);
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
					title={t("countries.title")}
					subtitle={t("countries.subtitle")}
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
					newLabel={t("countries.new")}
					onNew={openCreate}
				/>
			</header>

			{/* Main content */}
			<main className="flex flex-col gap-4">
				{loading ? (
					<div className="text-center py-16 text-muted-foreground">{t("countries.loading")}</div>
				) : displayCountries.length === 0 ? (
					<div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
						{t("countries.empty")}
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{displayCountries.map((c) => (
							<CountryCard
								key={c.id}
								country={c}
								defaultName={countryNames[c.id]}
								onNavigate={(c) => router.push(`/countries/${c.id}`)}
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

			<CountryDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				mode={mode}
				countryId={activeId}
				form={form}
				onFormChange={setForm}
				onSaved={() => refresh()}
			/>

			<AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete.country.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("delete.country.desc", { code: deleteTarget?.code })}
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
