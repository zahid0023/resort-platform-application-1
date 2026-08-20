"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { Button } from "@resort/shadcn-ui"
import { CircleCheck } from "lucide-react"
import { toast } from "sonner"
import { platformFacilitiesService, type PlatformFacilitySummary } from "@/services/platform-facilities"
import { FacilityPicker } from "./resort-facility-group-facility-picker"

export interface ResortFacilityGroupAddFacilitiesStepProps {
  resortId: number
  /** the platform group this resort group was linked from at creation, if any — determines whether there's anything to bulk-pick from */
  platformGroupId: number | ""
  step: 2 | 3
  onStepChange: (step: 2 | 3) => void
  onOpenChange: (open: boolean) => void
  onSaved?: () => void | Promise<void>
  /** Facilities already created for this group in this dialog session — owned by the parent since
   * it also owns the create-facility dialog that produces them. */
  addedFacilityIds: Set<number>
  /** Selecting a platform facility opens the full create-facility dialog for it (owned by the parent). */
  onSelectFacility: (f: PlatformFacilitySummary) => void
}

export function ResortFacilityGroupAddFacilitiesStep({
  resortId,
  platformGroupId,
  step,
  onStepChange,
  onOpenChange,
  onSaved,
  addedFacilityIds,
  onSelectFacility,
}: ResortFacilityGroupAddFacilitiesStepProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [platformFacilities, setPlatformFacilities] = useState<PlatformFacilitySummary[]>([])
  const [platformFacilitiesLoading, setPlatformFacilitiesLoading] = useState(false)

  async function finishAndClose() {
    onOpenChange(false)
    await onSaved?.()
  }

  async function loadPlatformFacilities(platformGroupIdArg: number) {
    setPlatformFacilitiesLoading(true)
    try {
      const res = await platformFacilitiesService.list({
        facilityGroupId: platformGroupIdArg,
        size: 50,
        sort_by: "sortOrder",
        facilityScopeCodes: ["RESORT"],
      })
      setPlatformFacilities(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatformFacilitiesLoading(false)
    }
  }

  function handleWantsFacilities() {
    if (platformGroupId) {
      onStepChange(3)
      loadPlatformFacilities(Number(platformGroupId))
    } else {
      onOpenChange(false)
      router.push(`/resorts/${resortId}/facilities`)
    }
  }

  if (step === 2) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center text-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
            <CircleCheck className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h3 className="text-base font-semibold">{t("resortFacilityGroup.createdTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("resortFacilityGroup.createdAsk")}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={finishAndClose}>
            {t("resortFacilityGroup.addFacilitiesSkip")}
          </Button>
          <Button type="button" onClick={handleWantsFacilities}>
            {t("resortFacilityGroup.addFacilitiesYes")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <FacilityPicker
          facilities={platformFacilities}
          loading={platformFacilitiesLoading}
          addedIds={addedFacilityIds}
          onSelect={onSelectFacility}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-6 py-4 border-t shrink-0">
        <span className="text-xs text-muted-foreground">
          {addedFacilityIds.size > 0 && t("resortFacilityGroup.facilitiesAdded", { count: addedFacilityIds.size })}
        </span>
        <Button type="button" onClick={finishAndClose} className="gap-1.5">
          {t("resortFacilityGroup.addFacilitiesDone")}
        </Button>
      </div>
    </div>
  )
}
