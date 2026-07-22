"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BedDouble, Check, ChevronDown, Cigarette, Minus, PawPrint, Pencil, Plus, X } from "lucide-react"
import {
  resortRoomCategoriesService,
  type ResortRoomCategoryMeta,
} from "@/services/resort-room-categories"
import { UnitPickerDialog } from "@/components/units/unit-picker-dialog"

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

function to12h(h24: number): { h12: string; ampm: "AM" | "PM" } {
  if (h24 === 0) return { h12: "12", ampm: "AM" }
  if (h24 < 12) return { h12: String(h24).padStart(2, "0"), ampm: "AM" }
  if (h24 === 12) return { h12: "12", ampm: "PM" }
  return { h12: String(h24 - 12).padStart(2, "0"), ampm: "PM" }
}

function to24h(h12: string, ampm: "AM" | "PM"): string {
  const n = parseInt(h12, 10)
  if (ampm === "AM") return String(n === 12 ? 0 : n).padStart(2, "0")
  return String(n === 12 ? 12 : n + 12).padStart(2, "0")
}

function formatTime(t: string): string {
  const [hh, mm] = t.split(":")
  const h = parseInt(hh ?? "0", 10)
  const ampm = h < 12 ? "AM" : "PM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mm ?? "00"} ${ampm}`
}

function TimeHHMM({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const [rawHH, rawMM] = (value || "").split(":")
  const h24 = parseInt(rawHH ?? "0", 10) || 0
  const mm = rawMM?.padStart(2, "0") ?? "00"
  const { h12, ampm } = to12h(h24)

  return (
    <div className="flex items-center gap-1.5">
      <Select value={h12} onValueChange={(h) => onChange(`${to24h(h, ampm)}:${mm}`)} disabled={disabled}>
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS_12.map((h) => <SelectItem key={h} value={h} className="font-mono">{h}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground font-semibold select-none">:</span>
      <Select value={mm} onValueChange={(m) => onChange(`${to24h(h12, ampm)}:${m}`)} disabled={disabled}>
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((m) => <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex rounded-md border overflow-hidden text-xs font-medium">
        {(["AM", "PM"] as const).map((period, i) => (
          <button key={period} type="button" disabled={disabled}
            onClick={() => onChange(`${to24h(h12, period)}:${mm}`)}
            className={`px-2.5 py-1.5 transition-colors disabled:cursor-default ${i > 0 ? "border-l" : ""} ${
              ampm === period ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  )
}

function PolicyCard({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50 ${
        value ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      {value && (
        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={`text-xs font-semibold leading-tight ${value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
    </button>
  )
}

function Counter({ label, value, onChange, disabled, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; disabled: boolean; min?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-xs font-medium shrink-0">{label}</Label>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0"
          disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0"
          disabled={disabled} onClick={() => onChange(value + 1)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

interface LocalState {
  max_adults: number
  max_children: number
  max_infants: number
  max_occupancy: number
  room_size: string
  room_size_unit_id: number | null
  room_size_unit_symbol: string | null
  bedroom_count: string
  bathroom_count: string
  default_check_in_time: string
  default_check_out_time: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
  minimum_stay_nights: string
  maximum_stay_nights: string
}

function metaToLocal(meta: ResortRoomCategoryMeta): LocalState {
  return {
    max_adults: meta.max_adults,
    max_children: meta.max_children,
    max_infants: meta.max_infants,
    max_occupancy: meta.max_occupancy,
    room_size: meta.room_size != null ? String(meta.room_size) : "",
    room_size_unit_id: meta.room_size_unit?.id ?? null,
    room_size_unit_symbol: meta.room_size_unit?.symbol ?? null,
    bedroom_count: meta.bedroom_count != null ? String(meta.bedroom_count) : "",
    bathroom_count: meta.bathroom_count != null ? String(meta.bathroom_count) : "",
    default_check_in_time: meta.default_check_in_time ?? "",
    default_check_out_time: meta.default_check_out_time ?? "",
    is_extra_bed_allowed: meta.is_extra_bed_allowed,
    max_extra_beds: meta.max_extra_beds,
    is_smoking_allowed: meta.is_smoking_allowed,
    is_pets_allowed: meta.is_pets_allowed,
    minimum_stay_nights: meta.minimum_stay_nights != null ? String(meta.minimum_stay_nights) : "",
    maximum_stay_nights: meta.maximum_stay_nights != null ? String(meta.maximum_stay_nights) : "",
  }
}

export interface ResortRoomCategoryMetaSectionProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
  initialMeta?: ResortRoomCategoryMeta
}

export function ResortRoomCategoryMetaSection({ resortId, resortRoomCategoryId, open, initialMeta }: ResortRoomCategoryMetaSectionProps) {
  const [meta, setMeta] = useState<ResortRoomCategoryMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState<LocalState>({
    max_adults: 2, max_children: 0, max_infants: 0, max_occupancy: 2,
    room_size: "", room_size_unit_id: null, room_size_unit_symbol: null,
    bedroom_count: "", bathroom_count: "",
    default_check_in_time: "", default_check_out_time: "",
    is_extra_bed_allowed: false, max_extra_beds: 0,
    is_smoking_allowed: false, is_pets_allowed: false,
    minimum_stay_nights: "", maximum_stay_nights: "",
  })
  const [saving, setSaving] = useState(false)
  const [unitPickerOpen, setUnitPickerOpen] = useState(false)

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true
      if (initialMeta) {
        setMeta(initialMeta)
      } else {
        loadMeta()
      }
    }
    if (!open) {
      loadedRef.current = false
      setMeta(null)
      setEditing(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMeta() {
    setLoading(true)
    try {
      const res = await resortRoomCategoriesService.getMeta(resortId, resortRoomCategoryId)
      setMeta(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit() {
    if (meta) setLocal(metaToLocal(meta))
    setEditing(true)
  }

  function patch(p: Partial<LocalState>) {
    setLocal((prev) => ({ ...prev, ...p }))
  }

  async function save() {
    setSaving(true)
    try {
      const adults = Number(local.max_adults) || 1
      const children = Number(local.max_children) || 0
      const infants = Number(local.max_infants) || 0
      const occupancy = Number(local.max_occupancy) || 1
      if (occupancy < adults + children + infants) {
        toast.error("Max occupancy must be ≥ adults + children + infants.")
        setSaving(false)
        return
      }
      await resortRoomCategoriesService.updateMeta(resortId, resortRoomCategoryId, {
        max_adults: adults,
        max_children: children,
        max_infants: infants,
        max_occupancy: occupancy,
        room_size: local.room_size.trim() ? Number(local.room_size) : null,
        room_size_unit_id: local.room_size_unit_id ?? null,
        bedroom_count: local.bedroom_count.trim() ? Number(local.bedroom_count) : null,
        bathroom_count: local.bathroom_count.trim() ? Number(local.bathroom_count) : null,
        default_check_in_time: local.default_check_in_time || null,
        default_check_out_time: local.default_check_out_time || null,
        is_extra_bed_allowed: local.is_extra_bed_allowed,
        max_extra_beds: Number(local.max_extra_beds) || 0,
        is_smoking_allowed: local.is_smoking_allowed,
        is_pets_allowed: local.is_pets_allowed,
        minimum_stay_nights: local.minimum_stay_nights.trim() ? Number(local.minimum_stay_nights) : null,
        maximum_stay_nights: local.maximum_stay_nights.trim() ? Number(local.maximum_stay_nights) : null,
      })
      toast.success("Room details updated.")
      setEditing(false)
      loadMeta()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !meta) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Room Details</h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5 gap-1.5" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5 gap-1.5"
              onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button type="button" size="sm" className="h-7 text-xs px-2.5 gap-1.5" onClick={save} disabled={saving}>
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-5">

          {/* Occupancy */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Occupancy</p>
            {editing ? (
              <div className="space-y-3">
                <Counter label="Max Adults"   value={local.max_adults}   onChange={(v) => patch({ max_adults: v })}   disabled={false} min={1} />
                <Counter label="Max Children" value={local.max_children} onChange={(v) => patch({ max_children: v })} disabled={false} />
                <Counter label="Max Infants"  value={local.max_infants}  onChange={(v) => patch({ max_infants: v })}  disabled={false} />
                <Counter label="Max Occupancy" value={local.max_occupancy} onChange={(v) => patch({ max_occupancy: v })} disabled={false} min={1} />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Adults",    value: meta?.max_adults   ?? "—" },
                  { label: "Children",  value: meta?.max_children ?? "—" },
                  { label: "Infants",   value: meta?.max_infants  ?? "—" },
                  { label: "Max",       value: meta?.max_occupancy ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded-lg bg-muted/60 py-2.5">
                    <span className="text-base font-bold tabular-nums leading-none">{value}</span>
                    <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Details */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room</p>
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Room Size</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={0} step="0.01"
                      value={local.room_size}
                      onChange={(e) => patch({ room_size: e.target.value })}
                      placeholder="e.g. 32"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" className="shrink-0 gap-1.5 font-normal min-w-[100px] justify-between"
                      onClick={() => setUnitPickerOpen(true)}>
                      <span className={local.room_size_unit_symbol ? "" : "text-muted-foreground"}>
                        {local.room_size_unit_symbol ?? "Unit"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Bedrooms</Label>
                    <Input type="number" min={0} value={local.bedroom_count} onChange={(e) => patch({ bedroom_count: e.target.value })} placeholder="—" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Bathrooms</Label>
                    <Input type="number" min={0} value={local.bathroom_count} onChange={(e) => patch({ bathroom_count: e.target.value })} placeholder="—" />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Size</p>
                  <p className="font-medium tabular-nums">
                    {meta?.room_size != null ? `${meta.room_size}${meta.room_size_unit ? ` ${meta.room_size_unit.symbol}` : ""}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Bedrooms</p>
                  <p className="font-medium tabular-nums">{meta?.bedroom_count ?? "—"}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Bathrooms</p>
                  <p className="font-medium tabular-nums">{meta?.bathroom_count ?? "—"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Check-in / Check-out */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Check-in / Check-out</p>
            {editing ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-medium shrink-0">Check-in</Label>
                  <TimeHHMM value={local.default_check_in_time} onChange={(v) => patch({ default_check_in_time: v })} disabled={false} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-medium shrink-0">Check-out</Label>
                  <TimeHHMM value={local.default_check_out_time} onChange={(v) => patch({ default_check_out_time: v })} disabled={false} />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border/50 bg-muted/20 divide-y divide-border/40 text-xs overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-mono font-semibold">{meta?.default_check_in_time ? formatTime(meta.default_check_in_time) : "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-mono font-semibold">{meta?.default_check_out_time ? formatTime(meta.default_check_out_time) : "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Policies</p>
            {editing ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <PolicyCard icon={BedDouble} label="Extra Bed" value={local.is_extra_bed_allowed} onChange={(v) => patch({ is_extra_bed_allowed: v })} disabled={false} />
                  <PolicyCard icon={Cigarette} label="Smoking" value={local.is_smoking_allowed} onChange={(v) => patch({ is_smoking_allowed: v })} disabled={false} />
                  <PolicyCard icon={PawPrint} label="Pets" value={local.is_pets_allowed} onChange={(v) => patch({ is_pets_allowed: v })} disabled={false} />
                </div>
                {local.is_extra_bed_allowed && (
                  <Counter label="Max Extra Beds" value={local.max_extra_beds} onChange={(v) => patch({ max_extra_beds: v })} disabled={false} />
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {!meta?.is_extra_bed_allowed && !meta?.is_smoking_allowed && !meta?.is_pets_allowed ? (
                  <span className="text-[11px] text-muted-foreground/50 italic">No policies assigned</span>
                ) : (
                  <>
                    {meta?.is_extra_bed_allowed && (
                      <div className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium border-primary/30 bg-primary/10 text-primary">
                        <BedDouble className="h-3 w-3" />
                        {meta.max_extra_beds > 0 ? `Extra Bed ×${meta.max_extra_beds}` : "Extra Bed"}
                      </div>
                    )}
                    {meta?.is_smoking_allowed && (
                      <div className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium border-primary/30 bg-primary/10 text-primary">
                        <Cigarette className="h-3 w-3" />
                        Smoking
                      </div>
                    )}
                    {meta?.is_pets_allowed && (
                      <div className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium border-primary/30 bg-primary/10 text-primary">
                        <PawPrint className="h-3 w-3" />
                        Pets
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stay Duration */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stay Duration</p>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Min Nights</Label>
                  <Input type="number" min={1} value={local.minimum_stay_nights} onChange={(e) => patch({ minimum_stay_nights: e.target.value })} placeholder="—" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Max Nights</Label>
                  <Input type="number" min={1} value={local.maximum_stay_nights} onChange={(e) => patch({ maximum_stay_nights: e.target.value })} placeholder="—" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Min Nights</p>
                  <p className="font-medium tabular-nums">{meta?.minimum_stay_nights ?? "—"}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Max Nights</p>
                  <p className="font-medium tabular-nums">{meta?.maximum_stay_nights ?? "—"}</p>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      <UnitPickerDialog
        open={unitPickerOpen}
        onOpenChange={setUnitPickerOpen}
        selectedId={local.room_size_unit_id ?? undefined}
        onSelect={(u) => {
          patch({ room_size_unit_id: u.id, room_size_unit_symbol: u.symbol })
          setUnitPickerOpen(false)
        }}
      />
    </div>
  )
}
