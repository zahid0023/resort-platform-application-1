"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeftIcon, ChevronRightIcon, LogOutIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ResortCard } from "@/components/resorts/resort-card"
import { listResorts, type ResortSummary, type ResortListResponse } from "@/services/resorts"
import { logout } from "@/services/auth"

export default function ResortsPage() {
  const router = useRouter()
  const [data, setData] = useState<ResortListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listResorts({ page, size: 10, sort_by: "id", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load resorts.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleOpen = (resort: ResortSummary) => {
    router.push(`/resorts/${resort.id}/dashboard`)
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Resorts</h1>
          <p className="text-sm text-muted-foreground">All resorts accessible to your account.</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOutIcon />
          Log out
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((resort) => (
            <ResortCard key={resort.id} data={resort} onOpen={handleOpen} />
          ))}

          <button
            onClick={() => router.push("/resorts/create-new-resort")}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary min-h-[80px]"
          >
            <PlusIcon className="size-5" />
            <span className="font-medium">New Resort</span>
          </button>
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total
          </span>
          <div className="flex gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!data.has_previous}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
