"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Layers, Loader2, Minus, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@resort/shadcn-ui"
import { Badge } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Card, CardContent } from "@resort/shadcn-ui"
import type { FacilityScope } from "@/services/facility-scopes"

export interface FacilityGroupScopeAssignmentsProps {
  scopes: FacilityScope[]
  assignedIds: Set<number>
  loading: boolean
  onAssign: (scope: FacilityScope) => Promise<void>
  onUnassign: (scope: FacilityScope) => Promise<void>
}

// Purely presentational — the scope catalog, assigned ids, and the actual assign/unassign API calls
// all live in the parent FacilityGroupDialog (see its `scopeCatalog`/`assignedScopeIds` state), since
// Radix TabsContent unmounts this component whenever the "scopes" tab isn't selected; keeping the
// loaded data here would mean re-fetching from scratch on every reselect. Only in-flight/confirm UI
// state (which scope is busy, which is pending an unassign confirmation) lives locally — losing that
// on a tab switch is fine.
export function FacilityGroupScopeAssignments({ scopes, assignedIds, loading, onAssign, onUnassign }: FacilityGroupScopeAssignmentsProps) {
  const { t } = useTranslation()
  const [busyScopeIds, setBusyScopeIds] = useState<Set<number>>(new Set())
  const [pendingUnassign, setPendingUnassign] = useState<FacilityScope | null>(null)

  function setBusy(scopeId: number, busy: boolean) {
    setBusyScopeIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(scopeId)
      else next.delete(scopeId)
      return next
    })
  }

  async function handleAssignClick(scope: FacilityScope) {
    setBusy(scope.id, true)
    await onAssign(scope)
    setBusy(scope.id, false)
  }

  async function confirmUnassign() {
    if (!pendingUnassign) return
    const scope = pendingUnassign
    setPendingUnassign(null)
    setBusy(scope.id, true)
    await onUnassign(scope)
    setBusy(scope.id, false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (scopes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scopes.map((scope) => {
          const assigned = assignedIds.has(scope.id)
          const busy = busyScopeIds.has(scope.id)
          return (
            <Card key={scope.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    assigned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{scope.locale?.name ?? scope.code}</p>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1">
                    {scope.code}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={assigned ? "outline" : "default"}
                  disabled={busy}
                  onClick={() => (assigned ? setPendingUnassign(scope) : handleAssignClick(scope))}
                  className="gap-1.5 shrink-0"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : assigned ? (
                    <Minus className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {assigned ? t("common.unassign") : t("common.assign")}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!pendingUnassign} onOpenChange={(o) => !o && setPendingUnassign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facilityGroup.scopeUnassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facilityGroup.scopeUnassignDesc", { code: pendingUnassign?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassign}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
