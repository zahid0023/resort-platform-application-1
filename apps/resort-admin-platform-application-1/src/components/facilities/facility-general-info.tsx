import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Loader2, Pencil, X } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import { Card, CardContent } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Popover, PopoverContent, PopoverTrigger } from "@resort/shadcn-ui"
import { updateFacility } from "@/services/facilities"
import { listFacilityGroups, getFacilityGroup, type FacilityGroupSummary } from "@/services/facility-groups"
import { toast } from "sonner"
import type { FacilityDialogMode, FacilityFormState } from "./types"
import { fromIconValue } from "./types"

const GROUP_PAGE_SIZE = 20

export interface FacilityGeneralInfoProps {
  mode: FacilityDialogMode
  form: FacilityFormState
  onFormChange: (patch: Partial<FacilityFormState>) => void
  facilityId?: number
  /** When set, facility group selector is hidden and this value is used for create */
  fixedFacilityGroupId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function FacilityGeneralInfo({
  mode,
  form,
  onFormChange,
  facilityId,
  fixedFacilityGroupId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: FacilityGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number }>({ sort_order: 0 })
  const [submitting, setSubmitting] = useState(false)

  // Facility group selector state
  const [groups, setGroups] = useState<FacilityGroupSummary[]>([])
  const [groupPage, setGroupPage] = useState(0)
  const [hasNextGroup, setHasNextGroup] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupSearch, setGroupSearch] = useState("")
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false)

  const showGroupSelector = mode === "create" && fixedFacilityGroupId == null

  // View mode: display group name
  const [viewGroupName, setViewGroupName] = useState("")

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setGroups([])
      setGroupPage(0)
      setHasNextGroup(false)
      setGroupSearch("")
      setGroupPopoverOpen(false)
      setViewGroupName("")
    }
  }, [open])

  // Load first page when dialog opens in create mode without fixed group
  useEffect(() => {
    if (open && showGroupSelector) {
      loadGroupPage(0, true)
    }
  }, [open, showGroupSelector]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load group name for view mode
  useEffect(() => {
    if (open && mode !== "create" && form.facility_group_id) {
      getFacilityGroup(Number(form.facility_group_id))
        .then((res) => setViewGroupName(res.data.locales[0]?.name || res.data.code))
        .catch(() => setViewGroupName(String(form.facility_group_id)))
    }
  }, [open, mode, form.facility_group_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadGroupPage(page: number, reset = false) {
    setLoadingGroups(true)
    try {
      const res = await listFacilityGroups({ page, size: GROUP_PAGE_SIZE, sort_by: "sortOrder" })
      setGroups((prev) => (reset ? res.data : [...prev, ...res.data]))
      setGroupPage(page)
      setHasNextGroup(res.has_next)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoadingGroups(false)
    }
  }

  function loadMoreGroups() {
    loadGroupPage(groupPage + 1)
  }

  const filteredGroups = groupSearch.trim()
    ? groups.filter((g) => {
        const q = groupSearch.toLowerCase()
        return (
          g.code.toLowerCase().includes(q) ||
          (g.locales[0]?.name ?? "").toLowerCase().includes(q)
        )
      })
    : groups

  const selectedGroup = groups.find((g) => g.id === form.facility_group_id)
  const selectedGroupLabel = selectedGroup
    ? `${selectedGroup.locales[0]?.name ?? selectedGroup.code} (${selectedGroup.code})`
    : t("placeholder.selectFacilityGroup")

  function startEdit() {
    setLocal({ sort_order: form.sort_order })
    onEditingChange(true)
  }

  async function save() {
    if (facilityId == null) return
    setSubmitting(true)
    try {
      await updateFacility(facilityId, {
        sort_order: Number(local.sort_order) || 0,
        ...fromIconValue(form.icon),
      })
      toast.success(t("facility.updated"))
      onEditingChange(false)
      onFormChange({ sort_order: Number(local.sort_order) || 0 })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"
  const sortValue = editing ? local.sort_order : form.sort_order

  function handleSortChange(n: number) {
    if (mode === "create") onFormChange({ sort_order: n })
    else setLocal((p) => ({ ...p, sort_order: n }))
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">

          {/* Facility group — paginated selector in create mode, read-only in view mode */}
          {showGroupSelector && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("field.facilityGroup")} *</Label>
              <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className={form.facility_group_id ? "" : "text-muted-foreground"}>
                      {selectedGroupLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  {/* Search */}
                  <div className="p-2 border-b">
                    <Input
                      placeholder={t("placeholder.searchFacilityGroup")}
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Group list */}
                  <div className="max-h-52 overflow-y-auto">
                    {loadingGroups && groups.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("facilityGroup.empty")}
                      </p>
                    ) : (
                      filteredGroups.map((g) => {
                        const label = g.locales[0]?.name ?? g.code
                        const isSelected = form.facility_group_id === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                            onClick={() => {
                              onFormChange({ facility_group_id: g.id })
                              setGroupPopoverOpen(false)
                              setGroupSearch("")
                            }}
                          >
                            {isSelected
                              ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                              : <span className="w-3.5 shrink-0" />
                            }
                            {label} ({g.code})
                          </button>
                        )
                      })
                    )}

                    {/* Load more */}
                    {hasNextGroup && !groupSearch.trim() && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent flex items-center justify-center gap-1.5 border-t"
                        onClick={loadMoreGroups}
                        disabled={loadingGroups}
                      >
                        {loadingGroups && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t("common.loadMore")}
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Group name display in view mode */}
          {!showGroupSelector && mode !== "create" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("field.facilityGroup")}</Label>
              <Input
                value={viewGroupName || String(form.facility_group_id)}
                disabled
                className="font-medium"
                onChange={() => {}}
              />
            </div>
          )}

          {/* Code — immutable after creation */}
          <div className="space-y-2">
            <Label htmlFor="f-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="f-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="POOL_OUTDOOR"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="f-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="f-sort"
              type="number"
              value={sortValue}
              onChange={(e) => handleSortChange(Number(e.target.value))}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
