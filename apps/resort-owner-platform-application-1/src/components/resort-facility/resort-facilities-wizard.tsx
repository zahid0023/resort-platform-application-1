"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckIcon, ChevronRightIcon, ChevronLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { bulkCreateResortFacilities, type CreateResortFacilityRequest } from "@/services/resort-facilities"
import { listFacilities, type FacilitySummary } from "@/services/facilities"
import type { ResortFacilityGroupSummary } from "@/services/resort-facility-groups"

interface SelectedFacility extends CreateResortFacilityRequest {
  facility_id: number
  name: string
  description: string
  icon: string
  value: string
}

interface Props {
  resortId: string
  resortFacilityGroups: ResortFacilityGroupSummary[]
  /** facility_id[]s already added per resort facility group id */
  assignedFacilityIdsByGroup: Record<number, number[]>
  preselectedGroupId?: number
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}

async function fetchAllPlatformFacilities(): Promise<FacilitySummary[]> {
  const results: FacilitySummary[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const res = await listFacilities({ page, size: 50 })
    results.push(...res.data)
    hasNext = res.has_next
    page++
  }
  return results
}

export function ResortFacilitiesWizard({
  resortId,
  resortFacilityGroups,
  assignedFacilityIdsByGroup,
  preselectedGroupId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">(preselectedGroupId ?? "")
  const [allFacilities, setAllFacilities] = useState<FacilitySummary[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [selected, setSelected] = useState<Map<number, SelectedFacility>>(new Map())
  const [submitting, setSubmitting] = useState(false)

  // Reset state on open
  useEffect(() => {
    if (!open) return
    const initialGroup = preselectedGroupId ?? ""
    setSelectedGroupId(initialGroup)
    setSelected(new Map())
    setStep(preselectedGroupId ? 2 : 1)
  }, [open, preselectedGroupId])

  // Load platform facilities when reaching step 2
  useEffect(() => {
    if (step !== 2 || allFacilities.length > 0) return
    setFacilitiesLoading(true)
    fetchAllPlatformFacilities()
      .then(setAllFacilities)
      .catch(() => toast.error("Failed to load platform facilities."))
      .finally(() => setFacilitiesLoading(false))
  }, [step, allFacilities.length])

  const selectedGroup = resortFacilityGroups.find((g) => g.id === selectedGroupId)
  const groupFacilities = selectedGroup
    ? allFacilities.filter((f) => f.facility_group_id === selectedGroup.facility_group_id)
    : []
  const assignedIds: number[] = selectedGroupId ? (assignedFacilityIdsByGroup[selectedGroupId as number] ?? []) : []

  const toggleFacility = (f: FacilitySummary) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(f.id)) {
        next.delete(f.id)
      } else {
        next.set(f.id, {
          facility_id: f.id,
          name: f.name,
          description: f.description ?? "",
          icon: f.icon ?? "",
          value: "",
        })
      }
      return next
    })
  }

  const updateField = (facilityId: number, field: keyof SelectedFacility, value: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      const entry = next.get(facilityId)
      if (entry) next.set(facilityId, { ...entry, [field]: value })
      return next
    })
  }

  const handleSubmit = async () => {
    if (!selectedGroupId || selected.size === 0) return
    setSubmitting(true)
    try {
      await bulkCreateResortFacilities(resortId, selectedGroupId, {
        facilities: Array.from(selected.values()),
      })
      toast.success(`${selected.size} facilit${selected.size === 1 ? "y" : "ies"} added.`)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add facilities.")
    } finally {
      setSubmitting(false)
    }
  }

  const allAlreadyAdded =
    groupFacilities.length > 0 && groupFacilities.every((f) => assignedIds.includes(f.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {step === 1
              ? "Select Facility Group"
              : `Add Facilities${selectedGroup ? ` — ${selectedGroup.name}` : ""}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose which facility group to add facilities to."
              : "Select platform facilities to include. Customize the display details for each."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: group selection ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="wizard_group">Facility Group</FieldLabel>
              <select
                id="wizard_group"
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value ? Number(e.target.value) : "")
                  setSelected(new Map())
                }}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                <option value="">Select a facility group</option>
                {resortFacilityGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>

            {selectedGroup?.description && (
              <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {selectedGroup.description}
              </p>
            )}

            <DialogFooter>
              <Button disabled={!selectedGroupId} onClick={() => setStep(2)}>
                Next <ChevronRightIcon className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 2: facility selection + customise ── */}
        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto">
              {facilitiesLoading ? (
                <div className="flex justify-center py-16"><Spinner className="size-5" /></div>
              ) : groupFacilities.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No platform facilities found for this group.
                </p>
              ) : allAlreadyAdded ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  All facilities in this group have already been added.
                </p>
              ) : (
                <div className="flex flex-col gap-5 pb-2">
                  {/* Toggle grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {groupFacilities.map((f) => {
                      const isAdded = assignedIds.includes(f.id)
                      const isSelected = selected.has(f.id)
                      return (
                        <button
                          key={f.id}
                          type="button"
                          disabled={isAdded}
                          onClick={() => toggleFacility(f)}
                          className={[
                            "flex flex-col gap-1 rounded-xl border p-3 text-left text-sm transition-colors",
                            isAdded
                              ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                              : isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {f.type}
                            </span>
                            <div
                              className={[
                                "flex size-5 shrink-0 items-center justify-center rounded-full",
                                isAdded
                                  ? "bg-muted-foreground/20"
                                  : isSelected
                                    ? "bg-primary text-white"
                                    : "border border-muted-foreground/30",
                              ].join(" ")}
                            >
                              {(isAdded || isSelected) && <CheckIcon className="size-3" />}
                            </div>
                          </div>
                          <span className={["font-medium leading-tight", isAdded ? "text-muted-foreground" : ""].join(" ")}>
                            {f.name}
                          </span>
                          {isAdded && (
                            <span className="text-[10px] text-muted-foreground">Already added</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Customise panel for selected facilities */}
                  {selected.size > 0 && (
                    <div className="flex flex-col gap-3 border-t pt-4">
                      <p className="text-sm font-medium text-foreground">
                        Customize Selected ({selected.size})
                      </p>
                      {Array.from(selected.values()).map((sf) => {
                        const platform = groupFacilities.find((f) => f.id === sf.facility_id)
                        return (
                          <div key={sf.facility_id} className="flex flex-col gap-3 rounded-lg border p-3">
                            <span className="text-sm font-medium">{platform?.name}</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Display Name</label>
                                <Input
                                  value={sf.name}
                                  onChange={(e) => updateField(sf.facility_id, "name", e.target.value)}
                                  placeholder="Custom name"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Value</label>
                                <Input
                                  value={sf.value}
                                  onChange={(e) => updateField(sf.facility_id, "value", e.target.value)}
                                  placeholder="e.g. 24/7, Free, Included"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Icon</label>
                                <Input
                                  value={sf.icon}
                                  onChange={(e) => updateField(sf.facility_id, "icon", e.target.value)}
                                  placeholder="icon-pool"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Description</label>
                                <Input
                                  value={sf.description}
                                  onChange={(e) => updateField(sf.facility_id, "description", e.target.value)}
                                  placeholder="Short description"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t pt-4">
              {!preselectedGroupId && (
                <Button variant="outline" onClick={() => { setStep(1); setSelected(new Map()) }}>
                  <ChevronLeftIcon className="size-4" /> Back
                </Button>
              )}
              <Button disabled={selected.size === 0 || submitting} onClick={handleSubmit}>
                {submitting && <Spinner className="size-4" />}
                {submitting
                  ? "Adding..."
                  : `Add ${selected.size > 0 ? selected.size : ""} Facilit${selected.size === 1 ? "y" : "ies"}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
