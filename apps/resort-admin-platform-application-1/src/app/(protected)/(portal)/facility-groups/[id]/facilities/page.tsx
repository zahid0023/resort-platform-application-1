"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { FacilityDialog } from "@/components/facilities/facility-dialog"
import { FacilityCard } from "@/components/facilities/facility-card"
import { LucideIconRenderer } from "ui-blocks"
import {
  listFacilities,
  getFacility,
  deleteFacility,
  type FacilitySummary,
  type Facility,
  type FacilityListResponse,
} from "@/services/facilities"
import {
  getFacilityGroup,
  type FacilityGroup,
} from "@/services/facility-groups"

export default function GroupFacilitiesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const groupId = Number(id)

  const [group, setGroup] = useState<FacilityGroup | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)
  const [data, setData] = useState<FacilityListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)

  useEffect(() => {
    if (!groupId) return
    setGroupLoading(true)
    getFacilityGroup(groupId)
      .then((res) => setGroup(res.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load group."))
      .finally(() => setGroupLoading(false))
  }, [groupId])

  const fetchList = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      setData(await listFacilities({ page, size: 10, facility_group_id: groupId, sort_by: "id", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.")
    } finally {
      setLoading(false)
    }
  }, [groupId, page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleEdit = async (row: FacilitySummary) => {
    try {
      const res = await getFacility(row.id)
      setEditing(res.data)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteFacility(id)
      toast.success("Facility deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.")
    }
  }

  const iconColor = group?.icon_meta?.color as string | undefined
  const iconName = group?.icon_type === "LUCIDE" ? group.icon_value : undefined

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2"
        onClick={() => router.push("/facility-groups")}
      >
        <ArrowLeftIcon />
        Back to Facilities
      </Button>

      {groupLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-6" /></div>
      ) : group ? (
        <Card className="p-6 shadow-card">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-primary"
              style={iconColor ? {
                background: `linear-gradient(135deg, ${iconColor}, ${iconColor}cc)`,
                boxShadow: `0 8px 32px -8px ${iconColor}80`,
              } : undefined}
            >
              <LucideIconRenderer name={iconName} className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{group.name}</h1>
                <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{group.code}</Badge>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span>{data ? `${data.total_elements} ${data.total_elements === 1 ? "facility" : "facilities"}` : "—"}</span>
                </div>
                <span>Sort order: {group.sort_order}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Facility group not found.</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Facilities</h2>
          <p className="text-sm text-muted-foreground">Facilities in this group.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} disabled={!group}>
          <PlusIcon />New Facility
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">No facilities yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map(row => (
            <FacilityCard key={row.id} data={row} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage(p => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facilityGroupId={groupId}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
