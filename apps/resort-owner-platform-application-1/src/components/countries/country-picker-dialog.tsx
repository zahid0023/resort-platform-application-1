"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, Loader2, Search } from "lucide-react"
import { Badge, Dialog, DialogContent, DialogTitle, Input } from "@resort/shadcn-ui"
import { countriesService, type Country } from "@/services/countries"
import { Pagination } from "@/components/shared/pagination"

const PAGE_SIZE = 20

export interface CountryPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId?: number
  onSelect: (country: Country) => void
}

export function CountryPickerDialog({ open, onOpenChange, selectedId, onSelect }: CountryPickerDialogProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const isFirstSearchRender = useRef(true)

  useEffect(() => {
    if (open) {
      setSearch("")
      setPage(0)
      isFirstSearchRender.current = true
      load(0, "")
    } else {
      setCountries([])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return }
    if (!open) return
    setPage(0)
    const timer = setTimeout(() => load(0, search), 350)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load(p: number, q: string) {
    setLoading(true)
    try {
      const res = await countriesService.list({
        page: p,
        size: PAGE_SIZE,
        sort_by: "name",
        name: q.trim() || undefined,
      })
      setCountries(res.data)
      setPage(p)
      setTotalPages(res.total_pages)
      setTotalElements(res.total_elements)
      setHasNext(res.has_next)
      setHasPrevious(res.has_previous)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(country: Country) {
    onSelect(country)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">Select Country</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Select Country</p>
              {totalElements > 0 && (
                <p className="text-xs text-muted-foreground">{totalElements} countries</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-8 h-8 text-sm w-full"
              autoFocus
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl border-dashed">
              No countries found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {countries.map((c) => {
                const isSelected = c.id === selectedId
                const name = c.locale?.name ?? c.code
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/30"
                        : "bg-card hover:border-sky-500/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-sky-500/20 text-sky-500" : "bg-muted text-muted-foreground"
                      }`}>
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] px-1.5 py-0 h-4 ${
                              isSelected ? "border-sky-500/30 text-sky-600 dark:text-sky-400" : ""
                            }`}
                          >
                            {c.code}
                          </Badge>
                          {c.iso3_code && (
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                              {c.iso3_code}
                            </Badge>
                          )}
                          {c.phone_code && (
                            <span className="text-[10px] text-muted-foreground">{c.phone_code}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-5 py-3 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={(p) => load(p, search)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
