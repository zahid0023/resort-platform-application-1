"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ResortCard } from "@/components/resorts/resort-card"
import { ResortDialog } from "@/components/resorts/resort-dialog"
import { LogoutButton } from "@/components/auth/logout-button"
import { listResorts, type ResortSummary, type ResortListResponse } from "@/services/resorts"

export default function ResortsPage() {
  const router = useRouter()
  const [data, setData] = useState<ResortListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listResorts({ page, size: 12, sort_by: "id", sort_dir: "ASC" }))
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

  const total = data?.total_elements ?? 0

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ── */}
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-30">
        <div className="container flex items-center justify-between py-5">

          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Resort Platform
            </span>
          </div>

            <LogoutButton className="text-muted-foreground hover:text-foreground" />

        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto px-6 pb-12 pt-16 md:px-12">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          My portfolio
        </p>

        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
          Your collection of{" "}
          <em className="font-normal italic text-muted-foreground">extraordinary</em>{" "}
          places.
        </h1>
        
        {!loading && (
          <p className="mt-5 text-sm text-muted-foreground">
            {total} {total === 1 ? "destination" : "destinations"} in your portfolio.
          </p>
        )}
      </section>

      {/* ── Grid ── */}
      <section className="mx-auto px-6 pb-24 md:px-12">
        {loading ? (
          <div className="flex justify-center py-32">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Existing resort cards */}
            {data?.data.map((resort, i) => (
              <ResortCard key={resort.id} data={resort} index={i} onOpen={handleOpen} />
            ))}

            {/* Add new — always last */}
            <button
              onClick={() => setDialogOpen(true)}
              className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card/40 transition-all duration-500 hover:border-foreground/30 hover:bg-card hover:shadow-lg hover:cursor-pointer"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-all duration-500 group-hover:border-foreground/20 group-hover:bg-foreground/5 group-hover:text-foreground group-hover:scale-110">
                  <PlusIcon className="size-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground">Add a new resort</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Begin a new chapter in your portfolio.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Pagination ── */}
        {data && data.total_pages > 1 && (
          <div className="mt-12 flex items-center justify-between text-xs text-muted-foreground">
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
      </section>

      <ResortDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchList}
      />
    </div>
  )
}
