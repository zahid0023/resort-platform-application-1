"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui"
import { toast } from "sonner"
import { ArrowRight, Loader2, Lock, Plus, Sparkles } from "lucide-react"
import {
  resortRoomCategoryPricesService,
  type ResortRoomCategoryPrice,
  type PriceTypeCode,
} from "@/services/resort-room-category-prices"
import { ResortRoomCategoryPriceCard } from "./resort-room-category-price-card"
import { ResortRoomCategoryPriceDialog } from "./resort-room-category-price-dialog"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResortRoomCategoryPricesSectionProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ResortRoomCategoryPricesSection({
  resortId,
  resortRoomCategoryId,
  open,
}: ResortRoomCategoryPricesSectionProps) {
  const [prices, setPrices] = useState<ResortRoomCategoryPrice[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [dialogTypeCode, setDialogTypeCode] = useState<PriceTypeCode | undefined>()
  const [dialogCurrencyId, setDialogCurrencyId] = useState<number | undefined>()
  const [editingPrice, setEditingPrice] = useState<ResortRoomCategoryPrice | undefined>()

  const [deleteTarget, setDeleteTarget] = useState<ResortRoomCategoryPrice | null>(null)

  // ── Load prices ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true
      loadPrices()
    }
    if (!open) {
      loadedRef.current = false
      setPrices([])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPrices() {
    setLoading(true)
    try {
      const res = await resortRoomCategoryPricesService.list(resortId, resortRoomCategoryId, {
        page: 0,
        size: 50,
        sort_by: "priority",
        sort_dir: "DESC",
      })
      setPrices(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const basePrices = prices.filter((p) => p.price_type.code === "BAS")
  const wkdPrices = prices.filter((p) => p.price_type.code === "WKD")
  const wkePrices = prices.filter((p) => p.price_type.code === "WKE")
  const holPrices = prices.filter((p) => p.price_type.code === "HOL")
  const spePrices = prices.filter((p) => p.price_type.code === "SPE")

  const hasBase = basePrices.length > 0
  const hasWeekday = wkdPrices.length > 0
  const hasWeekend = wkePrices.length > 0
  // The currency used by the first base price — pre-filled for WKD/WKE to keep them aligned
  const primaryCurrencyId = basePrices[0]?.currency.id

  // ── Dialog triggers ──────────────────────────────────────────────────────

  function openCreate(code: PriceTypeCode, suggestedCurrencyId?: number) {
    setDialogMode("create")
    setDialogTypeCode(code)
    setDialogCurrencyId(suggestedCurrencyId)
    setEditingPrice(undefined)
    setDialogOpen(true)
  }

  function openEdit(price: ResortRoomCategoryPrice) {
    setDialogMode("edit")
    setDialogTypeCode(undefined)
    setDialogCurrencyId(undefined)
    setEditingPrice(price)
    setDialogOpen(true)
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortRoomCategoryPricesService.remove(resortId, resortRoomCategoryId, deleteTarget.id)
      toast.success("Price rule deleted.")
      setDeleteTarget(null)
      loadPrices()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading && prices.length === 0) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ══ SETUP WIZARD — no prices at all ══════════════════════════════════ */}
      {!loading && prices.length === 0 && (
        <SetupWizard onStart={() => openCreate("BAS")} />
      )}

      {/* ══ PRICES VIEW — at least one price exists ═══════════════════════════ */}
      {prices.length > 0 && (
        <>
          {/* ── Core Rates (BAS / WKD / WKE) ─────────────────────────────── */}
          <PriceGroup label="Core Rates">
            {/* If base is somehow missing, surface an add prompt */}
            {!hasBase && (
              <SuggestionCard
                code="BAS"
                label="Base Rate"
                desc="Your base rate is missing. Add one to configure weekday and weekend pricing."
                colorClass="border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                badgeClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                onClick={() => openCreate("BAS")}
              />
            )}

            {basePrices.map((p) => (
              <ResortRoomCategoryPriceCard key={p.id} price={p} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
            {wkdPrices.map((p) => (
              <ResortRoomCategoryPriceCard key={p.id} price={p} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
            {wkePrices.map((p) => (
              <ResortRoomCategoryPriceCard key={p.id} price={p} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}

            {/* Suggestions for missing weekday / weekend rates */}
            {hasBase && !hasWeekday && (
              <SuggestionCard
                code="WKD"
                label="Add Weekday Rate"
                desc="Apply a different price for your configured weekdays."
                colorClass="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                badgeClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                onClick={() => openCreate("WKD", primaryCurrencyId)}
              />
            )}
            {hasBase && hasWeekday && !hasWeekend && (
              <SuggestionCard
                code="WKE"
                label="Add Weekend Rate"
                desc="Apply a different price for your configured weekend days."
                colorClass="border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400"
                badgeClass="bg-violet-500/15 text-violet-600 dark:text-violet-400"
                onClick={() => openCreate("WKE", primaryCurrencyId)}
              />
            )}
          </PriceGroup>

          {/* ── Holiday Rates ─────────────────────────────────────────────── */}
          <PriceGroup
            label="Holiday Rates"
            action={
              hasBase && hasWeekday && hasWeekend ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={() => openCreate("HOL")}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              ) : undefined
            }
          >
            {holPrices.length === 0 ? (
              <p className="rounded-xl border border-dashed py-5 text-center text-xs text-muted-foreground">
                {hasBase && hasWeekday && hasWeekend
                  ? "No holiday rates defined."
                  : "Set base, weekday, and weekend rates first."}
              </p>
            ) : (
              holPrices.map((p) => (
                <ResortRoomCategoryPriceCard key={p.id} price={p} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))
            )}
          </PriceGroup>

          {/* ── Special Rates ─────────────────────────────────────────────── */}
          <PriceGroup
            label="Special Rates"
            action={
              hasBase && hasWeekday && hasWeekend ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={() => openCreate("SPE")}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              ) : undefined
            }
          >
            {spePrices.length === 0 ? (
              <p className="rounded-xl border border-dashed py-5 text-center text-xs text-muted-foreground">
                {hasBase && hasWeekday && hasWeekend
                  ? "No special rates defined."
                  : "Set base, weekday, and weekend rates first."}
              </p>
            ) : (
              spePrices.map((p) => (
                <ResortRoomCategoryPriceCard key={p.id} price={p} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))
            )}
          </PriceGroup>
        </>
      )}

      {/* ── Nested dialogs ──────────────────────────────────────────────────── */}
      <ResortRoomCategoryPriceDialog
        resortId={resortId}
        resortRoomCategoryId={resortRoomCategoryId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        price={editingPrice}
        priceTypeCode={dialogTypeCode}
        suggestedCurrencyId={dialogCurrencyId}
        onSaved={loadPrices}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this price rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The price rule will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriceGroup({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface SuggestionCardProps {
  code: string
  label: string
  desc: string
  colorClass: string
  badgeClass: string
  onClick: () => void
}

function SuggestionCard({ code, label, desc, colorClass, badgeClass, onClick }: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-xl border-2 border-dashed p-3.5 text-left transition-all hover:border-solid hover:shadow-sm ${colorClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${badgeClass}`}>
            {code}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{label}</p>
            <p className="mt-0.5 text-xs opacity-70">{desc}</p>
          </div>
        </div>
        <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${badgeClass}`}>
          <Plus className="h-4 w-4" />
        </div>
      </div>
    </button>
  )
}

function SetupWizard({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Set up pricing</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Start with a base rate, then configure weekday and weekend pricing.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {/* Step 1 — active, clickable */}
        <button
          type="button"
          onClick={onStart}
          className="group flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-background px-4 py-3 text-left transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-md"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Base Rate</p>
            <p className="text-xs text-muted-foreground">Your default rack rate — start here.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Step 2 — locked */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-3 opacity-60">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Weekday Rate</p>
            <p className="text-xs text-muted-foreground">A different price for your configured weekdays.</p>
          </div>
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>

        {/* Step 3 — locked */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-3 opacity-60">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Weekend Rate</p>
            <p className="text-xs text-muted-foreground">A different price for your configured weekend days.</p>
          </div>
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        After the core rates are set, you can add Holiday and Special rates.
      </p>
    </div>
  )
}
