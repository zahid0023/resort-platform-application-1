import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pencil, Plus, X } from "lucide-react"
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
import { assignScope, unassignScope } from "@/services/facility-groups"
import type { FacilityScope } from "@/services/facility-scopes"
import { toast } from "sonner"
import type { FacilityGroupDialogMode, FacilityGroupFormState, ScopeAssignment } from "./types"

export interface FacilityGroupScopeAssignmentsProps {
  mode: FacilityGroupDialogMode
  form: FacilityGroupFormState
  onFormChange: (patch: Partial<FacilityGroupFormState>) => void
  facilityGroupId?: number
  availableScopes: FacilityScope[]
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function FacilityGroupScopeAssignments({
  mode,
  form,
  onFormChange,
  facilityGroupId,
  availableScopes,
  onSaved,
  editing,
  onEditingChange,
  open,
}: FacilityGroupScopeAssignmentsProps) {
  const { t } = useTranslation()
  const [busyScopeIds, setBusyScopeIds] = useState<Set<number>>(new Set())
  const [pendingUnassign, setPendingUnassign] = useState<ScopeAssignment | null>(null)

  useEffect(() => {
    if (!open) setBusyScopeIds(new Set())
  }, [open])

  function setScopeBusy(id: number, busy: boolean) {
    setBusyScopeIds((prev) => {
      const n = new Set(prev)
      busy ? n.add(id) : n.delete(id)
      return n
    })
  }

  function toggleScopeId(scopeId: number, selected: boolean) {
    const next = selected
      ? form.scope_ids.filter((id) => id !== scopeId)
      : [...form.scope_ids, scopeId]
    onFormChange({ scope_ids: next })
  }

  async function doAssign(scopeId: number) {
    if (facilityGroupId == null) return
    setScopeBusy(scopeId, true)
    try {
      await assignScope(facilityGroupId, scopeId)
      const scope = availableScopes.find((s) => s.id === scopeId)
      if (scope) {
        onFormChange({
          scope_assignments: [
            ...form.scope_assignments,
            { facility_scope_id: scope.id, code: scope.code, sort_order: scope.sort_order, locales: scope.locales },
          ],
        })
      }
      toast.success(t("facilityGroup.scopeAssigned"))
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setScopeBusy(scopeId, false)
    }
  }

  async function confirmUnassign() {
    if (!pendingUnassign || facilityGroupId == null) return
    const scopeId = pendingUnassign.facility_scope_id
    setPendingUnassign(null)
    setScopeBusy(scopeId, true)
    try {
      await unassignScope(facilityGroupId, scopeId)
      onFormChange({
        scope_assignments: form.scope_assignments.filter((a) => a.facility_scope_id !== scopeId),
      })
      toast.success(t("facilityGroup.scopeUnassigned"))
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setScopeBusy(scopeId, false)
    }
  }

  const assignedIds = new Set(form.scope_assignments.map((a) => a.facility_scope_id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("facilityGroup.scopes")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEditingChange(true)}
            className="h-7 text-xs px-2.5 gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEditingChange(false)}
            className="h-7 text-xs px-2.5 gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> {t("common.close")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">

          {/* CREATE mode — select scope_ids (buffered, no API) */}
          {mode === "create" && (
            availableScopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableScopes.map((scope) => {
                  const selected = form.scope_ids.includes(scope.id)
                  const scopeName = scope.locales[0]?.name
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => toggleScopeId(scope.id, selected)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-accent",
                      ].join(" ")}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      <span className="font-mono">{scope.code}</span>
                      {scopeName && <span className="text-[10px] opacity-70">({scopeName})</span>}
                    </button>
                  )
                })}
              </div>
            )
          )}

          {/* VIEW mode — show assigned scope badges */}
          {mode !== "create" && !editing && (
            form.scope_assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.scope_assignments.map((a) => {
                  const scopeName = a.locales[0]?.name
                  return (
                    <Badge key={a.facility_scope_id} variant="secondary" className="gap-1.5 font-mono text-xs">
                      {a.code}
                      {scopeName && <span className="font-sans font-normal opacity-70">({scopeName})</span>}
                    </Badge>
                  )
                })}
              </div>
            )
          )}

          {/* EDIT mode — toggle assign/unassign per scope */}
          {mode !== "create" && editing && (
            availableScopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableScopes.map((scope) => {
                  const isAssigned = assignedIds.has(scope.id)
                  const busy = busyScopeIds.has(scope.id)
                  const scopeName = scope.locales[0]?.name
                  const assignment = form.scope_assignments.find((a) => a.facility_scope_id === scope.id)
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      disabled={busy}
                      onClick={() => isAssigned ? setPendingUnassign(assignment!) : doAssign(scope.id)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                        isAssigned
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-input bg-background text-foreground hover:bg-accent",
                      ].join(" ")}
                    >
                      {isAssigned ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      <span className="font-mono">{scope.code}</span>
                      {scopeName && <span className="text-[10px] opacity-70">({scopeName})</span>}
                    </button>
                  )
                })}
              </div>
            )
          )}

        </CardContent>
      </Card>

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
    </div>
  )
}
