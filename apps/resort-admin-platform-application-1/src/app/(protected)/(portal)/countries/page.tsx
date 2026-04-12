"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CountryDialog } from "@/components/countries/country-dialog"
import { CountryCard } from "@/components/countries/country-card"
import {
  listCountries, getCountry, deleteCountry,
  type CountrySummary, type Country, type CountryListResponse,
} from "@/services/countries"

export default function CountriesPage() {
  const [data, setData] = useState<CountryListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Country | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try { setData(await listCountries({ page, size: 10, sort_by: "name", sort_dir: "ASC" })) }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to load countries.") }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleEdit = async (row: CountrySummary) => {
    try { const res = await getCountry(row.id); setEditing(res.data); setDialogOpen(true) }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to load country.") }
  }

  const handleDelete = async (id: number) => {
    try { await deleteCountry(id); toast.success("Country deleted."); fetchList() }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete country.") }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Countries</h1>
          <p className="text-sm text-muted-foreground">Manage countries available in the resort application.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <PlusIcon />New Country
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">No countries found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map(row => (
            <CountryCard key={row.id} data={row} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage(p => p - 1)}><ChevronLeftIcon /></Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}><ChevronRightIcon /></Button>
          </div>
        </div>
      )}

      <CountryDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchList} />
    </div>
  )
}
