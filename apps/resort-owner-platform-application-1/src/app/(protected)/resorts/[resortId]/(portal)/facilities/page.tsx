"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, SparklesIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ResortFacilityGroupDialog } from "@/components/resort-facility-group/resort-facility-group-dialog"
import { ResortFacilitiesWizard } from "@/components/resort-facility/resort-facilities-wizard"
import {
  listResortFacilityGroups,
  getResortFacilityGroup,
  deleteResortFacilityGroup,
  type ResortFacilityGroupSummary,
} from "@/services/resort-facility-groups"
import {
  listResortFacilities,
  deleteResortFacility,
  type ResortFacilitySummary,
} from "@/services/resort-facilities"

async function fetchAllPages<T>(
  fetcher: (page: number, size: number) => Promise<{ data: T[]; has_next: boolean }>,
  size = 50
): Promise<T[]> {
  const results: T[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const res = await fetcher(page, size)
    results.push(...res.data)
    hasNext = res.has_next
    page++
  }
  return results
}

function FacilityTile({
  facility,
  onDelete,
}: {
  facility: ResortFacilitySummary
  onDelete: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className={[
      "relative flex flex-col gap-1 rounded-xl border p-3 text-sm",
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
    ].join(" ")}>
      <div className="flex items-start justify-between gap-1">
        {facility.value ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            {facility.value}
          </span>
        ) : <span />}
        {confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Sure?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex size-5 items-center justify-center rounded bg-destructive text-[10px] text-white"
            >
              {deleting ? <Spinner className="size-3" /> : "✓"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex size-5 items-center justify-center rounded border text-[10px]"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-destructive"
          >
            <Trash2Icon className="size-3" />
          </button>
        )}
      </div>
      <span className="font-medium leading-tight text-foreground">{facility.name}</span>
      {facility.icon && (
        <span className="font-mono text-[10px] text-muted-foreground">{facility.icon}</span>
      )}
    </div>
  )
}

export default function FacilitiesPage() {
  const { resortId } = useParams<{ resortId: string }>()

  const [groups, setGroups] = useState<ResortFacilityGroupSummary[]>([])
  const [facilitiesByGroup, setFacilitiesByGroup] = useState<Record<number, ResortFacilitySummary[]>>({})
  const [loading, setLoading] = useState(true)

  // Group dialog (add / edit)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ResortFacilityGroupSummary | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null)

  // Wizard (add facilities to a group)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardGroupId, setWizardGroupId] = useState<number | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const allGroups = await fetchAllPages<ResortFacilityGroupSummary>(
        (page, size) => listResortFacilityGroups(resortId, { page, size, sort_by: "sortOrder", sort_dir: "ASC" })
      )
      setGroups(allGroups)

      const facilityResults = await Promise.all(
        allGroups.map((g) =>
          fetchAllPages<ResortFacilitySummary>(
            (page, size) => listResortFacilities(resortId, g.id, { page, size, sort_by: "name", sort_dir: "ASC" })
          ).then((data) => ({ groupId: g.id, data }))
        )
      )

      const map: Record<number, ResortFacilitySummary[]> = {}
      for (const { groupId, data } of facilityResults) map[groupId] = data
      setFacilitiesByGroup(map)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load facilities.")
    } finally {
      setLoading(false)
    }
  }, [resortId])

  useEffect(() => { load() }, [load])

  const handleEditGroup = async (group: ResortFacilityGroupSummary) => {
    try {
      const res = await getResortFacilityGroup(resortId, group.id)
      setEditingGroup(res.data)
      setGroupDialogOpen(true)
    } catch {
      toast.error("Failed to load group.")
    }
  }

  const handleDeleteGroup = async (id: number) => {
    setDeletingGroupId(id)
    try {
      await deleteResortFacilityGroup(resortId, id)
      toast.success("Facility group removed.")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.")
    } finally {
      setDeletingGroupId(null)
    }
  }

  const handleDeleteFacility = async (groupId: number, facilityId: number) => {
    await deleteResortFacility(resortId, groupId, facilityId)
    toast.success("Facility removed.")
    load()
  }

  const openWizard = (groupId?: number) => {
    setWizardGroupId(groupId)
    setWizardOpen(true)
  }

  const assignedFacilityIdsByGroup = Object.fromEntries(
    Object.entries(facilitiesByGroup).map(([gId, facilities]) => [
      Number(gId),
      facilities.map((f) => f.facility_id),
    ])
  )

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Facilities</h1>
          <p className="text-sm text-muted-foreground">Manage facility groups and their facilities for this resort.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openWizard()}>
            <PlusIcon />Add Facilities
          </Button>
          <Button onClick={() => { setEditingGroup(null); setGroupDialogOpen(true) }}>
            <PlusIcon />Add Facility Group
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <p>No facility groups added yet.</p>
          <Button onClick={() => { setEditingGroup(null); setGroupDialogOpen(true) }}>
            <PlusIcon />Add Facility Group
          </Button>
        </div>
      )}

      {/* Group sections */}
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const facilities = facilitiesByGroup[group.id] ?? []
          const isDeleting = deletingGroupId === group.id

          return (
            <div key={group.id} className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
              {/* Group header */}
              <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.name}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {facilities.length} facilit{facilities.length === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  {group.description && (
                    <span className="truncate text-xs text-muted-foreground">{group.description}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => openWizard(group.id)}>
                    <PlusIcon className="size-3" />Add Facilities
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleEditGroup(group)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    {isDeleting ? <Spinner className="size-3" /> : <Trash2Icon />}
                  </Button>
                </div>
              </div>

              {/* Facilities grid */}
              {facilities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                  <p>No facilities added yet.</p>
                  <Button size="sm" variant="outline" onClick={() => openWizard(group.id)}>
                    <PlusIcon className="size-3" />Add Facilities
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {facilities.map((f) => (
                    <FacilityTile
                      key={f.id}
                      facility={f}
                      onDelete={() => handleDeleteFacility(group.id, f.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Group dialog */}
      <ResortFacilityGroupDialog
        resortId={resortId}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editing={editingGroup}
        onSuccess={load}
        assignedGroupIds={groups.map((g) => g.facility_group_id)}
      />

      {/* Add facilities wizard */}
      <ResortFacilitiesWizard
        resortId={resortId}
        resortFacilityGroups={groups}
        assignedFacilityIdsByGroup={assignedFacilityIdsByGroup}
        preselectedGroupId={wizardGroupId}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={load}
      />
    </div>
  )
}
