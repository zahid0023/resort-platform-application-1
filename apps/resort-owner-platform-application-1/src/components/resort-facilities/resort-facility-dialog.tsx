"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, Layers, Pencil, RefreshCw, Save, X } from "lucide-react"
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
	Button, Sheet, SheetContent,
	Tabs, TabsList, TabsTrigger, TabsContent,
} from "@resort/shadcn-ui"
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header"
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer"
import { resortFacilitiesService } from "@/services/resort-facilities"
import type { PlatformFacilitySummary } from "@/services/platform-facilities"
import type { Locale } from "@/services/locales"
import type { DayOfWeek } from "@/services/days-of-week"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, FacilityMode } from "./types"
import { emptyForm, emptyOperatingHoursDraft, toApiIconPayload, toApiTime } from "./types"
import { ResortFacilityGeneralInfo } from "./resort-facility-general-info"
import { ResortFacilityLocaleTranslations } from "./resort-facility-locale-translations"
import { ResortFacilityOperatingHours } from "./resort-facility-operating-hours"
import { IconSection } from "./resort-facility-icon-section"

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint,
// scoped per-resort so a draft started for one resort never bleeds into another's create dialog.
const DRAFT_SAVE_DEBOUNCE_MS = 500
function draftKey(resortId: number) {
	return `resort-facility-dialog-draft-${resortId}`
}

interface DraftState {
	form: ResortFacilityFormState
	/** The picked platform facility's own display details — persisted alongside `form.facility_id`
	 * so the "Select a platform facility" section can render the picked facility's name/icon/code again
	 * after a close/reopen/restore-draft round trip, rather than falling back to the empty picker prompt. */
	selectedPlatFacility: PlatformFacilitySummary | null
}

function hasDraftContent(f: ResortFacilityFormState): boolean {
	return !!f.facility_id || f.code.trim() !== "" || f.sort_order !== 0 || f.icon_type !== ""
		|| f.locale.name.trim() !== "" || f.locale.description.trim() !== ""
}

function readDraft(resortId: number): DraftState | null {
	try {
		const raw = localStorage.getItem(draftKey(resortId))
		if (!raw) return null
		const parsed = JSON.parse(raw) as DraftState
		return hasDraftContent(parsed.form) ? parsed : null
	} catch {
		return null
	}
}

function clearDraft(resortId: number) {
	localStorage.removeItem(draftKey(resortId))
}

export interface ResortFacilityDialogProps {
	resortId: number
	open: boolean
	onOpenChange: (open: boolean) => void
	mode: ResortFacilityDialogMode
	facilityId?: number
	form: ResortFacilityFormState
	onFormChange: (form: ResortFacilityFormState) => void
	availableLocales: Locale[]
	totalLocaleCount: number | null
	availableDaysOfWeek: DayOfWeek[]
	onSaved?: () => void | Promise<void>
	lockedGroupName?: string
	defaultFacilityMode?: FacilityMode
	platformFacilityGroupId?: number
	/** Called the first time the Locales tab is selected in a given dialog session — lets the owning
	 * page lazy-load the shared locale catalog only once it's actually needed, instead of prefetching
	 * it the moment this dialog opens. */
	onLocalesTabOpen?: () => void
	/** Same as `onLocalesTabOpen`, but for the Operating Hours tab's day-of-week catalog. */
	onOperatingHoursTabOpen?: () => void
	/** Create mode only — when set, seeds the "selected platform facility" display state the moment
	 * the dialog opens, so a facility already picked in an external list (e.g. the group-creation
	 * add-facilities step) shows as selected instead of the empty picker prompt. The caller is still
	 * responsible for pre-filling `form` itself (code/icon/locale/facility_id). */
	initialSelectedPlatFacility?: PlatformFacilitySummary | null
}

export function ResortFacilityDialog({
	resortId,
	open,
	onOpenChange,
	mode,
	facilityId,
	form,
	onFormChange,
	availableLocales,
	totalLocaleCount,
	availableDaysOfWeek,
	onSaved,
	lockedGroupName,
	defaultFacilityMode = "platform",
	platformFacilityGroupId,
	onLocalesTabOpen,
	onOperatingHoursTabOpen,
	initialSelectedPlatFacility,
}: ResortFacilityDialogProps) {
	const { t } = useTranslation()
	const [submitting, setSubmitting] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [generalEditing, setGeneralEditing] = useState(false)
	const [iconEditing, setIconEditing] = useState(false)
	const [iconSubmitting, setIconSubmitting] = useState(false)
	const [localIcon, setLocalIcon] = useState<Pick<ResortFacilityFormState, "icon_type" | "icon_value" | "icon_color">>({
		icon_type: "", icon_value: "", icon_color: "",
	})
	const [translationsEditing, setTranslationsEditing] = useState(false)
	const [operatingHoursEditing, setOperatingHoursEditing] = useState(false)
	const [confirmClose, setConfirmClose] = useState(false)
	const [facilityMode, setFacilityMode] = useState<FacilityMode>(defaultFacilityMode)
	const [createIconEditing, setCreateIconEditing] = useState(false)
	const [activeTab, setActiveTab] = useState<"general" | "icon" | "locales" | "operating-hours">("general")

	// View/edit mode only — the Locale Translations section loads/refetches its own data internally,
	// so a manual refresh signals it by incrementing this counter rather than calling a fetch function
	// owned by this dialog.
	const [localesRefreshSignal, setLocalesRefreshSignal] = useState(0)

	// Same idea, for the Operating Hours tab.
	const [operatingHoursRefreshSignal, setOperatingHoursRefreshSignal] = useState(0)

	// View/edit mode only — the Operating Hours tab reports how many days currently have an open
	// (unsaved) draft, and whether its own save request is in flight, so this dialog's sticky
	// header can show a Save button that stays reachable no matter how far the day list is
	// scrolled. Bumping operatingHoursSaveSignal is how the header button tells that tab to save.
	const [operatingHoursPendingDays, setOperatingHoursPendingDays] = useState(0)
	const [operatingHoursSaving, setOperatingHoursSaving] = useState(false)
	const [operatingHoursSaveSignal, setOperatingHoursSaveSignal] = useState(0)

	// Owned here (not inside the Locales tab content) so it survives that tab unmounting on switch.
	const [localeSearch, setLocaleSearch] = useState("")

	// Guards `onLocalesTabOpen` to fire at most once per dialog session, the first time the Locales
	// tab is actually selected — not the moment this dialog opens.
	const [localesCatalogRequested, setLocalesCatalogRequested] = useState(false)

	// Same idea, for `onOperatingHoursTabOpen`.
	const [operatingHoursCatalogRequested, setOperatingHoursCatalogRequested] = useState(false)

	// Create mode only — the picked platform facility's own display details, kept alongside `form` so
	// it can round-trip through the draft (see DraftState above).
	const [selectedPlatFacility, setSelectedPlatFacility] = useState<PlatformFacilitySummary | null>(null)

	const [draftPrompt, setDraftPrompt] = useState<DraftState | null>(null)
	const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
	const [draftSyncing, setDraftSyncing] = useState(false)

	// inputsDisabled: in create mode, no facility group selected yet
	const inputsDisabled = mode === "create" && !form.resort_facility_group_id

	useEffect(() => {
		if (!open) {
			setGeneralEditing(false)
			setIconEditing(false)
			setIconSubmitting(false)
			setTranslationsEditing(false)
			setOperatingHoursEditing(false)
			setConfirmClose(false)
			setFacilityMode(defaultFacilityMode)
			setCreateIconEditing(false)
			setActiveTab("general")
			setLocalesRefreshSignal(0)
			setOperatingHoursRefreshSignal(0)
			setOperatingHoursPendingDays(0)
			setOperatingHoursSaving(false)
			setOperatingHoursSaveSignal(0)
			setLocaleSearch("")
			setLocalesCatalogRequested(false)
			setOperatingHoursCatalogRequested(false)
			setSelectedPlatFacility(null)
			setDraftPrompt(null)
			setDraftSavedAt(null)
			setDraftSyncing(false)
		}
	}, [open, defaultFacilityMode])

	// Lazy-load the shared locale catalog only once the Locales tab is actually selected, not the
	// moment this dialog opens.
	useEffect(() => {
		if (!open || activeTab !== "locales" || localesCatalogRequested) return
		setLocalesCatalogRequested(true)
		onLocalesTabOpen?.()
	}, [open, activeTab, localesCatalogRequested]) // eslint-disable-line react-hooks/exhaustive-deps

	// Same idea, for the Operating Hours tab's day-of-week catalog.
	useEffect(() => {
		if (!open || activeTab !== "operating-hours" || operatingHoursCatalogRequested) return
		setOperatingHoursCatalogRequested(true)
		onOperatingHoursTabOpen?.()
	}, [open, activeTab, operatingHoursCatalogRequested]) // eslint-disable-line react-hooks/exhaustive-deps

	// On opening a fresh create form, offer to resume a locally-saved draft.
	useEffect(() => {
		if (open && mode === "create") setDraftPrompt(readDraft(resortId))
	}, [open, mode, resortId])

	// Seeds the "selected platform facility" display state from a facility the caller already
	// picked externally (e.g. the group-creation add-facilities step) — `form` itself is expected
	// to already be pre-filled by the caller before opening.
	useEffect(() => {
		if (open && mode === "create" && initialSelectedPlatFacility) {
			setSelectedPlatFacility(initialSelectedPlatFacility)
			setFacilityMode("platform")
		}
	}, [open, mode, initialSelectedPlatFacility])

	// Debounced local autosave of the create form — skipped while the restore prompt is pending.
	useEffect(() => {
		if (!open || mode !== "create" || draftPrompt) return
		if (hasDraftContent(form)) setDraftSyncing(true)
		const timer = setTimeout(() => {
			if (hasDraftContent(form)) {
				localStorage.setItem(draftKey(resortId), JSON.stringify({ form, selectedPlatFacility }))
				setDraftSavedAt(new Date())
			} else {
				clearDraft(resortId)
				setDraftSavedAt(null)
			}
			setDraftSyncing(false)
		}, DRAFT_SAVE_DEBOUNCE_MS)
		return () => clearTimeout(timer)
	}, [form, selectedPlatFacility, open, mode, draftPrompt, resortId])

	function restoreDraft() {
		if (draftPrompt) {
			onFormChange(draftPrompt.form)
			setSelectedPlatFacility(draftPrompt.selectedPlatFacility)
			setFacilityMode(draftPrompt.form.facility_id ? "platform" : "custom")
			setDraftSavedAt(new Date())
		}
		setDraftPrompt(null)
	}

	function discardDraft() {
		clearDraft(resortId)
		setDraftSavedAt(null)
		setDraftSyncing(false)
		setDraftPrompt(null)
	}

	const draftIndicator = mode === "create" && (draftSyncing || draftSavedAt) ? (
		<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
			{draftSyncing ? (
				<>
					<RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t("dialog.draftSyncing")}
				</>
			) : (
				<>
					<Save className="h-3.5 w-3.5" />
					{t("dialog.draftSaved", { time: draftSavedAt!.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }) })}
				</>
			)}
		</span>
	) : undefined

	const isDirty = mode === "create" ? hasDraftContent(form) : generalEditing || iconEditing || translationsEditing

	function requestClose() {
		if (mode === "create") { onOpenChange(false); return }
		if (isDirty) setConfirmClose(true)
		else onOpenChange(false)
	}

	function startIconEdit() {
		setLocalIcon({ icon_type: form.icon_type, icon_value: form.icon_value, icon_color: form.icon_color })
		setIconEditing(true)
	}

	async function saveIcon() {
		if (facilityId == null) return
		if (localIcon.icon_type && !localIcon.icon_value) {
			toast.error(t("resortFacility.errIconValue"))
			return
		}
		setIconSubmitting(true)
		try {
			await resortFacilitiesService.update(resortId, facilityId, {
				sort_order: form.sort_order,
				...toApiIconPayload(localIcon as ResortFacilityFormState),
			})
			toast.success(t("resortFacility.updated"))
			setIconEditing(false)
			onFormChange({ ...form, ...localIcon })
			await onSaved?.()
		} catch (err) {
			toast.error((err as Error).message)
		} finally {
			setIconSubmitting(false)
		}
	}

	// Silent checks — drive the tabs' disabled state without firing toasts on every render.
	function isGeneralValid(): boolean {
		if (mode !== "create") return true
		if (!form.resort_facility_group_id) return false
		return form.code.trim() !== ""
	}
	function isIconValid(): boolean {
		if (!form.icon_type) return true
		return !!form.icon_value
	}
	function isLocaleValid(): boolean {
		return form.locale.name.trim() !== ""
	}
	// The API requires operating_hours to cover every active day of week exactly once — a day is
	// "covered" once it's explicitly Closed/Open 24 Hours, or Custom with at least one fully
	// filled-in window (a day can have several, e.g. a pool open 6AM-1PM and again 4PM-11PM).
	function isOperatingHoursValid(): boolean {
		if (mode !== "create") return true
		if (availableDaysOfWeek.length === 0) return false
		return availableDaysOfWeek.every((day) => {
			const draft = form.operating_hours_draft[day.id] ?? emptyOperatingHoursDraft
			if (draft.is_closed || draft.is_twenty_four_hours) return true
			return draft.windows.length > 0 && draft.windows.every((w) => !!w.opens_at && !!w.closes_at)
		})
	}

	// Same checks, but report which field is missing — used by both the Next buttons and submit.
	function validateGeneral(): boolean {
		if (mode !== "create") return true
		if (!form.resort_facility_group_id) { toast.error(t("resortFacility.errGroupRequired")); return false }
		if (!form.code.trim()) { toast.error(t("resortFacility.errCode")); return false }
		return true
	}
	function validateIcon(): boolean {
		if (form.icon_type && !form.icon_value) { toast.error(t("resortFacility.errIconValue")); return false }
		return true
	}
	function validateLocale(): boolean {
		if (!form.locale.name.trim()) { toast.error(t("locale.errName", { n: 1 })); return false }
		return true
	}
	function validateOperatingHours(): boolean {
		if (!isOperatingHoursValid()) { toast.error(t("resortFacility.errOperatingHoursTimes")); return false }
		return true
	}

	function handleNextFromGeneral() {
		if (!validateGeneral()) return
		setActiveTab("icon")
	}

	function handleNextFromIcon() {
		if (!validateIcon()) return
		setActiveTab("locales")
	}

	function handleNextFromLocales() {
		if (!validateLocale()) return
		setActiveTab("operating-hours")
	}

	// Manual refresh only — switching tabs never re-fetches on its own otherwise. Pulls whichever the
	// active tab needs. The Locales tab's own data lives inside ResortFacilityLocaleTranslations, so
	// it's refreshed by bumping a signal counter instead of calling a fetch function this dialog owns.
	async function handleRefresh(): Promise<void> {
		if (facilityId == null) return
		setRefreshing(true)
		try {
			if (activeTab === "general" || activeTab === "icon") {
				const res = await resortFacilitiesService.get(resortId, facilityId)
				onFormChange({
					...form,
					sort_order: res.data.sort_order,
					icon_type: (res.data.icon_type ?? "") as ResortFacilityFormState["icon_type"],
					icon_value: res.data.icon_value ?? "",
					icon_color: String(res.data.icon_meta?.color ?? ""),
				})
			}
			if (activeTab === "locales") {
				setLocalesRefreshSignal((n) => n + 1)
			}
			if (activeTab === "operating-hours") {
				setOperatingHoursRefreshSignal((n) => n + 1)
			}
			toast.success(t("common.refreshed"))
		} catch (err) {
			toast.error((err as Error).message)
		} finally {
			setRefreshing(false)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (mode !== "create") return
		if (!validateGeneral()) { setActiveTab("general"); return }
		if (!validateIcon()) { setActiveTab("icon"); return }
		if (!validateLocale()) { setActiveTab("locales"); return }
		if (!validateOperatingHours()) { setActiveTab("operating-hours"); return }
		setSubmitting(true)
		try {
			await resortFacilitiesService.create(resortId, {
				resort_facility_group_id: Number(form.resort_facility_group_id),
				facility_id: form.facility_id ? Number(form.facility_id) : undefined,
				code: form.code.trim(),
				sort_order: Number(form.sort_order) || 0,
				is_highlighted: form.is_highlighted,
				...toApiIconPayload(form),
				locale: {
					name: form.locale.name.trim(),
					description: form.locale.description.trim(),
					notes: form.locale.notes.trim(),
					sort_order: Number(form.locale.sort_order) || 0,
				},
				operating_hours: availableDaysOfWeek.map((day) => {
					const draft = form.operating_hours_draft[day.id] ?? emptyOperatingHoursDraft
					const isCustom = !draft.is_closed && !draft.is_twenty_four_hours
					return {
						day_of_week_id: day.id,
						is_closed: draft.is_closed,
						is_twenty_four_hours: draft.is_twenty_four_hours,
						windows: isCustom
							? draft.windows
								.filter((w) => w.opens_at && w.closes_at)
								.map((w) => ({ opens_at: toApiTime(w.opens_at)!, closes_at: toApiTime(w.closes_at)! }))
							: [],
					}
				}),
			})
			clearDraft(resortId)
			toast.success(t("resortFacility.created"))
			onOpenChange(false)
			await onSaved?.()
		} catch (err) {
			toast.error((err as Error).message)
		} finally {
			setSubmitting(false)
		}
	}

	const isEditing = generalEditing || iconEditing || translationsEditing || operatingHoursEditing
	const headerTitle = mode === "create"
		? t("resortFacility.dialogCreate")
		: (isEditing ? t("resortFacility.dialogEdit") : t("resortFacility.dialogView"))
	const headerDesc = mode === "create"
		? t("resortFacility.dialogDescCreate")
		: (isEditing ? t("resortFacility.dialogDescEdit") : t("resortFacility.dialogDescView"))

	// The Operating Hours tab's own Save action, surfaced in the sticky header instead of inline
	// in that tab's scrollable content — after "Apply to all days" pre-fills every day for review,
	// the day list can run well past one screen, so the action that actually commits everything
	// needs to stay reachable without scrolling back down to find it.
	const headerActions = mode !== "create" && activeTab === "operating-hours" && operatingHoursPendingDays > 0 ? (
		<Button
			type="button"
			size="sm"
			className="gap-1.5"
			onClick={() => setOperatingHoursSaveSignal((n) => n + 1)}
			disabled={operatingHoursSaving}
		>
			<Check className="h-3.5 w-3.5" />
			{operatingHoursSaving
				? t("common.saving")
				: t("resortFacility.saveOperatingHoursBtn", { count: operatingHoursPendingDays })}
		</Button>
	) : undefined

	return (
		<>
			<Sheet open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-full"
					onInteractOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
				>
					<form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

						<DialogEntityHeader icon={<Layers className="h-4 w-4" />} title={headerTitle} description={headerDesc} actions={headerActions} />

						<Tabs
							value={activeTab}
							onValueChange={(v) => setActiveTab(v as "general" | "icon" | "locales" | "operating-hours")}
							className="flex-1 min-h-0 flex-col"
						>
							<div className="flex items-center justify-between mx-6 mt-4 gap-2">
								<TabsList className="w-fit shrink-0">
									<TabsTrigger value="general" className="cursor-pointer disabled:cursor-not-allowed">
										{t("common.generalInfo")}
									</TabsTrigger>
									<TabsTrigger value="icon" disabled={mode === "create" && !isGeneralValid()} className="cursor-pointer disabled:cursor-not-allowed">
										{t("resortFacility.iconSection")}
									</TabsTrigger>
									<TabsTrigger value="locales" disabled={mode === "create" && !(isGeneralValid() && isIconValid())} className="cursor-pointer disabled:cursor-not-allowed">
										{t("locale.translations")}
									</TabsTrigger>
									{/* create only: the API requires the full weekly schedule up front, so this tab is the
									    last wizard step, gated the same way as the others — on partial validity. */}
									<TabsTrigger value="operating-hours" disabled={mode === "create" && !(isGeneralValid() && isIconValid() && isLocaleValid())} className="cursor-pointer disabled:cursor-not-allowed">
										{t("resortFacility.operatingHoursSection")}
									</TabsTrigger>
								</TabsList>
								{mode !== "create" && (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="h-7 w-7 shrink-0"
										onClick={handleRefresh}
										disabled={refreshing || generalEditing || iconEditing || translationsEditing || operatingHoursEditing}
										title={t("common.refresh")}
									>
										<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
									</Button>
								)}
							</div>

							<TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
								<ResortFacilityGeneralInfo
									resortId={resortId}
									mode={mode}
									form={form}
									onFormChange={(patch) => onFormChange({ ...form, ...patch })}
									facilityId={facilityId}
									onSaved={onSaved}
									editing={generalEditing}
									onEditingChange={setGeneralEditing}
									open={open}
									facilityMode={facilityMode}
									onFacilityModeChange={setFacilityMode}
									lockedGroupName={lockedGroupName}
									platformFacilityGroupId={platformFacilityGroupId}
									selectedPlatFacility={selectedPlatFacility}
									onSelectedPlatFacilityChange={setSelectedPlatFacility}
								/>
							</TabsContent>

							<TabsContent value="icon" className="min-h-0 overflow-y-auto px-6 py-5">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-1 w-1 rounded-full bg-primary" />
											<h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
												{t("resortFacility.iconSection")}
											</h3>
										</div>
										{mode !== "create" && !iconEditing && (
											<Button type="button" size="sm" variant="outline" onClick={startIconEdit} className="h-7 text-xs px-2.5 gap-1.5">
												<Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
											</Button>
										)}
										{iconEditing && (
											<div className="flex items-center gap-1.5">
												<Button type="button" size="sm" variant="outline" onClick={() => setIconEditing(false)} disabled={iconSubmitting} className="h-7 text-xs px-2.5 gap-1.5">
													<X className="h-3.5 w-3.5" /> {t("common.cancel")}
												</Button>
												<Button type="button" size="sm" onClick={saveIcon} disabled={iconSubmitting} className="h-7 text-xs px-2.5 gap-1.5">
													<Check className="h-3.5 w-3.5" />
													{iconSubmitting ? t("common.saving") : t("common.save")}
												</Button>
											</div>
										)}
									</div>
									<IconSection
										form={iconEditing ? { ...form, ...localIcon } : form}
										onFormChange={(patch) => {
											if (mode === "create") onFormChange({ ...form, ...patch })
											else setLocalIcon((prev) => ({ ...prev, ...patch }))
										}}
										readOnly={!iconEditing && mode !== "create"}
										showAutoFillHint={mode === "create" && !!form.resort_facility_group_id && !!form.facility_id}
										disabled={inputsDisabled}
										editingHint={createIconEditing}
										onEditingHintChange={setCreateIconEditing}
									/>
								</div>
							</TabsContent>

							<TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
								<ResortFacilityLocaleTranslations
									resortId={resortId}
									mode={mode}
									form={form}
									onFormChange={onFormChange}
									facilityId={facilityId}
									availableLocales={availableLocales}
									totalLocaleCount={totalLocaleCount}
									onSaved={onSaved}
									editing={translationsEditing}
									onEditingChange={setTranslationsEditing}
									open={open}
									disabled={inputsDisabled}
									search={localeSearch}
									onSearchChange={setLocaleSearch}
									refreshSignal={localesRefreshSignal}
								/>
							</TabsContent>

							<TabsContent value="operating-hours" className="min-h-0 overflow-y-auto px-6 py-5">
								<ResortFacilityOperatingHours
									resortId={resortId}
									mode={mode}
									form={form}
									onFormChange={onFormChange}
									facilityId={facilityId}
									availableDaysOfWeek={availableDaysOfWeek}
									onSaved={onSaved}
									onEditingChange={setOperatingHoursEditing}
									open={open}
									refreshSignal={operatingHoursRefreshSignal}
									onPendingDaysChange={setOperatingHoursPendingDays}
									onSavingChange={setOperatingHoursSaving}
									saveSignal={operatingHoursSaveSignal}
								/>
							</TabsContent>
						</Tabs>

						{mode === "create" && activeTab === "general" && (
							<div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
								{draftIndicator}
								<div className="flex items-center gap-2">
									<Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
										<X className="h-3.5 w-3.5" /> {t("common.cancel")}
									</Button>
									<Button type="button" size="sm" onClick={handleNextFromGeneral} disabled={!isGeneralValid()} className="gap-1.5">
										{t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						)}

						{mode === "create" && activeTab === "icon" && (
							<div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
								{draftIndicator}
								<div className="flex items-center gap-2">
									<Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
										<X className="h-3.5 w-3.5" /> {t("common.cancel")}
									</Button>
									<Button type="button" size="sm" onClick={handleNextFromIcon} disabled={!isIconValid()} className="gap-1.5">
										{t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						)}

						{mode === "create" && activeTab === "locales" && (
							<div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
								{draftIndicator}
								<div className="flex items-center gap-2">
									<Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
										<X className="h-3.5 w-3.5" /> {t("common.cancel")}
									</Button>
									<Button type="button" size="sm" onClick={handleNextFromLocales} disabled={!isLocaleValid()} className="gap-1.5">
										{t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						)}

						{mode === "create" && activeTab === "operating-hours" && (
							<DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isOperatingHoursValid()} indicator={draftIndicator} />
						)}

					</form>
				</SheetContent>
			</Sheet>

			<AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => onOpenChange(false)}>{t("dialog.discardChanges.confirm")}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={!!draftPrompt} onOpenChange={(v) => { if (!v) discardDraft() }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("dialog.restoreDraft.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("dialog.restoreDraft.descResortFacility")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={discardDraft}>{t("dialog.restoreDraft.discard")}</AlertDialogCancel>
						<AlertDialogAction onClick={restoreDraft}>{t("dialog.restoreDraft.restore")}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export { emptyForm as emptyResortFacilityForm }
